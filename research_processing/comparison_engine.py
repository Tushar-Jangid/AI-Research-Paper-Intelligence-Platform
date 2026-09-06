from __future__ import annotations
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Dict, List, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from loguru import logger
DATASET_KEYWORDS  = ["dataset", "corpus", "benchmark", "collected from", "training data"]
MODEL_KEYWORDS    = [
    "transformer", "bert", "gpt", "cnn", "rnn", "lstm", "resnet",
    "vit", "vision transformer", "diffusion", "gan", "encoder", "decoder",
]
METHOD_KEYWORDS   = ["fine-tun", "pre-train", "contrastive", "supervised",
                     "self-supervised", "reinforce", "attention", "proposed method"]
METRIC_KEYWORDS   = ["accuracy", "f1", "bleu", "rouge", "map", "recall",
                     "precision", "perplexity", "auc", "rmse", "mae"]
RESULT_KEYWORDS   = ["achieve", "outperform", "surpass", "state-of-the-art",
                     "best", "improve", "score", "performance"]
LIMIT_KEYWORDS    = ["limitation", "future work", "not handle", "cannot",
                     "restricted to", "only works", "does not generalize"]
STRENGTH_KEYWORDS = ["advantage", "strength", "efficient", "scalable",
                     "novel", "first to", "outperform", "state-of-the-art"]


def _score_sentences(sentences: List[str], keywords: List[str], top_n: int = 2) -> str:
    scored = []
    for sent in sentences:
        s_lower = sent.lower()
        score = sum(1 for kw in keywords if kw in s_lower)
        if score > 0:
            scored.append((score, sent))
    scored.sort(key=lambda x: -x[0])
    top = [s for _, s in scored[:top_n]]
    return " ".join(top) if top else "[Not identified]"


def _sentences(text: str) -> List[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 15]


class ComparisonEngine:

    def compare(
        self,
        paper_ids: List[str],
        records: List[Dict],
    ) -> "ComparisonResponse":
        from backend.schemas import ComparisonResponse, PaperComparisonRow

        rows = []
        all_models = []
        all_datasets = []
        all_methods = []

        for rec in records:
            full_text = " ".join(rec.get("sections", {}).values())
            if not full_text:
                full_text = rec.get("abstract", "")

            sents = _sentences(full_text)

            dataset  = _score_sentences(sents, DATASET_KEYWORDS)
            model    = _score_sentences(sents, MODEL_KEYWORDS)
            method   = _score_sentences(sents, METHOD_KEYWORDS)
            metrics  = _score_sentences(sents, METRIC_KEYWORDS)
            results  = _score_sentences(sents, RESULT_KEYWORDS)
            strength = _score_sentences(sents, STRENGTH_KEYWORDS)
            limit    = _score_sentences(sents, LIMIT_KEYWORDS)

            all_models.append(model)
            all_datasets.append(dataset)
            all_methods.append(method)

            rows.append(
                PaperComparisonRow(
                    paper_id=rec["paper_id"],
                    title=rec.get("title", "Unknown"),
                    dataset=dataset,
                    model=model,
                    methodology=method,
                    metrics=metrics,
                    results=results,
                    strengths=strength,
                    limitations=limit,
                )
            )

        trends = self._analyze_trends(records, all_models, all_methods)
        gaps   = self._identify_gaps(records, all_methods, all_datasets)

        logger.info(f"📊 Compared {len(records)} papers: {len(trends)} trends, {len(gaps)} potential gaps")

        return ComparisonResponse(
            paper_ids=paper_ids,
            comparison=rows,
            research_trends=trends,
            potential_gaps=gaps,
        )
    @staticmethod
    def _analyze_trends(
        records: List[Dict],
        all_models: List[str],
        all_methods: List[str],
    ) -> List[str]:
        trends = []
        n = len(records)

        model_counts: Counter = Counter()
        for model_text in all_models:
            m_lower = model_text.lower()
            for kw in ["transformer", "cnn", "rnn", "lstm", "resnet",
                       "bert", "gpt", "vit", "diffusion", "gan"]:
                if kw in m_lower:
                    model_counts[kw] += 1

        for model, count in model_counts.most_common(3):
            pct = round(count / n * 100)
            trends.append(
                f"Observation from selected papers: {model.upper()}-based approaches appear "
                f"in {count}/{n} papers ({pct}%)."
            )

        method_counts: Counter = Counter()
        for method_text in all_methods:
            m_lower = method_text.lower()
            for kw in ["fine-tun", "contrastive", "supervised",
                       "self-supervised", "pre-train", "reinforce"]:
                if kw in m_lower:
                    method_counts[kw.replace("-", "")] += 1

        for method, count in method_counts.most_common(2):
            pct = round(count / n * 100)
            trends.append(
                f"Observation: '{method}' methodology appears in {count}/{n} papers ({pct}%)."
            )

        if not trends:
            trends.append(
                "Observation: Insufficient structured data extracted to identify clear trends. "
                "Please review individual paper summaries."
            )

        return trends

    @staticmethod
    def _identify_gaps(
        records: List[Dict],
        all_methods: List[str],
        all_datasets: List[str],
    ) -> List[str]:
        gaps = []
        n = len(records)

        large_kw = ["large", "million", "billion", "1m", "10m", "imagenet", "wikipedia"]
        small_kw = ["small", "low-resource", "few-shot", "zero-shot", "limited data"]

        large_count = sum(
            1 for d in all_datasets
            if any(k in d.lower() for k in large_kw)
        )
        small_count = sum(
            1 for d in all_datasets
            if any(k in d.lower() for k in small_kw)
        )

        if large_count > small_count and small_count < n // 2:
            gaps.append(
                f"Potential Research Gap: {large_count}/{n} papers appear to use large datasets, "
                f"while only {small_count}/{n} evaluate on small/low-resource settings. "
                "This observation from the selected collection suggests a potential gap in "
                "low-resource evaluation. (Researcher verification required.)"
            )

        ablation_count = sum(
            1 for rec in records
            if "ablat" in " ".join(rec.get("sections", {}).values()).lower()
        )
        if ablation_count < n // 2:
            gaps.append(
                f"Potential Research Gap: Only {ablation_count}/{n} papers in the selected "
                "collection appear to include ablation studies. "
                "Reproducibility and component analysis may be underexplored. "
                "(Researcher verification required.)"
            )

        if not gaps:
            gaps.append(
                "No clear potential gaps identified from the selected papers. "
                "Consider adding more papers to the collection for deeper analysis. "
                "(All gap claims require researcher verification.)"
            )

        return gaps
