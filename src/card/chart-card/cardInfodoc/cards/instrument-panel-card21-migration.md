# Instrument Panel components Card 2.1 Migrate configuration

## 📊 Component overview

**Component name**: instrument-panel (Dashboard)
**Classification**: dashboard (Dashboard)
**Function**: Circular dashboard showing a single value，Support custom minimum value、Maximum value and unit
**Applicable scenarios**: temperature、pressure、Visual display of single indicators such as speed

## 🔄 Current implementation analysis

### Original configuration structure
```typescript
// current chart-card Configuration
{
  id: 'instrument-panel',
  type: 'chart',
  preset: {
    dataSource: {
      origin: 'device',
      sourceNum: 1,
      systemSource: [{}],
      deviceSource: [{}]
    },
    config: {
      unit: '',      // unit
      min: 0,        // minimum value
      max: 200       // maximum value
    },
    iCardViewDefault: {
      w: 5, h: 3, minH: 1, minW: 2
    }
  }
}
```

### Data acquisition method
- pass `telemetryDataCurrentKeys` API Get device telemetry data
- Support real-time data updates (`updateData` method)
- Data format: `{ [metricsId]: value, unit?: string }`

## 🚀 Card 2.1 Migrate configuration

### 1. Component definition (definition.ts)

```typescript
import type { ComponentDefinition } from '@/card2.1/types'
import { createPropertyWhitelist } from '@/card2.1/core/PropertyExposureManager'
import InstrumentPanelComponent from './component.vue'
import InstrumentPanelSetting from './setting.vue'

export const instrumentPanelDefinition: ComponentDefinition = {
  // 🏷️ Basic information
  type: 'instrument-panel',
  name: '📊 Dashboard',
  description: 'Circular dashboard showing a single value，Support custom minimum value、Maximum value and unit',
  icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" /></svg>',
  version: '2.1.0',
  author: 'ThingsPanel',

  // 🎨 Component implementation
  component: InstrumentPanelComponent,
  configComponent: InstrumentPanelSetting,

  // 📐 layout configuration
  defaultLayout: {
    gridstack: { w: 5, h: 3, x: 0, y: 0, minW: 2, minH: 1, maxW: 8, maxH: 6 }
  },
  layout: {
    defaultSize: { width: 5, height: 3 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 8, height: 6 },
    resizable: true
  },

  // 🔐 Permission configuration
  permission: 'NO_LIMIT',

  // 🏷️ Tag classification
  tags: ['Dashboard', 'Numerical display', 'monitor', 'dashboard'],
  category: 'dashboard',

  // ⚡ Features
  features: {
    realtime: true,        // Support real-time data
    dataBinding: true,     // Support data binding
    configurable: true,    // Support configuration
    responsive: true       // Responsive layout
  },

  // 📊 Data source requirements
  dataSources: [
    {
      key: 'value',
      name: 'Dashboard values',
      description: 'Main values ​​displayed on the dashboard',
      supportedTypes: ['static', 'api', 'websocket', 'mqtt'],
      required: true,
      example: 85.5
    },
    {
      key: 'unit',
      name: 'numerical unit',
      description: 'The unit identifier of the value',
      supportedTypes: ['static', 'api', 'websocket'],
      required: false,
      example: '°C'
    }
  ],

  // ⚙️ Static parameter configuration
  staticParams: [
    {
      key: 'min',
      name: 'minimum value',
      type: 'number',
      description: 'The minimum scale value of the dashboard',
      defaultValue: 0,
      required: false
    },
    {
      key: 'max',
      name: 'maximum value',
      type: 'number',
      description: 'The maximum scale value of the dashboard',
      defaultValue: 100,
      required: false
    },
    {
      key: 'unit',
      name: 'unit',
      type: 'string',
      description: 'numerical unit（static configuration，Lower priority than data source）',
      defaultValue: '',
      required: false
    },
    {
      key: 'title',
      name: 'title',
      type: 'string',
      description: 'Dashboard title',
      defaultValue: '',
      required: false
    },
    {
      key: 'precision',
      name: 'Accuracy',
      type: 'number',
      description: 'Number of decimal places for numerical display',
      defaultValue: 1,
      required: false
    }
  ],

  // 🎯 Interactive capability statement
  interactionCapabilities: {
    supportedEvents: ['click', 'hover', 'dataChange', 'thresholdExceeded'],
    availableActions: [
      'navigateToUrl', 'updateComponentData', 'changeVisibility',
      'showNotification', 'emitEvent', 'flashColor', 'pulseEffect',
      'changeGaugeColor', 'triggerAnimation'
    ],
    watchableProperties: {
      'value': {
        type: 'number',
        description: 'current value',
        defaultValue: 0
      },
      'percentage': {
        type: 'number',
        description: 'Current percentage（Calculated based on minimum and maximum values）',
        defaultValue: 0
      },
      'status': {
        type: 'string',
        description: 'state（normal/warning/danger）',
        defaultValue: 'normal'
      },
      'unit': {
        type: 'string',
        description: 'current unit',
        defaultValue: ''
      }
    },
    defaultInteractions: [
      {
        event: 'thresholdExceeded',
        responses: [
          {
            action: 'flashColor',
            delay: 0,
            name: 'Threshold over limit flashing',
            enabled: true
          },
          {
            action: 'showNotification',
            delay: 500,
            name: 'Threshold alarm notification',
            enabled: true
          }
        ],
        enabled: true,
        name: 'Threshold exceedance alarm',
        watchedProperty: 'value'
      }
    ]
  },

  // 🔒 Attribute exposure whitelist
  propertyWhitelist: createPropertyWhitelist({
    // core data attributes
    value: {
      level: 'public',
      type: 'number',
      description: 'Current value on dashboard',
      defaultValue: 0,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    percentage: {
      level: 'public',
      type: 'number',
      description: 'Current percentage',
      defaultValue: 0,
      visibleInInteraction: true,
      visibleInDebug: true,
      readonly: true
    },
    status: {
      level: 'public',
      type: 'string',
      description: 'Dashboard status',
      defaultValue: 'normal',
      visibleInInteraction: true,
      visibleInDebug: true,
      readonly: true
    },

    // Configuration properties
    min: {
      level: 'protected',
      type: 'number',
      description: 'minimum value',
      defaultValue: 0,
      visibleInDebug: true
    },
    max: {
      level: 'protected',
      type: 'number',
      description: 'maximum value',
      defaultValue: 100,
      visibleInDebug: true
    },
    unit: {
      level: 'public',
      type: 'string',
      description: 'numerical unit',
      defaultValue: '',
      visibleInInteraction: true,
      visibleInDebug: true
    },

    // internal state
    isLoading: {
      level: 'private',
      type: 'boolean',
      description: 'Data loading status',
      defaultValue: false,
      visibleInDebug: true,
      readonly: true
    }
  })
}
```

