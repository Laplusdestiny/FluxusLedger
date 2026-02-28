---
name: ci-cd-workflow
description: FluxusLedgerのGitHub Actionsワークフローの追加・修正手順。既存のDockerイメージpublishワークフローのパターンに倣った新ワークフローの作成、テストCI、リリースフローの構築。
---

# CI/CD ワークフロースキル

FluxusLedgerのGitHub Actions ワークフローの追加・修正手順。

## 既存のワークフロー

### publish-images.yml（Dockerイメージ公開）

**ファイル**: `.github/workflows/publish-images.yml`

- **トリガー**: `push` to `main`, `release` published, `workflow_dispatch`
- **処理**: backend / frontend のDockerイメージをビルドし、GHCRにpush
- **イメージ**: `ghcr.io/laplusdestiny/fluxusledger-backend`, `ghcr.io/laplusdestiny/fluxusledger-frontend`
- **タグ**: `latest` + リリースタグ or コミットSHA
- **プラットフォーム**: `linux/amd64`

## 新しいワークフローを追加する手順

### ステップ 1: ワークフローファイル作成

**ファイル**: `.github/workflows/<workflow-name>.yml`

```yaml
name: <ワークフロー名>

on:
  # トリガーを定義
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

permissions:
  contents: read

jobs:
  <job-name>:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # 以降にステップを追加
```

### ステップ 2: 用途に応じたテンプレート

#### テスト CI（バックエンド — pytest）

```yaml
name: Backend tests

on:
  push:
    branches: ["main"]
    paths: ["backend/**"]
  pull_request:
    branches: ["main"]
    paths: ["backend/**"]

permissions:
  contents: read

jobs:
  test-backend:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        working-directory: backend
        run: |
          pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-cov httpx

      - name: Run tests
        working-directory: backend
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb
          SECRET_KEY: test-secret-key-for-ci
          CORS_ORIGINS: '["http://localhost:3000"]'
        run: pytest tests/ -v --cov=app
```

#### テスト CI（フロントエンド — Vitest）

```yaml
name: Frontend tests

on:
  push:
    branches: ["main"]
    paths: ["frontend/**"]
  pull_request:
    branches: ["main"]
    paths: ["frontend/**"]

permissions:
  contents: read

jobs:
  test-frontend:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Run lint
        working-directory: frontend
        run: npm run lint

      - name: Run tests
        working-directory: frontend
        env:
          VITE_API_URL: http://localhost:8000
        run: npm test -- --run
```

#### Lint CI

```yaml
name: Lint

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

permissions:
  contents: read

jobs:
  lint-frontend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: ESLint
        working-directory: frontend
        run: npm run lint

  lint-backend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install linters
        run: pip install ruff

      - name: Run ruff
        working-directory: backend
        run: ruff check .
```

## 設計ルール

### トリガー設定

- **`paths` フィルター**を使い、関連ディレクトリの変更時のみ実行する（不要なCI実行を避ける）
- PRとpushの両方でトリガーする場合、ブランチを `["main"]` に限定
- 手動実行が必要な場合は `workflow_dispatch` を追加

### シークレットとパーミッション

- `permissions` は最小限にする（`contents: read` が基本）
- GHCRへのpushが必要な場合のみ `packages: write` を追加
- 環境変数にシークレットを使う場合は `${{ secrets.SECRET_NAME }}`
- `GITHUB_TOKEN` はデフォルトで利用可能

### 既存パターンとの一貫性

- アクションのバージョン: `actions/checkout@v4`, `actions/setup-python@v5`, `actions/setup-node@v4`
- Docker Buildx を使う場合: `docker/setup-buildx-action@v2`, `docker/build-push-action@v4`
- GHCR ログイン: `docker/login-action@v2`

### テスト導入時の注意

現在このプロジェクトにはテストスイートがない。テストCIを追加する場合:

1. まずテストフレームワークを導入する
   - バックエンド: `pytest` + `httpx`（FastAPI TestClient用）
   - フロントエンド: `vitest` + `@testing-library/react`
2. `requirements.txt` / `package.json` に依存関係を追加
3. テストファイルを作成（`backend/tests/`, `frontend/src/**/*.test.tsx`）
4. CIワークフローを追加

## チェックリスト

- [ ] `.github/workflows/<name>.yml` を作成
- [ ] トリガー（on）を適切に設定
- [ ] `permissions` を最小限に設定
- [ ] `paths` フィルターで不要な実行を回避
- [ ] 環境変数・シークレットの設定
- [ ] 既存のアクションバージョンとの一貫性
- [ ] `workflow_dispatch` の追加検討（手動実行用）
