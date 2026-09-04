import ollama
from backend.schemas.candidate import CandidateProfile


MODEL_NAME = "llama3:latest"


def create_candidate_profile(cv_text: str) -> CandidateProfile:
    prompt = f"""
You are an assistant that extracts structured candidate information from CVs.

Analyze the CV below and extract only information that is explicitly supported
by the CV.

Do not invent skills, experience, education, projects, or languages.

CV:
----------------
{cv_text}
----------------
"""

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        format=CandidateProfile.model_json_schema(),
    )

    profile = CandidateProfile.model_validate_json(
        response["message"]["content"]
    )

    return profile