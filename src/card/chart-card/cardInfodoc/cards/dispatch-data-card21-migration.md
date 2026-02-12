# Dispatch Data components Card 2.1 Migrate configuration documents

## Component overview

**componentsID**: `chart-dispatch`  
**Component type**: `chart`  
**Component name**: data distributor  
**Function description**: Control component for sending data to the device，Support properties、Sending of three data types, telemetry and commands

## Current implementation analysis

### 1. Component structure
```
dispatch-data/
├── index.ts              # Component definition configuration
├── component.vue         # Main component implementation
├── card-config.vue       # Configuration form
└── poster.png           # Component preview
```

### 2. Core features
- **Data sending**: Support sending properties to the device、Telemetry and command data
- **单设备support**: support 1 device data sources
- **Custom button**: Configurable button icon、color and text
- **Responsive design**: Automatically adjust font and icon sizes based on container size
- **Error handling**: Contains sent successfully/Failure message prompt
- **Multiple data types**: support attributes、telemetry、command Three data types

### 3. Technical implementation
- **Icon library**: @vicons/ionicons5
- **APIcall**: attributeDataPub、telemetryDataPub、commandDataPub
- **Responsive**: ResizeObserver API Listen for container changes
- **Message prompt**: integrated naive-ui Message component

## Card 2.1 Migrate configuration

### 1. Component definition (ComponentDefinition)

```typescript
import { ComponentDefinition } from '@/card2.1/types'

export const dispatchDataDefinition: ComponentDefinition = {
  // Basic information
  id: 'chart-dispatch',
  name: 'card.dataSent',
  type: 'chart',
  category: 'data',
  
  // Component configuration
  component: () => import('./component.vue'),
  configComponent: () => import('./config.vue'),
  
  // layout configuration
  layout: {
    defaultSize: { width: 3, height: 2 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 6, height: 4 },
    resizable: true
  },
  
  // Data source configuration
  dataSource: {
    type: 'device',
    multiple: false,
    maxCount: 1,
    required: true,
    supportedTypes: ['attribute', 'telemetry', 'command'],
    features: {
      timeRange: false,
      aggregate: false,
      realtime: false,
      writable: true  // Support data writing
    }
  },
  
  // configuration mode
  configSchema: {
    type: 'object',
    properties: {
      // Data configuration
      data: {
        type: 'object',
        properties: {
          dataType: {
            type: 'string',
            enum: ['attributes', 'telemetry', 'command'],
            default: 'command',
            title: 'data type'
          },
          valueToSend: {
            type: 'string',
            default: '1',
            title: 'Send value',
            description: 'The data value sent when the button is clicked'
          },
          targetKey: {
            type: 'string',
            title: 'Target key name',
            description: 'The target key name for data sending'
          }
        },
        required: ['dataType', 'valueToSend']
      },
      
      // Button style configuration
      button: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            default: 'Send data',
            title: 'button text'
          },
          color: {
            type: 'string',
            format: 'color',
            default: '#ff4d4f',
            title: 'button color'
          },
          iconName: {
            type: 'string',
            enum: [
              'Play', 'Send', 'Power', 'Flash', 'Rocket',
              'ArrowForward', 'CheckmarkCircle', 'Settings',
              'Refresh', 'Download', 'Upload', 'Save'
            ],
            default: 'Play',
            title: 'button icon'
          },
          iconColor: {
            type: 'string',
            format: 'color',
            default: '#ffffff',
            title: 'icon color'
          }
        }
      },
      
      // show configuration
      display: {
        type: 'object',
        properties: {
          showDeviceName: {
            type: 'boolean',
            default: true,
            title: 'Show device name'
          },
          showButtonText: {
            type: 'boolean',
            default: true,
            title: 'Show button text'
          },
          customDeviceName: {
            type: 'string',
            title: 'Custom device name',
            description: 'Leave blank to use the device name from the data source'
          }
        }
      },
      
      // behavior configuration
      behavior: {
        type: 'object',
        properties: {
          confirmBeforeSend: {
            type: 'boolean',
            default: false,
            title: 'Confirm before sending'
          },
          cooldownTime: {
            type: 'number',
            minimum: 0,
            maximum: 60,
            default: 0,
            title: 'Cooling time(Second)',
            description: 'Cooldown time to prevent frequent clicks'
          },
          showSuccessMessage: {
            type: 'boolean',
            default: true,
            title: 'Show success message'
          },
          showErrorMessage: {
            type: 'boolean',
            default: true,
            title: 'Show error message'
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
      deviceName: 'string',    // Device name
      targetKey: 'string',     // Target data key name
      dataType: 'string'       // data type: 'attributes' | 'telemetry' | 'command'
    }
  }
}
```

