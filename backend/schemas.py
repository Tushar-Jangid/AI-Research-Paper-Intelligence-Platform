from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid


# ---------------------------------------------------------------------------
# Paper schemas
# ---------------------------------------------------------------------------

class PaperUploadResponse(BaseModel):
    paper_id: str
    title: str
    authors: List[str]
    abstract: str
    num_pages: int
    num_chunks: int
    message: str


class PaperMeta(BaseModel):
    paper_id: str
    title: str
    authors: List[str]
    abstract: str
    num_pages: int
    year: Optional[str] = None
    venue: Optional[str] = None
    filename: str
    upload_timestamp: str


class PaperDetail(PaperMeta):
    sections: Dict[str, str] = Field(default_factory=dict)
    references: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)


class PapersListResponse(BaseModel):
    total: int
    papers: List[PaperMeta]


# ---------------------------------------------------------------------------
# Search schemas
# ---------------------------------------------------------------------------

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=3, description="Semantic search query")
    top_k: int = Field(default=10, ge=1, le=50)


class SearchResult(BaseModel):
    paper_id: str
    title: str
    section: str
    chunk_text: str
    similarity_score: float


class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResult]


# ---------------------------------------------------------------------------
# Summary schemas
# ---------------------------------------------------------------------------

class PaperSummary(BaseModel):
    paper_id: str
    title: str
    authors: List[str]
    abstract: str
    research_problem: str
    methodology: str
    dataset: str
    model_algorithm: str
    key_contributions: List[str]
    results: str
    limitations: str
    conclusion: str


# ---------------------------------------------------------------------------
# Comparison schemas
# ---------------------------------------------------------------------------

class ComparisonRequest(BaseModel):
    paper_ids: List[str] = Field(..., min_length=2, description="At least 2 paper IDs to compare")


class PaperComparisonRow(BaseModel):
    paper_id: str
    title: str
    dataset: str
    model: str
    methodology: str
    metrics: str
    results: str
    strengths: str
    limitations: str


class ComparisonResponse(BaseModel):
    paper_ids: List[str]
    comparison: List[PaperComparisonRow]
    research_trends: List[str]
    potential_gaps: List[str]


# ---------------------------------------------------------------------------
# Citation schemas
# ---------------------------------------------------------------------------

class CitationNode(BaseModel):
    id: str
    title: str
    authors: List[str]
    year: Optional[str] = None


class CitationEdge(BaseModel):
    source: str
    target: str


class CitationNetworkResponse(BaseModel):
    paper_id: str
    nodes: List[CitationNode]
    edges: List[CitationEdge]
    statistics: Dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Literature Review schemas
# ---------------------------------------------------------------------------

class LiteratureReviewRequest(BaseModel):
    paper_ids: List[str] = Field(..., min_length=2, description="Papers to include in review")
    title: Optional[str] = "Literature Review"


class LiteratureReviewResponse(BaseModel):
    title: str
    paper_ids: List[str]
    introduction: str
    existing_research: str
    methodologies: str
    datasets: str
    experimental_results: str
    comparison: str
    research_trends: List[str]
    potential_research_gaps: List[str]
    conclusion: str
