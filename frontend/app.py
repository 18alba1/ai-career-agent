import requests
import streamlit as st

st.title("AI Career Agent")

st.write("Your personal AI-powered career assistant.")

st.header("Upload your CV")

uploaded_file = st.file_uploader(
    "Choose your CV",
    type=["pdf", "docx"],
)

if uploaded_file is not None:

    st.write(f"Selected file: **{uploaded_file.name}**")

    if st.button("Process CV"):

        files = {
            "file": (
                uploaded_file.name,
                uploaded_file.getvalue(),
                uploaded_file.type,
            )
        }

        try:
            response = requests.post(
                "http://127.0.0.1:8000/upload-cv",
                files=files,
                timeout=30,
            )

            if response.status_code == 200:

                data = response.json()

                st.success(data["message"])

                st.subheader("Extracted CV text")

                st.text_area(
                    "CV text",
                    data["text"],
                    height=500,
                )

            else:

                error = response.json()

                st.error(
                    error.get(
                        "detail",
                        "Something went wrong.",
                    )
                )

        except requests.RequestException:
            st.error(
                "Could not connect to the FastAPI backend."
            )