/**
 * Digital indicator component definition - Card 2.1 Version
 *
 * Function description：
 * - Display telemetry or property data for a device
 * - Support custom icons、Colors and units
 * - Responsive font sizing
 * - support WebSocket Real-time data updates
 * - Fully compatible with theme systems and internationalization
 */

import DigitIndicator from './DigitIndicator.vue'
import DigitIndicatorSetting from './setting.vue'
import type { ComponentDefinition } from '../../../core/types'
import { customConfig, digitIndicatorSettingConfig } from './settingConfig'
import { createPropertyWhitelist } from '@/card2.1/core2/property'

const digitIndicatorDefinition: ComponentDefinition = {
  // ===== Core identification information =====
  type: 'digit-indicator',
  name: 'digital indicator',
  description: 'Numeric indicator component for displaying device data，support icon、numerical value、Unit and indicator name display',
  icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H5C3.89,1 3,1.89 3,3V21A2,2 0 0,0 5,23H19A2,2 0 0,0 21,21V9M19,9H14V4L19,9Z" /></svg>',
  version: '2.1.0',
  author: 'ThingsPanel',
  component: DigitIndicator,
  configComponent: DigitIndicatorSetting,

  // ===== Default configuration =====
  defaultConfig: {
    type: 'digit-indicator',
    root: {
      transform: {
        rotate: 0,
        scale: 1
      }
    },
    customize: customConfig
  },

  config: {
    type: 'digit-indicator',
    root: {
      transform: {
        rotate: 0,
        scale: 1
      }
    },
    customize: customConfig
  },

  // ===== layout configuration =====
  defaultLayout: {
    gridstack: {
      w: 2,
      h: 2,
      x: 0,
      y: 0,
      minW: 1,
      minH: 1,
      maxW: 4,
      maxH: 4
    }
  },

  layout: {
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 4, height: 4 },
    resizable: true
  },

  // ===== Permission control =====
  permission: 'NO_LIMIT',

  // ===== Classified information =====
  tags: ['data', 'indicator', 'equipment', 'telemetry', 'Numerical display', 'icon'],

  // ===== Features =====
  features: {
    realtime: true,
    dataBinding: true,
    configurable: true
  },

  // ===== Data source requirement statement =====
  dataSources: [
    {
      key: 'main',
      name: 'data source',
      description: 'Primary data source for digital indicators，Contains numeric values、Unit and indicator name',
      supportedTypes: ['static', 'api', 'websocket'],
      required: false,
      example: {
        value: 45,
        unit: '%',
        metricsName: 'humidity',
        timestamp: '2025-09-28T02:18:46.567Z'
      }
    }
  ],

  // ===== Set configuration =====
  settingConfig: digitIndicatorSettingConfig,

  // ===== Interactive capability statement =====
  interactionCapabilities: {
    supportedEvents: ['click', 'hover', 'dataChange'],
    availableActions: [
      'navigateToUrl', 'updateComponentData', 'changeVisibility',
      'showNotification', 'emitEvent'
    ],
    watchableProperties: {
      'value': {
        type: 'string',
        description: 'Currently displayed value',
        defaultValue: '45'
      },
      'unit': {
        type: 'string',
        description: 'numerical unit',
        defaultValue: '%'
      },
      'metricsName': {
        type: 'string',
        description: 'Indicator name/title',
        defaultValue: 'humidity'
      },
      'iconColor': {
        type: 'string',
        description: 'icon color',
        defaultValue: '#1890ff'
      },
      'iconName': {
        type: 'string',
        description: 'Icon name',
        defaultValue: 'Water'
      }
    },
    defaultInteractions: [
      {
        event: 'dataChange',
        responses: [
          {
            action: 'showNotification',
            delay: 0,
            name: 'Value update notification',
            enabled: false
          }
        ],
        enabled: false,
        name: 'Numerical change response',
        watchedProperty: 'value'
      }
    ]
  },

  // ===== Attribute exposure whitelist configuration =====
  // Expose only core business attributes，Do not expose style configuration properties
  propertyWhitelist: createPropertyWhitelist({
    // core business attributes - Data related
    value: {
      level: 'public',
      type: 'string',
      description: 'Currently displayed value',
      defaultValue: '45',
      visibleInInteraction: true,
      visibleInDebug: true
    },
    unit: {
      level: 'public',
      type: 'string',
      description: 'numerical unit',
      defaultValue: '%',
      visibleInInteraction: true,
      visibleInDebug: true
    },
    metricsName: {
      level: 'public',
      type: 'string',
      description: 'Indicator name/title',
      defaultValue: 'humidity',
      visibleInInteraction: true,
      visibleInDebug: true
    }
    // Notice：style properties（iconColor、iconSize、valueColor wait）Not in the whitelist
    // These properties can only be modified via the configuration panel，Cannot be accessed by other components or bound by interactive systems
  }, {
    enabled: true,
    defaultLevel: 'public',
    audit: {
      logAccess: process.env.NODE_ENV === 'development',
      logModification: true
    }
  })
}

export default digitIndicatorDefinition
