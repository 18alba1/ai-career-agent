from pydantic import BaseModel


class JobMatchResponse(BaseModel):
    job_id: int
    candidate_id: int
    match_score: float
    matched_skills: list[str]
    missing_skills: list[str]