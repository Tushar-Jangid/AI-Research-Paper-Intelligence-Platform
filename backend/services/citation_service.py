

from __future__ import annotations

import asyncio
from typing import Optional

from loguru import logger

from backend.schemas import CitationNetworkResponse, CitationNode, CitationEdge
from backend.services.paper_service import _store


class CitationService:
    """Handles citation network generation."""

    async def get_citation_network(self, paper_id: str) -> Optional[CitationNetworkResponse]:
        record = await _store.get(paper_id)
        if record is None:
            return None

        all_records = await _store.all()

        result = await asyncio.get_event_loop().run_in_executor(
            None, self._sync_build_network, paper_id, record, all_records
        )
        return result

    @staticmethod
    def _sync_build_network(
        paper_id: str, record: dict, all_records: list
    ) -> CitationNetworkResponse:
        try:
            from research_processing.citation_network import CitationNetwork
            net = CitationNetwork()
            return net.build(paper_id, record, all_records)
        except Exception as exc:
            logger.warning(f"CitationNetwork falling back to stub: {exc}")
            # Return minimal stub network
            return CitationNetworkResponse(
                paper_id=paper_id,
                nodes=[
                    CitationNode(
                        id=paper_id,
                        title=record.get("title", "Unknown"),
                        authors=record.get("authors", []),
                        year=record.get("year"),
                    )
                ],
                edges=[],
                statistics={"note": "Citation network building pending — add more papers."},
            )
