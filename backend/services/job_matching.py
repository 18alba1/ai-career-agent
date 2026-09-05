from sentence_transformers import SentenceTransformer
from backend.schemas.job_requirements import JobRequirements
from backend.services.skill_normalization import normalize_skill


MODEL_NAME = (
    "sentence-transformers/"
    "paraphrase-multilingual-MiniLM-L12-v2"
)

embedding_model = SentenceTransformer(MODEL_NAME)

def calculate_skill_match(
    candidate_skills: list[str],
    job_description: str,
) -> dict:
    """
    Original keyword-based matching algorithm.

    This is kept as a baseline so we can compare
    keyword matching against semantic matching later.
    """

    normalized_job = job_description.lower()

    matched_skills = []
    missing_skills = []

    for skill in candidate_skills:

        normalized_skill = normalize_skill(skill)

        if normalized_skill in normalized_job:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    if candidate_skills:
        match_score = (
            len(matched_skills)
            / len(candidate_skills)
        ) * 100
    else:
        match_score = 0

    return {
        "match_score": round(match_score, 2),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
    }

def find_exact_skill_match(
    requirement: str,
    candidate_skills: list[str],
) -> str | None:
    """
    Look for an exact or normalized skill match.
    """

    normalized_requirement = normalize_skill(
        requirement
    )

    for skill in candidate_skills:

        if normalize_skill(skill) == normalized_requirement:
            return skill

    return None


def find_semantic_match(
    requirement: str,
    candidate_evidence: list[str],
) -> tuple[float, str | None]:
    """
    Find the candidate evidence that is semantically
    closest to the requirement.
    """

    if not candidate_evidence:
        return 0.0, None

    requirement_embedding = embedding_model.encode(
        requirement,
        normalize_embeddings=True,
    )

    evidence_embeddings = embedding_model.encode(
        candidate_evidence,
        normalize_embeddings=True,
    )

    similarities = (
        evidence_embeddings @ requirement_embedding
    )

    best_index = int(
        similarities.argmax()
    )

    best_similarity = float(
        similarities[best_index]
    )

    return (
        best_similarity,
        candidate_evidence[best_index],
    )

