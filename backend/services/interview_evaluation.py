import json

import ollama

from backend.schemas.interview_evaluation import (
    InterviewEvaluation,
)

MODEL_NAME = "llama3:latest"


def evaluate_interview_answer(
    question: str,
    answer: str,
    candidate,
    candidate_context: str,
    job,
    requirements,
    question_category: str | None = None,
    question_basis: str | None = None,
) -> InterviewEvaluation:

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

    category = question_category or "unknown"
    basis = question_basis or "unknown"

    prompt = f"""
You are evaluating a candidate's answer during a job interview.

QUESTION CATEGORY:
{category}

QUESTION BASIS:
{basis}

Evaluate the answer using four dimensions:

1. Relevance
Does the answer directly address the interview question?

2. Clarity
Is the answer structured, understandable, and specific?

3. Grounding
Is the answer consistent with the candidate's known
experience, projects, skills, and background?

4. Category-specific quality
Evaluate the dimension that is most relevant to the
question category.

CATEGORY-SPECIFIC EVALUATION:

For a technical question:
Evaluate technical depth, correctness, reasoning,
trade-offs, and understanding.

Label:
"Technical depth"

For a project question:
Evaluate understanding of the project, ownership,
technical decisions, challenges, and results.

Label:
"Project depth and ownership"

For a behavioral question:
Evaluate the quality of the example, actions taken,
reasoning, reflection, and outcome where available.

Label:
"Behavioral quality"

For a motivation question:
Evaluate alignment with the role, understanding of
the company/position, authenticity, and reasoning.

Label:
"Motivation and role alignment"

IMPORTANT EVALUATION RULES:

- Do not reward an answer simply because it sounds confident.
- Do not invent facts.
- If the candidate claims experience that is not supported
  by the candidate context, lower the grounding score.
- Do not penalize an answer for not mentioning information
  that the question did not ask about.
- Do not penalize the candidate for not providing metrics
  unless the question explicitly asks about:
  * measurable impact
  * scale
  * performance
  * business results
  * quantitative outcomes
- Never recommend "add more metrics" as a generic improvement.
- Never request metrics just because metrics could exist.
- Improvements must identify a specific missing element
  that is relevant to THIS question.
- A concise answer can receive a high score if it directly
  answers the question with relevant evidence.
- Distinguish between:
  * information that is missing but relevant
  * information that is simply optional
- Do not penalize candidates for not giving information
  that was not reasonably expected from the question.
- Keep feedback constructive.
- Do not make assumptions about what the candidate did.

For example, if the question asks:

"How did you ensure correctness of your Copilot agents?"

A useful improvement might be:

"Give a concrete example of a positive or negative test
and what issue it helped you detect."

Do NOT automatically say:

"Provide metrics."

Score every dimension from 1 to 10.

Calculate overall_score as your overall assessment.

Return ONLY valid JSON.

The JSON must have exactly this structure:

{{
    "overall_score": 8,
    "relevance_score": 9,
    "clarity_score": 8,
    "grounding_score": 9,
    "category_specific_score": 7,
    "category_specific_label": "Technical depth",
    "strengths": [
        "Strength 1"
    ],
    "improvements": [
        "Improvement 1"
    ],
    "feedback": "Concise overall feedback."
}}

INTERVIEW QUESTION:

{question}

CANDIDATE ANSWER:

{answer}

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

RELEVANT CANDIDATE CONTEXT:

{candidate_context}

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

Return ONLY the JSON object.
"""

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a rigorous but constructive job "
                    "interview evaluator. "
                    "Evaluate only the candidate's actual answer "
                    "against the supplied evidence and question. "
                    "Never invent facts. "
                    "Do not give generic feedback. "
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
            "The LLM returned invalid evaluation JSON."
        ) from error

    return InterviewEvaluation.model_validate(
        parsed_response
    )