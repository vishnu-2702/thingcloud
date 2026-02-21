import React, { useMemo, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Cpu, 
  Layers, 
  BarChart3, 
  Plus, 
  User,
  Users,
  Settings,
  Bell,
  X,
  Activity,
  Cloud
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/userAPI';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isSubUser = user?.role === 'sub-user';
  const isAdmin = user?.role === 'admin';
  
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    totalTemplates: 0
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await userAPI.getStats();
      setStats({
        totalDevices: response.stats.totalDevices || 0,
        activeDevices: response.stats.onlineDevices || 0,
        totalTemplates: response.stats.totalTemplates || 0
      });
    } catch (error) {
      console.error('Error fetching sidebar stats:', error);
    }
  };

  const allNavigationItems = [
    {
      name: 'Overview',
      path: '/app/dashboard',
      icon: Home,
      roles: ['admin', 'sub-user']
    },
    {
      name: 'Devices',
      path: '/app/devices',
      icon: Cpu,
      roles: ['admin', 'sub-user']
    },
    {
      name: 'Templates',
      path: '/app/templates',
      icon: Layers,
      roles: ['admin']
    },
    {
      name: 'Alerts',
      path: '/app/alerts',
      icon: Bell,
      roles: ['admin', 'sub-user']
    },
    {
      name: 'Users',
      path: '/app/users',
      icon: Users,
      roles: ['admin']
    },
    {
      name: 'Analytics',
      path: '/app/analytics',
      icon: BarChart3,
      roles: ['admin', 'sub-user']
    },
  ];

  const settingsItems = [
    {
      name: 'Profile',
      path: '/app/profile',
      icon: User,
      roles: ['admin', 'sub-user']
    },
    {
      name: 'Settings',
      path: '/app/settings',
      icon: Settings,
      roles: ['admin', 'sub-user']
    }
  ];

  const allQuickActions = [
    {
      name: 'New Device',
      path: '/app/devices/register',
      icon: Plus,
      roles: ['admin']
    },
    {
      name: 'New Template',
      path: '/app/templates/new',
      icon: Plus,
      roles: ['admin']
    }
  ];

  // Filter navigation items based on user role
  const navigationItems = useMemo(() => {
    if (!user) return [];
    return allNavigationItems.filter(item => 
      item.roles.includes(user.role || 'admin')
    );
  }, [user]);

  const filteredSettingsItems = useMemo(() => {
    if (!user) return [];
    return settingsItems.filter(item => 
      item.roles.includes(user.role || 'admin')
    );
  }, [user]);

  // Filter quick actions based on user role
  const quickActions = useMemo(() => {
    if (!user) return [];
    return allQuickActions.filter(action => 
      action.roles.includes(user.role || 'admin')
    );
  }, [user]);

  return (
    <aside 
      className={`
        fixed top-0 left-0 z-50 w-60 h-screen
        bg-white dark:bg-neutral-950
        border-r border-neutral-200 dark:border-neutral-800
        flex flex-col
        transform transition-transform duration-200 ease-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Logo / Brand */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Cloud className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-[15px] bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">ThingCloud</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 min-h-0">
        {/* Main Navigation */}
        <div className="space-y-0.5">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium
                  transition-colors duration-100
                  ${isActive 
                    ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white' 
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 hover:text-neutral-900 dark:hover:text-white'
                  }
                `}
                onClick={() => window.innerWidth < 1024 && onClose()}
              >
                <IconComponent size={16} strokeWidth={2} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <p className="px-3 mb-2 text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Quick Actions
            </p>
            <div className="space-y-0.5">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <NavLink
                    key={action.path}
                    to={action.path}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    onClick={() => window.innerWidth < 1024 && onClose()}
                  >
                    <div className="w-5 h-5 rounded border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center">
                      <IconComponent size={12} />
                    </div>
                    <span>{action.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <p className="px-3 mb-2 text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            Account
          </p>
          <div className="space-y-0.5">
            {filteredSettingsItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium
                    transition-colors duration-100
                    ${isActive 
                      ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white' 
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 hover:text-neutral-900 dark:hover:text-white'
                    }
                  `}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                >
                  <IconComponent size={16} strokeWidth={2} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Status Footer */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex-shrink-0">
        <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900 p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <p className="text-base font-semibold text-neutral-900 dark:text-white">{stats.totalDevices}</p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Devices</p>
            </div>
            <div className="text-center p-2 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <p className="text-base font-semibold text-neutral-900 dark:text-white">{stats.activeDevices}</p>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Active</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
