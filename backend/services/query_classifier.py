import json
import ollama

MODEL_NAME = "llama3:latest"

VALID_CATEGORIES = {
    "summary",
    "skills",
    "experience",
    "education",
    "project",
    "languages",
}


def classify_candidate_query(question: str) -> list[str]:
    """
    Determine which candidate profile categories are relevant
    to a user's question.
    """

    prompt = f"""
You classify questions about a job candidate.

Choose one or more relevant categories from ONLY this list:

- summary
- skills
- experience
- education
- project
- languages

Rules:

1. Questions about work experience should include "experience".
2. Questions about technical abilities or technologies should
   include "skills".
3. Questions about projects should include "project".
4. Questions about education or degrees should include "education".
5. Questions about languages should include "languages".
6. Questions about AI experience may include:
   "experience", "project", and "skills".
7. Questions asking for a general overview may include "summary"
   and other relevant categories.
8. Never return categories outside the allowed list.

Return ONLY valid JSON in this format:

{{
    "categories": ["education"]
}}

QUESTION:

{question}
"""

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You classify candidate questions into "
                    "relevant profile categories. "
                    "Always return valid JSON."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        format="json",
        options={
            "temperature": 0,
        },
    )

    raw_response = response["message"]["content"]

    try:
        parsed_response = json.loads(raw_response)
    except json.JSONDecodeError:
        return []

    categories = parsed_response.get("categories", [])

    if not isinstance(categories, list):
        return []

    valid_categories = [
        category
        for category in categories
        if category in VALID_CATEGORIES
    ]

    return valid_categories