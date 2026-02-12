# Device selector component

## Overview

This folder contains two components specifically for device indicator selection：

- **DeviceMetricsSelector** - Generic device metric selector
- **DeviceDispatchSelector** - Device metric selector specifically for scheduling data

## Component properties

### 🎯 Core functions
- **Equipment selection** - Support device list filtering and search
- **Indicator selection** - Metric display grouped by data source type
- **autoload** - Automatically load the device list when the component is mounted
- **Smart filtering** - Automatically filter metrics based on data type
- **Complete internationalization** - Support Chinese and English interface

### 🔧 Technical features
- **TypeScript** - Complete type support
- **Vue 3 Composition API** - modernVuegrammar
- **Naive UI** - unifiedUIComponent library
- **Responsive design** - Supports two-way data binding
- **APIadaptation** - Correctly adapt the backendAPIdata structure

## Recently fixed

### ✅ Issue fixed
1. **There is no data in the indicator drop-down** - fixedAPIData structure adaptation problem
2. **Incomplete internationalization** - Added full international translations
3. **Device autoloads** - Ensure that the device list is automatically loaded when the component is mounted
4. **Simplified functions** - Removed unnecessary input boxes，Focus on core functions
5. **JavaScriptmistake** - fixed`undefined`of`forEach`Call error

### 🔧 technical improvements
- Correct fitAPIReturned data structure：`[{ data_source_type, options: [{ key, label, data_type }] }]`
- Improved indicator selection logic，Support group display
- Added complete error handling and debugging information
- Enhanced data validation，prevent`undefined`and`null`Error caused by value
- improvedAPIType checking of response data

## Component comparison

| characteristic | DeviceMetricsSelector | DeviceDispatchSelector |
|------|----------------------|----------------------|
| use | General equipment indicator selection | Dedicated to scheduling data |
| Data type selection | ❌ | ✅ |
| Indicator name input | ✅ | ❌ |
| Aggregation function selection | ✅ | ❌ |
| Send data input | ❌ | ❌ |

## How to use

### DeviceMetricsSelector

```vue
<template>
  <DeviceMetricsSelector
    v-model="deviceMetrics"
    :device-options="deviceOptions"
    :show-metrics-name="true"
    :show-aggregate-function="true"
    @device-change="onDeviceChange"
    @metrics-change="onMetricsChange"
  />
</template>

<script setup>
import { DeviceMetricsSelector } from '@/components/device-selectors'

const deviceMetrics = ref({
  deviceId: '',
  metricsId: '',
  metricsName: '',
  aggregateFunction: ''
})
</script>
```

### DeviceDispatchSelector

```vue
<template>
  <DeviceDispatchSelector
    v-model="dispatchConfig"
    :device-options="deviceOptions"
    @device-change="onDeviceChange"
    @data-type-change="onDataTypeChange"
    @metrics-change="onMetricsChange"
  />
</template>

<script setup>
import { DeviceDispatchSelector } from '@/components/device-selectors'

const dispatchConfig = ref({
  deviceId: '',
  deviceName: '',
  dataType: '',
  metricsId: '',
  metricsName: ''
})
</script>
```

## Data format

### DeviceMetricsSelector Data format

```typescript
interface DeviceMetricsValue {
  deviceId?: string        // equipmentID
  metricsId?: string       // indexID
  metricsName?: string     // Indicator name
  aggregateFunction?: string // aggregate function
}
```

### DeviceDispatchSelector Data format

```typescript
interface DeviceDispatchValue {
  deviceId?: string        // equipmentID
  deviceName?: string      // Device name
  dataType?: string        // data type (attributes/telemetry/command)
  metricsId?: string       // indexID
  metricsName?: string     // Indicator name
}
```

## Props Configuration

### DeviceMetricsSelector Props

