/**
 * pureJSONData source configuration example
 * Ignore for nowHTTPtype，focus onJSONComplete function display of data items
 */

import type {
  EnhancedDataSourceConfiguration,
  DataItemConfig,
  EnhancedJsonDataItemConfig
} from './types/enhanced-types'

import { DEFAULT_ENHANCED_FEATURES } from '@/core/data-architecture/types/enhanced-types'

// ==================== JSONData item example collection ====================

/**
 * Device statusJSONdata item
 */
export const deviceStatusJsonItem: DataItemConfig<EnhancedJsonDataItemConfig> = {
  type: 'json',
  id: 'device_status_001',
  config: {
    jsonData: JSON.stringify(
      {
        deviceId: 'DEV_001',
        deviceName: 'Temperature and humidity sensor01',
        status: 'online',
        location: {
          building: 'Aseat',
          floor: 3,
          room: '301',
          coordinates: { x: 120.5, y: 80.3 }
        },
        metrics: {
          temperature: 25.6,
          humidity: 68.3,
          batteryLevel: 85,
          signalStrength: -45
        },
        lastUpdate: '2024-01-15T10:30:00Z',
        alarms: []
      },
      null,
      2
    ),
    validation: {
      enableFormat: true,
      enableStructure: true,
      schema: {
        type: 'object',
        required: ['deviceId', 'status', 'metrics'],
        properties: {
          deviceId: { type: 'string' },
          status: { type: 'string', enum: ['online', 'offline', 'error'] },
          metrics: {
            type: 'object',
            properties: {
              temperature: { type: 'number', minimum: -50, maximum: 100 },
              humidity: { type: 'number', minimum: 0, maximum: 100 },
              batteryLevel: { type: 'number', minimum: 0, maximum: 100 }
            }
          }
        }
      }
    },
    preprocessing: {
      removeComments: true,
      formatOutput: false
    }
  },
  processing: {
    filterPath: '$.metrics.temperature',
    defaultValue: 0,
    transform: 'number'
  },
  metadata: {
    displayName: 'Device status data',
    description: 'Temperature and humidity sensor real-time status information',
    enabled: true,
    tags: ['equipment', 'sensor', 'temperature', 'humidity']
  }
}

/**
 * StatisticsJSONdata item
 */
export const statisticsJsonItem: DataItemConfig<EnhancedJsonDataItemConfig> = {
  type: 'json',
  id: 'statistics_data_002',
  config: {
    jsonData: JSON.stringify(
      {
        reportDate: '2024-01-15',
        totalDevices: 156,
        onlineDevices: 142,
        offlineDevices: 14,
        deviceTypes: {
          temperature: 45,
          humidity: 38,
          pressure: 32,
          motion: 41
        },
        dailyStats: [
          { hour: 0, online: 138, offline: 18 },
          { hour: 1, online: 135, offline: 21 },
          { hour: 2, online: 140, offline: 16 },
          { hour: 3, online: 142, offline: 14 }
        ],
        alerts: {
          critical: 2,
          warning: 7,
          info: 23
        }
      },
      null,
      2
    ),
    validation: {
      enableFormat: true,
      enableStructure: true,
      schema: {
        type: 'object',
        required: ['reportDate', 'totalDevices'],
        properties: {
          totalDevices: { type: 'number', minimum: 0 },
          onlineDevices: { type: 'number', minimum: 0 },
          offlineDevices: { type: 'number', minimum: 0 }
        }
      }
    },
    preprocessing: {
      removeComments: true,
      formatOutput: true
    }
  },
  processing: {
    filterPath: '$',
    defaultValue: {},
    transform: 'object'
  },
  metadata: {
    displayName: 'Device Statistics',
    description: 'Device online status and type statistics',
    enabled: true,
    tags: ['statistics', 'Report', 'Device management']
  }
}

/**
 * historical dataJSONdata item
 */
export const historyDataJsonItem: DataItemConfig<EnhancedJsonDataItemConfig> = {
  type: 'json',
  id: 'history_data_003',
  config: {
    jsonData: JSON.stringify(
      {
        dataRange: {
          startTime: '2024-01-15T00:00:00Z',
          endTime: '2024-01-15T23:59:59Z'
        },
        measurements: [
          { timestamp: '2024-01-15T10:00:00Z', temperature: 25.1, humidity: 67.8 },
          { timestamp: '2024-01-15T10:30:00Z', temperature: 25.6, humidity: 68.3 },
          { timestamp: '2024-01-15T11:00:00Z', temperature: 26.2, humidity: 69.1 },
          { timestamp: '2024-01-15T11:30:00Z', temperature: 26.8, humidity: 70.2 },
          { timestamp: '2024-01-15T12:00:00Z', temperature: 27.3, humidity: 71.5 }
        ],
        summary: {
          avgTemperature: 26.2,
          maxTemperature: 27.3,
          minTemperature: 25.1,
          avgHumidity: 69.38,
          dataPoints: 5
        }
      },
      null,
      2
    ),
    validation: {
      enableFormat: true,
      enableStructure: true,
      schema: {
        type: 'object',
        required: ['measurements', 'summary'],
        properties: {
          measurements: {
            type: 'array',
            items: {
              type: 'object',
              required: ['timestamp', 'temperature', 'humidity'],
              properties: {
                timestamp: { type: 'string' },
                temperature: { type: 'number' },
                humidity: { type: 'number' }
              }
            }
          }
        }
      }
    },
    preprocessing: {
      removeComments: false,
      formatOutput: true
    }
  },
  processing: {
    filterPath: '$.measurements',
    defaultValue: [],
    transform: 'array'
  },
  metadata: {
    displayName: 'Historical data records',
    description: 'Temperature and humidity sensor historical measurement data',
    enabled: true,
    tags: ['historical data', 'time series', 'Measurement records']
  }
}

