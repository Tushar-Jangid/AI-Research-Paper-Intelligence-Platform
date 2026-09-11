import numpy as np
import logging
from typing import List, Union

logger = logging.getLogger(__name__)

class SciBERTEmbeddingEngine:
    """
    Embedding Engine utilizing SciBERT ('allenai/scibert_scivocab_uncased')
    or sentence-transformers with automatic fallback to Scikit-Learn TF-IDF vectorization.
    """

    def __init__(self, model_name: str = "allenai/scibert_scivocab_uncased"):
        self.model_name = model_name
        self.model = None
        self.tokenizer = None
        self.st_model = None
        self.tfidf_vectorizer = None
        self.embedding_dim = 768
        self._mode = "uninitialized"
        
        self._initialize_engine()

    def _initialize_engine(self):
        """Attempts loading transformers SciBERT or sentence-transformers, falling back to TF-IDF."""
        # 1. Try sentence-transformers (simplest high-level interface)
        try:
            from sentence_transformers import SentenceTransformer
            # Try SciBERT via sentence-transformers or standard scientific transformer
            try:
                self.st_model = SentenceTransformer(self.model_name)
                self.embedding_dim = self.st_model.get_sentence_embedding_dimension()
                self._mode = "sentence_transformers_scibert"
                logger.info(f"Loaded SciBERT via sentence-transformers: {self.model_name}")
                return
            except Exception:
                # Fallback to MiniLM for rapid embedding
                self.st_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
                self.embedding_dim = self.st_model.get_sentence_embedding_dimension()
                self._mode = "sentence_transformers_fallback"
                logger.info("Loaded sentence-transformers MiniLM fallback model.")
                return
        except Exception as e:
            logger.info(f"sentence-transformers not initialized: {e}")

        # 2. Try Hugging Face PyTorch transformers directly
        try:
            import torch
            from transformers import AutoTokenizer, AutoModel
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModel.from_pretrained(self.model_name)
            self.model.eval()
            self._mode = "huggingface_scibert"
            logger.info(f"Loaded SciBERT via HuggingFace Transformers: {self.model_name}")
            return
        except Exception as e:
            logger.info(f"HuggingFace SciBERT not initialized: {e}")

        # 3. Scikit-Learn TF-IDF + TruncatedSVD Fallback (Zero network / lightweight)
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.decomposition import TruncatedSVD
            self.tfidf_vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
            self.svd = TruncatedSVD(n_components=128, random_state=42)
            self.embedding_dim = 128
            self._mode = "tfidf_svd_fallback"
            logger.info("Initialized TF-IDF + SVD zero-dependency vector engine.")
        except Exception as e:
            logger.warning(f"TF-IDF fallback unavailable ({e}). Using deterministic hash vectorizer.")
            self._mode = "hash_vectorizer_fallback"
            self.embedding_dim = 768

    def get_mode(self) -> str:
        return self._mode

    def encode(self, texts: Union[str, List[str]]) -> np.ndarray:
        """Computes dense vector representations for input text(s)."""
        if isinstance(texts, str):
            texts = [texts]

        if not texts or all(not t.strip() for t in texts):
            return np.zeros((len(texts), self.embedding_dim), dtype=np.float32)

        # Mode 1: sentence-transformers
        if self.st_model is not None:
            embeddings = self.st_model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
            return embeddings.astype(np.float32)

        # Mode 2: Hugging Face PyTorch SciBERT
        if self.model is not None and self.tokenizer is not None:
            import torch
            embeddings = []
            for t in texts:
                inputs = self.tokenizer(t[:512], return_tensors="pt", padding=True, truncation=True, max_length=512)
                with torch.no_grad():
                    outputs = self.model(**inputs)
                    # Mean pooling over token embeddings
                    pooled = outputs.last_hidden_state.mean(dim=1).squeeze(0).numpy()
                    embeddings.append(pooled)
            return np.array(embeddings, dtype=np.float32)

        # Mode 3: TF-IDF + SVD Fallback
        if self.tfidf_vectorizer is not None:
            # Fit/transform on input texts
            try:
                tfidf_matrix = self.tfidf_vectorizer.fit_transform(texts)
                if tfidf_matrix.shape[0] < 2:
                    # Duplicate to allow SVD components
                    padded = [t for t in texts] + ["scientific paper research methodology artificial intelligence"]
                    mat = self.tfidf_vectorizer.fit_transform(padded)
                    dense = mat.toarray()[:len(texts)]
                else:
                    dense = tfidf_matrix.toarray()
                
                # Pad/truncate to self.embedding_dim
                if dense.shape[1] < self.embedding_dim:
                    pad_width = self.embedding_dim - dense.shape[1]
                    dense = np.pad(dense, ((0, 0), (0, pad_width)), mode='constant')
                else:
                    dense = dense[:, :self.embedding_dim]
                
                # L2 normalize
                norms = np.linalg.norm(dense, axis=1, keepdims=True)
                norms[norms == 0] = 1.0
                return (dense / norms).astype(np.float32)
            except Exception as e:
                logger.error(f"TFIDF encoding error: {e}")

        # Basic deterministic hash embedding fallback if everything fails
        return self._hash_embedding(texts)

    def _hash_embedding(self, texts: List[str]) -> np.ndarray:
        """Deterministic pseudo-embedding fallback using text hash vectorization."""
        vectors = []
        for t in texts:
            vec = np.zeros(self.embedding_dim, dtype=np.float32)
            words = t.lower().split()
            for w in words:
                idx = abs(hash(w)) % self.embedding_dim
                vec[idx] += 1.0
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec /= norm
            vectors.append(vec)
        return np.array(vectors, dtype=np.float32)
