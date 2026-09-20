from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, Form
from pathlib import Path
from sqlalchemy.orm import Session
from backend.database.models import CandidateProfileDB, JobDB
from backend.schemas.job import JobCreate, JobResponse
from backend.database.database import Base, engine, get_db
from backend.schemas.candidate import CandidateProfile, CandidateListItem
from backend.services.candidate_profile import create_candidate_profile
from backend.services.cv_parser import extract_cv_text
from backend.schemas.matching import JobMatchResponse
from backend.services.job_matching import calculate_skill_match
from sqlalchemy import text
from backend.services.candidate_retrieval import retrieve_candidate_chunks
from backend.services.candidate_rag import answer_candidate_question
from backend.schemas.interview import InterviewQuestionSet
from backend.services.interview_questions import generate_interview_questions
from backend.schemas.interview_report import InterviewReport
from backend.services.speech_to_text import transcribe_audio
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from backend.services.text_to_speech import (
    synthesize_speech,
)
from backend.services.interview_report import (
    generate_interview_report,
)
from backend.schemas.interview import (
    InterviewQuestion,
    NextInterviewQuestionRequest,
)
from backend.services.interview_session import (
    generate_next_interview_question,
)
from backend.services.job_matching import (
    calculate_semantic_match,
)
from backend.schemas.job_requirements import JobRequirements
from backend.services.job_requirements import extract_job_requirements
from backend.services.job_matching import (
    calculate_job_fit,
)
from backend.services.cv_tailoring import tailor_cv
from backend.schemas.cover_letter import CoverLetter
from backend.services.cover_letter import (
    generate_cover_letter,
)
from backend.database.models import (
    CandidateProfileDB,
    CandidateChunkDB,
    JobDB,
)
from backend.services.candidate_knowledge import (
    create_candidate_embeddings,
    save_candidate_embeddings,
)

from backend.schemas.interview_evaluation import (
    InterviewEvaluationRequest, InterviewEvaluation
)
from backend.services.interview_evaluation import (
    evaluate_interview_answer,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    with engine.begin() as connection:
        connection.execute(
            text("CREATE EXTENSION IF NOT EXISTS vector")
        )

    Base.metadata.create_all(bind=engine)

    yield


app = FastAPI(
    title="AI Career Agent",
    lifespan=lifespan,
)


@app.get("/")
def root():
    return {"message": "AI Career Agent API is running!"}

app.mount(
    "/frontend",
    StaticFiles(directory="frontend", html=True),
    name="frontend",
)

@app.get("/database-test")
def database_test():
    try:
        with engine.connect():
            return {"message": "Database connection successful!"}

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {error}",
        ) from error


@app.post("/upload-cv", response_model=CandidateProfile)
async def upload_cv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        file_bytes = await file.read()

        cv_text = extract_cv_text(
            file_bytes=file_bytes,
            content_type=file.content_type,
        )

        if not cv_text:
            raise HTTPException(
                status_code=400,
                detail="Could not extract any text from the CV.",
            )

        profile = create_candidate_profile(cv_text)

        profile_db = CandidateProfileDB(
            name=profile.name,
            summary=profile.summary,
            skills=profile.skills,
            experience=[
                experience.model_dump()
                for experience in profile.experience
            ],
            education=[
                education.model_dump()
                for education in profile.education
            ],
            projects=[
                project.model_dump()
                for project in profile.projects
            ],
            languages=profile.languages,
        )

        db.add(profile_db)
        db.commit()
        db.refresh(profile_db)

        # Create embeddings for the candidate's knowledge
        embedded_chunks = create_candidate_embeddings(profile)

        # Save chunks and embeddings to PostgreSQL
        save_candidate_embeddings(
            db=db,
            candidate_id=profile_db.id,
            embedded_chunks=embedded_chunks,
        )

        return profile

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        print(f"Error processing CV: {error}")

        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the CV.",
        ) from error


@app.get("/candidates", response_model=list[CandidateListItem])
def get_candidates(
    db: Session = Depends(get_db),
):
    return db.query(CandidateProfileDB).order_by(
        CandidateProfileDB.id.desc()
    ).all()

@app.get(
    "/candidate/{candidate_id}",
    response_model=CandidateProfile,
)
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
):
    profile = db.get(CandidateProfileDB, candidate_id)

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found.",
        )

    return CandidateProfile(
        name=profile.name,
        summary=profile.summary,
        skills=profile.skills,
        experience=profile.experience,
        education=profile.education,
        projects=profile.projects,
        languages=profile.languages,
    )

@app.post("/jobs", response_model=JobResponse)
def create_job(
    job: JobCreate,
    db: Session = Depends(get_db),
):
    job_db = JobDB(
        title=job.title,
        company=job.company,
        description=job.description,
        url=job.url,
    )

    db.add(job_db)
    db.commit()
    db.refresh(job_db)

    return job_db

