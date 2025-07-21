import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function BudgetAlerts() {
  const { state } = useApp();
  
  const getBudgetStatus = (budget: any) => {
    const percentage = (budget.spent / budget.amount) * 100;
    if (percentage >= 100) return { status: 'over', color: 'red', icon: AlertTriangle };
    if (percentage >= 75) return { status: 'warning', color: 'yellow', icon: Clock };
    if (percentage >= 50) return { status: 'progress', color: 'blue', icon: Target };
    return { status: 'good', color: 'green', icon: CheckCircle };
  };
  
  const alerts = state.budgets.map(budget => ({
    ...budget,
    ...getBudgetStatus(budget),
    percentage: (budget.spent / budget.amount) * 100
  })).sort((a, b) => b.percentage - a.percentage);
  
  if (alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Budget Alerts
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Create budgets to start tracking your spending limits and get real-time alerts.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {alerts.map((alert) => {
        const IconComponent = alert.icon;
        const remaining = alert.amount - alert.spent;
        
        return (
          <div
            key={alert.id}
            className={`
              p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-md
              ${alert.color === 'red' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' : ''}
              ${alert.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' : ''}
              ${alert.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''}
              ${alert.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : ''}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <IconComponent className={`
                  w-5 h-5
                  ${alert.color === 'red' ? 'text-red-600 dark:text-red-400' : ''}
                  ${alert.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' : ''}
                  ${alert.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : ''}
                  ${alert.color === 'green' ? 'text-green-600 dark:text-green-400' : ''}
                `} />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {alert.category}
                  </h4>
                  <p className={`
                    text-sm
                    ${alert.color === 'red' ? 'text-red-700 dark:text-red-300' : ''}
                    ${alert.color === 'yellow' ? 'text-yellow-700 dark:text-yellow-300' : ''}
                    ${alert.color === 'blue' ? 'text-blue-700 dark:text-blue-300' : ''}
                    ${alert.color === 'green' ? 'text-green-700 dark:text-green-300' : ''}
                  `}>
                    {alert.status === 'over' && `Over budget by $${Math.abs(remaining).toLocaleString()}`}
                    {alert.status === 'warning' && `${alert.percentage.toFixed(0)}% used - approaching limit`}
                    {alert.status === 'progress' && `${alert.percentage.toFixed(0)}% used - on track`}
                    {alert.status === 'good' && `${alert.percentage.toFixed(0)}% used - well within budget`}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  ${alert.spent.toLocaleString()} / ${alert.amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {remaining >= 0 ? `$${remaining.toLocaleString()} left` : 'Over budget'}
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`
                    h-2 rounded-full transition-all duration-300
                    ${alert.color === 'red' ? 'bg-red-500' : ''}
                    ${alert.color === 'yellow' ? 'bg-yellow-500' : ''}
                    ${alert.color === 'blue' ? 'bg-blue-500' : ''}
                    ${alert.color === 'green' ? 'bg-green-500' : ''}
                  `}
                  style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}