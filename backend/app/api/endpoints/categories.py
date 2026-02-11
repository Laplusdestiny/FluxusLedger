from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.db.session import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all categories for current user"""
    categories = db.query(Category).filter(Category.user_id == current_user.id).all()
    return categories


@router.post("", response_model=CategoryResponse)
def create_category(category_create: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new category"""
    db_category = Category(
        user_id=current_user.id,
        name=category_create.name,
        type=category_create.type,
        color=category_create.color
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get a category"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: UUID, category_update: CategoryUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update a category"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    if category_update.name is not None:
        category.name = category_update.name
    if category_update.color is not None:
        category.color = category_update.color
    
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}")
def delete_category(category_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a category"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    db.delete(category)
    db.commit()
    return {"message": "Category deleted"}
