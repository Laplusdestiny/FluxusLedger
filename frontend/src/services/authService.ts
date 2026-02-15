import api from './api'
import { User } from '../types'

export const authService = {
  register: async (email: string, password: string): Promise<User> => {
    const response = await api.post('/api/auth/register', { email, password })
    return response.data
  },

  login: async (email: string, password: string): Promise<{ access_token: string }> => {
    const response = await api.post('/api/auth/login', { email, password })
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/api/auth/me')
    return response.data
  },
}
