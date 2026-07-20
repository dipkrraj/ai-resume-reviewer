INTERVIEW_QUESTIONS_PROMPT = """You are a senior technical interviewer.

Based on the resume text below, generate interview questions grouped by
difficulty:
- easy: up to 5 questions
- medium: up to 5 questions
- hard: up to 5 questions

Draw questions from the candidate's actual listed projects, skills, and
experience — mix technical and behavioral questions. Do not ask about
technologies the candidate never mentioned.

Return ONLY valid JSON matching this exact shape, no prose before or after:

{{
  "easy": [<string>, ...],
  "medium": [<string>, ...],
  "hard": [<string>, ...]
}}

RESUME TEXT:
{resume_text}
"""
