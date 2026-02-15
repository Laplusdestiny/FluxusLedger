import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Paper, TextField, Button, Box, Typography, Alert } from '@mui/material'
import { authService } from '../services/authService'

interface LoginProps {
  setIsAuthenticated: (value: boolean) => void
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authService.login(email, password)
      localStorage.setItem('token', response.access_token)
      setIsAuthenticated(true)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'ログインに失敗しました')
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
            お金の流れを記録・分析
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleLogin}>
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
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              type="submit"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
            アカウントをお持ちでない方は <a href="/register" style={{ color: '#1E3A8A', textDecoration: 'none' }}>こちら</a>
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}

export default Login
