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
        "http://localhost:3001",
        "http://localhost:3005",  # Playwright production-test server
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

    # OSS / Local Model Provider (OpenAI-compatible, e.g. Ollama)
    LLM_BASE_URL: str = Field(
        default="http://localhost:11434/v1",
        description="Base URL for OSS OpenAI-compatible endpoint"
    )
    LLM_API_KEY: str = Field(
        default="ollama",
        description="API key for OSS OpenAI-compatible endpoint"
    )
    LLM_MODEL: str = Field(
        default="qwen2.5-coder:1.5b",
        description="Model name for OSS endpoint"
    )
    LLM_TIMEOUT_S: int = Field(
        default=60,
        description="Request timeout in seconds for OSS endpoint"
    )
    LLM_MAX_TOKENS: int = Field(
        default=1500,
        description="Max tokens for OSS endpoint completion"
    )

    # OpenRouter (free models only - paid calls are disabled in this build;
    # the service layer refuses any model outside the verified-free allowlist)
    OPENROUTER_API_KEY: str = Field(
        default="",
        description="OpenRouter API key, supplied via environment only"
    )
    OPENROUTER_MODEL: str = Field(
        default="openrouter/free",
        description="OpenRouter model id; must stay on the free allowlist"
    )
    OPENROUTER_TIMEOUT_S: int = Field(
        default=45,
        description="Request timeout in seconds for OpenRouter"
    )

    # Vector Embedding Model
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIMENSION: int = 384

    # Authentication (Google OAuth 2.0 + signed session cookie)
    # The client secret and session signing key are supplied via environment /
    # .env on the host only - never committed to the repository.
    GOOGLE_CLIENT_ID: str = Field(default="", description="Google OAuth 2.0 Web client ID")
    GOOGLE_CLIENT_SECRET: str = Field(default="", description="Google OAuth 2.0 Web client secret")
    GOOGLE_REDIRECT_URI: str = Field(
        default="http://localhost:8000/api/v1/auth/google/callback",
        description="OAuth redirect URI; must exactly match the Google Cloud console entry",
    )
    AUTH_SECRET_KEY: str = Field(
        default="",
        description="HS256 signing key for session/state tokens (generate per deployment)",
    )
    AUTH_SESSION_DAYS: int = Field(default=14, description="Remembered session lifetime in days (configurable per deployment)")
    AUTH_COOKIE_SECURE: bool = Field(
        default=False,
        description="Set True when served over HTTPS so the session cookie is Secure",
    )
    RATE_LIMIT_GUEST_CREATION_WINDOW_SECONDS: int = Field(default=3600, ge=1)
    RATE_LIMIT_GUEST_CREATION_PER_IP: int = Field(default=20, ge=1)
    RATE_LIMIT_GUEST_OPERATIONS_WINDOW_SECONDS: int = Field(default=3600, ge=1)
    RATE_LIMIT_GUEST_OPERATIONS_PER_USER: int = Field(default=600, ge=1)
    RATE_LIMIT_GUEST_OPERATIONS_PER_IP: int = Field(default=3000, ge=1)
    FRONTEND_URL: str = Field(
        default="http://localhost:3000",
        description="Public base URL of the Next.js frontend for post-login redirects",
    )

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
            if not self.AUTH_SECRET_KEY:
                raise ValueError(
                    "AUTH_SECRET_KEY must be set in staging/production environments. "
                    "Generate one (e.g. `openssl rand -hex 32`) and set it in the environment."
                )
            if not self.AUTH_COOKIE_SECURE:
                raise ValueError(
                    "AUTH_COOKIE_SECURE must be true in staging/production: the "
                    "session cookie must only travel over HTTPS."
                )
            if not self.GOOGLE_CLIENT_ID or not self.GOOGLE_CLIENT_SECRET:
                raise ValueError(
                    "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in "
                    "staging/production environments - sign-in is required."
                )
        return self

settings = Settings()
