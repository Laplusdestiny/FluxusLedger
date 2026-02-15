import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Paper, TextField, Button, Box, Typography, Alert } from '@mui/material'
import { authService } from '../services/authService'

interface RegisterProps {
  setIsAuthenticated: (value: boolean) => void
}

const Register: React.FC<RegisterProps> = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    setLoading(true)

    try {
      await authService.register(email, password)
      // 登録後、自動的にログイン
      const loginResponse = await authService.login(email, password)
      localStorage.setItem('token', loginResponse.access_token)
      setIsAuthenticated(true)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3, textAlign: 'center', color: '#1E3A8A' }}>
            FluxusLedger
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
            アカウント登録
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleRegister}>
            <TextField
              fullWidth
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="パスワード確認"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              type="submit"
            >
              {loading ? '登録中...' : '登録'}
            </Button>
          </form>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
            すでにアカウントをお持ちですか？ <a href="/login" style={{ color: '#1E3A8A', textDecoration: 'none' }}>ログイン</a>
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}

export default Register
