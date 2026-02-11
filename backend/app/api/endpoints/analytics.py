from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from typing import List, Optional
from decimal import Decimal
from datetime import date

from app.models.transaction import Transaction, TransactionType
from app.models.category import Category
from app.models.budget import Budget
from app.models.user import User
from app.db.session import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary")
def get_summary(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get monthly summary"""
    # Get all transactions for the month
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        func.extract('year', Transaction.date) == year,
        func.extract('month', Transaction.date) == month
    ).all()
    
    income = Decimal(0)
    expense = Decimal(0)
    
    for txn in transactions:
        if txn.type == TransactionType.INCOME:
            income += txn.amount
        else:
            expense += txn.amount
    
    balance = income - expense
    
    return {
        "income": str(income),
        "expense": str(expense),
        "balance": str(balance)
    }


@router.get("/category-breakdown")
def get_category_breakdown(
    year: int,
    month: int,
    transaction_type: str = "expense",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get category breakdown"""
    # Get transactions by category
    transactions = db.query(
        Transaction.category_id,
        Category.name,
        func.sum(Transaction.amount).label('total')
    ).join(
        Category, Transaction.category_id == Category.id
    ).filter(
        Transaction.user_id == current_user.id,
        func.extract('year', Transaction.date) == year,
        func.extract('month', Transaction.date) == month,
        Transaction.type == transaction_type
    ).group_by(Transaction.category_id, Category.name).all()
    
    # Calculate percentages
    total_amount = sum(t.total for t in transactions)
    
    result = []
    for txn in transactions:
        percentage = (float(txn.total) / float(total_amount) * 100) if total_amount > 0 else 0
        result.append({
            "category_id": str(txn.category_id),
            "category_name": txn.name,
            "amount": str(txn.total),
            "percentage": round(percentage, 2)
        })
    
    return result


@router.get("/budget-comparison")
def get_budget_comparison(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get budget vs actual comparison"""
    # Get budgets for the month
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.year == str(year),
        Budget.month == f"{month:02d}"
    ).all()
    
    result = []
    for budget in budgets:
        # Get actual spending for this category
        actual = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.category_id == budget.category_id,
            func.extract('year', Transaction.date) == year,
            func.extract('month', Transaction.date) == month,
            Transaction.type == 'expense'
        ).scalar() or Decimal(0)
        
        category = db.query(Category).filter(Category.id == budget.category_id).first()
        
        result.append({
            "category_id": str(budget.category_id),
            "category_name": category.name if category else "Unknown",
            "budget": str(budget.amount),
            "actual": str(actual),
            "remaining": str(budget.amount - actual),
            "percentage": round((float(actual) / float(budget.amount) * 100) if budget.amount > 0 else 0, 2)
        })
    
    return result
