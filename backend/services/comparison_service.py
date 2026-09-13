

from __future__ import annotations

import asyncio
from typing import List

from loguru import logger

from backend.schemas import ComparisonResponse, PaperComparisonRow
from backend.services.paper_service import _store


class ComparisonService:
    """Handles multi-paper comparison."""

    async def compare(self, paper_ids: List[str]) -> ComparisonResponse:
        # Load all paper records
        records = []
        for pid in paper_ids:
            rec = await _store.get(pid)
            if rec is None:
                raise ValueError(f"Paper '{pid}' not found.")
            records.append(rec)

        result = await asyncio.get_event_loop().run_in_executor(
            None, self._sync_compare, paper_ids, records
        )
        return result

    @staticmethod
    def _sync_compare(paper_ids: List[str], records: List[dict]) -> ComparisonResponse:
        try:
            from research_processing.comparison_engine import ComparisonEngine
            engine = ComparisonEngine()
            return engine.compare(paper_ids, records)
        except Exception as exc:
            logger.warning(f"ComparisonEngine falling back to stub: {exc}")
            # Stub comparison rows
            rows = [
                PaperComparisonRow(
                    paper_id=r["paper_id"],
                    title=r.get("title", "Unknown"),
                    dataset="[TODO: extraction pending]",
                    model="[TODO: extraction pending]",
                    methodology="[TODO: extraction pending]",
                    metrics="[TODO: extraction pending]",
                    results="[TODO: extraction pending]",
                    strengths="[TODO: extraction pending]",
                    limitations="[TODO: extraction pending]",
                )
                for r in records
            ]
            return ComparisonResponse(
                paper_ids=paper_ids,
                comparison=rows,
                research_trends=["[TODO: trend analysis pending]"],
                potential_gaps=["[TODO: gap analysis pending]"],
            )
