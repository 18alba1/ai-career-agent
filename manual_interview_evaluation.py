from backend.database.database import SessionLocal
from backend.database.models import CandidateProfileDB, JobDB
from backend.schemas.job_requirements import JobRequirements
from backend.services.interview_evaluation import (
    evaluate_interview_answer,
)

import requests


CANDIDATE_ID = 5
JOB_ID = 2

API_URL = "http://127.0.0.1:8000"

QUESTION = (
    "Can you elaborate on your experience developing Microsoft "
    "Copilot agents at Skatteverket Stockholm, and how you ensured "
    "their correctness and scalability?"
)

ANSWER = """
At Skatteverket Stockholm, I develop Microsoft Copilot agents
to automate business processes. The workflow starts when
different stakeholders identify needs. I then interview them
to understand the requirements and build the solution using
Copilot Studio and Power Automate.

To ensure correctness and scalability, I rely on user feedback.
I share prototypes with end-users for testing and validation.
I also perform both positive and negative tests to verify
reliability before deployment.
"""


db = SessionLocal()

try:
    candidate = db.get(
        CandidateProfileDB,
        CANDIDATE_ID,
    )

    job = db.get(
        JobDB,
        JOB_ID,
    )

    if candidate is None:
        raise ValueError(
            f"Candidate {CANDIDATE_ID} was not found."
        )

    if job is None:
        raise ValueError(
            f"Job {JOB_ID} was not found."
        )

    # Get existing job requirements
    response = requests.get(
        f"{API_URL}/job-requirements/{JOB_ID}",
        timeout=300,
    )

    if response.status_code != 200:
        raise RuntimeError(
            f"Job requirements request failed: "
            f"{response.status_code} {response.text}"
        )

    requirements = JobRequirements.model_validate(
        response.json()
    )

    result = evaluate_interview_answer(
        question=QUESTION,
        answer=ANSWER,
        candidate=candidate,
        candidate_context=(
            "The candidate develops Microsoft Copilot agents "
            "at Skatteverket using Copilot Studio and Power "
            "Automate. The candidate gathers requirements from "
            "stakeholders, uses prototypes and user feedback, "
            "and performs positive and negative testing."
        ),
        job=job,
        requirements=requirements,
    )

    print("\n========================================")
    print("INTERVIEW ANSWER EVALUATION")
    print("========================================\n")

    print(f"Overall score: {result.overall_score}/10")
    print(f"Relevance: {result.relevance_score}/10")
    print(f"Technical depth: {result.technical_depth_score}/10")
    print(f"Clarity: {result.clarity_score}/10")
    print(f"Grounding: {result.grounding_score}/10")

    print("\nStrengths:")
    for strength in result.strengths:
        print(f"- {strength}")

    print("\nImprovements:")
    for improvement in result.improvements:
        print(f"- {improvement}")

    print("\nFeedback:")
    print(result.feedback)

finally:
    db.close()