def calculate_semantic_match(
    candidate_skills: list[str],
    job_description: str,
) -> dict:
    """
    Calculate semantic similarity between the candidate's
    skills and the complete job description.
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
        0.0,
        min(100.0, semantic_score),
    )

    return {
        "semantic_score": round(
            semantic_score,
            2,
        ),
    }

def match_technical_requirement(
    requirement: str,
    candidate_skills: list[str],
) -> tuple[float, str | None]:
    """
    Match a technical requirement against candidate skills.

    Exact/normalized matches receive a perfect score.
    Otherwise semantic similarity is used.
    """

    exact_match = find_exact_skill_match(
        requirement,
        candidate_skills,
    )

    if exact_match:
        return 1.0, exact_match

    return find_semantic_match(
        requirement,
        candidate_skills,
    )


def match_text_requirement(
    requirement: str,
    candidate_evidence: list[str],
) -> tuple[float, str | None]:
    """
    Match a general textual requirement against
    candidate evidence using semantic similarity.
    """

    return find_semantic_match(
        requirement,
        candidate_evidence,
    )


def classify_similarity(
    similarity: float,
) -> str:

    if similarity >= 0.75:
        return "strong"

    if similarity >= 0.55:
        return "partial"

    return "missing"


def calculate_category_score(
    matches: list[dict],
) -> float:
    """
    Calculate the weighted score for one category.
    Required requirements count twice as much as preferred ones.
    """

    if not matches:
        return 0.0

    total_weight = 0.0
    weighted_score = 0.0

    for match in matches:

        if match["importance"] == "required":
            weight = 2.0
        else:
            weight = 1.0

        total_weight += weight

        weighted_score += (
            match["similarity"] * weight
        )

    if total_weight == 0:
        return 0.0

    return (
        weighted_score / total_weight
    ) * 100


def calculate_job_fit(
    candidate,
    requirements: JobRequirements,
) -> dict:

    requirement_matches = []

    category_matches = {
        "technical": [],
        "soft": [],
        "experience": [],
        "education": [],
        "languages": [],
    }

    # Candidate technical evidence.
    candidate_skills = list(
        candidate.skills or []
    )

    for project in candidate.projects or []:

        project_technologies = project.get(
            "technologies",
            [],
        )

        candidate_skills.extend(
            project_technologies
        )

    # Remove duplicate skills.
    candidate_skills = list(
        dict.fromkeys(candidate_skills)
    )

    # General evidence.
    experience_evidence = []

    for experience in candidate.experience or []:

        experience_evidence.append(
            (
                f"{experience.get('role', '')} "
                f"at {experience.get('company', '')}. "
                f"{experience.get('description', '')}"
            )
        )

    education_evidence = []

    for education in candidate.education or []:

        education_evidence.append(
            (
                f"{education.get('degree', '')} "
                f"at {education.get('institution', '')}. "
                f"{education.get('description', '')}"
            )
        )

    soft_evidence = []

    if candidate.summary:
        soft_evidence.append(
            candidate.summary
        )

    for experience in candidate.experience or []:

        description = experience.get(
            "description",
            "",
        )

        if description:
            soft_evidence.append(
                description
            )

    candidate_languages = list(
        candidate.languages or []
    )

    # -------------------------
    # Technical requirements
    # -------------------------

    for requirement in requirements.technical_skills:

        similarity, evidence = (
            match_technical_requirement(
                requirement.name,
                candidate_skills,
            )
        )

        match = {
            "requirement": requirement.name,
            "importance": requirement.importance,
            "category": "technical",
            "similarity": round(
                similarity,
                3,
            ),
            "status": classify_similarity(
                similarity
            ),
            "evidence": evidence,
        }

        requirement_matches.append(match)
        category_matches["technical"].append(match)

    # -------------------------
    # Soft skills
    # -------------------------

    for requirement in requirements.soft_skills:

        similarity, evidence = (
            match_text_requirement(
                requirement.name,
                soft_evidence,
            )
        )

        match = {
            "requirement": requirement.name,
            "importance": requirement.importance,
            "category": "soft",
            "similarity": round(
                similarity,
                3,
            ),
            "status": classify_similarity(
                similarity
            ),
            "evidence": evidence,
        }

        requirement_matches.append(match)
        category_matches["soft"].append(match)

    # -------------------------
    # Experience
    # -------------------------

    for requirement in (
        requirements.experience_requirements
    ):

        similarity, evidence = (
            match_text_requirement(
                requirement.name,
                experience_evidence,
            )
        )

        match = {
            "requirement": requirement.name,
            "importance": requirement.importance,
            "category": "experience",
            "similarity": round(
                similarity,
                3,
            ),
            "status": classify_similarity(
                similarity
            ),
            "evidence": evidence,
        }

        requirement_matches.append(match)
        category_matches["experience"].append(match)

    # -------------------------
    # Education
    # -------------------------

    for requirement in (
        requirements.education_requirements
    ):

        similarity, evidence = (
            match_text_requirement(
                requirement.name,
                education_evidence,
            )
        )

        match = {
            "requirement": requirement.name,
            "importance": requirement.importance,
            "category": "education",
            "similarity": round(
                similarity,
                3,
            ),
            "status": classify_similarity(
                similarity
            ),
            "evidence": evidence,
        }

        requirement_matches.append(match)
        category_matches["education"].append(match)

    # -------------------------
    # Languages
    # -------------------------

    for requirement in requirements.languages:

        exact_match = None

        normalized_requirement = normalize_skill(
            requirement.name
        )

        for language in candidate_languages:

            if normalize_skill(language) == normalized_requirement:
                exact_match = language
                break

        if exact_match:

            similarity = 1.0
            evidence = exact_match

        else:

            similarity = 0.0
            evidence = None

        match = {
            "requirement": requirement.name,
            "importance": requirement.importance,
            "category": "languages",
            "similarity": round(
                similarity,
                3,
            ),
            "status": classify_similarity(
                similarity
            ),
            "evidence": evidence,
        }

        requirement_matches.append(match)
        category_matches["languages"].append(match)

    # -------------------------
    # Category scores
    # -------------------------

    category_scores = {}

    for category, matches in category_matches.items():

        category_scores[category] = round(
            calculate_category_score(matches),
            2,
        )

    # -------------------------
    # Overall score
    # -------------------------

    category_weights = {
        "technical": 0.50,
        "experience": 0.20,
        "education": 0.10,
        "soft": 0.10,
        "languages": 0.10,
    }

    overall_score = 0.0
    total_weight = 0.0

    for category, weight in category_weights.items():

        if category_scores[category] > 0:
            overall_score += (
                category_scores[category]
                * weight
            )

            total_weight += weight

    if total_weight > 0:
        overall_score = (
            overall_score / total_weight
        )

    return {
        "overall_score": round(
            overall_score,
            2,
        ),
        "category_scores": category_scores,
        "requirement_matches": (
            requirement_matches
        ),
    }