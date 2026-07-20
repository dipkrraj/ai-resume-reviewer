from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.routes.resume import get_owned_resume
from app.database.session import get_db
from app.models.user import User
from app.models.analysis import ResumeAnalysis
from app.schemas.analysis import AnalysisOut
from app.services.ats_service import analyze_resume
from app.services.improvement_service import improve_bullets
from app.services.interview_service import generate_interview_questions
from app.utils.exceptions import AppError

router = APIRouter(prefix="/resumes", tags=["analysis"])


@router.post("/{resume_id}/analyze", response_model=AnalysisOut, status_code=201)
def analyze(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = get_owned_resume(resume_id, db, current_user)

    try:
        result = analyze_resume(resume.extracted_text)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    analysis = ResumeAnalysis(
        resume_id=resume.id,
        overall_score=result.overall_score,
        category_scores=result.category_scores.model_dump(),
        strengths=result.strengths,
        weaknesses=result.weaknesses,
        missing_keywords=result.missing_keywords,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


@router.get("/{resume_id}/analysis", response_model=list[AnalysisOut])
def get_analyses(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = get_owned_resume(resume_id, db, current_user)
    return (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.resume_id == resume.id)
        .order_by(ResumeAnalysis.created_at.desc())
        .all()
    )


@router.post("/{resume_id}/analysis/{analysis_id}/improve", response_model=AnalysisOut)
def improve(
    resume_id: str,
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = get_owned_resume(resume_id, db, current_user)
    analysis = _get_owned_analysis(analysis_id, resume.id, db)

    try:
        result = improve_bullets(resume.extracted_text)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    analysis.improved_bullets = result.model_dump()
    db.commit()
    db.refresh(analysis)
    return analysis


@router.post("/{resume_id}/analysis/{analysis_id}/interview-questions", response_model=AnalysisOut)
def interview_questions(
    resume_id: str,
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = get_owned_resume(resume_id, db, current_user)
    analysis = _get_owned_analysis(analysis_id, resume.id, db)

    try:
        result = generate_interview_questions(resume.extracted_text)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    analysis.interview_questions = result.model_dump()
    db.commit()
    db.refresh(analysis)
    return analysis


def _get_owned_analysis(analysis_id: str, resume_id: str, db: Session) -> ResumeAnalysis:
    analysis = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.id == analysis_id, ResumeAnalysis.resume_id == resume_id)
        .first()
    )
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis
