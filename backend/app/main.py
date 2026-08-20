from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.admin.router import router as admin_router
from app.auth.router import router as auth_router
from app.connections.router import router as connections_router
from app.core.config import settings
from app.database import models as database_models  # noqa: F401
from app.database.session import engine
from app.events.router import router as events_router
from app.media.router import router as media_router
from app.notifications.router import router as notifications_router
from app.opportunities.router import router as opportunities_router
from app.posts.router import router as posts_router
from app.users.router import router as users_router

app = FastAPI(
    title="UniConnect API",
    description="Public university community platform API",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(posts_router)
app.include_router(connections_router)
app.include_router(opportunities_router)
app.include_router(events_router)
app.include_router(notifications_router)
app.include_router(admin_router)
app.include_router(media_router)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": "UniConnect API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health() -> dict[str, str]:
    database_status = "disconnected"

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database_status = "connected"
    except Exception:
        database_status = "disconnected"

    return {
        "status": "ok",
        "service": "uniconnect-api",
        "database": database_status,
        "environment": settings.environment,
    }
