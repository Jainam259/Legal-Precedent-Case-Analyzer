import fitz
import re
from collections import Counter


# ===========================
# Extract Text From PDF
# ===========================

def extract_text_from_pdf(pdf_path):

    document = fitz.open(pdf_path)

    text = ""

    for page in document:
        text += page.get_text()

    document.close()

    return text


# ===========================
# Find Dates
# ===========================

def extract_dates(text):

    pattern = r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"

    dates = re.findall(pattern, text)

    return list(set(dates))


# ===========================
# Detect Acts
# ===========================

def detect_acts(text):

    acts = []

    known_acts = [

        "Indian Penal Code",
        "IPC",
        "BNS",
        "Code of Criminal Procedure",
        "CrPC",
        "BNSS",
        "Indian Evidence Act",
        "BSA",
        "Consumer Protection Act",
        "RERA",
        "Constitution of India",
        "Contract Act",
        "Companies Act",

    ]

    lower = text.lower()

    for act in known_acts:

        if act.lower() in lower:
            acts.append(act)

    return acts


# ===========================
# Detect Sections
# ===========================

def detect_sections(text):

    pattern = r"(Section|Sec\.?)\s+\d+[A-Za-z]?"

    sections = re.findall(pattern, text, flags=re.IGNORECASE)

    return list(set(sections))


# ===========================
# Summary
# ===========================

def generate_summary(text):

    paragraphs = text.split("\n")

    paragraphs = [p.strip() for p in paragraphs if len(p.strip()) > 30]

    if len(paragraphs) >= 5:
        return "\n\n".join(paragraphs[:5])

    return text[:1200]


# ===========================
# Case Story
# ===========================

def generate_story(text):

    story = text.replace("\n", " ")

    return story[:1800]


# ===========================
# Parties
# ===========================

def detect_parties(text):

    plaintiff = ""

    defendant = ""

    for line in text.split("\n"):

        if "plaintiff" in line.lower():

            plaintiff = line

        if "defendant" in line.lower():

            defendant = line

    return {

        "plaintiff": plaintiff,

        "defendant": defendant

    }


# ===========================
# Timeline
# ===========================

def create_timeline(dates):

    timeline = []

    for d in dates:

        timeline.append({

            "date": d,

            "event": "Mentioned in document"

        })

    return timeline


# ===========================
# Evidence
# ===========================

def detect_evidence(text):

    evidence = []

    keywords = [

        "agreement",
        "receipt",
        "notice",
        "invoice",
        "certificate",
        "affidavit",
        "photo",
        "email"

    ]

    lower = text.lower()

    for k in keywords:

        if k in lower:

            evidence.append(k.title())

    return evidence


# ===========================
# Missing Documents
# ===========================

def missing_documents(evidence):

    required = [

        "Agreement",
        "Receipt",
        "Notice"

    ]

    missing = []

    for item in required:

        if item not in evidence:

            missing.append(item)

    return missing


# ===========================
# Confidence
# ===========================

def confidence_score(text):

    score = 60

    if len(text) > 5000:
        score += 15

    if len(text) > 10000:
        score += 10

    if "agreement" in text.lower():
        score += 5

    if "section" in text.lower():
        score += 5

    return min(score, 99)


# ===========================
# Main Function
# ===========================

def analyze_case_pdf(pdf_path):

    text = extract_text_from_pdf(pdf_path)

    summary = generate_summary(text)

    story = generate_story(text)

    dates = extract_dates(text)

    parties = detect_parties(text)

    acts = detect_acts(text)

    sections = detect_sections(text)

    timeline = create_timeline(dates)

    evidence = detect_evidence(text)

    missing = missing_documents(evidence)

    confidence = confidence_score(text)

    return {

        "summary": summary,

        "case_story": story,

        "important_dates": dates,

        "parties": parties,

        "acts": acts,

        "sections": sections,

        "timeline": timeline,

        "evidence": evidence,

        "missing_documents": missing,

        "confidence": confidence,

    }