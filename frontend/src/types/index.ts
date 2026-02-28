export interface User {
  id: string
  email: string
  is_active: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  created_at: string
}

export interface PaymentMethod {
  id: string
  name: string
  type: string
  created_at: string
}

export interface Transaction {
  id: string
  date: string
  amount: string
  type: 'income' | 'expense'
  category_id: string
  payment_method_id?: string
  description?: string
  created_at: string
}

export interface Budget {
  id: string
  category_id: string
  amount: string
  year: string
  month: string
  created_at: string
}
