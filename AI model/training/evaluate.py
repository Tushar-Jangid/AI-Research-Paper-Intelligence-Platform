from __future__ import annotations
import argparse
import sys
from pathlib import Path
from typing import Dict

import torch
import torch.nn.functional as F
from loguru import logger

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import config
from ai_ml.training.model import ScientificTransformer
from ai_ml.training.tokenizer import ScientificTokenizer
from ai_ml.training.dataset import build_dataloaders
from ai_ml.training.loss import build_loss


def load_checkpoint(checkpoint_path: str, device: torch.device) -> ScientificTransformer:
    ckpt = torch.load(checkpoint_path, map_location=device, weights_only=False)

    saved_cfg = ckpt.get("config", {})
    model = ScientificTransformer(
        vocab_size  = saved_cfg.get("vocab_size",  config.VOCAB_SIZE),
        embed_dim   = saved_cfg.get("embed_dim",   config.EMBED_DIM),
        num_layers  = saved_cfg.get("num_layers",  config.NUM_LAYERS),
        num_heads   = saved_cfg.get("num_heads",   config.NUM_HEADS),
        ff_dim      = saved_cfg.get("ff_dim",      config.FF_DIM),
        max_seq_len = saved_cfg.get("max_seq_len", config.MAX_SEQ_LEN),
        output_dim  = saved_cfg.get("output_dim",  config.OUTPUT_DIM),
    )
    model.load_state_dict(ckpt["model_state_dict"])
    model.to(device)
    model.eval()
    logger.info(f"✅ Loaded checkpoint from epoch {ckpt.get('epoch', '?')} (val_loss={ckpt.get('val_loss', '?'):.4f})")
    return model


def compute_alignment(emb_a: torch.Tensor, emb_b: torch.Tensor) -> float:
    return F.cosine_similarity(emb_a, emb_b).mean().item()


def compute_uniformity(emb: torch.Tensor, t: float = 2.0) -> float:

    sq_dists = torch.pdist(emb, p=2).pow(2)
    return sq_dists.mul(-t).exp().mean().log().item()


def retrieval_accuracy_at_k(
    emb_a: torch.Tensor,
    emb_b: torch.Tensor,
    k: int = 1,
) -> float:

    sim = torch.matmul(emb_a, emb_b.T)  # (N, N)
    top_k_indices = sim.topk(k, dim=1).indices  # (N, K)
    labels = torch.arange(len(emb_a), device=emb_a.device).unsqueeze(1)  # (N, 1)
    correct = (top_k_indices == labels).any(dim=1).float()
    return correct.mean().item()


@torch.no_grad()
def evaluate(args) -> Dict:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"🖥️  Evaluation device: {device}")

    model = load_checkpoint(args.checkpoint, device)

    tokenizer = ScientificTokenizer(config.TOKENIZER_PATH)

    _, val_loader = build_dataloaders(
        tokenizer  = tokenizer,
        val_path   = args.val_data,
        batch_size = args.batch_size,
    )

    criterion = build_loss()

    all_emb_a, all_emb_b = [], []
    total_loss = 0.0

    for batch in val_loader:
        input_ids_a      = batch["input_ids_a"].to(device)
        attention_mask_a = batch["attention_mask_a"].to(device)
        input_ids_b      = batch["input_ids_b"].to(device)
        attention_mask_b = batch["attention_mask_b"].to(device)

        emb_a = model(input_ids_a, attention_mask_a)
        emb_b = model(input_ids_b, attention_mask_b)

        loss = criterion(emb_a, emb_b)
        total_loss += loss.item()

        all_emb_a.append(emb_a.cpu())
        all_emb_b.append(emb_b.cpu())

    all_emb_a = torch.cat(all_emb_a, dim=0)
    all_emb_b = torch.cat(all_emb_b, dim=0)

    avg_val_loss  = total_loss / len(val_loader)
    alignment     = compute_alignment(all_emb_a, all_emb_b)
    uniformity    = compute_uniformity(torch.cat([all_emb_a, all_emb_b], dim=0))
    acc_at_1      = retrieval_accuracy_at_k(all_emb_a, all_emb_b, k=1)
    acc_at_5      = retrieval_accuracy_at_k(all_emb_a, all_emb_b, k=5)

    metrics = {
        "val_loss":          round(avg_val_loss, 4),
        "alignment":         round(alignment, 4),
        "uniformity":        round(uniformity, 4),
        "retrieval_acc@1":   round(acc_at_1, 4),
        "retrieval_acc@5":   round(acc_at_5, 4),
        "num_val_samples":   len(all_emb_a),
    }

    logger.info("📊 Evaluation Results:")
    for k, v in metrics.items():
        logger.info(f"   {k:25s}: {v}")

    return metrics


def main():
    parser = argparse.ArgumentParser(description="Evaluate Scientific Transformer embedding quality")
    parser.add_argument("--checkpoint", default=str(config.MODEL_CHECKPOINT))
    parser.add_argument("--val_data",   default=str(config.TRAINING_PROC_DIR / "val.jsonl"))
    parser.add_argument("--batch_size", type=int, default=64)
    args = parser.parse_args()
    evaluate(args)


if __name__ == "__main__":
    main()
