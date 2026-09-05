from __future__ import annotations
import math
import sys
from pathlib import Path
import torch
import torch.nn as nn
import torch.nn.functional as F
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import config

class SinusoidalPositionalEncoding(nn.Module):
    def __init__(self, embed_dim: int, max_seq_len: int, dropout: float = 0.1):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)

        pe = torch.zeros(max_seq_len, embed_dim)
        position = torch.arange(0, max_seq_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(
            torch.arange(0, embed_dim, 2, dtype=torch.float)
            * (-math.log(10000.0) / embed_dim)
        )
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)  # (1, max_seq_len, embed_dim)
        self.register_buffer("pe", pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.pe[:, : x.size(1), :]
        return self.dropout(x)
class ScientificEncoderLayer(nn.Module):

    def __init__(self, embed_dim: int, num_heads: int, ff_dim: int, dropout: float):
        super().__init__()
        self.self_attn = nn.MultiheadAttention(
            embed_dim=embed_dim,
            num_heads=num_heads,
            dropout=dropout,
            batch_first=True,
        )
        self.ff = nn.Sequential(
            nn.Linear(embed_dim, ff_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(ff_dim, embed_dim),
            nn.Dropout(dropout),
        )
        self.norm1 = nn.LayerNorm(embed_dim)
        self.norm2 = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(
        self,
        x: torch.Tensor,
        src_key_padding_mask: torch.Tensor | None = None,
    ) -> torch.Tensor:
        attn_out, _ = self.self_attn(
            x, x, x,
            key_padding_mask=src_key_padding_mask,
        )
        x = self.norm1(x + self.dropout(attn_out))

        # Feed-forward with residual
        x = self.norm2(x + self.ff(x))
        return x

class ScientificTransformer(nn.Module):
    def __init__(
        self,
        vocab_size:  int   = None,
        embed_dim:   int   = None,
        num_layers:  int   = None,
        num_heads:   int   = None,
        ff_dim:      int   = None,
        max_seq_len: int   = None,
        output_dim:  int   = None,
        dropout:     float = None,
        pad_id:      int   = None,
    ):
        super().__init__()
        self.vocab_size  = vocab_size  or config.VOCAB_SIZE
        self.embed_dim   = embed_dim   or config.EMBED_DIM
        self.num_layers  = num_layers  or config.NUM_LAYERS
        self.num_heads   = num_heads   or config.NUM_HEADS
        self.ff_dim      = ff_dim      or config.FF_DIM
        self.max_seq_len = max_seq_len or config.MAX_SEQ_LEN
        self.output_dim  = output_dim  or config.OUTPUT_DIM
        self.dropout_p   = dropout     or config.DROPOUT
        self.pad_id      = pad_id      or config.PAD_ID

        self.token_embedding = nn.Embedding(
            self.vocab_size, self.embed_dim, padding_idx=self.pad_id
        )
        self.positional_encoding = SinusoidalPositionalEncoding(
            self.embed_dim, self.max_seq_len, self.dropout_p
        )

        self.encoder_layers = nn.ModuleList([
            ScientificEncoderLayer(
                embed_dim=self.embed_dim,
                num_heads=self.num_heads,
                ff_dim=self.ff_dim,
                dropout=self.dropout_p,
            )
            for _ in range(self.num_layers)
        ])

        self.projection = nn.Linear(self.embed_dim, self.output_dim, bias=False)

        self._init_weights()

    def _init_weights(self):
        for module in self.modules():
            if isinstance(module, nn.Linear):
                nn.init.trunc_normal_(module.weight, std=0.02)
                if module.bias is not None:
                    nn.init.zeros_(module.bias)
            elif isinstance(module, nn.Embedding):
                nn.init.trunc_normal_(module.weight, std=0.02)
                if module.padding_idx is not None:
                    module.weight.data[module.padding_idx].zero_()
            elif isinstance(module, nn.LayerNorm):
                nn.init.ones_(module.weight)
                nn.init.zeros_(module.bias)

    def _mean_pool(
        self,
        token_embeddings: torch.Tensor,
        attention_mask: torch.Tensor,
    ) -> torch.Tensor:
        mask = attention_mask.unsqueeze(-1).float()     
        summed = (token_embeddings * mask).sum(dim=1)   
        counts = mask.sum(dim=1).clamp(min=1e-9)        
        return summed / counts                          

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: torch.Tensor,
    ) -> torch.Tensor:
        pad_mask = (attention_mask == 0)  # (B, L)

        x = self.token_embedding(input_ids)   
        x = self.positional_encoding(x)       

        for layer in self.encoder_layers:
            x = layer(x, src_key_padding_mask=pad_mask)

        pooled = self._mean_pool(x, attention_mask)  

        projected = self.projection(pooled)          

        normalized = F.normalize(projected, p=2, dim=-1)  

        return normalized

    def get_num_parameters(self) -> int:
        return sum(p.numel() for p in self.parameters() if p.requires_grad)
def build_model(device: str | torch.device = "cpu") -> ScientificTransformer:
    model = ScientificTransformer()
    model = model.to(device)
    n_params = model.get_num_parameters()
    print(f"🤖 ScientificTransformer | Parameters: {n_params:,}")
    print(f"   vocab={model.vocab_size} | embed={model.embed_dim} | "
          f"layers={model.num_layers} | heads={model.num_heads} | "
          f"ff={model.ff_dim} | output={model.output_dim}")
    return model


if __name__ == "__main__":
    model = build_model("cpu")
    dummy_ids  = torch.randint(0, config.VOCAB_SIZE, (2, config.MAX_SEQ_LEN))
    dummy_mask = torch.ones(2, config.MAX_SEQ_LEN, dtype=torch.long)
    dummy_mask[0, 200:] = 0  # simulate padding

    out = model(dummy_ids, dummy_mask)
    print(f"\n✅ Output shape: {out.shape}")   
    print(f"   Norms: {out.norm(dim=-1)}")   
