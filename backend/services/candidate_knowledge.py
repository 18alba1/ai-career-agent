from backend.schemas.candidate import CandidateProfile
from backend.services.embeddings import create_embedding
from sqlalchemy.orm import Session
from backend.database.models import CandidateChunkDB

def create_candidate_chunks(
    candidate: CandidateProfile,
) -> list[dict]:
    chunks = []

    if candidate.summary:
        chunks.append(
            {
                "text": f"Candidate summary: {candidate.summary}",
                "category": "summary",
            }
        )

    if candidate.skills:
        skills_text = ", ".join(candidate.skills)

        chunks.append(
            {
                "text": f"Candidate skills: {skills_text}",
                "category": "skills",
            }
        )

    for experience in candidate.experience:
        chunks.append(
            {
                "text": (
                    f"Work experience at {experience.company} "
                    f"as {experience.role}: "
                    f"{experience.description}"
                ),
                "category": "experience",
            }
        )

    for education in candidate.education:
        chunks.append(
            {
                "text": (
                    f"Education at {education.institution}: "
                    f"{education.degree}. "
                    f"{education.description}"
                ),
                "category": "education",
            }
        )

    for project in candidate.projects:
        technologies = ", ".join(project.technologies)

        chunks.append(
            {
                "text": (
                    f"Project: {project.name}. "
                    f"Description: {project.description}. "
                    f"Technologies: {technologies}"
                ),
                "category": "project",
            }
        )

    if candidate.languages:
        languages_text = ", ".join(candidate.languages)

        chunks.append(
            {
                "text": f"Candidate languages: {languages_text}",
                "category": "languages",
            }
        )

    return chunks


def create_candidate_embeddings(
    candidate: CandidateProfile,
) -> list[dict]:
    chunks = create_candidate_chunks(candidate)

    embedded_chunks = []

    for chunk in chunks:
        embedding = create_embedding(chunk["text"])

        embedded_chunks.append(
            {
                "text": chunk["text"],
                "category": chunk["category"],
                "embedding": embedding.tolist(),
            }
        )

    return embedded_chunks


def save_candidate_embeddings(
    db: Session,
    candidate_id: int,
    embedded_chunks: list[dict],
) -> list[CandidateChunkDB]:

    saved_chunks = []

    for chunk in embedded_chunks:
        candidate_chunk = CandidateChunkDB(
            candidate_id=candidate_id,
            text=chunk["text"],
            category=chunk["category"],
            embedding=chunk["embedding"],
        )

        db.add(candidate_chunk)
        saved_chunks.append(candidate_chunk)

    db.commit()

    for chunk in saved_chunks:
        db.refresh(chunk)

    return saved_chunks