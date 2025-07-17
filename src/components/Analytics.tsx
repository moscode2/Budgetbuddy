import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { useApp } from '../context/AppContext';
import { getCategoryByName } from '../data/categories';

export function Analytics() {
  const { state } = useApp();

  // Calculate spending by category for pie chart
  const spendingByCategory = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const existing = acc.find(item => item.name === transaction.category);
      if (existing) {
        existing.value += transaction.amount;
      } else {
        const category = getCategoryByName(transaction.category);
        acc.push({
          name: transaction.category,
          value: transaction.amount,
          color: category?.color || '#6B7280'
        });
      }
      return acc;
    }, [] as Array<{ name: string; value: number; color: string }>);

  // Calculate monthly income vs expenses
  const monthlyData = state.transactions.reduce((acc, transaction) => {
    const month = new Date(transaction.date).toLocaleString('default', { month: 'short' });
    const existing = acc.find(item => item.month === month);
    
    if (existing) {
      if (transaction.type === 'income') {
        existing.income += transaction.amount;
      } else {
        existing.expenses += transaction.amount;
      }
    } else {
      acc.push({
        month,
        income: transaction.type === 'income' ? transaction.amount : 0,
        expenses: transaction.type === 'expense' ? transaction.amount : 0
      });
    }
    return acc;
  }, [] as Array<{ month: string; income: number; expenses: number }>);

  // Calculate spending trends
  const spendingTrends = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const date = transaction.date;
      const existing = acc.find(item => item.date === date);
      
      if (existing) {
        existing.amount += transaction.amount;
      } else {
        acc.push({
          date,
          amount: transaction.amount
        });
      }
      return acc;
    }, [] as Array<{ date: string; amount: number }>)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30); // Last 30 data points

  const totalExpenses = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Analyze your spending patterns and financial trends.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category - Pie Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Spending by Category
          </h3>
          {spendingByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={spendingByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {spendingByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              No expense data available
            </div>
          )}
        </div>

        {/* Income vs Expenses - Bar Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Income vs Expenses
          </h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`$${value}`, '']}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="income" fill="#10B981" name="Income" />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Spending Trends - Line Chart */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Spending Trends
        </h3>
        {spendingTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={spendingTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                tick={{ fill: '#6B7280' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                stroke="#6B7280"
                tick={{ fill: '#6B7280' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value) => [`$${value}`, 'Amount']}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-gray-500 dark:text-gray-400">
            No spending data available
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Top Spending Category
          </h4>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {spendingByCategory.length > 0 ? spendingByCategory[0].name : 'N/A'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            ${spendingByCategory.length > 0 ? spendingByCategory[0].value.toLocaleString() : '0'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Average Daily Spending
          </h4>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${spendingTrends.length > 0 ? Math.round(totalExpenses / spendingTrends.length) : 0}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Last {spendingTrends.length} days
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Total Categories
          </h4>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {spendingByCategory.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Active spending categories
          </p>
        </div>
      </div>
    </div>
  );
}