/**
 * Configuration informationJSONdata item
 */
export const configInfoJsonItem: DataItemConfig<EnhancedJsonDataItemConfig> = {
  type: 'json',
  id: 'config_info_004',
  config: {
    jsonData: JSON.stringify(
      {
        systemConfig: {
          version: '1.2.5',
          environment: 'production',
          debugMode: false,
          logLevel: 'info'
        },
        dashboardConfig: {
          refreshInterval: 30000,
          autoRefresh: true,
          theme: 'light',
          language: 'zh-CN',
          timezone: 'Asia/Shanghai'
        },
        alertConfig: {
          enableEmail: true,
          enableSMS: false,
          enablePush: true,
          thresholds: {
            temperature: { min: 15, max: 35, unit: 'celsius' },
            humidity: { min: 30, max: 80, unit: 'percent' },
            battery: { critical: 20, warning: 30, unit: 'percent' }
          }
        },
        displayConfig: {
          chartsEnabled: true,
          tablesEnabled: true,
          mapsEnabled: false,
          maxDataPoints: 1000
        }
      },
      null,
      2
    ),
    validation: {
      enableFormat: true,
      enableStructure: false
    },
    preprocessing: {
      removeComments: true,
      formatOutput: false
    }
  },
  processing: {
    filterPath: '$',
    defaultValue: {},
    transform: 'object'
  },
  metadata: {
    displayName: 'System configuration information',
    description: 'Configuration parameters for dashboard and alarm system',
    enabled: true,
    tags: ['System configuration', 'Dashboard', 'Alarm']
  }
}

// ==================== complete pureJSONConfiguration example ====================

/**
 * complete pureJSONData source configuration
 */
export const pureJsonConfigExample: EnhancedDataSourceConfiguration = {
  // Basic configuration
  componentId: 'dashboard_sensors_panel_001',
  version: '2.0.0',

  // Data source configuration - Use allJSONtype
  dataSources: [
    {
      sourceId: 'device_status_source',
      dataItems: [
        {
          item: deviceStatusJsonItem,
          processing: {
            filterPath: '$.metrics.temperature',
            defaultValue: 0,
            transform: 'number'
          }
        }
      ],
      mergeStrategy: {
        type: 'object'
      }
    },
    {
      sourceId: 'statistics_source',
      dataItems: [
        {
          item: statisticsJsonItem,
          processing: {
            filterPath: '$.totalDevices',
            defaultValue: 0,
            transform: 'number'
          }
        }
      ],
      mergeStrategy: {
        type: 'object'
      }
    },
    {
      sourceId: 'history_source',
      dataItems: [
        {
          item: historyDataJsonItem,
          processing: {
            filterPath: '$.measurements',
            defaultValue: [],
            transform: 'array'
          }
        }
      ],
      mergeStrategy: {
        type: 'array'
      }
    },
    {
      sourceId: 'config_source',
      dataItems: [
        {
          item: configInfoJsonItem,
          processing: {
            filterPath: '$.dashboardConfig',
            defaultValue: {},
            transform: 'object'
          }
        }
      ],
      mergeStrategy: {
        type: 'object'
      }
    }
  ],

  // Dynamic parameter configuration（JSONThe type does not require dynamic parameters yet，Leave array empty）
  dynamicParams: [],

  // Enhanced function switch（closureHTTPRelated functions）
  enhancedFeatures: {
    ...DEFAULT_ENHANCED_FEATURES,
    httpArrayFormat: false, // closureHTTPFunction
    dynamicParameterSupport: false, // JSONNo dynamic parameters are needed yet
    secureScriptExecution: false, // JSONNo script execution required yet
    configurationValidation: true, // Keep configuration verified
    performanceMonitoring: true // Keep performance monitored
  },

  // Configuration metadata
  metadata: {
    name: 'Sensor monitoring panel configuration',
    description: 'Based on pureJSONSensor monitoring dashboard for data sources',
    author: 'system-admin',
    versionHistory: [
      {
        version: '1.0.0',
        timestamp: 1705225800000,
        changelog: 'initialJSONConfiguration creation',
        author: 'system-admin'
      },
      {
        version: '2.0.0',
        timestamp: 1705312200000,
        changelog: 'upgrade tov2.0Enhanced configuration format',
        author: 'ConfigurationAdapter'
      }
    ],
    tags: ['sensor', 'JSONdata', 'Monitoring panel', 'Device management']
  },

  // Timestamp
  createdAt: 1705225800000,
  updatedAt: 1705312200000
}

// ==================== Usage example ====================

/**
 * show pureJSONConfiguration usage
 */
export function demonstratePureJsonConfig() {
  // 1. Basic configuration information

  // 2. Data source details
  pureJsonConfigExample.dataSources.forEach((source, index) => {
    source.dataItems.forEach((dataItem, itemIndex) => {
      const item = dataItem.item

      // parseJSONData preview
      const jsonConfig = item.config as EnhancedJsonDataItemConfig
      try {
        const parsedData = JSON.parse(jsonConfig.jsonData)
        const keys = Object.keys(parsedData).slice(0, 3) // Show only before3keys
        if (process.env.NODE_ENV === 'development') {
        }
      } catch (e) {
      }
    })
  })

  // 3. Enhancement status
  if (process.env.NODE_ENV === 'development') {
  }
  const features = pureJsonConfigExample.enhancedFeatures
}

export default {
  deviceStatusJsonItem,
  statisticsJsonItem,
  historyDataJsonItem,
  configInfoJsonItem,
  pureJsonConfigExample,
  demonstratePureJsonConfig
}
