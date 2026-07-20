"""
Extracts plain text from PDF/DOCX. This is the one component the whole
pipeline depends on being correct — if this silently returns garbage,
every downstream AI call produces garbage with no obvious cause.
"""
from pathlib import Path

import fitz  # PyMuPDF
import docx

from app.utils.exceptions import TextExtractionFailed


def extract_text(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()

    if ext == ".pdf":
        text = _extract_pdf(file_path)
    elif ext == ".docx":
        text = _extract_docx(file_path)
    else:
        raise TextExtractionFailed()

    cleaned = _clean_text(text)
    if len(cleaned) < 50:
        # Almost certainly a scanned/image PDF with no real text layer.
        raise TextExtractionFailed()

    return cleaned


def _extract_pdf(file_path: str) -> str:
    try:
        doc = fitz.open(file_path)
        return "\n".join(page.get_text() for page in doc)
    except Exception:
        raise TextExtractionFailed()


def _extract_docx(file_path: str) -> str:
    try:
        d = docx.Document(file_path)
        return "\n".join(p.text for p in d.paragraphs)
    except Exception:
        raise TextExtractionFailed()


def _clean_text(text: str) -> str:
    lines = [line.strip() for line in text.splitlines()]
    lines = [line for line in lines if line]
    return "\n".join(lines)
