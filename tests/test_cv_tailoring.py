from backend.schemas.cv_tailoring import (
    TailoredCV,
    TailoredExperience,
    TailoredProject,
    TailoredSkill,
)
import pytest
from pydantic import ValidationError
from backend.schemas.cv_tailoring import TailoredCV

def test_skills_must_have_structure():

    with pytest.raises(ValidationError):

        TailoredCV(
            professional_summary="Test",
            skills_to_highlight=[
                "Python"
            ],
        )

def test_tailored_skill():

    skill = TailoredSkill(
        name="Python",
        description=(
            "Experience using Python "
            "for automation."
        ),
    )

    assert skill.name == "Python"

    assert (
        skill.description
        == "Experience using Python "
        "for automation."
    )


def test_tailored_experience():

    experience = TailoredExperience(
        company="Skatteverket",
        role="Business Analyst",
        description=(
            "Developed Microsoft Copilot "
            "agents and automated processes."
        ),
    )

    assert experience.company == "Skatteverket"
    assert experience.role == "Business Analyst"


def test_tailored_project():

    project = TailoredProject(
        name="TradingAgentcy",
        description=(
            "Built a multi-agent AI trading system."
        ),
    )

    assert project.name == "TradingAgentcy"


def test_tailored_cv():

    cv = TailoredCV(
        professional_summary=(
            "Computer Engineer with AI experience."
        ),
        skills_to_highlight=[
            TailoredSkill(
                name="Python",
                description=(
                    "Experience using Python."
                ),
            )
        ],
        experience=[
            TailoredExperience(
                company="Skatteverket",
                role="Business Analyst",
                description=(
                    "Worked with AI and automation."
                ),
            )
        ],
        projects=[
            TailoredProject(
                name="TradingAgentcy",
                description=(
                    "Built a multi-agent AI system."
                ),
            )
        ],
    )

    assert (
        cv.professional_summary
        == "Computer Engineer with AI experience."
    )

    assert len(cv.skills_to_highlight) == 1
    assert len(cv.experience) == 1
    assert len(cv.projects) == 1