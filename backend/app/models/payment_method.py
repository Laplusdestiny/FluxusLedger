import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

from app.db.base import Base


# Predefined payment method types (used as suggestions, not constraints)
DEFAULT_PAYMENT_TYPES: dict[str, str] = {
    "cash": "現金",
    "credit_card": "クレジットカード",
    "debit_card": "デビットカード",
    "bank_transfer": "銀行振込",
    "e_money": "電子マネー",
    "qr_code": "QRコード決済",
    "prepaid_card": "プリペイドカード",
    "point": "ポイント払い",
}


class PaymentMethod(Base):
    """Payment method model"""

    __tablename__ = "payment_methods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
