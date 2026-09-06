from backend.schemas.cover_letter import CoverLetter


def test_cover_letter_schema():
    cover_letter = CoverLetter(
        subject="Application for AI Engineer",
        greeting="Dear Hiring Manager,",
        body=(
            "I am excited to apply for the AI Engineer position. "
            "My background in computer engineering and experience "
            "working with Python and AI projects make this role "
            "particularly interesting to me."
        ),
        closing="Kind regards,\nJohn Doe",
    )

    assert cover_letter.subject == "Application for AI Engineer"

    assert cover_letter.greeting == "Dear Hiring Manager,"

    assert "AI Engineer" in cover_letter.body

    assert cover_letter.closing == (
        "Kind regards,\nJohn Doe"
    )


def test_cover_letter_fields_exist():
    cover_letter = CoverLetter(
        subject="Application for Developer",
        greeting="Dear Hiring Manager,",
        body="I am writing to apply for the position.",
        closing="Kind regards,\nJohn",
    )

    assert hasattr(cover_letter, "subject")
    assert hasattr(cover_letter, "greeting")
    assert hasattr(cover_letter, "body")
    assert hasattr(cover_letter, "closing")


def test_cover_letter_body_is_string():
    cover_letter = CoverLetter(
        subject="Application for AI Engineer",
        greeting="Dear Hiring Manager,",
        body="I am excited about this opportunity.",
        closing="Kind regards,\nJohn",
    )

    assert isinstance(cover_letter.body, str)


def test_cover_letter_subject_is_string():
    cover_letter = CoverLetter(
        subject="Application for AI Engineer",
        greeting="Dear Hiring Manager,",
        body="I am excited about this opportunity.",
        closing="Kind regards,\nAJohn",
    )

    assert isinstance(cover_letter.subject, str)


def test_cover_letter_greeting_is_string():
    cover_letter = CoverLetter(
        subject="Application for AI Engineer",
        greeting="Dear Hiring Manager,",
        body="I am excited about this opportunity.",
        closing="Kind regards,\nAJohn",
    )

    assert isinstance(cover_letter.greeting, str)


def test_cover_letter_closing_is_string():
    cover_letter = CoverLetter(
        subject="Application for AI Engineer",
        greeting="Dear Hiring Manager,",
        body="I am excited about this opportunity.",
        closing="Kind regards,\nJohn",
    )

    assert isinstance(cover_letter.closing, str)