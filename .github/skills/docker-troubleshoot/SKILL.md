---
name: docker-troubleshoot
description: FluxusLedgerのDocker Compose環境のトラブルシューティング。コンテナログの確認、DB初期化、ポート競合の解決、ビルドエラーの対処など。
---

# Docker トラブルシューティングスキル

FluxusLedgerのDocker Compose環境（PostgreSQL + FastAPI + React + Nginx）で発生する問題の診断と解決手順。

## サービス構成

| サービス名 | イメージ | ポート | 役割 |
|---|---|---|---|
| `fluxusledger-db` | `postgres:15-alpine` | 5432 | PostgreSQLデータベース |
| `fluxusledger-backend` | FastAPI (Python 3.11) | 8000 | APIサーバー |
| `fluxusledger-frontend` | React (Node 20) | 3000 | フロントエンドSPA |
| `fluxusledger-nginx` | `nginx:alpine` | 80, 443 | リバースプロキシ |

## 基本コマンド

### 起動・停止

```bash
# フルスタック起動（プロダクションイメージ pull）
./start.sh

# ローカルビルドで起動（開発モード）
./start.sh --dev

# 停止 + DBボリューム削除（完全リセット）
./stop.sh
```

**重要**: `stop.sh` は `docker compose down -v` を実行するため、DBデータが消える。再起動時に `Base.metadata.create_all()` でテーブルが再作成される。

### ログ確認

```bash
# 全サービスのログ
sudo docker compose logs

# 特定サービスのログ（リアルタイム）
sudo docker compose logs -f fluxusledger-backend
sudo docker compose logs -f fluxusledger-frontend
sudo docker compose logs -f fluxusledger-db
sudo docker compose logs -f fluxusledger-nginx

# 最新N行のみ
sudo docker compose logs --tail=50 fluxusledger-backend
```

### コンテナ状態確認

```bash
# 稼働中コンテナ一覧
sudo docker compose ps

# コンテナ内でコマンド実行
sudo docker compose exec fluxusledger-backend bash
sudo docker compose exec fluxusledger-db psql -U <user> -d <dbname>
```

## よくある問題と解決策

### 1. コンテナが起動しない / すぐに停止する

**診断手順**:
```bash
sudo docker compose ps    # STATUSが "Exit" のサービスを確認
sudo docker compose logs fluxusledger-backend  # エラーメッセージを確認
```

**よくある原因**:
- **DB接続エラー**: バックエンドがDBより先に起動しようとした → `docker compose up` を再実行（depends_onで順序制御済み）
- **ポート競合**: `sudo lsof -i :8000` / `sudo lsof -i :3000` / `sudo lsof -i :80` で確認
- **環境変数の不足**: `.env` が存在しない → `.env.example` からコピー

### 2. DB関連の問題

**テーブルが存在しない / カラムが足りない**:
```bash
# 完全リセット（DBボリュームを削除して再作成）
./stop.sh
./start.sh --dev
```

このプロジェクトではマイグレーションを使わない。Modelを変更したら `stop.sh` → `start.sh` でDBを再作成する。

**DBに直接接続して確認**:
```bash
sudo docker compose exec fluxusledger-db psql -U <user> -d <dbname>

# テーブル一覧
\dt

# 特定テーブルの構造
\d <table_name>

# データ確認
SELECT * FROM <table_name> LIMIT 10;
```

環境変数（ユーザー名、DB名）は `.env` または `docker-compose.yml` で確認する。

### 3. フロントエンドの白画面 / ネットワークエラー

**診断手順**:
1. ブラウザの DevTools → Console でJSエラーを確認
2. DevTools → Network タブでAPIリクエストのステータスを確認
3. `sudo docker compose logs fluxusledger-frontend` でビルドエラーを確認

**よくある原因**:
- **VITE_API_URL の設定ミス**: `docker-compose.yml` の `VITE_API_URL` がバックエンドのURLと一致しているか確認
- **CORSエラー**: バックエンドの `CORS_ORIGINS` にフロントエンドのオリジンが含まれているか確認
- **422 Unprocessable Entity**: レスポンスの `detail` がオブジェクト配列で、JSXに直接渡されている可能性。`Array.isArray(detail)` で分岐して文字列に変換する

### 4. Nginxの502 Bad Gateway

**診断手順**:
```bash
sudo docker compose logs fluxusledger-nginx
sudo docker compose ps  # backend/frontendが稼働しているか確認
```

**よくある原因**:
- バックエンドまたはフロントエンドがまだ起動完了していない
- `nginx.conf` の `proxy_pass` 先のホスト名がサービス名と一致していない

**nginx.conf の確認ポイント**:
- `/` → `http://fluxusledger-frontend:3000`
- `/api` → `http://fluxusledger-backend:8000`
- `/docs`, `/openapi.json` → `http://fluxusledger-backend:8000`

### 5. ビルドエラー（--dev モード）

**バックエンド**:
```bash
sudo docker compose logs fluxusledger-backend
```
- `requirements.txt` のパッケージ名・バージョンを確認
- Python構文エラーの場合、ログにトレースバックが表示される

**フロントエンド**:
```bash
sudo docker compose logs fluxusledger-frontend
```
- TypeScriptのコンパイルエラーが表示される
- `package.json` の依存関係を確認

### 6. ポート競合

```bash
# 使用中のポートを確認
sudo lsof -i :80
sudo lsof -i :3000
sudo lsof -i :8000
sudo lsof -i :5432

# 競合プロセスを停止してから再起動
sudo kill <PID>
./start.sh --dev
```

## 完全リセット手順

すべてを初期状態に戻す:

```bash
# 1. コンテナ + ボリューム削除
./stop.sh

# 2. Docker イメージも削除（必要な場合）
sudo docker compose down --rmi all -v

# 3. 再ビルド + 起動
./start.sh --dev
```

## 開発モード vs プロダクションモード

| | `./start.sh` | `./start.sh --dev` |
|---|---|---|
| イメージ | GHCR からpull | ローカルでビルド |
| compose ファイル | `docker-compose.yml` | `docker-compose.yml` + `docker-compose.dev.yml` |
| 用途 | デプロイ確認 | 開発・デバッグ |

コード変更を反映するには `--dev` モードでの再ビルドが必要。
