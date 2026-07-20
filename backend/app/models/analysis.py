import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    resume_id: Mapped[str] = mapped_column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), index=True)

    overall_score: Mapped[int] = mapped_column(Integer)
    category_scores: Mapped[dict] = mapped_column(JSON)   # {"skills": 82, "format": 91, ...}
    strengths: Mapped[list] = mapped_column(JSON)
    weaknesses: Mapped[list] = mapped_column(JSON)
    missing_keywords: Mapped[list] = mapped_column(JSON)

    improved_bullets: Mapped[dict] = mapped_column(JSON, default=dict)     # populated on-demand
    interview_questions: Mapped[dict] = mapped_column(JSON, default=dict)  # populated on-demand

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    resume: Mapped["Resume"] = relationship(back_populates="analyses")

    @property
    def resume_text(self) -> str:
        return self.resume.extracted_text if self.resume else ""
