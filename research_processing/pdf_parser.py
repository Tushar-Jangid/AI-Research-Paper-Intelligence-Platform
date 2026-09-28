from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from loguru import logger

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config

SECTION_PATTERNS = [
    r"^(?:I\.?|1\.?)\s+introduction",
    r"^(?:II\.?|2\.?)\s+(?:related\s+work|background)",
    r"^(?:III\.?|3\.?)\s+(?:method|approach|model|proposed|architecture|framework)",
    r"^(?:IV\.?|4\.?)\s+(?:experiment|evaluation|dataset|result)",
    r"^(?:V\.?|5\.?)\s+(?:result|analysis|discussion)",
    r"^(?:VI\.?|6\.?)\s+(?:conclusion|summary|future)",
    r"^(?:VII\.?|7\.?)\s+(?:limitation|acknowledgement|reference)",
    r"^abstract",
    r"^introduction",
    r"^related\s+work",
    r"^background",
    r"^method(?:ology)?",
    r"^approach",
    r"^model",
    r"^(?:proposed\s+)?architecture",
    r"^framework",
    r"^experiment(?:al\s+setup)?",
    r"^evaluation",
    r"^dataset",
    r"^result(?:s)?",
    r"^discussion",
    r"^conclusion(?:s)?",
    r"^limitation(?:s)?",
    r"^reference(?:s)?",
    r"^acknowledgement(?:s)?",
]

_SECTION_RE = re.compile(
    "|".join(SECTION_PATTERNS),
    re.IGNORECASE | re.MULTILINE,
)

_REF_LINE_RE = re.compile(
    r"^\s*\[?\d{1,3}\]?\s+[A-Z][a-z]",
    re.MULTILINE,
)

_AUTHOR_RE = re.compile(r"[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+")
_YEAR_RE = re.compile(r"\b(?:19|20)\d{2}\b")

NOISE_TITLE_PATTERNS = [
    r"(?i)open\s+access", r"(?i)creative\s+commons", r"(?i)license",
    r"(?i)international\s+journal", r"(?i)discover\s+computing",
    r"(?i)doi:", r"(?i)http[s]?://", r"(?i)issn", r"(?i)volume\s+\d",
    r"(?i)all\s+rights\s+reserved", r"(?i)peer-reviewed", r"(?i)refereed",
    r"(?i)copyright", r"(?i)^research$", r"(?i)article\s+history",
    r"(?i)published:", r"(?i)correspondence:", r"(?i)page\s+\d+\s+of\s+\d+",
    r"(?i)ieee\s+transactions", r"(?i)acm\s+transactions", r"(?i)arxiv:",
    r"(?i)original\s+article", r"(?i)review\s+article"
]


