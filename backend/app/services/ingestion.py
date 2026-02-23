import uuid
import os
import shutil
from typing import List
from datetime import datetime, timezone
from fastapi import UploadFile, HTTPException
from langchain_community.document_loaders import PyPDFLoader, TextLoader, UnstructuredMarkdownLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from app.services.vector_store import vector_service
from app.models.db import Document as DBDocument, get_session, engine
from sqlmodel import Session

TEMP_DIR = "./temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

class IngestionService:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=512,
            chunk_overlap=50,
            separators=["\n\n", "\n", " ", ""]
        )

    def process_file(self, file: UploadFile) -> tuple[str, int]:
        # 1. Use UUID for filename to avoid encoding issues with non-ASCII characters in file system
        ext = os.path.splitext(file.filename)[1]
        safe_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(TEMP_DIR, safe_filename)
        
        try:
            # Save temp file (binary mode, no encoding needed)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Load
            documents = self._load_file(file_path, file.filename)
            
            # Split
            chunks = self.text_splitter.split_documents(documents)
            
            # Generate doc_id
            doc_id = str(uuid.uuid4())
            
            # Add metadata
            # 4. Ensure metadata is safe. While Chroma supports UTF-8, some environments might trigger encoding errors.
            # We keep original filename but ensure it's handled if it causes issues.
            for chunk in chunks:
                chunk.metadata.update({
                    "doc_id": doc_id,
                    "filename": file.filename,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            
            # Index to Vector Store (and BM25)
            vector_service.add_documents(chunks)
            
            # Record in SQL DB
            with Session(engine) as session:
                db_doc = DBDocument(
                    doc_id=doc_id,
                    filename=file.filename,
                    chunk_count=len(chunks),
                    file_path=file_path  # Keep file for future reference or delete?
                )
                session.add(db_doc)
                session.commit()
            
            # Clean up temp file? Maybe keep for re-indexing?
            # os.remove(file_path) 
            
            return doc_id, len(chunks)
            
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

    def _load_file(self, file_path: str, filename: str) -> List[Document]:
        ext = os.path.splitext(filename)[1].lower()
        if ext == ".pdf":
            loader = PyPDFLoader(file_path)
        elif ext == ".md":
            # 2/3. Ensure text loaders use UTF-8
            loader = UnstructuredMarkdownLoader(file_path, mode="single", encoding="utf-8")
        elif ext == ".txt":
            # 2/3. Ensure text loaders use UTF-8
            loader = TextLoader(file_path, encoding="utf-8")
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
            
        return loader.load()

    def delete_document(self, doc_id: str):
        # Remove from Vector Store
        vector_service.delete_document(doc_id)
        
        # Remove from SQL DB
        with Session(engine) as session:
            doc = session.get(DBDocument, doc_id)
            if doc:
                session.delete(doc)
                session.commit()
                # Optionally delete physical file
                if doc.file_path and os.path.exists(doc.file_path):
                    os.remove(doc.file_path)
            else:
                raise HTTPException(status_code=404, detail="Document not found")

ingestion_service = IngestionService()
