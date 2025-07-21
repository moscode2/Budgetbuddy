import React from 'react';
import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { StatCard } from './StatCard';
import { useApp } from '../context/AppContext';
import { TransactionForm } from './TransactionForm';
import { format } from 'date-fns';

export function Dashboard() {
  const { state } = useApp();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  
  const totalIncome = state.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netSavings = totalIncome - totalExpenses;
  
  const recentTransactions = state.transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
    
  const overBudgetCategories = state.budgets.filter(b => b.spent > b.amount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's your financial overview.
          </p>
        </div>
        <button 
          onClick={() => setIsQuickAddOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Add</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Income"
          value={`$${totalIncome.toLocaleString()}`}
          change="+12% from last month"
          changeType="positive"
          icon={TrendingUp}
          gradient="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Total Expenses"
          value={`$${totalExpenses.toLocaleString()}`}
          change="+5% from last month"
          changeType="negative"
          icon={TrendingDown}
          gradient="from-red-500 to-red-600"
        />
        <StatCard
          title="Net Savings"
          value={`$${netSavings.toLocaleString()}`}
          change="+18% from last month"
          changeType="positive"
          icon={Wallet}
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Active Budgets"
          value={state.budgets.length.toString()}
          change={`${overBudgetCategories.length} over budget`}
          changeType={overBudgetCategories.length > 0 ? 'negative' : 'neutral'}
          icon={Target}
          gradient="from-purple-500 to-purple-600"
        />
      </div>
      
      {overBudgetCategories.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="font-semibold text-red-800 dark:text-red-200">Budget Alerts</h3>
          </div>
          <div className="mt-2">
            {overBudgetCategories.map(budget => (
              <p key={budget.id} className="text-red-700 dark:text-red-300 text-sm">
                {budget.category}: ${budget.spent} / ${budget.amount} 
                (${(budget.spent - budget.amount).toLocaleString()} over)
              </p>
            ))}
          </div>
        </div>
      )}
      
      <TransactionForm
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {recentTransactions.map(transaction => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{transaction.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {transaction.category} • {format(new Date(transaction.date), 'MMM dd')}
                  </p>
                </div>
                <span className={`font-semibold ${
                  transaction.type === 'income' 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Budget Progress</h3>
          <div className="space-y-4">
            {state.budgets.slice(0, 4).map(budget => {
              const percentage = (budget.spent / budget.amount) * 100;
              return (
                <div key={budget.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {budget.category}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ${budget.spent} / ${budget.amount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        percentage > 100 
                          ? 'bg-red-500' 
                          : percentage > 80 
                            ? 'bg-yellow-500' 
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}