import requests
import streamlit as st


API_URL = "http://127.0.0.1:8000"


st.title("AI Career Agent")

st.write(
    "Upload your CV and let AI create a structured candidate profile."
)


# ============================================================
# CV SECTION
# ============================================================

st.header("Upload your CV")

uploaded_file = st.file_uploader(
    "Choose your CV",
    type=["pdf", "docx"],
)


if uploaded_file is not None:

    st.write(f"Selected file: **{uploaded_file.name}**")

    if st.button("Analyze CV"):

        files = {
            "file": (
                uploaded_file.name,
                uploaded_file.getvalue(),
                uploaded_file.type,
            )
        }

        try:
            response = requests.post(
                f"{API_URL}/upload-cv",
                files=files,
                timeout=120,
            )

            if response.status_code == 200:

                profile = response.json()

                st.success("CV analyzed successfully!")

                st.header(profile["name"])

                st.subheader("Summary")
                st.write(profile["summary"])

                st.subheader("Skills")

                for skill in profile["skills"]:
                    st.write(f"• {skill}")

                st.subheader("Experience")

                for experience in profile["experience"]:
                    st.write(
                        f"### {experience['role']} — "
                        f"{experience['company']}"
                    )

                    st.write(experience["description"])

                st.subheader("Education")

                for education in profile["education"]:
                    st.write(
                        f"### {education['degree']} — "
                        f"{education['institution']}"
                    )

                    st.write(education["description"])

                st.subheader("Projects")

                for project in profile["projects"]:

                    st.write(f"### {project['name']}")

                    st.write(project["description"])

                    if project["technologies"]:
                        st.write(
                            "Technologies: "
                            + ", ".join(project["technologies"])
                        )

                st.subheader("Languages")

                for language in profile["languages"]:
                    st.write(f"• {language}")

            else:

                try:
                    error = response.json()

                    message = error.get(
                        "detail",
                        "Something went wrong.",
                    )

                except ValueError:
                    message = "Something went wrong."

                st.error(message)

        except requests.RequestException as error:

            st.error(
                f"Could not connect to the backend: {error}"
            )


# ============================================================
# JOB SECTION
# ============================================================

st.divider()

st.header("Add a Job")

job_title = st.text_input("Job title")

job_company = st.text_input("Company")

job_url = st.text_input(
    "Job URL (optional)"
)

job_description = st.text_area(
    "Job description",
    height=300,
)


if st.button("Save Job"):

    if (
        not job_title
        or not job_company
        or not job_description
    ):

        st.warning(
            "Please enter a title, company and job description."
        )

    else:

        job_data = {
            "title": job_title,
            "company": job_company,
            "description": job_description,
            "url": job_url or None,
        }

        try:

            response = requests.post(
                f"{API_URL}/jobs",
                json=job_data,
                timeout=30,
            )

            if response.status_code == 200:

                st.success("Job saved successfully!")

            else:

                try:
                    error = response.json()

                    message = error.get(
                        "detail",
                        "Could not save job.",
                    )

                except ValueError:
                    message = "Could not save job."

                st.error(message)

        except requests.RequestException:

            st.error(
                "Could not connect to the backend."
            )

# ============================================================
# JOB MATCHING SECTION
# ============================================================

st.divider()

st.header("Match Candidate to Job")

candidate_id = st.number_input(
    "Candidate ID",
    min_value=1,
    value=1,
    step=1,
)

job_id = st.number_input(
    "Job ID",
    min_value=1,
    value=1,
    step=1,
)


if st.button("Match Job"):

    try:

        response = requests.get(
            f"{API_URL}/match/{candidate_id}/{job_id}",
            timeout=30,
        )

        if response.status_code == 200:

            result = response.json()

            st.success("Job matching completed!")

            st.metric(
                "Match Score",
                f"{result['match_score']}%",
            )

            st.subheader("Matched Skills")

            if result["matched_skills"]:

                for skill in result["matched_skills"]:
                    st.write(f"✅ {skill}")

            else:

                st.write("No matching skills found.")

            st.subheader("Missing Skills")

            if result["missing_skills"]:

                for skill in result["missing_skills"]:
                    st.write(f"❌ {skill}")

            else:

                st.write("No missing skills.")

        else:

            try:
                error = response.json()

                message = error.get(
                    "detail",
                    "Could not match candidate to job.",
                )

            except ValueError:
                message = "Could not match candidate to job."

            st.error(message)

    except requests.RequestException:

        st.error(
            "Could not connect to the backend."
        )

