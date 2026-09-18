import json
import ollama
from functools import lru_cache
from backend.schemas.job_requirements import JobRequirements

MODEL_NAME = "llama3:latest"

@lru_cache(maxsize=128)
def extract_job_requirements(
    job_description: str,
) -> JobRequirements:

    prompt = f"""
You are an expert job-description analysis system.

Read the job description below and extract all relevant requirements.

Return ONLY a valid JSON object.

The JSON object MUST contain exactly these fields:

- technical_skills
- soft_skills
- experience_requirements
- education_requirements
- languages

Each field MUST contain a JSON array of objects.

Each object MUST contain:

- name
- importance

"importance" MUST be either:
- "required"
- "preferred"

IMPORTANT:

A requirement is "required" when the job description clearly presents
it as mandatory.

Examples of required language:
- required
- must have
- must
- mandatory
- minimum
- essential
- candidates need
- candidates should have

A requirement is "preferred" when the job description describes it
as desirable but not mandatory.

Examples:
- preferred
- nice to have
- plus
- bonus
- desirable
- advantageous
- would be an advantage

If the job description does not clearly indicate whether something is
required or preferred, use "required" only when the wording strongly
suggests it is necessary. Otherwise use "preferred".

CATEGORY RULES:

technical_skills:
- programming languages
- frameworks
- libraries
- databases
- cloud technologies
- AI/ML technologies
- tools
- platforms

soft_skills:
- communication
- teamwork
- leadership
- problem solving
- analytical ability
- similar interpersonal skills

experience_requirements:
- years of experience
- professional experience
- domain experience
- other explicit experience requirements

education_requirements:
- degrees
- fields of study
- certifications explicitly required or preferred

languages:
- human/spoken languages only
- never put programming languages here

Do not invent information.

Example:

{{
    "technical_skills": [
        {{
            "name": "Python",
            "importance": "required"
        }},
        {{
            "name": "Kubernetes",
            "importance": "preferred"
        }}
    ],
    "soft_skills": [
        {{
            "name": "communication",
            "importance": "required"
        }}
    ],
    "experience_requirements": [
        {{
            "name": "2 years of software development experience",
            "importance": "required"
        }}
    ],
    "education_requirements": [
        {{
            "name": "Bachelor's degree in Computer Science",
            "importance": "preferred"
        }}
    ],
    "languages": [
        {{
            "name": "English",
            "importance": "required"
        }}
    ]
}}

JOB DESCRIPTION:
----------------
{job_description}
----------------

Return ONLY the JSON object.
"""

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        format="json",
        options={
            "temperature": 0,
        },
    )

    raw_response = response["message"]["content"]

    print("\n===== RAW LLM RESPONSE =====")
    print(raw_response)
    print("============================\n")

    try:
        parsed_response = json.loads(raw_response)

    except json.JSONDecodeError as error:
        raise ValueError(
            "The LLM did not return valid JSON."
        ) from error

    requirements = JobRequirements.model_validate(
        parsed_response
    )

    print("\n===== PARSED REQUIREMENTS =====")
    print(requirements)
    print("===============================\n")

    return requirements