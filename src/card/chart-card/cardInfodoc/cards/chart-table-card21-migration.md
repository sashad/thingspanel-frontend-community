# Chart Table components Card 2.1 Migrate configuration documents

## Component overview

**componentsID**: `chart-table`  
**Component type**: `chart`  
**Component name**: data table  
**Function description**: based on Naive UI data table component，Support multiple data sources、Pagination、Time range selection、Data aggregation and other functions

## Current implementation analysis

### 1. Component structure
```
table/
├── index.ts              # Component definition configuration
├── component.vue         # Main component entry
├── card-config.vue       # Configuration form
├── poster.png           # Component preview
└── modules/
    └── table.vue        # Core table implementation
```

### 2. Core features
- **Multiple data sources support**: Most supported 20 data sources
- **time range**: 支持time range选择和数据聚合
- **Paging function**: Support paging display，Configurable number of items per page
- **Data merge**: Merge multiple data sources by time dimension
- **real time updates**: 支持设备遥测数据real time updates
- **time formatting**: Automatically format timestamp display

### 3. Technical implementation
- **Table component**: Naive UI NDataTable
- **Data processing**: Time dimension data merging、Pagination
- **time processing**: moment.js time formatting
- **Responsive**: Dynamic column generation、Data monitoring

## Card 2.1 Migrate configuration

### 1. Component definition (ComponentDefinition)

```typescript
import { ComponentDefinition } from '@/card2.1/types'

export const chartTableDefinition: ComponentDefinition = {
  // Basic information
  id: 'chart-table',
  name: 'chart.table',
  type: 'chart',
  category: 'data-display',
  
  // Component configuration
  component: () => import('./component.vue'),
  configComponent: () => import('./config.vue'),
  
  // layout configuration
  layout: {
    defaultSize: { width: 8, height: 5 },
    minSize: { width: 3, height: 3 },
    maxSize: { width: 12, height: 12 },
    resizable: true
  },
  
  // Data source configuration
  dataSource: {
    type: 'device',
    multiple: true,
    maxCount: 20,
    required: true,
    supportedTypes: ['telemetry', 'attribute'],
    features: {
      timeRange: true,
      aggregate: true,
      realtime: true
    }
  },
  
  // configuration mode
  configSchema: {
    type: 'object',
    properties: {
      // Table configuration
      table: {
        type: 'object',
        properties: {
          title: { type: 'string', default: '' },
          showBorder: { type: 'boolean', default: false },
          striped: { type: 'boolean', default: false },
          size: { 
            type: 'string', 
            enum: ['small', 'medium', 'large'], 
            default: 'medium' 
          }
        }
      },
      
      // Paging configuration
      pagination: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', default: true },
          pageSize: { 
            type: 'number', 
            minimum: 5, 
            maximum: 100, 
            default: 10 
          },
          showSizePicker: { type: 'boolean', default: true },
          pageSizes: { 
            type: 'array', 
            items: { type: 'number' },
            default: [10, 15, 20, 50] 
          }
        }
      },
      
      // column configuration
      columns: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            title: { type: 'string' },
            width: { type: 'number' },
            align: { 
              type: 'string', 
              enum: ['left', 'center', 'right'], 
              default: 'left' 
            },
            sortable: { type: 'boolean', default: false },
            filterable: { type: 'boolean', default: false },
            format: {
              type: 'object',
              properties: {
                type: { 
                  type: 'string', 
                  enum: ['number', 'date', 'text'], 
                  default: 'text' 
                },
                precision: { type: 'number', default: 2 },
                dateFormat: { type: 'string', default: 'YYYY-MM-DD HH:mm:ss' }
              }
            }
          }
        }
      },
      
      // Data configuration
      data: {
        type: 'object',
        properties: {
          timeRange: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean', default: false },
              range: { type: 'array', items: { type: 'number' } },
              relative: { type: 'string', default: 'last_1h' }
            }
          },
          aggregate: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean', default: false },
              method: { 
                type: 'string', 
                enum: ['avg', 'sum', 'max', 'min', 'count'],
                default: 'avg' 
              },
              interval: { type: 'string', default: '1h' }
            }
          },
          sorting: {
            type: 'object',
            properties: {
              column: { type: 'string', default: 'time' },
              order: { 
                type: 'string', 
                enum: ['asc', 'desc'], 
                default: 'desc' 
              }
            }
          }
        }
      }
    }
  }
}
```

### 2. Data source mapping

