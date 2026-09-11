from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path
from typing import Iterator, List, Optional

from loguru import logger
import tokenizers

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import config

def _iter_texts(jsonl_path: Path, text_col: str = "text") -> Iterator[str]:

    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            record = json.loads(line)
            text = record.get(text_col, "")
            if text and len(text) > 10:
                yield text

def train_bpe_tokenizer(
    corpus_files: List[str],
    vocab_size: int = None,
    save_dir: Path = None,
) -> "tokenizers.Tokenizer":
    try:
        from tokenizers import Tokenizer, models, pre_tokenizers, trainers, processors, decoders
        from tokenizers.models import BPE
        from tokenizers.trainers import BpeTrainer
        from tokenizers.pre_tokenizers import Whitespace
        from tokenizers.processors import TemplateProcessing
    except ImportError:
        raise ImportError("Install `tokenizers` library: pip install tokenizers")

    vocab_size = vocab_size or config.TOKENIZER_VOCAB_SIZE
    save_dir   = save_dir or config.TOKENIZER_PATH
    save_dir   = Path(save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"🔤 Training BPE tokenizer (vocab_size={vocab_size})…")

    tokenizer = Tokenizer(BPE(unk_token=config.UNK_TOKEN))
    tokenizer.pre_tokenizer = Whitespace()

    trainer = BpeTrainer(
        vocab_size=vocab_size,
        special_tokens=config.SPECIAL_TOKENS,
        min_frequency=config.TOKENIZER_MIN_FREQ,
        show_progress=True,
    )

    text_files = []
    for p in corpus_files:
        p = Path(p)
        if p.suffix in {".jsonl", ".ndjson"}:
            # Extract text to a temp file
            tmp = save_dir / f"_tmp_{p.stem}.txt"
            with open(tmp, "w", encoding="utf-8") as out:
                for text in _iter_texts(p):
                    out.write(text + "\n")
            text_files.append(str(tmp))
        else:
            text_files.append(str(p))

    tokenizer.train(files=text_files, trainer=trainer)

    tokenizer.post_processor = TemplateProcessing(
        single=f"{config.CLS_TOKEN} $A {config.SEP_TOKEN}",
        pair=f"{config.CLS_TOKEN} $A {config.SEP_TOKEN} $B:1 {config.SEP_TOKEN}:1",
        special_tokens=[
            (config.CLS_TOKEN, tokenizer.token_to_id(config.CLS_TOKEN)),
            (config.SEP_TOKEN, tokenizer.token_to_id(config.SEP_TOKEN)),
        ],
    )

    tokenizer.enable_padding(
        pad_id=tokenizer.token_to_id(config.PAD_TOKEN),
        pad_token=config.PAD_TOKEN,
        length=config.MAX_SEQ_LEN,
    )
    tokenizer.enable_truncation(max_length=config.MAX_SEQ_LEN)

    tokenizer_path = save_dir / "tokenizer.json"
    tokenizer.save(str(tokenizer_path))
    logger.info(f"💾 Tokenizer saved to: {tokenizer_path}")
    for p in corpus_files:
        tmp = save_dir / f"_tmp_{Path(p).stem}.txt"
        if tmp.exists():
            tmp.unlink()

    return tokenizer

def load_tokenizer(tokenizer_dir: Path = None) -> "tokenizers.Tokenizer":
    from tokenizers import Tokenizer

    tokenizer_dir = tokenizer_dir or config.TOKENIZER_PATH
    path = Path(tokenizer_dir) / "tokenizer.json"

    if not path.exists():
        raise FileNotFoundError(
            f"Tokenizer not found at {path}. "
            "Run: python -m ai_ml.training.tokenizer --corpus_file <file>"
        )

    tokenizer = Tokenizer.from_file(str(path))
    logger.info(f"✅ Tokenizer loaded from {path} (vocab_size={tokenizer.get_vocab_size()})")
    return tokenizer
class ScientificTokenizer:
    def __init__(self, tokenizer_dir: Path = None):
        self._tok = load_tokenizer(tokenizer_dir)

    @property
    def vocab_size(self) -> int:
        return self._tok.get_vocab_size()

    def encode(self, text: str):
        return self._tok.encode(text)

    def encode_batch(self, texts: list):
        return self._tok.encode_batch(texts)

    def decode(self, ids: list) -> str:
        return self._tok.decode(ids)

    def token_to_id(self, token: str) -> int:
        return self._tok.token_to_id(token)

def main():
    parser = argparse.ArgumentParser(description="Train BPE tokenizer on scientific corpus")
    parser.add_argument("--corpus_file", nargs="+", required=True,
                        help="One or more JSONL/text corpus files")
    parser.add_argument("--vocab_size", type=int, default=config.TOKENIZER_VOCAB_SIZE)
    parser.add_argument("--save_dir",   default=str(config.TOKENIZER_PATH))
    args = parser.parse_args()

    train_bpe_tokenizer(
        corpus_files=args.corpus_file,
        vocab_size=args.vocab_size,
        save_dir=Path(args.save_dir),
    )
    logger.info("✅ Tokenizer training complete.")


if __name__ == "__main__":
    main()
