from __future__ import annotations
import re
import unicodedata
from pathlib import Path
from typing import List
import pandas as pd
from loguru import logger

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import config

_RE_LATEX_CMD   = re.compile(r"\\[a-zA-Z]+\*?\{[^}]*\}")
_RE_LATEX_BARE  = re.compile(r"\\[a-zA-Z]+\*?")
_RE_MATH_INLINE = re.compile(r"\$[^$]+\$")
_RE_MATH_BLOCK  = re.compile(r"\$\$.*?\$\$", re.DOTALL)
_RE_URL         = re.compile(r"https?://\S+|www\.\S+")
_RE_EMAIL       = re.compile(r"\S+@\S+\.\S+")
_RE_CITATION    = re.compile(r"\[[^\]]{1,50}\]")
_RE_SPECIAL     = re.compile(r"[^\w\s.,;:!?()\-\'\"/]")
_RE_SPACES      = re.compile(r"\s+")


def clean_text(text: str, keep_math: bool = False) -> str:

    if not isinstance(text, str):
        return ""
    text = unicodedata.normalize("NFKC", text)

    text = _RE_URL.sub(" ", text)
    text = _RE_EMAIL.sub(" ", text)

    if not keep_math:
        text = _RE_MATH_BLOCK.sub(" [MATH] ", text)
        text = _RE_MATH_INLINE.sub(" [MATH] ", text)
    text = _RE_LATEX_CMD.sub(" ", text)
    text = _RE_LATEX_BARE.sub(" ", text)

    text = _RE_CITATION.sub(" ", text)

    text = _RE_SPECIAL.sub(" ", text)
    text = _RE_SPACES.sub(" ", text).strip()

    return text


def clean_dataframe(df: pd.DataFrame, text_col: str = "text") -> pd.DataFrame:

    logger.info(f"🧹 Cleaning {len(df):,} rows in column '{text_col}'…")

    df = df.copy()
    df[text_col] = df[text_col].apply(clean_text)

    if "title" in df.columns:
        df["title"] = df["title"].apply(clean_text)
    if "abstract" in df.columns:
        df["abstract"] = df["abstract"].apply(clean_text)

    min_len = 20
    max_len = config.MAX_SEQ_LEN * 15 

    before = len(df)
    df = df[df[text_col].str.len().between(min_len, max_len)].reset_index(drop=True)
    logger.info(f"   Filtered {before - len(df)} rows outside length bounds [{min_len}, {max_len}].")
    logger.info(f"   Cleaned rows: {len(df):,}")

    return df

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Clean scientific text in processed dataset")
    parser.add_argument("--input",  required=True, help="Path to JSONL file (e.g., data/training/processed/train.jsonl)")
    parser.add_argument("--output", default=None,  help="Output path (default: overwrite input)")
    args = parser.parse_args()

    in_path  = Path(args.input)
    out_path = Path(args.output) if args.output else in_path

    df = pd.read_json(in_path, lines=True)
    df = clean_dataframe(df)
    df.to_json(out_path, orient="records", lines=True, force_ascii=False)

    logger.info(f"💾 Cleaned data saved to: {out_path}")


if __name__ == "__main__":
    main()
