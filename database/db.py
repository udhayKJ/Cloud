"""
CloudShift AI: Database Engine and Session Factory
Supports both Async (asyncpg) and Sync (psycopg2) connections for FastAPI / SQLAlchemy
"""

import os
from typing import AsyncGenerator, Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Environment configuration with defaults
DATABASE_URL_SYNC = os.getenv(
    "DATABASE_URL",
    "postgresql://cloudshift_user:cloudshift_password@localhost:5432/cloudshift_db"
)

# Replace prefix for asyncpg if required
DATABASE_URL_ASYNC = os.getenv(
    "ASYNC_DATABASE_URL",
    DATABASE_URL_SYNC.replace("postgresql://", "postgresql+asyncpg://")
)

# 1. Sync Engine (for CLI scripts, migrations, standard endpoints)
sync_engine = create_engine(
    DATABASE_URL_SYNC,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=False
)
SyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# 2. Async Engine (for high-performance FastAPI async routes)
async_engine = create_async_engine(
    DATABASE_URL_ASYNC,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=False
)
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)


def get_sync_db() -> Generator[Session, None, None]:
    """Dependency for synchronous endpoints"""
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency for asynchronous endpoints"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
