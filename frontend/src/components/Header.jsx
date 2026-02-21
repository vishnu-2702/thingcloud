import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import { Menu, Bell, Settings, LogOut, User, ChevronDown, Sun, Moon, Cloud, AlertTriangle, CheckCircle, Info, X, Clock, ExternalLink } from 'lucide-react';
import { alertAPI } from '../services/alertAPI';
import toast from 'react-hot-toast';

const Header = ({ onMenuClick, sidebarOpen }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const { connected, socket } = useSocket();
  const { isDark, toggleTheme } = useTheme();

  // Fetch alerts on mount
  useEffect(() => {
    fetchAlerts();
  }, []);

  // Listen for real-time alerts via socket
  useEffect(() => {
    if (socket && connected) {
      console.log('[Header] Setting up real-time alert listeners');
      
      const handleNewAlert = (alert) => {
        console.log('[Header] Received newAlert via socket:', alert);
        
        // Map 'id' to 'alertId' for consistency
        const alertWithCorrectId = {
          ...alert,
          alertId: alert.alertId || alert.id
        };
        
        // Update alerts state immediately
        setAlerts(prev => {
          // Prevent duplicates by checking if alert already exists
          const exists = prev.some(a => 
            (a.alertId === alertWithCorrectId.alertId) || 
            (a.id === alertWithCorrectId.id)
          );
          
          if (exists) {
            console.log('[Header] Alert already exists, skipping duplicate');
            return prev;
          }
          
          console.log('[Header] Adding new alert to notifications');
          return [alertWithCorrectId, ...prev];
        });
        
        // Update unread count immediately
        setUnreadCount(prev => {
          const newCount = prev + 1;
          console.log(`[Header] Unread count updated: ${prev} -> ${newCount}`);
          return newCount;
        });
        
        // Show toast notification
        if (alert.severity === 'critical') {
          toast.error(alert.message);
        } else {
          toast.success(alert.message);
        }
      };

      const handleAlertResolved = (alertId) => {
        console.log('[Header] Alert resolved:', alertId);
        setAlerts(prev => 
          prev.map(alert => 
            (alert.alertId === alertId || alert.id === alertId)
              ? { ...alert, status: 'resolved' }
              : alert
          )
        );
      };

      // Remove any existing listeners to prevent duplicates
      socket.off('newAlert');
      socket.off('alertResolved');
      
      // Add new listeners
      socket.on('newAlert', handleNewAlert);
      socket.on('alertResolved', handleAlertResolved);

      return () => {
        socket.off('newAlert', handleNewAlert);
        socket.off('alertResolved', handleAlertResolved);
      };
    }
  }, [socket, connected]);

  // Polling fallback when socket is not connected (e.g., Vercel serverless)
  useEffect(() => {
    let pollInterval;
    
    // If socket is not connected, poll for alerts every 10 seconds
    if (!connected) {
      console.log('[Header] Socket not connected - enabling polling fallback');
      pollInterval = setInterval(() => {
        fetchAlerts();
      }, 10000); // Poll every 10 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [connected]);

  const fetchAlerts = async () => {
    try {
      const data = await alertAPI.getAlerts();
      // Map 'id' to 'alertId' for consistency
      const alertsWithCorrectId = (data.alerts || []).map(alert => ({
        ...alert,
        alertId: alert.id || alert.alertId // Support both field names
      }));
      setAlerts(alertsWithCorrectId);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const markAlertAsRead = async (alertId) => {
    if (!alertId) {
      toast.error('Invalid alert ID');
      return;
    }
    
    try {
      await alertAPI.markAsRead(alertId);
      setAlerts(prev =>
        prev.map(alert =>
          alert.alertId === alertId ? { ...alert, read: true } : alert
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Alert marked as read');
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast.error('Failed to mark alert as read');
    }
  };

  const deleteAlert = async (alertId) => {
    if (!alertId) {
      toast.error('Invalid alert ID');
      return;
    }
    
    try {
      await alertAPI.deleteAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.alertId !== alertId));
      toast.success('Alert deleted');
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Failed to delete alert');
    }
  };

  const getAlertIcon = (type, severity) => {
    if (severity === 'critical' || severity === 'warning') {
      return <AlertTriangle className="w-4 h-4" />;
    } else if (type === 'device_online') {
      return <CheckCircle className="w-4 h-4" />;
    } else {
      return <Info className="w-4 h-4" />;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
      case 'info':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setShowUserMenu(false);
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 h-14 flex items-center justify-between px-4 sticky top-0 z-30 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>

        {/* Mobile Logo - Only visible on mobile when sidebar is hidden */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Cloud className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ThingCloud</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Connection Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Connected</span>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          aria-label="Toggle theme"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowAlertMenu(!showAlertMenu);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-neutral-950">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Alert Dropdown */}
          {showAlertMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowAlertMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Alert Header */}
                <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-neutral-900 dark:bg-white rounded-lg">
                        <Bell size={14} className="text-white dark:text-neutral-900" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{unreadCount} unread</p>
                        )}
                      </div>
                    </div>
                    {alerts.length > 0 && (
                      <button 
                        onClick={() => {
                          alerts.filter(a => !a.read).forEach(a => markAlertAsRead(a.alertId));
                        }}
                        className="text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                {/* Alert List */}
                <div className="overflow-y-auto max-h-[400px] divide-y divide-neutral-100 dark:divide-neutral-800">
                  {alerts.length === 0 ? (
                    <div className="py-12 px-4 text-center">
                      <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
                      </div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">All caught up!</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">No new notifications</p>
                    </div>
                  ) : (
                    alerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.alertId || alert.id || Math.random()}
                        className={`group px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer ${
                          !alert.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Alert Icon */}
                          <div className={`p-2 rounded-lg flex-shrink-0 ${getAlertColor(alert.severity)}`}>
                            {getAlertIcon(alert.type, alert.severity)}
                          </div>
                          
                          {/* Alert Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm leading-snug ${!alert.read ? 'font-medium text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                {alert.message}
                              </p>
                              {!alert.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Clock size={12} className="text-neutral-400" />
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formatTimeAgo(alert.createdAt)}
                              </p>
                              {alert.deviceName && (
                                <>
                                  <span className="text-neutral-300 dark:text-neutral-600">•</span>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                    {alert.deviceName}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!alert.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAlertAsRead(alert.alertId);
                                }}
                                className="p-1.5 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAlert(alert.alertId);
                              }}
                              className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {alerts.length > 0 && (
                  <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-800">
                    <Link 
                      to="/app/alerts"
                      onClick={() => setShowAlertMenu(false)}
                      className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      View All Notifications
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative ml-1">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowAlertMenu(false);
            }}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            aria-expanded={showUserMenu}
          >
            <div className="w-7 h-7 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-black text-xs font-medium">
              {getUserInitials()}
            </div>
            <ChevronDown size={14} className={`text-neutral-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl z-50 overflow-hidden">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="font-medium text-neutral-900 dark:text-white text-sm truncate">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                    {user?.email || ''}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <Link
                    to="/app/profile"
                    className="flex items-center gap-3 px-4 py-2 text-[13px] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User size={15} />
                    Profile
                  </Link>
                  <Link
                    to="/app/settings"
                    className="flex items-center gap-3 px-4 py-2 text-[13px] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings size={15} />
                    Settings
                  </Link>
                </div>
                <div className="border-t border-neutral-200 dark:border-neutral-800 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