# ============================================================
# SEMANTIC JOB MATCHING SECTION
# ============================================================

st.divider()

st.header("Semantic Job Matching")

semantic_candidate_id = st.number_input(
    "Candidate ID for semantic matching",
    min_value=1,
    value=1,
    step=1,
)

semantic_job_id = st.number_input(
    "Job ID for semantic matching",
    min_value=1,
    value=1,
    step=1,
)


if st.button("Run Semantic Matching"):

    try:

        response = requests.get(
            f"{API_URL}/semantic-match/"
            f"{semantic_candidate_id}/"
            f"{semantic_job_id}",
            timeout=120,
        )

        if response.status_code == 200:

            result = response.json()

            st.success(
                "Semantic matching completed!"
            )

            st.metric(
                "Semantic Similarity",
                f"{result['semantic_score']}%",
            )

        else:

            try:
                error = response.json()

                message = error.get(
                    "detail",
                    "Could not run semantic matching.",
                )

            except ValueError:

                message = (
                    "Could not run semantic matching."
                )

            st.error(message)

    except requests.RequestException:

        st.error(
            "Could not connect to the backend."
        )

# ============================================================
# JOB REQUIREMENTS SECTION
# ============================================================

st.divider()

st.header("Extract Job Requirements")

requirements_job_id = st.number_input(
    "Job ID for requirement extraction",
    min_value=1,
    value=1,
    step=1,
)


if st.button("Extract Requirements"):

    try:

        response = requests.get(
            f"{API_URL}/job-requirements/"
            f"{requirements_job_id}",
            timeout=120,
        )

        if response.status_code == 200:

            requirements = response.json()

            st.success(
                "Job requirements extracted successfully!"
            )

            st.subheader("Technical Skills")

            for requirement in requirements[
                "technical_skills"
            ]:

                importance = requirement["importance"]

                if importance == "required":
                    icon = "🔴"
                    label = "Required"
                else:
                    icon = "🟡"
                    label = "Preferred"

                st.write(
                    f"{icon} **{requirement['name']}** "
                    f"— {label}"
                )

            st.subheader("Soft Skills")

            for requirement in requirements[
                "soft_skills"
            ]:

                importance = requirement["importance"]

                if importance == "required":
                    icon = "🔴"
                    label = "Required"
                else:
                    icon = "🟡"
                    label = "Preferred"

                st.write(
                    f"{icon} **{requirement['name']}** "
                    f"— {label}"
                )

            st.subheader("Experience Requirements")

            for requirement in requirements[
                "experience_requirements"
            ]:

                importance = requirement["importance"]

                if importance == "required":
                    icon = "🔴"
                    label = "Required"
                else:
                    icon = "🟡"
                    label = "Preferred"

                st.write(
                    f"{icon} **{requirement['name']}** "
                    f"— {label}"
                )

            st.subheader("Education Requirements")

            for requirement in requirements[
                "education_requirements"
            ]:

                importance = requirement["importance"]

                if importance == "required":
                    icon = "🔴"
                    label = "Required"
                else:
                    icon = "🟡"
                    label = "Preferred"

                st.write(
                    f"{icon} **{requirement['name']}** "
                    f"— {label}"
                )

            st.subheader("Languages")

            for requirement in requirements[
                "languages"
            ]:

                importance = requirement["importance"]

                if importance == "required":
                    icon = "🔴"
                    label = "Required"
                else:
                    icon = "🟡"
                    label = "Preferred"

                st.write(
                    f"{icon} **{requirement['name']}** "
                    f"— {label}"
                )

        else:

            try:
                error = response.json()

                message = error.get(
                    "detail",
                    "Could not extract job requirements.",
                )

            except ValueError:
                message = (
                    "Could not extract job requirements."
                )

            st.error(message)

    except requests.RequestException:

        st.error(
            "Could not connect to the backend."
        )

