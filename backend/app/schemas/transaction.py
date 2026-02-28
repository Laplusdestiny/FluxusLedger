from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from enum import Enum


class TransactionType(str, Enum):
    """Transaction type enum"""

    INCOME = "income"
    EXPENSE = "expense"


class TransactionCreate(BaseModel):
    """Transaction create schema"""

    date: date
    amount: Decimal
    type: TransactionType
    category_id: UUID
    payment_method_id: Optional[UUID] = None
    asset_id: Optional[UUID] = None  # 入金先 (for income transactions)
    description: Optional[str] = None


class TransactionUpdate(BaseModel):
    """Transaction update schema"""

    date: Optional[date] = None
    amount: Optional[Decimal] = None
    type: Optional[TransactionType] = None
    category_id: Optional[UUID] = None
    payment_method_id: Optional[UUID] = None
    asset_id: Optional[UUID] = None
    description: Optional[str] = None


class TransactionResponse(BaseModel):
    """Transaction response schema"""

    id: UUID
    date: date
    amount: Decimal
    type: TransactionType
    category_id: UUID
    payment_method_id: Optional[UUID] = None
    asset_id: Optional[UUID] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