```typescript
// Original data source structure -> Card 2.1 Data source structure
const dataSourceMapping = {
  // Device data source
  deviceSource: {
    type: 'device',
    config: {
      deviceId: 'string',      // equipmentID
      metricKey: 'string',     // Indicator key name
      metricName: 'string',    // Indicator display name
      unit: 'string',          // unit
      aggregateFunction: 'string' // aggregate function
    }
  },
  
  // Time range configuration
  timeRange: {
    enabled: 'boolean',        // Whether to enable time range
    range: 'string',          // time range (like: 'last_1h', 'last_1d')
    custom: {                 // Custom time range
      start: 'number',        // start timestamp
      end: 'number'           // end timestamp
    }
  },
  
  // Aggregation configuration
  aggregate: {
    enabled: 'boolean',       // Whether to enable aggregation
    window: 'string',         // aggregation window
    function: 'string'        // aggregate function
  }
}
```

### 3. Implementation points

#### Data processing flow
```typescript
// 1. data acquisition
const fetchTableData = async (dataSources: DataSourceConfig[]) => {
  const promises = dataSources.map(source => {
    const params = {
      device_id: source.deviceId,
      key: source.metricKey,
      aggregate_window: source.aggregate?.window || 'no_aggregate',
      aggregate_function: source.aggregate?.function || 'avg',
      time_range: source.timeRange?.range || 'last_1h'
    }
    
    return telemetryDataHistoryList(params).then(res =>
      res.data.map(item => ({
        ...item,
        key: source.metricKey
      }))
    )
  })
  
  const results = await Promise.all(promises)
  return results.flat()
}

// 2. Data merging processing
const mergeDataByTime = (data: any[]) => {
  const timeMap = new Map()
  
  data.forEach(({ x: timestamp, y: value, key }) => {
    if (!timeMap.has(timestamp)) {
      timeMap.set(timestamp, { time: timestamp })
    }
    timeMap.get(timestamp)[key] = value
  })
  
  // Sort by time
  return Array.from(timeMap.values()).sort((a, b) => b.time - a.time)
}

// 3. Dynamic column generation
const generateColumns = (dataSources: DataSourceConfig[], config: TableConfig) => {
  const columns = [
    {
      title: 'time',
      key: 'time',
      render: (row: any) => {
        return moment(row.time).format(config.columns?.timeFormat || 'YYYY-MM-DD HH:mm:ss')
      },
      sortable: true
    }
  ]
  
  dataSources.forEach(source => {
    columns.push({
      title: source.metricName,
      key: source.metricKey,
      render: (row: any) => {
        const value = row[source.metricKey]
        if (value === undefined || value === null) return ''
        
        // Numeric formatting
        if (typeof value === 'number') {
          return value.toFixed(config.columns?.precision || 2) + (source.unit || '')
        }
        return value
      },
      sortable: config.columns?.sortable || false
    })
  })
  
  return columns
}
```

#### Pagination
```typescript
// Paging configuration
const paginationConfig = reactive({
  page: 1,
  pageSize: config.pagination?.pageSize || 10,
  itemCount: 0,
  showSizePicker: config.pagination?.showSizePicker || true,
  pageSizes: config.pagination?.pageSizes || [10, 15, 20, 50]
})

// Paging data calculation
const paginatedData = computed(() => {
  const startIndex = (paginationConfig.page - 1) * paginationConfig.pageSize
  const endIndex = startIndex + paginationConfig.pageSize
  return allTableData.value.slice(startIndex, endIndex)
})

// Pagination event handling
const handlePageChange = (page: number) => {
  paginationConfig.page = page
}

const handlePageSizeChange = (pageSize: number) => {
  paginationConfig.pageSize = pageSize
  paginationConfig.page = 1 // Reset to first page
}
```

#### Data update mechanism
```typescript
// Listen for configuration changes
watch(
  () => props.card,
  async () => {
    // Regenerate column configuration
    columns.value = generateColumns(
      props.card.dataSource.deviceSource,
      props.card.config
    )
    
    // Retrieve data
    await fetchTableData()
  },
  { deep: true }
)

// Real-time data updates
const updateData = (deviceId: string, metricKey: string, data: any) => {
  // Update the data of the corresponding device
  const existingIndex = allTableData.value.findIndex(
    item => item.time === data.timestamp
  )
  
  if (existingIndex >= 0) {
    // Update existing data
    allTableData.value[existingIndex][metricKey] = data.value
  } else {
    // Add new data
    const newRow = { time: data.timestamp, [metricKey]: data.value }
    allTableData.value.unshift(newRow)
    
    // Keep data volume limits
    if (allTableData.value.length > 1000) {
      allTableData.value = allTableData.value.slice(0, 1000)
    }
  }
  
  // Update pagination information
  paginationConfig.itemCount = allTableData.value.length
}
```

