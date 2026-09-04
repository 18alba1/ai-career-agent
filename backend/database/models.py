from sqlalchemy import JSON, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.database.database import Base


class CandidateProfileDB(Base):
    __tablename__ = "candidate_profiles"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str]
    summary: Mapped[str] = mapped_column(Text)

    skills: Mapped[list] = mapped_column(JSON)
    experience: Mapped[list] = mapped_column(JSON)
    education: Mapped[list] = mapped_column(JSON)
    projects: Mapped[list] = mapped_column(JSON)
    languages: Mapped[list] = mapped_column(JSON)