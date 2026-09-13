

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from loguru import logger

from backend.schemas import LiteratureReviewRequest, LiteratureReviewResponse
from backend.services.review_service import ReviewService

router = APIRouter()
_service = ReviewService()


@router.post(
    "",
    response_model=LiteratureReviewResponse,
    summary="Generate a structured literature review",
)
async def generate_literature_review(request: LiteratureReviewRequest):
    """
    Generate a structured literature review from selected papers.

    Sections:
    1. Introduction
    2. Existing Research
    3. Methodologies
    4. Datasets
    5. Experimental Results
    6. Comparison
    7. Research Trends  (observations from the selected papers, NOT universal facts)
    8. Potential Research Gaps  (labeled as *potential* — researcher verification required)
    9. Conclusion

    The review is grounded in the selected papers — no fabricated content.
    """
    if len(request.paper_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 paper IDs are required for a literature review.",
        )

    logger.info(f"📚 Literature review requested for: {request.paper_ids}")

    try:
        review = await _service.generate_review(request)
        return review
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error(f"Literature review failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Literature review generation failed: {str(exc)}",
        )
