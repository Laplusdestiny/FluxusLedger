import api from './api'
import { Transaction } from '../types'

export const transactionService = {
  getTransactions: async (skip?: number, limit?: number, dateFrom?: string, dateTo?: string, categoryId?: string): Promise<Transaction[]> => {
    const response = await api.get('/api/transactions', {
      params: { skip, limit, date_from: dateFrom, date_to: dateTo, category_id: categoryId },
    })
    return response.data
  },

  getTransaction: async (id: string): Promise<Transaction> => {
    const response = await api.get(`/api/transactions/${id}`)
    return response.data
  },

  createTransaction: async (date: string, amount: number, type: 'income' | 'expense', categoryId: string, paymentMethodId?: string, description?: string, assetId?: string): Promise<Transaction> => {
    const response = await api.post('/api/transactions', {
      date,
      amount,
      type,
      category_id: categoryId,
      payment_method_id: paymentMethodId,
      asset_id: assetId,
      description,
    })
    return response.data
  },

  updateTransaction: async (id: string, updates: any): Promise<Transaction> => {
    const response = await api.put(`/api/transactions/${id}`, updates)
    return response.data
  },

  deleteTransaction: async (id: string): Promise<void> => {
    await api.delete(`/api/transactions/${id}`)
  },
}
