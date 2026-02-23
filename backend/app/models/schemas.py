from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    doc_ids: Optional[List[str]] = Field(default_factory=list)
    history: List[Message] = Field(default_factory=list)

class DocumentUploadResponse(BaseModel):
    doc_id: str
    chunk_count: int
    status: str

class DocumentInfo(BaseModel):
    doc_id: str
    filename: str
    chunk_count: int
    created_at: datetime

class HealthResponse(BaseModel):
    status: str
    doc_count: int
    vector_count: int
