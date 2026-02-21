#!/bin/bash

# スクリプトがエラーで停止するようにする
set -e

echo "FluxusLedger を起動しています..."
echo ""

# .envファイルのコピー
if [ ! -f .env ]; then
    echo ".env ファイルを作成しています..."
    cp .env.example .env
    echo ".env ファイルを作成しました。"
    echo ""
    echo "注意事項:"
    echo "  - 本番環境では SECRET_KEY を安全な値に変更してください。"
    echo "  - ホスト側でポートが既に使われている場合は、.env ファイルで以下を編集:"
    echo "    - BACKEND_PORT (デフォルト: 8000)"
    echo "    - FRONTEND_PORT (デフォルト: 3000)"
    echo "    - DB_PORT (デフォルト: 5432)"
    echo "    - NGINX_PORT (デフォルト: 80)"
    echo "    - NGINX_HTTPS_PORT (デフォルト: 443)"
    echo "    - API_URL (フロントエンドがバックエンドにアクセスするURL)"
    echo ""
fi

# .env ファイルから ポート情報を読み込む
if [ -f .env ]; then
    export $(grep -E '^(BACKEND_PORT|FRONTEND_PORT|DB_PORT|NGINX_PORT|NGINX_HTTPS_PORT|API_URL)=' .env | xargs)
fi

# デフォルト値の設定
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
DB_PORT=${DB_PORT:-5432}
NGINX_PORT=${NGINX_PORT:-80}
API_URL=${API_URL:-http://localhost:8000}

# Docker Compose で起動
echo "Docker コンテナを起動しています..."
echo "  - Backend: http://localhost:${BACKEND_PORT}"
echo "  - Frontend: http://localhost:${FRONTEND_PORT}"
echo "  - Database: localhost:${DB_PORT}"
echo "  - Nginx: http://localhost:${NGINX_PORT}"
echo ""

sudo docker compose up --build

echo ""
echo "FluxusLedger が起動しました！"
echo ""
echo "アクセス URL:"
echo "  Frontend:  http://localhost:${FRONTEND_PORT}"
echo "  API Docs:  http://localhost:${BACKEND_PORT}/docs"
echo "  Nginx:     http://localhost:${NGINX_PORT}"
echo "  API URL:   ${API_URL}"
echo ""
