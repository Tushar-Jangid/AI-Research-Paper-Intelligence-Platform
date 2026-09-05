"""
ai_ml/training/train.py — Training loop for the Custom Scientific Transformer.

Features:
  - AdamW optimizer
  - Linear warmup + cosine decay learning rate schedule
  - Train/validation loss logging
  - Checkpoint saving (best model + periodic)
  - Reproducibility via random seed
  - GPU/CPU support
  - Configurable via config.py and CLI arguments

Person 2 (AI/ML Developer) owns this file.

TODO (Person 2):
  - Add gradient clipping
  - Add mixed-precision training (torch.cuda.amp) for GPU speedup
  - Add TensorBoard / WandB logging
  - Add early stopping
  - Tune learning rate schedule and warmup steps

Usage:
  python -m ai_ml.training.train \
    --train data/training/processed/train.jsonl \
    --val   data/training/processed/val.jsonl
"""

from __future__ import annotations

import argparse
import math
import random
import sys
import time
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
from loguru import logger
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import config

from AI model.training.tokenizer import ScientificTokenizer
from AI model.training.dataset import build_dataloaders
from AI model.training.model import build_model
from AI model.training.loss import build_loss

def set_seed(seed: int):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
def get_lr(
    step: int,
    warmup_steps: int,
    total_steps: int,
    base_lr: float,
    min_lr: float = 1e-6,
) -> float:
    if step < warmup_steps:
        return base_lr * step / max(1, warmup_steps)
    progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
    return min_lr + 0.5 * (base_lr - min_lr) * (1.0 + math.cos(math.pi * progress))
def train(args):
    set_seed(args.seed)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"🖥️  Training device: {device}")
    logger.info("🔤 Loading tokenizer…")
    tokenizer = ScientificTokenizer(config.TOKENIZER_PATH)
    logger.info("📦 Building dataloaders…")
    train_loader, val_loader = build_dataloaders(
        tokenizer=tokenizer,
        train_path=args.train,
        val_path=args.val,
        batch_size=args.batch_size,
    )
    model = build_model(device)
    criterion = build_loss(temperature=args.temperature)
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=args.lr,
        weight_decay=args.weight_decay,
        betas=(0.9, 0.999),
    )
    total_steps   = len(train_loader) * args.epochs
    warmup_steps  = args.warmup_steps
    scheduler     = torch.optim.lr_scheduler.LambdaLR(
        optimizer,
        lr_lambda=lambda step: get_lr(step, warmup_steps, total_steps, 1.0),
    )

    best_val_loss    = float("inf")
    global_step      = 0
    checkpoints_dir  = config.CHECKPOINTS_DIR
    checkpoints_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"🚀 Starting training: {args.epochs} epochs | {len(train_loader)} steps/epoch")

    for epoch in range(1, args.epochs + 1):
        model.train()
        epoch_loss = 0.0
        t0 = time.time()

        for step, batch in enumerate(train_loader, 1):
            input_ids_a      = batch["input_ids_a"].to(device)
            attention_mask_a = batch["attention_mask_a"].to(device)
            input_ids_b      = batch["input_ids_b"].to(device)
            attention_mask_b = batch["attention_mask_b"].to(device)

            emb_a = model(input_ids_a, attention_mask_a)
            emb_b = model(input_ids_b, attention_mask_b)

            loss = criterion(emb_a, emb_b)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            scheduler.step()

            epoch_loss  += loss.item()
            global_step += 1

            if global_step % args.log_every == 0:
                avg = epoch_loss / step
                lr  = optimizer.param_groups[0]["lr"]
                logger.info(
                    f"  Epoch {epoch:3d} | Step {global_step:6d} | "
                    f"Loss: {avg:.4f} | LR: {lr:.2e}"
                )

        avg_train_loss = epoch_loss / len(train_loader)
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for batch in val_loader:
                input_ids_a      = batch["input_ids_a"].to(device)
                attention_mask_a = batch["attention_mask_a"].to(device)
                input_ids_b      = batch["input_ids_b"].to(device)
                attention_mask_b = batch["attention_mask_b"].to(device)

                emb_a = model(input_ids_a, attention_mask_a)
                emb_b = model(input_ids_b, attention_mask_b)
                loss  = criterion(emb_a, emb_b)
                val_loss += loss.item()

        avg_val_loss = val_loss / max(1, len(val_loader))
        elapsed = time.time() - t0

        logger.info(
            f"📊 Epoch {epoch:3d} | "
            f"Train Loss: {avg_train_loss:.4f} | "
            f"Val Loss: {avg_val_loss:.4f} | "
            f"Time: {elapsed:.1f}s"
        )

        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            ckpt_path = checkpoints_dir / "scientific_transformer_best.pt"
            torch.save(
                {
                    "epoch": epoch,
                    "global_step": global_step,
                    "model_state_dict": model.state_dict(),
                    "optimizer_state_dict": optimizer.state_dict(),
                    "val_loss": best_val_loss,
                    "config": {
                        "vocab_size": config.VOCAB_SIZE,
                        "embed_dim":  config.EMBED_DIM,
                        "num_layers": config.NUM_LAYERS,
                        "num_heads":  config.NUM_HEADS,
                        "ff_dim":     config.FF_DIM,
                        "max_seq_len":config.MAX_SEQ_LEN,
                        "output_dim": config.OUTPUT_DIM,
                    },
                },
                ckpt_path,
            )
            logger.info(f"  ✅ New best checkpoint saved → {ckpt_path}")
        if epoch % args.save_every == 0:
            periodic_path = checkpoints_dir / f"scientific_transformer_epoch{epoch:03d}.pt"
            torch.save({"epoch": epoch, "model_state_dict": model.state_dict()}, periodic_path)
            logger.info(f"  💾 Periodic checkpoint saved → {periodic_path}")

    logger.info(f"🏁 Training complete! Best val loss: {best_val_loss:.4f}")

def main():
    parser = argparse.ArgumentParser(description="Train Custom Scientific Transformer")
    parser.add_argument("--train",        default=str(config.TRAINING_PROC_DIR / "train.jsonl"))
    parser.add_argument("--val",          default=str(config.TRAINING_PROC_DIR / "val.jsonl"))
    parser.add_argument("--epochs",       type=int,   default=config.NUM_EPOCHS)
    parser.add_argument("--batch_size",   type=int,   default=config.BATCH_SIZE)
    parser.add_argument("--lr",           type=float, default=config.LEARNING_RATE)
    parser.add_argument("--weight_decay", type=float, default=config.WEIGHT_DECAY)
    parser.add_argument("--warmup_steps", type=int,   default=config.WARMUP_STEPS)
    parser.add_argument("--temperature",  type=float, default=config.TEMPERATURE)
    parser.add_argument("--seed",         type=int,   default=config.SEED)
    parser.add_argument("--log_every",    type=int,   default=config.LOG_EVERY_N_STEPS)
    parser.add_argument("--save_every",   type=int,   default=config.SAVE_EVERY_N_EPOCHS)
    args = parser.parse_args()
    train(args)


if __name__ == "__main__":
    main()
