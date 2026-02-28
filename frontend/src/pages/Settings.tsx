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
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Alert,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import LogoutIcon from '@mui/icons-material/Logout'
import { PaymentMethod, Asset } from '../types'
import api from '../services/api'
import { assetService } from '../services/assetService'

/** Payment type option used in the Autocomplete dropdown */
interface PaymentTypeOption {
  value: string
  label: string
}

const Settings: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [typeOptions, setTypeOptions] = useState<PaymentTypeOption[]>([])
  const [typeLabels, setTypeLabels] = useState<Record<string, string>>({})
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    assetId: '',
    closingDay: '',
    paymentDay: '',
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadPaymentMethods()
    loadPaymentTypes()
    loadAssets()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      const response = await api.get('/api/payment-methods')
      setPaymentMethods(response.data)
    } catch (err) {
      setError('支払方法の読み込みに失敗しました')
    }
  }

  const loadPaymentTypes = async () => {
    try {
      const response = await api.get<Record<string, string>>('/api/payment-methods/types')
      const labels = response.data
      setTypeLabels(labels)
      setTypeOptions(
        Object.entries(labels).map(([value, label]) => ({ value, label }))
      )
    } catch (err) {
      const fallback: Record<string, string> = {
        cash: '現金',
        credit_card: 'クレジットカード',
        debit_card: 'デビットカード',
        bank_transfer: '銀行振込',
        e_money: '電子マネー',
        qr_code: 'QRコード決済',
        prepaid_card: 'プリペイドカード',
        point: 'ポイント払い',
      }
      setTypeLabels(fallback)
      setTypeOptions(
        Object.entries(fallback).map(([value, label]) => ({ value, label }))
      )
    }
  }

  const loadAssets = async () => {
    try {
      const assetList = await assetService.getAssets()
      setAssets(assetList)
    } catch (err) {
      // Non-critical, assets may not be set up yet
    }
  }

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingId(method.id)
      setFormData({
        name: method.name,
        type: method.type,
        assetId: method.asset_id || '',
        closingDay: method.closing_day != null ? String(method.closing_day) : '',
        paymentDay: method.payment_day != null ? String(method.payment_day) : '',
      })
    } else {
      setEditingId(null)
      setFormData({ name: '', type: '', assetId: '', closingDay: '', paymentDay: '' })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setError('')
  }

  const handleSave = async () => {
    setError('')

    if (!formData.name) {
      setError('支払方法名は必須です')
      return
    }
    if (!formData.type) {
      setError('種別は必須です')
      return
    }

    const payload: any = {
      name: formData.name,
      type: formData.type,
      asset_id: formData.assetId || null,
      closing_day: formData.closingDay ? parseInt(formData.closingDay) : null,
      payment_day: formData.paymentDay ? parseInt(formData.paymentDay) : null,
    }

    try {
      if (editingId) {
        await api.put(`/api/payment-methods/${editingId}`, payload)
      } else {
        await api.post('/api/payment-methods', payload)
      }

      loadPaymentMethods()
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
        await api.delete(`/api/payment-methods/${id}`)
        loadPaymentMethods()
      } catch (err) {
        setError('削除に失敗しました')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  /** Resolve a type key to its display label */
  const getTypeLabel = (type: string): string => typeLabels[type] || type

  /** Find the option matching a type value, or build one for a custom value */
  const getSelectedOption = (type: string): PaymentTypeOption | null => {
    if (!type) return null
    const found = typeOptions.find((o) => o.value === type)
    return found || { value: type, label: type }
  }

  const assetMap = Object.fromEntries(assets.map((a) => [a.id, a.name]))

  /** Check if the current type looks like a credit card */
  const isCreditCardType = (type: string): boolean => {
    return type === 'credit_card' || type === 'クレジットカード'
  }

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#1E3A8A' }}>
        <Toolbar>
          <Button color="inherit" onClick={() => navigate('/')}>ダッシュボード</Button>
          <Button color="inherit" onClick={() => navigate('/transactions')}>取引</Button>
          <Button color="inherit" onClick={() => navigate('/assets')}>資産管理</Button>
          <Button color="inherit" onClick={() => navigate('/analytics')}>分析</Button>
          <Button color="inherit" onClick={() => navigate('/categories')}>カテゴリー</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <h1>設定</h1>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* 支払方法管理 */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">支払方法</Typography>
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              追加
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>名前</TableCell>
                  <TableCell>種別</TableCell>
                  <TableCell>連携資産</TableCell>
                  <TableCell>締め日 / 引き落とし日</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paymentMethods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      支払方法がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>{method.name}</TableCell>
                      <TableCell>{getTypeLabel(method.type)}</TableCell>
                      <TableCell>
                        {method.asset_id ? assetMap[method.asset_id] || '不明' : '-'}
                      </TableCell>
                      <TableCell>
                        {method.closing_day != null && method.payment_day != null
                          ? `${method.closing_day}日 / ${method.payment_day}日`
                          : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleOpenDialog(method)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(method.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? '支払方法を編集' : '支払方法を追加'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            label="支払方法名"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
          />

          <Autocomplete
            freeSolo
            options={typeOptions}
            value={getSelectedOption(formData.type)}
            getOptionLabel={(option) =>
              typeof option === 'string' ? option : option.label
            }
            isOptionEqualToValue={(option, value) => option.value === value.value}
            onChange={(_e, newValue) => {
              if (newValue === null) {
                setFormData({ ...formData, type: '' })
              } else if (typeof newValue === 'string') {
                setFormData({ ...formData, type: newValue })
              } else {
                setFormData({ ...formData, type: newValue.value })
              }
            }}
            onInputChange={(_e, inputValue, reason) => {
              if (reason === 'input') {
                const matched = typeOptions.find((o) => o.label === inputValue)
                setFormData({ ...formData, type: matched ? matched.value : inputValue })
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="種別"
                margin="normal"
                placeholder="選択またはカスタム入力"
                helperText="一覧から選択するか、自由に入力できます"
              />
            )}
          />

          {/* 連携する資産（引き落とし口座） */}
          <FormControl fullWidth margin="normal">
            <InputLabel>連携資産（引き落とし口座）</InputLabel>
            <Select
              value={formData.assetId}
              onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
              label="連携資産（引き落とし口座）"
            >
              <MenuItem value="">なし</MenuItem>
              {assets.map((asset) => (
                <MenuItem key={asset.id} value={asset.id}>
                  {asset.name}（¥{parseFloat(asset.balance).toLocaleString()}）
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* クレジットカード向け: 締め日・引き落とし日 */}
          {isCreditCardType(formData.type) && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="締め日"
                type="number"
                fullWidth
                inputProps={{ min: 1, max: 31 }}
                value={formData.closingDay}
                onChange={(e) => setFormData({ ...formData, closingDay: e.target.value })}
                margin="normal"
                helperText="毎月の締め日（1〜31）"
              />
              <TextField
                label="引き落とし日"
                type="number"
                fullWidth
                inputProps={{ min: 1, max: 31 }}
                value={formData.paymentDay}
                onChange={(e) => setFormData({ ...formData, paymentDay: e.target.value })}
                margin="normal"
                helperText="毎月の引き落とし日（1〜31）"
              />
            </Box>
          )}
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

export default Settings
