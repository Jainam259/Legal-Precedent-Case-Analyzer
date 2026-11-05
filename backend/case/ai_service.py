import os
import re
import json
import time
import logging
import fitz
from typing import List

from google import genai
from google.genai import types

from django.conf import settings

logger = logging.getLogger(__name__)


# ==========================================================
# Gemini Client
# ==========================================================

client = genai.Client(
    api_key=settings.GEMINI_API_KEY
)

MODEL_NAME = "gemini-3.5-flash-lite"


# ==========================================================
# PDF Extraction
# ==========================================================

def extract_pdf_text(pdf_path: str):

    """
    Reads every page of the uploaded PDF.
    Returns one large string.
    """

    document = fitz.open(pdf_path)

    pages = []

    for page in document:

        text = page.get_text("text")

        if text.strip():

            pages.append(text)

    document.close()

    return "\n\n".join(pages)


# ==========================================================
# Clean Text
# ==========================================================

def clean_text(text: str):

    text = text.replace("\x00", "")

    text = text.replace("\t", " ")

    text = text.replace("\r", " ")

    while "  " in text:
        text = text.replace("  ", " ")

    return text.strip()


# ==========================================================
# Split Long Document
# ==========================================================

def split_into_chunks(
    text,
    chunk_size=12000,
    overlap=500,
):

    """
    Splits very long PDF into overlapping chunks.

    Supports
    20 pages
    50 pages
    100 pages
    500 pages
    """

    if not text:
        return []

    chunks = []

    start = 0

    while start < len(text):

        end = start + chunk_size

        chunks.append(text[start:end])

        start += chunk_size - overlap

    return chunks


# ==========================================================
# Extract + Split
# ==========================================================

def prepare_document(pdf_path):

    text = extract_pdf_text(pdf_path)

    text = clean_text(text)

    chunks = split_into_chunks(text)

    return text, chunks


# ==========================================================
# Regex-based date extraction (deterministic, doc-specific)
# ==========================================================
# The LLM is unreliable at consistently surfacing every date, and the
# original prompt schema didn't even ask for "important_dates", so that
# field was always coming back empty. Extract dates directly from the
# document text instead of depending entirely on the model.

DATE_PATTERNS = [
    r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
    r"\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|"
    r"August|September|October|November|December)\s+\d{4}\b",
    r"\b(?:January|February|March|April|May|June|July|August|September|"
    r"October|November|December)\s+\d{1,2},?\s+\d{4}\b",
]


def extract_important_dates(text: str):

    if not text:
        return []

    found = []

    for pattern in DATE_PATTERNS:
        found.extend(re.findall(pattern, text, flags=re.IGNORECASE))

    # De-duplicate while preserving order of first appearance.
    seen = set()
    unique_dates = []

    for d in found:
        key = d.strip()
        if key and key.lower() not in seen:
            seen.add(key.lower())
            unique_dates.append(key)

    return unique_dates


# ==========================================================
# JSON Parser
# ==========================================================

def parse_json(response):

    """
    Gemini sometimes returns:

```json
    {...}
```

    Remove markdown safely.
    """

    response = (response or "").replace("```json", "")

    response = response.replace("```", "")

    response = response.strip()

    try:

        return json.loads(response)

    except Exception:

        # Try to recover a JSON object embedded in extra text (e.g. the
        # model added a stray sentence before/after the JSON block).
        match = re.search(r"\{.*\}", response, flags=re.DOTALL)

        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass

        return {

            "summary": response,

            "facts": [],

            "acts": [],

            "sections": [],

            "timeline": [],

            "evidence": [],

            "issues": [],

            "conclusion": response

        }
    # ==========================================================
# AI Prompt for Each Chunk
# ==========================================================

