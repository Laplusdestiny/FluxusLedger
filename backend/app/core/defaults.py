"""Default categories created for new users"""

from sqlalchemy.orm import Session
from uuid import UUID

from app.models.category import Category, TransactionType


# (name, type, color)
DEFAULT_CATEGORIES = [
    # 支出カテゴリー
    ("食費", TransactionType.EXPENSE, "#EF4444"),
    ("交通費", TransactionType.EXPENSE, "#3B82F6"),
    ("娯楽費", TransactionType.EXPENSE, "#A855F7"),
    ("光熱費", TransactionType.EXPENSE, "#F97316"),
    # 収入カテゴリー
    ("給与", TransactionType.INCOME, "#10B981"),
    ("賞与", TransactionType.INCOME, "#059669"),
    ("副業", TransactionType.INCOME, "#34D399"),
    ("投資収益", TransactionType.INCOME, "#0EA5E9"),
    ("年金", TransactionType.INCOME, "#8B5CF6"),
    ("お祝い・贈与", TransactionType.INCOME, "#F59E0B"),
    ("雑収入", TransactionType.INCOME, "#6B7280"),
]


def create_default_categories(db: Session, user_id: UUID) -> list[Category]:
    """Create default categories for a newly registered user.

    Args:
        db: Database session (caller is responsible for commit).
        user_id: The ID of the user to create categories for.

    Returns:
        List of created Category instances.
    """
    categories = []
    for name, tx_type, color in DEFAULT_CATEGORIES:
        category = Category(
            user_id=user_id,
            name=name,
            type=tx_type,
            color=color,
        )
        db.add(category)
        categories.append(category)
    return categories
