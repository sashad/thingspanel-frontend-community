<!--
  Unified device configuration selector
  Use one form to manage the selection of all device-related parameters，Avoid duplicate parameter problems
-->
<script setup lang="ts">
/**
 * UnifiedDeviceConfigSelector - Unified device configuration selector
 *
 * design principles：
 * - Only one instance of each parameter type can exist（deviceId、metricwait）
 * - incremental configuration：Users can add parameters step by step，no conflict
 * - Modify mode：Selecting again is to modify the existing configuration.
 * - Scalability：New device parameter types can be easily added in the future
 */

import { ref, computed, watch, nextTick } from 'vue'
import { NCard, NSpace, NText, NIcon, NButton, NSelect, NCheckbox, NAlert, NDivider, NTag } from 'naive-ui'
import {
  PhonePortraitOutline as DeviceIcon,
  BarChartOutline as MetricIcon,
  LocationOutline as LocationIcon,
  WifiOutline as StatusIcon
} from '@vicons/ionicons5'
import type { DeviceInfo, DeviceMetric } from '@/core/data-architecture/types/device-parameter-group'
import type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'
import type { SelectOption } from 'naive-ui'

interface Props {
  /** Currently existing parameter list（Used to detect existing configurations） */
  existingParameters?: EnhancedParameter[]
  /** Is it in edit mode? */
  editMode?: boolean
}

interface Emits {
  (e: 'parametersGenerated', parameters: EnhancedParameter[]): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * Device configuration status
 */
interface DeviceConfig {
  // Basic equipment information
  selectedDevice: DeviceInfo | null

  // Parameter selection status
  includeDeviceId: boolean // Whether to include equipmentIDparameter
  includeMetric: boolean // Whether to include indicator parameters
  selectedMetric: DeviceMetric | null

