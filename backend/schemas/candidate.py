from pydantic import BaseModel, Field


class Experience(BaseModel):
    company: str
    role: str
    description: str


class Education(BaseModel):
    institution: str
    degree: str
    description: str


class Project(BaseModel):
    name: str
    description: str
    technologies: list[str] = Field(default_factory=list)


class CandidateProfile(BaseModel):
    name: str
    summary: str
    skills: list[str] = Field(default_factory=list)
    experience: list[Experience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)