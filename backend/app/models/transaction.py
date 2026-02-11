import uuid
from sqlalchemy import Column, String, ForeignKey, Enum as SQLEnum, DateTime, Date, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, date
import enum
from decimal import Decimal

from app.db.base import Base


class TransactionType(str, enum.Enum):
    """Transaction type enum"""
    INCOME = "income"
    EXPENSE = "expense"


class Transaction(Base):
    """Transaction model"""
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    amount = Column(Numeric(15, 2), nullable=False)
    type = Column(SQLEnum(TransactionType), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)
    payment_method_id = Column(UUID(as_uuid=True), ForeignKey("payment_methods.id"))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
