import React, { createContext, useContext, useReducer } from 'react';
import { Transaction, Budget } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  transactions: Transaction[];
  budgets: Budget[];
  currentView: 'dashboard' | 'transactions' | 'budgets' | 'analytics';
}

type AppAction =
  | { type: 'ADD_TRANSACTION'; payload: Omit<Transaction, 'id'> }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_BUDGET'; payload: Omit<Budget, 'id' | 'spent'> }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'SET_VIEW'; payload: AppState['currentView'] };

const initialState: AppState = {
  transactions: [
    {
      id: '1',
      title: 'Salary',
      amount: 5000,
      category: 'Salary',
      type: 'income',
      date: '2024-01-15',
      notes: 'Monthly salary'
    },
    {
      id: '2',
      title: 'Grocery Shopping',
      amount: 150,
      category: 'Food & Dining',
      type: 'expense',
      date: '2024-01-14',
      notes: 'Weekly groceries'
    },
    {
      id: '3',
      title: 'Gas',
      amount: 45,
      category: 'Transportation',
      type: 'expense',
      date: '2024-01-13'
    }
  ],
  budgets: [
    {
      id: '1',
      category: 'Food & Dining',
      amount: 500,
      spent: 150,
      period: 'monthly',
      color: '#EF4444'
    },
    {
      id: '2',
      category: 'Transportation',
      amount: 200,
      spent: 45,
      period: 'monthly',
      color: '#F97316'
    }
  ],
  currentView: 'dashboard'
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TRANSACTION': {
      const newTransaction = {
        ...action.payload,
        id: uuidv4()
      };
      
      // Update budget spent amount if it's an expense
      let updatedBudgets = state.budgets;
      if (newTransaction.type === 'expense') {
        updatedBudgets = state.budgets.map(budget => 
          budget.category === newTransaction.category
            ? { ...budget, spent: budget.spent + newTransaction.amount }
            : budget
        );
      }
      
      return {
        ...state,
        transactions: [...state.transactions, newTransaction],
        budgets: updatedBudgets
      };
    }
    
    case 'UPDATE_TRANSACTION': {
      const updatedTransactions = state.transactions.map(t =>
        t.id === action.payload.id ? action.payload : t
      );
      return { ...state, transactions: updatedTransactions };
    }
    
    case 'DELETE_TRANSACTION': {
      const deletedTransaction = state.transactions.find(t => t.id === action.payload);
      let updatedBudgets = state.budgets;
      
      // Update budget spent amount if it's an expense
      if (deletedTransaction?.type === 'expense') {
        updatedBudgets = state.budgets.map(budget => 
          budget.category === deletedTransaction.category
            ? { ...budget, spent: Math.max(0, budget.spent - deletedTransaction.amount) }
            : budget
        );
      }
      
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
        budgets: updatedBudgets
      };
    }
    
    case 'ADD_BUDGET': {
      const currentSpent = state.transactions
        .filter(t => t.type === 'expense' && t.category === action.payload.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const newBudget = {
        ...action.payload,
        id: uuidv4(),
        spent: currentSpent
      };
      
      return {
        ...state,
        budgets: [...state.budgets, newBudget]
      };
    }
    
    case 'UPDATE_BUDGET': {
      const updatedBudgets = state.budgets.map(b =>
        b.id === action.payload.id ? action.payload : b
      );
      return { ...state, budgets: updatedBudgets };
    }
    
    case 'DELETE_BUDGET': {
      return {
        ...state,
        budgets: state.budgets.filter(b => b.id !== action.payload)
      };
    }
    
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}