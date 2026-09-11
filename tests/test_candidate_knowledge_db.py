from backend.services.candidate_knowledge import create_candidate_embeddings


def test_candidate_embeddings_have_required_data():
    from backend.schemas.candidate import CandidateProfile

    candidate = CandidateProfile(
        name="John",
        summary="Business Analyst with technical experience.",
        skills=["Python", "SQL"],
        experience=[],
        education=[],
        projects=[],
        languages=["Swedish", "English"],
    )

    embedded_chunks = create_candidate_embeddings(candidate)

    assert len(embedded_chunks) == 3

    for chunk in embedded_chunks:
        assert isinstance(chunk["text"], str)
        assert isinstance(chunk["embedding"], list)
        assert len(chunk["embedding"]) == 384