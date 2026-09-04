from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.database.database import Base, engine, get_db
from backend.database.models import CandidateProfileDB
from backend.schemas.candidate import CandidateProfile
from backend.services.candidate_profile import create_candidate_profile
from backend.services.cv_parser import extract_cv_text


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="AI Career Agent",
    lifespan=lifespan,
)


@app.get("/")
def root():
    return {"message": "AI Career Agent API is running!"}


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