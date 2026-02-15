# FluxusLedger - 次世代家計簿アプリケーション

本リポジトリは、技術仕様書に基づいて実装された家計簿アプリケーションです。

## 📋 プロジェクト構成

```
FluxusLedger/
├── backend/                 # FastAPI バックエンド
│   ├── app/
│   │   ├── models/         # SQLAlchemy モデル
│   │   ├── schemas/        # Pydantic スキーマ
│   │   ├── api/endpoints/  # APIエンドポイント
│   │   ├── core/           # セキュリティ・設定
│   │   └── db/             # データベース設定
│   ├── main.py             # FastAPI アプリケーション
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # React フロントエンド
│   ├── src/
│   │   ├── pages/          # ページコンポーネント
│   │   ├── components/     # UI コンポーネント
│   │   ├── services/       # API サービス
│   │   ├── types/          # TypeScript 型定義
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── nginx/                   # Nginx リバースプロキシ
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
├── start.sh                 # 起動スクリプト
└── stop.sh                  # 停止スクリプト
```

## 🚀 クイックスタート

### 要件

- Docker
- Docker Compose

### 起動方法

```bash
# リポジトリをクローン
git clone <repo-url>
cd FluxusLedger

# 起動 (自動的に .env ファイルを作成)
bash start.sh

# または直接 Docker Compose を実行
docker-compose up --build
```

### アクセス URL

- **フロントエンド**: http://localhost:3000
- **API ドキュメント**: http://localhost:8000/docs
- **Nginx（ポート80）**: http://localhost

### ログイン

初期ユーザーは自動作成されません。アプリケーション内の「登録」から新しいアカウントを作成してください。

## 🛑 停止方法

```bash
bash stop.sh
```

## 📚 主な機能（MVP - Phase 1）

### ✅ 認証・基本機能
- ユーザー登録・ログイン（JWT認証）
- パスワードハッシュ化

### ✅ 取引管理
- 収支の登録・編集・削除
- カテゴリー・支払方法による分類
- 月別フィルター

### ✅ カテゴリー管理
- カテゴリーの追加・編集・削除
- 色のカスタマイズ
- 収入/支出の種別管理

### ✅ 支払方法管理
- 支払方法の登録・編集・削除
- 現金、クレジットカード等に対応

### ✅ 予算管理
- 月別・カテゴリー別の予算設定
- 予実比較

### ✅ 分析・可視化
- 月次サマリー（収入・支出・残額）
- カテゴリー別支出の円グラフ
- 予算 vs 実績の棒グラフ

### ✅ ダッシュボード
- 今月の収支サマリー
- 最近の取引一覧
- グラフによる支出分析

## 🔧 技術スタック

### バックエンド
- **Python 3.11+** / **FastAPI**
- **SQLAlchemy 2.0** (ORM)
- **PostgreSQL 15** (データベース)
- **JWT** (認証)

### フロントエンド
- **React 18** + **TypeScript**
- **Material-UI (MUI)** (UIライブラリ)
- **Recharts** (グラフ化)
- **React Router** (ルーティング)
- **Axios** (HTTP通信)

### インフラ
- **Docker** / **Docker Compose**
- **Nginx** (リバースプロキシ)

## 📝 環境変数

`.env.example` を参考に `.env` を作成してください：

```env
DB_USER=fluxusledger_user
DB_PASSWORD=strong_password_123
DB_NAME=fluxusledger_db
SECRET_KEY=your-secret-key-here-change-in-production-at-least-32-chars
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

**注意**: 本番環境では `SECRET_KEY` を安全な値に変更してください。

## 📖 API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `GET /api/auth/me` - 現在のユーザー情報

### 取引
- `GET /api/transactions` - 取引一覧（フィルタ対応）
- `POST /api/transactions` - 取引登録
- `PUT /api/transactions/{id}` - 取引更新
- `DELETE /api/transactions/{id}` - 取引削除

### カテゴリー
- `GET /api/categories` - カテゴリー一覧
- `POST /api/categories` - カテゴリー作成
- `PUT /api/categories/{id}` - カテゴリー更新
- `DELETE /api/categories/{id}` - カテゴリー削除

### 支払方法
- `GET /api/payment-methods` - 支払方法一覧
- `POST /api/payment-methods` - 支払方法作成
- `PUT /api/payment-methods/{id}` - 支払方法更新
- `DELETE /api/payment-methods/{id}` - 支払方法削除

### 予算
- `GET /api/budgets` - 予算一覧
- `POST /api/budgets` - 予算作成
- `PUT /api/budgets/{id}` - 予算更新
- `DELETE /api/budgets/{id}` - 予算削除

### 分析
- `GET /api/analytics/summary` - 月次サマリー
- `GET /api/analytics/category-breakdown` - カテゴリー別分析
- `GET /api/analytics/budget-comparison` - 予算比較

## 🎨 ブランディング

- **カラースキーム**:
  - Primary: `#1E3A8A` (Indigo)
  - Secondary: `#F59E0B` (Amber)
  - Success: `#10B981` (Emerald)
  - Error: `#EF4444` (Red)

## 🔐 セキュリティ

- JWT ベースの認証
- パスワードはbcryptで暗号化
- CORS対応

## 📱 レスポンシブ対応

- モバイル: ハンバーガーメニュー・カードUI
- タブレット: 2カラムレイアウト
- PC: サイドバー + マルチカラム

## 🚧 今後の拡張機能（Phase 2+）

- 口座残高管理
- 定期支払の自動計算
- CSV インポート・エクスポート
- 複数ユーザー対応
- 銀行API連携
- AI による分析・予測
- PWA 化
- 画像アップロード機能

## 📞 サポート

問題が発生した場合は、以下をご確認ください：

1. **Docker が起動しているか**: `docker ps` で確認
2. **ポートが開いているか**: `lsof -i :3000` など
3. **ログを確認**: `docker-compose logs -f` で実時間ログ表示
4. **データベースが起動しているか**: `docker ps` で `fluxusledger-db` を確認

## 📄 ライセンス

MIT License

## 📞 お問い合わせ

ご質問やご要望は、Issues で報告してください。
