#!/bin/bash

# スクリプトがエラーで停止するようにする
set -e

echo "FluxusLedger を起動しています..."

# .envファイルのコピー
if [ ! -f .env ]; then
    echo ".env ファイルを作成しています..."
    cp .env.example .env
    echo ".env ファイルを作成しました。必要に応じて編集してください。"
    echo ""
    echo "注意: 本番環境では SECRET_KEY を安全な値に変更してください。"
fi

# Docker Compose で起動
echo "Docker コンテナを起動しています..."
sudo docker compose up --build

echo ""
echo "FluxusLedger が起動しました！"
echo ""
echo "アクセス URL:"
echo "  Frontend:  http://localhost:3000"
echo "  API Docs:  http://localhost:8000/docs"
echo "  Nginx:     http://localhost"
echo ""
