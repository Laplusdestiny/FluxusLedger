from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from typing import List
from datetime import date, timedelta
from decimal import Decimal

from app.models.asset import Asset, DEFAULT_ASSET_TYPES
from app.models.payment_method import PaymentMethod
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.asset import (
    AssetCreate,
    AssetUpdate,
    AssetResponse,
    CreditCardAlert,
)
from app.db.session import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("/types")
def get_asset_types():
    """Get predefined asset types"""
    return DEFAULT_ASSET_TYPES


@router.get("/alerts", response_model=List[CreditCardAlert])
def get_credit_card_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get credit card payment alerts.

    For each credit card (payment method with closing_day and payment_day):
    - Calculate the last closed billing period
    - Sum expense transactions in that period
    - Compare with linked bank account balance
    - Also calculate current (open) period charges
    """
    # Find all credit cards (payment methods with closing_day)
    credit_cards = (
        db.query(PaymentMethod)
        .filter(
            PaymentMethod.user_id == current_user.id,
            PaymentMethod.closing_day.isnot(None),
            PaymentMethod.payment_day.isnot(None),
        )
        .all()
    )

    alerts = []
    today = date.today()

    for card in credit_cards:
        closing_day = card.closing_day
        payment_day = card.payment_day

        # Calculate the last closing date
        # If today is after closing_day this month, last close was this month
        # Otherwise, last close was last month
        try:
            this_month_close = date(
                today.year,
                today.month,
                min(closing_day, _days_in_month(today.year, today.month)),
            )
        except ValueError:
            this_month_close = _last_day_of_month(today.year, today.month)

        if today > this_month_close:
            # The billing period that just closed: previous closing date -> this month's closing date
            closed_period_end = this_month_close
            prev_month = _subtract_month(this_month_close)
            try:
                closed_period_start = date(
                    prev_month.year,
                    prev_month.month,
                    min(closing_day, _days_in_month(prev_month.year, prev_month.month)),
                )
            except ValueError:
                closed_period_start = _last_day_of_month(
                    prev_month.year, prev_month.month
                )
            # Next payment date is payment_day of next month
            next_month = _add_month(today)
            try:
                next_payment = date(
                    next_month.year,
                    next_month.month,
                    min(payment_day, _days_in_month(next_month.year, next_month.month)),
                )
            except ValueError:
                next_payment = _last_day_of_month(next_month.year, next_month.month)
            # Current period: this month's closing date + 1 day -> today
            current_period_start = closed_period_end + timedelta(days=1)
        else:
            # The billing period that last closed: two months ago closing -> last month closing
            last_month = _subtract_month(today)
            try:
                closed_period_end = date(
                    last_month.year,
                    last_month.month,
                    min(closing_day, _days_in_month(last_month.year, last_month.month)),
                )
            except ValueError:
                closed_period_end = _last_day_of_month(
                    last_month.year, last_month.month
                )
            two_months_ago = _subtract_month(last_month)
            try:
                closed_period_start = date(
                    two_months_ago.year,
                    two_months_ago.month,
                    min(
                        closing_day,
                        _days_in_month(two_months_ago.year, two_months_ago.month),
                    ),
                )
            except ValueError:
                closed_period_start = _last_day_of_month(
                    two_months_ago.year, two_months_ago.month
                )
            # Next payment date is payment_day of this month
            try:
                next_payment = date(
                    today.year,
                    today.month,
                    min(payment_day, _days_in_month(today.year, today.month)),
                )
            except ValueError:
                next_payment = _last_day_of_month(today.year, today.month)
            # Current period: last month's closing date + 1 day -> today
            current_period_start = closed_period_end + timedelta(days=1)

        # Sum expenses in the closed billing period (day after previous close -> closing date)
        closed_charges = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.payment_method_id == card.id,
                Transaction.type == "expense",
                Transaction.date > closed_period_start,
                Transaction.date <= closed_period_end,
            )
            .scalar()
        )

        # Sum expenses in current (open) period
        current_charges = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.payment_method_id == card.id,
                Transaction.type == "expense",
                Transaction.date >= current_period_start,
                Transaction.date <= today,
            )
            .scalar()
        )

        # Get linked bank account balance
        bank_balance = Decimal("0")
        bank_asset_name = None
        bank_asset_id = None
        if card.asset_id:
            bank_asset = db.query(Asset).filter(Asset.id == card.asset_id).first()
            if bank_asset:
                bank_balance = bank_asset.balance
                bank_asset_name = bank_asset.name
                bank_asset_id = bank_asset.id

        shortfall = max(Decimal("0"), Decimal(str(closed_charges)) - bank_balance)

        alerts.append(
            CreditCardAlert(
                payment_method_id=card.id,
                payment_method_name=card.name,
                bank_asset_id=bank_asset_id,
                bank_asset_name=bank_asset_name,
                bank_balance=bank_balance,
                next_payment_date=next_payment.isoformat(),
                closed_period_charges=Decimal(str(closed_charges)),
                current_period_charges=Decimal(str(current_charges)),
                shortfall=shortfall,
            )
        )

    return alerts


@router.get("", response_model=List[AssetResponse])
def get_assets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all assets for current user"""
    assets = (
        db.query(Asset)
        .filter(Asset.user_id == current_user.id)
        .order_by(Asset.created_at)
        .all()
    )
    return assets


