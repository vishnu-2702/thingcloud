import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [websocketSupported, setWebsocketSupported] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      initializeSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user]);

  const initializeSocket = async () => {
    // Check if backend supports WebSockets
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    
    // Skip WebSocket in known serverless environments
    const isVercelBackend = socketUrl.includes('vercel.app');
    const isAwsLambda = socketUrl.includes('amazonaws.com');
    const isServerless = isVercelBackend || isAwsLambda;
    
    if (isServerless) {
      console.warn('⚠️  Serverless backend detected - WebSocket disabled, using polling fallback');
      setConnected(false);
      setWebsocketSupported(false);
      return;
    }

    // Check backend capabilities via health endpoint
    try {
      const healthResponse = await fetch(`${apiUrl.replace('/api', '')}/health`);
      const health = await healthResponse.json();
      
      if (health.data?.features?.websocket === false) {
        console.warn('⚠️  Backend does not support WebSocket - using polling fallback');
        setConnected(false);
        setWebsocketSupported(false);
        return;
      }
    } catch (healthError) {
      console.warn('Could not check backend capabilities, attempting WebSocket connection anyway');
    }

    try {
      const token = localStorage.getItem('token');
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
      
      // Configure socket with fallback transports and error handling
      const socketInstance = io(socketUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        autoConnect: true,
        forceNew: true
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected successfully');
        setConnected(true);
        setConnectionAttempts(0);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.warn('Socket connection failed, continuing without real-time features:', error.message);
        setConnected(false);
        setConnectionAttempts(prev => prev + 1);
        
        // Stop trying after 3 attempts to avoid spam
        if (connectionAttempts >= 2) {
          socketInstance.disconnect();
          console.log('Socket connection disabled after multiple failures');
        }
      });

      socketInstance.on('reconnect_error', (error) => {
        console.warn('Socket reconnection failed:', error.message);
        setConnected(false);
      });

      setSocket(socketInstance);
    } catch (error) {
      console.warn('Failed to initialize socket, continuing without real-time features:', error);
      setConnected(false);
    }
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    }
  };

  const value = {
    socket,
    connected,
    websocketSupported,
    initializeSocket,
    disconnectSocket
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
