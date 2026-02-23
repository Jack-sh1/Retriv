# AI Knowledge Base Backend

Based on FastAPI, LangChain, ChromaDB, and OpenAI.

## Prerequisites

- Python 3.9+
- OpenAI API Key

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

3. Run the server:
   ```bash
   python app/main.py
   # Or using uvicorn directly:
   # uvicorn app.main:app --reload --port 8000
   ```

## API Documentation

Once running, visit: `http://localhost:8000/docs`

## Features

- **Document Upload**: PDF, Markdown, Text.
- **Hybrid Search**: Vector (Chroma) + Keyword (BM25).
- **RAG Chat**: Streamed responses with source citations.
- **Persistence**: ChromaDB for vectors, SQLite for metadata.

## Directory Structure

- `app/api`: API Endpoints.
- `app/core`: Configuration & Exceptions.
- `app/models`: Pydantic Schemas & SQLModel DB.
- `app/services`: Business logic (Ingestion, Chat, Vector Store).
- `data`: Storage for database files.
