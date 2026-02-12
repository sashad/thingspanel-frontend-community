/**
 * HTTPConfiguration template
 * dedicated maintenanceHTTPPreset configuration templates for data sources
 */

import type { HttpConfig } from '@/core/data-architecture/types/http-config'

/**
 * HTTPConfiguration template definition
 */
export const HTTP_CONFIG_TEMPLATES: Array<{
  name: string
  config: HttpConfig
}> = [
  {
    name: 'GETinterface',
    config: {
      url: 'https://api.example.com/data',
      method: 'GET',
      timeout: 5000,
      headers: [
        {
          key: 'Accept',
          value: 'application/json',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: 'HTTP Accepthead'
        }
      ],
      params: [],
      body: '',
      preRequestScript: '',
      postResponseScript: 'return response.data || response'
    }
  },
  {
    name: 'POSTinterface',
    config: {
      url: 'https://api.example.com/submit',
      method: 'POST',
      timeout: 10000,
      headers: [
        {
          key: 'Content-Type',
          value: 'application/json',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: 'Content type'
        },
        {
          key: 'Authorization',
          value: 'Bearer demo-token-12345',
          enabled: true,
          isDynamic: true,
          dataType: 'string',
          variableName: 'var_authorization',
          description: 'Authentication token'
        }
      ],
      params: [],
      body: '{"data": "value"}',
      preRequestScript:
        'config.headers = config.headers || {}\nconfig.headers["X-Timestamp"] = Date.now()\nreturn config',
      postResponseScript: 'return response.data || response'
    }
  },
  {
    name: 'Device telemetry data（Repaired version）',
    config: {
      url: '/telemetry/datas/statistic',
      method: 'GET',
      timeout: 15000,
      headers: [
        {
          key: 'Accept',
          value: 'application/json',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: 'HTTP Accepthead'
        }
      ],
      params: [
        {
          key: 'device_id',
          value: 'device_001',
          enabled: true,
          isDynamic: true,
          dataType: 'string',
          variableName: 'var_device_id',
          description: 'equipmentID'
        },
        {
          key: 'key',
          value: 'temperature',
          enabled: true,
          isDynamic: true,
          dataType: 'string',
          variableName: 'var_key',
          description: 'Indicator key name'
        },
        {
          key: 'start_time',
          value: '1640995200000',
          enabled: true,
          isDynamic: true,
          dataType: 'string',
          variableName: 'var_start_time',
          description: 'start timestamp（String format）'
        },
        {
          key: 'end_time',
          value: '1640998800000',
          enabled: true,
          isDynamic: true,
          dataType: 'string',
          variableName: 'var_end_time',
          description: 'end timestamp（String format）'
        },
        {
          key: 'aggregate_window',
          value: 'no_aggregate',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: 'aggregation window：1h,1d,no_aggregate'
        },
        {
          key: 'time_range',
          value: 'custom',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: 'time range type'
        }
      ],
      body: '',
      preRequestScript: `// Repaired version：Dynamic timestamp generation and parameter validation
config.headers = config.headers || {}
config.headers['X-Request-Time'] = Date.now().toString()

// 🔧 repair：Dynamically generate timestamps（If the user does not set）
if (config.params) {
  const startTimeParam = config.params.find(p => p.key === 'start_time')
  const endTimeParam = config.params.find(p => p.key === 'end_time')

  // If the time parameter is a sample value，will automatically update to the current time
  if (startTimeParam && startTimeParam.value === '1640995200000') {
    startTimeParam.value = (Date.now() - 3600000).toString() // 1hours ago
  }
  if (endTimeParam && endTimeParam.value === '1640998800000') {
    endTimeParam.value = Date.now().toString() // current time
  }
}

// Verify necessary parameters
const requiredParams = ['device_id', 'key']
const missingParams = []
if (config.params) {
  for (const required of requiredParams) {
    const param = config.params.find(p => p.key === required && p.enabled)
    if (!param || !param.value) {
      missingParams.push(required)
    }
  }
}
if (missingParams.length > 0) {
  console.error('⚠️ Missing required parameters:', missingParams)
}

return config`,
      postResponseScript: `// Repaired version：More robust response data handling
if (process.env.NODE_ENV === 'development') {
}

try {
  let data = null

  // Handle multiple formats of response data
  if (response && typeof response === 'object') {
    // standard format: response.data contains array
    if (Array.isArray(response.data)) {
      data = response.data
    }
    // Alternate format: response.result
    else if (Array.isArray(response.result)) {
      data = response.result
    }
    // direct array format
    else if (Array.isArray(response)) {
      data = response
    }
    // list format: response.list
    else if (response.list && Array.isArray(response.list)) {
      data = response.list
    }
    // Single data format
    else if (response.data && typeof response.data === 'object') {
      data = [response.data]
    }
  }

  if (process.env.NODE_ENV === 'development') {
  }

  if (data && Array.isArray(data)) {
    // 🔧 repair：More robust data transformation
    const result = data.map(item => {
      if (!item || typeof item !== 'object') return [0, 0]

      // Compatible with multiple time fields
      const timeValue = item.x || item.timestamp || item.time || item.ts || Date.now()
      // Compatible with multiple numeric fields
      const dataValue = item.y || item.value || item.val || item.data || 0

      return [timeValue, dataValue]
    }).filter(item => item[0] && item[1] !== undefined)

    if (process.env.NODE_ENV === 'development') {
    }

    if (result.length > 0) {
      return result
    }
  }

  return response

} catch (error) {
  console.error('❌ [telemetry data] Processing failed:', error)
  return response
}`
    }
  },
  {
    name: 'Device current telemetry data',
    config: {
      url: '/telemetry/datas/current/',
      method: 'GET',
      timeout: 5000,
      pathParameter: {
        value: 'your_device_id',
        isDynamic: true,
        dataType: 'string',
        variableName: 'var_path_param',
        description: 'equipmentID'
      },
      headers: [
        {
          key: 'Accept',
          value: 'application/json',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: 'HTTP Accepthead'
        }
      ],
      params: [],
      body: '',
      preRequestScript: `// The path parameters are automatically spliced ​​toURLback
config.headers = config.headers || {}
config.headers['X-Request-Time'] = Date.now().toString()
return config`,
      postResponseScript: `// Device current telemetry data response processing
if (process.env.NODE_ENV === 'development') {
}

if (response && typeof response === 'object') {
  // If it is telemetry data from a single device
  if (response.data && typeof response.data === 'object') {
    return response.data
  }
  // If it is directly telemetry data
  if (response.telemetry_data) {
    return response.telemetry_data
  }
}

return response`
    }
  },
  {
    name: 'Device attribute data',
    config: {
      url: '/attribute/datas/',
      method: 'GET',
      timeout: 5000,
      pathParameter: {
        value: 'your_device_id',
        isDynamic: true,
        dataType: 'string',
        variableName: 'var_path_param',
        description: 'equipmentID'
      },
      headers: [
        {
          key: 'Accept',
          value: 'application/json',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: 'HTTP Accepthead'
        }
      ],
      params: [],
      body: '',
      preRequestScript: `// The path parameters are automatically spliced ​​toURLback
config.headers = config.headers || {}
config.headers['X-Request-Time'] = Date.now().toString()
return config`,
      postResponseScript: `// Device attribute data response processing
if (process.env.NODE_ENV === 'development') {
}

if (response && typeof response === 'object') {
  if (response.data) {
    return response.data
  }
}

return response`
    }
  },
  {
    name: 'Device command issuance',
    config: {
      url: '/command/datas/pub',
      method: 'POST',
      timeout: 10000,
      headers: [
        {
          key: 'Content-Type',
          value: 'application/json',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: 'Content type'
        },
        {
          key: 'Authorization',
          value: 'Bearer your-token',
          enabled: true,
          isDynamic: true,
          dataType: 'string',
          variableName: 'var_authorization',
          description: 'Authentication token'
        }
      ],
      params: [],
      pathParams: [],
      body: JSON.stringify(
        {
          device_id: 'your_device_id',
          command_identifier: 'your_command',
          params: {}
        },
        null,
        2
      ),
      preRequestScript: `// Processing before command issuance
config.headers = config.headers || {}
config.headers['X-Request-Time'] = Date.now().toString()

// Verify command data format
let commandData
try {
  commandData = JSON.parse(config.body)
  if (!commandData.device_id || !commandData.command_identifier) {
    console.error('Missing required command parameters: device_id, command_identifier')
  }
} catch (e) {
  console.error('Command data format error:', e)
}

return config`,
      postResponseScript: `// Command issuing response processing
if (process.env.NODE_ENV === 'development') {
}

if (response && typeof response === 'object') {
  if (response.success !== undefined) {
    return {
      success: response.success,
      message: response.message || 'command sent',
      timestamp: Date.now()
    }
  }
}

return response`
    }
  },
  {
    name: 'Equipment alarm history',
    config: {
      url: '/alarm/info/history',
      method: 'GET',
      timeout: 10000,
      headers: [
        {
          key: 'Accept',
          value: 'application/json',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: 'HTTP Accepthead'
        }
      ],
      params: [
        {
          key: 'device_id',
          value: 'your_device_id',
          enabled: true,
          isDynamic: true,
          dataType: 'string',
          variableName: 'var_device_id',
          description: 'equipmentID'
        },
        {
          key: 'page',
          value: 1,
          enabled: true,
          isDynamic: false,
          dataType: 'number',
          variableName: '',
          description: 'page number'
        },
        {
          key: 'page_size',
          value: 20,
          enabled: true,
          isDynamic: false,
          dataType: 'number',
          variableName: '',
          description: 'Quantity per page'
        }
      ],
      pathParams: [],
      body: '',
      preRequestScript: `// Alarm history query pre-processing
config.headers = config.headers || {}
config.headers['X-Request-Time'] = Date.now().toString()
return config`,
      postResponseScript: `// Alarm history response processing
if (process.env.NODE_ENV === 'development') {
}

if (response && typeof response === 'object') {
  if (response.data && Array.isArray(response.data)) {
    return response.data.map(alarm => ({
      id: alarm.id,
      device_id: alarm.device_id,
      alarm_type: alarm.alarm_type,
      alarm_message: alarm.alarm_message,
      created_at: alarm.created_at,
      status: alarm.status
    }))
  }

  if (Array.isArray(response)) {
    return response
  }
}

return response`
    }
  },
  {
    name: 'Device online status',
    config: {
      url: '/device',
      method: 'GET',
      timeout: 5000,
      headers: [
        {
          key: 'Accept',
          value: 'application/json',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: 'HTTP Accepthead'
        }
      ],
      params: [
        {
          key: 'device_id',
          value: 'your_device_id',
          enabled: true,
          isDynamic: true,
          dataType: 'string',
          variableName: 'var_device_id',
          description: 'equipmentID'
        },
        {
          key: 'online_status',
          value: '1',
          enabled: false,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: 'Online status filter'
        }
      ],
      pathParams: [],
      body: '',
      preRequestScript: `// Pre-processing of equipment status query
config.headers = config.headers || {}
config.headers['X-Request-Time'] = Date.now().toString()
return config`,
      postResponseScript: `// Device status response processing
if (process.env.NODE_ENV === 'development') {
}

if (response && typeof response === 'object') {
  if (response.data && Array.isArray(response.data)) {
    return response.data.map(device => ({
      device_id: device.id,
      device_name: device.name,
      is_online: device.is_online,
      last_push_time: device.last_push_time,
      status_text: device.is_online ? 'online' : 'Offline'
    }))
  }

  // Individual device details
  if (response.data && response.data.id) {
    const device = response.data
    return {
      device_id: device.id,
      device_name: device.name,
      is_online: device.is_online,
      last_push_time: device.last_push_time,
      status_text: device.is_online ? 'online' : 'Offline'
    }
  }
}

return response`
    }
  },
  {
    name: 'Device list query',
    config: {
      url: '/device',
      method: 'GET',
      timeout: 5000,
      headers: [
        {
          key: 'Accept',
          value: 'application/json',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: 'HTTP Accepthead'
        }
      ],
      params: [
        {
          key: 'page',
          value: 1,
          enabled: true,
          isDynamic: true,
          dataType: 'number',
          variableName: 'var_page',
          description: 'page number'
        },
        {
          key: 'page_size',
          value: 20,
          enabled: true,
          isDynamic: true,
          dataType: 'number',
          variableName: 'var_page_size',
          description: 'Quantity per page'
        },
        {
          key: 'name',
          value: '',
          enabled: false,
          isDynamic: true,
          dataType: 'string',
          variableName: 'var_device_name',
          description: 'Device name search'
        }
      ],
      pathParams: [],
      body: '',
      preRequestScript: `// Device list query pre-processing
config.headers = config.headers || {}
config.headers['X-Request-Time'] = Date.now().toString()

// Clean up empty parameters
if (config.params) {
  config.params = config.params.filter(param =>
    param.enabled && param.value !== '' && param.value != null
  )
}

return config`,
      postResponseScript: `// Device list response processing
if (process.env.NODE_ENV === 'development') {
}

if (response && typeof response === 'object') {
  if (response.data && Array.isArray(response.data)) {
    return {
      devices: response.data,
      total: response.total || response.data.length,
      page: response.page || 1,
      page_size: response.page_size || 20
    }
  }

  if (Array.isArray(response)) {
    return {
      devices: response,
      total: response.length,
      page: 1,
      page_size: response.length
    }
  }
}

return response`
    }
  },
  {
    name: 'Event data query',
    config: {
      url: '/event/datas',
      method: 'GET',
      timeout: 5000,
      headers: [
        {
          key: 'Accept',
          value: 'application/json',
          enabled: true,
          isDynamic: false,
          dataType: 'string',
          variableName: '',
          description: 'HTTP Accepthead'
        }
      ],
      params: [
        {
          key: 'device_id',
          value: 'your_device_id',
          enabled: true,
          isDynamic: true,
          dataType: 'string',
          variableName: 'var_device_id',
          description: 'equipmentID'
        },
        {
          key: 'event_type',
          value: '',
          enabled: false,
          isDynamic: true,
          dataType: 'string',
          variableName: 'var_event_type',
          description: 'event type'
        },
        {
          key: 'start_time',
          value: Date.now() - 86400000, // 24hours ago
          enabled: true,
          isDynamic: true,
          dataType: 'number',
          variableName: 'var_start_time',
          description: 'start timestamp'
        },
        {
          key: 'end_time',
          value: Date.now(),
          enabled: true,
          isDynamic: true,
          dataType: 'number',
          variableName: 'var_end_time',
          description: 'end timestamp'
        }
      ],
      pathParams: [],
      body: '',
      preRequestScript: `// Pre-processing of event data query
config.headers = config.headers || {}
config.headers['X-Request-Time'] = Date.now().toString()
return config`,
      postResponseScript: `// Event data response processing
if (process.env.NODE_ENV === 'development') {
}

if (response && typeof response === 'object') {
  if (response.data && Array.isArray(response.data)) {
    return response.data.map(event => ({
      event_id: event.id,
      device_id: event.device_id,
      event_type: event.event_type,
      event_data: event.event_data,
      timestamp: event.timestamp,
      created_at: event.created_at
    }))
  }

  if (Array.isArray(response)) {
    return response
  }
}

return response`
    }
  }
]