# ============================================================
# JOB FIT ENGINE
# ============================================================

st.divider()

st.header("Job Fit Analysis")

fit_candidate_id = st.number_input(
    "Candidate ID",
    min_value=1,
    value=1,
    step=1,
    key="fit_candidate_id",
)

fit_job_id = st.number_input(
    "Job ID",
    min_value=1,
    value=1,
    step=1,
    key="fit_job_id",
)


if st.button("Calculate Job Fit"):

    try:

        response = requests.get(
            f"{API_URL}/job-fit/"
            f"{fit_candidate_id}/"
            f"{fit_job_id}",
            timeout=120,
        )

        if response.status_code == 200:

            result = response.json()

            st.success(
                "Job fit analysis completed!"
            )

            st.metric(
                "Overall Job Fit",
                f"{result['overall_score']}%",
            )

            st.subheader(
                "Category Scores"
            )

            category_scores = (
                result["category_scores"]
            )

            col1, col2 = st.columns(2)

            with col1:

                st.metric(
                    "Technical",
                    f"{category_scores['technical']}%",
                )

                st.metric(
                    "Experience",
                    f"{category_scores['experience']}%",
                )

                st.metric(
                    "Education",
                    f"{category_scores['education']}%",
                )

            with col2:

                st.metric(
                    "Soft Skills",
                    f"{category_scores['soft']}%",
                )

                st.metric(
                    "Languages",
                    f"{category_scores['languages']}%",
                )

            st.subheader(
                "Requirement Analysis"
            )

            for match in result[
                "requirement_matches"
            ]:

                if match["status"] == "strong":

                    icon = "✅"

                elif match["status"] == "partial":

                    icon = "🟡"

                else:

                    icon = "❌"

                st.write(
                    f"{icon} "
                    f"**{match['requirement']}** "
                    f"— {match['importance']} "
                    f"({match['similarity']:.0%})"
                )

                if match["evidence"]:

                    st.caption(
                        "Evidence: "
                        + match["evidence"]
                    )

        else:

            try:

                error = response.json()

                message = error.get(
                    "detail",
                    "Could not calculate job fit.",
                )

            except ValueError:

                message = (
                    "Could not calculate job fit."
                )

            st.error(message)

    except requests.RequestException:

        st.error(
            "Could not connect to the backend."
        )

# ============================================================
# CV TAILORING
# ============================================================

st.divider()

st.header("Tailor CV for Job")

tailor_candidate_id = st.number_input(
    "Candidate ID",
    min_value=1,
    value=1,
    step=1,
    key="tailor_candidate_id",
)

tailor_job_id = st.number_input(
    "Job ID",
    min_value=1,
    value=1,
    step=1,
    key="tailor_job_id",
)


if st.button("Tailor CV"):

    try:

        response = requests.get(
            f"{API_URL}/tailor-cv/"
            f"{tailor_candidate_id}/"
            f"{tailor_job_id}",
            timeout=120,
        )

        if response.status_code == 200:

            tailored_cv = response.json()

            st.success(
                "CV tailored successfully!"
            )

            st.subheader(
                "Professional Summary"
            )

            st.write(
                tailored_cv[
                    "professional_summary"
                ]
            )

            st.subheader(
                "Skills to Highlight"
            )

            for skill in tailored_cv[
                "skills_to_highlight"
            ]:

                st.write(
                    f"### {skill['name']}"
                )

                st.write(
                    skill["description"]
                )

            st.subheader(
                "Experience"
            )

            for experience in tailored_cv[
                "experience"
            ]:

                st.write(
                    f"### "
                    f"{experience['role']} — "
                    f"{experience['company']}"
                )

                st.write(
                    experience["description"]
                )

            st.subheader(
                "Projects"
            )

            for project in tailored_cv[
                "projects"
            ]:

                st.write(
                    f"### {project['name']}"
                )

                st.write(
                    project["description"]
                )

        else:

            try:

                error = response.json()

                message = error.get(
                    "detail",
                    "Could not tailor CV.",
                )

            except ValueError:

                message = (
                    "Could not tailor CV."
                )

            st.error(message)

    except requests.RequestException:

        st.error(
            "Could not connect to the backend."
        )

