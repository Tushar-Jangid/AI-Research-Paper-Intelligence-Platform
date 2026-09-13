

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from loguru import logger

from backend.schemas import CitationNetworkResponse
from backend.services.citation_service import CitationService

router = APIRouter()
_service = CitationService()


@router.get(
    "/{paper_id}/citations",
    response_model=CitationNetworkResponse,
    summary="Get citation network for a paper",
)
async def get_citations(paper_id: str):
    """
    Return the citation network for a paper.

    The response includes:
    - Graph nodes (papers with metadata)
    - Graph edges (citation relationships)
    - Graph statistics (degree, clustering, etc.)

    Use the frontend CitationGraph component to visualize interactively.
    """
    logger.info(f"🕸️  Citation network requested for: {paper_id}")

    try:
        network = await _service.get_citation_network(paper_id)
        if network is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Paper '{paper_id}' not found.",
            )
        return network
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Citation network failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Citation network failed: {str(exc)}",
        )
