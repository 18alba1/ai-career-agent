# AI Career Agent

AI Career Agent is an end-to-end AI application that helps job seekers analyze opportunities, tailor application materials, practice interviews, and interact with their own career profile.

The project combines a FastAPI backend, React frontend, PostgreSQL with vector search, local LLM inference, retrieval-augmented generation (RAG), semantic matching, speech-to-text, and text-to-speech.

The goal is to build a practical AI system around a real user workflow rather than a standalone chatbot.

---

## Features

### Candidate Profile

Upload a CV and automatically create a structured candidate profile containing:

- Summary
- Skills
- Work experience
- Education
- Projects
- Languages

Candidate information is stored in PostgreSQL and also embedded for semantic retrieval.

---

### Job Management

Save job opportunities and keep the full job description available for analysis.

Each job can be used throughout the application workflow.

---

### Job Requirements

The system extracts structured requirements from a job description, including:

- Technical skills
- Soft skills
- Experience
- Education
- Languages

Requirements are classified as required or preferred.

---

### Job Fit Analysis

Compare a candidate against a specific job using both exact matching and semantic similarity.

The application produces:

- Overall match score
- Category scores
- Requirement-by-requirement matches
- Similarity scores
- Evidence from the candidate profile

Example categories:

```text
Technical
Soft Skills
Experience
Education
Languages
```

---

### CV Tailoring

Generate a job-specific version of the candidate's CV based on:

- Candidate profile
- Job description
- Extracted job requirements

The generated CV can be reviewed in the application, copied, or downloaded as a PDF.

---

### Cover Letter Generation

Generate a job-specific cover letter based on the selected candidate and job.

The result includes:

- Subject
- Greeting
- Body
- Closing

The cover letter can be copied or downloaded as a PDF.

---

### Career Assistant

Career Assistant is a grounded conversational interface over the candidate's own profile.

Example questions:

```text
What are my strongest technical skills?

What experience do I have with AI and automation?

Which projects are most relevant for an AI Engineer role?

Give me examples from my background that I could use in an interview.
```

The assistant uses RAG to retrieve relevant candidate information before generating an answer.

Sources used for the answer are displayed in the interface.

---

### AI Interview

Practice interviews for a specific job with an adaptive AI interviewer.

The interview supports:

- English and Swedish
- Behavioral questions
- Technical questions
- Adaptive follow-up questions
- Think-time configuration
- Voice answers
- Automatic silence detection
- Manual "End Answer"
- Transcript review and editing
- Answer evaluation
- Final interview report

---

### Voice Interaction

The interview system supports both speech recognition and speech synthesis.

Speech-to-text uses Faster-Whisper.

Text-to-speech uses Piper.

This allows the interview experience to operate as a voice-based interaction rather than only a text chat.

---

## Architecture

IMAGE

---

## RAG Architecture

The Career Assistant and candidate-grounded functionality use a retrieval-augmented generation approach.

```text
Candidate CV
     ↓
CV text extraction
     ↓
Structured candidate profile
     ↓
Categorized information
     ↓
Embeddings
     ↓
PostgreSQL + pgvector
     ↓
Semantic retrieval
     ↓
Relevant candidate information
     ↓
Local LLM
     ↓
Grounded answer + sources
```

The goal is to ground generated answers in the candidate's actual experience instead of relying only on the language model's general knowledge.

---

## Job Matching

Job Fit combines structured requirement matching with semantic similarity.

A simplified version of the flow is:

```text
Job Description
       ↓
Requirement Extraction
       ↓
Technical / Soft / Experience / Education / Language
       ↓
Candidate Profile
       ↓
Exact Skill Matching
       +
Semantic Similarity
       ↓
Category Scores
       ↓
Overall Job Fit
```

This allows the system to distinguish between:

```text
Exact Match
Python → Python

Semantic Match
"building retrieval systems"
        ↕
"RAG applications"
```

---

## Interview Architecture

The interview system is designed as an adaptive loop:

```text
Candidate + Job
      ↓
Interview Context
      ↓
AI Question
      ↓
Candidate Answer
      ↓
Speech-to-Text
      ↓
Transcript Review
      ↓
Answer Evaluation
      ↓
Updated Interview Context
      ↓
Next Question
      ↓
...
      ↓
Final Interview Report
```

