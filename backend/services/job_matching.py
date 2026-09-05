import re
from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

embedding_model = SentenceTransformer(MODEL_NAME)

def normalize_text(text: str) -> str:
    """
    Convert text into a normalized lowercase representation.
    """
    text = text.lower()

    text = re.sub(
        r"[^a-zA-Z0-9åäöÅÄÖ+#.\s-]",
        " ",
        text,
    )

    text = re.sub(r"\s+", " ", text)

    return text.strip()


def calculate_skill_match(
    candidate_skills: list[str],
    job_description: str,
) -> dict:
    """
    Original keyword-based matching algorithm.
    """

    normalized_job = normalize_text(job_description)

    matched_skills = []
    missing_skills = []

    for skill in candidate_skills:

        normalized_skill = normalize_text(skill)

        if normalized_skill in normalized_job:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    if candidate_skills:
        match_score = (
            len(matched_skills) / len(candidate_skills)
        ) * 100
    else:
        match_score = 0

    return {
        "match_score": round(match_score, 2),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
    }


def calculate_semantic_match(
    candidate_skills: list[str],
    job_description: str,
) -> dict:
    """
    Calculate semantic similarity between candidate skills
    and the job description.
    """

    if not candidate_skills:
        return {
            "semantic_score": 0.0,
        }

    candidate_text = ", ".join(candidate_skills)

    candidate_embedding = embedding_model.encode(
        candidate_text,
        normalize_embeddings=True,
    )

    job_embedding = embedding_model.encode(
        job_description,
        normalize_embeddings=True,
    )

    similarity = candidate_embedding @ job_embedding

    semantic_score = float(similarity * 100)

    semantic_score = max(
        0,
        min(100, semantic_score),
    )

    return {
        "semantic_score": round(semantic_score, 2),
    }