from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class BudgetCreate(BaseModel):
    """Budget create schema"""
    category_id: UUID
    amount: Decimal
    year: str
    month: str


class BudgetUpdate(BaseModel):
    """Budget update schema"""
    amount: Optional[Decimal] = None


class BudgetResponse(BaseModel):
    """Budget response schema"""
    id: UUID
    category_id: UUID
    amount: Decimal
    year: str
    month: str
    created_at: datetime

    class Config:
        from_attributes = True