### 2. Component configuration interface

```typescript
// Component configuration type definition
export interface InstrumentPanelConfig {
  // Numeric configuration
  min: number           // minimum value
  max: number           // maximum value
  unit: string          // unit
  precision: number     // Accuracy

  // show configuration
  title: string         // title
  showTitle: boolean    // Whether to display title
  showUnit: boolean     // Whether to display units

  // Style configuration
  gaugeColor: string    // Dashboard color
  backgroundColor: string // background color
  textColor: string     // text color

  // Threshold configuration
  warningThreshold?: number   // warning threshold
  dangerThreshold?: number    // danger threshold

  // Animation configuration
  enableAnimation: boolean    // Enable animation
  animationDuration: number   // animation duration
}

// Unified configuration structure
export interface InstrumentPanelUnifiedConfig {
  base: {
    deviceId?: string
    metricsList?: MetricItem[]
    title?: string
    visible?: boolean
  }
  component: InstrumentPanelConfig
  dataSource: {
    value?: {
      sourceType: 'static' | 'api' | 'websocket' | 'mqtt'
      sourceConfig: Record<string, unknown>
      fieldMapping?: string
    }
    unit?: {
      sourceType: 'static' | 'api' | 'websocket'
      sourceConfig: Record<string, unknown>
      fieldMapping?: string
    }
  }
  interaction: {
    // Interactive configuration
    enableClick?: boolean
    enableHover?: boolean
    thresholdAlerts?: boolean
  }
}
```

### 3. Data source mapping

