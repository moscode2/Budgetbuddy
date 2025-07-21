import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';

export function CalendarView() {
  const { state } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate daily spending
  const dailySpending = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const date = transaction.date;
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);
  
  // Find highest spending days
  const maxSpending = Math.max(...Object.values(dailySpending), 0);
  
  const getSpendingLevel = (amount: number) => {
    if (amount === 0) return 'none';
    if (amount < maxSpending * 0.3) return 'low';
    if (amount < maxSpending * 0.7) return 'medium';
    return 'high';
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar View</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visualize your daily spending patterns.
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const spending = dailySpending[dateStr] || 0;
            const spendingLevel = getSpendingLevel(spending);
            const dayTransactions = state.transactions.filter(t => t.date === dateStr);
            
            return (
              <div
                key={dateStr}
                className={`
                  relative p-3 min-h-[80px] border border-gray-200 dark:border-gray-700 rounded-lg
                  ${isToday(day) ? 'ring-2 ring-emerald-500' : ''}
                  ${spendingLevel === 'high' ? 'bg-red-50 dark:bg-red-900/20' : ''}
                  ${spendingLevel === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                  ${spendingLevel === 'low' ? 'bg-green-50 dark:bg-green-900/20' : ''}
                  hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer
                `}
                title={`${format(day, 'MMM dd')}: $${spending.toFixed(2)} spent`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    isToday(day) 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {spending > 0 && (
                    <div className={`
                      w-2 h-2 rounded-full
                      ${spendingLevel === 'high' ? 'bg-red-500' : ''}
                      ${spendingLevel === 'medium' ? 'bg-yellow-500' : ''}
                      ${spendingLevel === 'low' ? 'bg-green-500' : ''}
                    `} />
                  )}
                </div>
                
                {spending > 0 && (
                  <div className="mt-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      ${spending.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {dayTransactions.length} transaction{dayTransactions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Low Spending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Medium Spending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">High Spending</span>
          </div>
        </div>
      </div>
    </div>
  );
}