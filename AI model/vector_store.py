import os
import pickle
import numpy as np
import logging
from typing import List, Dict, Any, Optional


logger = logging.getLogger(__name__)

class VectorStoreManager:
    """
    Local Vector Store Manager using FAISS (or Numpy Cosine Similarity fallback)
    and optional Pinecone Cloud vector indexing integration.
    """

    def __init__(self, embedding_dim: int = 768):
        self.embedding_dim = embedding_dim
        self.faiss_index = None
        self.documents = []  # Stores metadata & chunk text
        self.vectors = []    # Raw numpy vectors for fallback search
        self.mode = "numpy_fallback"

        self._initialize_faiss()

    def _initialize_faiss(self):
        """Initializes FAISS L2/Cosine Index if faiss-cpu is installed."""
        try:
            import faiss
            self.faiss_index = faiss.IndexFlatIP(self.embedding_dim)  # Inner Product for normalized cosine similarity
            self.mode = "faiss_local"
            logger.info("Initialized FAISS local vector store.")
        except Exception as e:
            logger.info(f"FAISS not available: {e}. Utilizing numpy cosine search fallback.")

    def add_paper_document(self, doc_id: str, title: str, section_name: str, content: str, vector: np.ndarray):
        """Adds a paper section chunk to the vector store."""
        if vector is None or len(vector) == 0:
            return

        # Ensure vector is 1D or single row 2D
        vector = vector.squeeze()
        if vector.ndim == 1:
            vector = vector.reshape(1, -1)

        # L2 normalize for Inner Product Cosine Similarity
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm

        doc_meta = {
            "doc_id": doc_id,
            "title": title,
            "section": section_name,
            "content": content,
            "snippet": content[:300] + "..." if len(content) > 300 else content
        }

        self.documents.append(doc_meta)
        self.vectors.append(vector[0])

        if self.faiss_index is not None:
            try:
                # Check dimension compatibility
                if vector.shape[1] == self.embedding_dim:
                    self.faiss_index.add(vector.astype(np.float32))
                else:
                    # Re-initialize FAISS with actual dimension
                    import faiss
                    self.embedding_dim = vector.shape[1]
                    self.faiss_index = faiss.IndexFlatIP(self.embedding_dim)
                    all_vecs = np.array(self.vectors, dtype=np.float32)
                    self.faiss_index.add(all_vecs)
            except Exception as e:
                logger.error(f"FAISS indexing error: {e}")

    def search(self, query_vector: np.ndarray, top_k: int = 5) -> List[Dict[str, Any]]:
        """Executes top-K vector similarity search."""
        if not self.documents or query_vector is None:
            return []

        query_vector = query_vector.squeeze()
        if query_vector.ndim == 1:
            query_vector = query_vector.reshape(1, -1)

        norm = np.linalg.norm(query_vector)
        if norm > 0:
            query_vector = query_vector / norm

        results = []

        # FAISS search
        if self.faiss_index is not None and self.faiss_index.ntotal > 0:
            try:
                if query_vector.shape[1] != self.embedding_dim:
                    # Adjust dimension
                    pad = self.embedding_dim - query_vector.shape[1]
                    if pad > 0:
                        query_vector = np.pad(query_vector, ((0, 0), (0, pad)))
                    else:
                        query_vector = query_vector[:, :self.embedding_dim]

                distances, indices = self.faiss_index.search(query_vector.astype(np.float32), min(top_k, len(self.documents)))
                for dist, idx in zip(distances[0], indices[0]):
                    if idx < len(self.documents) and idx >= 0:
                        meta = dict(self.documents[idx])
                        meta["similarity_score"] = float(round(dist, 4))
                        results.append(meta)
                return results
            except Exception as e:
                logger.error(f"FAISS search failed, using fallback: {e}")

        # Fallback Numpy Cosine Similarity Search
        if self.vectors:
            vec_matrix = np.array(self.vectors, dtype=np.float32)
            q_vec = query_vector[0]

            # Adjust dimensions if mismatch
            if vec_matrix.shape[1] != len(q_vec):
                min_dim = min(vec_matrix.shape[1], len(q_vec))
                vec_matrix = vec_matrix[:, :min_dim]
                q_vec = q_vec[:min_dim]

            scores = np.dot(vec_matrix, q_vec)
            top_indices = np.argsort(scores)[::-1][:top_k]

            for idx in top_indices:
                meta = dict(self.documents[idx])
                meta["similarity_score"] = float(round(scores[idx], 4))
                results.append(meta)

        return results

    def clear(self):
        """Resets the vector index."""
        self.documents = []
        self.vectors = []
        self._initialize_faiss()

    def save_local(self, folder_path: str = "data/faiss_index"):
        """Saves FAISS index to index.faiss and metadata to metadata.pkl."""
        os.makedirs(folder_path, exist_ok=True)
        index_path = os.path.join(folder_path, "index.faiss")
        meta_path = os.path.join(folder_path, "metadata.pkl")

        if self.faiss_index is not None:
            try:
                import faiss
                faiss.write_index(self.faiss_index, index_path)
            except Exception as e:
                logger.error(f"Failed to save FAISS index: {e}")

        payload = {
            "documents": self.documents,
            "vectors": self.vectors,
            "embedding_dim": self.embedding_dim,
            "mode": self.mode
        }
        with open(meta_path, "wb") as f:
            pickle.dump(payload, f)
        logger.info(f"Saved vector store to {folder_path}")

    def load_local(self, folder_path: str = "data/faiss_index") -> bool:
        """Loads FAISS index from index.faiss and metadata from metadata.pkl."""
        index_path = os.path.join(folder_path, "index.faiss")
        meta_path = os.path.join(folder_path, "metadata.pkl")

        if not os.path.exists(meta_path):
            return False

        try:
            with open(meta_path, "rb") as f:
                payload = pickle.load(f)
            self.documents = payload.get("documents", [])
            self.vectors = payload.get("vectors", [])
            self.embedding_dim = payload.get("embedding_dim", self.embedding_dim)
            self.mode = payload.get("mode", self.mode)

            if os.path.exists(index_path):
                try:
                    import faiss
                    self.faiss_index = faiss.read_index(index_path)
                    self.mode = "faiss_local"
                except Exception as e:
                    logger.warning(f"Could not load FAISS index file: {e}. Using stored vectors.")
            return True
        except Exception as e:
            logger.error(f"Failed to load vector store from {folder_path}: {e}")
            return False

