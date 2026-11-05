from google import genai
from google.genai import types
from django.conf import settings

client = genai.Client(
    api_key=settings.GEMINI_API_KEY
)

MODEL_NAME = "gemini-3.5-flash-lite"


LEGAL_PROMPT = """
You are an expert Indian Legal AI Assistant.

Answer the user's legal question.

Rules:

- Use Indian Law.
- Explain in simple English.
- Mention Acts and Sections whenever applicable.
- If punishment exists, mention it.
- If procedure exists, explain step-by-step.
- If the question is unrelated to law, answer normally.
- Format the answer clearly using headings and bullet points.

Question:

{question}
"""


def legal_ai_search(question):

    prompt = LEGAL_PROMPT.format(
        question=question
    )

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.3,
            top_p=0.9,
            max_output_tokens=3000,
        ),
    )

    return response.text.strip()