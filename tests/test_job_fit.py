from backend.services.job_matching import (
    calculate_category_score,
)


def test_required_requirements_have_more_weight():

    matches = [
        {
            "importance": "required",
            "similarity": 1.0,
        },
        {
            "importance": "preferred",
            "similarity": 0.0,
        },
    ]

    score = calculate_category_score(
        matches
    )

    assert round(score, 2) == 66.67