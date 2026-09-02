import requests
import streamlit as st

st.title("AI Career Agent")

st.write("Your personal AI-powered career assistant.")

if st.button("Test Backend"):
    response = requests.get("http://127.0.0.1:8000/")

    if response.status_code == 200:
        data = response.json()
        st.success(data["message"])
    else:
        st.error("Could not connect to backend.")