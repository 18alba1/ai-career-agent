from backend.schemas.interview_evaluation import (
    InterviewEvaluation,
)


def test_interview_evaluation_schema():
    evaluation = InterviewEvaluation(
        overall_score=8,
        relevance_score=9,
        clarity_score=8,
        grounding_score=9,
        category_specific_score=7,
        category_specific_label="Technical depth",
        strengths=[
            "Clear explanation",
            "Good practical example",
        ],
        improvements=[
            "Explain testing in more detail",
        ],
        feedback=(
            "Strong answer with a relevant practical example."
        ),
    )

    assert evaluation.overall_score == 8
    assert evaluation.relevance_score == 9
    assert evaluation.clarity_score == 8
    assert evaluation.grounding_score == 9
    assert evaluation.category_specific_score == 7
    assert evaluation.category_specific_label == "Technical depth"


def test_interview_evaluation_scores_are_within_range():
    evaluation = InterviewEvaluation(
        overall_score=1,
        relevance_score=10,
        clarity_score=5,
        grounding_score=7,
        category_specific_score=3,
        category_specific_label="Behavioral quality",
        feedback="Test evaluation.",
    )

    assert 1 <= evaluation.overall_score <= 10
    assert 1 <= evaluation.relevance_score <= 10
    assert 1 <= evaluation.clarity_score <= 10
    assert 1 <= evaluation.grounding_score <= 10
    assert 1 <= evaluation.category_specific_score <= 10


def test_behavioral_evaluation_label():
    evaluation = InterviewEvaluation(
        overall_score=8,
        relevance_score=8,
        clarity_score=9,
        grounding_score=8,
        category_specific_score=7,
        category_specific_label="Behavioral quality",
        feedback="Good behavioral answer.",
    )

    assert (
        evaluation.category_specific_label
        == "Behavioral quality"
    )


def test_motivation_evaluation_label():
    evaluation = InterviewEvaluation(
        overall_score=8,
        relevance_score=9,
        clarity_score=8,
        grounding_score=8,
        category_specific_score=7,
        category_specific_label=(
            "Motivation and role alignment"
        ),
        feedback="Good motivation answer.",
    )

    assert (
        evaluation.category_specific_label
        == "Motivation and role alignment"
    )