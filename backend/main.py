from __future__ import annotations

import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Make project root importable when running from any CWD
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from backend import config
from backend.routes import papers, search, summary, comparison, citation, review



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    logger.info("🚀 Research Paper Intelligence Platform starting up…")

    # Ensure data directories exist
    for directory in [
        config.PAPERS_DIR,
        config.TRAINING_RAW_DIR,
        config.TRAINING_PROC_DIR,
        config.FAISS_INDEX_DIR,
        config.CHECKPOINTS_DIR,
    ]:
        directory.mkdir(parents=True, exist_ok=True)

    logger.info("✅ Data directories verified.")
    logger.info(f"📂 Papers stored at: {config.PAPERS_DIR}")
    logger.info(f"🔍 FAISS index at:   {config.FAISS_INDEX_DIR}")

    yield  # Application is running

    logger.info("👋 Research Paper Intelligence Platform shutting down.")


# ---------------------------------------------------------------------------
# App creation
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    app = FastAPI(
        title="Research Paper Intelligence Platform",
        description=(
            "A professional research analysis platform for uploading, processing, "
            "summarizing, and comparing academic research papers. NOT a chatbot."
        ),
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    # CORS — allow frontend dev server
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(papers.router,     prefix="/papers",           tags=["Papers"])
    app.include_router(search.router,     prefix="/search",           tags=["Search"])
    app.include_router(summary.router,    prefix="/papers",           tags=["Summary"])
    app.include_router(comparison.router, prefix="/comparison",       tags=["Comparison"])
    app.include_router(citation.router,   prefix="/papers",           tags=["Citations"])
    app.include_router(review.router,     prefix="/literature-review",tags=["Literature Review"])

    @app.get("/", tags=["Health"])
    async def root():
        return {
            "platform": "Research Paper Intelligence Platform",
            "version": "0.1.0",
            "status": "running",
            "docs": "/api/docs",
        }

    @app.get("/health", tags=["Health"])
    async def health():
        return {"status": "healthy"}

    return app


app = create_app()


# ---------------------------------------------------------------------------
# Run directly
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=config.API_HOST,
        port=config.API_PORT,
        reload=config.API_RELOAD,
        log_level="info",
    )
