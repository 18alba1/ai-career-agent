from pydantic import BaseModel, Field


class InterviewEvaluation(BaseModel):
    overall_score: int = Field(ge=1, le=10)

    relevance_score: int = Field(ge=1, le=10)

    clarity_score: int = Field(ge=1, le=10)

    grounding_score: int = Field(ge=1, le=10)

    category_specific_score: int = Field(
        ge=1,
        le=10,
    )

    category_specific_label: str

    strengths: list[str] = Field(
        default_factory=list
    )

    improvements: list[str] = Field(
        default_factory=list
    )

    feedback: str