## Migration checklist

### Function migration
- [ ] Multiple data sources support (most20indivual)
- [ ] Time range selection function
- [ ] Data aggregation function
- [ ] Paging display function
- [ ] Data sorting function
- [ ] Real-time data updates
- [ ] Time formatted display

### Configuration migration
- [ ] Table style configuration
- [ ] Paging parameter configuration
- [ ] Column display configuration
- [ ] Data format configuration
- [ ] Sorting configuration
- [ ] Filter configuration

### Performance optimization
- [ ] Large data volume paging processing
- [ ] Virtual scrolling support
- [ ] Data caching mechanism
- [ ] Memory leak prevention

## Migration steps

### 1. Create component definition
```bash
# Create component directory
mkdir -p src/card2.1/components/chart/table

# Create necessary files
touch src/card2.1/components/chart/table/definition.ts
touch src/card2.1/components/chart/table/component.vue
touch src/card2.1/components/chart/table/config.vue
```

### 2. Implement core components
- migrate `component.vue` main component logic
- migrate `table.vue` Table implementation
- adaptation Card 2.1 Data source interface
- Implement configuration form components

### 3. Configuration verification
- Test multiple data source configurations
- Verify paging functionality
- Test data aggregation functionality
- Check sorting and filtering effects

### 4. Performance testing
- Large data volume rendering test
- Paging performance test
- Memory usage monitoring

## Data processing flow

### 1. Data acquisition process
```
User configuration → Data source validation → APIcall → Data preprocessing → Table rendering
```

### 2. Data merging process
```
multi-source data → Time dimension grouping → Data merge → sort processing → Paginated display
```

### 3. Real-time update process
```
WebSocketconnect → Data reception → Data validation → incremental update → Table redraw
```

## Configuration example

### Basic configuration
```json
{
  "table": {
    "title": "Equipment data sheet",
    "showBorder": true,
    "striped": true,
    "size": "medium"
  },
  "pagination": {
    "enabled": true,
    "pageSize": 15,
    "showSizePicker": true,
    "pageSizes": [10, 15, 20, 50]
  },
  "dataSources": [
    {
      "deviceId": "device_001",
      "metricKey": "temperature",
      "metricName": "temperature",
      "unit": "°C"
    }
  ]
}
```

### Advanced configuration
```json
{
  "table": {
    "title": "Multiple device monitoring data",
    "showBorder": true,
    "striped": false,
    "size": "small"
  },
  "pagination": {
    "enabled": true,
    "pageSize": 20,
    "showSizePicker": true,
    "pageSizes": [10, 20, 50, 100]
  },
  "columns": [
    {
      "key": "time",
      "title": "time",
      "width": 200,
      "align": "center",
      "sortable": true,
      "format": {
        "type": "date",
        "dateFormat": "MM-DD HH:mm:ss"
      }
    },
    {
      "key": "temperature",
      "title": "temperature",
      "width": 120,
      "align": "right",
      "sortable": true,
      "format": {
        "type": "number",
        "precision": 1
      }
    }
  ],
  "data": {
    "timeRange": {
      "enabled": true,
      "relative": "last_24h"
    },
    "aggregate": {
      "enabled": true,
      "method": "avg",
      "interval": "1h"
    },
    "sorting": {
      "column": "time",
      "order": "desc"
    }
  }
}
```

## Usage scenarios

### 1. Equipment monitoring data display
- Real-time data comparison of multiple devices
- Historical data trend analysis
- Quickly locate abnormal data

### 2. Data report generation
- Regular data summary report
- Multidimensional data analysis
- Data export function

### 3. Operation and maintenance monitoring panel
- System indicator monitoring
- Performance data display
- Alarm data list

## Related documents

- [Card 2.1 Architecture documentation](../architecture.md)
- [Data source configuration guide](../data-source-guide.md)
- [Component Development Specifications](../component-development.md)
- [Naive UI Table component documentation](https://www.naiveui.com/zh-CN/os-theme/components/data-table)
- [Pagination component integration guide](../pagination-integration.md)