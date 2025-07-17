import { Category } from '../types';

export const expenseCategories: Category[] = [
  { name: 'Food & Dining', color: '#EF4444', icon: 'utensils' },
  { name: 'Transportation', color: '#F97316', icon: 'car' },
  { name: 'Shopping', color: '#EAB308', icon: 'shopping-bag' },
  { name: 'Entertainment', color: '#8B5CF6', icon: 'film' },
  { name: 'Bills & Utilities', color: '#3B82F6', icon: 'zap' },
  { name: 'Healthcare', color: '#10B981', icon: 'heart' },
  { name: 'Education', color: '#06B6D4', icon: 'book' },
  { name: 'Travel', color: '#F59E0B', icon: 'plane' },
  { name: 'Other', color: '#6B7280', icon: 'more-horizontal' }
];

export const incomeCategories: Category[] = [
  { name: 'Salary', color: '#10B981', icon: 'briefcase' },
  { name: 'Freelance', color: '#3B82F6', icon: 'laptop' },
  { name: 'Investment', color: '#8B5CF6', icon: 'trending-up' },
  { name: 'Business', color: '#F59E0B', icon: 'building' },
  { name: 'Other', color: '#6B7280', icon: 'more-horizontal' }
];

export const getAllCategories = (): Category[] => [
  ...expenseCategories,
  ...incomeCategories
];

export const getCategoryByName = (name: string): Category | undefined => {
  return getAllCategories().find(cat => cat.name === name);
};