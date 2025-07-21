import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Target, Lightbulb, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AISuggestion {
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  message: string;
  icon: React.ComponentType<any>;
}

export function AISummary() {
  const { state } = useApp();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateAISummary = () => {
    setIsGenerating(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Calculate current month data
      const currentMonthTransactions = state.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      });
      
      const monthlyIncome = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const monthlyExpenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Category analysis
      const categorySpending = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);
      
      const topCategory = Object.entries(categorySpending)
        .sort(([,a], [,b]) => b - a)[0];
      
      // Budget analysis
      const overBudgetCategories = state.budgets.filter(b => b.spent > b.amount);
      const underBudgetCategories = state.budgets.filter(b => b.spent < b.amount * 0.8);
      
      const newSuggestions: AISuggestion[] = [];
      
      // Income vs Expenses
      if (monthlyIncome > monthlyExpenses) {
        const savings = monthlyIncome - monthlyExpenses;
        const savingsRate = (savings / monthlyIncome) * 100;
        newSuggestions.push({
          type: 'success',
          title: 'Great Savings Performance!',
          message: `You saved $${savings.toLocaleString()} this month (${savingsRate.toFixed(1)}% savings rate). You're on track to meet your financial goals!`,
          icon: TrendingUp
        });
      } else if (monthlyExpenses > monthlyIncome) {
        const deficit = monthlyExpenses - monthlyIncome;
        newSuggestions.push({
          type: 'warning',
          title: 'Spending Alert',
          message: `You spent $${deficit.toLocaleString()} more than you earned this month. Consider reviewing your expenses and finding areas to cut back.`,
          icon: TrendingDown
        });
      }
      
      // Top spending category
      if (topCategory) {
        const [category, amount] = topCategory;
        const percentage = (amount / monthlyExpenses) * 100;
        newSuggestions.push({
          type: 'info',
          title: 'Top Spending Category',
          message: `Your highest expense this month is ${category} at $${amount.toLocaleString()} (${percentage.toFixed(1)}% of total expenses). ${
            percentage > 40 ? 'This seems quite high - consider if there are ways to optimize this spending.' : 'This looks reasonable for your spending pattern.'
          }`,
          icon: Target
        });
      }
      
      // Budget performance
      if (underBudgetCategories.length > 0) {
        newSuggestions.push({
          type: 'success',
          title: 'Budget Discipline',
          message: `Excellent! You stayed well under budget in ${underBudgetCategories.length} categories: ${underBudgetCategories.map(b => b.category).join(', ')}. Great self-control!`,
          icon: Target
        });
      }
      
      if (overBudgetCategories.length > 0) {
        newSuggestions.push({
          type: 'warning',
          title: 'Budget Overspending',
          message: `You exceeded your budget in ${overBudgetCategories.length} categories. Consider adjusting your spending habits or increasing these budget limits if necessary.`,
          icon: Target
        });
      }
      
      // Smart tips based on data
      const tips = [
        {
          type: 'tip' as const,
          title: 'Smart Saving Tip',
          message: 'Try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. This helps maintain a balanced financial lifestyle.',
          icon: Lightbulb
        },
        {
          type: 'tip' as const,
          title: 'Expense Tracking',
          message: 'Consider setting up automatic categorization rules for recurring transactions to save time and improve accuracy.',
          icon: Lightbulb
        },
        {
          type: 'tip' as const,
          title: 'Emergency Fund',
          message: 'Aim to build an emergency fund covering 3-6 months of expenses. Start small and gradually increase it over time.',
          icon: Lightbulb
        }
      ];
      
      // Add a random tip
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      newSuggestions.push(randomTip);
      
      setSuggestions(newSuggestions);
      setIsGenerating(false);
    }, 2000);
  };
  
  useEffect(() => {
    generateAISummary();
  }, [state.transactions, state.budgets]);
  
  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-red-600 dark:text-red-400';
      case 'info': return 'text-blue-600 dark:text-blue-400';
      case 'tip': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };
  
  const getBgColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'info': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'tip': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <span>AI Financial Summary</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Personalized insights and recommendations based on your spending patterns.
          </p>
        </div>
        <button
          onClick={generateAISummary}
          disabled={isGenerating}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Analyzing...' : 'Refresh Analysis'}</span>
        </button>
      </div>
      
      {isGenerating ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center justify-center space-x-3">
            <Brain className="w-8 h-8 text-purple-600 animate-pulse" />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                AI is analyzing your financial data...
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Generating personalized insights and recommendations
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {suggestions.map((suggestion, index) => {
            const IconComponent = suggestion.icon;
            return (
              <div
                key={index}
                className={`p-6 rounded-2xl border ${getBgColor(suggestion.type)} hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 ${getIconColor(suggestion.type)}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {suggestion.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {suggestion.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            How AI Analysis Works
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">Analyzes spending patterns</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">Compares against budgets</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">Provides actionable insights</span>
          </div>
        </div>
      </div>
    </div>
  );
}