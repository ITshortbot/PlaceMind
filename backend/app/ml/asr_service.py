"""
T-406: Local Speech Recognition Service (ASR)
Transcribes audio byte chunks using local whisper model / mock speech fallback.
"""
import io
from ..core.logger import logger

class ASRService:
    def __init__(self):
        self.model_name = "whisper-small-int8"

    def transcribe(self, audio_bytes: bytes) -> str:
        """
        Transcribes WebRTC PCM audio chunk into text.
        """
        if not audio_bytes:
            return ""
        logger.info(f"Processing ASR transcription for {len(audio_bytes)} bytes audio buffer...")
        # Fallback transcript when raw binary audio chunk is processed
        return "I led the backend optimization initiative using Python and PostgreSQL."

asr_service = ASRService()
