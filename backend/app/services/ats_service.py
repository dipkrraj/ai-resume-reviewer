from app.prompts.ats_prompt import ATS_ANALYSIS_PROMPT
from app.schemas.analysis import ATSAnalysisResult
from app.services.llm_service import generate_structured


def analyze_resume(resume_text: str) -> ATSAnalysisResult:
    prompt = ATS_ANALYSIS_PROMPT.format(resume_text=resume_text)
    result = generate_structured(prompt, ATSAnalysisResult)
    return result  # type: ignore[return-value]
