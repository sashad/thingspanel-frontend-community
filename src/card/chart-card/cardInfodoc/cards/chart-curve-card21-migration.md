# Chart Curve components Card 2.1 Migrate configuration documents

## Component overview

**componentsID**: `chart-curve`  
**Component type**: `chart`  
**Component name**: Curve chart  
**Function description**: based on ECharts Time series data curve chart component，Support multiple data sources、Time range selection、Data aggregation and other functions

## Current implementation analysis

### 1. Component structure
```
curve/
├── index.ts              # Component definition configuration
├── component.vue         # Main component entry
├── card-config.vue       # Configuration form
├── poster.png           # Component preview
├── theme.ts             # Theme configuration
└── modules/
    └── line-chart.vue   # Core chart implementation
```

### 2. Core features
- **Multiple data sources support**: Most supported 9 data sources
- **time range**: 支持time range选择和数据聚合
- **Interactive functions**: Data scaling、Legend control、toolbox
- **theme system**: 18 preset color themes
- **real time updates**: 支持设备遥测数据real time updates

### 3. Technical implementation
- **Chart library**: ECharts + vue-echarts
- **Data processing**: Support historical data and real-time data
- **Responsive**: Adaptive container size changes
- **Performance optimization**: Anti-shake processing、Data cache

## Card 2.1 Migrate configuration

### 1. Component definition (ComponentDefinition)

```typescript
import { ComponentDefinition } from '@/card2.1/types'

export const chartCurveDefinition: ComponentDefinition = {
  // Basic information
  id: 'chart-curve',
  name: 'chart.curve',
  type: 'chart',
  category: 'visualization',
  
  // Component configuration
  component: () => import('./component.vue'),
  configComponent: () => import('./config.vue'),
  
  // layout configuration
  layout: {
    defaultSize: { width: 6, height: 5 },
    minSize: { width: 3, height: 3 },
    maxSize: { width: 12, height: 12 },
    resizable: true
  },
  
  // Data source configuration
  dataSource: {
    type: 'device',
    multiple: true,
    maxCount: 9,
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
      // Chart configuration
      chart: {
        type: 'object',
        properties: {
          title: { type: 'string', default: '' },
          showLegend: { type: 'boolean', default: true },
          showDataZoom: { type: 'boolean', default: true },
          showToolbox: { type: 'boolean', default: false }
        }
      },
      
      // Style configuration
      style: {
        type: 'object',
        properties: {
          colorTheme: { 
            type: 'string', 
            enum: ['theme1', 'theme2'],
            default: 'theme1' 
          },
          curveWidth: { 
            type: 'number', 
            minimum: 1, 
            maximum: 5, 
            default: 1 
          },
          smooth: { type: 'boolean', default: true },
          area: { type: 'boolean', default: false }
        }
      },
      
      // Axis configuration
      axis: {
        type: 'object',
        properties: {
          xAxis: {
            type: 'object',
            properties: {
              show: { type: 'boolean', default: true },
              name: { type: 'string', default: '' },
              type: { type: 'string', enum: ['time', 'category'], default: 'time' }
            }
          },
          yAxis: {
            type: 'object',
            properties: {
              show: { type: 'boolean', default: true },
              name: { type: 'string', default: '' },
              min: { type: 'number' },
              max: { type: 'number' }
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
              range: { type: 'array', items: { type: 'number' } }
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
      color: 'string'          // Curve color
    }
  },
  
  // Time range configuration
  timeRange: {
    enabled: 'boolean',        // Whether to enable time range
    start: 'number',          // start timestamp
    end: 'number',            // end timestamp
    relative: 'string'        // relative time (like: '1h', '1d', '1w')
  },
  
  // Aggregation configuration
  aggregate: {
    enabled: 'boolean',       // Whether to enable aggregation
    method: 'string',         // aggregation method
    interval: 'string'        // aggregation interval
  }
}
```

### 3. Implementation points

