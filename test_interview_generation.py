import requests

from backend.database.database import SessionLocal
from backend.database.models import CandidateProfileDB, JobDB
from backend.schemas.job_requirements import JobRequirements
from backend.services.interview_questions import generate_interview_questions


CANDIDATE_ID = 5
JOB_ID = 2  # Change this to the job you want to test

API_URL = "http://127.0.0.1:8000"


db = SessionLocal()

try:
    candidate = db.get(CandidateProfileDB, CANDIDATE_ID)
    job = db.get(JobDB, JOB_ID)

    if candidate is None:
        raise ValueError(
            f"Candidate {CANDIDATE_ID} was not found."
        )

    if job is None:
        raise ValueError(
            f"Job {JOB_ID} was not found."
        )

    # Get the already-existing job requirements
    # through the FastAPI endpoint.
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

    result = generate_interview_questions(
        db=db,
        candidate=candidate,
        job=job,
        requirements=requirements,
        number_of_questions=8,
    )

    print("\n========================================")
    print("GENERATED INTERVIEW QUESTIONS")
    print("========================================\n")

    for index, question in enumerate(
        result.questions,
        start=1,
    ):
        print(f"{index}. [{question.category.upper()}]")
        print(question.question)
        print(f"Purpose: {question.purpose}")
        print()

finally:
    db.close()