class PDFParser:

    def parse(self, pdf_path: str) -> Dict:
        try:
            import fitz  # PyMuPDF
        except ImportError:
            raise ImportError("Install PyMuPDF: pip install pymupdf")

        logger.info(f"📄 Parsing PDF: {pdf_path}")
        doc = fitz.open(pdf_path)

        pages_text = []
        for page in doc:
            pages_text.append(page.get_text("text"))

        full_text = "\n".join(pages_text)
        num_pages = len(doc)
        title    = self._extract_title(doc, pages_text)
        authors  = self._extract_authors(doc, pages_text, title)
        abstract = self._extract_abstract(full_text)
        year     = self._extract_year(full_text[:1200])
        keywords = self._extract_keywords(full_text)
        sections = self._detect_sections(full_text)
        references = self._extract_references(full_text)
        doc.close()

        logger.info(
            f"   Parsed: '{title}' ({year}) by {authors} | {num_pages} pages | {len(sections)} sections | "
            f"{len(references)} references"
        )

        return {
            "title":      title,
            "authors":    authors,
            "abstract":   abstract,
            "year":       year,
            "venue":      None,
            "keywords":   keywords,
            "sections":   sections,
            "references": references,
            "full_text":  full_text,
            "num_pages":  num_pages,
        }

    @staticmethod
    def _is_noise(txt: str) -> bool:
        return any(re.search(p, txt) for p in NOISE_TITLE_PATTERNS)

    @classmethod
    def _extract_title(cls, doc: Any, pages_text: List[str]) -> str:
        # 1. First attempt: font-size inspection from PyMuPDF
        try:
            p0 = doc[0]
            d = p0.get_text("dict")
            spans = []
            for b in d.get("blocks", []):
                if "lines" in b:
                    for l in b["lines"]:
                        for s in l.get("spans", []):
                            txt = s.get("text", "").strip()
                            if txt and len(txt) > 2 and not cls._is_noise(txt):
                                spans.append((s.get("size", 10), txt))

            if spans:
                spans.sort(key=lambda x: -x[0])
                max_size = spans[0][0]
                title_parts = [
                    s[1] for s in spans
                    if abs(s[0] - max_size) < 1.2 and not cls._is_noise(s[1])
                ]
                candidate = " ".join(title_parts).strip()
                if len(candidate) > 15:
                    return candidate
        except Exception as exc:
            logger.debug(f"Font size title extraction failed: {exc}")

        # 2. Fallback: text lines before abstract
        first_page = pages_text[0] if pages_text else ""
        lines = [l.strip() for l in first_page.split("\n") if l.strip()]

        for line in lines[:15]:
            if len(line) > 15 and not cls._is_noise(line) and not line.lower().startswith("abstract"):
                return line

        return "Unknown Title"

    @classmethod
    def _extract_authors(cls, doc: Any, pages_text: List[str], title: str) -> List[str]:
        first_page = pages_text[0] if pages_text else ""
        lines = [l.strip() for l in first_page.split("\n") if l.strip()]

        title_words = set(re.findall(r"\w+", title.lower()))
        title_idx = -1
        for i, l in enumerate(lines[:25]):
            line_words = set(re.findall(r"\w+", l.lower()))
            if len(title_words.intersection(line_words)) >= 2:
                title_idx = i

        authors = []
        author_blacklist = {
            "abstract", "introduction", "keywords", "assistant professor", "professor",
            "department", "university", "school", "student", "college", "institute",
            "article info", "peer-reviewed", "open access", "research gap detection"
        }

        search_range = lines[title_idx + 1: title_idx + 6] if title_idx >= 0 else lines[1:12]
        for l in search_range:
            l_lower = l.lower()
            if any(term in l_lower for term in author_blacklist):
                continue
            cleaned = re.sub(r"[\d\*†‡§]+", "", l)
            cleaned = re.sub(r"\band\b", ",", cleaned)
            for part in cleaned.split(","):
                part = part.strip()
                if 2 <= len(part.split()) <= 4 and re.match(r"^[A-Z][a-zA-Z\s\.\-]+$", part):
                    if part not in authors:
                        authors.append(part)

        if not authors:
            # Fallback regex
            for line in lines[1:15]:
                if "abstract" in line.lower():
                    break
                matches = _AUTHOR_RE.findall(line)
                for m in matches:
                    if not any(b in m.lower() for b in author_blacklist) and m not in authors:
                        authors.append(m)

        return authors[:8]

    @staticmethod
    def _extract_abstract(full_text: str) -> str:
        match = re.search(
            r"abstract\s*[:\n](.*?)(?=\n\s*(?:introduction|keywords|1\.|I\.|\d+\s+introduction))",
            full_text,
            re.IGNORECASE | re.DOTALL,
        )
        if match:
            raw = match.group(1).strip()
            clean_lines = []
            for line in raw.split("\n"):
                stripped = line.strip()
                if not stripped:
                    continue
                if any(re.search(p, stripped) for p in NOISE_TITLE_PATTERNS):
                    continue
                if re.match(r"^(?:Article\s+Info|September-\d+|Page\s+Number|Corresponding\s+Author)", stripped, re.I):
                    continue
                clean_lines.append(stripped)
            clean_text = " ".join(clean_lines)
            clean_text = re.sub(r"\s+", " ", clean_text).strip()
            return clean_text[:2000]

        idx = full_text.lower().find("abstract")
        if idx >= 0:
            return full_text[idx + 8 : idx + 1008].strip()

        return ""

    @staticmethod
    def _extract_year(text: str) -> Optional[str]:
        matches = _YEAR_RE.findall(text)
        return matches[0] if matches else None

    @staticmethod
    def _extract_keywords(full_text: str) -> List[str]:
        match = re.search(
            r"keywords?\s*[:—]\s*(.+?)(?:\n|\.|abstract|introduction)",
            full_text,
            re.IGNORECASE,
        )
        if match:
            raw = match.group(1)
            keywords = [k.strip() for k in re.split(r"[,;•·]", raw) if k.strip()]
            return keywords[:15]
        return []

    @staticmethod
    def _detect_sections(full_text: str) -> Dict[str, str]:
        lines = full_text.split("\n")
        sections: Dict[str, str] = {}
        current_section: Optional[str] = None
        current_lines: List[str] = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                if current_lines:
                    current_lines.append("")
                continue
            is_heading = False
            if len(stripped) < 100: 
                for pattern in SECTION_PATTERNS:
                    if re.match(pattern, stripped, re.IGNORECASE):
                        is_heading = True
                        break

            if is_heading:
                if current_section and current_lines:
                    sections[current_section] = " ".join(
                        l for l in current_lines if l.strip()
                    )
                current_section = re.sub(r"^[\dIVX]+\.?\s*", "", stripped).lower().strip()
                current_lines = []
            else:
                if current_section:
                    current_lines.append(stripped)
        if current_section and current_lines:
            sections[current_section] = " ".join(l for l in current_lines if l.strip())

        return sections

    @staticmethod
    def _extract_references(full_text: str) -> List[str]:
        ref_match = re.search(
            r"(?:^|\n)references?\s*\n(.*?)(?=\n\s*(?:appendix|acknowledgement|$))",
            full_text,
            re.IGNORECASE | re.DOTALL,
        )
        if not ref_match:
            return []

        ref_text = ref_match.group(1)
        lines = ref_text.split("\n")

        references = []
        current_ref = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            # New reference starts with [N] or N.
            if re.match(r"^\[?\d{1,3}\]?\.?\s+[A-Z]", stripped):
                if current_ref:
                    references.append(" ".join(current_ref))
                current_ref = [stripped]
            else:
                current_ref.append(stripped)

        if current_ref:
            references.append(" ".join(current_ref))

        return references[:100]
