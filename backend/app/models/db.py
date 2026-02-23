from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel, create_engine, Session, select
from app.core.config import get_settings

settings = get_settings()

class Document(SQLModel, table=True):
    doc_id: str = Field(primary_key=True)
    filename: str
    chunk_count: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    file_path: Optional[str] = None

# SQLite setup
engine = create_engine(settings.SQLITE_URL, connect_args={"check_same_thread": False})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
