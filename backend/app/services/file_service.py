"""
Handles everything about receiving and storing an uploaded file:
validation (type, size — the two cheap, high-value checks) and safe
storage on disk with a randomized filename so nothing user-supplied
ever becomes a path component.
"""
import os
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings
from app.utils.exceptions import UnsupportedFileType, FileTooLarge

MAX_BYTES = settings.MAX_UPLOAD_MB * 1024 * 1024


async def save_upload(file: UploadFile, user_id: str) -> tuple[str, str]:
    """
    Validates and persists the upload.
    Returns (stored_file_path, original_filename).
    Raises UnsupportedFileType / FileTooLarge on validation failure.
    """
    ext = Path(file.filename or "").suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise UnsupportedFileType()

    if file.content_type not in settings.ALLOWED_MIME_TYPES:
        # Extension can be spoofed; content-type header is a second, still-imperfect
        # check. Real hardening would sniff magic bytes (e.g. via python-magic).
        raise UnsupportedFileType()

    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise FileTooLarge(settings.MAX_UPLOAD_MB)

    user_dir = Path(settings.UPLOAD_DIR) / user_id
    user_dir.mkdir(parents=True, exist_ok=True)

    # Never trust the client's filename for the on-disk path.
    stored_name = f"{uuid.uuid4()}{ext}"
    stored_path = user_dir / stored_name

    with open(stored_path, "wb") as f:
        f.write(contents)

    return str(stored_path), file.filename or stored_name