### 3. Implementation points

#### Data sending logic
```typescript
// Data sending function
const sendData = async (config: DataConfig, deviceId: string) => {
  const { dataType, valueToSend, targetKey } = config
  
  const payload = {
    device_id: deviceId,
    value: valueToSend,
    key: targetKey
  }
  
  try {
    switch (dataType) {
      case 'attributes':
        await attributeDataPub(payload)
        break
      case 'telemetry':
        await telemetryDataPub(payload)
        break
      case 'command':
        await commandDataPub(payload)
        break
      default:
        throw new Error(`Unsupported data type: ${dataType}`)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Data send failed:', error)
    return { success: false, error }
  }
}

// Button click processing
const handleButtonClick = async () => {
  if (!deviceId.value) {
    showError('equipmentIDcannot be empty')
    return
  }
  
  // Cooldown check
  if (isInCooldown.value) {
    showWarning(`please wait ${remainingCooldown.value} Try again in seconds`)
    return
  }
  
  // Confirm before sending
  if (props.card.config.behavior.confirmBeforeSend) {
    const confirmed = await showConfirmDialog('Confirm sending data？')
    if (!confirmed) return
  }
  
  // Set cooling status
  setButtonCooldown()
  
  // Send data
  const result = await sendData(props.card.config.data, deviceId.value)
  
  // Show result message
  if (result.success) {
    if (props.card.config.behavior.showSuccessMessage) {
      showSuccess('Data sent successfully')
    }
  } else {
    if (props.card.config.behavior.showErrorMessage) {
      showError('Data sending failed')
    }
  }
}
```

#### Cooling time management
```typescript
// Cooldown status
const isInCooldown = ref(false)
const remainingCooldown = ref(0)
let cooldownTimer: NodeJS.Timeout | null = null

// Set button cooling
const setButtonCooldown = () => {
  const cooldownTime = props.card.config.behavior.cooldownTime || 0
  if (cooldownTime <= 0) return
  
  isInCooldown.value = true
  remainingCooldown.value = cooldownTime
  
  cooldownTimer = setInterval(() => {
    remainingCooldown.value--
    if (remainingCooldown.value <= 0) {
      clearCooldown()
    }
  }, 1000)
}

// Clear cool down status
const clearCooldown = () => {
  isInCooldown.value = false
  remainingCooldown.value = 0
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
}
```

#### Responsive layout
```typescript
// Responsive size calculation
const calculateSizes = (containerWidth: number, containerHeight: number) => {
  const minDimension = Math.min(containerWidth, containerHeight)
  
  return {
    fontSize: `${Math.max(12, minDimension / 10)}px`,
    iconSize: `${Math.max(16, minDimension / 5)}px`,
    buttonSize: {
      width: `${Math.min(containerWidth * 0.6, containerHeight * 0.4)}px`,
      height: `${Math.min(containerWidth * 0.3, containerHeight * 0.4)}px`
    }
  }
}

// ResizeObserver monitor
const setupResizeObserver = () => {
  if (!containerRef.value) return
  
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      const sizes = calculateSizes(width, height)
      
      fontSize.value = sizes.fontSize
      iconSize.value = sizes.iconSize
      buttonStyle.value = sizes.buttonSize
    }
  })
  
  resizeObserver.observe(containerRef.value)
}
```

#### Icon system integration
```typescript
// Icon configuration
import * as ionicons5 from '@vicons/ionicons5'

// List of available icons
const availableIcons = {
  Play: ionicons5.Play,
  Send: ionicons5.Send,
  Power: ionicons5.Power,
  Flash: ionicons5.Flash,
  Rocket: ionicons5.Rocket,
  ArrowForward: ionicons5.ArrowForward,
  CheckmarkCircle: ionicons5.CheckmarkCircle,
  Settings: ionicons5.Settings,
  Refresh: ionicons5.Refresh,
  Download: ionicons5.Download,
  Upload: ionicons5.Upload,
  Save: ionicons5.Save
}

// Dynamic icon component
const IconComponent = computed(() => {
  const iconName = props.card.config.button.iconName || 'Play'
  return availableIcons[iconName] || availableIcons.Play
})
```

