from fastapi import FastAPI, File, UploadFile

app = FastAPI(title="AI Career Agent")


@app.get("/")
def root():
    return {"message": "AI Career Agent API is running!"}


@app.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "message": "CV uploaded successfully!"
    }