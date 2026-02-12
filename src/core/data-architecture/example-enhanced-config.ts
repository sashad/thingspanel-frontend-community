/**
 * Enhanced configuration type sample data
 * show completev2.0Configuration structure and usage
 */

import type {
  EnhancedDataSourceConfiguration,
  DataItemConfig,
  EnhancedJsonDataItemConfig,
  EnhancedHttpDataItemConfig,
  DynamicParam
} from './types/enhanced-types'

import { DEFAULT_ENHANCED_FEATURES } from '@/core/data-architecture/types/enhanced-types'

// ==================== JSONData item example ====================

/**
 * JSONData item configuration example
 */
export const jsonDataItemExample: DataItemConfig<EnhancedJsonDataItemConfig> = {
  type: 'json',
  id: 'sensor_data_json_001',
  config: {
    jsonData: JSON.stringify(
      {
        temperature: 25.6,
        humidity: 68.3,
        pressure: 1013.25,
        location: {
          building: 'Aseat',
          floor: 3,
          room: '301'
        },
        sensors: [
          { id: 'temp_001', status: 'online', lastUpdate: '2024-01-15T10:30:00Z' },
          { id: 'humi_001', status: 'online', lastUpdate: '2024-01-15T10:30:00Z' }
        ]
      },
      null,
      2
    ),
    validation: {
      enableFormat: true,
      enableStructure: true,
      schema: {
        type: 'object',
        required: ['temperature', 'humidity'],
        properties: {
          temperature: { type: 'number', minimum: -50, maximum: 100 },
          humidity: { type: 'number', minimum: 0, maximum: 100 }
        }
      }
    },
    preprocessing: {
      removeComments: true,
      formatOutput: false
    }
  },
  processing: {
    filterPath: '$.temperature',
    defaultValue: 0,
    transform: 'number'
  },
  metadata: {
    displayName: 'Sensor data source',
    description: 'office buildingAseat3Floor temperature and humidity sensor data',
    createdAt: 1705312200000,
    lastUpdated: 1705312200000,
    enabled: true,
    tags: ['temperature', 'humidity', 'sensor', 'Aseat']
  }
}

// ==================== HTTPData item example ====================

/**
 * HTTPData item configuration example
 */
export const httpDataItemExample: DataItemConfig<EnhancedHttpDataItemConfig> = {
  type: 'http',
  id: 'weather_api_http_001',
  config: {
    url: 'https://api.weather.com/v1/current?location={{location}}&units={{units}}',
    method: 'GET',
    headers: [
      {
        key: 'Authorization',
        value: 'Bearer {{apiToken}}',
        enabled: true,
        isDynamic: true,
        dynamicName: 'apiToken',
        exampleValue: 'Bearer your-api-token-here'
      },
      {
        key: 'Content-Type',
        value: 'application/json',
        enabled: true,
        isDynamic: false
      },
      {
        key: 'User-Agent',
        value: 'ThingsPanel/1.0',
        enabled: true,
        isDynamic: false
      },
      {
        key: 'X-Debug-Mode',
        value: 'true',
        enabled: false,
        isDynamic: false
      }
    ],
    params: [
      {
        key: 'location',
        value: 'Beijing',
        enabled: true,
        isDynamic: true,
        dynamicName: 'location',
        exampleValue: 'Shanghai'
      },
      {
        key: 'units',
        value: 'metric',
        enabled: true,
        isDynamic: true,
        dynamicName: 'units',
        exampleValue: 'imperial'
      },
      {
        key: 'lang',
        value: 'zh-CN',
        enabled: true,
        isDynamic: false
      }
    ],
    body: {
      type: 'json',
      content: {
        requestId: '{{requestId}}',
        timestamp: '{{timestamp}}',
        client: 'thingspanel-frontend'
      },
      contentType: 'application/json'
    },
    timeout: 10000,
    preRequestScript: `
      // Pre-request script example
      const timestamp = Date.now();
      const requestId = 'req_' + timestamp + '_' + Math.random().toString(36).substr(2, 9);
      
      // Set dynamic parameters
      setDynamicParam('timestamp', timestamp);
      setDynamicParam('requestId', requestId);
    `,
    responseScript: `
      // Post-response script example
      if (response.status === 200) {
        const data = response.data;
        if (process.env.NODE_ENV === 'development') {
        };
        
        // Extract key data
        const weather = {
          temperature: data.current?.temperature,
          condition: data.current?.condition,
          humidity: data.current?.humidity
        };
        
        return weather;
      } else {
        console.error('APIcall failed', response.status, response.statusText);
        return null;
      }
    `,
    retry: {
      maxRetries: 3,
      retryDelay: 2000
    }
  },
  processing: {
    filterPath: '$.current',
    defaultValue: {},
    transform: 'object'
  },
  metadata: {
    displayName: 'weatherAPIdata source',
    description: 'Get real-time weather dataHTTPinterface',
    createdAt: 1705312200000,
    lastUpdated: 1705312800000,
    enabled: true,
    tags: ['weather', 'API', 'HTTP', 'real time data']
  }
}

