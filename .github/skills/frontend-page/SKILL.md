---
name: frontend-page
description: FluxusLedgerフロントエンドに新しいページを追加する手順。TypeScript型定義 → APIサービス → Reactページ（MUI） → ルーティング → ナビゲーション更新まで。
---

# フロントエンドページ追加スキル

FluxusLedgerのフロントエンド（React + TypeScript + MUI + Vite）に新しいページを追加する手順。

## 前提

- UIテキストはすべて**日本語**
- スタイリングには Material UI（MUI v5）を使用
- API通信は `frontend/src/services/api.ts` のaxiosインスタンスを使用
- 認証トークンはaxiosインターセプターで自動付与される

## ステップ 1: TypeScript型定義の追加

**ファイル**: `frontend/src/types/index.ts`

```typescript
export interface NewResource {
  id: string
  name: string
  amount: string   // Decimalは文字列として受け取る
  created_at: string
  updated_at?: string | null
}
```

### ルール

- バックエンドの `Response` スキーマのフィールドと一致させる
- `Decimal` 型は `string` で受け取る（JSONシリアライズの都合）
- UUID は `string`
- nullable なフィールドは `type | null` とし、Optional は `?` を付ける

## ステップ 2: APIサービス作成

**ファイル**: `frontend/src/services/<resource>Service.ts`

```typescript
import api from './api'
import { NewResource } from '../types'

export const newResourceService = {
  getAll: async (): Promise<NewResource[]> => {
    const response = await api.get('/api/<resource-plural>')
    return response.data
  },

  getById: async (id: string): Promise<NewResource> => {
    const response = await api.get(`/api/<resource-plural>/${id}`)
    return response.data
  },

  create: async (data: { name: string; amount: number }): Promise<NewResource> => {
    const response = await api.post('/api/<resource-plural>', data)
    return response.data
  },

  update: async (id: string, data: { name?: string; amount?: number }): Promise<NewResource> => {
    const response = await api.put(`/api/<resource-plural>/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/<resource-plural>/${id}`)
  },
}
```

### ルール

- サービスファイル名は `<resource>Service.ts`（キャメルケース）
- APIパスは `/api/` から始める（nginx経由でバックエンドにプロキシされる）
- 戻り値の型を明示する
- create/update のパラメータでは `amount` を `number` で受け取る（axiosがJSONに変換する）

## ステップ 3: ページコンポーネント作成

**ファイル**: `frontend/src/pages/<Resource>.tsx`

```tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { newResourceService } from '../services/newResourceService'
import { NewResource } from '../types'

const Resources = () => {
  const navigate = useNavigate()
  const [resources, setResources] = useState<NewResource[]>([])
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<NewResource | null>(null)
  const [formData, setFormData] = useState({ name: '', amount: '' })

  // ナビゲーションリンク（全ページ共通パターン）
  const navLinks = [
    { path: '/', label: 'ダッシュボード' },
    { path: '/transactions', label: '取引一覧' },
    { path: '/assets', label: '資産管理' },
    { path: '/analytics', label: '分析' },
    { path: '/categories', label: 'カテゴリ' },
    { path: '/settings', label: '設定' },
  ]

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      const data = await newResourceService.getAll()
      setResources(data)
    } catch {
      setError('データの取得に失敗しました')
    }
  }

  const handleSubmit = async () => {
    try {
      if (editTarget) {
        await newResourceService.update(editTarget.id, {
          name: formData.name,
          amount: Number(formData.amount),
        })
      } else {
        await newResourceService.create({
          name: formData.name,
          amount: Number(formData.amount),
        })
      }
      setDialogOpen(false)
      setEditTarget(null)
      setFormData({ name: '', amount: '' })
      fetchResources()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: unknown } } }
        const detail = axiosErr.response?.data?.detail
        if (Array.isArray(detail)) {
          setError(detail.map((d: { msg?: string }) => d.msg || '').join(', '))
        } else if (typeof detail === 'string') {
          setError(detail)
        } else {
          setError('保存に失敗しました')
        }
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('削除しますか？')) return
    try {
      await newResourceService.delete(id)
      fetchResources()
    } catch {
      setError('削除に失敗しました')
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* ナビゲーション */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {navLinks.map((link) => (
          <Button
            key={link.path}
            variant="outlined"
            size="small"
            onClick={() => navigate(link.path)}
          >
            {link.label}
          </Button>
        ))}
      </Box>

      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">リソース管理</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditTarget(null)
            setFormData({ name: '', amount: '' })
            setDialogOpen(true)
          }}
        >
          新規追加
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* テーブル */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名前</TableCell>
              <TableCell align="right">金額</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resources.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell align="right">
                  {Number(r.amount).toLocaleString()}円
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    onClick={() => {
                      setEditTarget(r)
                      setFormData({
                        name: r.name,
                        amount: r.amount,
                      })
                      setDialogOpen(true)
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(r.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 作成/編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editTarget ? '編集' : '新規追加'}</DialogTitle>
        <DialogContent>
          <TextField
            label="名前"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            label="金額"
            type="number"
            fullWidth
            margin="normal"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editTarget ? '更新' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default Resources
```

### ルール

- ナビゲーションリンクは全ページで統一パターン（`Box` + `Button` + `navigate`）
- 新規ページを追加したら、**既存の全ページ**のナビゲーションにもリンクを追加する
- エラーハンドリング: 422レスポンスの `detail` は配列の場合があるため、`Array.isArray` で分岐する
- 金額表示は `Number(value).toLocaleString()` + `円` で統一
- 削除前に `window.confirm` で確認を表示
- ダイアログは MUI `Dialog` を使用（モーダル形式）

## ステップ 4: ルーティング追加

**ファイル**: `frontend/src/App.tsx`

```tsx
// import追加
import Resources from './pages/Resources'

// ProtectedRoute 内に Route 追加
<Route path="/resources" element={<Resources />} />
```

## ステップ 5: 全ページのナビゲーション更新

以下の全ページの `navLinks` 配列に新しいページのリンクを追加する:

- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Transactions.tsx`
- `frontend/src/pages/Assets.tsx`
- `frontend/src/pages/Analytics.tsx`
- `frontend/src/pages/Categories.tsx`
- `frontend/src/pages/Settings.tsx`

各ページのナビゲーション部分に `{ path: '/resources', label: 'リソース管理' }` を追加する。

## ステップ 6: 動作確認

1. `./stop.sh && ./start.sh --dev` で再起動
2. 新しいページが表示されること
3. 全ページのナビゲーションから新しいページにアクセスできること
4. CRUD操作が正常に動作すること

## チェックリスト

- [ ] `types/index.ts` に型定義追加
- [ ] `services/<resource>Service.ts` 作成
- [ ] `pages/<Resource>.tsx` 作成
- [ ] `App.tsx` にルート追加
- [ ] 全ページのナビゲーションに新ページのリンク追加
- [ ] 全テキストが日本語
- [ ] エラーハンドリングで422の配列detailに対応
- [ ] 金額表示が `toLocaleString() + 円` 形式
