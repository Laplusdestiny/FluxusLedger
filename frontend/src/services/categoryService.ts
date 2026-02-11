import api from './api'
import { Category } from '../types'

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/api/categories')
    return response.data
  },

  getCategory: async (id: string): Promise<Category> => {
    const response = await api.get(`/api/categories/${id}`)
    return response.data
  },

  createCategory: async (name: string, type: 'income' | 'expense', color?: string): Promise<Category> => {
    const response = await api.post('/api/categories', { name, type, color })
    return response.data
  },

  updateCategory: async (id: string, name?: string, color?: string): Promise<Category> => {
    const response = await api.put(`/api/categories/${id}`, { name, color })
    return response.data
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/api/categories/${id}`)
  },
}
