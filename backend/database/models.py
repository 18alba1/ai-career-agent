from datetime import datetime
from sqlalchemy import JSON, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.database.database import Base
from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey

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

class CandidateChunkDB(Base):
    __tablename__ = "candidate_chunks"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidate_profiles.id"),
        nullable=False,
    )

    text: Mapped[str] = mapped_column(Text)

    category: Mapped[str | None]

    embedding: Mapped[list] = mapped_column(
        Vector(384)
    )

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