"""
ai_ml/training/prepare_data.py — Dataset preparation pipeline.

Responsibilities:
  1. Inspect and validate the raw arXiv-style dataset.
  2. Handle different column formats gracefully.
  3. Extract text fields (title, abstract, full-text when available).
  4. Split into train/validation sets.
  5. Save processed data for downstream steps.

Person 2 (AI/ML Developer) owns this file.

Expected raw data location:
  data/training/raw/

Processed output location:
  data/training/processed/

Usage:
  python -m ai_ml.training.prepare_data --input data/training/raw/arxiv_data.csv

TODO (Person 2):
  - Tune train/val split ratio
  - Add support for JSON-lines format if needed
  - Implement contrastive pair sampling strategy
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from pathlib import Path

import pandas as pd
from loguru import logger

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import config
TITLE_COLS    = ["title", "Title", "paper_title", "name"]
ABSTRACT_COLS = ["abstract", "Abstract", "summary", "description", "text"]
ID_COLS       = ["id", "paper_id", "arxiv_id", "identifier"]
YEAR_COLS     = ["year", "Year", "date", "published"]

def _find_col(df: pd.DataFrame, candidates: list) -> str | None:
    for c in candidates:
        if c in df.columns:
            return c
    return None


def inspect_dataset(path: str) -> pd.DataFrame:
    p = Path(path)
    logger.info(f"📂 Loading dataset from: {p}")

    if p.suffix in {".csv"}:
        df = pd.read_csv(p)
    elif p.suffix in {".json"}:
        df = pd.read_json(p)
    elif p.suffix in {".jsonl", ".ndjson"}:
        df = pd.read_json(p, lines=True)
    elif p.suffix in {".parquet"}:
        df = pd.read_parquet(p)
    else:
        raise ValueError(f"Unsupported file format: {p.suffix}")

    logger.info(f"✅ Loaded {len(df):,} rows, {len(df.columns)} columns")
    logger.info(f"   Columns: {list(df.columns)}")
    logger.info(f"   Null counts:\n{df.isnull().sum()}")
    return df


def extract_text_fields(df: pd.DataFrame) -> pd.DataFrame:
    title_col    = _find_col(df, TITLE_COLS)
    abstract_col = _find_col(df, ABSTRACT_COLS)
    id_col       = _find_col(df, ID_COLS)
    year_col     = _find_col(df, YEAR_COLS)

    if abstract_col is None:
        raise ValueError(
            f"No abstract/text column found. Available: {list(df.columns)}\n"
            f"Expected one of: {ABSTRACT_COLS}"
        )

    out = pd.DataFrame()
    out["abstract"] = df[abstract_col].astype(str).str.strip()
    out["title"]    = df[title_col].astype(str).str.strip() if title_col else ""
    out["paper_id"] = df[id_col].astype(str) if id_col else [str(i) for i in range(len(df))]
    out["year"]     = df[year_col].astype(str) if year_col else ""
    out["text"] = (out["title"] + " [SEP] " + out["abstract"]).str.strip()

    before = len(out)
    out = out[out["text"].str.len() > 20].reset_index(drop=True)
    logger.info(f"   Dropped {before - len(out)} rows with insufficient text.")
    logger.info(f"   Final usable rows: {len(out):,}")

    return out


def split_dataset(df: pd.DataFrame, val_split: float = None, seed: int = None):
    val_split = val_split or config.VAL_SPLIT
    seed = seed or config.SEED

    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)
    n_val = max(1, int(len(df) * val_split))
    val_df   = df[:n_val]
    train_df = df[n_val:]

    logger.info(f"   Train: {len(train_df):,}  |  Val: {len(val_df):,}")
    return train_df, val_df


def save_processed(train_df: pd.DataFrame, val_df: pd.DataFrame, out_dir: Path = None):
    out_dir = out_dir or config.TRAINING_PROC_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    train_path = out_dir / "train.jsonl"
    val_path   = out_dir / "val.jsonl"

    train_df.to_json(train_path, orient="records", lines=True, force_ascii=False)
    val_df.to_json(val_path,   orient="records", lines=True, force_ascii=False)

    logger.info(f"💾 Saved train split → {train_path}")
    logger.info(f"💾 Saved val split   → {val_path}")

def main():
    parser = argparse.ArgumentParser(description="Prepare training data for Scientific Transformer")
    parser.add_argument("--input",  required=True,  help="Path to raw dataset file (CSV/JSON/JSONL/parquet)")
    parser.add_argument("--out_dir", default=None,  help="Output directory (default: data/training/processed/)")
    parser.add_argument("--val_split", type=float, default=config.VAL_SPLIT)
    parser.add_argument("--seed",      type=int,   default=config.SEED)
    args = parser.parse_args()

    df = inspect_dataset(args.input)
    df = extract_text_fields(df)
    train_df, val_df = split_dataset(df, val_split=args.val_split, seed=args.seed)
    save_processed(train_df, val_df, Path(args.out_dir) if args.out_dir else None)

    logger.info("✅ Data preparation complete.")


if __name__ == "__main__":
    main()
