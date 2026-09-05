from backend.services.job_matching import (
    calculate_semantic_match,
    calculate_skill_match,
)


def test_skill_matching():

    candidate_skills = [
        "Python",
        "Docker",
        "Kubernetes",
    ]

    job_description = """
    We are looking for someone with experience
    in Python and Docker.
    """

    result = calculate_skill_match(
        candidate_skills,
        job_description,
    )

    assert result["match_score"] == 66.67

    assert "Python" in result["matched_skills"]
    assert "Docker" in result["matched_skills"]
    assert "Kubernetes" in result["missing_skills"]


def test_semantic_matching():

    candidate_skills = [
        "Python",
        "PostgreSQL",
        "Docker",
    ]

    job_description = """
    We are looking for a developer with experience
    in Python programming, relational databases,
    and containerization technologies.
    """

    result = calculate_semantic_match(
        candidate_skills,
        job_description,
    )

    assert 0 <= result["semantic_score"] <= 100