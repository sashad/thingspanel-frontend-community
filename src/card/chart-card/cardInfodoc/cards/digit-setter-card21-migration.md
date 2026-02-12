# Digit Setter components Card 2.1 Migrate configuration documents

## Component overview

Digit Setter The component is a numerical controller card，Provides slider control function。Users can adjust the numerical parameters of the device through sliders，Supports reading and setting properties and telemetry data。

## Current implementation analysis

### Component configuration (index.ts)
- **componentsID**: `chart-digitsetter`
- **Component type**: `chart`
- **title**: `$t('card.numControl')` (numerical control)
- **data source**: Equipment source，support1data sources
- **default layout**: 2x2 (smallest1x1)

### Component implementation (component.vue)
- **data acquisition**: Supports getting current value from device properties or telemetry data
- **numerical control**: Adjust the value via the slider component，support API release
- **Configuration options**: Support minimum value、maximum value、step size、Decimal digit configuration
- **unit display**: Automatically obtain and display data units
- **Responsive**: use ResizeObserver Dynamically adjust font size
- **real time updates**: support WebSocket Data update

## Card 2.1 Migrate configuration

### Component definition
```typescript
export const digitSetterCard: CardDefinition = {
  id: 'digit-setter',
  name: 'value setter',
  category: 'control',
  description: 'numerical controller，Support slider to adjust device parameter values',
  version: '2.1.0',
  
  // Data source configuration
  dataSource: {
    type: 'device',
    required: true,
    maxSources: 1,
    supportedMetrics: ['attributes', 'telemetry'],
    description: 'Device properties or telemetry data source',
    capabilities: ['read', 'write'],
    dataTypes: ['number']
  },
  
  // layout configuration
  layout: {
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 4, height: 3 },
    resizable: true
  },
  
  // Configuration options
  configSchema: {
    min: {
      type: 'number',
      default: 0,
      title: 'minimum value',
      description: 'slider minimum value',
      required: true
    },
    max: {
      type: 'number',
      default: 100,
      title: 'maximum value',
      description: 'The maximum value of the slider',
      required: true,
      validation: {
        min: 'min'
      }
    },
    step: {
      type: 'number',
      default: 0.1,
      title: 'step size',
      description: 'The step size of the slider adjustment',
      min: 0.001,
      max: 100
    },
    decimals: {
      type: 'integer',
      default: 1,
      title: 'Decimal places',
      description: 'Number of decimal places to display',
      min: 0,
      max: 6
    }
  },
  
  // Permission requirements
  permissions: {
    read: true,
    write: true,
    control: true
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
    metricsType: 'attributes' | 'telemetry';
    metricsDataType: 'number';
  }];
}

// Card 2.1 Data source structure
interface Card21DataSource {
  device: {
    id: string;
    metrics: [{
      id: string;
      name: string;
      type: 'attribute' | 'telemetry';
      dataType: 'number';
      unit?: string;
      access: 'read' | 'write' | 'readwrite';
      range?: {
        min: number;
        max: number;
      };
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
        type: deviceSource.metricsType === 'attributes' ? 'attribute' : 'telemetry',
        dataType: 'number',
        access: 'readwrite'
      }]
    }
  };
}
```

### Implementation points

1. **Numerical control logic**
   - Support slider to adjust value in real time
   - Configure minimum value、maximum value、step size
   - Support decimal place control

2. **Data acquisition and release**
   - attribute data：getAttributeDataSet / attributeDataPub
   - telemetry data：telemetryDataCurrentKeys / telemetryDataPub
   - Automatically obtain data unit information

3. **user interface**
   - Numerical display：current value + unit
   - Slider control：NSlider components
   - Indicator name：Show data source name

4. **Responsive design**
   - use ResizeObserver Listening container size
   - Dynamically adjust font size
   - Maintain good visual proportions

5. **Data validation**
   - Validate value range when configuration changes
   - Make sure the value is within the valid range
   - Support real-time data updates

## Migration checklist

- [ ] Verify data source mapping correctness
- [ ] Confirm numerical control logic
- [ ] Test slider functionality
- [ ] Verify configuration options
- [ ] Check access control
- [ ] Test unit display
- [ ] Validate responsive layout
- [ ] Test real-time data updates
- [ ] Confirm numerical verification mechanism

## Migration steps

1. **create Card 2.1 Component definition**
   - Define component metadata and configuration schema
   - Set data source requirements and permission controls
   - Configure layout constraints and numerical validation

2. **Implement data source adapter**
   - Create data source mapping function
   - Handling numeric type validation
   - Acquisition of adaptation unit information

3. **Migration control logic**
   - Keep slider control logic
   - Adapt to new data publishing interface
   - Maintain value range validation

4. **Update configuration form**
   - adaptation Card 2.1 Configuration architecture
   - Add numeric range validation
   - Optimize configuration interface

5. **Enhance user experience**
   - Improve numerical display format
   - Optimize slider interaction experience
   - Add action feedback

6. **Test verification**
   - Functional testing：numerical control、Slider operation
   - Configuration test：Scope setting、step size adjustment
   - Permission test：Read and write permission verification
   - Compatibility testing：Different device types
   - Performance testing：Responsive adjustments、Data update

## Configure validation rules

1. **Numeric range validation**
   - The maximum value must be greater than the minimum value
   - Step size must be positive and reasonable
   - The number of decimal places is within the valid range

2. **Data type validation**
   - Make sure the data source is of numeric type
   - Verify that the current value is within the configured range
   - Check the validity of unit information

3. **Permission verification**
   - Verify user control permissions
   - Check device write permissions
   - Confirm operational safety

## Related documents

- [Card 2.1 Architecture documentation](../architecture/card21-architecture.md)
- [Data Source Mapping Guide](../guides/data-source-mapping.md)
- [Numerical Control Safety Guide](../guides/numeric-control-security.md)
- [Configuration verification specifications](../guides/config-validation.md)