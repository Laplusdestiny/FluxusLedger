from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from datetime import date

from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse
from app.db.session import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    skip: int = 0,
    limit: int = 100,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    category_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get transactions for current user"""
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if date_from:
        query = query.filter(Transaction.date >= date_from)
    if date_to:
        query = query.filter(Transaction.date <= date_to)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    
    transactions = query.order_by(Transaction.date.desc()).offset(skip).limit(limit).all()
    return transactions


@router.post("", response_model=TransactionResponse)
def create_transaction(
    transaction_create: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new transaction"""
    db_transaction = Transaction(
        user_id=current_user.id,
        date=transaction_create.date,
        amount=transaction_create.amount,
        type=transaction_create.type,
        category_id=transaction_create.category_id,
        payment_method_id=transaction_create.payment_method_id,
        description=transaction_create.description
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a transaction"""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: UUID,
    transaction_update: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a transaction"""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction_update.date is not None:
        transaction.date = transaction_update.date
    if transaction_update.amount is not None:
        transaction.amount = transaction_update.amount
    if transaction_update.type is not None:
        transaction.type = transaction_update.type
    if transaction_update.category_id is not None:
        transaction.category_id = transaction_update.category_id
    if transaction_update.payment_method_id is not None:
        transaction.payment_method_id = transaction_update.payment_method_id
    if transaction_update.description is not None:
        transaction.description = transaction_update.description
    
    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a transaction"""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted"}
