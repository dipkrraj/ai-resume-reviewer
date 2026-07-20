from datetime import datetime
from pydantic import BaseModel


class ResumeAnalysisMin(BaseModel):
    id: str
    overall_score: int
    created_at: datetime

    class Config:
        from_attributes = True


class ResumeOut(BaseModel):
    id: str
    original_filename: str
    created_at: datetime
    analyses: list[ResumeAnalysisMin] = []

    class Config:
        from_attributes = True
