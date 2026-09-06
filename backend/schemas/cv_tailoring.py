from pydantic import BaseModel, Field

class TailoredSkill(BaseModel):
    name: str
    description: str


class TailoredExperience(BaseModel):
    company: str
    role: str
    description: str


class TailoredProject(BaseModel):
    name: str
    description: str


class TailoredCV(BaseModel):
    professional_summary: str

    skills_to_highlight: list[TailoredSkill] = Field(
        default_factory=list
    )

    experience: list[TailoredExperience] = Field(
        default_factory=list
    )

    projects: list[TailoredProject] = Field(
        default_factory=list
    )