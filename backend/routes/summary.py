

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from loguru import logger

from backend.schemas import PaperSummary
from backend.services.summary_service import SummaryService

router = APIRouter()
_service = SummaryService()


@router.get(
    "/{paper_id}/summary",
    response_model=PaperSummary,
    summary="Get structured summary for a paper",
)
async def get_summary(paper_id: str):
    """
    Generate and return a structured extractive summary for a paper.

    Summary includes:
    - Research problem, methodology, dataset, model, key contributions,
      results, limitations, and conclusion.

    The summary is grounded in the paper content — no fabrication.
    """
    logger.info(f"📝 Summary requested for paper: {paper_id}")

    try:
        summary = await _service.get_summary(paper_id)
        if summary is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Paper '{paper_id}' not found.",
            )
        return summary
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Summary generation failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Summary generation failed: {str(exc)}",
        )
