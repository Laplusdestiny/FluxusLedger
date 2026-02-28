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
  asset_id?: string | null
  closing_day?: number | null
  payment_day?: number | null
  created_at: string
}

export interface Transaction {
  id: string
  date: string
  amount: string
  type: 'income' | 'expense'
  category_id: string
  payment_method_id?: string | null
  asset_id?: string | null
  description?: string | null
  created_at: string
}

export interface Asset {
  id: string
  name: string
  type: string
  balance: string
  created_at: string
  updated_at?: string | null
}

export interface CreditCardAlert {
  payment_method_id: string
  payment_method_name: string
  bank_asset_id?: string | null
  bank_asset_name?: string | null
  bank_balance: string
  next_payment_date: string
  closed_period_charges: string
  current_period_charges: string
  shortfall: string
}

export interface Budget {
  id: string
  category_id: string
  amount: string
  year: string
  month: string
  created_at: string
}