#### Data processing flow
```typescript
// 1. data acquisition
const fetchData = async (dataSource: DataSourceConfig) => {
  if (dataSource.timeRange?.enabled) {
    // Get historical data
    return await telemetryDataHistoryList({
      deviceId: dataSource.deviceId,
      keys: [dataSource.metricKey],
      startTime: dataSource.timeRange.start,
      endTime: dataSource.timeRange.end,
      aggregate: dataSource.aggregate
    })
  } else {
    // Get real-time data
    return await telemetryDataCurrentKeys({
      deviceId: dataSource.deviceId,
      keys: [dataSource.metricKey]
    })
  }
}

// 2. data conversion
const transformData = (rawData: any[], config: ChartConfig) => {
  return rawData.map(item => [
    item.timestamp,
    item.value
  ])
}

// 3. Chart configuration generation
const generateChartOption = (data: any[], config: ChartConfig) => {
  return {
    series: data.map((seriesData, index) => ({
      name: config.dataSources[index].metricName,
      type: 'line',
      data: seriesData,
      smooth: config.style.smooth,
      lineStyle: {
        width: config.style.curveWidth,
        color: config.style.colorTheme[index]
      },
      areaStyle: config.style.area ? {} : null
    }))
  }
}
```

#### Theme system migration
```typescript
// Topic configuration mapping
const themeMapping = {
  theme1: colorGroups,    // Original colorGroups
  theme2: colorGroups2    // Original colorGroups2
}

// Dynamic theme application
const applyTheme = (themeName: string, seriesCount: number) => {
  const theme = themeMapping[themeName]
  return theme.slice(0, seriesCount).map(color => ({
    line: color.line,
    area: {
      top: color.top,
      bottom: color.bottom
    }
  }))
}
```

## Migration checklist

### Function migration
- [ ] Multiple data sources support (most9indivual)
- [ ] Time range selection function
- [ ] Data aggregation function
- [ ] Real-time data updates
- [ ] Chart interactive function (Zoom、legend)
- [ ] Theme switching function
- [ ] Responsive layout

### Configuration migration
- [ ] Chart title configuration
- [ ] Legend display control
- [ ] Axis configuration
- [ ] Curve style configuration
- [ ] Color theme configuration
- [ ] Data scaling configuration

### Performance optimization
- [ ] Data anti-shake processing
- [ ] Chart redraw optimization
- [ ] Memory leak prevention
- [ ] Large data volume processing

## Migration steps

### 1. Create component definition
```bash
# Create component directory
mkdir -p src/card2.1/components/chart/curve

# Create necessary files
touch src/card2.1/components/chart/curve/definition.ts
touch src/card2.1/components/chart/curve/component.vue
touch src/card2.1/components/chart/curve/config.vue
```

### 2. Implement core components
- migrate `component.vue` main component logic
- migrate `line-chart.vue` Chart implementation
- adaptation Card 2.1 Data source interface
- Implement configuration form components

### 3. Configuration verification
- Test multiple data source configurations
- Validate time range functionality
- Test data aggregation functionality
- Check the theme switching effect

### 4. Performance testing
- Large data volume rendering test
- Real-time data update performance
- Memory usage monitoring

## Data processing flow

### 1. Data acquisition process
```
User configuration → Data source validation → APIcall → Data preprocessing → Chart rendering
```

### 2. Real-time update process
```
WebSocketconnect → Data reception → Data validation → incremental update → Chart redraw
```

### 3. Aggregation processing flow
```
raw data → time grouping → aggregate calculation → Result caching → Chart display
```

## Configuration example

### Basic configuration
```json
{
  "chart": {
    "title": "Equipment temperature trends",
    "showLegend": true,
    "showDataZoom": true
  },
  "style": {
    "colorTheme": "theme1",
    "curveWidth": 2,
    "smooth": true,
    "area": false
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
  "chart": {
    "title": "Multiple device monitoring",
    "showLegend": true,
    "showDataZoom": true,
    "showToolbox": true
  },
  "style": {
    "colorTheme": "theme2",
    "curveWidth": 1,
    "smooth": true,
    "area": true
  },
  "axis": {
    "yAxis": {
      "name": "numerical value",
      "min": 0,
      "max": 100
    }
  },
  "data": {
    "timeRange": {
      "enabled": true,
      "range": [1640995200000, 1641081600000]
    },
    "aggregate": {
      "enabled": true,
      "method": "avg",
      "interval": "1h"
    }
  }
}
```

## Related documents

- [Card 2.1 Architecture documentation](../architecture.md)
- [Data source configuration guide](../data-source-guide.md)
- [Component Development Specifications](../component-development.md)
- [ECharts Integration Guide](../echarts-integration.md)
- [Theme system documentation](../theme-system.md)