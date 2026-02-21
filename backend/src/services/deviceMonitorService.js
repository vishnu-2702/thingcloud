/**
 * Device Monitor Service
 * 
 * Monitors device inactivity and marks devices offline after 5 minutes of no telemetry.
 * Works independently of WebSocket availability (Vercel-compatible).
 * 
 * HOW IT WORKS:
 * 
 * 1. TRADITIONAL SERVER (Non-Serverless):
 *    - Starts an interval timer that checks all devices every 60 seconds
 *    - Compares current time with device.lastSeen timestamp
 *    - Marks devices as 'offline' if lastSeen > 5 minutes ago
 *    - Emits WebSocket events for real-time UI updates (if available)
 * 
 * 2. VERCEL SERVERLESS:
 *    - Background timers don't work in serverless functions
 *    - Uses Vercel Cron Jobs to trigger /api/devices/check-status every 5 minutes
 *    - Frontend also triggers check every 5 minutes as fallback
 *    - Each check scans DynamoDB for inactive devices
 * 
 * 3. DEVICE STATUS UPDATE FLOW:
 *    - Device sends telemetry → lastSeen timestamp updated → status set to 'online'
 *    - No telemetry for 5+ minutes → monitor marks device as 'offline'
 *    - Device sends telemetry again → automatically back to 'online'
 * 
 * 4. ALERT CREATION:
 *    - Creates 'warning' alert if device offline for 10+ minutes
 *    - Creates 'critical' alert if device offline for 30+ minutes
 * 
 * BENEFITS:
 * ✅ Works with or without WebSocket
 * ✅ Compatible with serverless deployments
 * ✅ Multiple trigger mechanisms (cron + frontend polling)
 * ✅ Automatic recovery when device comes back online
 */

const deviceService = require('./deviceService');

class DeviceMonitorService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.CHECK_INTERVAL = 60 * 1000; // Check every 1 minute
    this.socketHandler = null;
  }

  /**
   * Set socket handler for real-time notifications (optional)
   */
  setSocketHandler(socketHandler) {
    this.socketHandler = socketHandler;
  }

  /**
   * Start the device monitor
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Device monitor is already running');
      return;
    }

    console.log('🔍 Starting device inactivity monitor...');
    console.log('   - Check interval: 60 seconds');
    console.log('   - Offline threshold: 5 minutes');
    
    // Run immediately on start
    this.checkDevices();

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.checkDevices();
    }, this.CHECK_INTERVAL);

    this.isRunning = true;
    console.log('✅ Device monitor started successfully');
  }

  /**
   * Stop the device monitor
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Device monitor is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('🛑 Device monitor stopped');
  }

  /**
   * Check all devices for inactivity
   */
  async checkDevices() {
    try {
      const statusChanges = await deviceService.checkDeviceInactivity();

      if (statusChanges.length > 0) {
        console.log(`[Device Monitor] Marked ${statusChanges.length} device(s) as offline`);
        
        // Emit WebSocket events if available (non-serverless environments)
        if (this.socketHandler) {
          for (const change of statusChanges) {
            this.socketHandler.emitDeviceStatusChange(
              change.deviceId,
              change.userId,
              'offline',
              Date.now()
            );
          }
        }

        // Create alerts for critical device disconnections
        await this.createDeviceOfflineAlerts(statusChanges);
      }
    } catch (error) {
      console.error('[Device Monitor] Error checking device inactivity:', error);
    }
  }

  /**
   * Create alerts for devices that went offline
   */
  async createDeviceOfflineAlerts(statusChanges) {
    const alertService = require('./alertService');

    for (const change of statusChanges) {
      try {
        // Only create alert if device was offline for more than 10 minutes
        if (change.inactiveDuration >= 10) {
          await alertService.createAlert(change.userId, {
            deviceId: change.deviceId,
            type: 'device_offline',
            severity: change.inactiveDuration >= 30 ? 'critical' : 'warning',
            message: `Device "${change.deviceName}" went offline`,
            metadata: {
              lastSeen: change.lastSeen,
              inactiveDuration: change.inactiveDuration,
              reason: 'No telemetry received for more than 5 minutes'
            }
          });
        }
      } catch (error) {
        console.error(`[Device Monitor] Failed to create alert for device ${change.deviceId}:`, error);
      }
    }
  }

  /**
   * Get monitor status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.CHECK_INTERVAL,
      offlineThreshold: 5 * 60 * 1000, // 5 minutes
      websocketAvailable: !!this.socketHandler
    };
  }
}

module.exports = new DeviceMonitorService();
