from pydantic import BaseModel, Field


class InterviewReport(BaseModel):
    overall_score: float = Field(ge=1, le=10)

    technical_score: float = Field(ge=1, le=10)

    behavioral_score: float = Field(ge=1, le=10)

    communication_score: float = Field(ge=1, le=10)

    grounding_score: float = Field(ge=1, le=10)

    strongest_answers: list[str] = Field(
        default_factory=list
    )

    weakest_answers: list[str] = Field(
        default_factory=list
    )

    recurring_strengths: list[str] = Field(
        default_factory=list
    )

    recurring_weaknesses: list[str] = Field(
        default_factory=list
    )

    recommendations: list[str] = Field(
        default_factory=list
    )

    summary: str