# Chart Bar components Card 2.1 Migrate configuration documents

## Component overview

Chart Bar The component is a histogram card，Used to display historical data trends of the device。Support multiple data sources、Time range selection、Data aggregation and other functions，Provides rich chart interaction and configuration options。

## Current implementation analysis

### Component configuration (index.ts)
- **componentsID**: `chart-bar`
- **Component type**: `chart`
- **title**: `$t('card.barChart')` (bar chart)
- **data source**: Equipment source，Support the most9data sources
- **time range**: 支持time range选择 (isSupportTimeRange: true)
- **Data aggregation**: 支持Data aggregation功能 (isSupportAggregate: true)
- **default layout**: 6x5 (smallest3x3)

### Component implementation (component.vue + modules/bar-chart.vue)
- **charting engine**: based on ECharts accomplish
- **data acquisition**: 支持历史数据和当前data acquisition
- **Interactive functions**: Data scaling、Legend control、toolbox
- **Theme configuration**: 支持多种颜色Theme configuration
- **Responsive**: Adaptive container size changes
- **real time updates**: support WebSocket Data update

## Card 2.1 Migrate configuration

### Component definition
```typescript
export const chartBarCard: CardDefinition = {
  id: 'chart-bar',
  name: 'bar chart',
  category: 'data',
  description: 'bar chart，Supports historical data display and trend analysis from multiple data sources',
  version: '2.1.0',
  
  // Data source configuration
  dataSource: {
    type: 'device',
    required: true,
    maxSources: 9,
    supportedMetrics: ['telemetry', 'attributes'],
    description: 'Device telemetry or properties data source',
    capabilities: ['read', 'history'],
    dataTypes: ['number'],
    timeRange: {
      supported: true,
      defaultRange: '1h',
      maxRange: '30d'
    },
    aggregation: {
      supported: true,
      methods: ['avg', 'sum', 'min', 'max', 'count'],
      defaultMethod: 'avg'
    }
  },
  
  // layout configuration
  layout: {
    defaultSize: { width: 6, height: 5 },
    minSize: { width: 3, height: 3 },
    maxSize: { width: 12, height: 8 },
    resizable: true
  },
  
  // Configuration options
  configSchema: {
    name: {
      type: 'string',
      title: 'Chart name',
      description: 'The display name of the chart',
      default: 'bar chart'
    },
    colorGroups: {
      type: 'object',
      title: 'Color configuration',
      description: 'Chart color theme configuration',
      properties: {
        colorGroup: {
          type: 'array',
          title: 'color group',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', title: 'Topic name' },
              top: { type: 'color', title: 'top color' },
              bottom: { type: 'color', title: 'bottom color' },
              line: { type: 'color', title: 'line color' }
            }
          }
        }
      }
    },
    chartOptions: {
      type: 'object',
      title: 'Chart options',
      properties: {
        showLegend: {
          type: 'boolean',
          title: 'Show legend',
          default: true
        },
        showDataZoom: {
          type: 'boolean',
          title: 'Show data zoom',
          default: true
        },
        showToolbox: {
          type: 'boolean',
          title: 'Show toolbox',
          default: false
        }
      }
    }
  },
  
  // Permission requirements
  permissions: {
    read: true,
    history: true
  }
}
```

### Data source mapping
```typescript
// Original data source structure
interface OriginalDataSource {
  deviceSource: Array<{
    deviceId: string;
    metricsId: string;
    metricsName: string;
    metricsType: 'telemetry' | 'attributes';
    metricsDataType: 'number';
  }>;
  origin: 'device';
  sourceNum: number;
  isSupportTimeRange: boolean;
  isSupportAggregate: boolean;
}

// Card 2.1 Data source structure
interface Card21DataSource {
  devices: Array<{
    id: string;
    metrics: Array<{
      id: string;
      name: string;
      type: 'telemetry' | 'attribute';
      dataType: 'number';
      unit?: string;
    }>;
  }>;
  timeRange?: {
    start: number;
    end: number;
    interval: string;
  };
  aggregation?: {
    method: 'avg' | 'sum' | 'min' | 'max' | 'count';
    interval: string;
  };
}

// mapping function
function mapDataSource(original: OriginalDataSource): Card21DataSource {
  const deviceGroups = new Map<string, any>();
  
  original.deviceSource.forEach(source => {
    if (!deviceGroups.has(source.deviceId)) {
      deviceGroups.set(source.deviceId, {
        id: source.deviceId,
        metrics: []
      });
    }
    
    deviceGroups.get(source.deviceId).metrics.push({
      id: source.metricsId,
      name: source.metricsName,
      type: source.metricsType === 'telemetry' ? 'telemetry' : 'attribute',
      dataType: 'number'
    });
  });
  
  return {
    devices: Array.from(deviceGroups.values())
  };
}
```

