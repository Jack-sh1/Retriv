import json
import asyncio
from typing import AsyncGenerator, List, Dict
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.documents import Document
from app.core.config import get_settings
from app.services.vector_store import vector_service

settings = get_settings()

class ChatService:
    def __init__(self):
        if settings.LLM_PROVIDER == "deepseek":
            self.llm = ChatOpenAI(
                model="deepseek-chat",
                temperature=0,
                streaming=True,
                openai_api_key=settings.DEEPSEEK_API_KEY,
                base_url="https://api.deepseek.com"
            )
        else:
            self.llm = ChatOpenAI(
                model="gpt-3.5-turbo", # Or gpt-4o if available
                temperature=0,
                streaming=True,
                openai_api_key=settings.OPENAI_API_KEY
            )
        
        self.prompt = ChatPromptTemplate.from_template("""
        You are a strict AI assistant. Answer the user's question solely based on the provided context.
        If the answer is not in the context, clearly state: "Sorry, I cannot find relevant information in the provided documents."
        Do not make up facts.
        
        Context:
        {context}
        
        Question: {question}
        
        Answer:
        """)

    async def stream_chat(
        self, 
        query: str, 
        doc_ids: List[str] = None, 
        history: List[Dict] = None
    ) -> AsyncGenerator[str, None]:
        
        # 1. Retrieval (Hybrid)
        # Filter by doc_ids if provided
        filters = None
        if doc_ids:
            filters = {"doc_id": {"$in": doc_ids}}
            
        retriever = vector_service.get_retriever(k=20, filters=filters)
        docs = await retriever.ainvoke(query)
        
        # 2. Simple Rerank (Take Top 5 from Ensemble/Hybrid result)
        # EnsembleRetriever already uses RRF (Reciprocal Rank Fusion) to sort
        top_docs = docs[:5]
        
        # 3. Format Context
        context_str = "\n\n".join([d.page_content for d in top_docs])
        
        # 4. Stream Sources
        sources = [
            {
                "text": d.page_content,
                "score": d.metadata.get("score", 0),
                "source": d.metadata.get("filename", "unknown")
            } 
            for d in top_docs
        ]
        yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"
        
        # 5. Generate Response
        chain = (
            {"context": lambda x: context_str, "question": lambda x: query}
            | self.prompt
            | self.llm
            | StrOutputParser()
        )
        
        async for chunk in chain.astream(query):
            yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
            
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

chat_service = ChatService()
