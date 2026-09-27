

from __future__ import annotations

import asyncio
from typing import Optional

from loguru import logger

from backend.schemas import LiteratureReviewRequest, LiteratureReviewResponse
from backend.services.paper_service import _store


class ReviewService:
    """Handles structured literature review generation."""

    async def generate_review(
        self, request: LiteratureReviewRequest
    ) -> LiteratureReviewResponse:
        records = []
        for pid in request.paper_ids:
            rec = await _store.get(pid)
            if rec is None:
                raise ValueError(f"Paper '{pid}' not found.")
            records.append(rec)

        result = await asyncio.get_event_loop().run_in_executor(
            None, self._sync_generate, request, records
        )
        return result

    @staticmethod
    def _sync_generate(
        request: LiteratureReviewRequest, records: list
    ) -> LiteratureReviewResponse:
        try:
            from research_processing.review_generator import ReviewGenerator
            gen = ReviewGenerator()
            return gen.generate(request, records)
        except Exception as exc:
            logger.warning(f"ReviewGenerator falling back to stub: {exc}")
            titles = [r.get("title", "Unknown") for r in records]
            return LiteratureReviewResponse(
                title=request.title or "Literature Review",
                paper_ids=request.paper_ids,
                introduction=(
                    f"This literature review examines {len(records)} research papers: "
                    + ", ".join(titles) + "."
                ),
                existing_research="[TODO: review_generator not yet implemented]",
                methodologies="[TODO: review_generator not yet implemented]",
                datasets="[TODO: review_generator not yet implemented]",
                experimental_results="[TODO: review_generator not yet implemented]",
                comparison="[TODO: review_generator not yet implemented]",
                research_trends=["[TODO: trend analysis pending]"],
                potential_research_gaps=[
                    "[TODO: gap analysis pending — labeled as POTENTIAL, requires researcher verification]"
                ],
                conclusion="[TODO: review_generator not yet implemented]",
            )
