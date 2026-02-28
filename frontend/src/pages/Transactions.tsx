import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Button,
  Container,
  Box,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Alert,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import LogoutIcon from '@mui/icons-material/Logout'
import { Transaction, Category, PaymentMethod, Asset } from '../types'
import { transactionService } from '../services/transactionService'
import { categoryService } from '../services/categoryService'
import { paymentMethodService } from '../services/paymentMethodService'
import { assetService } from '../services/assetService'

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'expense',
    categoryId: '',
    paymentMethodId: '',
    assetId: '',
    description: '',
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

      const [txns, cats, methods, assetList] = await Promise.all([
        transactionService.getTransactions(0, 1000, firstDay, lastDay),
        categoryService.getCategories(),
        paymentMethodService.getPaymentMethods ? paymentMethodService.getPaymentMethods() : [],
        assetService.getAssets(),
      ])

      setTransactions(txns)
      setCategories(cats)
      setPaymentMethods(methods)
      setAssets(assetList)

      if (cats.length > 0) {
        setFormData((prev) => ({
          ...prev,
          categoryId: cats.find((c) => c.type === prev.type)?.id || cats[0].id,
        }))
      }
    } catch (err) {
      setError('データの読み込みに失敗しました')
    }
  }

  const handleOpenDialog = (txn?: Transaction) => {
    if (txn) {
      setEditingId(txn.id)
      setFormData({
        date: txn.date,
        amount: txn.amount,
        type: txn.type,
        categoryId: txn.category_id,
        paymentMethodId: txn.payment_method_id || '',
        assetId: txn.asset_id || '',
        description: txn.description || '',
      })
    } else {
      setEditingId(null)
      const defaultType = 'expense'
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: defaultType,
        categoryId: categories.find((c) => c.type === defaultType)?.id || '',
        paymentMethodId: '',
        assetId: '',
        description: '',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setError('')
  }

  const handleSave = async () => {
    setError('')

    if (!formData.amount || !formData.categoryId) {
      setError('金額とカテゴリーは必須です')
      return
    }

    try {
      if (editingId) {
        await transactionService.updateTransaction(editingId, {
          date: formData.date,
          amount: parseFloat(formData.amount),
          type: formData.type,
          category_id: formData.categoryId,
          payment_method_id: formData.paymentMethodId || null,
          asset_id: formData.assetId || null,
          description: formData.description || null,
        })
      } else {
        await transactionService.createTransaction(
          formData.date,
          parseFloat(formData.amount),
          formData.type as 'income' | 'expense',
          formData.categoryId,
          formData.paymentMethodId || undefined,
          formData.description || undefined,
          formData.assetId || undefined
        )
      }

      await loadData()
      handleCloseDialog()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg).join(', '))
      } else {
        setError(typeof detail === 'string' ? detail : '保存に失敗しました')
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('削除してよろしいですか？')) {
      try {
        await transactionService.deleteTransaction(id)
        loadData()
      } catch (err) {
        setError('削除に失敗しました')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const assetMap = Object.fromEntries(assets.map((a) => [a.id, a.name]))

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#1E3A8A' }}>
        <Toolbar>
          <Button color="inherit" onClick={() => navigate('/')}>ダッシュボード</Button>
          <Button color="inherit" onClick={() => navigate('/assets')}>資産管理</Button>
          <Button color="inherit" onClick={() => navigate('/analytics')}>分析</Button>
          <Button color="inherit" onClick={() => navigate('/categories')}>カテゴリー</Button>
          <Button color="inherit" onClick={() => navigate('/settings')}>設定</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <h1>取引管理</h1>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            新規取引
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>日付</TableCell>
                <TableCell>カテゴリー</TableCell>
                <TableCell>種別</TableCell>
                <TableCell align="right">金額</TableCell>
                <TableCell>説明</TableCell>
                <TableCell>資産</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    取引はありません
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>{txn.date}</TableCell>
                    <TableCell>{categoryMap[txn.category_id] || '不明'}</TableCell>
                    <TableCell>
                      <Box sx={{ color: txn.type === 'income' ? '#10B981' : '#EF4444' }}>
                        {txn.type === 'income' ? '収入' : '支出'}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ color: txn.type === 'income' ? '#10B981' : '#EF4444' }}>
                      {txn.type === 'income' ? '+' : '-'}¥{parseFloat(txn.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>{txn.description}</TableCell>
                    <TableCell>{txn.asset_id ? assetMap[txn.asset_id] || '-' : '-'}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleOpenDialog(txn)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(txn.id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? '取引を編集' : '新規取引'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            label="日付"
            type="date"
            fullWidth
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            margin="normal"
          />

          <TextField
            label="金額"
            type="number"
            fullWidth
            inputProps={{ step: '0.01' }}
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            margin="normal"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>種別</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value
                setFormData({
                  ...formData,
                  type: newType,
                  categoryId: categories.find((c) => c.type === newType)?.id || '',
                  paymentMethodId: '',
                  assetId: '',
                })
              }}
              label="種別"
            >
              <MenuItem value="expense">支出</MenuItem>
              <MenuItem value="income">収入</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>カテゴリー</InputLabel>
            <Select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              label="カテゴリー"
            >
              {categories.filter((cat) => cat.type === formData.type).map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 支出の場合: 支払方法を選択 */}
          {formData.type === 'expense' && (
            <FormControl fullWidth margin="normal">
              <InputLabel>支払方法</InputLabel>
              <Select
                value={formData.paymentMethodId}
                onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
                label="支払方法"
              >
                <MenuItem value="">なし</MenuItem>
                {paymentMethods.map((method) => (
                  <MenuItem key={method.id} value={method.id}>
                    {method.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* 収入の場合: 入金先を選択 */}
          {formData.type === 'income' && (
            <FormControl fullWidth margin="normal">
              <InputLabel>入金先</InputLabel>
              <Select
                value={formData.assetId}
                onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                label="入金先"
              >
                <MenuItem value="">なし</MenuItem>
                {assets.map((asset) => (
                  <MenuItem key={asset.id} value={asset.id}>
                    {asset.name}（¥{parseFloat(asset.balance).toLocaleString()}）
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            label="説明"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Transactions