CHUNK_PROMPT = """
You are an experienced Indian Legal AI Assistant.

Analyze ONLY the following part of THIS SPECIFIC legal document.
Base every field strictly on what is actually written below — do not
reuse boilerplate or generic legal language, and do not invent facts
that are not present in the text.

Return ONLY valid JSON in exactly this shape:

{
    "summary":"",
    "facts":[],
    "acts":[],
    "sections":[],
    "dates":[],
    "timeline":[],
    "evidence":[],
    "issues":[],
    "parties":{
        "plaintiff":"",
        "defendant":""
    }
}

Rules:

1. Read the document carefully.
2. Identify important legal facts unique to this document.
3. Extract Acts actually named in the text.
4. Extract Sections actually named in the text.
5. Extract every date mentioned, in "dates".
6. Extract available evidence actually referenced in the text.
7. Identify plaintiff and defendant by name if stated.
8. If this part of the document contains no relevant information for a
   field, return an empty list/string for it rather than guessing.
9. Return ONLY JSON. Never explain anything outside JSON.

Document part:

{document}
"""


# ==========================================================
# Analyze One Chunk
# ==========================================================

def analyze_chunk(chunk, retries=2):

    prompt = CHUNK_PROMPT.format(
        document=chunk
    )

    last_error = None

    for attempt in range(retries + 1):

        try:

            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.15,
                    max_output_tokens=4000,
                ),
            )

            return parse_json(response.text)

        except Exception as e:

            last_error = e

            logger.warning(
                "Gemini chunk analysis failed (attempt %s/%s): %s",
                attempt + 1, retries + 1, e,
            )

            time.sleep(1.5 * (attempt + 1))

    # All retries exhausted — bubble the error up so the caller knows
    # this chunk genuinely failed instead of silently returning empty
    # data that looks like "nothing was found in the document".
    raise RuntimeError(f"Gemini analysis failed for a document chunk: {last_error}")


# ==========================================================
# Analyze All Chunks
# ==========================================================

def analyze_all_chunks(chunks):

    all_results = []

    failures = 0

    total = len(chunks)

    for index, chunk in enumerate(chunks):

        print(f"Analyzing chunk {index+1}/{total}")

        try:

            result = analyze_chunk(chunk)

            all_results.append(result)

        except Exception as e:

            failures += 1

            logger.error("Chunk %s/%s failed permanently: %s", index + 1, total, e)

            all_results.append({

                "summary": "",

                "facts": [],

                "acts": [],

                "sections": [],

                "dates": [],

                "timeline": [],

                "evidence": [],

                "issues": [],

                "parties": {
                    "plaintiff": "",
                    "defendant": ""
                }

            })

    return all_results, failures


# ==========================================================
# Merge AI Results
# ==========================================================

def merge_results(results):

    summaries = []

    facts = []

    acts = set()

    sections = set()

    dates = []

    timeline = []

    evidence = set()

    issues = set()

    plaintiff = ""

    defendant = ""

    for item in results:

        summaries.append(item.get("summary", ""))

        facts.extend(item.get("facts", []))

        acts.update(item.get("acts", []))

        sections.update(item.get("sections", []))

        dates.extend(item.get("dates", []))

        timeline.extend(item.get("timeline", []))

        evidence.update(item.get("evidence", []))

        issues.update(item.get("issues", []))

        parties = item.get("parties", {})

        if not plaintiff:

            plaintiff = parties.get("plaintiff", "")

        if not defendant:

            defendant = parties.get("defendant", "")

    return {

        "summary": "\n\n".join(s for s in summaries if s),

        "facts": list(dict.fromkeys(facts)),

        "acts": list(acts),

        "sections": list(sections),

        "dates": list(dict.fromkeys(dates)),

        "timeline": timeline,

        "evidence": list(evidence),

        "issues": list(issues),

        "parties": {

            "plaintiff": plaintiff,

            "defendant": defendant

        }

    }
# ==========================================================
# Final AI Report Prompt
# ==========================================================

