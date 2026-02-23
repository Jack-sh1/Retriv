# Recall

> RAG-powered knowledge base assistant. Upload your documents, ask anything — get accurate, source-cited answers in real time.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · TypeScript · Vite · UnoCSS |
| Backend | FastAPI · Python 3.11 |
| RAG | LangChain · ChromaDB |
| LLM | Anthropic Claude API |
| Streaming | Server-Sent Events (SSE) |

---

## Features

- 📄 Upload PDF / Markdown / TXT documents
- 🔍 Hybrid retrieval — vector search + BM25, fused via RRF
- ⚖️ Two-stage rerank — recall Top-20, rerank to Top-5
- 💬 Streaming answers with source citations
- 🚫 Hallucination-resistant — refuses to answer outside context

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Anthropic API key

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

---

## Docker

```bash
# Copy and fill in your API key first
cp .env.example .env

docker compose up --build
```

Services:
- Frontend → `http://localhost:5173`
- Backend  → `http://localhost:8000`

`docker-compose.yml` mounts `./data` for ChromaDB persistence.

---

## API

Base URL: `http://localhost:8000/api`

#### Upload document
```
POST /documents/upload
Content-Type: multipart/form-data

file: <PDF | TXT | MD>
```
```json
{ "doc_id": "abc123", "chunk_count": 24, "status": "ok" }
```

#### List documents
```
GET /documents
```
```json
[{ "doc_id": "abc123", "filename": "handbook.pdf", "chunk_count": 24, "created_at": "2026-02-22T10:00:00Z" }]
```

#### Delete document
```
DELETE /documents/{doc_id}
```

#### Chat (streaming)
```
POST /chat/stream
Content-Type: application/json

{ "query": "string", "doc_ids": ["abc123"], "history": [] }
```

SSE response stream:
```
data: {"type": "token",   "content": "Based on..."}
data: {"type": "sources", "sources": [{"text": "...", "score": 0.91, "source": "handbook.pdf"}]}
data: {"type": "done",    "usage": {"input_tokens": 480, "output_tokens": 212}}
```

#### Health check
```
GET /health
```
```json
{ "status": "ok", "doc_count": 3, "vector_count": 72 }
```

---

## Project Structure

```
recall/
├── backend/
│   ├── main.py
│   ├── routers/
│   │   ├── chat.py
│   │   └── documents.py
│   ├── services/
│   │   ├── rag_service.py
│   │   ├── embedding.py
│   │   └── llm_service.py
│   ├── models/schemas.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── stores/
│   │   └── hooks/
│   ├── vite.config.ts
│   └── uno.config.ts
├── docker-compose.yml
└── .env.example
```

---

## Environment Variables

```bash
# .env.example
ANTHROPIC_API_KEY=sk-ant-...
CHROMA_PERSIST_DIR=./data/chroma
CHUNK_SIZE=512
CHUNK_OVERLAP=50
RETRIEVAL_TOP_K=20
RERANK_TOP_N=5
```

---

## Contributing

1. Fork the repo
2. Create a feature branch — `git checkout -b feat/your-feature`
3. Commit with conventional commits — `feat:` / `fix:` / `docs:`
4. Open a pull request

---

## License

MIT
