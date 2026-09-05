from typing import Literal
from pydantic import BaseModel, Field


class Requirement(BaseModel):
    name: str
    importance: Literal["required", "preferred"]


class JobRequirements(BaseModel):
    technical_skills: list[Requirement] = Field(
        default_factory=list
    )

    soft_skills: list[Requirement] = Field(
        default_factory=list
    )

    experience_requirements: list[Requirement] = Field(
        default_factory=list
    )

    education_requirements: list[Requirement] = Field(
        default_factory=list
    )

    languages: list[Requirement] = Field(
        default_factory=list
    )