FINAL_REPORT_PROMPT = """
You are India's best Senior Legal AI Assistant.

You have already analyzed every part of THIS SPECIFIC legal document.
Using ONLY the extracted information below, prepare a complete
professional legal report about THIS case. Do not fall back on
generic template language — every section must reflect the actual
facts, names, dates, acts and sections extracted below.

Extracted Information:

{analysis}

Return ONLY valid JSON in this format:

{{
    "executive_summary":"",
    "case_story":"",
    "main_points":[],
    "important_dates":[],
    "timeline":[],
    "legal_issues":[],
    "acts":[],
    "sections":[],
    "evidence":[],
    "missing_documents":[],
    "court_observations":"",
    "conclusion":"",
    "confidence":0
}}

Rules:

- Write professional English.
- Do NOT invent facts. Only use what appears in the extracted information.
- If something is missing, return an empty list/string for it.
- Keep executive summary between 200-400 words, specific to this case.
- Case story should explain the entire case from beginning to end, using
  the actual party names, acts, sections and dates provided above.
- "important_dates" must list every date given in the extracted
  information above (do not drop any).
- Conclusion should summarize the likely legal position for THIS case.
- "confidence" is a number from 0 to 99 reflecting how complete and
  specific the extracted information above actually is (a document with
  very little extracted text/facts should score low, e.g. under 40; a
  detailed, complete extraction should score higher). Compute it — do
  not default to a fixed number.
- Return ONLY JSON.
"""


# ==========================================================
# Generate Final Report
# ==========================================================

def generate_final_report(merged_result, retries=2):

    prompt = FINAL_REPORT_PROMPT.format(

        analysis=json.dumps(
            merged_result,
            indent=2
        )

    )

    last_error = None

    for attempt in range(retries + 1):

        try:

            response = client.models.generate_content(

                model=MODEL_NAME,

                contents=prompt,

                config=types.GenerateContentConfig(

                    temperature=0.2,

                    max_output_tokens=8000,

                ),

            )

            return parse_json(response.text)

        except Exception as e:

            last_error = e

            logger.warning(
                "Gemini final report failed (attempt %s/%s): %s",
                attempt + 1, retries + 1, e,
            )

            time.sleep(1.5 * (attempt + 1))

    raise RuntimeError(f"Gemini final report generation failed: {last_error}")


# ==========================================================
# Safe JSON Defaults
# ==========================================================

def normalize_report(report):

    defaults = {

        "executive_summary": "",

        "case_story": "",

        "main_points": [],

        "important_dates": [],

        "timeline": [],

        "legal_issues": [],

        "acts": [],

        "sections": [],

        "evidence": [],

        "missing_documents": [],

        "court_observations": "",

        "conclusion": "",

        "confidence": 0,

    }

    for key, value in defaults.items():

        report.setdefault(key, value)

    return report


# ==========================================================
# Deterministic Fallback (no external API needed)
# ==========================================================
# Used only if every Gemini call for this document fails (bad/expired
# key, quota exhausted, network issue, etc). This still produces a
# report that reflects THIS document's actual text instead of a
# generic/empty result, using simple keyword + regex extraction.

FALLBACK_ACTS = [
    "Indian Penal Code", "IPC", "BNS", "Code of Criminal Procedure",
    "CrPC", "BNSS", "Indian Evidence Act", "BSA",
    "Consumer Protection Act", "RERA", "Constitution of India",
    "Contract Act", "Companies Act",
]

FALLBACK_EVIDENCE_KEYWORDS = [
    "agreement", "receipt", "notice", "invoice", "certificate",
    "affidavit", "photo", "email",
]


def is_heading_like(line: str) -> bool:
    """
    True for caption/header lines (party names, court headers, citations)
    that are mostly uppercase and don't read like prose — these make for
    a choppy, unreadable summary if included as-is.
    """

    letters = [c for c in line if c.isalpha()]

    if len(letters) < 8:
        return False

    upper_ratio = sum(1 for c in letters if c.isupper()) / len(letters)

    return upper_ratio > 0.75


def smart_truncate(text: str, max_chars: int) -> str:
    """
    Truncates at the end of the last full sentence before max_chars,
    instead of cutting off mid-word/mid-sentence.
    """

    text = text.strip()

    if len(text) <= max_chars:
        return text

    window = text[:max_chars]

    cut = max(window.rfind(". "), window.rfind(".\n"), window.rfind('."'))

    if cut > max_chars * 0.4:
        return window[: cut + 1].strip()

    return window.strip() + "…"


