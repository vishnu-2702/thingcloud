import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { userAPI } from '../services/userAPI';
import toast from 'react-hot-toast';
import { 
  Settings, 
  Bell, 
  Moon, 
  Globe, 
  Shield, 
  Wifi,
  Save,
  RefreshCw,
  Sun,
  Monitor,
  ChevronRight,
  Clock,
  Smartphone,
  Key,
  AlertTriangle,
  Check
} from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const { theme, changeTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    emailNotifications: true,
    pushNotifications: true,
    deviceAlerts: true,
    systemUpdates: false,
    autoConnect: true,
    dataSync: true,
    connectionTimeout: 30,
    retryAttempts: 3,
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginAlerts: true,
    apiAccess: false
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await userAPI.updateSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Settings save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      emailNotifications: true,
      pushNotifications: true,
      deviceAlerts: true,
      systemUpdates: false,
      autoConnect: true,
      dataSync: true,
      connectionTimeout: 30,
      retryAttempts: 3,
      twoFactorAuth: false,
      sessionTimeout: 30,
      loginAlerts: true,
      apiAccess: false
    });
    toast.success('Settings reset to defaults');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'devices', label: 'Devices', icon: Wifi },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  // Toggle Switch Component
  const Toggle = ({ checked, onChange, disabled = false }) => (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        checked 
          ? 'bg-black dark:bg-white' 
          : 'bg-neutral-200 dark:bg-neutral-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div 
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-neutral-900 shadow-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );

  // Setting Row Component
  const SettingRow = ({ title, description, children }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 min-w-0 pr-4">
        <h4 className="text-sm font-medium text-black dark:text-white">{title}</h4>
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-white">Settings</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Configure your application preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
            {/* General Settings */}
            {activeTab === 'general' && (
              <>
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-sm font-medium text-black dark:text-white">General Settings</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Customize your display and regional preferences</p>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Theme Selection */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                      Appearance
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'auto', label: 'System', icon: Monitor }
                      ].map((option) => {
                        const Icon = option.icon;
                        const isSelected = theme === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => changeTheme(option.value)}
                            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-black dark:border-white bg-neutral-50 dark:bg-neutral-800'
                                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-black dark:text-white' : 'text-neutral-400'}`} />
                            <span className={`text-xs font-medium ${isSelected ? 'text-black dark:text-white' : 'text-neutral-500'}`}>
                              {option.label}
                            </span>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-4 h-4 bg-black dark:bg-white rounded-full flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white dark:text-black" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Language
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <select
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700 appearance-none cursor-pointer"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 rotate-90" />
                    </div>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Timezone
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleSettingChange('timezone', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700 appearance-none cursor-pointer"
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="EST">EST (Eastern Standard Time)</option>
                        <option value="PST">PST (Pacific Standard Time)</option>
                        <option value="GMT">GMT (Greenwich Mean Time)</option>
                        <option value="CET">CET (Central European Time)</option>
                        <option value="JST">JST (Japan Standard Time)</option>
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 rotate-90" />
                    </div>
                  </div>

                  {/* Date Format */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                      Date Format
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'MM/DD/YYYY', example: '12/31/2024' },
                        { value: 'DD/MM/YYYY', example: '31/12/2024' },
                        { value: 'YYYY-MM-DD', example: '2024-12-31' }
                      ].map((format) => (
                        <label
                          key={format.value}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            settings.dateFormat === format.value
                              ? 'border-black dark:border-white bg-neutral-50 dark:bg-neutral-800'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="dateFormat"
                              value={format.value}
                              checked={settings.dateFormat === format.value}
                              onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              settings.dateFormat === format.value
                                ? 'border-black dark:border-white'
                                : 'border-neutral-300 dark:border-neutral-600'
                            }`}>
                              {settings.dateFormat === format.value && (
                                <div className="w-2 h-2 rounded-full bg-black dark:bg-white" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-black dark:text-white">{format.value}</span>
                          </div>
                          <span className="text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                            {format.example}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <>
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-sm font-medium text-black dark:text-white">Notification Preferences</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Choose how you want to be notified</p>
                </div>
                
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  <div className="px-6">
                    <SettingRow
                      title="Email Notifications"
                      description="Receive notifications via email"
                    >
                      <Toggle
                        checked={settings.emailNotifications}
                        onChange={(value) => handleSettingChange('emailNotifications', value)}
                      />
                    </SettingRow>
                  </div>

                  <div className="px-6">
                    <SettingRow
                      title="Push Notifications"
                      description="Receive browser push notifications"
                    >
                      <Toggle
                        checked={settings.pushNotifications}
                        onChange={(value) => handleSettingChange('pushNotifications', value)}
                      />
                    </SettingRow>
                  </div>

                  <div className="px-6">
                    <SettingRow
                      title="Device Alerts"
                      description="Get notified about device status changes"
                    >
                      <Toggle
                        checked={settings.deviceAlerts}
                        onChange={(value) => handleSettingChange('deviceAlerts', value)}
                      />
                    </SettingRow>
                  </div>

                  <div className="px-6">
                    <SettingRow
                      title="System Updates"
                      description="Notifications about platform updates"
                    >
                      <Toggle
                        checked={settings.systemUpdates}
                        onChange={(value) => handleSettingChange('systemUpdates', value)}
                      />
                    </SettingRow>
                  </div>
                </div>
              </>
            )}

            {/* Devices */}
            {activeTab === 'devices' && (
              <>
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-sm font-medium text-black dark:text-white">Device Settings</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Configure device connection behavior</p>
                </div>
                
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  <div className="px-6">
                    <SettingRow
                      title="Auto Connect"
                      description="Automatically connect to available devices"
                    >
                      <Toggle
                        checked={settings.autoConnect}
                        onChange={(value) => handleSettingChange('autoConnect', value)}
                      />
                    </SettingRow>
                  </div>

                  <div className="px-6">
                    <SettingRow
                      title="Data Sync"
                      description="Synchronize device data automatically"
                    >
                      <Toggle
                        checked={settings.dataSync}
                        onChange={(value) => handleSettingChange('dataSync', value)}
                      />
                    </SettingRow>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                          Connection Timeout
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={settings.connectionTimeout}
                            onChange={(e) => handleSettingChange('connectionTimeout', parseInt(e.target.value))}
                            min={5}
                            max={120}
                            className="w-full px-4 py-2.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">seconds</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                          Retry Attempts
                        </label>
                        <input
                          type="number"
                          value={settings.retryAttempts}
                          onChange={(e) => handleSettingChange('retryAttempts', parseInt(e.target.value))}
                          min={1}
                          max={10}
                          className="w-full px-4 py-2.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <>
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-sm font-medium text-black dark:text-white">Security Settings</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Manage your account security</p>
                </div>
                
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  <div className="px-6">
                    <SettingRow
                      title="Two-Factor Authentication"
                      description="Add an extra layer of security"
                    >
                      <Toggle
                        checked={settings.twoFactorAuth}
                        onChange={(value) => handleSettingChange('twoFactorAuth', value)}
                      />
                    </SettingRow>
                  </div>

                  <div className="px-6">
                    <SettingRow
                      title="Login Alerts"
                      description="Get notified of new login attempts"
                    >
                      <Toggle
                        checked={settings.loginAlerts}
                        onChange={(value) => handleSettingChange('loginAlerts', value)}
                      />
                    </SettingRow>
                  </div>

                  <div className="px-6">
                    <SettingRow
                      title="API Access"
                      description="Allow third-party API access"
                    >
                      <Toggle
                        checked={settings.apiAccess}
                        onChange={(value) => handleSettingChange('apiAccess', value)}
                      />
                    </SettingRow>
                  </div>

                  <div className="p-6">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Session Timeout
                    </label>
                    <div className="relative max-w-xs">
                      <input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                        min={5}
                        max={480}
                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">minutes</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">
                      Session expires after this period of inactivity
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">Security Recommendation</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          Enable two-factor authentication and set session timeout to 30 minutes or less for enhanced security.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
