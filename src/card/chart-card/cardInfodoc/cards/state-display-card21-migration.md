# State Display components Card 2.1 Migrate configuration documents

## Component overview

State Display The component is a status display card，Used to display device status information。Visually represent the current status of the device through icons and color changes（activation/inactive）。

## Current implementation analysis

### Component configuration (index.ts)
- **componentsID**: `chart-state`
- **Component type**: `chart`
- **title**: `$t('card.statusCard')` (status card)
- **data source**: Equipment source，support1data sources
- **default layout**: 3x2 (minimum height1)

### Component implementation (component.vue)
- **data acquisition**: Get status value from device property data
- **State calculation**: Determine the current status based on the configured activation value
- **Icon display**: Support custom activation/Inactive icon
- **Color configuration**: Support custom activation/Inactive color
- **Responsive**: use ResizeObserver Dynamically adjust font size
- **data type**: support string、number、boolean type status value

## Card 2.1 Migrate configuration

### Component definition
```typescript
export const stateDisplayCard: CardDefinition = {
  id: 'state-display',
  name: 'status display',
  category: 'information',
  description: 'Card component that displays device status information，Support icon and color customization',
  version: '2.1.0',
  
  // Data source configuration
  dataSource: {
    type: 'device',
    required: true,
    maxSources: 1,
    supportedMetrics: ['attributes'],
    description: 'Device attribute data source'
  },
  
  // layout configuration
  layout: {
    defaultSize: { width: 3, height: 2 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 6, height: 4 },
    resizable: true
  },
  
  // Configuration options
  configSchema: {
    activeIconName: {
      type: 'string',
      default: 'BulbOutline',
      title: 'activation status icon',
      description: 'The name of the icon displayed when the device is activated'
    },
    inactiveIconName: {
      type: 'string', 
      default: 'Bulb',
      title: 'Inactive status icon',
      description: 'The name of the icon displayed when the device is inactive'
    },
    activeColor: {
      type: 'color',
      default: '#FFA500',
      title: 'Activation state color',
      description: 'The color of the icon when the device is activated'
    },
    inactiveColor: {
      type: 'color',
      default: '#808080', 
      title: 'Inactive state color',
      description: 'Icon color when device is inactive'
    },
    active0: {
      type: 'string',
      title: 'activation value',
      description: 'Data value representing activation status'
    },
    active1: {
      type: 'string',
      title: 'inactive value', 
      description: 'A data value representing an inactive state'
    }
  }
}
```

### Data source mapping
```typescript
// Original data source structure
interface OriginalDataSource {
  deviceSource: [{
    deviceId: string;
    metricsId: string;
    metricsName: string;
    metricsType: 'attributes';
    metricsDataType: 'string' | 'number' | 'boolean';
  }];
}

// Card 2.1 Data source structure  
interface Card21DataSource {
  device: {
    id: string;
    metrics: [{
      id: string;
      name: string;
      type: 'attribute';
      dataType: 'string' | 'number' | 'boolean';
    }];
  };
}

// mapping function
function mapDataSource(original: OriginalDataSource): Card21DataSource {
  const deviceSource = original.deviceSource[0];
  return {
    device: {
      id: deviceSource.deviceId,
      metrics: [{
        id: deviceSource.metricsId,
        name: deviceSource.metricsName,
        type: 'attribute',
        dataType: deviceSource.metricsDataType
      }]
    }
  };
}
```

### Implementation points

1. **State calculation logic**
   - Support status judgment of multiple data types
   - Configurable activation/Inactive judgment value
   - Default non-zero value is active state

2. **icon system**
   - integrated ionicons5 Icon library
   - Support dynamic icon switching
   - Icon color configurable

3. **Responsive design**
   - use ResizeObserver Monitor container size changes
   - Dynamically adjust font and icon sizes
   - Maintain good visual proportions

4. **Data update**
   - support WebSocket Real-time data updates
   - Monitor configuration changes and automatically recalculate status
   - exposed updateData Methods for external calls

## Migration checklist

- [ ] Verify data source mapping correctness
- [ ] Confirm status calculation logic
- [ ] Test icon display and switching
- [ ] Verify color configuration functionality
- [ ] Check out responsive layout
- [ ] Test real-time data updates
- [ ] Verify multiple data types support
- [ ] Confirm configuration form function

## Migration steps

1. **create Card 2.1 Component definition**
   - Define component metadata and configuration schema
   - Set data source requirements and layout constraints

2. **Implement data source adapter**
   - Create data source mapping function
   - Handle status values ​​of different data types

3. **Migrate component logic**
   - Maintain state calculation logic
   - Adapt to new data source structures
   - Maintain icons and color configurations

4. **Update configuration form**
   - adaptation Card 2.1 Configuration architecture
   - Keep existing configuration options
   - Optimize user experience

5. **Test verification**
   - Functional testing：status display、Icon switch、color change
   - Compatibility testing：different data types、Device type
   - Performance testing：Responsive adjustments、Data update

## Related documents

- [Card 2.1 Architecture documentation](../architecture/card21-architecture.md)
- [Data Source Mapping Guide](../guides/data-source-mapping.md)
- [Component configuration architecture](../architecture/component-config-schema.md)
- [Icon system documentation](../guides/icon-system.md)