def build_fallback_report(raw_text, dates):

    lower = raw_text.lower()

    acts = [a for a in FALLBACK_ACTS if a.lower() in lower]

    sections = list(set(re.findall(
        r"(?:Section|Sec\.?)\s+\d+[A-Za-z]?", raw_text, flags=re.IGNORECASE
    )))

    evidence = [k.title() for k in FALLBACK_EVIDENCE_KEYWORDS if k in lower]

    all_paragraphs = [p.strip() for p in raw_text.split("\n") if len(p.strip()) > 30]

    # Drop ALL-CAPS caption/header lines (party names, court headers) so the
    # summary reads like prose instead of a jumble of case captions.
    prose_paragraphs = [p for p in all_paragraphs if not is_heading_like(p)]

    if len(prose_paragraphs) >= 3:
        summary_source = "\n\n".join(prose_paragraphs)
    elif all_paragraphs:
        summary_source = "\n\n".join(all_paragraphs)
    else:
        summary_source = raw_text

    summary = smart_truncate(summary_source, 2200) if summary_source else \
        "No extractable text was found in this document."

    full_story_source = " ".join(
        p for p in (prose_paragraphs or all_paragraphs)
    ) if (prose_paragraphs or all_paragraphs) else raw_text.replace("\n", " ")

    story = smart_truncate(full_story_source, 6000) if full_story_source else \
        "No extractable text was found in this document."

    confidence = 40

    if len(raw_text) > 5000:
        confidence += 15
    if len(raw_text) > 10000:
        confidence += 10
    if acts:
        confidence += 10
    if sections:
        confidence += 5

    report = {
        "executive_summary": summary,
        "case_story": story,
        "main_points": [],
        "important_dates": dates,
        "timeline": [{"date": d, "event": "Mentioned in document"} for d in dates],
        "legal_issues": [],
        "acts": acts,
        "sections": sections,
        "evidence": evidence,
        "missing_documents": [
            item for item in ["Agreement", "Receipt", "Notice"] if item not in evidence
        ],
        "court_observations": "",
        "conclusion": "",
        "confidence": min(confidence, 99),
    }

    return report


# ==========================================================
# Main AI Pipeline
# ==========================================================

def analyze_case(pdf_path):
    """
    Complete pipeline:
    1. Read PDF
    2. Split into chunks
    3. Analyze each chunk
    4. Merge results
    5. Generate final AI report

    If the Gemini API is unavailable for this document (auth/quota/
    network failure) after retries, falls back to a deterministic,
    document-specific report instead of raising a 500 error or
    silently returning empty/generic data.
    """

    raw_text, chunks = prepare_document(pdf_path)

    doc_dates = extract_important_dates(raw_text)

    print(f"Total Chunks : {len(chunks)}")

    if not chunks:
        # No extractable text at all (e.g. a scanned/image-only PDF).
        report = build_fallback_report(raw_text, doc_dates)
        report["parties"] = {"plaintiff": "", "defendant": ""}
        return report

    try:

        chunk_results, failures = analyze_all_chunks(chunks)

        if failures == len(chunks):
            # Every single chunk failed to reach Gemini — treat this as a
            # full API outage for this document rather than reporting an
            # (incorrect) empty analysis.
            raise RuntimeError("All chunks failed AI analysis")

        merged = merge_results(chunk_results)

        # Prefer AI-extracted dates, but always include anything found by
        # direct regex extraction so nothing gets dropped.
        merged["dates"] = list(dict.fromkeys(merged.get("dates", []) + doc_dates))

        report = generate_final_report(merged)

        report = normalize_report(report)

        if not report.get("important_dates"):
            report["important_dates"] = merged.get("dates", [])

        report["parties"] = merged.get("parties", {})

        return report

    except Exception as e:

        logger.error("AI analysis pipeline failed, using fallback: %s", e)

        report = build_fallback_report(raw_text, doc_dates)

        report["parties"] = {"plaintiff": "", "defendant": ""}

        return report