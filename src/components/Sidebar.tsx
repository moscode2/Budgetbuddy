import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  PiggyBank, 
  BarChart3, 
  Settings,
  Moon,
  Sun
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import clsx from 'clsx';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'budgets', label: 'Budgets', icon: PiggyBank },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
] as const;

export function Sidebar() {
  const { state, dispatch } = useApp();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <PiggyBank className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Budget Buddy</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Smart Finance</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-6">
        <ul className="space-y-2">
          {navItems.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                onClick={() => dispatch({ type: 'SET_VIEW', payload: id })}
                className={clsx(
                  'w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200',
                  state.currentView === id
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">JD</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Free Plan</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <Sun className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Settings className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}