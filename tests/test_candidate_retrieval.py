from unittest.mock import patch


def test_create_query_embedding():
    with patch(
        "backend.services.candidate_retrieval.create_embedding"
    ) as mock_embedding:

        mock_embedding.return_value = [0.1] * 384

        embedding = mock_embedding(
            "What experience does the candidate have with AI?"
        )

        assert isinstance(embedding, list)
        assert len(embedding) == 384