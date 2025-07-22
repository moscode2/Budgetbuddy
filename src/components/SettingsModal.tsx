import React, { useState } from 'react';
import { X, User, Bell, Shield, Palette, Download, Upload, Trash2, Edit2, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, logout, updateProfile, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState({ name: false, email: false });
  const [editValues, setEditValues] = useState({ name: user?.name || '', email: user?.email || '' });
  const [isLoading, setIsLoading] = useState({ profile: false, delete: false });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [notifications, setNotifications] = useState({
    budgetAlerts: true,
    monthlyReports: true,
    reminders: false
  });

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data', icon: Download }
  ];

  const handleSaveProfile = async (field: 'name' | 'email') => {
    setIsLoading(prev => ({ ...prev, profile: true }));
    
    try {
      await updateProfile({ [field]: editValues[field] });
      setIsEditing(prev => ({ ...prev, [field]: false }));
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const handleCancelEdit = (field: 'name' | 'email') => {
    setEditValues(prev => ({ ...prev, [field]: user?.[field] || '' }));
    setIsEditing(prev => ({ ...prev, [field]: false }));
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    
    setIsLoading(prev => ({ ...prev, delete: true }));
    
    try {
      await deleteAccount();
      onClose();
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h3>
        
        {/* Name Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
          <div className="flex items-center space-x-2">
            {isEditing.name ? (
              <>
                <input
                  type="text"
                  value={editValues.name}
                  onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={() => handleSaveProfile('name')}
                  disabled={isLoading.profile}
                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                >
                  {isLoading.profile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleCancelEdit('name')}
                  className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 px-3 py-2 text-gray-900 dark:text-white">{user?.name}</span>
                <button
                  onClick={() => setIsEditing(prev => ({ ...prev, name: true }))}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
          <div className="flex items-center space-x-2">
            {isEditing.email ? (
              <>
                <input
                  type="email"
                  value={editValues.email}
                  onChange={(e) => setEditValues(prev => ({ ...prev, email: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={() => handleSaveProfile('email')}
                  disabled={isLoading.profile}
                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                >
                  {isLoading.profile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleCancelEdit('email')}
                  className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 px-3 py-2 text-gray-900 dark:text-white">{user?.email}</span>
                <button
                  onClick={() => setIsEditing(prev => ({ ...prev, email: true }))}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h4>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">Delete Account</h5>
          <p className="text-sm text-red-600 dark:text-red-300 mb-4">
            This action cannot be undone. This will permanently delete your account and all associated data.
          </p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Type 'DELETE' to confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-red-900/20 dark:text-white"
            />
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE' || isLoading.delete}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading.delete ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
      
      {Object.entries(notifications).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between py-3">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {key === 'budgetAlerts' && 'Budget Alerts'}
              {key === 'monthlyReports' && 'Monthly Reports'}
              {key === 'reminders' && 'Payment Reminders'}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {key === 'budgetAlerts' && 'Get notified when you approach budget limits'}
              {key === 'monthlyReports' && 'Receive monthly spending summaries'}
              {key === 'reminders' && 'Reminders for recurring payments'}
            </p>
          </div>
          <button
            onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance Settings</h3>
      
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Theme</h4>
        <div className="grid grid-cols-3 gap-3">
          {['light', 'dark', 'auto'].map((themeOption) => (
            <button
              key={themeOption}
              onClick={() => setTheme(themeOption as any)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                theme === themeOption
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {themeOption}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Currency</h4>
        <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="JPY">JPY (¥)</option>
        </select>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Management</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">Export Data</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Download your financial data as CSV</p>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">Import Data</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Import transactions from CSV file</p>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy Settings</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">Data Analytics</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Help improve our service by sharing anonymous usage data</p>
          </div>
          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors">
            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
            {activeTab === 'privacy' && renderPrivacyTab()}
            {activeTab === 'appearance' && renderAppearanceTab()}
            {activeTab === 'data' && renderDataTab()}
          </div>
        </div>
      </div>
    </div>
  );
};