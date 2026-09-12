from backend.schemas.interview_report import InterviewReport


def test_interview_report_schema():
    report = InterviewReport(
        overall_score=8.0,
        technical_score=8.5,
        behavioral_score=7.5,
        communication_score=9.0,
        grounding_score=9.5,
        strongest_answers=[
            "Question 1 (technical): 9.0/10",
        ],
        weakest_answers=[
            "Question 3 (behavioral): 6.5/10",
        ],
        recurring_strengths=[
            "Clear technical explanations",
        ],
        recurring_weaknesses=[
            "Some answers could be more specific",
        ],
        recommendations=[
            "Practice giving concrete examples",
        ],
        summary="Strong overall interview performance.",
    )

    assert report.overall_score == 8.0
    assert report.technical_score == 8.5
    assert report.behavioral_score == 7.5
    assert report.communication_score == 9.0
    assert report.grounding_score == 9.5

    assert len(report.strongest_answers) == 1
    assert len(report.weakest_answers) == 1
    assert len(report.recurring_strengths) == 1
    assert len(report.recurring_weaknesses) == 1
    assert len(report.recommendations) == 1


def test_interview_report_scores_are_valid():

    report = InterviewReport(
        overall_score=7.5,
        technical_score=8.0,
        behavioral_score=7.0,
        communication_score=6.5,
        grounding_score=8.5,
        summary="Test report.",
    )

    assert 1 <= report.overall_score <= 10
    assert 1 <= report.technical_score <= 10
    assert 1 <= report.behavioral_score <= 10
    assert 1 <= report.communication_score <= 10
    assert 1 <= report.grounding_score <= 10