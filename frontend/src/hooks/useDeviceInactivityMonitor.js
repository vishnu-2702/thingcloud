import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom Hook: useDeviceInactivityMonitor
 * 
 * Monitors device inactivity on the frontend and automatically marks devices
 * as inactive/offline after 5 minutes of no telemetry or activity.
 * Also triggers visual alerts when devices go offline.
 * Works alongside WebSocket updates without conflicts.
 * 
 * @param {Array} devices - Array of device objects with lastSeen timestamp
 * @param {Function} onDeviceStatusChange - Callback when device status changes
 * @param {number} inactivityThreshold - Time in milliseconds (default: 5 minutes)
 * @param {boolean} enabled - Enable/disable monitoring (default: true, set false if WebSocket handles it)
 */
export const useDeviceInactivityMonitor = (
  devices,
  onDeviceStatusChange,
  inactivityThreshold = 5 * 60 * 1000, // 5 minutes
  enabled = true
) => {
  const monitorIntervalRef = useRef(null);
  const notifiedDevicesRef = useRef(new Set());
  const previousStatusRef = useRef(new Map());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !devices || devices.length === 0) {
      return;
    }

    // Initialize previous status tracking only once (not on every render)
    if (!initializedRef.current) {
      devices.forEach(device => {
        const deviceId = device.deviceId || device.id;
        previousStatusRef.current.set(deviceId, device.status);
      });
      initializedRef.current = true;
      
      // Don't trigger notifications on initial load
      return;
    }

    // Update tracking for any new devices added after initialization
    devices.forEach(device => {
      const deviceId = device.deviceId || device.id;
      if (!previousStatusRef.current.has(deviceId)) {
        previousStatusRef.current.set(deviceId, device.status);
      }
    });

    const checkDeviceActivity = () => {
      const now = Date.now();
      const updatedDevices = [];
      const newlyInactiveDevices = [];

      devices.forEach(device => {
        const deviceId = device.deviceId || device.id;
        const lastSeen = device.lastSeen;
        const previousStatus = previousStatusRef.current.get(deviceId);
        const currentStatus = device.status;

        // Skip devices that have never been seen
        if (!lastSeen) {
          return;
        }

        const timeSinceLastSeen = now - lastSeen;
        const shouldBeInactive = timeSinceLastSeen > inactivityThreshold;

        // Determine new status based on actual inactivity check
        let newStatus = currentStatus;
        if (shouldBeInactive && currentStatus === 'online') {
          newStatus = 'offline';
          updatedDevices.push({
            ...device,
            status: 'offline',
            inactiveDuration: Math.floor(timeSinceLastSeen / 1000 / 60) // minutes
          });

          // Only trigger alert if status ACTUALLY CHANGED from what we tracked
          if (previousStatus === 'online') {
            newlyInactiveDevices.push({
              deviceId,
              name: device.name,
              inactiveDuration: Math.floor(timeSinceLastSeen / 1000 / 60)
            });
          }
        }

        // Update previous status only if it actually changed
        if (newStatus !== previousStatus) {
          previousStatusRef.current.set(deviceId, newStatus);
        }
      });

      // Trigger status change callback if there are updates
      if (updatedDevices.length > 0 && onDeviceStatusChange) {
        onDeviceStatusChange(updatedDevices);
      }

      // Show alerts for newly inactive devices
      newlyInactiveDevices.forEach(device => {
        const notificationKey = `${device.deviceId}_offline`;
        
        // Only notify once per offline event
        if (!notifiedDevicesRef.current.has(notificationKey)) {
          notifiedDevicesRef.current.add(notificationKey);
          
          // Show toast notification
          toast.error(
            `Device "${device.name}" went offline`,
            {
              duration: 5000,
              icon: '🔴',
              position: 'top-right',
            }
          );

          // Clear notification after 1 hour to allow re-notification
          setTimeout(() => {
            notifiedDevicesRef.current.delete(notificationKey);
          }, 60 * 60 * 1000);
        }
      });
    };

    // Check immediately
    checkDeviceActivity();

    // Then check every 30 seconds
    monitorIntervalRef.current = setInterval(checkDeviceActivity, 30 * 1000);

    return () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
      }
    };
  }, [devices, onDeviceStatusChange, inactivityThreshold, enabled]);

  // Clear notifications when devices come back online
  useEffect(() => {
    if (!enabled || !initializedRef.current) return; // Skip on initial render or if disabled

    devices?.forEach(device => {
      const deviceId = device.deviceId || device.id;
      const notificationKey = `${deviceId}_offline`;
      const previousStatus = previousStatusRef.current.get(deviceId);
      const currentStatus = device.status;
      
      // Only show "back online" if device was previously offline and is now online
      if (currentStatus === 'online' && previousStatus === 'offline' && notifiedDevicesRef.current.has(notificationKey)) {
        notifiedDevicesRef.current.delete(notificationKey);
        previousStatusRef.current.set(deviceId, 'online');
        
        // Show success toast when device comes back online
        toast.success(
          `Device "${device.name}" is back online`,
          {
            duration: 3000,
            icon: '🟢',
            position: 'top-right',
          }
        );
      }
    });
  }, [devices, enabled]);

  return {
    isMonitoring: !!monitorIntervalRef.current && enabled,
  };
};

/**
 * Helper function to calculate device status based on lastSeen
 */
export const calculateDeviceStatus = (lastSeen, inactivityThreshold = 5 * 60 * 1000) => {
  if (!lastSeen) return 'offline';
  
  const timeSinceLastSeen = Date.now() - lastSeen;
  return timeSinceLastSeen > inactivityThreshold ? 'offline' : 'online';
};

/**
 * Helper function to get inactive devices
 */
export const getInactiveDevices = (devices, inactivityThreshold = 5 * 60 * 1000) => {
  const now = Date.now();
  return devices.filter(device => {
    if (!device.lastSeen) return false;
    const timeSinceLastSeen = now - device.lastSeen;
    return timeSinceLastSeen > inactivityThreshold && device.status === 'online';
  });
};
