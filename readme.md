# Research Paper Intelligence Platform

> A full-stack, modular research paper analysis platform for uploading, analyzing, searching, comparing, and understanding academic research papers.

---

## Team Structure

| Person | Role | Owns |
|--------|------|------|
| **Person 1** | Backend / API Developer | `backend/` |
| **Person 2** | AI/ML + NLP Developer  | `ai_ml/`, `ai_ml/training/` |
| **Person 3** | Research Processing    | `research_processing/` |
| **Person 4** | Frontend Developer     | `frontend/` |

---

## Features

- 📄 Upload research papers (PDF) with automatic structure extraction
- 🔍 **Semantic search** — search by meaning, not keywords
- 📝 Structured paper summaries (extractive, grounded — no fabrication)
- ⚖️ Multi-paper comparison (dataset, model, methodology, results)
- 🕸️ Interactive citation network visualization
- 📚 Structured literature review generation
- 📈 Research trend observation (from selected papers)
- 🔭 Potential research gap identification (labeled as potential — requires verification)

---

## Architecture

```
React Dashboard → FastAPI Backend → Research Processing + AI/ML → FAISS → Results
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the backend
```bash
uvicorn backend.main:app --reload
```
Backend API docs: http://localhost:8000/api/docs

### 3. Install and start the frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

---

## AI/ML Development Pipeline (Person 2)

```bash
# Step 1: Prepare data (arXiv dataset)
python -m ai_ml.training.prepare_data --input data/training/raw/arxiv_data.csv

# Step 2: Clean data
python -m ai_ml.training.clean_data --input data/training/processed/train.jsonl

# Step 3: Train tokenizer
python -m ai_ml.training.tokenizer --corpus_file data/training/processed/train.jsonl

# Step 4: Train the Scientific Transformer
python -m ai_ml.training.train

# Step 5: Evaluate embeddings
python -m ai_ml.training.evaluate --checkpoint checkpoints/scientific_transformer_best.pt

# Step 6: Verify model architecture
python ai_ml/training/model.py
```

### Key AI/ML Design Decisions
- Custom Scientific Transformer (NOT SciBERT, BERT, or OpenAI)
- BPE tokenizer trained from scratch on scientific text
- InfoNCE in-batch contrastive loss
- 512-D L2-normalized output embeddings
- FAISS flat inner-product index (cosine similarity)
- Stub mode: platform functions without trained model (random projections for development)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/papers/upload` | Upload PDF |
| GET  | `/papers` | List all papers |
| GET  | `/papers/{id}` | Paper details |
| POST | `/search` | Semantic search |
| GET  | `/papers/{id}/summary` | Paper summary |
| POST | `/comparison` | Compare papers |
| GET  | `/papers/{id}/citations` | Citation network |
| POST | `/literature-review` | Generate review |

Full docs: http://localhost:8000/api/docs

---

## Project Structure

```
AI-Research-Platform/
├── backend/         — FastAPI routes + services (Person 1)
├── ai_ml/           — Custom Transformer + FAISS (Person 2)
│   └── training/    — Data → Tokenizer → Model → Train → Eval
├── research_processing/ — PDF parsing + analysis (Person 3)
├── frontend/        — React + Vite dashboard (Person 4)
├── data/            — Papers, training data, FAISS index
├── checkpoints/     — Model checkpoints
├── tests/           — Modular unit + integration tests
├── config.py        — Central configuration
└── requirements.txt
```

---

## Git Branch Strategy

```
main
├── feature/backend
├── feature/ai-ml
├── feature/research-processing
└── feature/frontend
```

---

## Testing

```bash
pytest tests/ -v
```

---

## Important Notes

- **This is NOT a chatbot.** No conversational interface.
- **Research gaps** are labeled as *Potential* — always require researcher verification.
- **Research trends** are observations from the selected paper collection — not universal claims.
- **Summaries** are extractive — grounded in paper content, no fabrication.
- The AI/ML stub mode lets development proceed before model training is complete.

---

## Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1  | Folder structure + configuration | ✅ Complete |
| 2  | PDF processing | ✅ Complete |
| 3  | AI/ML training pipeline | ✅ Complete (skeleton) |
| 4  | Train Scientific Transformer | 🔲 Person 2 |
| 5  | Embedding engine | ✅ Complete (stub mode) |
| 6  | FAISS vector store | ✅ Complete |
| 7  | Semantic search | ✅ Complete |
| 8  | Summaries | ✅ Complete |
| 9  | Comparison + citation | ✅ Complete |
| 10 | Literature review + gap analysis | ✅ Complete |
| 11 | FastAPI connected | ✅ Complete |
| 12 | React frontend connected | ✅ Complete |
| 13 | Testing + integration | 🔲 In progress |
