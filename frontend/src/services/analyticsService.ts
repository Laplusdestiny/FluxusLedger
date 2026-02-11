import api from './api'

export const analyticsService = {
  getSummary: async (year: number, month: number): Promise<any> => {
    const response = await api.get('/api/analytics/summary', {
      params: { year, month },
    })
    return response.data
  },

  getCategoryBreakdown: async (year: number, month: number, transactionType: string = 'expense'): Promise<any[]> => {
    const response = await api.get('/api/analytics/category-breakdown', {
      params: { year, month, transaction_type: transactionType },
    })
    return response.data
  },

  getBudgetComparison: async (year: number, month: number): Promise<any[]> => {
    const response = await api.get('/api/analytics/budget-comparison', {
      params: { year, month },
    })
    return response.data
  },
}
