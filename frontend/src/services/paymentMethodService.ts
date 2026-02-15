import api from './api'
import { PaymentMethod } from '../types'

export const paymentMethodService = {
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const response = await api.get('/api/payment-methods')
    return response.data
  },

  getPaymentMethod: async (id: string): Promise<PaymentMethod> => {
    const response = await api.get(`/api/payment-methods/${id}`)
    return response.data
  },

  createPaymentMethod: async (name: string, type: string): Promise<PaymentMethod> => {
    const response = await api.post('/api/payment-methods', { name, type })
    return response.data
  },

  updatePaymentMethod: async (id: string, name?: string, type?: string): Promise<PaymentMethod> => {
    const response = await api.put(`/api/payment-methods/${id}`, { name, type })
    return response.data
  },

  deletePaymentMethod: async (id: string): Promise<void> => {
    await api.delete(`/api/payment-methods/${id}`)
  },
}