```typescript
// Data source mapping configuration
export const instrumentPanelDataMapping = {
  // Master value mapping
  value: {
    // Mapping telemetry data from devices
    deviceTelemetry: {
      path: 'data[0].value',
      transform: (value: any) => Number(value) || 0,
      fallback: 0
    },
    // fromAPIresponse mapping
    apiResponse: {
      path: 'value',
      transform: (value: any) => Number(value) || 0,
      fallback: 0
    },
    // WebSocketdata mapping
    websocket: {
      path: 'payload.value',
      transform: (value: any) => Number(value) || 0,
      fallback: 0
    }
  },

  // unit mapping
  unit: {
    deviceTelemetry: {
      path: 'data[0].unit',
      transform: (unit: any) => String(unit || ''),
      fallback: ''
    },
    apiResponse: {
      path: 'unit',
      transform: (unit: any) => String(unit || ''),
      fallback: ''
    }
  }
}
```

### 4. Key points of component implementation

```typescript
// Vue Key points of component implementation
export default defineComponent({
  name: 'InstrumentPanel',
  setup(props) {
    // use Card 2.1 Unified configuration management
    const {
      config,
      displayData,
      updateConfig,
      exposeWhitelistedProperties,
      watchProperty
    } = useCard2Props<InstrumentPanelConfig>({
      config: props.initialConfig,
      componentId: props.componentId
    })

    // Computed properties
    const currentValue = computed(() => {
      // data source优先级：data source > static configuration
      return displayData.value?.value ?? config.value.defaultValue ?? 0
    })

    const currentUnit = computed(() => {
      return displayData.value?.unit ?? config.value.unit ?? ''
    })

    const percentage = computed(() => {
      const { min, max } = config.value
      const value = currentValue.value
      return Math.min(Math.max((value - min) / (max - min) * 100, 0), 100)
    })

    const status = computed(() => {
      const value = currentValue.value
      const { dangerThreshold, warningThreshold } = config.value

      if (dangerThreshold && value >= dangerThreshold) return 'danger'
      if (warningThreshold && value >= warningThreshold) return 'warning'
      return 'normal'
    })

    // Listen for property changes
    watchProperty('value', (newValue, oldValue) => {
      // Check threshold exceeded
      if (config.value.dangerThreshold && newValue >= config.value.dangerThreshold) {
        // Trigger threshold exceeded event
        window.dispatchEvent(new CustomEvent('thresholdExceeded', {
          detail: { componentId: props.componentId, value: newValue, type: 'danger' }
        }))
      }
    })

    // exposed properties
    exposeWhitelistedProperties({
      value: currentValue,
      percentage,
      status,
      unit: currentUnit,
      min: () => config.value.min,
      max: () => config.value.max,
      isLoading: ref(false)
    })

    return {
      currentValue,
      currentUnit,
      percentage,
      status,
      config
    }
  }
})
```

## 📋 Migration checklist

### ✅ functional equivalence
- [x] Circular instrument panel display
- [x] minimum value/Maximum configuration
- [x] unit display
- [x] Real-time data updates
- [x] Responsive layout

### ✅ New features
- [x] Threshold alarm mechanism
- [x] Interactive capability support
- [x] Attribute exposure whitelist
- [x] Unified configuration management
- [x] Multiple data sources support

### ✅ Data compatibility
- [x] Device telemetry data compatible
- [x] APIData source support
- [x] WebSocketreal time data
- [x] Static data configuration

### ✅ Configuration migration
- [x] Original configuration item mapping
- [x] Add configuration item definition
- [x] Default value settings
- [x] Validation rule definition

## 🔄 Migration steps

1. **Create component directory structure**
   ```
   src/card2.1/components/chart/dashboard/instrument-panel/
   ├── definition.ts      # Component definition
   ├── index.vue         # VueComponent implementation
   ├── setting.vue       # Configure components
   ├── settingConfig.ts  # Configuration definition
   └── index.ts          # Export file
   ```

2. **Implement component definition** - as above `definition.ts` Configuration

3. **accomplishVuecomponents** - use `useCard2Props` Hook

4. **Implement configuration components** - based on `FlexibleConfigForm`

5. **Register component** - Add to automatic registration system

6. **Test verification** - Functional testing and data compatibility testing

## 📚 Related documents

- [Card 2.1 Development Guide](../../../card2.1/docs/COMPREHENSIVE_DEVELOPMENT_GUIDE.md)
- [Component Development Specifications](../../../card2.1/docs/COMPONENT_DEVELOPMENT_GUIDE.md)
- [data binding system](../../../card2.1/docs/DATA_BINDING_GUIDE.md)
- [Interactive system documentation](../../../card2.1/docs/INTERACTION_GUIDE.md)
