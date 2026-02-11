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
import { Category } from '../types'
import { categoryService } from '../services/categoryService'

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#1E3A8A',
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const cats = await categoryService.getCategories()
      setCategories(cats)
    } catch (err) {
      setError('カテゴリーの読み込みに失敗しました')
    }
  }

  const handleOpenDialog = (cat?: Category) => {
    if (cat) {
      setEditingId(cat.id)
      setFormData({
        name: cat.name,
        type: cat.type,
        color: cat.color,
      })
    } else {
      setEditingId(null)
      setFormData({
        name: '',
        type: 'expense',
        color: '#1E3A8A',
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

    if (!formData.name) {
      setError('カテゴリー名は必須です')
      return
    }

    try {
      if (editingId) {
        await categoryService.updateCategory(editingId, formData.name, formData.color)
      } else {
        await categoryService.createCategory(formData.name, formData.type as 'income' | 'expense', formData.color)
      }

      loadCategories()
      handleCloseDialog()
    } catch (err: any) {
      setError(err.response?.data?.detail || '保存に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('削除してよろしいですか？')) {
      try {
        await categoryService.deleteCategory(id)
        loadCategories()
      } catch (err) {
        setError('削除に失敗しました')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#1E3A8A' }}>
        <Toolbar>
          <Button color="inherit" onClick={() => navigate('/')}>ダッシュボード</Button>
          <Button color="inherit" onClick={() => navigate('/transactions')}>取引</Button>
          <Button color="inherit" onClick={() => navigate('/analytics')}>分析</Button>
          <Button color="inherit" onClick={() => navigate('/settings')}>設定</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <h1>カテゴリー管理</h1>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            新規追加
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>カラー</TableCell>
                <TableCell>名前</TableCell>
                <TableCell>種別</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    カテゴリーはありません
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          backgroundColor: cat.color,
                          borderRadius: '50%',
                        }}
                      />
                    </TableCell>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell>{cat.type === 'income' ? '収入' : '支出'}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleOpenDialog(cat)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(cat.id)} color="error">
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
        <DialogTitle>{editingId ? 'カテゴリーを編集' : '新規カテゴリー'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            label="カテゴリー名"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
          />

          {!editingId && (
            <FormControl fullWidth margin="normal">
              <InputLabel>種別</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                label="種別"
              >
                <MenuItem value="expense">支出</MenuItem>
                <MenuItem value="income">収入</MenuItem>
              </Select>
            </FormControl>
          )}

          <TextField
            label="カラー"
            type="color"
            fullWidth
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
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

export default Categories