  // Parameter types for future expansion
  includeLocation: boolean // Device location
  includeStatus: boolean // Device status
}

// configuration status
const config = ref<DeviceConfig>({
  selectedDevice: null,
  includeDeviceId: false,
  includeMetric: false,
  selectedMetric: null,
  includeLocation: false,
  includeStatus: false
})

/**
 * Analog device data
 */
const mockDevices: DeviceInfo[] = [
  {
    deviceId: 'sensor_001',
    deviceName: 'Temperature and humidity sensor-01',
    deviceType: 'environmental sensor',
    deviceModel: 'TH-2000'
  },
  {
    deviceId: 'sensor_002',
    deviceName: 'Temperature and humidity sensor-02',
    deviceType: 'environmental sensor',
    deviceModel: 'TH-2000'
  },
  {
    deviceId: 'power_001',
    deviceName: 'Electric energy meter-Adistrict',
    deviceType: 'Electrical equipment',
    deviceModel: 'PM-300'
  }
]

/**
 * Get available metrics based on device type
 */
const getMetricsByDeviceType = (deviceType: string): DeviceMetric[] => {
  const metricMap: Record<string, DeviceMetric[]> = {
    'environmental sensor': [
      {
        metricKey: 'temperature',
        metricLabel: 'temperature',
        metricType: 'number',
        unit: '°C',
        description: 'ambient temperature value'
      },
      {
        metricKey: 'humidity',
        metricLabel: 'humidity',
        metricType: 'number',
        unit: '%RH',
        description: 'ambient humidity value'
      }
    ],
    'Electrical equipment': [
      {
        metricKey: 'voltage',
        metricLabel: 'Voltage',
        metricType: 'number',
        unit: 'V',
        description: 'Voltage value'
      },
      {
        metricKey: 'power',
        metricLabel: 'power',
        metricType: 'number',
        unit: 'W',
        description: 'Power value'
      }
    ]
  }

  return metricMap[deviceType] || []
}

// Device options
const deviceOptions = computed<SelectOption[]>(() => {
  return mockDevices.map(device => ({
    label: `${device.deviceName} (${device.deviceType})`,
    value: device.deviceId,
    device: device
  }))
})

// Available indicator options
const availableMetrics = computed<DeviceMetric[]>(() => {
  if (!config.value.selectedDevice) return []
  return getMetricsByDeviceType(config.value.selectedDevice.deviceType)
})

const metricOptions = computed<SelectOption[]>(() => {
  return availableMetrics.value.map(metric => ({
    label: `${metric.metricLabel}${metric.unit ? ` (${metric.unit})` : ''}`,
    value: metric.metricKey,
    metric: metric
  }))
})

// Preview generated parameters
const previewParameters = computed(() => {
  const parameters: Array<{ key: string; value: string; type: string }> = []

  if (config.value.includeDeviceId && config.value.selectedDevice) {
    parameters.push({
      key: 'deviceId',
      value: config.value.selectedDevice.deviceId,
      type: 'equipmentID'
    })
  }

  if (config.value.includeMetric && config.value.selectedMetric) {
    parameters.push({
      key: 'metric',
      value: config.value.selectedMetric.metricKey,
      type: 'indicator key'
    })
  }

  if (config.value.includeLocation && config.value.selectedDevice) {
    parameters.push({
      key: 'deviceLocation',
      value: `location_${config.value.selectedDevice.deviceId}`,
      type: 'Device location'
    })
  }

  if (config.value.includeStatus && config.value.selectedDevice) {
    parameters.push({
      key: 'deviceStatus',
      value: `status_${config.value.selectedDevice.deviceId}`,
      type: 'Device status'
    })
  }

  return parameters
})

// Is it possible to generate parameters
const canGenerate = computed(() => {
  // Device must be selected，and at least one parameter type is selected
  return (
    config.value.selectedDevice !== null &&
    (config.value.includeDeviceId ||
      (config.value.includeMetric && config.value.selectedMetric) ||
      config.value.includeLocation ||
      config.value.includeStatus)
  )
})

/**
 * Listen for device changes，Reset related selections
 */
watch(
  () => config.value.selectedDevice,
  (newDevice, oldDevice) => {
    if (newDevice?.deviceId !== oldDevice?.deviceId) {
      // When equipment changes，Reset indicator selection
      config.value.selectedMetric = null
      if (config.value.includeMetric) {
        // If metric selection is enabled，but no metric available，Automatically disabled
        if (availableMetrics.value.length === 0) {
          config.value.includeMetric = false
        }
      }
    }
  }
)

/**
 * Monitor indicator switch，Automatically handle indicator selection
 */
watch(
  () => config.value.includeMetric,
  includeMetric => {
    if (!includeMetric) {
      config.value.selectedMetric = null
    }
  }
)

/**
 * Processing device selection
 */
const handleDeviceChange = (deviceId: string) => {
  const device = mockDevices.find(d => d.deviceId === deviceId)
  config.value.selectedDevice = device || null
}

/**
 * Handling indicator selection
 */
const handleMetricChange = (metricKey: string) => {
  const metric = availableMetrics.value.find(m => m.metricKey === metricKey)
  config.value.selectedMetric = metric || null
}

/**
 * Initialize edit mode（Restore configuration from existing parameters）
 */
const initEditMode = () => {
  if (!props.existingParameters) return

  // Analyze existing parameters，Restore device configuration
  let deviceId = ''
  let metricKey = ''

  for (const param of props.existingParameters) {
    if (param.key === 'deviceId') {
      deviceId = param.value
      config.value.includeDeviceId = true
    }
    if (param.key === 'metric') {
      metricKey = param.value
      config.value.includeMetric = true
    }
    if (param.key === 'deviceLocation') {
      config.value.includeLocation = true
    }
    if (param.key === 'deviceStatus') {
      config.value.includeStatus = true
    }
  }

  // Recovery device selection
  if (deviceId) {
    const device = mockDevices.find(d => d.deviceId === deviceId)
    if (device) {
      config.value.selectedDevice = device

      // Recovery indicator selection
      if (metricKey) {
        nextTick(() => {
          const metric = availableMetrics.value.find(m => m.metricKey === metricKey)
          if (metric) {
            config.value.selectedMetric = metric
          }
        })
      }
    }
  }
}

/**
 * Generate parameters
 */
const generateParameters = () => {
  if (!canGenerate.value) return

  const parameters: EnhancedParameter[] = []

  // Generate deviceIDparameter
  if (config.value.includeDeviceId && config.value.selectedDevice) {
    parameters.push({
      key: 'deviceId',
      value: config.value.selectedDevice.deviceId,
      enabled: true,
      valueMode: 'manual',
      dataType: 'string',
      _id: `param_device_id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: `equipmentID: ${config.value.selectedDevice.deviceName}`,
      deviceContext: {
        sourceType: 'device-selection',
        selectionConfig: {
          selectedDevice: config.value.selectedDevice
        },
        timestamp: Date.now()
      }
    })
  }

  // Generate indicator parameters
  if (config.value.includeMetric && config.value.selectedMetric) {
    parameters.push({
      key: 'metric',
      value: config.value.selectedMetric.metricKey,
      enabled: true,
      valueMode: 'manual',
      dataType: 'string',
      _id: `param_metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: `index: ${config.value.selectedMetric.metricLabel}`,
      deviceContext: {
        sourceType: 'device-selection',
        selectionConfig: {
          selectedDevice: config.value.selectedDevice,
          selectedMetric: config.value.selectedMetric
        },
        timestamp: Date.now()
      }
    })
  }

  // Generate positional parameters（future expansion）
  if (config.value.includeLocation && config.value.selectedDevice) {
    parameters.push({
      key: 'deviceLocation',
      value: `location_${config.value.selectedDevice.deviceId}`,
      enabled: true,
      valueMode: 'manual',
      dataType: 'string',
      _id: `param_location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: `Device location: ${config.value.selectedDevice.deviceName}`
    })
  }

  // Generate status parameters（future expansion）
  if (config.value.includeStatus && config.value.selectedDevice) {
    parameters.push({
      key: 'deviceStatus',
      value: `status_${config.value.selectedDevice.deviceId}`,
      enabled: true,
      valueMode: 'manual',
      dataType: 'string',
      _id: `param_status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: `Device status: ${config.value.selectedDevice.deviceName}`
    })
  }

  emit('parametersGenerated', parameters)
}

/**
 * Deselect
 */
const cancel = () => {
  emit('cancel')
}

// Initialize edit mode
if (props.editMode) {
  nextTick(() => {
    initEditMode()
  })
}
</script>

<template>
  <div class="unified-device-config-selector">
    <!-- title -->
    <div class="selector-header">
      <n-space align="center">
        <n-icon size="20" color="#2080f0">
          <DeviceIcon />
        </n-icon>
        <n-text strong>{{ editMode ? 'Modify device configuration' : 'Device parameter configuration' }}</n-text>
      </n-space>
      <n-text depth="3" style="font-size: 12px; margin-top: 4px">Select the device and required parameter types，Avoid duplicate parameter problems</n-text>
    </div>

