# Digit Indicator components Card 2.1 Migrate configuration

## Component overview
**Component name**: digit-indicator (digital indicator)  
**componentsID**: chart-digit  
**Classification**: information (Information display)  
**Function**: Display device data as large font numbers，Support unit and color configuration，Adaptive font size

## Current implementation analysis

### Configuration structure
```typescript
// Current configuration interface
interface CurrentConfig {
  dataSource: {
    origin: 'device';
    sourceNum: 1;
    systemSource: [{}];
    deviceSource: [{
      metricsType: 'telemetry' | 'attributes';
      deviceId: string;
      metricsId: string;
    }];
  };
  config: {
    name: string; // display name
  };
  iCardViewDefault: {
    w: 2; h: 2; minH: 1; minW: 1;
  };
}
```

### Data acquisition method
- **telemetry data**: pass `telemetryDataCurrentKeys` API Get current value
- **attribute data**: pass `getAttributeDataSet` API Get device properties
- **WebSocketrenew**: Support real-time data updates，Contains array data processing
- **unit processing**: Automatically extract data from unit Field，Default is '%'

### layout properties
- **adaptive fonts**: Dynamically adjust font size based on container size
- **Responsive design**: use ResizeObserver Listen for container changes
- **Minimum size**: support 1x1 minimal layout

## Card 2.1 Migrate configuration

### Component definition
```typescript
import type { ComponentDefinition } from '@/card2.1/core/types';

export const digitIndicatorDefinition: ComponentDefinition = {
  type: 'digit-indicator',
  name: 'digital indicator',
  description: 'Display device data as large font numbers，Support for units and adaptive fonts',
  category: 'information',
  
  // Default configuration
  defaultConfig: {
    displayName: 'digital indicator',
    fontSize: 'auto', // Adaptive font size
    showUnit: true,
    unitPosition: 'suffix', // 'prefix' | 'suffix'
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333333',
    backgroundColor: 'transparent'
  },
  
  // layout configuration
  layout: {
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 12, height: 12 },
    resizable: true,
    aspectRatio: null // Allow any ratio
  },
  
  // Data source configuration
  dataSources: {
    primary: {
      type: 'device-telemetry',
      required: true,
      multiple: false,
      description: 'Device Telemetry Data Source'
    }
  },
  
  // Static parameter configuration
  staticParams: {
    displayName: {
      type: 'string',
      label: 'display name',
      defaultValue: 'digital indicator',
      required: false
    },
    fontSize: {
      type: 'select',
      label: 'font size',
      options: [
        { label: 'Adaptive', value: 'auto' },
        { label: 'Small', value: 'small' },
        { label: 'middle', value: 'medium' },
        { label: 'big', value: 'large' },
        { label: 'extra large', value: 'xlarge' }
      ],
      defaultValue: 'auto'
    },
    showUnit: {
      type: 'boolean',
      label: 'Display unit',
      defaultValue: true
    },
    unitPosition: {
      type: 'select',
      label: 'unit location',
      options: [
        { label: 'prefix', value: 'prefix' },
        { label: 'suffix', value: 'suffix' }
      ],
      defaultValue: 'suffix',
      condition: { showUnit: true }
    },
    textAlign: {
      type: 'select',
      label: 'text alignment',
      options: [
        { label: 'left aligned', value: 'left' },
        { label: 'center', value: 'center' },
        { label: 'Align right', value: 'right' }
      ],
      defaultValue: 'center'
    },
    color: {
      type: 'color',
      label: 'text color',
      defaultValue: '#333333'
    },
    backgroundColor: {
      type: 'color',
      label: 'background color',
      defaultValue: 'transparent'
    }
  },
  
  // Interactive capability statement
  interactionCapabilities: {
    supportedEvents: ['click', 'dataUpdate'],
    supportedActions: ['refresh', 'highlight'],
    canListenToProps: ['value', 'unit', 'status'],
    defaultInteractionConfig: {
      onClick: {
        enabled: false,
        actions: []
      },
      onDataUpdate: {
        enabled: true,
        actions: ['updateDisplay']
      }
    }
  },
  
  // Attribute exposure whitelist
  exposeProps: ['currentValue', 'unit', 'displayText', 'isLoading', 'hasError']
};
```

### Data source mapping
```typescript
// Card 2.1 Data source interface
interface DataSourceMapping {
  // Device Telemetry Data Source
  deviceTelemetry: {
    deviceId: string;
    telemetryKey: string;
    aggregation?: 'latest' | 'avg' | 'sum' | 'min' | 'max';
    timeRange?: TimeRange;
  };
  
  // Device attribute data source  
  deviceAttribute: {
    deviceId: string;
    attributeKey: string;
  };
  
  // System data source
  systemData: {
    endpoint: string;
    params?: Record<string, any>;
  };
}
```

### Implementation points

#### 1. Data processing enhancements
- **Multi-source support**: Support telemetry、property、System data and other data sources
- **Data validation**: Add data type validation and error handling
- **caching mechanism**: Implement data caching，Reduce duplicate requests
- **format**: Support digital formatting（thousandth place、Decimal places etc.）

#### 2. Style system upgrade
- **Theme adaptation**: Support bright colors/Dark theme automatically switches
- **Font system**: Richer font size and weight options
- **color system**: Support theme colors and custom colors
- **Animation effects**: Transition animation when values ​​change

#### 3. Responsive optimization
- **Container query**: Use modern CSS Container query alternative ResizeObserver
- **breakpoint system**: Support layout adjustment in different sizes
- **Performance optimization**: Anti-shake processing and virtualized rendering

#### 4. Interactive capabilities
- **click event**: Support clicking to trigger custom actions
- **status feedback**: load、mistake、Visual feedback on success status
- **tooltip**: Show details and data sources
- **right click menu**: Provide refresh、Configuration and other quick operations

## Migration checklist

### functional equivalence
- [ ] Device telemetry data acquisition
- [ ] Obtaining device attribute data  
- [ ] WebSocket real time updates
- [ ] Adaptive font size
- [ ] Unit display and position control
- [ ] Responsive layout

### New features
- [ ] Multiple data sources support
- [ ] Theme adaptation
- [ ] Number formatting
- [ ] Animation effects
- [ ] interaction events
- [ ] Error handling

### Performance optimization
- [ ] Data cache
- [ ] Anti-shake processing
- [ ] Memory leak prevention
- [ ] Rendering optimization

## Migration steps

1. **Create component definition file** (`definition.ts`)
2. **accomplish Vue components** (`component.vue`)
3. **Configure data source adapter**
4. **Implement configuration panel**
5. **Add theme styles**
6. **Write unit tests**
7. **Performance testing and optimization**
8. **Documentation and examples**

## Related documents

- [Card 2.1 Component Development Guide](../../../card2.1/docs/component-development.md)
- [Data source system documentation](../../../card2.1/docs/data-source-system.md)
- [Interactive system documentation](../../../card2.1/docs/interaction-system.md)
- [Theme system documentation](../../../card2.1/docs/theme-system.md)