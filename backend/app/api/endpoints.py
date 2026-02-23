from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from app.models.schemas import DocumentUploadResponse, DocumentInfo, ChatRequest, HealthResponse
from app.models.db import get_session, Document as DBDocument
from app.services.ingestion import ingestion_service
from app.services.chat_service import chat_service
from app.services.vector_store import vector_service

router = APIRouter()

@router.post("/documents/upload", response_model=DocumentUploadResponse)
def upload_document(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    try:
        doc_id, chunk_count = ingestion_service.process_file(file)
        return DocumentUploadResponse(
            doc_id=doc_id,
            chunk_count=chunk_count,
            status="success"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents", response_model=List[DocumentInfo])
def list_documents(
    session: Session = Depends(get_session)
):
    documents = session.exec(select(DBDocument)).all()
    return [
        DocumentInfo(
            doc_id=doc.doc_id,
            filename=doc.filename,
            chunk_count=doc.chunk_count,
            created_at=doc.created_at
        ) for doc in documents
    ]

@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: str,
    session: Session = Depends(get_session)
):
    try:
        ingestion_service.delete_document(doc_id)
        return {"status": "success", "message": "Document deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    return StreamingResponse(
        chat_service.stream_chat(
            query=request.query,
            doc_ids=request.doc_ids,
            history=request.history
        ),
        media_type="text/event-stream"
    )

@router.get("/health", response_model=HealthResponse)
def health_check(session: Session = Depends(get_session)):
    doc_count = session.exec(select(DBDocument)).all()
    vector_stats = vector_service.get_stats()
    return HealthResponse(
        status="ok",
        doc_count=len(doc_count),
        vector_count=vector_stats.get("count", 0)
    )