    <n-card :bordered="false" class="config-card">
      <!-- Equipment selection -->
      <div class="config-section">
        <n-space align="center" style="margin-bottom: 12px">
          <n-icon size="16"><DeviceIcon /></n-icon>
          <n-text strong>Select device</n-text>
          <n-text type="error" style="font-size: 12px">*</n-text>
        </n-space>

        <n-select
          :value="config.selectedDevice?.deviceId"
          :options="deviceOptions"
          placeholder="Please select a device..."
          clearable
          filterable
          @update:value="handleDeviceChange"
        />
      </div>

      <n-divider style="margin: 20px 0" />

      <!-- Parameter type selection -->
      <div class="config-section">
        <n-text strong style="margin-bottom: 12px; display: block">Select the required parameter type</n-text>

        <n-space vertical size="large">
          <!-- equipmentIDparameter -->
          <div class="param-type-option">
            <n-space align="center">
              <n-checkbox v-model:checked="config.includeDeviceId" :disabled="!config.selectedDevice" />
              <n-icon size="16" color="#2080f0">
                <DeviceIcon />
              </n-icon>
              <div class="param-type-info">
                <n-text strong>equipmentIDparameter</n-text>
                <n-text depth="3" style="font-size: 12px; display: block">generate deviceId parameter，Used to identify specific equipment</n-text>
              </div>
              <n-tag v-if="config.includeDeviceId && config.selectedDevice" size="small" type="success">
                {{ config.selectedDevice.deviceId }}
              </n-tag>
            </n-space>
          </div>