// ==================== Dynamic parameter example ====================

/**
 * Dynamic parameter configuration example
 */
export const dynamicParamsExample: DynamicParam[] = [
  {
    name: 'apiToken',
    type: 'string',
    currentValue: 'your-api-token-here',
    exampleValue: 'sk-1234567890abcdef',
    description: 'weatherAPIaccess token',
    required: true,
    validation: {
      pattern: '^[a-zA-Z0-9\\-_]+$',
      min: 10,
      max: 100
    }
  },
  {
    name: 'location',
    type: 'string',
    currentValue: 'Beijing',
    exampleValue: 'Shanghai',
    description: 'City name to check weather',
    required: true,
    validation: {
      enum: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Hangzhou']
    }
  },
  {
    name: 'units',
    type: 'string',
    currentValue: 'metric',
    exampleValue: 'imperial',
    description: 'temperature unit（degrees celsius/Fahrenheit）',
    required: false,
    validation: {
      enum: ['metric', 'imperial', 'kelvin']
    }
  },
  {
    name: 'refreshInterval',
    type: 'number',
    currentValue: 300000,
    exampleValue: 600000,
    description: 'Data refresh interval（millisecond）',
    required: false,
    validation: {
      min: 60000, // smallest1minute
      max: 3600000 // maximum1Hour
    }
  },
  {
    name: 'enableCache',
    type: 'boolean',
    currentValue: true,
    exampleValue: false,
    description: 'Whether to enable data caching',
    required: false
  }
]

// ==================== Complete configuration example ====================

/**
 * Complete enhanced data source configuration example
 */
export const completeEnhancedConfigExample: EnhancedDataSourceConfiguration = {
  // Basic configuration
  componentId: 'dashboard_weather_panel_001',
  version: '2.0.0',

  // Data source configuration
  dataSources: [
    {
      sourceId: 'local_sensor_data',
      dataItems: [
        {
          item: jsonDataItemExample,
          processing: {
            filterPath: '$.temperature',
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
      sourceId: 'external_weather_api',
      dataItems: [
        {
          item: httpDataItemExample,
          processing: {
            filterPath: '$.current.temperature',
            defaultValue: null,
            transform: 'number'
          }
        }
      ],
      mergeStrategy: {
        type: 'object'
      }
    }
  ],

  // Dynamic parameter configuration
  dynamicParams: dynamicParamsExample,

  // Enhanced function switch
  enhancedFeatures: {
    ...DEFAULT_ENHANCED_FEATURES,
    dynamicParameterSupport: true,
    performanceMonitoring: true
  },

  // Configuration metadata
  metadata: {
    name: 'Weather monitoring panel configuration',
    description: 'Combine local sensors and external weatherAPIcomprehensive monitoring panel',
    author: 'system-admin',
    versionHistory: [
      {
        version: '1.0.0',
        timestamp: 1705225800000,
        changelog: 'Initial configuration creation',
        author: 'system-admin'
      },
      {
        version: '2.0.0',
        timestamp: 1705312200000,
        changelog: 'Upgrade to enhanced configuration format，Add dynamic parameter support',
        author: 'ConfigurationAdapter'
      }
    ],
    tags: ['weather', 'sensor', 'Monitoring panel', 'real time data']
  },

  // Timestamp
  createdAt: 1705225800000,
  updatedAt: 1705312200000
}

// ==================== Usage example ====================

/**
 * Shows how to use configuration adapters
 */
export function demonstrateConfigUsage() {
  if (process.env.NODE_ENV === 'development') {
  }

  // 1. Basic configuration information
  if (process.env.NODE_ENV === 'development') {
  }

  // 2. JSONData item information
  const jsonItem = completeEnhancedConfigExample.dataSources[0].dataItems[0].item
  if (process.env.NODE_ENV === 'development') {
  }
  if (process.env.NODE_ENV === 'development') {
  }

  // 3. HTTPData item information
  const httpItem = completeEnhancedConfigExample.dataSources[1].dataItems[0].item
  if (process.env.NODE_ENV === 'development') {
  }
  if (process.env.NODE_ENV === 'development') {
  }
  if (process.env.NODE_ENV === 'development') {
  }

  // 4. Dynamic parameter information
  completeEnhancedConfigExample.dynamicParams?.forEach(param => {
    if (process.env.NODE_ENV === 'development') {
    }
  })

  // 5. Enhancement information
  const features = completeEnhancedConfigExample.enhancedFeatures
  if (features) {
    if (process.env.NODE_ENV === 'development') {
    }
    if (process.env.NODE_ENV === 'development') {
    }
  }
}

export default {
  jsonDataItemExample,
  httpDataItemExample,
  dynamicParamsExample,
  completeEnhancedConfigExample,
  demonstrateConfigUsage
}
