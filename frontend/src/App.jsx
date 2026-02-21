import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SocketProvider } from './contexts/SocketContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Devices from './pages/Devices.jsx';
import DeviceDetail from './pages/DeviceDetail.jsx';
import DeviceDashboard from './pages/DeviceDashboard.jsx';
import DeviceRegister from './pages/DeviceRegister.jsx';
import Templates from './pages/Templates.jsx';
import TemplateNew from './pages/TemplateNew.jsx';
import TemplateDetail from './pages/TemplateDetail.jsx';
import Alerts from './pages/Alerts.jsx';
import Users from './pages/Users.jsx';
import Analytics from './pages/AnalyticsNew.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';
import Home from './pages/Home.jsx';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900 transition-colors duration-300">
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    className: 'bg-white dark:bg-neutral-900 shadow-lg border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-lg p-4 text-sm font-medium',
                    success: {
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#ffffff',
                      },
                      className: 'bg-white dark:bg-neutral-900 shadow-lg border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-lg p-4 text-sm font-medium',
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#ffffff',
                      },
                      className: 'bg-white dark:bg-neutral-900 shadow-lg border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-lg p-4 text-sm font-medium',
                    },
                  }}
                />
              
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route path="/app" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/app/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="devices" element={<Devices />} />
                  <Route path="devices/register" element={<DeviceRegister />} />
                  <Route path="devices/:id" element={<DeviceDetail />} />
                  <Route path="devices/:id/dashboard" element={<DeviceDashboard />} />
                  <Route path="templates" element={<Templates />} />
                  <Route path="templates/new" element={<TemplateNew />} />
                  <Route path="templates/:id" element={<TemplateDetail />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="users" element={<Users />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </div>
              <VercelAnalytics />
            </Router>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
