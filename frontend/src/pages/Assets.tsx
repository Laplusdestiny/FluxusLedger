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
  IconButton,
  Alert,
  Typography,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import LogoutIcon from '@mui/icons-material/Logout'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { Asset, CreditCardAlert } from '../types'
import { assetService } from '../services/assetService'

const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([])
  const [alerts, setAlerts] = useState<CreditCardAlert[]>([])
  const [typeOptions, setTypeOptions] = useState<string[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    balance: '',
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [assetList, assetTypes, alertList] = await Promise.all([
        assetService.getAssets(),
        assetService.getAssetTypes(),
        assetService.getAlerts(),
      ])
      setAssets(assetList)
      setTypeOptions(assetTypes)
      setAlerts(alertList)
    } catch (err) {
      setError('データの読み込みに失敗しました')
    }
  }

  const handleOpenDialog = (asset?: Asset) => {
    if (asset) {
      setEditingId(asset.id)
      setFormData({
        name: asset.name,
        type: asset.type,
        balance: asset.balance,
      })
    } else {
      setEditingId(null)
      setFormData({ name: '', type: '', balance: '0' })
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
      setError('資産名は必須です')
      return
    }
    if (!formData.type) {
      setError('種別は必須です')
      return
    }

    try {
      if (editingId) {
        await assetService.updateAsset(editingId, {
          name: formData.name,
          type: formData.type,
          balance: parseFloat(formData.balance) || 0,
        })
      } else {
        await assetService.createAsset({
          name: formData.name,
          type: formData.type,
          balance: parseFloat(formData.balance) || 0,
        })
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
    if (confirm('削除してよろしいですか？この資産に紐づく支払方法・取引の参照も解除されます。')) {
      try {
        await assetService.deleteAsset(id)
        await loadData()
      } catch (err) {
        setError('削除に失敗しました')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const totalBalance = assets.reduce((sum, a) => sum + parseFloat(a.balance), 0)

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#1E3A8A' }}>
        <Toolbar>
          <Button color="inherit" onClick={() => navigate('/')}>ダッシュボード</Button>
          <Button color="inherit" onClick={() => navigate('/transactions')}>取引</Button>
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
          <h1>資産管理</h1>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            資産を追加
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* 総資産 */}
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f0f7ff' }}>
          <Typography variant="h6" gutterBottom>総資産</Typography>
          <Typography variant="h4" sx={{ color: '#1E3A8A', fontWeight: 'bold' }}>
            ¥{totalBalance.toLocaleString()}
          </Typography>
        </Paper>

        {/* クレジットカードアラート */}
        {alerts.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>クレジットカード引き落としアラート</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {alerts.map((alert) => {
                const hasShortfall = parseFloat(alert.shortfall) > 0
                return (
                  <Card
                    key={alert.payment_method_id}
                    variant="outlined"
                    sx={{
                      borderColor: hasShortfall ? '#ef4444' : '#10b981',
                      borderWidth: 2,
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {hasShortfall ? (
                          <WarningIcon sx={{ color: '#ef4444' }} />
                        ) : (
                          <CheckCircleIcon sx={{ color: '#10b981' }} />
                        )}
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {alert.payment_method_name}
                        </Typography>
                        {hasShortfall && (
                          <Chip label="残高不足" color="error" size="small" />
                        )}
                      </Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
                        <Typography variant="body2">
                          次回引き落とし日: <strong>{alert.next_payment_date}</strong>
                        </Typography>
                        <Typography variant="body2">
                          確定請求額: <strong>¥{parseFloat(alert.closed_period_charges).toLocaleString()}</strong>
                        </Typography>
                        <Typography variant="body2">
                          今期利用額（未確定）: <strong>¥{parseFloat(alert.current_period_charges).toLocaleString()}</strong>
                        </Typography>
                        <Typography variant="body2">
                          引き落とし口座: <strong>{alert.bank_asset_name || '未設定'}</strong>
                        </Typography>
                        <Typography variant="body2">
                          口座残高: <strong>¥{parseFloat(alert.bank_balance).toLocaleString()}</strong>
                        </Typography>
                        {hasShortfall && (
                          <Typography variant="body2" sx={{ color: '#ef4444' }}>
                            不足額: <strong>¥{parseFloat(alert.shortfall).toLocaleString()}</strong>
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )
              })}
            </Box>
          </Paper>
        )}

        {/* 資産一覧 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>資産一覧</Typography>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>名前</TableCell>
                  <TableCell>種別</TableCell>
                  <TableCell align="right">残高</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      資産がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell>{asset.type}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        ¥{parseFloat(asset.balance).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleOpenDialog(asset)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(asset.id)} color="error">
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

      {/* 資産追加・編集ダイアログ */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? '資産を編集' : '資産を追加'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            label="資産名"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            placeholder="例: 三菱UFJ銀行、楽天カード"
          />

          <Autocomplete
            freeSolo
            options={typeOptions}
            value={formData.type || null}
            onChange={(_e, newValue) => {
              setFormData({ ...formData, type: newValue || '' })
            }}
            onInputChange={(_e, inputValue, reason) => {
              if (reason === 'input') {
                setFormData({ ...formData, type: inputValue })
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

          <TextField
            label="残高"
            type="number"
            fullWidth
            inputProps={{ step: '0.01' }}
            value={formData.balance}
            onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
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

export default Assets