@app.get("/jobs", response_model=list[JobResponse])
def get_jobs(
    db: Session = Depends(get_db),
):
    return db.query(JobDB).order_by(
        JobDB.created_at.desc()
    ).all()

@app.get(
    "/match/{candidate_id}/{job_id}",
    response_model=JobMatchResponse,
)
def match_candidate_to_job(
    candidate_id: int,
    job_id: int,
    db: Session = Depends(get_db),
):
    candidate = db.get(
        CandidateProfileDB,
        candidate_id,
    )

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found.",
        )

    job = db.get(
        JobDB,
        job_id,
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    result = calculate_skill_match(
        candidate_skills=candidate.skills,
        job_description=job.description,
    )

    return {
        "job_id": job.id,
        "candidate_id": candidate.id,
        **result,
    }

@app.get("/semantic-match/{candidate_id}/{job_id}")
def semantic_match_candidate_to_job(
    candidate_id: int,
    job_id: int,
    db: Session = Depends(get_db),
):
    candidate = db.get(
        CandidateProfileDB,
        candidate_id,
    )

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found.",
        )

    job = db.get(
        JobDB,
        job_id,
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    result = calculate_semantic_match(
        candidate_skills=candidate.skills,
        job_description=job.description,
    )

    return {
        "job_id": job.id,
        "candidate_id": candidate.id,
        **result,
    }

@app.get(
    "/job-requirements/{job_id}",
    response_model=JobRequirements,
)
def get_job_requirements(
    job_id: int,
    db: Session = Depends(get_db),
):
    job = db.get(
        JobDB,
        job_id,
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    requirements = extract_job_requirements(
        job.description
    )

    return requirements

@app.get(
    "/job-fit/{candidate_id}/{job_id}"
)
def calculate_candidate_job_fit(
    candidate_id: int,
    job_id: int,
    db: Session = Depends(get_db),
):
    candidate = db.get(
        CandidateProfileDB,
        candidate_id,
    )

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found.",
        )

    job = db.get(
        JobDB,
        job_id,
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    requirements = extract_job_requirements(
        job.description
    )

    result = calculate_job_fit(
        candidate=candidate,
        requirements=requirements,
    )

    return {
        "candidate_id": candidate.id,
        "job_id": job.id,
        **result,
    }

@app.get(
    "/tailor-cv/{candidate_id}/{job_id}"
)
def tailor_candidate_cv(
    candidate_id: int,
    job_id: int,
    db: Session = Depends(get_db),
):
    candidate = db.get(
        CandidateProfileDB,
        candidate_id,
    )

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found.",
        )

    job = db.get(
        JobDB,
        job_id,
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    requirements = extract_job_requirements(
        job.description
    )

    tailored_cv = tailor_cv(
        candidate=candidate,
        requirements=requirements,
    )

    return tailored_cv

@app.get(
    "/cover-letter/{candidate_id}/{job_id}",
    response_model=CoverLetter,
)
def generate_candidate_cover_letter(
    candidate_id: int,
    job_id: int,
    db: Session = Depends(get_db),
):

    candidate = db.get(
        CandidateProfileDB,
        candidate_id,
    )

    if candidate is None:

        raise HTTPException(
            status_code=404,
            detail=(
                "Candidate profile not found."
            ),
        )

    job = db.get(
        JobDB,
        job_id,
    )

    if job is None:

        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    requirements = extract_job_requirements(
        job.description
    )

    cover_letter = generate_cover_letter(
        candidate=candidate,
        job=job,
        requirements=requirements,
    )

    return cover_letter

@app.get("/retrieve/{candidate_id}")
def retrieve_candidate_knowledge(
    candidate_id: int,
    query: str,
    top_k: int = 5,
    db: Session = Depends(get_db),
):
    try:
        chunks = retrieve_candidate_chunks(
            db=db,
            candidate_id=candidate_id,
            query=query,
            top_k=top_k,
        )

        return {
            "candidate_id": candidate_id,
            "query": query,
            "results": [
                {
                    "id": chunk.id,
                    "category": chunk.category,
                    "text": chunk.text,
                }
                for chunk in chunks
            ],
        }

    except Exception as error:
        print(f"Retrieval error: {error}")

        raise HTTPException(
            status_code=500,
            detail="An error occurred during candidate retrieval.",
        ) from error

@app.get("/candidate-rag/{candidate_id}")
def candidate_rag(
    candidate_id: int,
    question: str,
    top_k: int = 5,
):
    try:
        result = answer_candidate_question(
            candidate_id=candidate_id,
            question=question,
            top_k=top_k,
        )

        return {
            "candidate_id": candidate_id,
            "question": question,
            "answer": result["answer"],
            "sources": result["sources"],
        }

    except Exception as error:
        print(f"RAG error: {error}")

        raise HTTPException(
            status_code=500,
            detail="An error occurred while answering the question.",
        ) from error

@app.get(
    "/interview-questions/{candidate_id}/{job_id}",
    response_model=InterviewQuestionSet,
)
def generate_interview_questions_endpoint(
    candidate_id: int,
    job_id: int,
    number_of_questions: int = 8,
    db: Session = Depends(get_db),
):
    candidate = db.get(
        CandidateProfileDB,
        candidate_id,
    )

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found.",
        )

    job = db.get(
        JobDB,
        job_id,
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    if number_of_questions < 1 or number_of_questions > 15:
        raise HTTPException(
            status_code=400,
            detail="Number of questions must be between 1 and 15.",
        )

    try:
        from backend.services.job_requirements import (
            extract_job_requirements,
        )

        requirements = extract_job_requirements(
            job.description
        )

        result = generate_interview_questions(
            db=db,
            candidate=candidate,
            job=job,
            requirements=requirements,
            number_of_questions=number_of_questions,
        )

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            f"Interview question generation error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "An error occurred while generating "
                "interview questions."
            ),
        ) from error

