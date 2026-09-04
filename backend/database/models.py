from datetime import datetime

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


class JobDB(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    title: Mapped[str]
    company: Mapped[str]

    description: Mapped[str] = mapped_column(Text)

    url: Mapped[str | None]

    created_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
    )