          <!-- Indicator parameters -->
          <div class="param-type-option">
            <n-space align="center">
              <n-checkbox
                v-model:checked="config.includeMetric"
                :disabled="!config.selectedDevice || availableMetrics.length === 0"
              />
              <n-icon size="16" color="#18a058">
                <MetricIcon />
              </n-icon>
              <div class="param-type-info">
                <n-text strong>Indicator parameters</n-text>
                <n-text depth="3" style="font-size: 12px; display: block">generate metric parameter，Used to specify monitoring indicators</n-text>
              </div>
              <n-tag v-if="config.includeMetric && config.selectedMetric" size="small" type="info">
                {{ config.selectedMetric.metricKey }}
              </n-tag>
            </n-space>

            <!-- Indicator selection -->
            <div v-if="config.includeMetric && config.selectedDevice" style="margin-left: 32px; margin-top: 8px">
              <n-select
                :value="config.selectedMetric?.metricKey"
                :options="metricOptions"
                placeholder="Select indicators..."
                size="small"
                :disabled="availableMetrics.length === 0"
                @update:value="handleMetricChange"
              />
            </div>
          </div>

          <!-- Positional parameters（future expansion） -->
          <div class="param-type-option">
            <n-space align="center">
              <n-checkbox v-model:checked="config.includeLocation" :disabled="!config.selectedDevice" />
              <n-icon size="16" color="#f0a020">
                <LocationIcon />
              </n-icon>
              <div class="param-type-info">
                <n-text strong>Device location parameters</n-text>
                <n-text depth="3" style="font-size: 12px; display: block">
                  generate deviceLocation parameter（Future expansion capabilities）
                </n-text>
              </div>
              <n-tag v-if="config.includeLocation" size="small" type="warning">Stay tuned</n-tag>
            </n-space>
          </div>

          <!-- status parameters（future expansion） -->
          <div class="param-type-option">
            <n-space align="center">
              <n-checkbox v-model:checked="config.includeStatus" :disabled="!config.selectedDevice" />
              <n-icon size="16" color="#e88080">
                <StatusIcon />
              </n-icon>
              <div class="param-type-info">
                <n-text strong>Device status parameters</n-text>
                <n-text depth="3" style="font-size: 12px; display: block">
                  generate deviceStatus parameter（Future expansion capabilities）
                </n-text>
              </div>
              <n-tag v-if="config.includeStatus" size="small" type="warning">Stay tuned</n-tag>
            </n-space>
          </div>
        </n-space>
      </div>

      <!-- Parameter preview -->
      <div v-if="previewParameters.length > 0" class="preview-section">
        <n-divider style="margin: 20px 0" />

        <n-alert type="info">
          <template #header>
            <span>Generate parameter preview</span>
          </template>

          <div class="param-preview">
            <div v-for="param in previewParameters" :key="param.key" class="param-preview-item">
              <strong>{{ param.key }}</strong>
              = "{{ param.value }}"
              <n-tag size="small" style="margin-left: 8px">{{ param.type }}</n-tag>
            </div>
          </div>
        </n-alert>
      </div>
    </n-card>

    <!-- Action button -->
    <div class="selector-actions">
      <n-space justify="end">
        <n-button @click="cancel">Cancel</n-button>
        <n-button type="primary" :disabled="!canGenerate" @click="generateParameters">
          {{ editMode ? 'Update parameters' : 'Generate parameters' }} ({{ previewParameters.length }})
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<style scoped>
.unified-device-config-selector {
  padding: 20px;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.selector-header {
  margin-bottom: 8px;
}

.config-card {
  flex: 1;
  background: var(--card-color);
}

.config-section {
  margin-bottom: 20px;
}

.param-type-option {
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.param-type-option:hover {
  border-color: var(--primary-color-suppl);
  background: var(--hover-color);
}

.param-type-info {
  flex: 1;
  margin-left: 8px;
}

.preview-section {
  margin-top: 16px;
}

.param-preview {
  font-family: monospace;
  font-size: 12px;
  line-height: 1.6;
}

.param-preview-item {
  padding: 4px 8px;
  margin: 4px 0;
  background: var(--code-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.selector-actions {
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
</style>
