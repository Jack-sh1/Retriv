import json
import asyncio
from typing import AsyncGenerator, List, Dict
from openai import AsyncOpenAI
from app.core.config import get_settings
from app.services.vector_store import vector_service

settings = get_settings()

class ChatService:
    def __init__(self):
        # Initialize OpenAI Client for DeepSeek or OpenAI
        if settings.LLM_PROVIDER == "deepseek":
            self.client = AsyncOpenAI(
                api_key=settings.DEEPSEEK_API_KEY,
                base_url="https://api.deepseek.com"
            )
            self.model = "deepseek-chat"
        else:
            self.client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY
            )
            self.model = "gpt-3.5-turbo"
        
        self.system_prompt = """
        You are a strict AI assistant. Answer the user's question solely based on the provided context.
        If the answer is not in the context, clearly state: "Sorry, I cannot find relevant information in the provided documents."
        Do not make up facts.
        """

    async def stream_chat(
        self, 
        query: str, 
        doc_ids: List[str] = None, 
        history: List[Dict] = None
    ) -> AsyncGenerator[str, None]:
        
        try:
            # 1. Retrieval (Hybrid)
            filters = None
            if doc_ids:
                filters = {"doc_id": {"$in": doc_ids}}
                
            retriever = vector_service.get_retriever(k=20, filters=filters)
            docs = await retriever.ainvoke(query)
            
            # 2. Simple Rerank (Take Top 5)
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
            
            # 5. Prepare Messages
            messages = [
                {"role": "system", "content": f"{self.system_prompt}\n\nContext:\n{context_str}"},
            ]
            
            # Add history if needed (simplified for now)
            if history:
                for msg in history:
                    # Ensure role is valid (user/assistant)
                    if msg.get("role") in ["user", "assistant"]:
                        messages.append({"role": msg["role"], "content": msg["content"]})
            
            messages.append({"role": "user", "content": query})
            
            # 6. Stream Response
            # Set stream_options={"include_usage": True} to get usage stats in the last chunk
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=1024,
                stream=True,
                stream_options={"include_usage": True}
            )
            
            usage_info = None
            
            async for chunk in stream:
                # Handle usage if present (usually in the last chunk with empty choices)
                if chunk.usage:
                    usage_info = {
                        "prompt_tokens": chunk.usage.prompt_tokens,
                        "completion_tokens": chunk.usage.completion_tokens,
                        "total_tokens": chunk.usage.total_tokens
                    }
                    continue
                    
                # Safe access to delta content
                if not chunk.choices:
                    continue
                    
                delta = chunk.choices[0].delta
                if delta.content:
                    yield f"data: {json.dumps({'type': 'token', 'content': delta.content})}\n\n"
                
            # 7. Done with usage
            done_data = {'type': 'done'}
            if usage_info:
                done_data['usage'] = usage_info
                
            yield f"data: {json.dumps(done_data)}\n\n"
            
        except Exception as e:
            # Yield error message instead of raising, to prevent connection drop without info
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

chat_service = ChatService()
