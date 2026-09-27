

from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from loguru import logger

from backend.schemas import PaperDetail, PaperMeta, PaperUploadResponse, PapersListResponse
from backend.services.paper_service import PaperService

router = APIRouter()
_service = PaperService()


@router.post(
    "/upload",
    response_model=PaperUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a research paper PDF",
)
async def upload_paper(file: UploadFile = File(...)):
    """
    Upload a research paper in PDF format.

    The backend will:
    1. Save the PDF to disk.
    2. Extract text, sections, metadata, and references via the PDF parser.
    3. Chunk the paper content.
    4. Generate embeddings via the AI/ML embedding engine.
    5. Index embeddings into FAISS.
    6. Return structured paper information.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted.",
        )

    logger.info(f"📤 Uploading paper: {file.filename}")
    content = await file.read()

    try:
        result = await _service.upload_paper(filename=file.filename, content=content)
        return result
    except Exception as exc:
        logger.error(f"Upload failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process paper: {str(exc)}",
        )


@router.get(
    "",
    response_model=PapersListResponse,
    summary="List all uploaded papers",
)
async def list_papers():
    """Return metadata for all uploaded papers."""
    papers = await _service.list_papers()
    return PapersListResponse(total=len(papers), papers=papers)


@router.get(
    "/{paper_id}",
    response_model=PaperDetail,
    summary="Get full details for a specific paper",
)
async def get_paper(paper_id: str):
    """Return full structured detail for a paper by ID."""
    paper = await _service.get_paper(paper_id)
    if paper is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paper '{paper_id}' not found.",
        )
    return paper
