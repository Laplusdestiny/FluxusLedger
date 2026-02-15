import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Numeric
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from decimal import Decimal

from app.db.base import Base


class Budget(Base):
    """Budget model"""
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    year = Column(String(4), nullable=False)
    month = Column(String(2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
