from backend.schemas.candidate import CandidateProfile
from backend.services.candidate_knowledge import create_candidate_chunks


def test_create_candidate_chunks():
    candidate = CandidateProfile(
        name="John",
        summary="Business Analyst with technical experience.",
        skills=["Python", "SQL"],
        experience=[],
        education=[],
        projects=[],
        languages=["Swedish", "English"],
    )

    chunks = create_candidate_chunks(candidate)

    assert len(chunks) == 3

    assert any(
        "Business Analyst" in chunk["text"]
        for chunk in chunks
    )

    assert any(
        "Python" in chunk["text"]
        for chunk in chunks
    )

    assert any(
        "Swedish" in chunk["text"]
        for chunk in chunks
    )


def test_candidate_chunks_have_categories():
    candidate = CandidateProfile(
        name="John",
        summary="Business Analyst with technical experience.",
        skills=["Python", "SQL"],
        experience=[],
        education=[],
        projects=[],
        languages=["Swedish", "English"],
    )

    chunks = create_candidate_chunks(candidate)

    categories = [
        chunk["category"]
        for chunk in chunks
    ]

    assert "summary" in categories
    assert "skills" in categories
    assert "languages" in categories