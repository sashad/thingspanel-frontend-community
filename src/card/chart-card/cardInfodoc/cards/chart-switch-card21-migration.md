# Chart Switch components Card 2.1 Migrate configuration documents

## Component overview

Chart Switch The component is a device state controller card，Provide switch control function。Users can control the status of the device through the switch component，Supports reading and publishing of attributes and telemetry data。

## Current implementation analysis

### Component configuration (index.ts)
- **componentsID**: `chart-switch`
- **Component type**: `chart`
- **title**: `$t('card.deviceStateController')` (Device status controller)
- **data source**: Equipment source，support1data sources
- **default layout**: 3x2 (minimum height1)

### Component implementation (component.vue)
- **data acquisition**: Supports obtaining switch status from device properties or telemetry data
- **status control**: pass API Publish properties or telemetry data to control devices
- **State calculation**: Determine switch status based on configured activation value
- **data type**: support string、number、boolean switch value of type
- **real time updates**: support WebSocket Data update

## Card 2.1 Migrate configuration

### Component definition
```typescript
export const chartSwitchCard: CardDefinition = {
  id: 'chart-switch',
  name: 'switch control',
  category: 'control',
  description: 'Device status controller，Support switch control and status display',
  version: '2.1.0',
  
  // Data source configuration
  dataSource: {
    type: 'device',
    required: true,
    maxSources: 1,
    supportedMetrics: ['attributes', 'telemetry'],
    description: 'Device properties or telemetry data source',
    capabilities: ['read', 'write']
  },
  
  // layout configuration
  layout: {
    defaultSize: { width: 3, height: 2 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 4, height: 3 },
    resizable: true
  },
  
  // Configuration options
  configSchema: {
    active0: {
      type: 'string',
      title: 'open value',
      description: 'The corresponding data value when the switch is turned on',
      placeholder: 'For example: 1, true, on'
    },
    active1: {
      type: 'string',
      title: 'close value',
      description: 'The corresponding data value when the switch is closed',
      placeholder: 'For example: 0, false, off'
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
      type: 'attribute' | 'telemetry';
      dataType: 'string' | 'number' | 'boolean';
      access: 'read' | 'write' | 'readwrite';
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
        dataType: deviceSource.metricsDataType,
        access: 'readwrite'
      }]
    }
  };
}
```

### Implementation points

1. **Switch state calculation**
   - Support custom opening/Close value configuration
   - Value conversion based on data type
   - Default non-zero value is on

2. **Device control functions**
   - Support attribute data publishing (attributeDataPub)
   - Support telemetry data publishing (telemetryDataPub)
   - Choose a publishing method based on data source type

3. **Data type handling**
   - string: Support custom string values
   - number: Support numerical conversion
   - boolean: Support boolean conversion

4. **Real-time data updates**
   - monitor WebSocket Data update
   - Automatic calculation of switch states
   - Support configuration change response

## Migration checklist

- [ ] Verify data source mapping correctness
- [ ] Confirm switch status calculation logic
- [ ] Test equipment control functions
- [ ] Verify data type conversion
- [ ] Check access control
- [ ] Test real-time data updates
- [ ] Verify configuration form functionality
- [ ] Confirm error handling mechanism

## Migration steps

1. **create Card 2.1 Component definition**
   - Define component metadata and configuration schema
   - Set data source requirements and permission controls
   - Configure layout constraints

2. **Implement data source adapter**
   - Create data source mapping function
   - Handle read and write permission verification
   - Adapt to different data types

3. **Migration control logic**
   - Maintain switch state calculation logic
   - Adapt to new data publishing interface
   - Maintain data type conversion

4. **Update configuration form**
   - adaptation Card 2.1 Configuration architecture
   - Keep existing configuration options
   - Add data type hints

5. **Security enhancements**
   - Add permission verification
   - Implement operation logging
   - Enhanced error handling

6. **Test verification**
   - Functional testing：switch control、status display
   - Permission test：Read and write permission verification
   - Compatibility testing：different data types、Device type
   - Security testing：Permission control、Exception handling

## security considerations

1. **Permission control**
   - Verify that the user has device control permissions
   - Check if the device supports write operations
   - Record control operation log

2. **Data validation**
   - Verify the validity of control values
   - Check data type match
   - Prevent invalid data from being sent

3. **Error handling**
   - Network exception handling
   - Device offline processing
   - Insufficient permission prompt

## Related documents

- [Card 2.1 Architecture documentation](../architecture/card21-architecture.md)
- [Data Source Mapping Guide](../guides/data-source-mapping.md)
- [Device Control Security Guide](../guides/device-control-security.md)
- [Rights management documentation](../guides/permission-management.md)