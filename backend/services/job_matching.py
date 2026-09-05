import re
from sentence_transformers import SentenceTransformer
from backend.schemas.job_requirements import JobRequirements


MODEL_NAME = (
    "sentence-transformers/"
    "paraphrase-multilingual-MiniLM-L12-v2"
)

embedding_model = SentenceTransformer(MODEL_NAME)


def normalize_text(text: str) -> str:
    """
    Normalize text for simple keyword matching.
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
    Original embedding-based matching algorithm.
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


def create_candidate_evidence(
    candidate,
) -> dict[str, list[str]]:
    """
    Create searchable evidence from the candidate profile.
    """

    technical = list(candidate.skills)

    for project in candidate.projects:
        technologies = project.get(
            "technologies",
            [],
        )

        technical.extend(technologies)

    technical = list(
        dict.fromkeys(technical)
    )

    soft = [
        candidate.summary,
    ]

    for experience in candidate.experience:
        description = experience.get(
            "description",
            "",
        )

        if description:
            soft.append(description)

    experience_evidence = []

    for experience in candidate.experience:
        role = experience.get(
            "role",
            "",
        )

        company = experience.get(
            "company",
            "",
        )

        description = experience.get(
            "description",
            "",
        )

        experience_evidence.append(
            f"{role} at {company}. {description}"
        )

    education_evidence = []

    for education in candidate.education:
        education_evidence.append(
            f"{education.get('degree', '')} "
            f"at {education.get('institution', '')}. "
            f"{education.get('description', '')}"
        )

    languages = list(candidate.languages)

    return {
        "technical": technical,
        "soft": soft,
        "experience": experience_evidence,
        "education": education_evidence,
        "languages": languages,
    }


def find_best_match(
    requirement: str,
    evidence: list[str],
) -> tuple[float, str | None]:
    """
    Find the candidate evidence that best matches a requirement.
    """

    if not evidence:
        return 0.0, None

    normalized_requirement = normalize_text(
        requirement
    )

    normalized_evidence = [
        normalize_text(item)
        for item in evidence
    ]

    for index, item in enumerate(normalized_evidence):

        if normalized_requirement in item:
            return 1.0, evidence[index]

    requirement_embedding = embedding_model.encode(
        requirement,
        normalize_embeddings=True,
    )

    evidence_embeddings = embedding_model.encode(
        evidence,
        normalize_embeddings=True,
    )

    similarities = (
        evidence_embeddings @ requirement_embedding
    )

    best_index = int(similarities.argmax())

    best_similarity = float(
        similarities[best_index]
    )

    return (
        best_similarity,
        evidence[best_index],
    )


def classify_similarity(
    similarity: float,
) -> str:
    """
    Convert similarity into an easy-to-understand category.
    """

    if similarity >= 0.75:
        return "strong"

    if similarity >= 0.55:
        return "partial"

    return "missing"


def calculate_job_fit(
    candidate,
    requirements: JobRequirements,
) -> dict:

    candidate_evidence = create_candidate_evidence(
        candidate
    )

    requirement_matches = []

    total_weight = 0.0
    total_score = 0.0

    requirement_categories = {
        "technical": requirements.technical_skills,
        "soft": requirements.soft_skills,
        "experience": requirements.experience_requirements,
        "education": requirements.education_requirements,
        "languages": requirements.languages,
    }

    for category, category_requirements in (
        requirement_categories.items()
    ):

        for requirement in category_requirements:

            similarity, evidence = find_best_match(
                requirement.name,
                candidate_evidence[category],
            )

            status = classify_similarity(
                similarity
            )

            if requirement.importance == "required":
                weight = 2.0
            else:
                weight = 1.0

            total_weight += weight
            total_score += (
                similarity * weight
            )

            requirement_matches.append(
                {
                    "requirement": requirement.name,
                    "importance": requirement.importance,
                    "category": category,
                    "similarity": round(
                        similarity,
                        3,
                    ),
                    "status": status,
                    "evidence": evidence,
                }
            )

    if total_weight == 0:
        overall_score = 0.0
    else:
        overall_score = (
            total_score / total_weight
        ) * 100

    return {
        "overall_score": round(
            overall_score,
            2,
        ),
        "requirement_matches": requirement_matches,
    }