@app.post(
    "/interview/next/{candidate_id}/{job_id}",
    response_model=InterviewQuestion,
)
def next_interview_question(
    candidate_id: int,
    job_id: int,
    request: NextInterviewQuestionRequest,
    db: Session = Depends(get_db),
):
    candidate = db.get(
        CandidateProfileDB,
        candidate_id,
    )

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found.",
        )

    job = db.get(
        JobDB,
        job_id,
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    try:
        from backend.services.job_requirements import (
            extract_job_requirements,
        )

        requirements = extract_job_requirements(
            job.description
        )

        result = generate_next_interview_question(
            db=db,
            candidate=candidate,
            job=job,
            requirements=requirements,
            history=request.history,
            language=request.language,
        )

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            f"Next interview question error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "An error occurred while generating "
                "the next interview question."
            ),
        ) from error

@app.post(
    "/interview/evaluate/{candidate_id}/{job_id}",
    response_model=InterviewEvaluation,
)
def evaluate_interview(
    candidate_id: int,
    job_id: int,
    request: InterviewEvaluationRequest,
    db: Session = Depends(get_db),
):
    candidate = db.get(
        CandidateProfileDB,
        candidate_id,
    )

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found.",
        )

    job = db.get(
        JobDB,
        job_id,
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    if not request.answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Answer cannot be empty.",
        )

    try:
        from backend.services.job_requirements import (
            extract_job_requirements,
        )

        requirements = extract_job_requirements(
            job.description
        )

        from backend.services.candidate_retrieval import (
            retrieve_candidate_chunks,
        )

        candidate_chunks = retrieve_candidate_chunks(
            db=db,
            candidate_id=candidate.id,
            query=request.question,
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

        result = evaluate_interview_answer(
            question=request.question,
            answer=request.answer,
            candidate=candidate,
            candidate_context=candidate_context,
            job=job,
            requirements=requirements,
            question_category=request.question_category,
            question_basis=request.question_basis,
        )

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            f"Interview evaluation error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "An error occurred while evaluating "
                "the interview answer."
            ),
        ) from error

@app.post(
    "/interview/report/{candidate_id}/{job_id}",
    response_model=InterviewReport,
)
def interview_report(
    candidate_id: int,
    job_id: int,
    history: list[dict],
    evaluations: list[dict],
    db: Session = Depends(get_db),
):
    candidate = db.get(
        CandidateProfileDB,
        candidate_id,
    )

    if candidate is None:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found.",
        )

    job = db.get(
        JobDB,
        job_id,
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    if len(history) != len(evaluations):
        raise HTTPException(
            status_code=400,
            detail=(
                "Number of interview turns and evaluations "
                "must match."
            ),
        )

    if not history:
        raise HTTPException(
            status_code=400,
            detail="Interview history cannot be empty.",
        )

    try:
        result = generate_interview_report(
            candidate=candidate,
            job=job,
            history=history,
            evaluations=evaluations,
        )

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            f"Interview report error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "An error occurred while generating "
                "the interview report."
            ),
        ) from error

@app.post("/transcribe-audio")
async def transcribe_audio_endpoint(
    file: UploadFile = File(...),
    language: str = Form("en"),
):
    allowed_types = {
        "audio/wav": ".wav",
        "audio/x-wav": ".wav",
        "audio/webm": ".webm",
        "audio/webm;codecs=opus": ".webm",
    }

    content_type = file.content_type or ""

    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only WAV and WebM audio are currently supported."
            ),
        )

    audio_bytes = await file.read()

    file_extension = allowed_types[content_type]

    transcript = transcribe_audio(
        audio_bytes=audio_bytes,
        file_extension=file_extension,
        language=language
    )

    return {
        "transcript": transcript
    }

@app.get("/text-to-speech")
def text_to_speech_endpoint(
    text: str,
    language: str = "en",
):
    try:
        audio_bytes = synthesize_speech(
            text=text,
            language=language,
        )

        return Response(
            content=audio_bytes,
            media_type="audio/wav",
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            f"Text-to-speech error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Could not generate speech.",
        ) from error