from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.models.payment_method import PaymentMethod
from app.models.user import User
from app.schemas.payment_method import PaymentMethodCreate, PaymentMethodUpdate, PaymentMethodResponse
from app.db.session import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/payment-methods", tags=["payment-methods"])


@router.get("", response_model=List[PaymentMethodResponse])
def get_payment_methods(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all payment methods for current user"""
    methods = db.query(PaymentMethod).filter(PaymentMethod.user_id == current_user.id).all()
    return methods


@router.post("", response_model=PaymentMethodResponse)
def create_payment_method(method_create: PaymentMethodCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new payment method"""
    db_method = PaymentMethod(
        user_id=current_user.id,
        name=method_create.name,
        type=method_create.type
    )
    db.add(db_method)
    db.commit()
    db.refresh(db_method)
    return db_method


@router.get("/{method_id}", response_model=PaymentMethodResponse)
def get_payment_method(method_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get a payment method"""
    method = db.query(PaymentMethod).filter(
        PaymentMethod.id == method_id,
        PaymentMethod.user_id == current_user.id
    ).first()
    
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    return method


@router.put("/{method_id}", response_model=PaymentMethodResponse)
def update_payment_method(method_id: UUID, method_update: PaymentMethodUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update a payment method"""
    method = db.query(PaymentMethod).filter(
        PaymentMethod.id == method_id,
        PaymentMethod.user_id == current_user.id
    ).first()
    
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    if method_update.name is not None:
        method.name = method_update.name
    if method_update.type is not None:
        method.type = method_update.type
    
    db.commit()
    db.refresh(method)
    return method


@router.delete("/{method_id}")
def delete_payment_method(method_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a payment method"""
    method = db.query(PaymentMethod).filter(
        PaymentMethod.id == method_id,
        PaymentMethod.user_id == current_user.id
    ).first()
    
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )
    
    db.delete(method)
    db.commit()
    return {"message": "Payment method deleted"}
