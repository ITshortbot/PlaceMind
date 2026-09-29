# ============================================================================
# File: backend/app/core/config.py
# Description: Central configuration management using Pydantic Settings
# ============================================================================

import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator

class Settings(BaseSettings):
    """
    Application Settings dynamically loaded from environment variables or .env file.
    Validates all critical credentials at startup to fail fast on misconfiguration.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # API General Settings
    APP_NAME: str = "Placemind ATS Engine"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development", description="development | staging | production")
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "tauri://localhost",
        "https://*.placemind.app",
        "https://placemind.vercel.app"
    ]

    # Database Configuration (Neon PostgreSQL)
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/placemind",
        description="Async SQLAlchemy connection string with asyncpg driver"
    )

    # Cloud AI Provider (Google Gemini)
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API Key")
    CLOUD_MODEL_NAME: str = Field(default="gemini/gemini-2.5-flash", description="LiteLLM model tag for Gemini")

    # Local AI Provider (LM Studio OpenAI-compatible endpoint)
    LM_STUDIO_API_BASE: str = Field(
        default="http://localhost:1234/v1",
        description="Local LM Studio Server Base URL"
    )
    LOCAL_MODEL_NAME: str = Field(
        default="openai/local-model",
        description="LiteLLM model tag targeting local LM Studio"
    )

    # Vector Embedding Model
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIMENSION: int = 384

    # Cloudflare R2 Storage (S3-compatible)
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "placemind-resumes"
    R2_PUBLIC_URL_PREFIX: str = "https://cdn.placemind.app"

    @model_validator(mode="after")
    def _validate_production_secrets(self) -> "Settings":
        """
        Fail fast at startup if required secrets are missing in non-development environments.
        This prevents silent failures where the server starts but immediately returns 500s
        on every AI request because credentials are not set.
        """
        if self.ENVIRONMENT in ("staging", "production"):
            if not self.GEMINI_API_KEY:
                raise ValueError(
                    "GEMINI_API_KEY must be set in staging/production environments. "
                    "Set it in your .env file or as a container environment variable."
                )
        return self

settings = Settings()
