import os
from typing import List, Dict, Any
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever
from langchain_core.documents import Document
from app.core.config import get_settings

settings = get_settings()

class VectorService:
    def __init__(self):
        if settings.EMBEDDING_PROVIDER == "huggingface":
            self.embeddings = HuggingFaceEmbeddings(
                model_name="all-MiniLM-L6-v2"
            )
        else:
            self.embeddings = OpenAIEmbeddings(
                model="text-embedding-3-small",
                openai_api_key=settings.OPENAI_API_KEY
            )
            
        self.vector_store = Chroma(
            collection_name=settings.COLLECTION_NAME,
            embedding_function=self.embeddings,
            persist_directory=settings.CHROMA_PERSIST_DIRECTORY
        )
        self.bm25_retriever = None
        self._initialize_bm25()

    def _initialize_bm25(self):
        """
        Initialize BM25 retriever from existing documents in Chroma.
        This is a heavy operation for large datasets but necessary for local hybrid search without external engines.
        """
        try:
            # Fetch all documents from Chroma to build BM25 index
            # Chroma get() without ids returns all
            result = self.vector_store.get()
            documents = []
            if result['documents']:
                for i, text in enumerate(result['documents']):
                    metadata = result['metadatas'][i] if result['metadatas'] else {}
                    documents.append(Document(page_content=text, metadata=metadata))
            
            if documents:
                self.bm25_retriever = BM25Retriever.from_documents(documents)
                self.bm25_retriever.k = 20  # Default retrieval count
            else:
                self.bm25_retriever = None
        except Exception as e:
            print(f"Failed to initialize BM25: {e}")
            self.bm25_retriever = None

    def add_documents(self, documents: List[Document]):
        """
        Add documents to Chroma and update BM25 index.
        """
        if not documents:
            return
            
        self.vector_store.add_documents(documents)
        # Re-initialize BM25 to include new documents
        # In production, this should be optimized or handled asynchronously
        self._initialize_bm25()

    def delete_document(self, doc_id: str):
        """
        Delete documents by doc_id metadata.
        """
        # Chroma requires filtering by metadata
        self.vector_store._collection.delete(where={"doc_id": doc_id})
        self._initialize_bm25()

    def get_retriever(self, k: int = 5, filters: Dict[str, Any] = None):
        """
        Get an EnsembleRetriever (Vector + BM25) or just Vector if BM25 is empty.
        """
        chroma_retriever = self.vector_store.as_retriever(
            search_kwargs={"k": k, "filter": filters}
        )
        
        if self.bm25_retriever and not filters:
            self.bm25_retriever.k = k
            # Note: BM25Retriever doesn't support metadata filters natively in LangChain easily
            # We might need to post-filter or just rely on the ensemble
            ensemble_retriever = EnsembleRetriever(
                retrievers=[chroma_retriever, self.bm25_retriever],
                weights=[0.5, 0.5]
            )
            return ensemble_retriever
        
        return chroma_retriever

    def get_stats(self):
        return {
            "count": self.vector_store._collection.count()
        }

# Singleton instance
vector_service = VectorService()
