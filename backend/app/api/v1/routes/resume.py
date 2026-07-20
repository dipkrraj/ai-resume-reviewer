from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.resume import Resume
from app.schemas.resume import ResumeOut
from app.services.file_service import save_upload
from app.services.parser_service import extract_text
from app.utils.exceptions import AppError

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.post("/upload", response_model=ResumeOut, status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        file_path, original_filename = await save_upload(file, current_user.id)
        text = extract_text(file_path)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    resume = Resume(
        user_id=current_user.id,
        original_filename=original_filename,
        file_path=file_path,
        extracted_text=text,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.get("", response_model=list[ResumeOut])
def list_resumes(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .all()
    )


def get_owned_resume(resume_id: str, db: Session, current_user: User) -> Resume:
    """Shared ownership check — used by the analysis routes too."""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != current_user.id:
        # 404, not 403 — don't reveal that a resume ID exists for another user.
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume
