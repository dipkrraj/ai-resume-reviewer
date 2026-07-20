"""
Basic per-IP rate limiting for the expensive endpoints (anything that
calls the LLM). This is a starting point, not a complete defense — for
real production traffic, rate-limit at the gateway/reverse-proxy layer too.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
