/**
 * Dashboard chart component definition
 * Dashboard visualization for displaying a single value
 */

import type { ComponentDefinition } from '@/card2.1/types'
import { customConfig, gaugeChartSettingConfig } from './settingConfig'
import GaugeChart from './index.vue'
import GaugeChartSetting from './setting.vue'
import { createPropertyWhitelist } from '@/card2.1/core2/property'

export const gaugeChartDefinition: ComponentDefinition = {
  // Basic information
  type: 'gauge-chart',
  name: '📊 Dashboard chart',
  description: 'round instrument panel，Used to display the progress and status of a single numerical indicator',
  icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,14.4 19,16.5 17.3,18C15.9,16.7 14,16 12,16C10,16 8.2,16.7 6.7,18C5,16.5 4,14.4 4,12A8,8 0 0,1 12,4M14,5.89C13.62,5.9 13.26,6.15 13.1,6.54L11.81,9.77L11.71,10C11,10.13 10.41,10.6 10.14,11.26C9.73,12.29 10.23,13.45 11.26,13.86C12.29,14.27 13.45,13.77 13.86,12.74C14.12,12.08 14,11.32 13.57,10.76L13.67,10.5L14.96,7.29L14.97,7.26C15.17,6.75 14.92,6.17 14.41,5.96C14.28,5.91 14.15,5.89 14,5.89M10,6A1,1 0 0,0 9,7A1,1 0 0,0 10,8A1,1 0 0,0 11,7A1,1 0 0,0 10,6M7,9A1,1 0 0,0 6,10A1,1 0 0,0 7,11A1,1 0 0,0 8,10A1,1 0 0,0 7,9M17,9A1,1 0 0,0 16,10A1,1 0 0,0 17,11A1,1 0 0,0 18,10A1,1 0 0,0 17,9Z" /></svg>',
  version: '1.0.0',
  author: 'ThingsPanel',

  // Main categories and subcategories
  mainCategory: 'categories.chart',
  subCategory: 'categories.data',

  // Components and Configuration Components
  component: GaugeChart,
  configComponent: GaugeChartSetting,

  // Default configuration
  defaultConfig: {
    type: 'gauge-chart',
    root: {
      transform: {
        rotate: 0,
        scale: 1
      }
    },
    customize: customConfig
  },

  // Component configuration
  config: {
    type: 'gauge-chart',
    root: {
      transform: {
        rotate: 0,
        scale: 1
      }
    },
    customize: customConfig
  },

  // default layout（grid system）
  defaultLayout: {
    gridstack: {
      w: 3,
      h: 3,
      x: 0,
      y: 0,
      minW: 2,
      minH: 2,
      maxW: 6,
      maxH: 6
    }
  },

  // layout constraints
  layout: {
    defaultSize: { width: 3, height: 3 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 6, height: 6 },
    resizable: true
  },

  // Permissions and labels
  permission: 'NO_LIMIT',
  tags: ['chart', 'Dashboard', 'data visualization', 'index'],

  // Features
  features: {
    realtime: true,       // Support real-time data updates
    dataBinding: true,    // Support data binding
    configurable: true    // Configurable
  },

  // Data source definition
  dataSources: [
    {
      key: 'main',
      name: 'data source',
      description: 'Primary data sources for dashboard charts，Contains numeric values、Unit and indicator name',
      supportedTypes: ['static', 'api', 'websocket'],
      required: false,
      example: {
        value: 75,
        unit: '℃',
        metricsName: 'temperature',
        timestamp: '2025-10-15T10:30:00.000Z'
      }
    }
  ],

  // Configuration form
  settingConfig: gaugeChartSettingConfig,

  // 🎯 Interactive capability statement
  interactionCapabilities: {
    // Supported interaction event types
    supportedEvents: ['click', 'hover', 'dataChange'],

    // Types of interactive actions that can be triggered
    availableActions: [
      'navigateToUrl',
      'updateComponentData',
      'changeVisibility',
      'showNotification',
      'emitEvent'
    ],

    // List of properties that can be listened to by other components
    watchableProperties: {
      'value': {
        type: 'number',
        description: 'current value',
        defaultValue: 75
      },
      'min': {
        type: 'number',
        description: 'minimum value',
        defaultValue: 0
      },
      'max': {
        type: 'number',
        description: 'maximum value',
        defaultValue: 100
      },
      'title': {
        type: 'string',
        description: 'title',
        defaultValue: 'Data indicators'
      },
      'percentage': {
        type: 'number',
        description: 'Percent value（Automatic calculation）',
        defaultValue: 0
      }
    },

    // Default interaction configuration
    defaultInteractions: [
      {
        event: 'dataChange',
        responses: [
          {
            action: 'showNotification',
            delay: 0,
            name: 'Value change notification',
            enabled: true
          }
        ],
        enabled: true,
        name: 'Notify when value changes',
        watchedProperty: 'value'
      }
    ]
  },

  // 🔒 Attribute exposure whitelist configuration
  propertyWhitelist: createPropertyWhitelist({
    // 🔒 core data attributes - Can be used interactively
    value: {
      level: 'public',
      type: 'number',
      description: 'current value',
      defaultValue: 75,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    min: {
      level: 'public',
      type: 'number',
      description: 'minimum value',
      defaultValue: 0,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    max: {
      level: 'public',
      type: 'number',
      description: 'maximum value',
      defaultValue: 100,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    title: {
      level: 'public',
      type: 'string',
      description: 'title',
      defaultValue: 'Data indicators',
      visibleInInteraction: true,
      visibleInDebug: true
    },

    // 🔒 Computed properties - read only，For use by interactive systems
    percentage: {
      level: 'public',
      type: 'number',
      description: 'Percent value（Automatic calculation）',
      defaultValue: 0,
      readonly: true,
      visibleInInteraction: true,
      visibleInDebug: true
    },

    // 🔒 status attribute - read only
    lastUpdated: {
      level: 'public',
      type: 'string',
      description: 'Last updated',
      readonly: true,
      visibleInInteraction: false,
      visibleInDebug: true
    },

    // 🔒 BaseUIproperty - protected level
    visible: {
      level: 'protected',
      type: 'boolean',
      description: 'Component visibility',
      defaultValue: true,
      visibleInInteraction: true,
      visibleInDebug: true
    }
  }, {
    enabled: true,
    defaultLevel: 'public',
    audit: {
      logAccess: process.env.NODE_ENV === 'development',
      logModification: true
    }
  })
}

export default gaugeChartDefinition
