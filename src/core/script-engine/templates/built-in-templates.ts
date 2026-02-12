/**
 * Built-in script template library
 * for data-architecture The system provides pre-made script templates
 */

import type { ScriptTemplate, TemplateCategory } from '@/core/script-engine/types'

/**
 * Data Getter Script Template
 */
export const DATA_FETCHER_TEMPLATES: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Analog device data',
    description: 'generate simulatedIoTDevice data，Contains temperature、humidity、Status and other information',
    category: 'data-generation',
    code: `// Generate simulated device data
const deviceId = context.deviceId || 'device_001'
const timestamp = Date.now()

return {
  deviceId: deviceId,
  timestamp: timestamp,
  data: {
    temperature: Math.round((Math.random() * 40 + 10) * 100) / 100, // 10-50°C
    humidity: Math.round((Math.random() * 60 + 30) * 100) / 100,    // 30-90%
    pressure: Math.round((Math.random() * 200 + 900) * 100) / 100,  // 900-1100 hPa
    battery: Math.round(Math.random() * 100),                       // 0-100%
    status: Math.random() > 0.1 ? 'online' : 'offline',
    location: {
      lat: 39.9042 + (Math.random() - 0.5) * 0.1,
      lng: 116.4074 + (Math.random() - 0.5) * 0.1
    }
  },
  quality: Math.random() > 0.05 ? 'good' : 'poor'
}`,
    parameters: [
      {
        name: 'deviceId',
        type: 'string',
        description: 'equipmentID',
        required: false,
        defaultValue: 'device_001'
      }
    ],
    example: '// context = { deviceId: "sensor_001" }',
    isSystem: true
  },

  {
    name: 'Random time series data',
    description: 'Generate time series data array，Suitable for chart display',
    category: 'data-generation',
    code: `// Generate time series data
const points = context.points || 24
const startTime = context.startTime || (Date.now() - 24 * 60 * 60 * 1000)
const interval = context.interval || (60 * 60 * 1000) // 1hour interval

const data = []
let baseValue = context.baseValue || 20
let currentTime = startTime

for (let i = 0; i < points; i++) {
  // Add random fluctuations
  const variation = (Math.random() - 0.5) * context.variation || 5
  const value = Math.max(0, baseValue + variation + Math.sin(i / points * Math.PI * 2) * 10)
  
  data.push({
    timestamp: currentTime,
    value: Math.round(value * 100) / 100,
    label: new Date(currentTime).toLocaleTimeString()
  })
  
  currentTime += interval
  baseValue += (Math.random() - 0.5) * 2 // Trend changes
}

return data`,
    parameters: [
      {
        name: 'points',
        type: 'number',
        description: 'Number of data points',
        required: false,
        defaultValue: 24
      },
      {
        name: 'baseValue',
        type: 'number',
        description: 'Basic value',
        required: false,
        defaultValue: 20
      },
      {
        name: 'variation',
        type: 'number',
        description: 'Fluctuation range',
        required: false,
        defaultValue: 5
      }
    ],
    example: '// context = { points: 48, baseValue: 25, variation: 8 }',
    isSystem: true
  },

  {
    name: 'HTTP API data acquisition',
    description: 'fromHTTP APITemplate to get data',
    category: 'api-integration',
    code: `// HTTP APIdata acquisition
const url = context.url || 'https://api.example.com/data'
const method = context.method || 'GET'
const headers = context.headers || { 'Content-Type': 'application/json' }

try {
  const response = await fetch(url, {
    method: method,
    headers: headers,
    body: method !== 'GET' ? JSON.stringify(context.body) : undefined
  })
  
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`)
  }
  
  const data = await response.json()
  
  return {
    success: true,
    data: data,
    timestamp: Date.now(),
    source: url
  }
} catch (error) {
  console.error('APIcall failed:', error)
  return {
    success: false,
    error: error.message,
    timestamp: Date.now(),
    source: url
  }
}`,
    parameters: [
      {
        name: 'url',
        type: 'string',
        description: 'APIaddress',
        required: true
      },
      {
        name: 'method',
        type: 'string',
        description: 'HTTPmethod',
        required: false,
        defaultValue: 'GET'
      }
    ],
    example: '// context = { url: "https://api.weather.com/current", method: "GET" }',
    isSystem: true
  }
]

/**
 * Data Processor Script Template
 */
export const DATA_PROCESSOR_TEMPLATES: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Numerical calculation processing',
    description: 'Perform calculations on numerical data，as average、maximum value、Minimum value etc.',
    category: 'data-processing',
    code: `// Numerical calculation processing
