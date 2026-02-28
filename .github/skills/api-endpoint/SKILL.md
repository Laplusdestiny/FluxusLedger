---
name: api-endpoint
description: FluxusLedgerバックエンドに新しいAPIエンドポイントを追加する手順。SQLAlchemy Model → Pydantic Schema → FastAPI Endpoint → Router登録 → init_db.pyのimport追加まで。
---

# APIエンドポイント追加スキル

FluxusLedgerのバックエンド（FastAPI + SQLAlchemy + Pydantic v2）に新しいリソースのCRUDエンドポイントを追加する手順。

## 前提

- パッケージはDockerコンテナ内にインストールされているため、ローカルのLSPでimportエラーが出ても問題ない
- マイグレーションツールは使わない。`stop.sh`（`docker compose down -v`）でDB volumeが消え、再起動時に`Base.metadata.create_all()`で再作成される
- UIテキスト・エラーメッセージ・コメントはすべて**日本語**で記述する

## ステップ 1: SQLAlchemy Model 作成

**ファイル**: `backend/app/models/<resource>.py`

```python
import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from decimal import Decimal

from app.db.base import Base


class NewResource(Base):
    """リソースの説明（日本語）"""

    __tablename__ = "<resource_plural>"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    # 金額には Numeric(15, 2) を使用
    amount = Column(Numeric(15, 2), nullable=False, default=Decimal("0"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### ルール

- 主キーは常に `UUID(as_uuid=True)` + `default=uuid.uuid4`
- `user_id` は `ForeignKey("users.id")` で必須
- 金額フィールドには `Numeric(15, 2)` を使う（`Float` は使わない）
- 日付には `Date`、日時には `DateTime` を使用
- 文字列フィールドには適切な長さ制限の `String(N)` を指定

## ステップ 2: Pydantic Schema 作成

**ファイル**: `backend/app/schemas/<resource>.py`

命名規則: `ModelCreate`, `ModelUpdate`, `ModelResponse`

```python
from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class NewResourceCreate(BaseModel):
    """作成用スキーマ"""

    name: str
    amount: Decimal = Decimal("0")

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("名前は必須です")
        if len(v) > 100:
            raise ValueError("名前は100文字以内で入力してください")
        return v


class NewResourceUpdate(BaseModel):
    """更新用スキーマ — 全フィールドOptional"""

    name: Optional[str] = None
    amount: Optional[Decimal] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("名前は必須です")
            if len(v) > 100:
                raise ValueError("名前は100文字以内で入力してください")
        return v


class NewResourceResponse(BaseModel):
    """レスポンス用スキーマ"""

    id: UUID
    name: str
    amount: Decimal
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
```

### ルール

- `Create` にはデフォルト値を持たない必須フィールドを含める
- `Update` は全フィールドを `Optional` にする
- `Response` には `Config.from_attributes = True` を必ず設定（ORMオブジェクトからの変換用）
- バリデーションエラーメッセージは日本語

## ステップ 3: APIエンドポイント作成

**ファイル**: `backend/app/api/endpoints/<resource>.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.models.<resource> import NewResource
from app.models.user import User
from app.schemas.<resource> import (
    NewResourceCreate,
    NewResourceUpdate,
    NewResourceResponse,
)
from app.db.session import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/<resource-plural>", tags=["<resource-plural>"])


@router.get("", response_model=List[NewResourceResponse])
def get_resources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """一覧取得"""
    resources = (
        db.query(NewResource)
        .filter(NewResource.user_id == current_user.id)
        .order_by(NewResource.created_at)
        .all()
    )
    return resources


@router.post("", response_model=NewResourceResponse)
def create_resource(
    resource_create: NewResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """新規作成"""
    db_resource = NewResource(
        user_id=current_user.id,
        name=resource_create.name,
        amount=resource_create.amount,
    )
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource


@router.get("/{resource_id}", response_model=NewResourceResponse)
def get_resource(
    resource_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """個別取得"""
    resource = (
        db.query(NewResource)
        .filter(NewResource.id == resource_id, NewResource.user_id == current_user.id)
        .first()
    )
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="リソースが見つかりません"
        )
    return resource


@router.put("/{resource_id}", response_model=NewResourceResponse)
def update_resource(
    resource_id: UUID,
    resource_update: NewResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新"""
    resource = (
        db.query(NewResource)
        .filter(NewResource.id == resource_id, NewResource.user_id == current_user.id)
        .first()
    )
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="リソースが見つかりません"
        )

    provided = resource_update.model_fields_set
    if "name" in provided:
        resource.name = resource_update.name
    if "amount" in provided:
        resource.amount = resource_update.amount

    db.commit()
    db.refresh(resource)
    return resource


@router.delete("/{resource_id}")
def delete_resource(
    resource_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """削除"""
    resource = (
        db.query(NewResource)
        .filter(NewResource.id == resource_id, NewResource.user_id == current_user.id)
        .first()
    )
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="リソースが見つかりません"
        )

    db.delete(resource)
    db.commit()
    return {"message": "リソースを削除しました"}
```

### ルール

- routerのprefixは `/api/<リソース名の複数形>` とする（ケバブケース）
- 全エンドポイントで `get_current_user` 依存を使い、`user_id` でフィルタする
- 一覧取得は `order_by` を必ず付ける（PostgreSQLの順序は保証されない）
- 更新時は `model_fields_set` で提供されたフィールドのみ更新する
- 削除時に他テーブルのFK参照があれば、先に参照をクリア（NULLに設定）してから削除する
- HTTPエラーメッセージは日本語

## ステップ 4: Router登録

**ファイル**: `backend/main.py`

```python
# import追加
from app.api.endpoints import <resource>

# include_router追加
app.include_router(<resource>.router)
```

## ステップ 5: init_db.py にモデルimport追加

**ファイル**: `backend/init_db.py`

```python
from app.models.<resource> import NewResource  # noqa: F401 (needed for create_all)
```

`create_all` がテーブルを認識するために、モデルのimportが必要。

## ステップ 6: 動作確認

1. `./stop.sh` でコンテナとDBボリュームを停止・削除
2. `./start.sh --dev` で再起動
3. `http://localhost:8000/docs` でSwagger UIを開き、新しいエンドポイントが表示されることを確認
4. 各CRUDエンドポイントを実際にテスト

## チェックリスト

- [ ] Model: UUID主キー、user_id FK、適切なカラム型
- [ ] Schema: Create / Update / Response の3つ、`from_attributes = True`
- [ ] Endpoint: CRUD 5エンドポイント、認証付き、order_by あり
- [ ] `backend/main.py` にrouter登録
- [ ] `backend/init_db.py` にmodel import追加
- [ ] 全メッセージが日本語
- [ ] `./stop.sh && ./start.sh --dev` で起動確認
