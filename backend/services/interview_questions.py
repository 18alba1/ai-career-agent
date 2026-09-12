import json
import ollama

from backend.schemas.interview import (
    InterviewQuestionSet,
)
from backend.services.candidate_retrieval import (
    retrieve_candidate_chunks,
)

MODEL_NAME = "llama3:latest"


def generate_interview_questions(
    db,
    candidate,
    job,
    requirements,
    number_of_questions: int = 8,
) -> InterviewQuestionSet:

    retrieval_query = (
        f"Candidate experience, skills and projects relevant "
        f"to the role of {job.title} at {job.company}. "
        f"Job description: {job.description}"
    )

    candidate_chunks = retrieve_candidate_chunks(
        db=db,
        candidate_id=candidate.id,
        query=retrieval_query,
        top_k=2,
        categories=[
            "experience",
            "project",
            "skills",
            "education",
        ],
    )

    context = "\n\n".join(
        (
            f"[Source: {chunk.category}]\n"
            f"{chunk.text}"
        )
        for chunk in candidate_chunks
    )

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
You are an AI interview preparation assistant.

Generate interview questions for a candidate interviewing for
the target job.

Use ONLY the information provided in:
1. The candidate profile
2. The target job
3. The job requirements
4. The retrieved candidate context

The goal is to create realistic, specific interview questions
that would actually be useful in a job interview.

Generate exactly {number_of_questions} questions.

Create a balanced mixture of:
- technical
- project
- behavioral
- motivation

IMPORTANT QUESTION RULES:

1. Never invent candidate experience.

2. Never assume the candidate has performed an activity merely
   because the job requires it.

3. Never ask "How did you..." unless the candidate context
   explicitly indicates that the candidate has done it.

4. If a technology appears only in the job requirements and
   not in the candidate context, ask a knowledge-based question
   instead.

5. For technologies without demonstrated candidate experience,
   prefer wording such as:
   - "How would you approach..."
   - "What considerations would you take into account..."
   - "How would you explain..."

6. Behavioral questions must be grounded in demonstrated
   candidate experience OR clearly framed as hypothetical.

7. Do not invent specific events, achievements, problems,
   leadership situations, or teamwork situations.

8. Avoid combining many unrelated technologies into one question.
   Each technical question should test one main competency.

9. Avoid generic questions when a candidate-specific question
   can be created.

10. Project questions should refer to real projects or work
    explicitly present in the candidate context.

11. Motivation questions should relate to the target company,
    target role, and the candidate's actual background.

12. Questions should be answerable by the candidate without
    requiring knowledge that is completely unrelated to the job.

13. The "basis" field must describe what supports the question:
    - candidate_experience
    - candidate_project
    - candidate_skill
    - job_requirement
    - general

14. Use "candidate_experience" only when the candidate context
    explicitly describes that experience.

15. Use "candidate_project" only when the question is based on
    a project explicitly present in the candidate context.

16. Use "candidate_skill" when the question is based on a skill
    explicitly listed for the candidate.

17. Use "job_requirement" when the question tests something
    required or preferred by the target job but not demonstrated
    in the candidate context.

Return ONLY valid JSON.

The JSON must have exactly this structure:

{{
    "questions": [
        {{
            "category": "technical",
            "question": "Question text",
            "purpose": "What this question evaluates",
            "basis": "candidate_experience"
        }}
    ]
}}

CANDIDATE PROFILE:

{json.dumps(
    {
        "name": candidate.name,
        "summary": candidate.summary,
        "skills": candidate.skills,
        "experience": candidate.experience,
        "education": candidate.education,
        "projects": candidate.projects,
        "languages": candidate.languages,
    },
    ensure_ascii=False,
    indent=2,
)}

TARGET JOB:

{json.dumps(
    {
        "title": job.title,
        "company": job.company,
        "description": job.description,
    },
    ensure_ascii=False,
    indent=2,
)}

JOB REQUIREMENTS:

{json.dumps(
    requirements_data,
    ensure_ascii=False,
    indent=2,
)}

RETRIEVED CANDIDATE CONTEXT:

{context}

Return ONLY the JSON object.
"""

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You generate grounded, realistic, "
                    "job-specific interview questions. "
                    "Never invent candidate experience. "
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
    except json.JSONDecodeError as error:
        raise ValueError(
            "The LLM returned invalid JSON."
        ) from error

    return InterviewQuestionSet.model_validate(
        parsed_response
    )