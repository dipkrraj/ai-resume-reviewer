class AppError(Exception):
    """Base class for expected, user-facing errors."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class UnsupportedFileType(AppError):
    def __init__(self):
        super().__init__("Only PDF and DOCX files are supported.", 415)


class FileTooLarge(AppError):
    def __init__(self, max_mb: int):
        super().__init__(f"File exceeds the {max_mb}MB limit.", 413)


class TextExtractionFailed(AppError):
    def __init__(self):
        super().__init__(
            "Could not extract text from this file. It may be scanned/image-based "
            "or corrupted — try a text-based PDF or DOCX.",
            422,
        )


class LLMResponseInvalid(AppError):
    def __init__(self):
        super().__init__(
            "The AI service returned an unexpected response. Please try again.",
            502,
        )