st.header("Generate Cover Letter")

cover_candidate_id = st.number_input(
    "Candidate ID",
    min_value=1,
    value=1,
    step=1,
    key="cover_candidate_id",
)

cover_job_id = st.number_input(
    "Job ID",
    min_value=1,
    value=1,
    step=1,
    key="cover_job_id",
)

if st.button("Generate Cover Letter", key="generate_cover_letter"):
    with st.spinner("Generating cover letter..."):

        try:
            response = requests.get(
                f"{API_URL}/cover-letter/"
                f"{cover_candidate_id}/"
                f"{cover_job_id}",
                timeout=300,
            )

            if response.status_code == 200:
                cover_letter = response.json()

                st.success("Cover letter generated successfully!")

                st.subheader(cover_letter["subject"])

                st.write(cover_letter["greeting"])

                st.write(cover_letter["body"])

                st.write(cover_letter["closing"])

            else:
                st.error(
                    f"Error {response.status_code}: "
                    f"{response.text}"
                )

        except requests.exceptions.RequestException as error:
            st.error(f"Could not connect to the backend: {error}")

# ============================================================
# CANDIDATE RAG
# ============================================================

st.header("Ask the Candidate")

rag_candidate_id = st.number_input(
    "Candidate ID",
    min_value=1,
    value=5,
    step=1,
    key="rag_candidate_id",
)

rag_question = st.text_input(
    "Ask a question about the candidate",
    placeholder="What experience does the candidate have with AI?",
    key="rag_question",
)

rag_top_k = st.slider(
    "Sources per category",
    min_value=1,
    max_value=3,
    value=2,
    key="rag_top_k",
)

if st.button("Ask AI", key="ask_candidate_rag"):

    if not rag_question.strip():
        st.warning("Please enter a question.")

    else:
        with st.spinner("Searching candidate knowledge and generating answer..."):

            try:
                response = requests.get(
                    f"{API_URL}/candidate-rag/{rag_candidate_id}",
                    params={
                        "question": rag_question,
                        "top_k": rag_top_k,
                    },
                    timeout=300,
                )

                if response.status_code == 200:

                    result = response.json()

                    st.subheader("Answer")

                    st.write(result["answer"])

                    st.subheader("Sources")

                    for source in result["sources"]:

                        st.markdown(
                            f"**{source['category'].capitalize()}**"
                        )

                        st.write(source["text"])

                        st.divider()

                else:
                    st.error(
                        f"Error {response.status_code}: "
                        f"{response.text}"
                    )

            except requests.exceptions.RequestException as error:
                st.error(
                    f"Could not connect to the backend: {error}"
                )

# ============================================================
# INTERVIEW QUESTION GENERATOR
# ============================================================

st.header("Generate Interview Questions")

interview_candidate_id = st.number_input(
    "Candidate ID",
    min_value=1,
    value=5,
    step=1,
    key="interview_candidate_id",
)

interview_job_id = st.number_input(
    "Job ID",
    min_value=1,
    value=2,
    step=1,
    key="interview_job_id",
)

number_of_questions = st.slider(
    "Number of questions",
    min_value=4,
    max_value=15,
    value=8,
    key="number_of_interview_questions",
)

if st.button(
    "Generate Interview Questions",
    key="generate_interview_questions",
):

    with st.spinner(
        "Generating job-specific interview questions..."
    ):

        try:
            response = requests.get(
                (
                    f"{API_URL}/interview-questions/"
                    f"{interview_candidate_id}/"
                    f"{interview_job_id}"
                ),
                params={
                    "number_of_questions": number_of_questions,
                },
                timeout=300,
            )

            if response.status_code == 200:

                result = response.json()

                st.success(
                    "Interview questions generated successfully!"
                )

                for index, question in enumerate(
                    result["questions"],
                    start=1,
                ):

                    st.subheader(
                        f"{index}. "
                        f"{question['category'].capitalize()}"
                    )

                    st.write(
                        question["question"]
                    )

                    st.caption(
                        f"Purpose: {question['purpose']}"
                    )

                    st.caption(
                        f"Basis: {question['basis']}"
                    )

                    st.divider()

            else:

                st.error(
                    f"Error {response.status_code}: "
                    f"{response.text}"
                )

        except requests.exceptions.RequestException as error:

            st.error(
                f"Could not connect to the backend: {error}"
            )

