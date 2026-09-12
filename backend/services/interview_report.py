import json

import ollama

from backend.schemas.interview_report import InterviewReport

MODEL_NAME = "llama3:latest"


def _average(values: list[float]) -> float:
    if not values:
        return 0.0

    return round(sum(values) / len(values), 1)


def _clamp_score(score: float) -> float:
    return max(1.0, min(10.0, round(score, 1)))


def generate_interview_report(
    candidate,
    job,
    history: list,
    evaluations: list,
) -> InterviewReport:

    if not history:
        raise ValueError(
            "Interview history cannot be empty."
        )

    if len(history) != len(evaluations):
        raise ValueError(
            "Interview history and evaluations must have "
            "the same number of items."
        )

    # --------------------------------------------------------
    # Build structured interview data
    # --------------------------------------------------------

    interview_data = []

    technical_scores = []
    behavioral_scores = []
    communication_scores = []
    grounding_scores = []

    for index, (turn, evaluation) in enumerate(
        zip(history, evaluations),
        start=1,
    ):

        category = turn.get(
            "category",
            "unknown",
        )

        category_specific_score = evaluation.get(
            "category_specific_score",
            0,
        )

        category_specific_label = evaluation.get(
            "category_specific_label",
            "",
        )

        communication_score = evaluation.get(
            "clarity_score",
            0,
        )

        grounding_score = evaluation.get(
            "grounding_score",
            0,
        )

        # ----------------------------------------------------
        # Category-specific aggregation
        # ----------------------------------------------------

        if category in {"technical", "project"}:

            technical_scores.append(
                category_specific_score
            )

        if category == "behavioral":

            behavioral_scores.append(
                category_specific_score
            )

        communication_scores.append(
            communication_score
        )

        grounding_scores.append(
            grounding_score
        )

        interview_data.append(
            {
                "question_number": index,
                "category": category,
                "question": turn["question"],
                "answer": turn["answer"],
                "evaluation": evaluation,
            }
        )

    # --------------------------------------------------------
    # Calculate deterministic scores
    # --------------------------------------------------------

    technical_score = _average(
        technical_scores
    )

    behavioral_score = _average(
        behavioral_scores
    )

    communication_score = _average(
        communication_scores
    )

    grounding_score = _average(
        grounding_scores
    )

    # If there were no behavioral questions,
    # use the available evaluation data instead of returning 0.
    if not behavioral_scores:

        behavioral_values = [
            evaluation.get(
                "category_specific_score",
                evaluation.get(
                    "relevance_score",
                    0,
                ),
            )
            for evaluation, turn in zip(
                evaluations,
                history,
            )
            if turn.get("category") == "motivation"
        ]

        if behavioral_values:

            behavioral_score = _average(
                behavioral_values
            )

        else:

            behavioral_score = _average(
                [
                    evaluation.get(
                        "relevance_score",
                        0,
                    )
                    for evaluation in evaluations
                ]
            )

    # Calculate overall score from actual dimensions.
    overall_score = _average(
        [
            technical_score,
            behavioral_score,
            communication_score,
            grounding_score,
        ]
    )

    overall_score = _clamp_score(
        overall_score
    )

    # --------------------------------------------------------
    # Find strongest and weakest answers deterministically
    # --------------------------------------------------------

    scored_answers = []

    for index, (turn, evaluation) in enumerate(
        zip(history, evaluations),
        start=1,
    ):

        answer_score = _average(
            [
                evaluation.get(
                    "overall_score",
                    0,
                ),
                evaluation.get(
                    "relevance_score",
                    0,
                ),
                evaluation.get(
                    "clarity_score",
                    0,
                ),
                evaluation.get(
                    "grounding_score",
                    0,
                ),
            ]
        )

        scored_answers.append(
            {
                "question_number": index,
                "score": answer_score,
                "question": turn["question"],
                "category": turn.get(
                    "category",
                    "unknown",
                ),
            }
        )

    strongest_answers = [
        (
            f"Question {item['question_number']} "
            f"({item['category']}): "
            f"{item['score']}/10"
        )
        for item in sorted(
            scored_answers,
            key=lambda item: item["score"],
            reverse=True,
        )[:2]
    ]

    weakest_answers = [
        (
            f"Question {item['question_number']} "
            f"({item['category']}): "
            f"{item['score']}/10"
        )
        for item in sorted(
            scored_answers,
            key=lambda item: item["score"],
        )[:2]
    ]

    # --------------------------------------------------------
    # Ask Ollama only for qualitative synthesis
    # --------------------------------------------------------

    prompt = f"""
You are summarizing a completed job interview.

IMPORTANT:
The numerical scores have already been calculated by the system.
Do NOT change or recalculate them.

Your job is ONLY to identify recurring patterns and provide
constructive qualitative feedback.

TARGET JOB:

{json.dumps(
    {
        "title": job.title,
        "company": job.company,
    },
    ensure_ascii=False,
    indent=2,
)}

INTERVIEW DATA:

{json.dumps(
    interview_data,
    ensure_ascii=False,
    indent=2,
)}

SYSTEM-CALCULATED SCORES:

{json.dumps(
    {
        "overall_score": overall_score,
        "technical_score": technical_score,
        "behavioral_score": behavioral_score,
        "communication_score": communication_score,
        "grounding_score": grounding_score,
    },
    ensure_ascii=False,
    indent=2,
)}

STRONGEST ANSWERS:

{json.dumps(
    strongest_answers,
    ensure_ascii=False,
    indent=2,
)}

WEAKEST ANSWERS:

{json.dumps(
    weakest_answers,
    ensure_ascii=False,
    indent=2,
)}

Your task:

1. Identify recurring strengths across the interview.
2. Identify recurring weaknesses across the interview.
3. Give concrete recommendations for improvement.
4. Write a concise overall summary.

IMPORTANT:

- Base everything on the actual interview answers.
- Do not invent experience.
- Do not claim the candidate lacks a skill unless the interview
  provides evidence for that conclusion.
- Do not give generic advice.
- Recommendations should be specific and actionable.
- Do not request metrics unless the interview question actually
  required measurable impact.
- Do not change any numerical score.

Return ONLY valid JSON:

{{
    "recurring_strengths": [
        "Strength 1",
        "Strength 2"
    ],
    "recurring_weaknesses": [
        "Weakness 1",
        "Weakness 2"
    ],
    "recommendations": [
        "Recommendation 1",
        "Recommendation 2"
    ],
    "summary": "Overall interview assessment."
}}
"""

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a constructive interview coach. "
                    "Summarize only patterns supported by the "
                    "interview evidence. Never invent facts. "
                    "Always return valid JSON."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        format="json",
        options={
            "temperature": 0,
        },
    )

    raw_response = response["message"]["content"]

    try:
        qualitative_report = json.loads(
            raw_response
        )
    except json.JSONDecodeError as error:
        raise ValueError(
            "The LLM returned invalid interview report JSON."
        ) from error

    return InterviewReport(
        overall_score=overall_score,
        technical_score=technical_score,
        behavioral_score=behavioral_score,
        communication_score=communication_score,
        grounding_score=grounding_score,
        strongest_answers=strongest_answers,
        weakest_answers=weakest_answers,
        recurring_strengths=qualitative_report.get(
            "recurring_strengths",
            [],
        ),
        recurring_weaknesses=qualitative_report.get(
            "recurring_weaknesses",
            [],
        ),
        recommendations=qualitative_report.get(
            "recommendations",
            [],
        ),
        summary=qualitative_report.get(
            "summary",
            "No summary was generated.",
        ),
    )