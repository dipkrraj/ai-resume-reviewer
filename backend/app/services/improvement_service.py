from app.prompts.improve_prompt import IMPROVE_BULLETS_PROMPT
from app.schemas.analysis import BulletImprovementResult
from app.services.llm_service import generate_structured


def improve_bullets(resume_text: str) -> BulletImprovementResult:
    prompt = IMPROVE_BULLETS_PROMPT.format(resume_text=resume_text)
    result = generate_structured(prompt, BulletImprovementResult)
    return result  # type: ignore[return-value]
