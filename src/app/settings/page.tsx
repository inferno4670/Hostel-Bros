'use client';

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Settings, 
  Moon, 
  Sun, 
  Monitor, 
  User, 
  Bell, 
  Shield, 
  Download,
  Smartphone,
  Wifi,
  Database,
  Trash2,
  LogOut,
  Info,
  HelpCircle
} from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    messages: true,
    events: true,
    expenses: false,
    wall: true,
  });

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  const clearAppData = () => {
    if (window.confirm('This will clear all local app data. Are you sure?')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  const installApp = () => {
    // Check if PWA can be installed
    if ('serviceWorker' in navigator && 'share' in navigator) {
      alert('To install Hostel-Bros:\n\n1. Tap the share button in your browser\n2. Select "Add to Home Screen"\n3. Tap "Add" to install');
    } else {
      alert('PWA installation is available in supported browsers like Chrome, Safari, or Edge.');
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Settings className="h-8 w-8 mr-3 text-blue-600" />
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Customize your Hostel-Bros experience</p>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile
          </h2>
          
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500 rounded-full p-3">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{user?.name}</h3>
              <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
              <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full mt-1">
                {user?.role === 'admin' ? 'Admin' : 'Resident'}
              </span>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            {actualTheme === 'dark' ? (
              <Moon className="h-5 w-5 mr-2" />
            ) : (
              <Sun className="h-5 w-5 mr-2" />
            )}
            Appearance
          </h2>
          
          <div className="space-y-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value={option.value}
                    checked={theme === option.value}
                    onChange={(e) => setTheme(e.target.value as any)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </h2>
          
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white capitalize">
                  {key === 'wall' ? 'Social Wall' : key}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotifications(prev => ({ 
                      ...prev, 
                      [key]: e.target.checked 
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* App Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            App Management
          </h2>
          
          <div className="space-y-4">
            <button
              onClick={installApp}
              className="w-full flex items-center justify-between p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <Download className="h-5 w-5 mr-3 text-blue-600" />
                <span className="text-gray-900 dark:text-white">Install App</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Add to home screen</span>
            </button>

            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center">
                <Wifi className="h-5 w-5 mr-3 text-green-600" />
                <span className="text-gray-900 dark:text-white">Offline Support</span>
              </div>
              <span className="text-sm text-green-600">Enabled</span>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center">
                <Database className="h-5 w-5 mr-3 text-blue-600" />
                <span className="text-gray-900 dark:text-white">Storage</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Google Drive</span>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Privacy & Security
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <div className="text-gray-900 dark:text-white">Data Storage</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Files stored in your Google Drive</div>
              </div>
              <span className="text-sm text-green-600">Secure</span>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <div className="text-gray-900 dark:text-white">Authentication</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Google OAuth 2.0</div>
              </div>
              <span className="text-sm text-green-600">Protected</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-red-500">
          <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
          
          <div className="space-y-3">
            <button
              onClick={clearAppData}
              className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear App Data
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Info className="h-5 w-5 mr-2" />
            About
          </h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">App Name</span>
              <span className="text-gray-900 dark:text-white">Hostel-Bros</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Version</span>
              <span className="text-gray-900 dark:text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Type</span>
              <span className="text-gray-900 dark:text-white">Progressive Web App</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Storage</span>
              <span className="text-gray-900 dark:text-white">100% Free</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help & Support
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}