# ============================================================
# INTERACTIVE AI INTERVIEW
# ============================================================

st.header("AI Interview")

interactive_candidate_id = st.number_input(
    "Candidate ID",
    min_value=1,
    value=5,
    step=1,
    key="interactive_candidate_id",
)

interactive_job_id = st.number_input(
    "Job ID",
    min_value=1,
    value=2,
    step=1,
    key="interactive_job_id",
)


# ------------------------------------------------------------
# INITIALIZE INTERVIEW STATE
# ------------------------------------------------------------

if "interview_history" not in st.session_state:
    st.session_state.interview_history = []

if "interview_evaluations" not in st.session_state:
    st.session_state.interview_evaluations = []

if "current_interview_question" not in st.session_state:
    st.session_state.current_interview_question = None

if "current_interview_evaluation" not in st.session_state:
    st.session_state.current_interview_evaluation = None

if "interview_started" not in st.session_state:
    st.session_state.interview_started = False

if "answer_submitted" not in st.session_state:
    st.session_state.answer_submitted = False

if "interview_question_number" not in st.session_state:
    st.session_state.interview_question_number = 0

if "interview_report" not in st.session_state:
    st.session_state.interview_report = None

if "voice_transcript" not in st.session_state:
    st.session_state.voice_transcript = None

if "voice_audio" not in st.session_state:
    st.session_state.voice_audio = None


# ------------------------------------------------------------
# START / RESET INTERVIEW
# ------------------------------------------------------------

col1, col2 = st.columns(2)


with col1:

    if st.button(
        "Start Interview",
        key="start_interview",
    ):

        with st.spinner(
            "Starting interview..."
        ):

            try:
                response = requests.post(
                    (
                        f"{API_URL}/interview/next/"
                        f"{interactive_candidate_id}/"
                        f"{interactive_job_id}"
                    ),
                    json={
                        "history": []
                    },
                    timeout=300,
                )

                if response.status_code == 200:

                    result = response.json()

                    st.session_state.interview_history = []
                    st.session_state.interview_evaluations = []

                    st.session_state.current_interview_question = (
                        result
                    )

                    st.session_state.current_interview_evaluation = (
                        None
                    )

                    st.session_state.interview_report = None

                    st.session_state.interview_started = True

                    st.session_state.answer_submitted = False

                    st.session_state.interview_question_number = 1

                    st.session_state.voice_transcript = None
                    st.session_state.voice_audio = None

                    st.rerun()

                else:

                    st.error(
                        f"Error {response.status_code}: "
                        f"{response.text}"
                    )

            except requests.exceptions.RequestException as error:

                st.error(
                    f"Could not connect to the backend: {error}"
                )


with col2:

    if st.button(
        "Reset Interview",
        key="reset_interview",
    ):

        st.session_state.interview_history = []

        st.session_state.interview_evaluations = []

        st.session_state.current_interview_question = None

        st.session_state.current_interview_evaluation = None

        st.session_state.interview_report = None

        st.session_state.interview_started = False

        st.session_state.answer_submitted = False

        st.session_state.interview_question_number = 0

        st.session_state.voice_transcript = None
        st.session_state.voice_audio = None

        st.rerun()


# ------------------------------------------------------------
# ACTIVE INTERVIEW
# ------------------------------------------------------------

