import re
import io
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class PDFParser:
    """Robust multi-engine PDF parser for academic research papers."""

    def __init__(self):
        self.section_patterns = {
            "abstract": re.compile(r"(?i)\b(abstract|summary)\b"),
            "introduction": re.compile(r"(?i)\b(1\.?\s*|i\.?\s*)?(introduction|background)\b"),
            "methodology": re.compile(r"(?i)\b(\d\.?\s*|[ivx]+\.?\s*)?(methodology|proposed method|model architecture|our approach|system model|methods)\b"),
            "results": re.compile(r"(?i)\b(\d\.?\s*|[ivx]+\.?\s*)?(results|experiments|experimental setup|evaluation|performance analysis|findings)\b"),
            "conclusion": re.compile(r"(?i)\b(\d\.?\s*|[ivx]+\.?\s*)?(conclusion|discussion|concluding remarks|future work)\b"),
            "references": re.compile(r"(?i)\b(\d\.?\s*|[ivx]+\.?\s*)?(references|bibliography)\b")
        }

    def extract_text_from_pdf_bytes(self, pdf_bytes: bytes) -> str:
        """Attempts text extraction using PyMuPDF (fitz), pdfplumber, pypdf, or pdfminer in cascade."""
        text = ""

        # Try PyMuPDF (fitz)
        try:
            import fitz
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            pages_text = []
            for page in doc:
                pages_text.append(page.get_text("text"))
            text = "\n\n".join(pages_text)
            if len(text.strip()) > 100:
                return self._clean_text(text)
        except Exception as e:
            logger.warning(f"PyMuPDF extraction failed or unavailable: {e}")

        # Try pdfplumber
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                pages_text = [page.extract_text() or "" for page in pdf.pages]
                text = "\n\n".join(pages_text)
                if len(text.strip()) > 100:
                    return self._clean_text(text)
        except Exception as e:
            logger.warning(f"pdfplumber extraction failed or unavailable: {e}")

        # Try pypdf
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            pages_text = [page.extract_text() or "" for page in reader.pages]
            text = "\n\n".join(pages_text)
            if len(text.strip()) > 100:
                return self._clean_text(text)
        except Exception as e:
            logger.warning(f"pypdf extraction failed or unavailable: {e}")

        # Try pdfminer.six
        try:
            from pdfminer.high_level import extract_text as pdfminer_extract
            text = pdfminer_extract(io.BytesIO(pdf_bytes))
            if len(text.strip()) > 100:
                return self._clean_text(text)
        except Exception as e:
            logger.warning(f"pdfminer extraction failed or unavailable: {e}")

        return self._clean_text(text)

    def _clean_text(self, text: str) -> str:
        """Removes duplicate blank lines, page numbers, and normalizes line breaks."""
        if not text:
            return ""
        # Remove standalone page numbers e.g. "Page 1 of 12" or single trailing numbers
        text = re.sub(r"\n\s*\d+\s*\n", "\n", text)
        text = re.sub(r"(?i)Page \d+ of \d+", "", text)
        # Normalize multiple newlines
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    def parse_sections(self, text: str) -> Dict[str, str]:
        """Parses extracted paper text into structured sections."""
        sections = {
            "Abstract": "",
            "Introduction": "",
            "Methodology": "",
            "Results": "",
            "Conclusion": "",
            "References": "",
            "Other": ""
        }

        lines = text.split("\n")
        current_section = "Introduction"
        buffer = []

        for line in lines:
            trimmed = line.strip()
            if not trimmed:
                continue

            # Check if line matches a section header
            matched_sec = None
            for sec_name, pattern in self.section_patterns.items():
                if len(trimmed) < 60 and pattern.search(trimmed):
                    matched_sec = sec_name.capitalize()
                    break

            if matched_sec:
                if buffer and current_section:
                    sec_key = current_section if current_section in sections else "Other"
                    sections[sec_key] = sections[sec_key] + "\n" + "\n".join(buffer)
                current_section = matched_sec
                buffer = [trimmed]
            else:
                buffer.append(trimmed)

        if buffer and current_section:
            sec_key = current_section if current_section in sections else "Other"
            sections[sec_key] = sections[sec_key] + "\n" + "\n".join(buffer)

        # Fallback heuristic for Abstract if empty
        if not sections["Abstract"].strip():
            abs_match = re.search(r"(?i)abstract[:\s]+(.*?)(?=\n\s*(1\.?\s*|i\.?\s*)?introduction|\n\s*\n\s*[A-Z])", text, re.DOTALL)
            if abs_match:
                sections["Abstract"] = abs_match.group(1).strip()
            else:
                # Take first 250 words
                sections["Abstract"] = " ".join(text.split()[:250]) + "..."

        # Clean section contents
        for key in sections:
            sections[key] = sections[key].strip()

        return sections

    def extract_paper_metadata(self, title_hint: str, text: str, sections: Dict[str, str]) -> Dict[str, Any]:
        """Extracts metadata, citations, datasets, baselines, and metrics from text."""
        # Detect paper title
        title = title_hint
        first_lines = [l.strip() for l in text.split("\n")[:10] if l.strip()]
        if first_lines and len(first_lines[0]) > 5:
            # First line often contains title if not provided
            potential_title = first_lines[0]
            if len(potential_title) < 150:
                title = potential_title

        # Detect year
        year_match = re.search(r"\b(19\d\d|20\d\d)\b", text[:2000])
        year = year_match.group(1) if year_match else "2024"

        # Detect Datasets
        dataset_candidates = re.findall(r"(?i)\b(ImageNet|COCO|MNIST|CIFAR-10|CIFAR-100|SQuAD|GLUE|SuperGLUE|Penn Treebank|WikiText|PASCAL VOC|ADE20K|WMT14|MMLU|GSM8K)\b", text)
        datasets = sorted(list(set(dataset_candidates))) if dataset_candidates else ["Standard Scientific Dataset"]

        # Detect Baselines / Models
        model_candidates = re.findall(r"(?i)\b(BERT|SciBERT|RoBERTa|GPT-3|GPT-4|ResNet-50|ResNet-101|ViT|Transformer|VGG-16|YOLO|LSTM|CNN|LLaMA|Mistral)\b", text)
        baselines = sorted(list(set(model_candidates))) if model_candidates else ["Transformer Baselines"]

        # Detect Metrics
        metric_candidates = re.findall(r"(?i)\b(Accuracy|F1-score|F1|Precision|Recall|BLEU|ROUGE|MAP|mAP|MSE|RMSE|Perplexity|Top-1|Top-5)\b", text)
        metrics = sorted(list(set(metric_candidates))) if metric_candidates else ["Accuracy", "F1 Score"]

        # Extract References / Citations
        references = self._extract_references(sections.get("References", ""))

        return {
            "title": title,
            "year": year,
            "abstract": sections.get("Abstract", "")[:1000],
            "datasets": datasets,
            "baselines": baselines,
            "metrics": metrics,
            "references": references
        }

    def _extract_references(self, ref_text: str) -> List[str]:
        """Extracts parsed reference items from the References section."""
        if not ref_text:
            return []
        refs = []
        # Match numbered references like [1] Author et al., "Title", 2020.
        matches = re.split(r"\n(?=\[\d+\]|\d+\.\s+[A-Z])", ref_text)
        for m in matches:
            cleaned = m.strip().replace("\n", " ")
            if len(cleaned) > 15:
                refs.append(cleaned[:250])
        return refs[:20]  # Cap at top 20
