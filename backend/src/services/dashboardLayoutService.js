/**
 * Dashboard Layout Service
 * Manages device-specific dashboard UI layouts
 */

const { dynamodb, TABLES } = require('../config/database');
const { GetCommand, PutCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp } = require('../utils/helpers');

// Default widget configurations - supports all frontend widget types
const DEFAULT_WIDGETS = {
  // New widget types (primary)
  label: {
    type: 'label',
    minW: 2,
    minH: 2,
    defaultW: 3,
    defaultH: 2
  },
  gauge: {
    type: 'gauge',
    minW: 2,
    minH: 3,
    defaultW: 3,
    defaultH: 3
  },
  radialGauge: {
    type: 'radialGauge',
    minW: 2,
    minH: 3,
    defaultW: 3,
    defaultH: 3
  },
  status: {
    type: 'status',
    minW: 2,
    minH: 2,
    defaultW: 2,
    defaultH: 2
  },
  switch: {
    type: 'switch',
    minW: 2,
    minH: 2,
    defaultW: 2,
    defaultH: 2
  },
  slider: {
    type: 'slider',
    minW: 3,
    minH: 2,
    defaultW: 4,
    defaultH: 2
  },
  progress: {
    type: 'progress',
    minW: 3,
    minH: 2,
    defaultW: 4,
    defaultH: 2
  },
  sparkline: {
    type: 'sparkline',
    minW: 3,
    minH: 2,
    defaultW: 4,
    defaultH: 3
  },
  bar: {
    type: 'bar',
    minW: 3,
    minH: 3,
    defaultW: 4,
    defaultH: 3
  },
  table: {
    type: 'table',
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4
  },
  terminal: {
    type: 'terminal',
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4
  },
  // Legacy widget types (for backward compatibility)
  valueCard: {
    type: 'valueCard',
    minW: 2,
    minH: 2,
    defaultW: 3,
    defaultH: 2
  },
  value: {
    type: 'value',
    minW: 2,
    minH: 2,
    defaultW: 3,
    defaultH: 2
  },
  lineChart: {
    type: 'lineChart',
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4
  },
  chart: {
    type: 'chart',
    minW: 3,
    minH: 2,
    defaultW: 4,
    defaultH: 3
  },
  statusIndicator: {
    type: 'statusIndicator',
    minW: 2,
    minH: 2,
    defaultW: 2,
    defaultH: 2
  },
  barChart: {
    type: 'barChart',
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4
  },
  areaChart: {
    type: 'areaChart',
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4
  }
};

class DashboardLayoutService {
  /**
   * Get dashboard layout for a device
   */
  async getLayout(deviceId) {
    try {
      const result = await dynamodb.send(new GetCommand({
        TableName: TABLES.DASHBOARD_LAYOUTS,
        Key: { deviceId }
      }));

      if (result.Item) {
        console.log(`[DashboardLayout] Retrieved layout for device ${deviceId}:`, 
          result.Item.widgets?.map(w => ({ id: w.id, pos: w.position }))
        );
      }

      return result.Item || null;
    } catch (error) {
      console.error('[DashboardLayout] Error getting layout:', error);
      throw error;
    }
  }

