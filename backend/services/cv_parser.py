from io import BytesIO
from docx import Document
from pypdf import PdfReader


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file."""
    reader = PdfReader(BytesIO(file_bytes))

    text = []

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text.append(page_text)

    return "\n".join(text).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file."""
    document = Document(BytesIO(file_bytes))

    text = []

    for paragraph in document.paragraphs:
        if paragraph.text.strip():
            text.append(paragraph.text)

    return "\n".join(text).strip()


def extract_cv_text(file_bytes: bytes, content_type: str) -> str:
    """Extract text from a supported CV file."""

    if content_type == "application/pdf":
        return extract_text_from_pdf(file_bytes)

    if content_type == (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ):
        return extract_text_from_docx(file_bytes)

    raise ValueError("Unsupported file type.")