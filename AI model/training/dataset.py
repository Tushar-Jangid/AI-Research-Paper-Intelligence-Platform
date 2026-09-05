from __future__ import annotations

import json
import random
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import torch
from torch.utils.data import Dataset, DataLoader

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import config

class ScientificPaperDataset(Dataset):
    def __init__(
        self,
        jsonl_path: str | Path,
        tokenizer,
        max_length: int = None,
        augment: bool = False,
    ):
        self.tokenizer  = tokenizer
        self.max_length = max_length or config.MAX_SEQ_LEN
        self.augment    = augment
        self.records    = self._load(Path(jsonl_path))

    def _load(self, path: Path) -> List[Dict]:
        records = []
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                rec = json.loads(line)
                if rec.get("text", "").strip():
                    records.append(rec)
        return records

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        rec = self.records[idx]

        text_a = rec.get("text", "")
        text_b = rec.get("abstract", text_a)

        if self.augment:
            text_a = self._augment(text_a)
            text_b = self._augment(text_b)

        enc_a = self.tokenizer.encode(text_a)
        enc_b = self.tokenizer.encode(text_b)

        return {
            "input_ids_a":      torch.tensor(enc_a.ids,              dtype=torch.long),
            "attention_mask_a": torch.tensor(enc_a.attention_mask,   dtype=torch.long),
            "input_ids_b":      torch.tensor(enc_b.ids,              dtype=torch.long),
            "attention_mask_b": torch.tensor(enc_b.attention_mask,   dtype=torch.long),
        }

    @staticmethod
    def _augment(text: str) -> str:
        sentences = text.split(". ")
        if len(sentences) > 3:
            # Randomly keep 80–100% of sentences
            keep_n = max(2, int(len(sentences) * random.uniform(0.8, 1.0)))
            sentences = random.sample(sentences, keep_n)
        return ". ".join(sentences)

def collate_fn(batch: List[Dict]) -> Dict[str, torch.Tensor]:
    return {
        "input_ids_a":      torch.stack([b["input_ids_a"]      for b in batch]),
        "attention_mask_a": torch.stack([b["attention_mask_a"] for b in batch]),
        "input_ids_b":      torch.stack([b["input_ids_b"]      for b in batch]),
        "attention_mask_b": torch.stack([b["attention_mask_b"] for b in batch]),
    }

def build_dataloaders(
    tokenizer,
    train_path: str | Path = None,
    val_path:   str | Path = None,
    batch_size: int = None,
    num_workers: int = 0,
) -> Tuple[DataLoader, DataLoader]:
    train_path = Path(train_path or config.TRAINING_PROC_DIR / "train.jsonl")
    val_path   = Path(val_path   or config.TRAINING_PROC_DIR / "val.jsonl")
    batch_size = batch_size or config.BATCH_SIZE

    train_ds = ScientificPaperDataset(train_path, tokenizer, augment=True)
    val_ds   = ScientificPaperDataset(val_path,   tokenizer, augment=False)

    train_loader = DataLoader(
        train_ds,
        batch_size=batch_size,
        shuffle=True,
        collate_fn=collate_fn,
        num_workers=num_workers,
        pin_memory=True,
    )
    val_loader = DataLoader(
        val_ds,
        batch_size=batch_size,
        shuffle=False,
        collate_fn=collate_fn,
        num_workers=num_workers,
        pin_memory=True,
    )

    return train_loader, val_loader
