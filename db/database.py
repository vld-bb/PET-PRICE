"""Database connection and session factory for LemmikuHind."""

import os
from pathlib import Path
from contextlib import contextmanager
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.engine import Engine

from db.models import Base

# Root directory of the repository
BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_SQLITE_PATH = BASE_DIR / "petprice.db"


def get_database_url() -> str:
    """Return database URL from env or fallback to local SQLite."""
    url = os.getenv("DATABASE_URL")
    if not url:
        return f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"
    # Normalize postgres:// to postgresql:// for SQLAlchemy compatibility
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


DATABASE_URL = get_database_url()

# Enable SQLite foreign key support
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Create all tables defined in Base models."""
    Base.metadata.create_all(bind=engine)
    print(f"Database initialized with schema at: {DATABASE_URL}")


@contextmanager
def get_db_session() -> Session:
    """Context manager for database sessions with automatic commit/rollback."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