The next question can use information from the candidate's latest answer rather than simply following a fixed list of questions.

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Lucide React
- React PDF Renderer

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy

### AI / ML

- Ollama
- Llama 3
- Sentence Transformers
- Faster-Whisper
- Piper TTS
- Semantic similarity
- Retrieval-Augmented Generation
- Prompt-based structured extraction

### Database

- PostgreSQL
- pgvector

### Infrastructure

- Docker
- Git / GitHub

---

## Development Approach

The frontend was initially developed using AI-assisted "vibe coding" with [Bolt.new](https://bolt.new), which was used to accelerate the creation of the React/TypeScript interface and establish the initial UI structure.

I then integrated the frontend into the local project, connected it to the FastAPI backend, implemented the API integrations, debugged frontend/backend issues, refined the user experience, and extended the application with features such as Job Fit, RAG-based Career Assistant, adaptive voice interviews, and PDF document generation.

The backend, AI workflows, data processing, semantic matching, RAG pipeline, and application architecture were developed and integrated as part of the project.

---

## Project Structure

```text
ai-career-agent/
│
├── backend/
│   ├── main.py
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── ...
│
├── web/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
│
├── en_US-lessac-medium.onnx
├── sv_SE-nst-medium.onnx
├── requirements.txt
├── README.md
└── ...
```

---

## Running the Project

### Prerequisites

You need:

- Python 3.12+
- Node.js
- npm
- Docker
- Ollama

---

### 1. Clone the repository

```bash
git clone https://github.com/18alba1/ai-career-agent.git
cd ai-career-agent
```

---

### 2. Backend

Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI backend:

```bash
uvicorn backend.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

---

### 3. PostgreSQL

Start the PostgreSQL / pgvector environment using the project's Docker configuration.

The application expects PostgreSQL to be available locally.

---

### 4. Ollama

Make sure Ollama is running and the required model is available.

For the current local setup:

```bash
ollama pull llama3:latest
```

---

### 5. Frontend

Open a second terminal:

```bash
cd web
npm install
npm run dev
```

The React application will be available at:

```text
http://localhost:5173
```

---

## Configuration

The application currently expects the following local services and models:

| Component | Required configuration |
|---|---|
| Ollama | `llama3:latest` |
| PostgreSQL | Local PostgreSQL instance with pgvector |
| Database | `career_agent` |
| Backend | `127.0.0.1:8000` |
| Frontend | `localhost:5173` |
| Embeddings | `paraphrase-multilingual-MiniLM-L12-v2` |
| Speech-to-text | Faster-Whisper `base` |
| English TTS | `en_US-lessac-medium.onnx` |
| Swedish TTS | `sv_SE-nst-medium.onnx` |

Some AI models are downloaded automatically on first use.

---

## Example Workflow

A typical user journey looks like this:

```text
1. Upload CV
       ↓
2. Candidate profile is created
       ↓
3. Add a job
       ↓
4. Extract job requirements
       ↓
5. Analyze Job Fit
       ↓
6. Tailor CV
       ↓
7. Generate Cover Letter
       ↓
8. Ask Career Assistant questions
       ↓
9. Practice AI Interview
       ↓
10. Review interview report
```

---

## Design Goals

The project was built around several principles.

### Grounded AI

AI-generated answers should be connected to retrieved information from the user's actual profile whenever possible.

### Explainability

Job matching should show evidence and similarity rather than only returning a single score.

### Reusable AI Components

Candidate information is structured and embedded once so that it can support:

- Job matching
- Career Assistant
- Application generation
- Interview preparation

### User-Centered Interaction

The application is designed around practical workflows rather than exposing raw AI functionality.

---

## Example AI Capabilities

The application combines multiple AI patterns in one system:

```text
Structured LLM extraction
        +
Semantic similarity
        +
Vector search
        +
RAG
        +
Adaptive generation
        +
Speech-to-text
        +
Text-to-speech
```

This makes the project an exploration of how several AI components can work together in a complete application.

---

## Future Improvements

Potential future improvements include:

- DOCX export
- More advanced PDF templates
- Application tracking
- Job discovery integrations
- Persistent interview history
- Improved RAG evaluation
- Automated evaluation datasets
- Authentication and multi-user support

---

## Disclaimer

This project is an educational and portfolio application.

AI-generated job matching, CV content, cover letters, and interview feedback should be reviewed by the user before being used in real applications.

---