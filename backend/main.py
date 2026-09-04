from fastapi import FastAPI, File, HTTPException, UploadFile

from backend.schemas.candidate import CandidateProfile
from backend.services.candidate_profile import create_candidate_profile
from backend.services.cv_parser import extract_cv_text

app = FastAPI(title="AI Career Agent")


@app.get("/")
def root():
    return {"message": "AI Career Agent API is running!"}


@app.post("/upload-cv", response_model=CandidateProfile)
async def upload_cv(file: UploadFile = File(...)):
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

        return profile

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except HTTPException:
        raise

    except Exception as error:
        print(f"Error processing CV: {error}")

        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the CV.",
        ) from error