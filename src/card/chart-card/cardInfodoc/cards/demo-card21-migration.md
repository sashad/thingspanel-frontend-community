# Demo components Card 2.1 Migrate configuration documents

## Component overview

**componentsID**: `chart-demo`  
**Component type**: `chart`  
**Component name**: Presentation digital indicator  
**Function description**: Digital indicator presentation component with icons，Support device telemetry and attribute data display，Features responsive font sizing

## Current implementation analysis

### 1. Component structure
```
demo/
├── index.ts              # Component definition configuration
├── component.vue         # Main component implementation
├── card-config.vue       # Configuration form
├── poster.png           # Component preview
└── icons.ts             # Icon configuration
```

### 2. Core features
- **single data source**: support 1 device data sources
- **data type**: Supports telemetry and attribute data
- **icon system**: integrated Fluent UI Icon library，100+ Icon optional
- **Responsive design**: Automatically adjust font size based on container size
- **real time updates**: support WebSocket Real-time data updates
- **Custom configuration**: support icon、color、Unit customization

### 3. Technical implementation
- **Icon library**: @vicons/fluent (Fluent UI icon)
- **Responsive**: ResizeObserver API Listen for container changes
- **data acquisition**: Supports two data types: telemetry and attributes
- **style layout**: Absolutely positioned layout，Support responsive adjustment

## Card 2.1 Migrate configuration

### 1. Component definition (ComponentDefinition)

```typescript
import { ComponentDefinition } from '@/card2.1/types'

export const demoDefinition: ComponentDefinition = {
  // Basic information
  id: 'chart-demo',
  name: 'demo.digitalIndicator',
  type: 'chart',
  category: 'demo',
  
  // Component configuration
  component: () => import('./component.vue'),
  configComponent: () => import('./config.vue'),
  
  // layout configuration
  layout: {
    defaultSize: { width: 5, height: 3 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 12, height: 12 },
    resizable: true
  },
  
  // Data source configuration
  dataSource: {
    type: 'device',
    multiple: false,
    maxCount: 1,
    required: true,
    supportedTypes: ['telemetry', 'attribute'],
    features: {
      timeRange: false,
      aggregate: false,
      realtime: true
    }
  },
  
  // configuration mode
  configSchema: {
    type: 'object',
    properties: {
      // show configuration
      display: {
        type: 'object',
        properties: {
          title: { type: 'string', default: '' },
          showIcon: { type: 'boolean', default: true },
          showUnit: { type: 'boolean', default: true },
          showName: { type: 'boolean', default: true }
        }
      },
      
      // Style configuration
      style: {
        type: 'object',
        properties: {
          iconName: { 
            type: 'string', 
            enum: [
              'ClipboardCode20Regular', 'Accessibility20Regular', 'Add20Regular',
              'Alert20Regular', 'ArrowDown20Regular', 'ArrowUp20Regular',
              'Camera20Regular', 'Chat20Regular', 'Clock20Regular',
              'Cloud20Regular', 'Document20Regular', 'Edit20Regular',
              'Heart20Regular', 'Home20Regular', 'Info20Regular',
              'Location20Regular', 'Mail20Regular', 'Person20Regular',
              'Phone20Regular', 'Settings20Regular', 'Star20Regular'
              // ... More icon options
            ],
            default: 'ClipboardCode20Regular' 
          },
          iconColor: { 
            type: 'string', 
            format: 'color',
            default: '#000000' 
          },
          fontSize: {
            type: 'object',
            properties: {
              auto: { type: 'boolean', default: true },
              base: { type: 'number', minimum: 8, maximum: 72, default: 14 },
              ratio: { type: 'number', minimum: 0.1, maximum: 2, default: 1 }
            }
          },
          textColor: { 
            type: 'string', 
            format: 'color',
            default: '#000000' 
          },
          backgroundColor: { 
            type: 'string', 
            format: 'color',
            default: 'transparent' 
          }
        }
      },
      
      // Data configuration
      data: {
        type: 'object',
        properties: {
          unit: { type: 'string', default: '' },
          precision: { 
            type: 'number', 
            minimum: 0, 
            maximum: 10, 
            default: 2 
          },
          defaultValue: { type: 'string', default: '8' },
          format: {
            type: 'object',
            properties: {
              type: { 
                type: 'string', 
                enum: ['number', 'text', 'boolean'],
                default: 'number' 
              },
              thousandSeparator: { type: 'boolean', default: false },
              prefix: { type: 'string', default: '' },
              suffix: { type: 'string', default: '' }
            }
          }
        }
      },
      
      // layout configuration
      layout: {
        type: 'object',
        properties: {
          iconPosition: {
            type: 'object',
            properties: {
              left: { type: 'string', default: '4%' },
              bottom: { type: 'string', default: '20%' },
              width: { type: 'string', default: '25%' },
              height: { type: 'string', default: '25%' }
            }
          },
          namePosition: {
            type: 'object',
            properties: {
              top: { type: 'string', default: '15%' },
              left: { type: 'string', default: '8%' },
              width: { type: 'string', default: '45%' }
            }
          },
          valuePosition: {
            type: 'object',
            properties: {
              bottom: { type: 'string', default: '20%' },
              left: { type: 'string', default: '50%' },
              width: { type: 'string', default: '45%' }
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
      metricType: 'string',    // Indicator type: 'telemetry' | 'attribute'
      unit: 'string'           // unit
    }
  }
}
```

