import ollama
from backend.schemas.candidate import CandidateProfile

MODEL_NAME = "llama3:latest"

def create_candidate_profile(cv_text: str) -> CandidateProfile:

    print("\n===== CV TEXT SENT TO LLM =====")
    print(cv_text)
    print("================================\n")

    prompt = f"""
You are an expert CV information extraction system.

Your task is to extract structured information from the CV below.

IMPORTANT RULES:

1. Only use information explicitly stated in the CV.
2. Never invent or infer facts that are not supported by the CV.
3. Extract ALL relevant information.
4. Every field in the output should be populated when the CV contains
   information corresponding to that field.
5. Pay special attention to the different sections of the CV.

FIELD INSTRUCTIONS:

name:
- Extract the candidate's full name.

summary:
- Extract or summarize the professional summary.
- Only use information supported by the CV.

skills:
- Extract all technical and professional skills explicitly mentioned.
- Include programming languages, frameworks, libraries, databases,
  cloud technologies, AI/ML technologies, tools, platforms and other
  relevant technical skills.
- Also include important business/office tools if they appear in the
  skills section.

experience:
- Extract EVERY employment or work experience.
- The CV's "EMPLOYMENT HISTORY" section should primarily populate this field.
- Include company, role and a description.
- Include trainee programs and teaching assistant positions when they
  represent professional experience.

education:
- Extract EVERY education entry.
- Include the institution, degree/program and relevant description.

projects:
- Extract standalone projects mentioned in the CV.
- A bachelor thesis or thesis project should be treated as a project
  when it describes a specific technical project.
- Extract project name, description and technologies explicitly mentioned.

languages:
- Extract EVERY human language listed in the CV's language section.
- Do not confuse programming languages such as Python or Java with
  spoken languages.

CV:
----------------
{cv_text}
----------------
"""

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        format=CandidateProfile.model_json_schema(),
    )

    print("\n===== RAW LLM RESPONSE =====")
    print(response["message"]["content"])
    print("============================\n")

    profile = CandidateProfile.model_validate_json(
        response["message"]["content"]
    )

    print("\n===== PARSED PROFILE =====")
    print(profile)
    print("==========================\n")

    return profile