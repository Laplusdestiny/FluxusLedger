---
name: bug-fix
description: FluxusLedgerのバグ修正ワークフロー。フロントエンドの白画面、APIの422/500エラー、DB不整合などの診断手順と、過去のバグパターンに基づく解決策。
---

# バグ修正スキル

FluxusLedger（FastAPI + React + PostgreSQL）でのバグ診断と修正手順。

## 診断フロー

### ステップ 1: 症状の分類

| 症状 | 確認場所 | 主な原因 |
|---|---|---|
| 白画面 / 画面がクラッシュ | ブラウザ Console | JSXに非文字列を渡した、undefinedアクセス |
| APIリクエストが422 | Network タブ → Response | Pydanticバリデーションエラー |
| APIリクエストが500 | バックエンドログ | Python例外（DB、ロジック） |
| データが表示されない | Network タブ | APIレスポンスが空、フィルタ条件の問題 |
| データの順序がおかしい | SQLクエリ | `order_by` の欠如 |

### ステップ 2: ログ確認

**フロントエンド**:
- ブラウザの DevTools → Console
- ブラウザの DevTools → Network → 問題のリクエストをクリック → Response

**バックエンド**:
```bash
sudo docker compose logs -f fluxusledger-backend
```

**データベース**:
```bash
sudo docker compose exec fluxusledger-db psql -U <user> -d <dbname>
```

### ステップ 3: 原因特定と修正

修正後は必ず以下を確認:
1. 同じ操作で問題が再現しないこと
2. 関連する他の機能が壊れていないこと

## 過去のバグパターンと解決策

### パターン 1: 白画面（422エラーの不適切な表示）

**症状**: 画面が真っ白になる、Consoleに「Objects are not valid as a React child」

**原因**: FastAPIの422バリデーションエラーの `detail` がオブジェクト配列 `[{loc, msg, type}]` であり、これをJSXに直接渡していた。

**修正パターン**:
```tsx
// 悪い例
setError(detail)  // detailがオブジェクト配列の場合クラッシュ

// 良い例
if (Array.isArray(detail)) {
  setError(detail.map((d: { msg?: string }) => d.msg || '').join(', '))
} else if (typeof detail === 'string') {
  setError(detail)
} else {
  setError('エラーが発生しました')
}
```

**注意**: 全ページの全catchブロックでこのパターンを適用する。

### パターン 2: データの順序が不定

**症状**: 同じデータなのにリロードのたびに表示順が変わる

**原因**: PostgreSQLは `ORDER BY` なしの結果順序を保証しない。

**修正**: 一覧取得クエリに `order_by` を追加:
```python
# 修正前
db.query(Model).filter(Model.user_id == current_user.id).all()

# 修正後
db.query(Model).filter(Model.user_id == current_user.id).order_by(Model.created_at).all()
```

### パターン 3: カテゴリフィルタリングの不一致

**症状**: 取引フォームで選択したカテゴリタイプ（income/expense）に無関係なカテゴリが表示される

**原因**: フロントエンドでカテゴリ一覧を取得後、typeでフィルタしていなかった。

**修正**: `categories.filter(c => c.type === selectedType)` をフォームのセレクトボックスに適用。

### パターン 4: デフォルトデータが作成されない

**症状**: 新規ユーザー登録後にカテゴリ等が空

**原因**: ユーザー作成時にデフォルトデータを生成するロジックが無い。

**修正**: `backend/app/core/defaults.py` にデフォルトデータ作成関数を定義し、ユーザー登録エンドポイント内でDB commit後に呼び出す。

### パターン 5: FK参照のあるレコードの削除

**症状**: 削除時に500エラー（IntegrityError）

**原因**: 他テーブルから参照されているレコードを削除しようとした。

**修正**: 削除前に参照をクリア:
```python
# 削除前に参照をNULLに設定
db.query(RelatedModel).filter(
    RelatedModel.foreign_id == target_id,
    RelatedModel.user_id == current_user.id,
).update({"foreign_id": None})

# その後削除
db.delete(target)
db.commit()
```

### パターン 6: Decimal/Number の型不一致

**症状**: フロントで金額が `"123.45"` として表示される（文字列のまま）

**原因**: バックエンドの `Numeric` / `Decimal` はJSONで文字列にシリアライズされる。

**修正**: フロントエンドで表示時に `Number()` で変換:
```tsx
// 表示
{Number(amount).toLocaleString()}円

// フォーム送信
amount: Number(formData.amount)
```

## 修正時の注意事項

1. **同じパターンが他のページにもないか確認する** — 1箇所で見つかったバグは、他のページでも同様のコードがある可能性が高い
2. **エラーメッセージは日本語にする**
3. **修正後、`./stop.sh && ./start.sh --dev` で動作確認する** — DB構造の変更がある場合、ボリューム削除が必要
4. **フロントエンドのlintを実行**: `cd frontend && npm run lint`
