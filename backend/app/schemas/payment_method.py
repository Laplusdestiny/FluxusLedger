from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from enum import Enum


class PaymentMethodType(str, Enum):
    """Payment method type enum"""
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"


class PaymentMethodCreate(BaseModel):
    """Payment method create schema"""
    name: str
    type: PaymentMethodType


class PaymentMethodUpdate(BaseModel):
    """Payment method update schema"""
    name: Optional[str] = None
    type: Optional[PaymentMethodType] = None


class PaymentMethodResponse(BaseModel):
    """Payment method response schema"""
    id: UUID
    name: str
    type: PaymentMethodType
    created_at: datetime

    class Config:
        from_attributes = True
