import re

SKILL_ALIASES = {
    "postgres": "postgresql",
    "postgresql database": "postgresql",
    "postgre sql": "postgresql",
    "k8s": "kubernetes",
    "reactjs": "react",
    "react.js": "react",
    "nodejs": "node.js",
    "node": "node.js",
    "tf": "tensorflow",
    "pytorch": "pytorch",
    "scikit learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "genai": "generative ai",
    "llm": "large language model",
    "llms": "large language model",
}


def normalize_skill(skill: str) -> str:
    """
    Normalize a skill name so common aliases
    are treated as the same concept.
    """

    skill = skill.strip().lower()

    skill = re.sub(
        r"\s+",
        " ",
        skill,
    )

    skill = SKILL_ALIASES.get(
        skill,
        skill,
    )

    return skill