  /**
   * Save or update dashboard layout for a device
   */
  async saveLayout(deviceId, userId, layoutData) {
    const { widgets, gridCols = 24, rowHeight = 60, name } = layoutData;

    // Validate widgets
    if (!Array.isArray(widgets)) {
      throw new Error('Widgets must be an array');
    }

    console.log(`[DashboardLayout] Saving ${widgets.length} widgets for device ${deviceId}`);

    // Validate each widget
    const validatedWidgets = widgets.map((widget, index) => {
      if (!widget.id) {
        widget.id = `widget-${generateId()}`;
      }
      
      // Get widget config or use defaults for unknown types
      const widgetConfig = DEFAULT_WIDGETS[widget.type] || {
        type: widget.type,
        minW: 2,
        minH: 2,
        defaultW: 3,
        defaultH: 2
      };

      // Ensure position is valid - handle both number and string values, round to integers
      const position = widget.position || {};
      const parsePos = (val, fallback) => {
        const num = typeof val === 'number' ? val : parseFloat(val);
        return Number.isFinite(num) ? Math.round(num) : fallback;
      };
      
      const x = parsePos(position.x, 0);
      const y = parsePos(position.y, index * 2);
      const w = parsePos(position.w, widgetConfig.defaultW);
      const h = parsePos(position.h, widgetConfig.defaultH);

      // Apply minimal constraints - allow variable sizes set by user
      // Only enforce absolute minimums (1x1) and grid boundaries
      const ABSOLUTE_MIN_W = 1;
      const ABSOLUTE_MIN_H = 1;
      
      const finalX = Math.max(0, Math.min(x, gridCols - 1));
      const finalY = Math.max(0, y);
      const finalW = Math.max(ABSOLUTE_MIN_W, Math.min(w, gridCols));
      const finalH = Math.max(ABSOLUTE_MIN_H, h);

      console.log(`[DashboardLayout] Widget ${widget.id}: input=${JSON.stringify(position)} -> x=${finalX}, y=${finalY}, w=${finalW}, h=${finalH}`);

      return {
        id: widget.id,
        type: widget.type || 'label',
        dataKey: widget.dataKey || null,
        title: widget.title || widget.config?.label || widget.dataKey || 'Untitled',
        position: {
          x: finalX,
          y: finalY,
          w: finalW,
          h: finalH
        },
        config: widget.config || {},
        // Store minimal constraints for grid behavior, allow user to resize freely
        minW: ABSOLUTE_MIN_W,
        minH: ABSOLUTE_MIN_H
      };
    });

    const layout = {
      deviceId,
      userId,
      name: name || 'Custom Dashboard',
      widgets: validatedWidgets,
      gridCols,
      rowHeight,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    // Check if layout exists
    const existing = await this.getLayout(deviceId);
    if (existing) {
      layout.createdAt = existing.createdAt;
    }

    await dynamodb.send(new PutCommand({
      TableName: TABLES.DASHBOARD_LAYOUTS,
      Item: layout
    }));

    console.log(`[DashboardLayout] Saved layout for device ${deviceId} with ${validatedWidgets.length} widgets`);
    return layout;
  }

  /**
   * Delete dashboard layout for a device
   */
  async deleteLayout(deviceId, userId) {
    const existing = await this.getLayout(deviceId);
    
    if (!existing) {
      throw new Error('Dashboard layout not found');
    }

    // Verify ownership
    if (existing.userId !== userId) {
      throw new Error('Access denied');
    }

    await dynamodb.send(new DeleteCommand({
      TableName: TABLES.DASHBOARD_LAYOUTS,
      Key: { deviceId }
    }));

    console.log(`[DashboardLayout] Deleted layout for device ${deviceId}`);
    return { message: 'Dashboard layout deleted successfully' };
  }

  /**
   * Generate default layout based on template datastreams
   */
  generateDefaultLayout(template, deviceId) {
    if (!template || !template.datastreams || template.datastreams.length === 0) {
      return {
        deviceId,
        widgets: [],
        gridCols: 12,
        rowHeight: 60
      };
    }

    const widgets = [];
    let currentX = 0;
    let currentY = 0;
    const gridCols = 24;

    // Color palette for widgets
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    template.datastreams.forEach((stream, index) => {
      let widgetType;
      let widgetW, widgetH;

      // Determine widget type based on dataType - use new widget types
      switch (stream.dataType) {
        case 'boolean':
          widgetType = 'status';
          widgetW = 2;
          widgetH = 2;
          break;
        case 'number':
        case 'integer':
        case 'double':
          // Alternate between label, gauge, and sparkline
          if (index % 3 === 0) {
            widgetType = 'label';
            widgetW = 3;
            widgetH = 2;
          } else if (index % 3 === 1) {
            widgetType = 'gauge';
            widgetW = 3;
            widgetH = 3;
          } else {
            widgetType = 'sparkline';
            widgetW = 4;
            widgetH = 3;
          }
          break;
        default:
          widgetType = 'label';
          widgetW = 3;
          widgetH = 2;
      }

      // Check if widget fits in current row
      if (currentX + widgetW > gridCols) {
        currentX = 0;
        currentY += Math.max(...widgets.filter(w => w.position.y === currentY - 1).map(w => w.position.h) || [2]);
      }

      widgets.push({
        id: `widget-${generateId()}`,
        type: widgetType,
        dataKey: stream.virtualPin || stream.pin,
        title: stream.name,
        position: {
          x: currentX,
          y: currentY,
          w: widgetW,
          h: widgetH
        },
        config: {
          label: stream.name,
          unit: stream.unit || '',
          min: stream.min ?? 0,
          max: stream.max ?? 100,
          color: colors[index % colors.length],
          dataType: stream.dataType
        },
        minW: DEFAULT_WIDGETS[widgetType].minW,
        minH: DEFAULT_WIDGETS[widgetType].minH
      });

      currentX += widgetW;
    });

    return {
      deviceId,
      widgets,
      gridCols,
      rowHeight: 50
    };
  }

  /**
   * Get available widget types
   */
  getWidgetTypes() {
    return Object.entries(DEFAULT_WIDGETS).map(([key, config]) => ({
      type: key,
      name: this.formatWidgetName(key),
      ...config
    }));
  }

  /**
   * Format widget type name for display
   */
  formatWidgetName(type) {
    const names = {
      // New widget types
      label: 'Label',
      gauge: 'Gauge',
      radialGauge: 'Radial Gauge',
      status: 'Status',
      switch: 'Switch',
      slider: 'Slider',
      progress: 'Progress',
      sparkline: 'Sparkline',
      bar: 'Bar Chart',
      table: 'Data Table',
      terminal: 'Terminal',
      // Legacy widget types
      valueCard: 'Value Card',
      value: 'Value',
      lineChart: 'Line Chart',
      chart: 'Chart',
      statusIndicator: 'Status Indicator',
      barChart: 'Bar Chart',
      areaChart: 'Area Chart'
    };
    return names[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Validate widget configuration
   */
  validateWidget(widget) {
    const errors = [];

    if (!widget.type) {
      errors.push('Widget type is required');
    }
    // Allow any widget type, just validate position

    if (!widget.position) {
      errors.push('Widget position is required');
    } else {
      if (widget.position.x === undefined || widget.position.x < 0) {
        errors.push('Invalid x position');
      }
      if (widget.position.y === undefined || widget.position.y < 0) {
        errors.push('Invalid y position');
      }
      if (!widget.position.w || widget.position.w < 1) {
        errors.push('Invalid width');
      }
      if (!widget.position.h || widget.position.h < 1) {
        errors.push('Invalid height');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get all layouts for a user
   */
  async getUserLayouts(userId) {
    try {
      const result = await dynamodb.send(new ScanCommand({
        TableName: TABLES.DASHBOARD_LAYOUTS,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));

      return result.Items || [];
    } catch (error) {
      console.error('[DashboardLayout] Error getting user layouts:', error);
      return [];
    }
  }

  /**
   * Clone a layout to another device
   */
  async cloneLayout(sourceDeviceId, targetDeviceId, userId) {
    const sourceLayout = await this.getLayout(sourceDeviceId);
    
    if (!sourceLayout) {
      throw new Error('Source layout not found');
    }

    // Create new widget IDs
    const clonedWidgets = sourceLayout.widgets.map(widget => ({
      ...widget,
      id: `widget-${generateId()}`
    }));

    return await this.saveLayout(targetDeviceId, userId, {
      widgets: clonedWidgets,
      gridCols: sourceLayout.gridCols,
      rowHeight: sourceLayout.rowHeight,
      name: `${sourceLayout.name} (Copy)`
    });
  }
}

module.exports = new DashboardLayoutService();
