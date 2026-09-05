from backend.services.embeddings import create_embedding


def test_embedding_is_created():

    embedding = create_embedding(
        "Python developer"
    )

    assert embedding is not None
    assert len(embedding) == 384