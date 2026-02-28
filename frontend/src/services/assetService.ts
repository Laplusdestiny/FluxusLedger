import api from './api'
import { Asset, CreditCardAlert } from '../types'

export const assetService = {
  getAssets: async (): Promise<Asset[]> => {
    const response = await api.get('/api/assets')
    return response.data
  },

  getAsset: async (id: string): Promise<Asset> => {
    const response = await api.get(`/api/assets/${id}`)
    return response.data
  },

  createAsset: async (data: { name: string; type: string; balance: number }): Promise<Asset> => {
    const response = await api.post('/api/assets', data)
    return response.data
  },

  updateAsset: async (id: string, data: { name?: string; type?: string; balance?: number }): Promise<Asset> => {
    const response = await api.put(`/api/assets/${id}`, data)
    return response.data
  },

  deleteAsset: async (id: string): Promise<void> => {
    await api.delete(`/api/assets/${id}`)
  },

  getAssetTypes: async (): Promise<string[]> => {
    const response = await api.get('/api/assets/types')
    return response.data
  },

  getAlerts: async (): Promise<CreditCardAlert[]> => {
    const response = await api.get('/api/assets/alerts')
    return response.data
  },
}
