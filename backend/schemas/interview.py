from typing import Literal

from pydantic import BaseModel, Field


class InterviewQuestion(BaseModel):
    category: Literal[
        "technical",
        "project",
        "behavioral",
        "motivation",
    ]

    question: str
    purpose: str

    basis: Literal[
        "candidate_experience",
        "candidate_project",
        "candidate_skill",
        "job_requirement",
        "general",
    ]


class InterviewQuestionSet(BaseModel):
    questions: list[InterviewQuestion] = Field(
        default_factory=list
    )


class InterviewTurn(BaseModel):
    question: str
    answer: str


class NextInterviewQuestionRequest(BaseModel):
    history: list[InterviewTurn] = Field(
        default_factory=list
    )

    language: Literal["en", "sv"] = "en"