import json

import ollama

from backend.schemas.cv_tailoring import TailoredCV
from backend.schemas.job_requirements import JobRequirements


MODEL_NAME = "llama3:latest"


def tailor_cv(
    candidate,
    requirements: JobRequirements,
) -> TailoredCV:

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

    prompt = f"""
You are an expert CV tailoring assistant.

Your job is to tailor a candidate's existing CV specifically toward
the target job.

The candidate information is factual source material.
The job requirements are the target.

==================================================
CRITICAL TRUTHFULNESS RULES
==================================================

1. NEVER invent information.

2. NEVER claim that the candidate has a skill that does not appear
   in the candidate profile.

3. NEVER invent work experience.

4. NEVER invent achievements, metrics, responsibilities, technologies,
   certifications or qualifications.

5. NEVER change company names, job titles, education institutions,
   degrees or project names.

6. You may rewrite existing descriptions to make relevant experience
   clearer and more concise.

7. You may reorder or select existing information based on relevance.

8. You may NOT create new factual claims.

==================================================
TAILORING RULES
==================================================

Prioritize requirements that:

1. Are marked as "required".
2. The candidate actually satisfies.
3. Can be supported by the candidate's experience or projects.

Use the candidate's existing experience and projects as evidence
for relevant job requirements.

For example:

If the job requires Python and the candidate has Python experience
at Skatteverket, emphasize that existing experience.

If the job requires Kubernetes but Kubernetes is not in the candidate
profile, DO NOT add Kubernetes to the CV.

For preferred requirements, include them only when supported by the
candidate's existing information.

==================================================
CANDIDATE PROFILE
==================================================

{json.dumps(candidate_data, ensure_ascii=False, indent=2)}

==================================================
JOB REQUIREMENTS
==================================================

{json.dumps(requirements_data, ensure_ascii=False, indent=2)}

==================================================
OUTPUT REQUIREMENTS
==================================================

Create a tailored CV using ONLY the candidate's existing information.

The result must contain:

1. professional_summary
   - A concise professional summary tailored to the job.
   - Emphasize the candidate's strongest relevant background.

2. skills_to_highlight
   - Include the candidate's existing skills that are most relevant
     to the target job.
   - Prioritize required job skills that the candidate actually has.
   - Do not include missing skills.

3. experience
   - Include the candidate's most relevant work experiences.
   - Preserve company and role exactly as provided.
   - Rewrite descriptions to emphasize relevant existing
     responsibilities and experience.

4. projects
   - Include the candidate's most relevant projects.
   - Preserve project names.
   - Rewrite descriptions to emphasize relevant existing
     technologies and experience.

The output should prioritize relevance while remaining completely
factually accurate.

Return ONLY valid JSON.

The JSON structure must be:

{{
    "professional_summary": "...",

    "skills_to_highlight": [
        {{
            "name": "...",
            "description": "..."
        }}
    ],

    "experience": [
        {{
            "company": "...",
            "role": "...",
            "description": "..."
        }}
    ],

    "projects": [
        {{
            "name": "...",
            "description": "..."
        }}
    ]
}}

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

    print("\n===== RAW CV TAILORING RESPONSE =====")
    print(raw_response)
    print("======================================\n")

    try:
        parsed_response = json.loads(raw_response)

    except json.JSONDecodeError as error:
        raise ValueError(
            "The LLM did not return valid JSON."
        ) from error

    return TailoredCV.model_validate(
        parsed_response
    )