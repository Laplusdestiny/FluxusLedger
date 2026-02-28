import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Numeric
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from decimal import Decimal

from app.db.base import Base


# Predefined asset types (used as suggestions, not constraints)
DEFAULT_ASSET_TYPES: list[str] = [
    "銀行口座",
    "プリペイドカード",
    "電子マネー",
    "現金",
    "証券口座",
]


class Asset(Base):
    """Asset model - tracks where money is stored"""

    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    balance = Column(Numeric(15, 2), nullable=False, default=Decimal("0"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
