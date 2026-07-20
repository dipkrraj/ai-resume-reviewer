"""
Centralized app configuration. Never hardcode secrets, keys, or DB URLs
anywhere else in the codebase — everything reads from here, which reads
from environment variables (.env in dev, real env vars in prod).
"""
import os
import tempfile
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "sqlite:///./resume_reviewer.db"

    GROQ_API_KEY: str
    LLM_MODEL: str = "llama-3.3-70b-versatile"

    # Uploads
    MAX_UPLOAD_MB: int = 5
    UPLOAD_DIR: str = os.path.join(tempfile.gettempdir(), "ai_resume_reviewer_uploads")
    ALLOWED_EXTENSIONS: set[str] = {".pdf", ".docx"}
    ALLOWED_MIME_TYPES: set[str] = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }

    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    def __init__(self, **values):
        super().__init__(**values)
        # Force temporary directory in serverless Vercel execution context to avoid write permission errors
        if "VERCEL" in os.environ or os.environ.get("VERCEL"):
            self.UPLOAD_DIR = os.path.join("/tmp", "ai_resume_reviewer_uploads")


settings = Settings()
