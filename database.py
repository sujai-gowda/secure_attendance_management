from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from sqlalchemy.pool import QueuePool
from datetime import datetime
from typing import Optional, List, Dict, Any
import logging

from config import Config

logger = logging.getLogger(__name__)

Base = declarative_base()


class BlockModel(Base):
    __tablename__ = 'blocks'

    id = Column(Integer, primary_key=True, autoincrement=True)
    index = Column(Integer, unique=True, nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    data = Column(JSON, nullable=False)
    prev_hash = Column(String(64), nullable=False, index=True)
    merkle_root = Column(String(64), nullable=True, index=True)
    hash = Column(String(64), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'index': self.index,
            'timestamp': str(self.timestamp),
            'data': self.data,
            'prev_hash': self.prev_hash,
            'merkle_root': self.merkle_root,
            'hash': self.hash
        }


class UserModel(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(64), nullable=False)
    role = Column(String(20), nullable=False, default='teacher', index=True)
    email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'email': self.email,
            'created_at': str(self.created_at),
        }


class DatabaseService:
    def __init__(self, database_url: Optional[str] = None):
        if database_url is None:
            database_url = Config.DATABASE_URL if hasattr(Config, 'DATABASE_URL') else 'sqlite:///blockendance.db'
        
        self.engine = create_engine(
            database_url,
            poolclass=QueuePool,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            echo=False
        )
        
        self.SessionLocal = sessionmaker(
            bind=self.engine,
            autocommit=False,
            autoflush=False
        )
        
        Base.metadata.create_all(self.engine)
        logger.info(f"Database initialized: {database_url}")

    def get_session(self) -> Session:
        return self.SessionLocal()

    def create_tables(self):
        Base.metadata.create_all(self.engine)
        logger.info("Database tables created")

    def drop_tables(self):
        Base.metadata.drop_all(self.engine)
        logger.warning("Database tables dropped")


db_service = DatabaseService()

