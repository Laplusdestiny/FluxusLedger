import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBar, Toolbar, Button, Container, Box, Paper, Grid, Card, CardContent, Typography, Alert } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import api from '../services/api'

const COLORS = ['#1E3A8A', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6']

const Analytics: React.FC = () => {
  const [summary, setSummary] = useState<any>(null)
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([])
  const [budgetComparison, setBudgetComparison] = useState<any[]>([])
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const today = new Date()
      const year = today.getFullYear()
      const month = today.getMonth() + 1

      const [summaryRes, breakdownRes, budgetRes] = await Promise.all([
        api.get('/api/analytics/summary', { params: { year, month } }),
        api.get('/api/analytics/category-breakdown', { params: { year, month, transaction_type: 'expense' } }),
        api.get('/api/analytics/budget-comparison', { params: { year, month } }),
      ])

      setSummary(summaryRes.data)
      setCategoryBreakdown(breakdownRes.data)
      setBudgetComparison(budgetRes.data)
    } catch (err) {
      setError('分析データの読み込みに失敗しました')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const chartData = categoryBreakdown.map((item) => ({
    name: item.category_name,
    value: parseFloat(item.amount),
  }))

  const budgetChartData = budgetComparison.map((item) => ({
    name: item.category_name,
    予算: parseFloat(item.budget),
    実績: parseFloat(item.actual),
  }))

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#1E3A8A' }}>
        <Toolbar>
          <Button color="inherit" onClick={() => navigate('/')}>ダッシュボード</Button>
          <Button color="inherit" onClick={() => navigate('/transactions')}>取引</Button>
          <Button color="inherit" onClick={() => navigate('/assets')}>資産管理</Button>
          <Button color="inherit" onClick={() => navigate('/categories')}>カテゴリー</Button>
          <Button color="inherit" onClick={() => navigate('/settings')}>設定</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <h1>分析</h1>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {summary && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    今月の収入
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#10B981' }}>
                    ¥{parseFloat(summary.income).toLocaleString()}
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
                    ¥{parseFloat(summary.expense).toLocaleString()}
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
                  <Typography variant="h5" sx={{ color: parseFloat(summary.balance) >= 0 ? '#10B981' : '#EF4444' }}>
                    ¥{parseFloat(summary.balance).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* グラフ */}
        <Grid container spacing={3}>
          {chartData.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  カテゴリー別支出割合
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ¥${value.toLocaleString()}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}

          {budgetChartData.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  予算 vs 実績
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budgetChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="予算" fill="#1E3A8A" />
                    <Bar dataKey="実績" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* 予算比較詳細 */}
        {budgetComparison.length > 0 && (
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                予算比較詳細
              </Typography>
              <Box>
                {budgetComparison.map((item, idx) => (
                  <Box key={idx} sx={{ mb: 2, pb: 2, borderBottom: idx < budgetComparison.length - 1 ? '1px solid #eee' : 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {item.category_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {item.percentage}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <Typography variant="caption">
                        予算: ¥{parseFloat(item.budget).toLocaleString()}
                      </Typography>
                      <Typography variant="caption">
                        実績: ¥{parseFloat(item.actual).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: parseFloat(item.remaining) >= 0 ? '#10B981' : '#EF4444' }}>
                        残: ¥{parseFloat(item.remaining).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ backgroundColor: '#f0f0f0', height: 8, borderRadius: 1, mt: 1, overflow: 'hidden' }}>
                      <Box
                        sx={{
                          height: '100%',
                          width: `${Math.min(item.percentage, 100)}%`,
                          backgroundColor: item.percentage > 100 ? '#EF4444' : '#1E3A8A',
                          transition: 'width 0.3s',
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Container>
    </>
  )
}

export default Analytics
