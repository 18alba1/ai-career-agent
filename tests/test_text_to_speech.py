from unittest.mock import MagicMock, patch

from backend.services.text_to_speech import synthesize_speech


def test_synthesize_speech_rejects_empty_text():

    try:
        synthesize_speech("")
        assert False, "Expected ValueError"
    except ValueError as error:
        assert str(error) == "Text cannot be empty."


def test_synthesize_speech_rejects_invalid_language():

    try:
        synthesize_speech(
            "Hello",
            language="fr",
        )

        assert False, "Expected ValueError"

    except ValueError as error:

        assert (
            str(error)
            == "Unsupported language. Use 'en' or 'sv'."
        )