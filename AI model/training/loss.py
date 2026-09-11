from __future__ import annotations
import sys
from pathlib import Path
import torch
import torch.nn as nn
import torch.nn.functional as F

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import config


class InfoNCELoss(nn.Module):
    def __init__(self, temperature: float = None, symmetric: bool = True):
        super().__init__()
        self.temperature = temperature or config.TEMPERATURE
        self.symmetric   = symmetric

    def forward(
        self,
        embeddings_a: torch.Tensor,
        embeddings_b: torch.Tensor,
    ) -> torch.Tensor:
        batch_size = embeddings_a.size(0)

        sim_matrix = torch.matmul(embeddings_a, embeddings_b.T)  # (B, B)
        sim_matrix = sim_matrix / self.temperature

        labels = torch.arange(batch_size, device=embeddings_a.device)

        loss_a2b = F.cross_entropy(sim_matrix, labels)

        if self.symmetric:
            loss_b2a = F.cross_entropy(sim_matrix.T, labels)
            loss = (loss_a2b + loss_b2a) / 2.0
        else:
            loss = loss_a2b

        return loss

    def extra_repr(self) -> str:
        return f"temperature={self.temperature}, symmetric={self.symmetric}"

def build_loss(temperature: float = None, symmetric: bool = True) -> InfoNCELoss:
    """Instantiate the contrastive loss function."""
    return InfoNCELoss(temperature=temperature, symmetric=symmetric)
