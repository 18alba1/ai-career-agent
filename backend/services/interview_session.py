import json

import ollama

from backend.schemas.interview import InterviewQuestion
from backend.services.candidate_retrieval import (
    retrieve_candidate_chunks,
)

MODEL_NAME = "llama3:latest"


def generate_next_interview_question(
    db,
    candidate,
    job,
    requirements,
    history: list,
) -> InterviewQuestion:

    history_text = "\n\n".join(
        (
            f"Question: {turn.question}\n"
            f"Candidate answer: {turn.answer}"
        )
        for turn in history
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

    # --------------------------------------------------------
    # RETRIEVE SUPPORTING CANDIDATE CONTEXT
    # --------------------------------------------------------

    if history:
        latest_turn = history[-1]

        retrieval_query = (
            f"Candidate experience, skills, projects and technical "
            f"details related to this interview answer: "
            f"{latest_turn.answer}"
        )

    else:
        retrieval_query = (
            f"Candidate experience, projects, skills and technical "
            f"background relevant to the role of {job.title}"
        )

    candidate_chunks = retrieve_candidate_chunks(
        db=db,
        candidate_id=candidate.id,
        query=retrieval_query,
        top_k=4,
        categories=[
            "experience",
            "project",
            "skills",
            "education",
        ],
    )

    candidate_context = "\n\n".join(
        (
            f"[Source: {chunk.category}]\n"
            f"{chunk.text}"
        )
        for chunk in candidate_chunks
    )

    # --------------------------------------------------------
    # MOST RECENT ANSWER
    # --------------------------------------------------------

    if history:
        latest_turn = history[-1]

        latest_answer_instruction = f"""
MOST RECENT INTERVIEW TURN:

Question:
{latest_turn.question}

Candidate answer:
{latest_turn.answer}

THIS IS THE MOST IMPORTANT INFORMATION FOR THE NEXT QUESTION.

Your first task is to identify the strongest specific detail
in the candidate's answer that could be explored further.

Prefer a follow-up question about that detail.

For example, if the candidate says they:

- built a Python automation → ask about validation,
  testing, edge cases, data quality, design decisions,
  or challenges.

- developed a Copilot agent → ask about requirements,
  architecture, testing, user feedback, limitations,
  or implementation decisions.

- worked on an AI project → ask about their role,
  technical approach, data, model choices, evaluation,
  or challenges.

- worked with stakeholders → ask about requirements,
  communication, trade-offs, or translating business
  needs into technical solutions.

Only move to a new topic when the latest answer does not
contain a useful detail to explore.

DO NOT ignore this answer and jump directly to an unrelated
job requirement.
"""
    else:
        latest_answer_instruction = """
There is no previous interview answer.

Generate a suitable opening question based on the candidate,
the target job, and the job requirements.
"""

    # --------------------------------------------------------
    # PROMPT
    # --------------------------------------------------------

    prompt = f"""
You are conducting a realistic adaptive job interview.

Your job is NOT simply to generate a generic interview question.

Your job is to listen to the candidate and decide what a good
human interviewer would ask NEXT.

PRIORITY ORDER:

1. MOST RECENT CANDIDATE ANSWER
2. Candidate's demonstrated experience and projects
3. Candidate's skills
4. Job requirements
5. General interview knowledge

The most recent candidate answer has the highest priority.

IMPORTANT:

- Never invent candidate experience.
- Never assume the candidate has performed something simply
  because the job requires it.
- Do not ask "How did you..." unless the evidence shows
  that the candidate actually did it.
- If something appears only in the job requirements,
  ask a knowledge-based or hypothetical question.
- Ask ONE focused question.
- Do not combine several unrelated technologies.
- Do not repeat an earlier question.
- Do not provide feedback.
- Do not evaluate the candidate.
- Do not answer the question yourself.
- Avoid simply repeating or quoting the candidate's answer.
Rephrase the relevant detail into a natural interview question.
- When a follow-up opportunity is identified, ask a question that
goes one level deeper than the candidate's previous answer rather
than asking them to simply elaborate on the same statement.

FOLLOW-UP RULE:

When a previous answer contains a specific technical,
project, business, or behavioral detail, prefer to explore
that detail before changing topics.

The next question should feel like a natural continuation
of the conversation.

BASIS RULES:

candidate_experience:
Use only when supported by demonstrated work experience
or the candidate's previous answer.

candidate_project:
Use only when supported by a documented candidate project.

candidate_skill:
Use only when supported by an explicitly listed skill.

job_requirement:
Use when testing something required/preferred by the job
that the candidate has not demonstrated.

general:
Use for general motivation or questions that do not depend
on a specific candidate fact.

VALID CATEGORIES:

- technical
- project
- behavioral
- motivation

VALID BASIS VALUES:

- candidate_experience
- candidate_project
- candidate_skill
- job_requirement
- general

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

SUPPORTING CANDIDATE CONTEXT:

{candidate_context}

PREVIOUS INTERVIEW:

{history_text if history_text else "No previous interview history."}

{latest_answer_instruction}

Return ONLY valid JSON in exactly this format:

{{
    "category": "technical",
    "question": "Question text",
    "purpose": "What this question evaluates",
    "basis": "candidate_experience"
}}
"""

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an adaptive human interviewer. "
                    "The latest candidate answer is the primary "
                    "signal for the next question. "
                    "Follow up naturally on specific details. "
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

    return InterviewQuestion.model_validate(parsed_response)