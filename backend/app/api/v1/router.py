from fastapi import APIRouter

from app.api.v1.routes import auth, resume, analysis

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(resume.router)
api_router.include_router(analysis.router)