### 3. Implementation points

#### Data acquisition logic
```typescript
// Data acquisition function
const fetchData = async (dataSource: DataSourceConfig) => {
  const { deviceId, metricKey, metricType } = dataSource
  
  if (metricType === 'telemetry') {
    // Get telemetry data
    const response = await telemetryDataCurrentKeys({
      device_id: deviceId,
      keys: metricKey
    })
    
    if (response?.data?.[0]) {
      return {
        value: response.data[0].value,
        unit: response.data[0].unit
      }
    }
  } else if (metricType === 'attribute') {
    // Get attribute data
    const response = await getAttributeDataSet({ 
      device_id: deviceId 
    })
    
    const attributeData = response.data.find(item => item.key === metricKey)
    if (attributeData) {
      return {
        value: attributeData.value,
        unit: attributeData.unit
      }
    }
  }
  
  return { value: null, unit: '' }
}

// Real-time data updates
const updateData = (deviceId: string, metricKey: string, data: any) => {
  if (!metricKey || data[metricKey] === undefined || data[metricKey] === null || data[metricKey] === '') {
    logger.warn(`No data returned from websocket for ${metricKey}`)
    return
  }
  
  // Update display value
  displayValue.value = data[metricKey]
}
```

#### Responsive font size
```typescript
// Responsive font size calculation
const calculateFontSize = (containerWidth: number, containerHeight: number, config: StyleConfig) => {
  if (!config.fontSize.auto) {
    return `${config.fontSize.base}px`
  }
  
  let fontSize = containerWidth / 20 // basic calculations
  
  // Aspect ratio adjustment
  const aspectRatio = containerWidth / containerHeight
  if (aspectRatio > 3) {
    fontSize = (containerWidth + (containerHeight * containerWidth) / containerHeight / 2) / 20 / (1 + aspectRatio / 2)
  }
  
  // Apply scaling factor
  fontSize *= config.fontSize.ratio
  
  // limit minmax
  fontSize = Math.max(8, Math.min(72, fontSize))
  
  return `${fontSize}px`
}

// ResizeObserver monitor
const setupResizeObserver = () => {
  if (!containerRef.value) return
  
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      fontSize.value = calculateFontSize(width, height, props.card.config.style)
    }
  })
  
  resizeObserver.observe(containerRef.value)
}
```

#### Icon system integration
```typescript
// Icon configuration
import { icons } from './icons'

// Dynamic icon component
const IconComponent = computed(() => {
  const iconName = props.card.config.style.iconName || 'ClipboardCode20Regular'
  return icons[iconName] || icons.ClipboardCode20Regular
})

// icon style
const iconStyle = computed(() => ({
  color: props.card.config.style.iconColor || '#000000',
  position: 'absolute',
  ...props.card.config.layout.iconPosition
}))
```

#### Data formatting
```typescript
// Data formatting functions
const formatValue = (value: any, config: DataConfig) => {
  if (value === null || value === undefined || value === '') {
    return config.defaultValue || '8'
  }
  
  const { format } = config
  
  switch (format.type) {
    case 'number':
      const numValue = Number(value)
      if (isNaN(numValue)) return value
      
      let formatted = numValue.toFixed(config.precision)
      
      if (format.thousandSeparator) {
        formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      }
      
      return `${format.prefix}${formatted}${format.suffix}`
      
    case 'boolean':
      return value ? 'yes' : 'no'
      
    case 'text':
    default:
      return `${format.prefix}${value}${format.suffix}`
  }
}
```

## Migration checklist

### Function migration
- [ ] Single data source support
- [ ] Telemetry data acquisition
- [ ] Attribute data acquisition
- [ ] Real-time data updates
- [ ] Icon display function
- [ ] Responsive font adjustment
- [ ] Data format display

