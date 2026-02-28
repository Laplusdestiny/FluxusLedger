from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime


class PaymentMethodCreate(BaseModel):
    """Payment method create schema"""

    name: str
    type: str
    asset_id: Optional[UUID] = None
    closing_day: Optional[int] = None  # 締め日 (1-31)
    payment_day: Optional[int] = None  # 引き落とし日 (1-31)

    @field_validator("type")
    @classmethod
    def type_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("種別は必須です")
        if len(v) > 50:
            raise ValueError("種別は50文字以内で入力してください")
        return v

    @field_validator("closing_day", "payment_day")
    @classmethod
    def validate_day(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 31):
            raise ValueError("日は1〜31の範囲で入力してください")
        return v


class PaymentMethodUpdate(BaseModel):
    """Payment method update schema"""

    name: Optional[str] = None
    type: Optional[str] = None
    asset_id: Optional[UUID] = None
    closing_day: Optional[int] = None
    payment_day: Optional[int] = None

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

    @field_validator("closing_day", "payment_day")
    @classmethod
    def validate_day(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 31):
            raise ValueError("日は1〜31の範囲で入力してください")
        return v


class PaymentMethodResponse(BaseModel):
    """Payment method response schema"""

    id: UUID
    name: str
    type: str
    asset_id: Optional[UUID] = None
    closing_day: Optional[int] = None
    payment_day: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
