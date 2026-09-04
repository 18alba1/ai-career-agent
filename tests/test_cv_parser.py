from io import BytesIO

import pytest
from docx import Document
from reportlab.pdfgen import canvas

from backend.services.cv_parser import extract_cv_text


def create_test_pdf() -> bytes:
    buffer = BytesIO()

    pdf = canvas.Canvas(buffer)
    pdf.drawString(100, 750, "John Doe")
    pdf.drawString(100, 730, "Python SQL Docker")
    pdf.save()

    return buffer.getvalue()


def create_test_docx() -> bytes:
    buffer = BytesIO()

    document = Document()
    document.add_paragraph("John Doe")
    document.add_paragraph("Python SQL Docker")
    document.save(buffer)

    return buffer.getvalue()


def test_extract_text_from_pdf():
    pdf_bytes = create_test_pdf()

    text = extract_cv_text(
        file_bytes=pdf_bytes,
        content_type="application/pdf",
    )

    assert "John Doe" in text
    assert "Python SQL Docker" in text


def test_extract_text_from_docx():
    docx_bytes = create_test_docx()

    text = extract_cv_text(
        file_bytes=docx_bytes,
        content_type=(
            "application/vnd.openxmlformats-officedocument"
            ".wordprocessingml.document"
        ),
    )

    assert "John Doe" in text
    assert "Python SQL Docker" in text


def test_unsupported_file_type():
    with pytest.raises(ValueError, match="Unsupported file type."):
        extract_cv_text(
            file_bytes=b"test",
            content_type="text/plain",
        )


def test_empty_pdf():
    pdf_bytes = create_test_pdf()

    text = extract_cv_text(
        file_bytes=pdf_bytes,
        content_type="application/pdf",
    )

    assert isinstance(text, str)
    assert len(text) > 0