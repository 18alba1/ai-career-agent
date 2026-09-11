from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database.models import CandidateChunkDB
from backend.services.embeddings import create_embedding


def retrieve_candidate_chunks(
    db: Session,
    candidate_id: int,
    query: str,
    top_k: int = 3,
    categories: list[str] | None = None,
) -> list[CandidateChunkDB]:
    """
    Retrieve the most semantically relevant candidate chunks.

    When categories are provided, retrieve up to `top_k` chunks
    from each category.
    """

    query_embedding = create_embedding(query)

    # No category filtering: normal retrieval across all chunks.
    if not categories:
        statement = (
            select(CandidateChunkDB)
            .where(
                CandidateChunkDB.candidate_id == candidate_id
            )
            .order_by(
                CandidateChunkDB.embedding.cosine_distance(
                    query_embedding
                )
            )
            .limit(top_k)
        )

        result = db.execute(statement)

        return list(result.scalars().all())

    # Category-aware retrieval.
    all_chunks = []

    for category in categories:
        statement = (
            select(CandidateChunkDB)
            .where(
                CandidateChunkDB.candidate_id == candidate_id,
                CandidateChunkDB.category == category,
            )
            .order_by(
                CandidateChunkDB.embedding.cosine_distance(
                    query_embedding
                )
            )
            .limit(top_k)
        )

        result = db.execute(statement)

        category_chunks = list(result.scalars().all())

        all_chunks.extend(category_chunks)

    return all_chunks