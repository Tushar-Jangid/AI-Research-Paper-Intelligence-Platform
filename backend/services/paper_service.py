

from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

import aiofiles
from loguru import logger

from backend import config
from backend.schemas import PaperDetail, PaperMeta, PaperUploadResponse


# ---------------------------------------------------------------------------
# Simple JSON-based metadata store (replace with DB in production)
# ---------------------------------------------------------------------------

class _MetaStore:
    """Thread-safe (for async) JSON metadata store."""

    def __init__(self, path: Path):
        self._path = path
        self._data: dict = {}
        self._loaded = False

    async def _load(self):
        if self._loaded:
            return
        if self._path.exists():
            async with aiofiles.open(self._path, "r", encoding="utf-8") as f:
                raw = await f.read()
                self._data = json.loads(raw) if raw.strip() else {}
        self._loaded = True

    async def _save(self):
        async with aiofiles.open(self._path, "w", encoding="utf-8") as f:
            await f.write(json.dumps(self._data, indent=2, ensure_ascii=False))

    async def get(self, paper_id: str) -> Optional[dict]:
        await self._load()
        return self._data.get(paper_id)

    async def all(self) -> List[dict]:
        await self._load()
        return list(self._data.values())

    async def put(self, paper_id: str, data: dict):
        await self._load()
        self._data[paper_id] = data
        await self._save()


_store = _MetaStore(config.PAPERS_META_FILE)


# ---------------------------------------------------------------------------
# PaperService
# ---------------------------------------------------------------------------

class PaperService:
    """Handles paper upload pipeline and retrieval."""

    async def upload_paper(self, filename: str, content: bytes) -> PaperUploadResponse:
        paper_id = str(uuid.uuid4())
        pdf_path = config.PAPERS_DIR / f"{paper_id}.pdf"

        # 1. Save PDF to disk
        async with aiofiles.open(pdf_path, "wb") as f:
            await f.write(content)
        logger.info(f"💾 Saved PDF: {pdf_path}")

        # 2. Parse PDF (research_processing module)
        parsed = await asyncio.get_event_loop().run_in_executor(
            None, self._parse_pdf, str(pdf_path)
        )

        # 3. Chunk paper text
        chunks = self._chunk_text(parsed.get("full_text", ""))
        logger.info(f"📄 Generated {len(chunks)} chunks for paper {paper_id}")

        # 4. Generate embeddings & index into FAISS (ai_ml module)
        await asyncio.get_event_loop().run_in_executor(
            None, self._index_chunks, paper_id, parsed.get("title", filename), chunks
        )

        # 5. Build and persist metadata
        meta = {
            "paper_id": paper_id,
            "title": parsed.get("title", filename.replace(".pdf", "")),
            "authors": parsed.get("authors", []),
            "abstract": parsed.get("abstract", ""),
            "num_pages": parsed.get("num_pages", 0),
            "year": parsed.get("year"),
            "venue": parsed.get("venue"),
            "filename": filename,
            "upload_timestamp": datetime.now(timezone.utc).isoformat(),
            "sections": parsed.get("sections", {}),
            "references": parsed.get("references", []),
            "keywords": parsed.get("keywords", []),
            "num_chunks": len(chunks),
        }
        await _store.put(paper_id, meta)

        return PaperUploadResponse(
            paper_id=paper_id,
            title=meta["title"],
            authors=meta["authors"],
            abstract=meta["abstract"],
            num_pages=meta["num_pages"],
            num_chunks=len(chunks),
            message="Paper uploaded and indexed successfully.",
        )

    async def list_papers(self) -> List[PaperMeta]:
        records = await _store.all()
        return [PaperMeta(**{k: v for k, v in r.items() if k in PaperMeta.model_fields}) for r in records]

    async def get_paper(self, paper_id: str) -> Optional[PaperDetail]:
        record = await _store.get(paper_id)
        if record is None:
            return None
        return PaperDetail(**{k: v for k, v in record.items() if k in PaperDetail.model_fields})

    # ------------------------------------------------------------------
    # Internal helpers (run in executor to avoid blocking the event loop)
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_pdf(pdf_path: str) -> dict:
        """Delegate to research_processing.pdf_parser."""
        try:
            from research_processing.pdf_parser import PDFParser
            parser = PDFParser()
            return parser.parse(pdf_path)
        except Exception as exc:
            logger.warning(f"PDF parser failed ({exc}), using stub result.")
            return {
                "title": Path(pdf_path).stem,
                "authors": [],
                "abstract": "",
                "full_text": "",
                "num_pages": 0,
                "sections": {},
                "references": [],
                "keywords": [],
            }

    @staticmethod
    def _chunk_text(text: str) -> List[str]:
        """Split text into overlapping chunks."""
        words = text.split()
        size = config.MAX_CHUNK_TOKENS
        overlap = config.CHUNK_OVERLAP
        chunks = []
        i = 0
        while i < len(words):
            chunk = " ".join(words[i: i + size])
            if chunk.strip():
                chunks.append(chunk)
            i += size - overlap
        return chunks

    @staticmethod
    def _index_chunks(paper_id: str, title: str, chunks: List[str]):
        """Generate embeddings and index into FAISS via ai_ml module."""
        try:
            from ai_ml.embedding_engine import EmbeddingEngine
            from ai_ml.vector_store import VectorStore

            engine = EmbeddingEngine()
            store = VectorStore()

            embeddings = engine.embed_texts(chunks)
            metadata = [
                {"paper_id": paper_id, "title": title, "section": "body", "chunk_text": c}
                for c in chunks
            ]
            store.add(embeddings, metadata)
            store.save()
            logger.info(f"✅ Indexed {len(chunks)} chunks for paper {paper_id}")
        except Exception as exc:
            logger.warning(f"Embedding/indexing failed ({exc}). Running in stub mode.")