if (!data || typeof data !== 'object') {
  return { error: 'Data format is incorrect' }
}

// Extract numeric fields
const numericFields = Object.keys(data).filter(key => 
  typeof data[key] === 'number' && !isNaN(data[key])
)

if (numericFields.length === 0) {
  return { error: 'Numeric field not found' }
}

const result = {
  original: data,
  processed: {
    sum: numericFields.reduce((sum, key) => sum + data[key], 0),
    average: numericFields.reduce((sum, key) => sum + data[key], 0) / numericFields.length,
    max: Math.max(...numericFields.map(key => data[key])),
    min: Math.min(...numericFields.map(key => data[key])),
    count: numericFields.length
  },
  fields: numericFields,
  timestamp: Date.now()
}

// Add calculation flag
result.processed.isValid = result.processed.average > 0
result.processed.level = result.processed.average > 50 ? 'high' : 
                        result.processed.average > 20 ? 'medium' : 'low'

return result`,
    parameters: [],
    example: '// data = { temperature: 25.5, humidity: 60, pressure: 1013.2 }',
    isSystem: true
  },

  {
    name: 'Array data filtering',
    description: 'Filter array data、Sorting and grouping',
    category: 'data-processing',
    code: `// Array data filtering
if (!Array.isArray(data)) {
  return { error: 'Input data is not an array' }
}

const filterValue = context?.filterValue || 0
const sortField = context?.sortField || 'value'
const groupField = context?.groupField || 'type'

// Filter data
const filtered = data.filter(item => {
  if (typeof item === 'number') return item > filterValue
  if (typeof item === 'object' && item.value !== undefined) {
    return item.value > filterValue
  }
  return true
})

// Sort data
const sorted = filtered.sort((a, b) => {
  const aVal = typeof a === 'object' ? a[sortField] : a
  const bVal = typeof b === 'object' ? b[sortField] : b
  return (aVal || 0) - (bVal || 0)
})

// grouped data
const grouped = {}
sorted.forEach(item => {
  const groupKey = typeof item === 'object' ? 
    (item[groupField] || 'default') : 'values'
  
  if (!grouped[groupKey]) {
    grouped[groupKey] = []
  }
  grouped[groupKey].push(item)
})

