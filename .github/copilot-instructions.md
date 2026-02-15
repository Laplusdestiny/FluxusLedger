# Copilot / AI エージェント向け指示 — FluxusLedger

## クイックスタート（実行・確認）✅
- フルスタック起動（推奨）:
  - `./start.sh`（内部で `docker compose up --build` を実行） — frontend ⇄ backend ⇄ postgres ⇄ nginx。
  - 起動後: フロントエンド `http://localhost:3000`、APIドキュメント `http://localhost:8000/docs`。
- フロントエンドのみ:
  - `cd frontend && npm run dev`（Vite）
  - `cd frontend && npm run lint`（ESLint）
- バックエンドのみ（開発）:
  - `uvicorn backend.main:app --reload --port 8000`

## アーキテクチャ（概要）🏗️
- 主要サービス:
  - `backend/` — FastAPI + SQLAlchemy + Pydantic（API と DB モデル）
  - `frontend/` — React + TypeScript + Vite（UI）
- Docker Compose で各コンテナを接続（設定: `docker-compose.yml`、リバースプロキシ: `nginx/nginx.conf`）。
- API は `backend/main.py` でマウントされ、エンドポイントは `backend/app/api/endpoints/` に分割。

## コードパターンと慣習🔧
- バックエンド
  - リクエスト/レスポンスは `backend/app/schemas/*` の Pydantic スキーマを使用（例: `transaction.py`）。
  - ORM は `backend/app/models/*`（UUID 主キー、金額は `Numeric`、日付は `Date`）。
  - 認証／依存注入パターン: `backend/app/api/deps.py`（`HTTPBearer` + `decode_token`）。
  - ルーター登録は `backend/main.py` を参照。
- フロントエンド
  - ネットワークは `frontend/src/services/api.ts`（axios）に集約。認可ヘッダーは localStorage の JWT を利用。
  - UI 層は `src/pages`（ビュー）と `src/components`（再利用コンポーネント）に分離。
  - 保護ルートは `frontend/src/components/ProtectedRoute.tsx` を参照。
  - Lint: `npm run lint`（ESLint）

## プロジェクト固有ルール📌
- スキーマ命名: `ModelCreate`, `ModelUpdate`, `ModelResponse` を使う（例: `backend/app/schemas/transaction.py`）。
- ORM → レスポンス変換には Pydantic の `Config.from_attributes = True` を用いる。
- ネットワーク処理は `frontend/src/services/*`、UI ロジックは `src/pages`/`src/components` に保持する。
- 認証フロー: クライアントは JWT を `localStorage` に保存、API は `Authorization: Bearer <token>` を期待（`frontend/src/services/api.ts` を参照）。

## 統合ポイントと環境変数🔗
- `VITE_API_URL`：フロントエンドからバックエンドへのベース URL（`docker-compose.yml` で設定）。
- DB/シークレットは環境変数で管理（`docker-compose.yml` と `.env.example` を参照）。
- OpenAPI ドキュメントは `/docs`（バックエンド変更後の検証に利用）。

## セキュリティ注意事項⚠️
- JWT 認証の重要部分は `backend/app/api/deps.py` と `backend/app/core/security.py`。
- `SECRET_KEY` や DB 資格情報はソースに含めないこと（環境変数／シークレット管理を使用）。

## ビルド／検証のヒント✨
- 変更を検証する手順:
  1. `./start.sh` を実行してフルスタックを起動し、`/docs` と主要ページが表示されることを確認する。
  2. `cd frontend && npm run lint` で型／スタイル違反を検出する。
- 現状、テストスイートは見つかっていません（`package.json` に `test` スクリプト無し、`tests/` フォルダも無し）。

## 参照すべきファイル（例）📂
- `backend/app/schemas/transaction.py` — Pydantic スキーマ例
- `backend/app/models/transaction.py` — SQLAlchemy モデル例
- `backend/app/api/deps.py` — 認証／依存注入パターン
- `backend/main.py` — ルーター登録とアプリ初期化
- `frontend/src/services/api.ts` — axios クライアント（認可ヘッダー）
- `frontend/package.json`, `docker-compose.yml`, `start.sh`, `nginx/nginx.conf`