if st.session_state.interview_started:

    question_data = (
        st.session_state.current_interview_question
    )

    if question_data:

        question_number = (
            st.session_state.interview_question_number
        )

        st.subheader(
            f"Question {question_number}"
        )

        st.write(
            question_data["question"]
        )

        st.caption(
            f"Category: {question_data['category']}"
        )


        # ----------------------------------------------------
        # ANSWER INPUT
        # ----------------------------------------------------

        if not st.session_state.answer_submitted:

            st.markdown("### Answer the question")

            input_mode = st.radio(
                "Choose answer method",
                [
                    "Voice",
                    "Text",
                ],
                horizontal=True,
                key=f"answer_mode_{question_number}",
            )


            # =================================================
            # VOICE ANSWER
            # =================================================

            if input_mode == "Voice":

                st.write(
                    "Record your answer below."
                )

                audio_value = st.audio_input(
                    "Record answer",
                    sample_rate=16000,
                    key=f"voice_answer_{question_number}",
                )

                if audio_value:

                    st.audio(
                        audio_value,
                        format="audio/wav",
                    )

                    if st.button(
                        "Transcribe Answer",
                        key=(
                            f"transcribe_answer_"
                            f"{question_number}"
                        ),
                    ):

                        with st.spinner(
                            "Transcribing your answer..."
                        ):

                            try:

                                response = requests.post(
                                    f"{API_URL}/transcribe-audio",
                                    files={
                                        "file": (
                                            "answer.wav",
                                            audio_value.getvalue(),
                                            "audio/wav",
                                        )
                                    },
                                    timeout=300,
                                )

                                if response.status_code == 200:

                                    result = response.json()

                                    transcript = (
                                        result["transcript"]
                                    )

                                    st.session_state.voice_transcript = (
                                        transcript
                                    )

                                    st.session_state.voice_audio = (
                                        audio_value.getvalue()
                                    )

                                    st.success(
                                        "Answer transcribed successfully."
                                    )

                                    st.rerun()

                                else:

                                    st.error(
                                        f"Error {response.status_code}: "
                                        f"{response.text}"
                                    )

                            except requests.exceptions.RequestException as error:

                                st.error(
                                    "Could not connect to the "
                                    f"backend: {error}"
                                )


                # --------------------------------------------
                # SHOW TRANSCRIPT
                # --------------------------------------------

                if st.session_state.voice_transcript:

                    st.subheader(
                        "Transcript"
                    )

                    st.write(
                        st.session_state.voice_transcript
                    )

                    st.caption(
                        "Review the transcript before submitting "
                        "your answer."
                    )

                    if st.button(
                        "Submit Voice Answer",
                        key=(
                            f"submit_voice_answer_"
                            f"{question_number}"
                        ),
                    ):

                        answer = (
                            st.session_state.voice_transcript
                        )

                        if not answer.strip():

                            st.warning(
                                "The transcription is empty. "
                                "Please record your answer again."
                            )

                        else:

                            current_question = (
                                question_data["question"]
                            )

                            with st.spinner(
                                "Evaluating your answer..."
                            ):

                                try:

                                    response = requests.post(
                                        (
                                            f"{API_URL}/interview/"
                                            f"evaluate/"
                                            f"{interactive_candidate_id}/"
                                            f"{interactive_job_id}"
                                        ),
                                        params={
                                            "question": current_question,
                                            "answer": answer,
                                            "question_category": (
                                                question_data["category"]
                                            ),
                                            "question_basis": (
                                                question_data["basis"]
                                            ),
                                        },
                                        timeout=300,
                                    )

                                    if response.status_code == 200:

                                        evaluation = (
                                            response.json()
                                        )

                                        st.session_state.interview_history.append(
                                            {
                                                "question": current_question,
                                                "answer": answer,
                                                "category": (
                                                    question_data["category"]
                                                ),
                                                "basis": (
                                                    question_data["basis"]
                                                ),
                                            }
                                        )

                                        st.session_state.interview_evaluations.append(
                                            evaluation
                                        )

                                        st.session_state.current_interview_evaluation = (
                                            evaluation
                                        )

                                        st.session_state.answer_submitted = (
                                            True
                                        )

                                        st.session_state.voice_transcript = (
                                            None
                                        )

                                        st.session_state.voice_audio = (
                                            None
                                        )

                                        st.rerun()

                                    else:

                                        st.error(
                                            f"Error "
                                            f"{response.status_code}: "
                                            f"{response.text}"
                                        )

                                except requests.exceptions.RequestException as error:

                                    st.error(
                                        "Could not connect to "
                                        f"the backend: {error}"
                                    )


            # =================================================
            # TEXT ANSWER
            # =================================================

            else:

                answer = st.text_area(
                    "Your answer",
                    height=200,
                    key=(
                        f"interview_answer_"
                        f"{question_number}"
                    ),
                )

                if st.button(
                    "Submit Text Answer",
                    key=(
                        f"submit_text_answer_"
                        f"{question_number}"
                    ),
                ):

                    if not answer.strip():

                        st.warning(
                            "Please provide an answer before continuing."
                        )

                    else:

                        current_question = (
                            question_data["question"]
                        )

                        with st.spinner(
                            "Evaluating your answer..."
                        ):

                            try:

                                response = requests.post(
                                    (
                                        f"{API_URL}/interview/"
                                        f"evaluate/"
                                        f"{interactive_candidate_id}/"
                                        f"{interactive_job_id}"
                                    ),
                                    params={
                                        "question": current_question,
                                        "answer": answer,
                                        "question_category": (
                                            question_data["category"]
                                        ),
                                        "question_basis": (
                                            question_data["basis"]
                                        ),
                                    },
                                    timeout=300,
                                )

                                if response.status_code == 200:

                                    evaluation = (
                                        response.json()
                                    )

                                    st.session_state.interview_history.append(
                                        {
                                            "question": current_question,
                                            "answer": answer,
                                            "category": (
                                                question_data["category"]
                                            ),
                                            "basis": (
                                                question_data["basis"]
                                            ),
                                        }
                                    )

                                    st.session_state.interview_evaluations.append(
                                        evaluation
                                    )

                                    st.session_state.current_interview_evaluation = (
                                        evaluation
                                    )

                                    st.session_state.answer_submitted = (
                                        True
                                    )

                                    st.rerun()

                                else:

                                    st.error(
                                        f"Error "
                                        f"{response.status_code}: "
                                        f"{response.text}"
                                    )

                            except requests.exceptions.RequestException as error:

                                st.error(
                                    "Could not connect to "
                                    f"the backend: {error}"
                                )


        # ----------------------------------------------------
        # ANSWER EVALUATION
        # ----------------------------------------------------

        if (
            st.session_state.answer_submitted
            and st.session_state.current_interview_evaluation
        ):

            evaluation = (
                st.session_state.current_interview_evaluation
            )

            st.divider()

            st.subheader(
                "Answer Evaluation"
            )

            st.metric(
                "Overall Score",
                f"{evaluation['overall_score']}/10",
            )

            col1, col2 = st.columns(2)

            with col1:

                st.write(
                    f"**Relevance:** "
                    f"{evaluation['relevance_score']}/10"
                )

                st.write(
                    f"**Clarity:** "
                    f"{evaluation['clarity_score']}/10"
                )

            with col2:

                st.write(
                    f"**{evaluation['category_specific_label']}:** "
                    f"{evaluation['category_specific_score']}/10"
                )

                st.write(
                    f"**Grounding:** "
                    f"{evaluation['grounding_score']}/10"
                )

            st.subheader(
                "Strengths"
            )

            for strength in evaluation["strengths"]:

                st.write(
                    f"✅ {strength}"
                )

            st.subheader(
                "Areas to Improve"
            )

            for improvement in evaluation["improvements"]:

                st.write(
                    f"→ {improvement}"
                )

            st.subheader(
                "Feedback"
            )

            st.write(
                evaluation["feedback"]
            )

            st.divider()


            # =================================================
            # CONTINUE / FINISH
            # =================================================

            col1, col2 = st.columns(2)


            # -------------------------------------------------
            # CONTINUE
            # -------------------------------------------------

            with col1:

                if st.button(
                    "Continue Interview",
                    key=(
                        f"continue_interview_"
                        f"{question_number}"
                    ),
                ):

                    with st.spinner(
                        "Generating the next question..."
                    ):

                        try:

                            response = requests.post(
                                (
                                    f"{API_URL}/interview/"
                                    f"next/"
                                    f"{interactive_candidate_id}/"
                                    f"{interactive_job_id}"
                                ),
                                json={
                                    "history": (
                                        st.session_state.interview_history
                                    )
                                },
                                timeout=300,
                            )

                            if response.status_code == 200:

                                next_question = (
                                    response.json()
                                )

                                st.session_state.current_interview_question = (
                                    next_question
                                )

                                st.session_state.current_interview_evaluation = (
                                    None
                                )

                                st.session_state.answer_submitted = (
                                    False
                                )

                                st.session_state.voice_transcript = (
                                    None
                                )

                                st.session_state.voice_audio = (
                                    None
                                )

                                st.session_state.interview_question_number += 1

                                st.rerun()

                            else:

                                st.error(
                                    f"Error "
                                    f"{response.status_code}: "
                                    f"{response.text}"
                                )

                        except requests.exceptions.RequestException as error:

                            st.error(
                                "Could not connect to "
                                f"the backend: {error}"
                            )


            # -------------------------------------------------
            # FINISH
            # -------------------------------------------------

            with col2:

                if st.button(
                    "Finish Interview",
                    key=(
                        f"finish_interview_"
                        f"{question_number}"
                    ),
                ):

                    with st.spinner(
                        "Generating your final interview report..."
                    ):

                        try:

                            response = requests.post(
                                (
                                    f"{API_URL}/interview/"
                                    f"report/"
                                    f"{interactive_candidate_id}/"
                                    f"{interactive_job_id}"
                                ),
                                json={
                                    "history": (
                                        st.session_state.interview_history
                                    ),
                                    "evaluations": (
                                        st.session_state.interview_evaluations
                                    ),
                                },
                                timeout=300,
                            )

                            if response.status_code == 200:

                                st.session_state.interview_report = (
                                    response.json()
                                )

                                st.rerun()

                            else:

                                st.error(
                                    f"Error "
                                    f"{response.status_code}: "
                                    f"{response.text}"
                                )

                        except requests.exceptions.RequestException as error:

                            st.error(
                                "Could not connect to "
                                f"the backend: {error}"
                            )