@router.post("", response_model=AssetResponse)
def create_asset(
    asset_create: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new asset"""
    db_asset = Asset(
        user_id=current_user.id,
        name=asset_create.name,
        type=asset_create.type,
        balance=asset_create.balance,
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get an asset"""
    asset = (
        db.query(Asset)
        .filter(Asset.id == asset_id, Asset.user_id == current_user.id)
        .first()
    )
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="資産が見つかりません"
        )
    return asset


@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: UUID,
    asset_update: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an asset"""
    asset = (
        db.query(Asset)
        .filter(Asset.id == asset_id, Asset.user_id == current_user.id)
        .first()
    )
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="資産が見つかりません"
        )

    provided = asset_update.model_fields_set
    if "name" in provided:
        asset.name = asset_update.name
    if "type" in provided:
        asset.type = asset_update.type
    if "balance" in provided:
        asset.balance = asset_update.balance

    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/{asset_id}")
def delete_asset(
    asset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an asset"""
    asset = (
        db.query(Asset)
        .filter(Asset.id == asset_id, Asset.user_id == current_user.id)
        .first()
    )
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="資産が見つかりません"
        )

    # Clear references in payment methods
    db.query(PaymentMethod).filter(
        PaymentMethod.asset_id == asset_id,
        PaymentMethod.user_id == current_user.id,
    ).update({"asset_id": None})

    # Clear references in transactions
    db.query(Transaction).filter(
        Transaction.asset_id == asset_id,
        Transaction.user_id == current_user.id,
    ).update({"asset_id": None})

    db.delete(asset)
    db.commit()
    return {"message": "資産を削除しました"}


# Helper functions for date calculations


def _days_in_month(year: int, month: int) -> int:
    """Get the number of days in a month"""
    if month == 12:
        return (date(year + 1, 1, 1) - date(year, 12, 1)).days
    return (date(year, month + 1, 1) - date(year, month, 1)).days


def _last_day_of_month(year: int, month: int) -> date:
    """Get the last day of a month"""
    return date(year, month, _days_in_month(year, month))


def _add_month(d: date) -> date:
    """Add one month to a date (returns first day of next month)"""
    if d.month == 12:
        return date(d.year + 1, 1, 1)
    return date(d.year, d.month + 1, 1)


def _subtract_month(d: date) -> date:
    """Subtract one month from a date (returns first day of previous month)"""
    if d.month == 1:
        return date(d.year - 1, 12, 1)
    return date(d.year, d.month - 1, 1)
