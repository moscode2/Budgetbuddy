export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
  notes?: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'yearly';
  color: string;
}

export interface Category {
  name: string;
  color: string;
  icon: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
}