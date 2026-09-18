import os
import tempfile

from faster_whisper import WhisperModel


MODEL_NAME = os.getenv("WHISPER_MODEL", "base")

model = WhisperModel(
    MODEL_NAME,
    device="cpu",
    compute_type="int8",
)


def transcribe_audio(
    audio_bytes: bytes,
    file_extension: str = ".wav",
    language: str = "en",
) -> str:

    if not audio_bytes:
        raise ValueError("No audio data was provided.")

    if not file_extension.startswith("."):
        file_extension = f".{file_extension}"

    temporary_file = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=file_extension,
            delete=False,
        ) as file:

            file.write(audio_bytes)
            temporary_file = file.name

        segments, _ = model.transcribe(
            temporary_file,
            language=language,
            beam_size=5,
            vad_filter=True,
        )

        transcript = " ".join(
            segment.text.strip()
            for segment in segments
            if segment.text.strip()
        )

        return transcript.strip()

    finally:

        if temporary_file:
            try:
                os.remove(temporary_file)
            except OSError:
                pass