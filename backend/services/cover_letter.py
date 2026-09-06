import json

import ollama

from backend.schemas.cover_letter import CoverLetter
from backend.schemas.job_requirements import JobRequirements


MODEL_NAME = "llama3:latest"


def generate_cover_letter(
    candidate,
    job,
    requirements: JobRequirements,
) -> CoverLetter:

    candidate_data = {
        "name": candidate.name,
        "summary": candidate.summary,
        "skills": candidate.skills,
        "experience": candidate.experience,
        "education": candidate.education,
        "projects": candidate.projects,
        "languages": candidate.languages,
    }

    requirements_data = {
        "technical_skills": [
            requirement.model_dump()
            for requirement in requirements.technical_skills
        ],
        "soft_skills": [
            requirement.model_dump()
            for requirement in requirements.soft_skills
        ],
        "experience_requirements": [
            requirement.model_dump()
            for requirement in requirements.experience_requirements
        ],
        "education_requirements": [
            requirement.model_dump()
            for requirement in requirements.education_requirements
        ],
        "languages": [
            requirement.model_dump()
            for requirement in requirements.languages
        ],
    }

    job_data = {
        "title": job.title,
        "company": job.company,
        "url": job.url,
        "requirements": requirements_data,
    }

    prompt = f"""
You are a professional job application assistant.

Write a concise and professional cover letter for the candidate
based ONLY on information contained in the candidate profile.

IMPORTANT RULES:

- Never invent information.
- Never invent skills.
- Never invent achievements.
- Never invent technologies.
- Never invent years of experience.
- Never invent qualifications.
- Never claim experience the candidate does not have.
- Only use facts from the candidate profile.
- Use the job requirements to determine which existing
  experience and skills should be emphasized.
- Do not mention missing skills.
- Do not use markdown.

The cover letter should be approximately 250-350 words.

CANDIDATE PROFILE:
------------------
{json.dumps(candidate_data, ensure_ascii=False, indent=2)}
------------------

TARGET JOB:
------------
{json.dumps(job_data, ensure_ascii=False, indent=2)}
------------

Return ONLY valid JSON.

The JSON MUST contain exactly these fields:

{{
    "subject": "Application for [Job Title]",
    "greeting": "Dear Hiring Manager,",
    "body": "The complete cover letter body.",
    "closing": "Kind regards,\\n[Candidate Name]"
}}

The body should contain 3-4 professional paragraphs.

Return ONLY the JSON object.
"""

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional job application "
                    "assistant. Always follow the requested "
                    "JSON format exactly."
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

    print("\n===== RAW COVER LETTER RESPONSE =====")
    print(raw_response)
    print("=====================================\n")

    try:

        parsed_response = json.loads(
            raw_response
        )

    except json.JSONDecodeError as error:

        print(
            "\n===== INVALID COVER LETTER JSON ====="
        )
        print(raw_response)
        print("======================================\n")

        raise ValueError(
            "The LLM returned invalid JSON."
        ) from error

    return CoverLetter.model_validate(
        parsed_response
    )