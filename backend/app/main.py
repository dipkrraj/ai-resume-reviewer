from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging_config import configure_logging
from app.database.base import Base
from app.database.session import engine
from app.utils.exceptions import AppError
from app.utils.rate_limiter import limiter

configure_logging()

# In production, use Alembic migrations instead of create_all.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Resume Reviewer API", version="0.1.0")

app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Too many requests. Please slow down."})


app.include_router(api_router)


@app.get("/health")
def health():
    return {"status": "ok"}
