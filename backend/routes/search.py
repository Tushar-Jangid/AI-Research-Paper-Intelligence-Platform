

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from loguru import logger

from backend.schemas import SearchRequest, SearchResponse
from backend.services.search_service import SearchService

router = APIRouter()
_service = SearchService()


@router.post(
    "",
    response_model=SearchResponse,
    summary="Semantic search across uploaded papers",
)
async def semantic_search(request: SearchRequest):
    """
    Perform semantic search across all indexed paper chunks.

    Searches by meaning — not exact keyword matching.
    Results include paper ID, title, section, chunk text, and similarity score.
    """
    logger.info(f"🔍 Semantic search query: '{request.query}' (top_k={request.top_k})")

    try:
        results = await _service.search(query=request.query, top_k=request.top_k)
        return SearchResponse(
            query=request.query,
            total_results=len(results),
            results=results,
        )
    except Exception as exc:
        logger.error(f"Search failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(exc)}",
        )
