#!/usr/bin/env python
"""Initialize default categories and payment methods"""

import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

from app.core.config import settings
from app.db.base import Base
from app.models.category import Category, TransactionType
from app.models.payment_method import PaymentMethod, PaymentMethodType

# Create engine and session
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine)


def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Get session
    db = SessionLocal()
    
    # Default categories for each user - we'll create sample ones
    # Note: In production, these would be created per user on first login
    
    print("Database initialization complete!")
    db.close()


if __name__ == "__main__":
    init_db()
