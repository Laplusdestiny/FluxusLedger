---
name: fullstack-feature
description: FluxusLedgerにバックエンドからフロントエンドまで一気通貫で新機能を実装するためのチェックリストと手順。Model → Schema → Endpoint → Router → Type → Service → Page → Routing → Navigation。
---

# フルスタック機能追加スキル

FluxusLedgerに新しい機能をバックエンドからフロントエンドまで一気通貫で実装する手順。

## 前提

- UIテキスト・エラーメッセージ・コメントはすべて**日本語**
- マイグレーションは不要。`stop.sh` → `start.sh --dev` でDBが再作成される
- パッケージはDockerコンテナ内にあるため、ローカルのimportエラーは無視してよい

## 実装順序

以下の順序で実装することを推奨する。バックエンドを先に完成させてから、フロントエンドに進む。

### Phase 1: バックエンド

#### 1.1 SQLAlchemy Model

**ファイル**: `backend/app/models/<resource>.py`

- UUID主キー（`UUID(as_uuid=True)`, `default=uuid.uuid4`）
- `user_id` を `ForeignKey("users.id")` で必ず持つ
- 金額は `Numeric(15, 2)` + `Decimal`
- `created_at` / `updated_at` カラムを含める
- `Base` を `app.db.base` からインポート

#### 1.2 Pydantic Schema

**ファイル**: `backend/app/schemas/<resource>.py`

- 3スキーマ: `ResourceCreate`, `ResourceUpdate`, `ResourceResponse`
- `Create`: 必須フィールド + バリデータ（日本語エラーメッセージ）
- `Update`: 全フィールド `Optional`
- `Response`: `Config.from_attributes = True` 必須

#### 1.3 APIエンドポイント

**ファイル**: `backend/app/api/endpoints/<resource>.py`

- `router = APIRouter(prefix="/api/<resource-plural>", tags=["<resource-plural>"])`
- 基本CRUD: `GET`（一覧）, `POST`（作成）, `GET/{id}`（個別）, `PUT/{id}`（更新）, `DELETE/{id}`（削除）
- 全エンドポイントで `Depends(get_current_user)` + `Depends(get_db)` を使用
- 一覧取得は `order_by` 必須
- 更新は `model_fields_set` で変更されたフィールドのみ適用
- 他テーブルへのFK参照がある場合、削除時に参照をクリア

#### 1.4 Router登録

**ファイル**: `backend/main.py`

```python
from app.api.endpoints import <resource>
app.include_router(<resource>.router)
```

#### 1.5 init_db.py にimport追加

**ファイル**: `backend/init_db.py`

```python
from app.models.<resource> import Resource  # noqa: F401 (needed for create_all)
```

### Phase 2: フロントエンド

#### 2.1 TypeScript型定義

**ファイル**: `frontend/src/types/index.ts`

- バックエンドの `Response` スキーマに対応するinterface
- `Decimal` → `string`, `UUID` → `string`

#### 2.2 APIサービス

**ファイル**: `frontend/src/services/<resource>Service.ts`

- `api` を `./api` からインポート
- CRUD操作をメソッドとして定義
- 戻り値の型を明示

#### 2.3 ページコンポーネント

**ファイル**: `frontend/src/pages/<Resource>.tsx`

- MUIコンポーネントでUI構築
- ナビゲーションリンク（全ページ共通パターン）を含める
- CRUD操作のダイアログ
- エラーハンドリング（422の配列detail対応）
- 金額表示: `Number(value).toLocaleString() + '円'`

#### 2.4 ルーティング

**ファイル**: `frontend/src/App.tsx`

- import追加 + `<Route>` 追加（`ProtectedRoute` 内）

#### 2.5 ナビゲーション更新

以下の**全ページ**のナビゲーションに新ページへのリンクを追加:

- `Dashboard.tsx`, `Transactions.tsx`, `Assets.tsx`, `Analytics.tsx`, `Categories.tsx`, `Settings.tsx`
- 新しいページ自身にも他の全ページへのリンクを含める

### Phase 3: 動作確認

1. `./stop.sh` でコンテナとDBボリュームを削除
2. `./start.sh --dev` でローカルビルド＋起動
3. `http://localhost:8000/docs` でAPIエンドポイントを確認
4. `http://localhost:3000` でフロントエンドを確認
5. CRUD操作を実際にテスト
6. 全ページのナビゲーションから新ページにアクセスできること

## 既存リソース間の関連

新機能が既存リソースと関連する場合、以下を考慮する:

### 他モデルへのFK追加

既存モデルに新しいFKカラムを追加する場合:
1. モデルファイルに `Column(UUID(as_uuid=True), ForeignKey("<table>.id"), nullable=True)` を追加
2. 対応するスキーマの Create/Update/Response にフィールドを追加
3. 既存エンドポイントの create/update ロジックを修正

### 残高・集計ロジック

金額に影響する操作（取引作成・更新・削除）がある場合:
- 作成時: 順方向の影響を適用
- 削除時: 逆方向の影響を適用
- 更新時: 古い影響を逆適用 → 新しい影響を順適用

参考実装: `backend/app/api/endpoints/transactions.py` の `apply_transaction_to_balance()` 関数

## 完全チェックリスト

### バックエンド
- [ ] `backend/app/models/<resource>.py` — Model作成
- [ ] `backend/app/schemas/<resource>.py` — Schema作成（Create/Update/Response）
- [ ] `backend/app/api/endpoints/<resource>.py` — Endpoint作成（CRUD）
- [ ] `backend/main.py` — Router登録
- [ ] `backend/init_db.py` — Model import追加

### フロントエンド
- [ ] `frontend/src/types/index.ts` — 型定義追加
- [ ] `frontend/src/services/<resource>Service.ts` — APIサービス作成
- [ ] `frontend/src/pages/<Resource>.tsx` — ページ作成
- [ ] `frontend/src/App.tsx` — ルート追加
- [ ] 全ページのナビゲーション更新

### 検証
- [ ] `./stop.sh && ./start.sh --dev` で起動
- [ ] Swagger UI (`/docs`) でAPI確認
- [ ] フロントエンドでCRUD操作確認
- [ ] ナビゲーション動作確認
- [ ] 全テキストが日本語であること