# ------------------------------------------------------------
# FINAL INTERVIEW REPORT
# ------------------------------------------------------------

if st.session_state.interview_report:

    report = st.session_state.interview_report

    st.divider()

    st.header(
        "Final Interview Report"
    )

    st.metric(
        "Overall Score",
        f"{report['overall_score']}/10",
    )

    col1, col2 = st.columns(2)

    with col1:

        st.write(
            f"**Technical:** "
            f"{report['technical_score']}/10"
        )

        st.write(
            f"**Behavioral:** "
            f"{report['behavioral_score']}/10"
        )

    with col2:

        st.write(
            f"**Communication:** "
            f"{report['communication_score']}/10"
        )

        st.write(
            f"**Grounding:** "
            f"{report['grounding_score']}/10"
        )

    st.subheader(
        "Summary"
    )

    st.write(
        report["summary"]
    )

    st.subheader(
        "Strongest Answers"
    )

    for answer in report["strongest_answers"]:

        st.write(
            f"✅ {answer}"
        )

    st.subheader(
        "Weakest Answers"
    )

    for answer in report["weakest_answers"]:

        st.write(
            f"⚠️ {answer}"
        )

    st.subheader(
        "Recurring Strengths"
    )

    for strength in report["recurring_strengths"]:

        st.write(
            f"✅ {strength}"
        )

    st.subheader(
        "Recurring Weaknesses"
    )

    for weakness in report["recurring_weaknesses"]:

        st.write(
            f"→ {weakness}"
        )

    st.subheader(
        "Recommendations"
    )

    for recommendation in report["recommendations"]:

        st.write(
            f"💡 {recommendation}"
        )


# ------------------------------------------------------------
# INTERVIEW HISTORY
# ------------------------------------------------------------

if (
    st.session_state.interview_started
    and st.session_state.interview_history
):

    st.divider()

    st.subheader(
        "Interview History"
    )

    for index, turn in enumerate(
        st.session_state.interview_history,
        start=1,
    ):

        st.markdown(
            f"**Question {index}**"
        )

        st.write(
            turn["question"]
        )

        st.markdown(
            "**Your answer**"
        )

        st.write(
            turn["answer"]
        )

        st.divider()