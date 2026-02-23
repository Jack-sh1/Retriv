from typing import Literal, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "AI Knowledge Base"
    API_V1_STR: str = "/api"
    PROJECT_ROOT: str = "."
    
    # LLM Settings
    LLM_PROVIDER: Literal["openai", "anthropic"] = "openai"
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    
    # Vector DB
    CHROMA_PERSIST_DIRECTORY: str = "./data/chroma_db"
    COLLECTION_NAME: str = "knowledge_base"
    
    # Metadata DB (SQLite)
    SQLITE_URL: str = "sqlite:///./data/metadata.db"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

@lru_cache
def get_settings():
    return Settings()
