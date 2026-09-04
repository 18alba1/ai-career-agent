from fastapi import FastAPI, File, HTTPException, UploadFile

from backend.services.cv_parser import extract_cv_text

app = FastAPI(title="AI Career Agent")


@app.get("/")
def root():
    return {"message": "AI Career Agent API is running!"}


@app.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()

        text = extract_cv_text(
            file_bytes=file_bytes,
            content_type=file.content_type,
        )

        if not text:
            raise HTTPException(
                status_code=400,
                detail="Could not extract any text from the CV.",
            )

        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "message": "CV uploaded and text extracted successfully!",
            "text": text,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the CV.",
        ) from error