import uuid
from sqlalchemy import Column, String, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import enum

from app.db.base import Base


class PaymentMethodType(str, enum.Enum):
    """Payment method type enum"""
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"


class PaymentMethod(Base):
    """Payment method model"""
    __tablename__ = "payment_methods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(SQLEnum(PaymentMethodType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
