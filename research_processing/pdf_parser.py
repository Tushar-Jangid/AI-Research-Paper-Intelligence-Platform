from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

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

_YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")


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
        doc.close()
        title    = self._extract_title(pages_text)
        authors  = self._extract_authors(pages_text)
        abstract = self._extract_abstract(full_text)
        year     = self._extract_year(full_text[:500])
        keywords = self._extract_keywords(full_text)
        sections = self._detect_sections(full_text)
        references = self._extract_references(full_text)

        logger.info(
            f"   Parsed: {num_pages} pages | {len(sections)} sections | "
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
    def _extract_title(pages_text: List[str]) -> str:

        first_page = pages_text[0] if pages_text else ""
        lines = [l.strip() for l in first_page.split("\n") if l.strip()]

        # Title is typically the first line that's longer than 10 chars
        for line in lines[:10]:
            if len(line) > 10 and not line.lower().startswith("abstract"):
                return line

        return "Unknown Title"

    @staticmethod
    def _extract_authors(pages_text: List[str]) -> List[str]:
        first_page = pages_text[0] if pages_text else ""
        lines = [l.strip() for l in first_page.split("\n") if l.strip()]

        authors = []
        for line in lines[1:15]: 
            if "abstract" in line.lower():
                break
            matches = _AUTHOR_RE.findall(line)
            authors.extend(matches)

        seen = set()
        unique_authors = []
        for a in authors:
            if a not in seen and len(a) > 3:
                seen.add(a)
                unique_authors.append(a)

        return unique_authors[:10] 

    @staticmethod
    def _extract_abstract(full_text: str) -> str:
        match = re.search(
            r"abstract\s*\n(.*?)(?=\n\s*(?:introduction|keywords|1\.|I\.))",
            full_text,
            re.IGNORECASE | re.DOTALL,
        )
        if match:
            abstract = match.group(1).strip()
            abstract = re.sub(r"\s+", " ", abstract)
            return abstract[:2000] 
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
            # Split by comma, semicolon, or bullet
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
