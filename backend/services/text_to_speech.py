import io
import wave
from pathlib import Path
from piper import PiperVoice

PROJECT_ROOT = Path(__file__).resolve().parents[2]

VOICE_PATHS = {
    "en": PROJECT_ROOT / "en_US-lessac-medium.onnx",
    "sv": PROJECT_ROOT / "sv_SE-nst-medium.onnx",
}

def synthesize_speech(
    text: str,
    language: str = "en",
) -> bytes:
    """
    Convert text into WAV audio bytes using Piper.
    """

    if not text.strip():
        raise ValueError("Text cannot be empty.")

    if language not in VOICE_PATHS:
        raise ValueError(
            "Unsupported language. Use 'en' or 'sv'."
        )

    voice_path = VOICE_PATHS[language]

    if not voice_path.exists():
        raise FileNotFoundError(
            f"Piper voice not found: {voice_path}"
        )

    voice = PiperVoice.load(
        str(voice_path)
    )

    wav_buffer = io.BytesIO()

    with wave.open(
        wav_buffer,
        "wb",
    ) as wav_file:

        first_chunk = True

        for audio_chunk in voice.synthesize(text):

            if first_chunk:
                wav_file.setframerate(
                    audio_chunk.sample_rate
                )
                wav_file.setsampwidth(
                    audio_chunk.sample_width
                )
                wav_file.setnchannels(
                    audio_chunk.sample_channels
                )

                first_chunk = False

            wav_file.writeframes(
                audio_chunk.audio_int16_bytes
            )

    return wav_buffer.getvalue()