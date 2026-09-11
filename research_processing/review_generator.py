from __future__ import annotations
import re
import sys
from pathlib import Path
from typing import Dict, List

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from loguru import logger
from research_processing.comparison_engine import (
    ComparisonEngine,
    _sentences,
    _score_sentences,
    DATASET_KEYWORDS,
    METHOD_KEYWORDS,
    RESULT_KEYWORDS,
)


class ReviewGenerator:
    def generate(
        self,
        request: "LiteratureReviewRequest",
        records: List[Dict],
    ) -> "LiteratureReviewResponse":
        from backend.schemas import LiteratureReviewResponse

        n     = len(records)
        title = request.title or "Literature Review"
        titles = [r.get("title", f"Paper {i+1}") for i, r in enumerate(records)]

        logger.info(f"📚 Generating literature review for {n} papers")

        # Run comparison to get trends and gaps
        comparison_engine = ComparisonEngine()
        comparison = comparison_engine.compare(request.paper_ids, records)

        introduction      = self._build_introduction(title, records, titles)
        existing_research = self._build_existing_research(records, titles)
        methodologies     = self._build_methodologies(records)
        datasets          = self._build_datasets(records)
        experimental      = self._build_experimental_results(records)
        comparison_text   = self._build_comparison_text(records, titles)
        conclusion        = self._build_conclusion(records, titles)

        return LiteratureReviewResponse(
            title=title,
            paper_ids=request.paper_ids,
            introduction=introduction,
            existing_research=existing_research,
            methodologies=methodologies,
            datasets=datasets,
            experimental_results=experimental,
            comparison=comparison_text,
            research_trends=comparison.research_trends,
            potential_research_gaps=comparison.potential_gaps,
            conclusion=conclusion,
        )
    @staticmethod
    def _build_introduction(title: str, records: List[Dict], titles: List[str]) -> str:
        n = len(records)
        paper_list = "; ".join(f'"{t}"' for t in titles[:5])
        if len(titles) > 5:
            paper_list += f", and {len(titles) - 5} more"

        abstracts_snippet = ""
        for rec in records[:2]:
            abstract = rec.get("abstract", "")
            if abstract:
                abstracts_snippet += f' {abstract[:200].strip()}...'

        return (
            f"This literature review examines {n} research papers in the field. "
            f"The selected papers include: {paper_list}. "
            f"The goal is to systematically organize findings, methodologies, datasets, "
            f"results, and identify observable patterns and potential research directions "
            f"from the selected collection.{abstracts_snippet}"
        )

    @staticmethod
    def _build_existing_research(records: List[Dict], titles: List[str]) -> str:
        summaries = []
        for i, rec in enumerate(records):
            abstract = rec.get("abstract", "")
            if abstract:
                summaries.append(
                    f'[{i+1}] "{rec.get("title", "Unknown")}" '
                    f'({rec.get("year", "n.d.")}): {abstract[:300].strip()}'
                )

        if not summaries:
            return "Abstracts not available for the selected papers."

        return (
            "The selected papers address various aspects of the research domain. "
            "Key abstracts include:\n\n" + "\n\n".join(summaries)
        )

    @staticmethod
    def _build_methodologies(records: List[Dict]) -> str:
        method_descriptions = []
        for rec in records:
            full_text = " ".join(rec.get("sections", {}).values()) or rec.get("abstract", "")
            sents = _sentences(full_text)
            method = _score_sentences(sents, METHOD_KEYWORDS, top_n=2)
            if method and "[Not identified]" not in method:
                method_descriptions.append(
                    f'"{rec.get("title", "Unknown")}": {method}'
                )

        if not method_descriptions:
            return "Methodology details could not be automatically extracted from the selected papers."

        return (
            "The selected papers employ various methodological approaches:\n\n"
            + "\n\n".join(method_descriptions)
        )

    @staticmethod
    def _build_datasets(records: List[Dict]) -> str:
        dataset_descriptions = []
        for rec in records:
            full_text = " ".join(rec.get("sections", {}).values()) or rec.get("abstract", "")
            sents = _sentences(full_text)
            dataset = _score_sentences(sents, DATASET_KEYWORDS, top_n=2)
            if dataset and "[Not identified]" not in dataset:
                dataset_descriptions.append(
                    f'"{rec.get("title", "Unknown")}": {dataset}'
                )

        if not dataset_descriptions:
            return "Dataset information could not be automatically extracted from the selected papers."

        return (
            "The following datasets and corpora are used across the selected papers:\n\n"
            + "\n\n".join(dataset_descriptions)
        )

    @staticmethod
    def _build_experimental_results(records: List[Dict]) -> str:
        result_descriptions = []
        for rec in records:
            full_text = " ".join(rec.get("sections", {}).values()) or rec.get("abstract", "")
            sents = _sentences(full_text)
            results = _score_sentences(sents, RESULT_KEYWORDS, top_n=2)
            if results and "[Not identified]" not in results:
                result_descriptions.append(
                    f'"{rec.get("title", "Unknown")}": {results}'
                )

        if not result_descriptions:
            return "Experimental results could not be automatically extracted from the selected papers."

        return (
            "Experimental results reported across the selected papers include:\n\n"
            + "\n\n".join(result_descriptions)
        )

    @staticmethod
    def _build_comparison_text(records: List[Dict], titles: List[str]) -> str:
        if len(records) < 2:
            return "Only one paper selected — comparison requires at least 2 papers."

        points = []
        for i, rec_a in enumerate(records):
            for j, rec_b in enumerate(records):
                if i >= j:
                    continue
                points.append(
                    f'"{titles[i]}" and "{titles[j]}" both appear in the selected collection. '
                    "A detailed comparison is available in the Comparison tool."
                )

        return (
            "A cross-paper comparison of methodologies, datasets, and results is summarized below. "
            "For an interactive structured comparison table, use the Compare Papers feature.\n\n"
            + "\n".join(points[:5])
        )

    @staticmethod
    def _build_conclusion(records: List[Dict], titles: List[str]) -> str:
        n = len(records)
        return (
            f"This literature review has examined {n} research papers. "
            f"The analysis is based solely on the uploaded paper content. "
            f"Research trends and potential gaps identified here are observations "
            f"from the selected collection and require researcher verification before "
            f"drawing broader conclusions. "
            f"Future work may involve expanding the paper collection and refining "
            f"the analysis with domain-specific expert knowledge."
        )