| attribute name | type | default value | illustrate |
|--------|------|--------|------|
| `modelValue` | `Object` | `{}` | Two-way bound data object |
| `deviceOptions` | `Array` | `[]` | Device options list |
| `disabled` | `Boolean` | `false` | Whether to disable |
| `showMetricsName` | `Boolean` | `true` | Whether to display the indicator name input box |
| `showAggregateFunction` | `Boolean` | `false` | Whether to display aggregate function selection |
| `isNoAggregate` | `Boolean` | `false` | Whether it is in non-aggregation state |

### DeviceDispatchSelector Props

| attribute name | type | default value | illustrate |
|--------|------|--------|------|
| `modelValue` | `Object` | `{}` | Two-way bound data object |
| `deviceOptions` | `Array` | `[]` | Device options list |
| `disabled` | `Boolean` | `false` | Whether to disable |

## Events

### DeviceMetricsSelector Events

| event name | parameter | illustrate |
|--------|------|------|
| `update:modelValue` | `value: DeviceMetricsValue` | Triggered when data changes |
| `device-change` | `deviceId: string, device: DeviceOption` | Triggered when device selection changes |
| `metrics-change` | `metricsId: string, metrics: MetricsOption` | Triggered when indicator selection changes |

### DeviceDispatchSelector Events

| event name | parameter | illustrate |
|--------|------|------|
| `update:modelValue` | `value: DeviceDispatchValue` | Triggered when data changes |
| `device-change` | `deviceId: string, device: DeviceOption` | Triggered when device selection changes |
| `data-type-change` | `dataType: string` | Triggered when data type changes |
| `metrics-change` | `metricsId: string, metrics: MetricsOption` | Triggered when indicator selection changes |

## method

Both components expose the following methods：

| method name | parameter | return value | illustrate |
|--------|------|--------|------|
| `loadDeviceOptions` | - | `Promise<void>` | Load device list |
| `reset` | - | `void` | Reset component state |

## Style customization

Component support viaCSSVariables for style customization：

```css
.device-metrics-selector,
.device-dispatch-selector {
  --selector-border-color: #e5e7eb;
  --selector-hover-color: #f0f9ff;
  --group-header-bg: #f5f5f5;
}
```

## Things to note

1. **Device option format**: Device options must contain `id` and `name` Field
2. **Indicator data format**: Metric data must contain `key`、`label`、`data_type` etc fields
3. **APIrely**: Component dependencies `deviceListForPanel` and `deviceMetricsList` API
4. **internationalization**: Component usage `$t` 进行internationalization，Make sure the relevant translation files exist
5. **autoload**: if not provided `deviceOptions`，The component will automatically load the device list
6. **data structure**: API返回的指标data structure为 `[{ data_source_type, options: [{ key, label, data_type }] }]`

## test

Test pages can be used to test various functionality of the component：

- `src/views/test/DeviceMetricsSelectorTest.vue` - DeviceMetricsSelector test page
- `src/views/test/DeviceDispatchSelectorTest.vue` - DeviceDispatchSelector test page

## Change log

### v1.3.0 (up to date)
- ✅ Complete restorationNaive UIcomponents`undefined`mistake
- ✅ for all`NSelect`Component addition`|| []`Protect
- ✅ exist`processedMetricsOptions`Add intry-catchError handling
- ✅ Make sure the component is not passed under any circumstances`undefined`GiveNaive UI

### v1.2.0
- ✅ repairJavaScriptmistake：`undefined`of`forEach`call
- ✅ Enhanced data validation and type checking
- ✅ improveAPIResponse data processing
- ✅ Prevent errors caused by null values ​​and abnormal data

### v1.1.0
- ✅ Fixed the problem of no data in indicator drop-down
- ✅ Improve international translation
- ✅ optimizationAPIData structure adaptation
- ✅ Improve error handling mechanism

### v1.0.0
- 🎉 Initial release
- ✅ Basic equipment indicator selection function
- ✅ Support group display
- ✅ Two-way data binding 