import uuid
from sqlalchemy import Column, String, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import enum

from app.db.base import Base


class TransactionType(str, enum.Enum):
    """Transaction type enum"""
    INCOME = "income"
    EXPENSE = "expense"


class Category(Base):
    """Category model"""
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(SQLEnum(TransactionType), nullable=False)
    color = Column(String(7), default="#1E3A8A")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
