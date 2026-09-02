from fastapi import FastAPI

app = FastAPI(title="AI Career Agent")


@app.get("/")
def root():
    return {"message": "AI Career Agent API is running!"}