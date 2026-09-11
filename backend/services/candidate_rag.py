import ollama

from backend.database.database import SessionLocal
from backend.services.candidate_retrieval import retrieve_candidate_chunks
from backend.services.query_classifier import classify_candidate_query

MODEL_NAME = "llama3:latest"


def answer_candidate_question(
    candidate_id: int,
    question: str,
    top_k: int = 2,
) -> dict:

    db = SessionLocal()

    try:
        categories = classify_candidate_query(question)

        chunks = retrieve_candidate_chunks(
            db=db,
            candidate_id=candidate_id,
            query=question,
            top_k=top_k,
            categories=categories if categories else None,
        )

        if not chunks:
            return {
                "answer": "No relevant candidate information was found.",
                "sources": [],
            }

        unique_chunks = []

        seen_ids = set()

        for chunk in chunks:
            if chunk.id not in seen_ids:
                unique_chunks.append(chunk)
                seen_ids.add(chunk.id)

        context = "\n\n".join(
            (
                f"[Source: {chunk.category}]\n"
                f"{chunk.text}"
            )
            for chunk in unique_chunks
        )

        prompt = f"""
You are an assistant that answers questions about a job candidate.

Use ONLY the information in the provided context.

You may use information about:
- Work experience
- Projects
- Skills
- Education
- Languages
- Candidate summary

Treat relevant projects as project experience and skills as evidence
of technical capabilities.

Do not invent:
- skills
- experience
- technologies
- qualifications
- achievements
- education
- languages
- years of experience

Do not claim professional work experience if the context only
describes a project or skill.

Distinguish clearly between:
- professional work experience
- project experience
- technical skills
- education

Do not mention:
- context numbers
- retrieval
- vector search
- internal source labels
- the fact that you were given context

Answer naturally and professionally.

If the information cannot be found in the context, say:
"The information is not available in the candidate profile."

CANDIDATE CONTEXT:

{context}

QUESTION:

{question}

Answer clearly and professionally.
"""

        response = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Answer questions using only the provided "
                        "candidate context."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            options={
                "temperature": 0,
            },
        )

        sources = [
            {
                "id": chunk.id,
                "category": chunk.category,
                "text": chunk.text,
            }
            for chunk in unique_chunks
        ]

        return {
            "answer": response["message"]["content"],
            "sources": sources,
        }

    finally:
        db.close()