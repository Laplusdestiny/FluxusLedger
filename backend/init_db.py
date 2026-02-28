#!/usr/bin/env python
"""Initialize database tables and seed default categories for existing users"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.defaults import create_default_categories
from app.db.base import Base
from app.models.category import Category
from app.models.payment_method import PaymentMethod  # noqa: F401 (needed for create_all)
from app.models.transaction import Transaction  # noqa: F401 (needed for create_all)
from app.models.asset import Asset  # noqa: F401 (needed for create_all)
from app.models.user import User

# Create engine and session
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine)


def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Get session
    db = SessionLocal()

    try:
        # Seed default categories for any existing users who have none
        users = db.query(User).all()
        for user in users:
            existing = db.query(Category).filter(Category.user_id == user.id).count()
            if existing == 0:
                create_default_categories(db, user.id)
                print(f"Created default categories for user {user.email}")

        db.commit()
        print("Database initialization complete!")
    except Exception as e:
        db.rollback()
        print(f"Error during initialization: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
