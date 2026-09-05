from backend.services.job_matching import (
    classify_similarity,
)

def test_strong_similarity():
    assert classify_similarity(0.80) == "strong"

def test_partial_similarity():
    assert classify_similarity(0.60) == "partial"

def test_missing_similarity():
    assert classify_similarity(0.30) == "missing"