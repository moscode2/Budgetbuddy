import React, { useState } from 'react';
import { Plus, Edit, Trash2, AlertTriangle, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BudgetForm } from './BudgetForm';
import { Budget } from '../types';

export function Budgets() {
  const { state, dispatch } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>();

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      dispatch({ type: 'DELETE_BUDGET', payload: id });
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingBudget(undefined);
  };

  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent / budget.amount) * 100;
    if (percentage > 100) return { status: 'over', color: 'red' };
    if (percentage > 80) return { status: 'warning', color: 'yellow' };
    return { status: 'good', color: 'green' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Budgets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Set and track your spending limits by category.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Budget</span>
        </button>
      </div>

      {state.budgets.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No budgets yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first budget to start tracking your spending limits.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl inline-flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Budget</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.budgets.map((budget) => {
            const percentage = (budget.spent / budget.amount) * 100;
            const { status, color } = getBudgetStatus(budget);
            const remaining = budget.amount - budget.spent;

            return (
              <div
                key={budget.id}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: budget.color }}
                    />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {budget.category}
                    </h3>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {status === 'over' && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <button
                      onClick={() => handleEdit(budget)}
                      className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Spent</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${budget.spent.toLocaleString()} / ${budget.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        status === 'over'
                          ? 'bg-red-500'
                          : status === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${
                      status === 'over'
                        ? 'text-red-600 dark:text-red-400'
                        : status === 'warning'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {percentage.toFixed(1)}% used
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {remaining >= 0 ? `$${remaining.toLocaleString()} left` : `$${Math.abs(remaining).toLocaleString()} over`}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {budget.period} budget
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BudgetForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        budget={editingBudget}
      />
    </div>
  );
}