return {
  original: { count: data.length },
  filtered: { count: filtered.length, data: filtered },
  sorted: { count: sorted.length, data: sorted },
  grouped: grouped,
  summary: {
    totalItems: data.length,
    filteredItems: filtered.length,
    groups: Object.keys(grouped).length,
    filterCriteria: \`value > \${filterValue}\`,
    sortBy: sortField
  }
}`,
    parameters: [
      {
        name: 'filterValue',
        type: 'number',
        description: 'filter threshold',
        required: false,
        defaultValue: 0
      },
      {
        name: 'sortField',
        type: 'string',
        description: 'sort field',
        required: false,
        defaultValue: 'value'
      },
      {
        name: 'groupField',
        type: 'string',
        description: 'grouping field',
        required: false,
        defaultValue: 'type'
      }
    ],
    example: '// data = [{ value: 10, type: "A" }, { value: 25, type: "B" }]',
    isSystem: true
  },

  {
    name: 'Time data formatting',
    description: 'Formatting and time calculation of data containing timestamps',
    category: 'transformation',
    code: `// Time data formatting
const now = Date.now()
const timezone = context?.timezone || 'Asia/Shanghai'

// Processing timestamp fields
function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  return {
    timestamp: timestamp,
    iso: date.toISOString(),
    local: date.toLocaleString('zh-CN', { timeZone: timezone }),
    date: date.toLocaleDateString('zh-CN'),
    time: date.toLocaleTimeString('zh-CN'),
    age: now - timestamp, // Data age（millisecond）
    ageText: getAgeText(now - timestamp)
  }
}

function getAgeText(age) {
  const seconds = Math.floor(age / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return \`\${days}days ago\`
  if (hours > 0) return \`\${hours}hours ago\`
  if (minutes > 0) return \`\${minutes}minutes ago\`
  return \`\${seconds}seconds ago\`
}

// Process input data
if (typeof data === 'number') {
  // single timestamp
  return formatTimestamp(data)
} else if (Array.isArray(data)) {
  // timestamp array
  return data.map(item => {
    if (typeof item === 'number') {
      return formatTimestamp(item)
    } else if (typeof item === 'object' && item.timestamp) {
      return { ...item, timeInfo: formatTimestamp(item.timestamp) }
    }
    return item
  })
} else if (typeof data === 'object' && data.timestamp) {
  // An object containing a timestamp
  return {
    ...data,
    timeInfo: formatTimestamp(data.timestamp)
  }
}

// Add current time information
return {
  originalData: data,
  currentTime: formatTimestamp(now),
  processed: true
}`,
    parameters: [
      {
        name: 'timezone',
        type: 'string',
        description: 'time zone',
        required: false,
        defaultValue: 'Asia/Shanghai'
      }
    ],
    example: '// data = { value: 25, timestamp: 1640995200000 }',
    isSystem: true
  }
]

/**
 * Data Merger Script Template
 */
