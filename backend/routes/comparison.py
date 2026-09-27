

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from loguru import logger

from backend.schemas import ComparisonRequest, ComparisonResponse
from backend.services.comparison_service import ComparisonService

router = APIRouter()
_service = ComparisonService()


@router.post(
    "",
    response_model=ComparisonResponse,
    summary="Compare 2 or more research papers",
)
async def compare_papers(request: ComparisonRequest):
    """
    Compare multiple research papers across:
    - Dataset, Model, Methodology, Metrics, Results, Strengths, Limitations.

    Also surfaces observable research trends and potential research gaps
    from the selected paper collection.

    Note: Research gaps are labeled as *potential* — they require researcher verification.
    """
    if len(request.paper_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 paper IDs are required for comparison.",
        )

    logger.info(f"📊 Comparing papers: {request.paper_ids}")

    try:
        result = await _service.compare(request.paper_ids)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error(f"Comparison failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Comparison failed: {str(exc)}",
        )
