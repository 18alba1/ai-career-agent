from unittest.mock import patch
from backend.services.speech_to_text import transcribe_audio

def test_transcribe_audio_rejects_empty_audio():

    try:
        transcribe_audio(b"")
        assert False, "Expected ValueError"
    except ValueError as error:
        assert str(error) == "No audio data was provided."


def test_transcribe_audio():
    mock_segment_1 = type(
        "Segment",
        (),
        {"text": "Hello, this is"},
    )()

    mock_segment_2 = type(
        "Segment",
        (),
        {"text": "a voice test."},
    )()

    with patch(
        "backend.services.speech_to_text.model.transcribe",
        return_value=(
            [
                mock_segment_1,
                mock_segment_2,
            ],
            None,
        ),
    ):

        transcript = transcribe_audio(
            b"fake audio data"
        )

    assert transcript == (
        "Hello, this is a voice test."
    )