export const DATA_MERGER_TEMPLATES: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Smart object merge',
    description: 'Smart merge of multiple objects，Handle duplicate fields and data type conversion',
    category: 'data-processing',
    code: `// Smart object merge
if (!Array.isArray(items) || items.length === 0) {
  return {}
}

const result = {}
const metadata = {
  sources: items.length,
  conflicts: [],
  dataTypes: {},
  mergedFields: []
}

items.forEach((item, index) => {
  if (!item || typeof item !== 'object') return
  
  Object.keys(item).forEach(key => {
    const value = item[key]
    
    // Record data type
    const valueType = Array.isArray(value) ? 'array' : typeof value
    if (!metadata.dataTypes[key]) {
      metadata.dataTypes[key] = []
    }
    if (!metadata.dataTypes[key].includes(valueType)) {
      metadata.dataTypes[key].push(valueType)
    }
    
    if (result[key] === undefined) {
      // first assignment
      result[key] = value
      metadata.mergedFields.push(key)
    } else {
      // handling conflicts
      if (result[key] !== value) {
        metadata.conflicts.push({
          field: key,
          values: [result[key], value],
          sources: [\`item_\${index-1}\`, \`item_\${index}\`]
        })
        
        // merge strategy
        if (typeof result[key] === 'number' && typeof value === 'number') {
          // Averaging values
          result[key] = (result[key] + value) / 2
        } else if (Array.isArray(result[key]) && Array.isArray(value)) {
          // Array merging and deduplication
          result[key] = [...new Set([...result[key], ...value])]
        } else if (typeof result[key] === 'string' && typeof value === 'string') {
          // String concatenation
          result[key] = \`\${result[key]}, \${value}\`
        } else {
          // Keep the original value or use the latest value
          result[key] = value
        }
      }
    }
  })
})

return {
  ...result,
  _metadata: metadata,
  _mergeInfo: {
    timestamp: Date.now(),
    strategy: 'intelligent',
    itemsProcessed: items.length,
    fieldsCount: Object.keys(result).length - 2 // Exclude metadata
  }
}`,
    parameters: [],
    example: '// items = [{ name: "A", value: 10 }, { name: "B", value: 20 }]',
    isSystem: true
  },

  {
    name: 'Time series data merging',
    description: 'Merge multiple time series data arrays by timestamp',
    category: 'time-series',
    code: `// Time series data merging
if (!Array.isArray(items) || items.length === 0) {
  return []
}

// Collect all time series data points
const allPoints = []
const sources = []

items.forEach((item, index) => {
  if (Array.isArray(item)) {
    // Directly time series array
    item.forEach(point => {
      if (point && typeof point.timestamp === 'number') {
        allPoints.push({
          ...point,
          sourceIndex: index,
          sourceName: \`source_\${index}\`
        })
      }
    })
    sources.push(\`array_\${index}\`)
  } else if (item && typeof item === 'object') {
    if (typeof item.timestamp === 'number') {
      // single timing point
      allPoints.push({
        ...item,
        sourceIndex: index,
        sourceName: \`source_\${index}\`
      })
      sources.push(\`object_\${index}\`)
    } else if (item.data && Array.isArray(item.data)) {
      // Includedatafield object
      item.data.forEach(point => {
        if (point && typeof point.timestamp === 'number') {
          allPoints.push({
            ...point,
            sourceIndex: index,
            sourceName: item.name || \`source_\${index}\`
          })
        }
      })
      sources.push(item.name || \`wrapped_\${index}\`)
    }
  }
})

// Sort by timestamp
allPoints.sort((a, b) => a.timestamp - b.timestamp)

// Merge data points with the same timestamp
const merged = []
const timeGroups = {}

allPoints.forEach(point => {
  const timeKey = point.timestamp
  if (!timeGroups[timeKey]) {
    timeGroups[timeKey] = []
  }
  timeGroups[timeKey].push(point)
})

// Generate merged data
Object.keys(timeGroups).forEach(timestamp => {
  const points = timeGroups[timestamp]
  const mergedPoint = {
    timestamp: parseInt(timestamp),
    values: {},
    sources: [],
    count: points.length
  }
  
  points.forEach(point => {
    mergedPoint.sources.push(point.sourceName)
    
    // Merge numeric fields
    Object.keys(point).forEach(key => {
      if (key !== 'timestamp' && key !== 'sourceIndex' && key !== 'sourceName') {
        if (typeof point[key] === 'number') {
          if (!mergedPoint.values[key]) {
            mergedPoint.values[key] = []
          }
          mergedPoint.values[key].push(point[key])
        } else if (point[key] !== undefined) {
          mergedPoint[key] = point[key] // Keep non-numeric fields
        }
      }
    })
  })
  
  // Calculate statistics for numeric fields
  Object.keys(mergedPoint.values).forEach(key => {
    const values = mergedPoint.values[key]
    mergedPoint.values[key] = {
      raw: values,
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      sum: values.reduce((sum, v) => sum + v, 0)
    }
  })
  
  merged.push(mergedPoint)
})

return merged`,
    parameters: [],
    example: '// items = [array1, array2] where arrays contain {timestamp, value}',
    isSystem: true
  },

  {
    name: 'Conditional selection merge',
    description: 'Select the best data items for merging based on conditions',
    category: 'data-processing',
    code: `// Conditional selection merge
if (!Array.isArray(items) || items.length === 0) {
  return null
}

const criteria = context?.criteria || 'latest' // latest, highest, lowest, quality
const valueField = context?.valueField || 'value'
const timestampField = context?.timestampField || 'timestamp'
const qualityField = context?.qualityField || 'quality'

let selected = null
let reason = ''

switch (criteria) {
  case 'latest':
    // Select the latest timestamp
    selected = items.reduce((latest, item) => {
      if (!latest) return item
      const itemTime = item[timestampField] || 0
      const latestTime = latest[timestampField] || 0
      return itemTime > latestTime ? item : latest
    }, null)
    reason = 'Select the data item with the latest timestamp'
    break
    
  case 'highest':
    // Choose the one with the highest value
    selected = items.reduce((highest, item) => {
      if (!highest) return item
      const itemValue = item[valueField] || 0
      const highestValue = highest[valueField] || 0
      return itemValue > highestValue ? item : highest
    }, null)
    reason = \`choose\${valueField}The data item with the highest field value\`
    break
    
  case 'lowest':
    // Choose the one with the lowest value
    selected = items.reduce((lowest, item) => {
      if (!lowest) return item
      const itemValue = item[valueField] || Number.MAX_VALUE
      const lowestValue = lowest[valueField] || Number.MAX_VALUE
      return itemValue < lowestValue ? item : lowest
    }, null)
    reason = \`choose\${valueField}The data item with the lowest field value\`
    break
    
  case 'quality':
    // Choose the best quality
    const qualityOrder = ['excellent', 'good', 'fair', 'poor']
    selected = items.reduce((best, item) => {
      if (!best) return item
      const itemQuality = item[qualityField] || 'poor'
      const bestQuality = best[qualityField] || 'poor'
      const itemIndex = qualityOrder.indexOf(itemQuality)
      const bestIndex = qualityOrder.indexOf(bestQuality)
      return (itemIndex !== -1 && (bestIndex === -1 || itemIndex < bestIndex)) ? item : best
    }, null)
    reason = \`choose\${qualityField}Data items with the best field quality\`
    break
    
  default:
    selected = items[0]
    reason = 'Use default selection（first data item）'
}

// Add selection information
return {
  ...selected,
  _selectionInfo: {
    criteria: criteria,
    reason: reason,
    totalItems: items.length,
    selectedIndex: items.indexOf(selected),
    timestamp: Date.now(),
    alternatives: items.length - 1
  }
}`,
    parameters: [
      {
        name: 'criteria',
        type: 'string',
        description: 'Selection criteria',
        required: false,
        defaultValue: 'latest',
        validation: {
          enum: ['latest', 'highest', 'lowest', 'quality']
        }
      },
      {
        name: 'valueField',
        type: 'string',
        description: 'Numeric fields to compare',
        required: false,
        defaultValue: 'value'
      }
    ],
    example: '// context = { criteria: "highest", valueField: "temperature" }',
    isSystem: true
  }
]

