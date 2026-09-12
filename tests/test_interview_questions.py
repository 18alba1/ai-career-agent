from backend.schemas.interview import (
    InterviewQuestion,
    InterviewQuestionSet,
)


def test_interview_question_schema():
    question = InterviewQuestion(
        category="technical",
        question="How have you used Python to automate a process?",
        purpose="Evaluate practical Python experience.",
        basis="candidate_experience",
    )

    assert question.category == "technical"
    assert "Python" in question.question
    assert "Python" in question.purpose
    assert question.basis == "candidate_experience"


def test_interview_question_set_schema():
    question_set = InterviewQuestionSet(
        questions=[
            InterviewQuestion(
                category="technical",
                question="How have you used Python?",
                purpose="Evaluate Python experience.",
                basis="candidate_experience",
            ),
            InterviewQuestion(
                category="project",
                question="Tell me about your AI project.",
                purpose="Evaluate project experience.",
                basis="candidate_project",
            ),
        ]
    )

    assert len(question_set.questions) == 2
    assert question_set.questions[0].category == "technical"
    assert question_set.questions[1].category == "project"


def test_interview_question_can_be_based_on_job_requirement():
    question = InterviewQuestion(
        category="technical",
        question=(
            "How would you approach building a RAG-based "
            "application?"
        ),
        purpose="Evaluate understanding of RAG architecture.",
        basis="job_requirement",
    )

    assert question.basis == "job_requirement"


def test_interview_question_has_valid_basis():
    valid_basis = {
        "candidate_experience",
        "candidate_project",
        "candidate_skill",
        "job_requirement",
        "general",
    }

    question = InterviewQuestion(
        category="behavioral",
        question=(
            "Tell me about a time you improved an inefficient process."
        ),
        purpose="Evaluate problem-solving and initiative.",
        basis="candidate_experience",
    )

    assert question.basis in valid_basis