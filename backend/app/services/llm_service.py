"""
Single choke point for all LLM calls. Every other service goes through
`generate_structured` so there is exactly one place that handles:
  - calling the Groq API
  - stripping stray markdown fences the model sometimes adds anyway
  - validating against a Pydantic schema
  - retrying ONCE with the validation error fed back to the model
  - raising a clean, typed error if it still fails

This is the difference between "ask for JSON and hope" and structured output.
"""
import json
import logging

from groq import Groq, GroqError
from pydantic import BaseModel, ValidationError

from app.core.config import settings
from app.utils.exceptions import LLMResponseInvalid

logger = logging.getLogger(__name__)

_client = Groq(api_key=settings.GROQ_API_KEY)


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text
        text = text.rsplit("```", 1)[0]
    return text.strip()


def _call_model(prompt: str) -> str:
    try:
        response = _client.chat.completions.create(
            model=settings.LLM_MODEL,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
    except GroqError as e:
        logger.error("Groq API error: %s", e)
        raise LLMResponseInvalid()

    return response.choices[0].message.content or ""


def generate_structured(prompt: str, schema: type[BaseModel]) -> BaseModel:
    """Call the LLM and validate its response against `schema`, with one retry."""
    raw = _call_model(prompt)

    try:
        cleaned = _strip_fences(raw)
        data = json.loads(cleaned)
        return schema.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as first_error:
        logger.warning("LLM output failed validation, retrying once: %s", first_error)

        retry_prompt = (
            f"{prompt}\n\nYour previous response was invalid JSON or did not "
            f"match the required schema. Error: {first_error}\n"
            f"Return ONLY the corrected valid JSON, nothing else."
        )
        raw_retry = _call_model(retry_prompt)

        try:
            cleaned_retry = _strip_fences(raw_retry)
            data_retry = json.loads(cleaned_retry)
            return schema.model_validate(data_retry)
        except (json.JSONDecodeError, ValidationError) as second_error:
            logger.error("LLM output failed validation twice: %s", second_error)
            raise LLMResponseInvalid()