/**
 * Universal tool script template
 */
export const UTILITY_TEMPLATES: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Data validator',
    description: 'Verify data format and integrity',
    category: 'validation',
    code: `// Data validator
const rules = context?.rules || {}
const result = {
  valid: true,
  errors: [],
  warnings: [],
  summary: {}
}

// Basic type checking
if (rules.type) {
  const actualType = Array.isArray(data) ? 'array' : typeof data
  if (actualType !== rules.type) {
    result.valid = false
    result.errors.push(\`type error: expect \${rules.type}, actual \${actualType}\`)
  }
}

// Required field check
if (rules.required && Array.isArray(rules.required)) {
  rules.required.forEach(field => {
    if (data[field] === undefined || data[field] === null) {
      result.valid = false
      result.errors.push(\`Missing required field: \${field}\`)
    }
  })
}

// Numeric range check
if (rules.ranges && typeof data === 'object') {
  Object.keys(rules.ranges).forEach(field => {
    if (data[field] !== undefined) {
      const range = rules.ranges[field]
      const value = data[field]
      
      if (typeof value === 'number') {
        if (range.min !== undefined && value < range.min) {
          result.errors.push(\`\${field} value \${value} less than minimum \${range.min}\`)
        }
        if (range.max !== undefined && value > range.max) {
          result.errors.push(\`\${field} value \${value} greater than maximum \${range.max}\`)
        }
      }
    }
  })
}

// Format check
if (rules.formats && typeof data === 'object') {
  Object.keys(rules.formats).forEach(field => {
    if (data[field] !== undefined) {
      const pattern = new RegExp(rules.formats[field])
      if (!pattern.test(String(data[field]))) {
        result.warnings.push(\`\${field} The format may be incorrect\`)
      }
    }
  })
}

// Generate summary
result.summary = {
  fieldsChecked: Object.keys(data || {}).length,
  errorsCount: result.errors.length,
  warningsCount: result.warnings.length,
  validationTime: Date.now()
}

return result`,
    parameters: [
      {
        name: 'rules',
        type: 'object',
        description: 'Validation rule configuration',
        required: false,
        defaultValue: {}
      }
    ],
    example: '// rules = { type: "object", required: ["id", "name"] }',
    isSystem: true
  },

  {
    name: 'Performance monitoring',
    description: 'Monitor script execution performance and resource usage',
    category: 'utility',
    code: `// Performance monitoring script
const startTime = performance.now()
const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0

// Execute main logic（The actual data processing code is placed here）
const processedData = data

// Performance measurement
const endTime = performance.now()
const memoryAfter = performance.memory ? performance.memory.usedJSHeapSize : 0

const metrics = {
  execution: {
    startTime: startTime,
    endTime: endTime,
    duration: endTime - startTime,
    durationText: \`\${(endTime - startTime).toFixed(2)}ms\`
  },
  memory: {
    before: memoryBefore,
    after: memoryAfter,
    used: memoryAfter - memoryBefore,
    usedText: \`\${((memoryAfter - memoryBefore) / 1024 / 1024).toFixed(2)}MB\`
  },
  data: {
    inputSize: JSON.stringify(data || {}).length,
    outputSize: JSON.stringify(processedData || {}).length,
    compressionRatio: JSON.stringify(data || {}).length > 0 ? 
      (JSON.stringify(processedData || {}).length / JSON.stringify(data || {}).length).toFixed(2) : 1
  },
  performance: {
    rating: endTime - startTime < 100 ? 'excellent' :
            endTime - startTime < 500 ? 'good' :
            endTime - startTime < 1000 ? 'fair' : 'poor',
    recommendations: []
  }
}

// Performance recommendations
if (metrics.execution.duration > 1000) {
  metrics.performance.recommendations.push('Execution time is too long，Consider optimization algorithms')
}
if (metrics.memory.used > 10 * 1024 * 1024) {
  metrics.performance.recommendations.push('Too much memory usage，Consider batching')
}
if (metrics.data.outputSize > metrics.data.inputSize * 2) {
  metrics.performance.recommendations.push('Output data is too bloated，Consider data compression')
}

return {
  result: processedData,
  metrics: metrics,
  timestamp: Date.now()
}`,
    parameters: [],
    example: '// Automatically measure the performance of any data processing operation',
    isSystem: true
  }
]

