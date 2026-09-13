

from __future__ import annotations

import asyncio
from typing import List

from loguru import logger

from backend.schemas import SearchResult


class SearchService:
    """Handles semantic search requests."""

    async def search(self, query: str, top_k: int) -> List[SearchResult]:
        results = await asyncio.get_event_loop().run_in_executor(
            None, self._sync_search, query, top_k
        )
        return results

    @staticmethod
    def _sync_search(query: str, top_k: int) -> List[SearchResult]:
        try:
            from ai_ml.embedding_engine import EmbeddingEngine
            from ai_ml.vector_store import VectorStore

            engine = EmbeddingEngine()
            store = VectorStore()

            query_embedding = engine.embed_text(query)
            raw_results = store.search(query_embedding, top_k=top_k)

            results = []
            for r in raw_results:
                results.append(
                    SearchResult(
                        paper_id=r["paper_id"],
                        title=r.get("title", "Unknown"),
                        section=r.get("section", "body"),
                        chunk_text=r.get("chunk_text", ""),
                        similarity_score=round(float(r.get("score", 0.0)), 4),
                    )
                )
            return results

        except Exception as exc:
            logger.warning(f"Search service falling back to stub: {exc}")
            # Return empty results gracefully — UI will show "No results"
            return []
