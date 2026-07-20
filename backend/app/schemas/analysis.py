"""
These schemas double as the CONTRACT we hand the LLM. We tell the model
exactly this shape and validate its response against it — if validation
fails, we retry once with the error fed back in, then fail loudly rather
than silently passing malformed data to the frontend.
"""
from pydantic import BaseModel, Field, field_validator


class CategoryScores(BaseModel):
    skills: int = Field(ge=0, le=100)
    format: int = Field(ge=0, le=100)
    experience: int = Field(ge=0, le=100)
    grammar: int = Field(ge=0, le=100)
    keywords: int = Field(ge=0, le=100)


class ATSAnalysisResult(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    category_scores: CategoryScores
    strengths: list[str]
    weaknesses: list[str]
    missing_keywords: list[str]

    @field_validator("strengths", "weaknesses", "missing_keywords")
    @classmethod
    def cap_list_length(cls, v: list[str]) -> list[str]:
        # Guard against a chatty LLM response blowing up the DB row / UI.
        return v[:10]


class BulletImprovement(BaseModel):
    original: str
    improved: str
    reasoning: str


class BulletImprovementResult(BaseModel):
    improvements: list[BulletImprovement]


class InterviewQuestionSet(BaseModel):
    easy: list[str] = Field(min_length=1, max_length=5)
    medium: list[str] = Field(min_length=1, max_length=5)
    hard: list[str] = Field(min_length=1, max_length=5)


class AnalysisOut(BaseModel):
    id: str
    overall_score: int
    category_scores: dict
    strengths: list
    weaknesses: list
    missing_keywords: list
    improved_bullets: dict
    interview_questions: dict
    resume_text: str | None = None

    class Config:
        from_attributes = True