/**
 * All built-in templates
 */
export const ALL_BUILT_IN_TEMPLATES = [
  ...DATA_FETCHER_TEMPLATES,
  ...DATA_PROCESSOR_TEMPLATES,
  ...DATA_MERGER_TEMPLATES,
  ...UTILITY_TEMPLATES
]

/**
 * Initialize built-in templates into the template manager
 */
export function initializeBuiltInTemplates(templateManager: any) {
  let successCount = 0
  let errorCount = 0

  ALL_BUILT_IN_TEMPLATES.forEach(template => {
    try {
      templateManager.createTemplate(template)
      successCount++
    } catch (error) {
      errorCount++
    }
  })

  // Return statistics
  return {
    total: ALL_BUILT_IN_TEMPLATES.length,
    success: successCount,
    error: errorCount,
    categories: {
      'data-generation': DATA_FETCHER_TEMPLATES.filter(t => t.category === 'data-generation').length,
      'data-processing': [...DATA_PROCESSOR_TEMPLATES, ...DATA_MERGER_TEMPLATES].filter(
        t => t.category === 'data-processing'
      ).length,
      'api-integration': DATA_FETCHER_TEMPLATES.filter(t => t.category === 'api-integration').length,
      'time-series': DATA_MERGER_TEMPLATES.filter(t => t.category === 'time-series').length,
      transformation: DATA_PROCESSOR_TEMPLATES.filter(t => t.category === 'transformation').length,
      validation: UTILITY_TEMPLATES.filter(t => t.category === 'validation').length,
      utility: UTILITY_TEMPLATES.filter(t => t.category === 'utility').length
    }
  }
}
