/**
 * Socket.IO Handler
 * Real-time WebSocket communication management
 */

const jwt = require('jsonwebtoken');
const config = require('../config/app');
const deviceService = require('../services/deviceService');
const telemetryService = require('../services/telemetryService');
const alertService = require('../services/alertService');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.setupMiddleware();
    this.setupConnectionHandling();
    this.startDeviceMonitoring(); // Start device monitoring
  }

  /**
   * Start device monitoring job
   * Checks every minute for inactive devices and marks them offline
   */
  startDeviceMonitoring() {
    console.log('[Device Monitor] Starting device inactivity monitoring...');
    
    // Run immediately on startup
    this.checkDeviceInactivity();
    
    // Run every minute
    this.deviceMonitorInterval = setInterval(async () => {
      await this.checkDeviceInactivity();
    }, 60000); // 60 seconds = 1 minute
  }

  /**
   * Check device inactivity and mark offline if needed
   * Works independently of WebSocket connections
   */
  async checkDeviceInactivity() {
    try {
      const statusChanges = await deviceService.checkDeviceInactivity();
      
      // Process each status change
      for (const change of statusChanges) {
        console.log(`[Device Monitor] Device ${change.deviceName} went offline after ${change.inactiveDuration} minutes`);
        
        // Emit status change to user (only if WebSocket is active)
        try {
          this.emitDeviceStatusChange(
            change.deviceId,
            change.userId,
            change.status,
            change.lastSeen
          );
        } catch (emitError) {
          // WebSocket emission is optional - system still works without it
          console.log(`[Device Monitor] WebSocket not available for status update (device: ${change.deviceName})`);
        }
        
        // Create alert for offline device (non-blocking)
        try {
          const alert = await alertService.createDeviceOfflineAlert(
            change.userId,
            change.deviceId,
            change.deviceName,
            change.inactiveDuration
          );
          
          // Try to emit alert notification to user
          try {
            this.io.to(`user:${change.userId}`).emit('newAlert', alert);
          } catch (alertEmitError) {
            console.log(`[Alert] WebSocket not available for alert emission (device: ${change.deviceName})`);
          }
          
          console.log(`[Alert] Created offline alert for device ${change.deviceName}`);
        } catch (alertError) {
          console.error('[Alert] Error creating offline alert:', alertError);
        }
      }
      
      if (statusChanges.length > 0) {
        console.log(`[Device Monitor] Marked ${statusChanges.length} device(s) as offline`);
      }
    } catch (error) {
      console.error('[Device Monitor] Error checking device inactivity:', error);
    }
  }

  /**
   * Stop device monitoring (for graceful shutdown)
   */
  stopDeviceMonitoring() {
    if (this.deviceMonitorInterval) {
      clearInterval(this.deviceMonitorInterval);
      console.log('[Device Monitor] Device monitoring stopped');
    }
  }

  /**
   * Setup Socket.IO middleware
   */
  setupMiddleware() {
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, config.JWT.SECRET);
        socket.userId = decoded.userId;
        socket.userEmail = decoded.email;
        socket.userRole = decoded.role || 'user';
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  /**
   * Setup connection event handling
   */
  setupConnectionHandling() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id} (User: ${socket.userEmail})`);

      // Connection tracking
      const connectionData = {
        socketId: socket.id,
        userId: socket.userId,
        userEmail: socket.userEmail,
        userRole: socket.userRole,
        connectedAt: Date.now(),
        lastActivity: Date.now()
      };

      // Set connection timeout
      const connectionTimeout = this.setConnectionTimeout(socket);

      // Auto-join user room
      this.joinUserRoom(socket);

      // Setup event handlers
      this.setupEventHandlers(socket, connectionTimeout);
    });
  }

  /**
   * Set connection timeout
   */
  setConnectionTimeout(socket) {
    return setTimeout(() => {
      if (socket.connected) {
        console.warn(`Disconnecting idle socket: ${socket.id}`);
        socket.disconnect(true);
      }
    }, 300000); // 5 minutes idle timeout
  }

  /**
   * Auto-join user room
   */
  joinUserRoom(socket) {
    try {
      socket.join(`user:${socket.userId}`);
      console.log(`Socket ${socket.id} joined user room: ${socket.userId}`);
    } catch (error) {
      console.error('Error joining user room:', error);
    }
  }

  /**
   * Setup event handlers for socket
   */
  setupEventHandlers(socket, connectionTimeout) {
    // Update activity tracker
    const updateActivity = () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        this.setConnectionTimeout(socket);
      }
    };

    // Track activity on any event
    socket.onAny(updateActivity);

    // User room management
    socket.on('join-user-room', (userId) => {
      this.handleJoinUserRoom(socket, userId);
    });

    // Device room management
    socket.on('join-device-room', async (deviceId) => {
      await this.handleJoinDeviceRoom(socket, deviceId);
    });

    socket.on('leave-device-room', (deviceId) => {
      this.handleLeaveDeviceRoom(socket, deviceId);
    });

    // Device commands
    socket.on('device-command', async (data) => {
      await this.handleDeviceCommand(socket, data);
    });

    // Heartbeat
    socket.on('ping', () => {
      updateActivity();
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Disconnect handling
    socket.on('disconnect', (reason) => {
      this.handleDisconnect(socket, reason, connectionTimeout);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  }

  /**
   * Handle join user room event
   */
  handleJoinUserRoom(socket, userId) {
    try {
      if (userId === socket.userId) {
        socket.join(`user:${userId}`);
        console.log(`Socket ${socket.id} joined user room: ${userId}`);
        socket.emit('room-joined', { room: `user:${userId}`, status: 'success' });
      } else {
        console.warn(`Unauthorized room join attempt: ${socket.id} -> ${userId}`);
        socket.emit('room-joined', { room: `user:${userId}`, status: 'unauthorized' });
      }
    } catch (error) {
      console.error('Error joining user room:', error);
      socket.emit('room-joined', { room: `user:${userId}`, status: 'error' });
    }
  }

  /**
   * Handle join device room event
   */
  async handleJoinDeviceRoom(socket, deviceId) {
    try {
      // Verify device ownership
      const device = await deviceService.getDeviceByIdForUser(deviceId, socket.userId);
      
      socket.join(`device:${deviceId}`);
      console.log(`Socket ${socket.id} joined device room: ${deviceId}`);
      socket.emit('device-room-joined', { deviceId, status: 'success' });
    } catch (error) {
      console.warn(`Unauthorized device room join: ${socket.id} -> ${deviceId}`);
      socket.emit('device-room-joined', { deviceId, status: 'unauthorized' });
    }
  }

  /**
   * Handle leave device room event
   */
  handleLeaveDeviceRoom(socket, deviceId) {
    try {
      socket.leave(`device:${deviceId}`);
      console.log(`Socket ${socket.id} left device room: ${deviceId}`);
      socket.emit('device-room-left', { deviceId, status: 'success' });
    } catch (error) {
      console.error('Error leaving device room:', error);
      socket.emit('device-room-left', { deviceId, status: 'error' });
    }
  }

  /**
   * Handle device command event
   */
  async handleDeviceCommand(socket, data) {
    try {
      const { deviceId, command, value, parameters } = data;
      
      if (!deviceId || (!command && value === undefined)) {
        socket.emit('command-error', { error: 'Missing deviceId or command/value' });
        return;
      }

      // Verify device ownership
      await deviceService.getDeviceByIdForUser(deviceId, socket.userId);

      // Store command in telemetry
      const commandData = await telemetryService.storeDeviceCommand(
        deviceId, 
        socket.userId, 
        { command, parameters, value }
      );

      // Emit command to device
      const commandPayload = {
        commandId: commandData.commandId,
        command,
        value,
        parameters,
        timestamp: commandData.timestamp,
        from: socket.id
      };

      this.io.to(`device:${deviceId}`).emit('command', commandPayload);
      socket.emit('command-sent', commandPayload);
      
      console.log(`Command sent to device ${deviceId}:`, command, value);
    } catch (error) {
      console.error('Error sending device command:', error);
      socket.emit('command-error', { error: 'Failed to send command' });
    }
  }

  /**
   * Handle disconnect event
   */
  handleDisconnect(socket, reason, connectionTimeout) {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }
    
    // Clean up any resources if needed
    try {
      // Could add cleanup logic here if needed
    } catch (error) {
      console.error('Error during disconnect cleanup:', error);
    }
  }

  /**
   * Emit telemetry data to relevant clients
   */
  emitTelemetryData(deviceId, userId, data, timestamp) {
    try {
      // Emit to device room (for device-specific dashboards)
      this.io.to(`device:${deviceId}`).emit('telemetry', {
        deviceId,
        data,
        timestamp
      });

      // Emit to user room (for user dashboard)
      this.io.to(`user:${userId}`).emit('telemetryData', {
        deviceId,
        data,
        timestamp
      });
    } catch (error) {
      console.warn('Socket emission failed:', error.message);
    }
  }

  /**
   * Emit device status change
   */
  emitDeviceStatusChange(deviceId, userId, status, lastSeen) {
    try {
      this.io.to(`user:${userId}`).emit('deviceStatusChanged', {
        deviceId,
        status,
        lastSeen
      });
    } catch (error) {
      console.warn('Device status emission failed:', error.message);
    }
  }

  /**
   * Emit device registration event
   */
  emitDeviceRegistered(userId, deviceData) {
    try {
      this.io.to(`user:${userId}`).emit('deviceRegistered', deviceData);
    } catch (error) {
      console.warn('Device registration emission failed:', error.message);
    }
  }

  /**
   * Emit pin update event
   */
  emitPinUpdated(deviceId, userId, pin, value, timestamp) {
    try {
      this.io.to(`user:${userId}`).emit('pinUpdated', {
        deviceId,
        pin,
        value,
        timestamp
      });
    } catch (error) {
      console.warn('Pin update emission failed:', error.message);
    }
  }

  /**
   * Emit alert notification to user
   */
  emitAlert(userId, alert) {
    try {
      this.io.to(`user:${userId}`).emit('newAlert', alert);
      console.log(`[Socket] Emitted alert to user ${userId}:`, alert.message);
    } catch (error) {
      console.warn('Alert emission failed:', error.message);
    }
  }
}

module.exports = SocketHandler;