### Implementation points

1. **Chart configuration**
   - based on ECharts Histogram implementation
   - Supports timeline and value axis configuration
   - Configurable legend、toolbox、Data scaling

2. **Data processing**
   - historical data：telemetryDataHistoryList
   - current data：telemetryDataCurrentKeys
   - Supports data merging of multiple devices and indicators

3. **Interactive functions**
   - Data scaling：Supports sliders and internal dragging
   - Legend control：show/Hide data series
   - Time range selection：Support custom time intervals

4. **theme system**
   - Predefined color theme groups
   - Support gradient color configuration
   - Adaptive light and dark themes

5. **Performance optimization**
   - Anti-shake processing data update
   - Virtualize big data sets
   - Responsive chart redraw

## Migration checklist

- [ ] Verify data source mapping correctness
- [ ] Confirm multiple data source support
- [ ] Test time range function
- [ ] Verify data aggregation functionality
- [ ] Check out chart interactivity
- [ ] Test theme configuration
- [ ] Validate responsive layout
- [ ] Test real-time data updates
- [ ] Confirm performance optimization effect

## Migration steps

1. **create Card 2.1 Component definition**
   - Define component metadata and configuration schema
   - Set data source requirements and time range support
   - Configure chart options and theme system

2. **Implement data source adapter**
   - Create multiple data source mapping functions
   - Handling time ranges and aggregation configurations
   - Adapt historical data query interface

3. **Migrate chart logic**
   - Keep ECharts Configuration structure
   - Adapt to new data formats
   - Maintain interactive functionality

4. **Update configuration form**
   - adaptation Card 2.1 Configuration architecture
   - Optimize the theme selection interface
   - Add chart option configuration

5. **Performance optimization**
   - Optimize rendering of large data sets
   - Improve data update mechanism
   - Enhance responsive performance

6. **Test verification**
   - Functional testing：Chart display、Interaction
   - Data testing：Multiple data sources、time range、polymerization
   - Performance testing：big data set、real time updates
   - Compatibility testing：Different device types、Data format
   - User experience testing：Responsive、theme switching

## Data processing flow

1. **data acquisition**
   ```typescript
   // Historical data query
   const historyData = await telemetryDataHistoryList({
     device_id: deviceId,
     keys: metricsId,
     start_time: startTime,
     end_time: endTime,
     aggregate: aggregateMethod
   });
   
   // Current data query
   const currentData = await telemetryDataCurrentKeys({
     device_id: deviceId,
     keys: metricsId
   });
   ```

2. **data conversion**
   ```typescript
   // Convert to ECharts Data format
   const seriesData = historyData.map(item => [
     item.timestamp,
     item.value
   ]);
   ```

3. **Chart updates**
   ```typescript
   // Update chart configuration
   option.value.series = [{
     name: metricsName,
     type: 'bar',
     data: seriesData,
     itemStyle: {
       color: colorConfig
     }
   }];
   ```

## Configuration example

```typescript
// Basic configuration
const basicConfig = {
  name: 'Equipment temperature trends',
  colorGroups: {
    colorGroup: [
      {
        name: 'Sky Reflection',
        top: '#2563EB',
        bottom: '#2563EB',
        line: '#2563EB'
      }
    ]
  },
  chartOptions: {
    showLegend: true,
    showDataZoom: true,
    showToolbox: false
  }
};

// Time range configuration
const timeRangeConfig = {
  start: Date.now() - 24 * 60 * 60 * 1000, // 24hours ago
  end: Date.now(),
  interval: '1h'
};

// Aggregation configuration
const aggregationConfig = {
  method: 'avg',
  interval: '5m'
};
```

## Related documents

- [Card 2.1 Architecture documentation](../architecture/card21-architecture.md)
- [Data Source Mapping Guide](../guides/data-source-mapping.md)
- [ECharts Integration Guide](../guides/echarts-integration.md)
- [Chart theme configuration](../guides/chart-theme-configuration.md)
- [Time series data processing](../guides/time-series-data-processing.md)