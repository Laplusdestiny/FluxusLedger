import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Toolbar, Button, Container, Box, Grid, Paper, Typography, Card, CardContent } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import { transactionService } from '../services/transactionService'
import { categoryService } from '../services/categoryService'
import { Transaction, Category } from '../types'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#1E3A8A', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6']

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [income, setIncome] = useState(0)
  const [expense, setExpense] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

      const [txns, cats] = await Promise.all([
        transactionService.getTransactions(0, 10, firstDay, lastDay),
        categoryService.getCategories(),
      ])

      setTransactions(txns)
      setCategories(cats)

      let totalIncome = 0
      let totalExpense = 0

      txns.forEach((txn) => {
        if (txn.type === 'income') {
          totalIncome += parseFloat(txn.amount)
        } else {
          totalExpense += parseFloat(txn.amount)
        }
      })

      setIncome(totalIncome)
      setExpense(totalExpense)
    } catch (err) {
      console.error('データの読み込みに失敗しました:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  // カテゴリー別支出のデータを準備
  const expenseData: any[] = []
  const expensesByCategory: { [key: string]: number } = {}

  transactions
    .filter((txn) => txn.type === 'expense')
    .forEach((txn: Transaction) => {
      const cat = categories.find((c) => c.id === txn.category_id)
      if (cat) {
        expensesByCategory[cat.name] = (expensesByCategory[cat.name] || 0) + parseFloat(txn.amount)
      }
    })

  Object.entries(expensesByCategory).forEach(([name, amount]) => {
    expenseData.push({ name, value: amount })
  })

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#1E3A8A' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            FluxusLedger
          </Typography>
          <Button color="inherit" onClick={() => navigate('/transactions')}>取引</Button>
          <Button color="inherit" onClick={() => navigate('/assets')}>資産管理</Button>
          <Button color="inherit" onClick={() => navigate('/analytics')}>分析</Button>
          <Button color="inherit" onClick={() => navigate('/categories')}>カテゴリー</Button>
          <Button color="inherit" onClick={() => navigate('/settings')}>設定</Button>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* 収支サマリー */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  今月の収入
                </Typography>
                <Typography variant="h5" sx={{ color: '#10B981' }}>
                  ¥{income.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  今月の支出
                </Typography>
                <Typography variant="h5" sx={{ color: '#EF4444' }}>
                  ¥{expense.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  収支
                </Typography>
                <Typography variant="h5" sx={{ color: income - expense >= 0 ? '#10B981' : '#EF4444' }}>
                  ¥{(income - expense).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* グラフ */}
          {expenseData.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  カテゴリー別支出
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ¥${value.toLocaleString()}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}

          {/* 最近の取引 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                最近の取引
              </Typography>
              <Box>
                {transactions.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    取引はまだありません
                  </Typography>
                ) : (
                  transactions.slice(0, 5).map((txn) => {
                    const cat = categories.find((c) => c.id === txn.category_id)
                    return (
                      <Box
                        key={txn.id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          py: 1,
                          borderBottom: '1px solid #eee',
                        }}
                      >
                        <Box>
                          <Typography variant="body2">{cat?.name || '不明'}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {txn.date}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: txn.type === 'income' ? '#10B981' : '#EF4444',
                            fontWeight: 'bold',
                          }}
                        >
                          {txn.type === 'income' ? '+' : '-'}¥{parseFloat(txn.amount).toLocaleString()}
                        </Typography>
                      </Box>
                    )
                  })
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  )
}

export default Dashboard
