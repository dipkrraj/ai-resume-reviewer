from app.prompts.interview_prompt import INTERVIEW_QUESTIONS_PROMPT
from app.schemas.analysis import InterviewQuestionSet
from app.services.llm_service import generate_structured


def generate_interview_questions(resume_text: str) -> InterviewQuestionSet:
    prompt = INTERVIEW_QUESTIONS_PROMPT.format(resume_text=resume_text)
    result = generate_structured(prompt, InterviewQuestionSet)
    return result  # type: ignore[return-value]
