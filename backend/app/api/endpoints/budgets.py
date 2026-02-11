from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.models.budget import Budget
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse
from app.db.session import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


@router.get("", response_model=List[BudgetResponse])
def get_budgets(
    year: Optional[str] = None,
    month: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get budgets for current user"""
    query = db.query(Budget).filter(Budget.user_id == current_user.id)
    
    if year:
        query = query.filter(Budget.year == year)
    if month:
        query = query.filter(Budget.month == month)
    
    budgets = query.all()
    return budgets


@router.post("", response_model=BudgetResponse)
def create_budget(
    budget_create: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new budget"""
    # Check if budget already exists
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id == budget_create.category_id,
        Budget.year == budget_create.year,
        Budget.month == budget_create.month
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget already exists for this category and month"
        )
    
    db_budget = Budget(
        user_id=current_user.id,
        category_id=budget_create.category_id,
        amount=budget_create.amount,
        year=budget_create.year,
        month=budget_create.month
    )
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(
    budget_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a budget"""
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    return budget


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: UUID,
    budget_update: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a budget"""
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    if budget_update.amount is not None:
        budget.amount = budget_update.amount
    
    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a budget"""
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    db.delete(budget)
    db.commit()
    return {"message": "Budget deleted"}