### Configuration migration
- [ ] Icon selection configuration
- [ ] Color configuration
- [ ] Font size configuration
- [ ] unit configuration
- [ ] Layout location configuration
- [ ] Data format configuration

### Performance optimization
- [ ] ResizeObserver Memory management
- [ ] Icon lazy loading
- [ ] Data update anti-shake
- [ ] Component uninstall and cleanup

## Migration steps

### 1. Create component definition
```bash
# Create component directory
mkdir -p src/card2.1/components/demo/digital-indicator

# Create necessary files
touch src/card2.1/components/demo/digital-indicator/definition.ts
touch src/card2.1/components/demo/digital-indicator/component.vue
touch src/card2.1/components/demo/digital-indicator/config.vue
touch src/card2.1/components/demo/digital-indicator/icons.ts
```

### 2. Implement core components
- migrate `component.vue` main component logic
- Migrate icon system and responsive logic
- adaptation Card 2.1 Data source interface
- Implement configuration form components

### 3. Configuration verification
- Test data source configuration
- Verify icon display function
- Test responsive adjustments
- Check the real-time update effect

### 4. Performance testing
- Responsive performance testing
- Memory leak check
- Icon loading performance

## icon system

### List of available icons
```typescript
// Common icon categories
const iconCategories = {
  // Basic icon
  basic: [
    'Add20Regular', 'Delete20Regular', 'Edit20Regular', 'Save20Regular',
    'Copy20Regular', 'Cut20Regular', 'Search20Regular', 'Filter20Regular'
  ],
  
  // status icon
  status: [
    'Alert20Regular', 'ErrorCircle20Regular', 'Checkmark20Regular',
    'CircleOff20Regular', 'Info20Regular', 'Prohibited20Regular'
  ],
  
  // device icon
  device: [
    'Camera20Regular', 'Phone20Regular', 'Laptop20Regular',
    'Tv20Regular', 'Video20Regular', 'WifiOff20Regular'
  ],
  
  // Navigation icon
  navigation: [
    'Home20Regular', 'Location20Regular', 'Map20Regular',
    'ArrowUp20Regular', 'ArrowDown20Regular', 'Target20Regular'
  ],
  
  // communication icon
  communication: [
    'Mail20Regular', 'Chat20Regular', 'Call20Regular',
    'Share20Regular', 'Link20Regular', 'Globe20Regular'
  ]
}
```

## Configuration example

### Basic configuration
```json
{
  "display": {
    "title": "temperature sensor",
    "showIcon": true,
    "showUnit": true,
    "showName": true
  },
  "style": {
    "iconName": "Clock20Regular",
    "iconColor": "#1890ff",
    "fontSize": {
      "auto": true,
      "base": 14,
      "ratio": 1.2
    },
    "textColor": "#000000"
  },
  "data": {
    "unit": "°C",
    "precision": 1,
    "defaultValue": "0",
    "format": {
      "type": "number",
      "thousandSeparator": false
    }
  }
}
```

### Advanced configuration
```json
{
  "display": {
    "title": "Device status",
    "showIcon": true,
    "showUnit": false,
    "showName": true
  },
  "style": {
    "iconName": "Alert20Regular",
    "iconColor": "#ff4d4f",
    "fontSize": {
      "auto": false,
      "base": 16
    },
    "textColor": "#ff4d4f",
    "backgroundColor": "#fff2f0"
  },
  "data": {
    "precision": 0,
    "defaultValue": "Offline",
    "format": {
      "type": "text",
      "prefix": "state: ",
      "suffix": ""
    }
  },
  "layout": {
    "iconPosition": {
      "left": "10%",
      "bottom": "30%",
      "width": "20%",
      "height": "20%"
    },
    "valuePosition": {
      "bottom": "30%",
      "left": "40%",
      "width": "50%"
    }
  }
}
```

## Usage scenarios

### 1. Equipment status monitoring
- Device online status display
- Real-time monitoring of key indicators
- Alarm status prompt

### 2. Big screen display of data
- KPI Indicator display
- Real-time data monitoring
- Status overview panel

### 3. Demonstration and Teaching
- Component function demonstration
- Development example reference
- rapid prototyping

## Related documents

- [Card 2.1 Architecture documentation](../architecture.md)
- [Data source configuration guide](../data-source-guide.md)
- [Component Development Specifications](../component-development.md)
- [Icon system documentation](../icon-system.md)
- [Responsive Design Guidelines](../responsive-design.md)