from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from enum import Enum


class TransactionType(str, Enum):
    """Transaction type enum"""
    INCOME = "income"
    EXPENSE = "expense"


class CategoryCreate(BaseModel):
    """Category create schema"""
    name: str
    type: TransactionType
    color: Optional[str] = "#1E3A8A"


class CategoryUpdate(BaseModel):
    """Category update schema"""
    name: Optional[str] = None
    color: Optional[str] = None


class CategoryResponse(BaseModel):
    """Category response schema"""
    id: UUID
    name: str
    type: TransactionType
    color: str
    created_at: datetime

    class Config:
        from_attributes = True
