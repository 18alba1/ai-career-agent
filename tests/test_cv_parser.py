from backend.services.cv_parser import extract_cv_text


def test_unsupported_file_type():
    try:
        extract_cv_text(
            file_bytes=b"test",
            content_type="text/plain",
        )
    except ValueError as error:
        assert str(error) == "Unsupported file type."
    else:
        raise AssertionError("Expected ValueError")