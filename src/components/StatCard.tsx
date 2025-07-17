import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  gradient?: string;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon,
  gradient = 'from-blue-500 to-blue-600'
}: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {change && (
            <p className={clsx(
              'text-sm mt-2 flex items-center',
              changeType === 'positive' && 'text-emerald-600 dark:text-emerald-400',
              changeType === 'negative' && 'text-red-600 dark:text-red-400',
              changeType === 'neutral' && 'text-gray-600 dark:text-gray-400'
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={clsx(
          'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
          gradient
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}