from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class AssetCreate(BaseModel):
    """Asset create schema"""

    name: str
    type: str
    balance: Decimal = Decimal("0")

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("資産名は必須です")
        if len(v) > 100:
            raise ValueError("資産名は100文字以内で入力してください")
        return v

    @field_validator("type")
    @classmethod
    def type_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("種別は必須です")
        if len(v) > 50:
            raise ValueError("種別は50文字以内で入力してください")
        return v


class AssetUpdate(BaseModel):
    """Asset update schema"""

    name: Optional[str] = None
    type: Optional[str] = None
    balance: Optional[Decimal] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("資産名は必須です")
            if len(v) > 100:
                raise ValueError("資産名は100文字以内で入力してください")
        return v

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


class AssetResponse(BaseModel):
    """Asset response schema"""

    id: UUID
    name: str
    type: str
    balance: Decimal
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CreditCardAlert(BaseModel):
    """Credit card payment alert schema"""

    payment_method_id: UUID
    payment_method_name: str
    bank_asset_id: Optional[UUID] = None
    bank_asset_name: Optional[str] = None
    bank_balance: Decimal
    next_payment_date: str  # YYYY-MM-DD
    closed_period_charges: Decimal  # 確定した請求額
    current_period_charges: Decimal  # 今期の利用額（未確定）
    shortfall: Decimal  # 不足額 (0 if sufficient)
