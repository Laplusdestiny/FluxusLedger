# FluxusLedger 家計簿アプリケーション 技術仕様書

- [プロジェクト概要](#プロジェクト概要)
  - [目的](#目的)
  - [デプロイ環境](#デプロイ環境)
  - [対象ユーザー](#対象ユーザー)
- [技術スタック](#技術スタック)
  - [バックエンド](#バックエンド)
  - [フロントエンド](#フロントエンド)
  - [インフラ](#インフラ)
- [システムアーキテクチャ](#システムアーキテクチャ)
- [ディレクトリ構造](#ディレクトリ構造)
- [データベース設計](#データベース設計)
  - [users テーブル](#users-テーブル)
  - [categories テーブル](#categories-テーブル)
  - [transactions テーブル](#transactions-テーブル)
  - [payment\_methods テーブル](#payment_methods-テーブル)
- [API設計](#api設計)
  - [認証](#認証)
  - [取引管理](#取引管理)
  - [分析](#分析)
  - [カテゴリー・支払方法](#カテゴリー支払方法)
  - [エクスポート](#エクスポート)
- [フロントエンド画面構成](#フロントエンド画面構成)
  - [ダッシュボード](#ダッシュボード)
  - [取引管理](#取引管理-1)
  - [分析画面](#分析画面)
  - [設定](#設定)
- [Docker Compose構成](#docker-compose構成)
- [環境変数 (.env)](#環境変数-env)
- [レスポンシブ要件](#レスポンシブ要件)
- [MVPスコープ（Phase 1）](#mvpスコープphase-1)
- [ブランディング](#ブランディング)
- [開発手順](#開発手順)
- [今後の拡張](#今後の拡張)

## プロジェクト概要

### 目的

**FluxusLedger** - ラテン語「Fluxus（流れ）」に由来する次世代家計簿。  
Docker + FastAPI + React + PostgreSQL + Plotlyで、お金の流れを数学的に記録・分析し、財務状況の完全把握を実現。

### デプロイ環境

- **主環境**: ローカルDocker環境
- **副環境**: クラウド環境（AWS/Cloudflare等）対応

### 対象ユーザー

- マルチユーザー対応（家族・複数人利用想定）
- JWT認証による個別アカウント管理

## 技術スタック

### バックエンド

- **言語**: Python 3.11+
- **フレームワーク**: FastAPI
- **ORM**: SQLAlchemy 2.0+
- **データベース**: PostgreSQL 15+
- **認証**: JWT
- **バリデーション**: Pydantic
- **マイグレーション**: Alembic

### フロントエンド

- **言語**: TypeScript
- **フレームワーク**: React 18+
- **状態管理**: React Context API / Redux Toolkit
- **UIライブラリ**: Material-UI (MUI)
- **データ可視化**: Plotly.js (react-plotly.js)
- **HTTPクライアント**: Axios
- **フォーム管理**: React Hook Form
- **ルーティング**: React Router v6

### インフラ

- **コンテナ**: Docker, Docker Compose
- **Webサーバー**: Nginx
- **データ永続化**: Docker Volume

## システムアーキテクチャ

```
Browser (Mobile/PC)
       ↓ HTTPS
    ┌─────────────────┐
    │   Nginx (80)    │ ← fluxusledger-nginx
    └───────┬─────────┘
            │
    ┌───────▼──────┐ ┌──────────────┐
    │ Frontend     │ │ Backend       │ ← fluxusledger-frontend
    │ React(3000)  │ │ FastAPI(8000) │ ← fluxusledger-backend
    └──────────────┘ └──────┬──────┘
                           │
                    ┌───────▼──────┐
                    │ PostgreSQL   │ ← fluxusledger-db
                    │ (5432)       │
                    └──────────────┘
```

## ディレクトリ構造

```
fluxusledger/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── app/
│   │   ├── models/ (user.py, transaction.py, category.py, payment_method.py, budget.py)
│   │   ├── schemas/
│   │   ├── api/endpoints/ (auth.py, transactions.py, categories.py, analytics.py, export.py)
│   │   └── core/
├── frontend/
│   ├── src/
│   │   ├── components/Dashboard/, Transactions/, Analytics/, Categories/
│   │   ├── hooks/
│   │   └── services/
└── nginx/
```

## データベース設計

### users テーブル

| カラム          | 型           | 制約         | 説明           |
| --------------- | ------------ | ------------ | -------------- |
| id              | UUID         | PK           | ユーザーID     |
| email           | VARCHAR(255) | UNIQUE       | メールアドレス |
| hashed_password | VARCHAR(255) | NOT NULL     | パスワード     |
| is_active       | BOOLEAN      | DEFAULT true | 有効フラグ     |

### categories テーブル

| カラム  | 型                       | 制約     | 説明         |
| ------- | ------------------------ | -------- | ------------ |
| id      | UUID                     | PK       | カテゴリーID |
| user_id | UUID                     | FK       | ユーザーID   |
| name    | VARCHAR(100)             | NOT NULL | カテゴリー名 |
| type    | ENUM('income','expense') |          | 収支タイプ   |
| color   | VARCHAR(7)               |          | HEXカラー    |

**デフォルトカテゴリー**: 食費、交通費、娯楽費、光熱費、給与など

### transactions テーブル

| カラム            | 型                       | 制約     | 説明       |
| ----------------- | ------------------------ | -------- | ---------- |
| id                | UUID                     | PK       | 取引ID     |
| user_id           | UUID                     | FK       | ユーザーID |
| date              | DATE                     | NOT NULL | 取引日     |
| amount            | DECIMAL(15,2)            | NOT NULL | 金額       |
| type              | ENUM('income','expense') |          | 収支タイプ |
| category_id       | UUID                     | FK       | カテゴリー |
| payment_method_id | UUID                     | FK       | 支払方法   |
| description       | TEXT                     |          | メモ       |

### payment_methods テーブル

| カラム  | 型                             | 制約      | 説明       |
| ------- | ------------------------------ | --------- | ---------- |
| id      | UUID                           | PK        | 支払方法ID |
| user_id | UUID                           | FK        | ユーザーID |
| name    | VARCHAR(100)                   |           | 名称       |
| type    | ENUM('cash','credit_card',...) |           | タイプ     |
| balance | DECIMAL(15,2)                  | DEFAULT 0 | 残高       |

## API設計

### 認証

```
POST /api/auth/register
POST /api/auth/login  
GET /api/auth/me
```

### 取引管理

```
GET    /api/transactions?page=1&date_from=2026-01-01
POST   /api/transactions
GET    /api/transactions/{id}
PUT    /api/transactions/{id}
DELETE /api/transactions/{id}
POST   /api/transactions/bulk  # 一括登録
```

### 分析

```
GET /api/analytics/summary?year=2026&month=2
GET /api/analytics/trends?date_from=2026-01-01&date_to=2026-02-28
GET /api/analytics/budget-comparison?year=2026&month=2
```

### カテゴリー・支払方法

```
GET/POST/PUT/DELETE /api/categories
GET/POST/PUT/DELETE /api/payment-methods
```

### エクスポート

```
GET /api/export/transactions?format=csv
GET /api/export/full-backup  # ZIP形式
```

## フロントエンド画面構成

### ダッシュボード

- 今月収支サマリー
- カテゴリー別円グラフ（Plotly）
- 最近10件の取引リスト
- 予算達成率

### 取引管理

- 取引一覧（フィルタ・ページネーション）
- 取引登録フォーム
- 一括CSVアップロード
- 編集・削除モーダル

### 分析画面

- **月次分析**: 円グラフ、棒グラフ
- **トレンド**: 折れ線グラフ（複数月比較）
- **予算比較**: 横棒グラフ
- **定期支払予測**: テーブル＋グラフ

### 設定

- カテゴリー管理
- 支払方法・残高管理
- 予算設定
- データエクスポート

## Docker Compose構成

```yaml
version: '3.8'
services:
  fluxusledger-db:
    image: postgres:15-alpine
    container_name: fluxusledger-db
    environment:
      POSTGRES_DB: fluxusledger_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - fluxusledger_db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  fluxusledger-backend:
    build: ./backend
    container_name: fluxusledger-backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@fluxusledger-db:5432/fluxusledger_db
    depends_on:
      - fluxusledger-db

  fluxusledger-frontend:
    build: ./frontend
    container_name: fluxusledger-frontend
    ports:
      - "3000:3000"
    depends_on:
      - fluxusledger-backend

volumes:
  fluxusledger_db_data:
```

## 環境変数 (.env)

```env
DB_USER=fluxusledger_user
DB_PASSWORD=strong_password_123
SECRET_KEY=your-32-char-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60
VITE_API_URL=http://localhost:8000
```

## レスポンシブ要件

- **モバイル**: ハンバーガーメニュー、カードUI
- **タブレット**: 2カラムレイアウト
- **PC**: サイドバー＋3カラム

## MVPスコープ（Phase 1）

- ✅ 認証（登録・ログイン）
- ✅ 取引CRUD＋一括登録
- ✅ カテゴリー管理（デフォルト＋カスタム）
- ✅ 月次サマリー＋基本グラフ
- ✅ CSVエクスポート
- ✅ Docker Compose一括起動
- ✅ レスポンシブ対応

## ブランディング

```
サービス名: FluxusLedger
語源: Fluxus（ラテン語: 流れ）+ Ledger（台帳）
タグライン: "Curre Pecuniam, Domina Fluxum"
カラー:
- Primary: #1E3A8A (Indigo)
- Secondary: #F59E0B (Amber)
- Accent: #10B981 (Emerald)
```

## 開発手順

```bash
# 1. リポジトリ作成
git clone <repo>
cd fluxusledger

# 2. 環境設定
cp .env.example .env
# .env編集

# 3. 起動
docker-compose up --build

# 4. アクセス
Frontend: http://localhost:3000
API Docs: http://localhost:8000/docs
Database: localhost:5432
```

## 今後の拡張

- **Phase 2**: 予算管理、トレンド分析
- **Phase 3**: 画像アップロード、PWA化
- **将来的**: 銀行API連携、AI分析
