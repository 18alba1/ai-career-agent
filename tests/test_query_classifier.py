from unittest.mock import patch

from backend.services.query_classifier import (
    classify_candidate_query,
)


def test_classify_education_question():
    mock_response = {
        "message": {
            "content": '{"categories": ["education"]}'
        }
    }

    with patch(
        "backend.services.query_classifier.ollama.chat",
        return_value=mock_response,
    ):
        categories = classify_candidate_query(
            "What education does the candidate have?"
        )

    assert categories == ["education"]


def test_classify_ai_experience_question():
    mock_response = {
        "message": {
            "content": (
                '{"categories": '
                '["experience", "project", "skills"]}'
            )
        }
    }

    with patch(
        "backend.services.query_classifier.ollama.chat",
        return_value=mock_response,
    ):
        categories = classify_candidate_query(
            "What experience does the candidate have with AI?"
        )

    assert "experience" in categories
    assert "project" in categories
    assert "skills" in categories


def test_invalid_categories_are_removed():
    mock_response = {
        "message": {
            "content": (
                '{"categories": '
                '["education", "random_category"]}'
            )
        }
    }

    with patch(
        "backend.services.query_classifier.ollama.chat",
        return_value=mock_response,
    ):
        categories = classify_candidate_query(
            "What education does the candidate have?"
        )

    assert categories == ["education"]


def test_invalid_json_returns_empty_list():
    mock_response = {
        "message": {
            "content": "not valid json"
        }
    }

    with patch(
        "backend.services.query_classifier.ollama.chat",
        return_value=mock_response,
    ):
        categories = classify_candidate_query(
            "What education does the candidate have?"
        )

    assert categories == []