# Enum Control components Card 2.1 Migrate configuration documents

## Component overview

Enum Control The component is an enum controller card，Provides multi-option button control functions。Users can select different enumeration values ​​through button groups to control device status，Support properties、Release of telemetry and command data。

## Current implementation analysis

### Component configuration (index.ts)
- **componentsID**: `chart-enumcontrol`
- **Component type**: `chart`
- **title**: `$t('card.enumControl')` (Enum control)
- **data source**: Equipment source，support1data sources
- **default layout**: 3x2 (minimum height1)

### Component implementation (component.vue)
- **Button configuration**: Support custom button options (label + value)
- **Data release**: Support properties、telemetry、Command three data types to publish
- **data type**: support string、number、boolean type conversion
- **status display**: The currently selected value is highlighted
- **real time updates**: support WebSocket Data update
- **Default options**: Provides default button configuration for climate control

## Card 2.1 Migrate configuration

### Component definition
```typescript
export const enumControlCard: CardDefinition = {
  id: 'enum-control',
  name: 'Enum controller',
  category: 'control',
  description: 'enum value controller，Support multi-option buttons to control device status',
  version: '2.1.0',
  
  // Data source configuration
  dataSource: {
    type: 'device',
    required: true,
    maxSources: 1,
    supportedMetrics: ['attributes', 'telemetry', 'command'],
    description: 'Device properties、Telemetry or command data source',
    capabilities: ['read', 'write'],
    dataTypes: ['string', 'number', 'boolean']
  },
  
  // layout configuration
  layout: {
    defaultSize: { width: 3, height: 2 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 6, height: 3 },
    resizable: true
  },
  
  // Configuration options
  configSchema: {
    btOptions: {
      type: 'array',
      title: 'Button options',
      description: 'Button configuration for enumeration control',
      required: true,
      default: [
        { label: 'heating', value: 'heat' },
        { label: 'Refrigeration', value: 'cool' },
        { label: 'ventilation', value: 'fan' },
        { label: 'automatic', value: 'auto' }
      ],
      items: {
        type: 'object',
        properties: {
          label: {
            type: 'string',
            title: 'display text',
            required: true
          },
          value: {
            type: 'string',
            title: 'data value',
            required: true
          }
        }
      },
      minItems: 1,
      maxItems: 8
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
    metricsType: 'attributes' | 'telemetry' | 'command';
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
      type: 'attribute' | 'telemetry' | 'command';
      dataType: 'string' | 'number' | 'boolean';
      access: 'read' | 'write' | 'readwrite';
      enumValues?: Array<{
        label: string;
        value: string | number | boolean;
      }>;
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
        type: deviceSource.metricsType === 'attributes' ? 'attribute' : 
              deviceSource.metricsType === 'telemetry' ? 'telemetry' : 'command',
        dataType: deviceSource.metricsDataType,
        access: 'readwrite'
      }]
    }
  };
}
```

### Implementation points

1. **Button configuration management**
   - Support dynamic configuration of button options
   - Each button contains display text and data values
   - Support the most8button options

2. **Data type conversion**
   - string: Use string value directly
   - number: use parseFloat Convert
   - boolean: use Boolean Convert

3. **Various data publishing methods**
   - attribute data：attributeDataPub
   - telemetry data：telemetryDataPub
   - command data：commandDataPub

4. **Status management**
   - The currently selected value is highlighted
   - support WebSocket real time updates
   - Operation successful/Failure feedback

5. **user interface**
   - Responsive button layout
   - Selected status visual feedback
   - Hover effects enhance interaction

## Migration checklist

- [ ] Verify data source mapping correctness
- [ ] Confirm button configuration function
- [ ] Test data type conversion
- [ ] Verify multiple data publishing methods
- [ ] Check access control
- [ ] Test status display
- [ ] Verify real-time data updates
- [ ] Confirm operation feedback mechanism
- [ ] Test responsive layout

## Migration steps

1. **create Card 2.1 Component definition**
   - Define component metadata and configuration schema
   - Set data source requirements and permission controls
   - Configure button option validation rules

2. **Implement data source adapter**
   - Create data source mapping function
   - Handle multiple data types support
   - Adapt to different publishing methods

3. **Migration control logic**
   - Keep button configuration managed
   - Adapt to new data publishing interface
   - Maintain data type conversion

4. **Update configuration form**
   - adaptation Card 2.1 Configuration architecture
   - Optimize button configuration interface
   - Add configuration validation

5. **Enhance user experience**
   - Improve button layout algorithm
   - Optimize status feedback
   - Add action confirmation

6. **Test verification**
   - Functional testing：button control、status display
   - Configuration test：Button option management
   - Permission test：Read and write permission verification
   - Compatibility testing：different data types、Device type
   - User experience testing：interactive response、visual feedback

## Configure validation rules

1. **Button option validation**
   - Configure at least1buttons，most8indivual
   - Each button must have display text and data value
   - Data values ​​cannot be repeated

2. **Data type validation**
   - Make sure the data values ​​match the metric data type
   - Verify the validity of numeric types
   - Check boolean value for correctness

3. **Permission verification**
   - Verify user control permissions
   - Check device write permissions
   - Confirm operational safety

## Usage scenarios

1. **air conditioning control**
   - Mode selection：heating、Refrigeration、ventilation、automatic
   - status display：Current operating mode

2. **Device mode control**
   - working mode：Manual、automatic、maintain
   - Running status：start up、stop、pause

3. **Parameter settings**
   - gear selection：Low、middle、high
   - Priority settings：urgent、normal、low priority

## Related documents

- [Card 2.1 Architecture documentation](../architecture/card21-architecture.md)
- [Data Source Mapping Guide](../guides/data-source-mapping.md)
- [Enumeration Control Security Guide](../guides/enum-control-security.md)
- [Button configuration specifications](../guides/button-configuration.md)