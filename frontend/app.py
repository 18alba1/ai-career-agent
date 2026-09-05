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