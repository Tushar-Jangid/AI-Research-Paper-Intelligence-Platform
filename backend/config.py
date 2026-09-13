"""
Configuration file for the Research Paper Intelligence Platform.
"""

from pathlib import Path

# Project root directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Data directories
DATA_DIR = PROJECT_ROOT / "data"
PAPERS_DIR = DATA_DIR / "papers"
TRAINING_RAW_DIR = DATA_DIR / "training" / "raw"
TRAINING_PROC_DIR = DATA_DIR / "training" / "processed"
FAISS_INDEX_DIR = DATA_DIR / "faiss_index"
CHECKPOINTS_DIR = DATA_DIR / "checkpoints"

# Metadata file
PAPERS_META_FILE = DATA_DIR / "papers_metadata.json"

# API configuration
API_HOST = "0.0.0.0"
API_PORT = 8000
API_RELOAD = True

# Text processing
MAX_CHUNK_TOKENS = 512
CHUNK_OVERLAP = 50

# CORS configuration
CORS_ORIGINS = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]
