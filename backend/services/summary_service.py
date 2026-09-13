

from __future__ import annotations

import asyncio
from typing import Optional

from loguru import logger

from backend.schemas import PaperSummary
from backend.services.paper_service import _store


class SummaryService:
    """Handles paper summary generation."""

    async def get_summary(self, paper_id: str) -> Optional[PaperSummary]:
        record = await _store.get(paper_id)
        if record is None:
            return None

        summary = await asyncio.get_event_loop().run_in_executor(
            None, self._sync_summarize, paper_id, record
        )
        return summary

    @staticmethod
    def _sync_summarize(paper_id: str, record: dict) -> PaperSummary:
        try:
            from ai_ml.summarizer import Summarizer

            summarizer = Summarizer()
            sections = record.get("sections", {})
            full_text = " ".join(sections.values()) if sections else record.get("abstract", "")

            result = summarizer.summarize(
                paper_id=paper_id,
                title=record.get("title", ""),
                authors=record.get("authors", []),
                abstract=record.get("abstract", ""),
                sections=sections,
                full_text=full_text,
            )
            return result

        except Exception as exc:
            logger.warning(f"Summarizer falling back to stub: {exc}")
            return PaperSummary(
                paper_id=paper_id,
                title=record.get("title", ""),
                authors=record.get("authors", []),
                abstract=record.get("abstract", "Abstract not available."),
                research_problem="[TODO: AI/ML summarizer not yet trained]",
                methodology="[TODO: AI/ML summarizer not yet trained]",
                dataset="[TODO: AI/ML summarizer not yet trained]",
                model_algorithm="[TODO: AI/ML summarizer not yet trained]",
                key_contributions=["[TODO: AI/ML summarizer not yet trained]"],
                results="[TODO: AI/ML summarizer not yet trained]",
                limitations="[TODO: AI/ML summarizer not yet trained]",
                conclusion="[TODO: AI/ML summarizer not yet trained]",
            )
