from typing import Literal
from pydantic import BaseModel

class RequirementMatch(BaseModel):
    requirement: str
    importance: Literal["required", "preferred"]
    category: str
    similarity: float
    status: Literal["strong", "partial", "missing"]
    evidence: str | None = None


class JobFitResponse(BaseModel):
    candidate_id: int
    job_id: int
    overall_score: float
    category_scores: dict[str, float]
    requirement_matches: list[RequirementMatch]