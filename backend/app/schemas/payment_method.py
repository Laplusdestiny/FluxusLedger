from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime


class PaymentMethodCreate(BaseModel):
    """Payment method create schema"""

    name: str
    type: str

    @field_validator("type")
    @classmethod
    def type_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("種別は必須です")
        if len(v) > 50:
            raise ValueError("種別は50文字以内で入力してください")
        return v


class PaymentMethodUpdate(BaseModel):
    """Payment method update schema"""

    name: Optional[str] = None
    type: Optional[str] = None

    @field_validator("type")
    @classmethod
    def type_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("種別は必須です")
            if len(v) > 50:
                raise ValueError("種別は50文字以内で入力してください")
        return v


class PaymentMethodResponse(BaseModel):
    """Payment method response schema"""

    id: UUID
    name: str
    type: str
    created_at: datetime

    class Config:
        from_attributes = True