## Migration checklist

### Function migration
- [ ] Data sending function（property、telemetry、Order）
- [ ] Button click processing
- [ ] Device name display
- [ ] Responsive layout adjustments
- [ ] Error handling and message prompts
- [ ] Cooling time control

### Configuration migration
- [ ] Button style configuration（color、icon、text）
- [ ] Data type configuration
- [ ] Send value configuration
- [ ] Show option configuration
- [ ] Behavior control configuration

### Security check
- [ ] Input validation
- [ ] Permission check
- [ ] frequency limit
- [ ] Error handling

## Migration steps

### 1. Create component definition
```bash
# Create component directory
mkdir -p src/card2.1/components/data/dispatch-data

# Create necessary files
touch src/card2.1/components/data/dispatch-data/definition.ts
touch src/card2.1/components/data/dispatch-data/component.vue
touch src/card2.1/components/data/dispatch-data/config.vue
```

### 2. Implement core components
- migrate `component.vue` main component logic
- adaptation Card 2.1 Data source interface
- Implement cooling time and confirmation mechanism
- Implement configuration form components

### 3. Configuration verification
- Test data sending function
- Validate button style configuration
- Test responsive layout
- Check error handling mechanism

### 4. Security testing
- Verify input data security
- Test frequency limiting function
- Check access control

## Data sending process

### 1. Data preparation
```typescript
// Build sending data
const buildPayload = (config: DataConfig, deviceId: string) => {
  return {
    device_id: deviceId,
    key: config.targetKey,
    value: config.valueToSend,
    timestamp: Date.now()
  }
}
```

### 2. API call
```typescript
// Select based on data typeAPI
const selectAPI = (dataType: string) => {
  const apiMap = {
    attributes: attributeDataPub,
    telemetry: telemetryDataPub,
    command: commandDataPub
  }
  
  return apiMap[dataType] || commandDataPub
}
```

### 3. Result processing
```typescript
// Process sending results
const handleSendResult = (result: any, config: BehaviorConfig) => {
  if (result.success) {
    if (config.showSuccessMessage) {
      showSuccessNotification('Data sent successfully')
    }
    
    // Trigger success event
    emit('dataSent', { success: true, data: result.data })
  } else {
    if (config.showErrorMessage) {
      showErrorNotification('Data sending failed: ' + result.error)
    }
    
    // trigger failure event
    emit('dataSent', { success: false, error: result.error })
  }
}
```

## Configuration example

### Basic configuration
```json
{
  "data": {
    "dataType": "command",
    "valueToSend": "1",
    "targetKey": "switch"
  },
  "button": {
    "text": "Turn on the device",
    "color": "#52c41a",
    "iconName": "Power",
    "iconColor": "#ffffff"
  },
  "display": {
    "showDeviceName": true,
    "showButtonText": true
  },
  "behavior": {
    "confirmBeforeSend": false,
    "cooldownTime": 2,
    "showSuccessMessage": true,
    "showErrorMessage": true
  }
}
```

### Advanced configuration
```json
{
  "data": {
    "dataType": "telemetry",
    "valueToSend": "25.5",
    "targetKey": "temperature_setpoint"
  },
  "button": {
    "text": "Set temperature",
    "color": "#1890ff",
    "iconName": "Settings",
    "iconColor": "#ffffff"
  },
  "display": {
    "showDeviceName": true,
    "showButtonText": true,
    "customDeviceName": "air conditioning controller"
  },
  "behavior": {
    "confirmBeforeSend": true,
    "cooldownTime": 5,
    "showSuccessMessage": true,
    "showErrorMessage": true
  }
}
```

## Usage scenarios

### 1. Device control
- switch control
- Mode switching
- Parameter settings

### 2. data injection
- Test data sending
- Calibration data writing
- Configuration parameter update

### 3. remote operation
- Remote restart
- remote configuration
- remote diagnosis

## Related documents

- [Card 2.1 Architecture documentation](../architecture.md)
- [Data source configuration guide](../data-source-guide.md)
- [Component Development Specifications](../component-development.md)
- [Device controlAPIdocument](../device-control-api.md)
- [Security Guide](../security-guide.md)