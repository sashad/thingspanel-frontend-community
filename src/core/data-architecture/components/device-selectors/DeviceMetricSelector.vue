<!--
  Device Metrics Selector Component
  Moderately complex mode：Select device and indicator，generatedeviceId + metricparameter
-->
<script setup lang="ts">
/**
 * DeviceMetricSelector - Device Metrics Selector（medium complexity）
 * Need to select equipment and indicators，generatedeviceId + metrictwo parameters
 */

import { ref, computed, watch } from 'vue'
import { NSelect, NSpace, NText, NIcon, NButton, NAlert, NDivider } from 'naive-ui'
import { PhonePortraitOutline as DeviceIcon, BarChartOutline as MetricIcon } from '@vicons/ionicons5'
import type { DeviceInfo, DeviceMetric } from '@/core/data-architecture/types/device-parameter-group'
import type { SelectOption } from 'naive-ui'

interface Props {
  /** Pre-selected devices（Used in edit mode） */
  preSelectedDevice?: DeviceInfo
  /** Pre-selected indicators（Used in edit mode） */
  preSelectedMetric?: DeviceMetric
  /** Is it in edit mode? */
  editMode?: boolean
}

interface Emits {
  (e: 'selectionCompleted', data: { device: DeviceInfo; metric: DeviceMetric }): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

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
 * Analog device indicator data（Provide different indicators based on device type）
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
      },
      {
        metricKey: 'pressure',
        metricLabel: 'atmospheric pressure',
        metricType: 'number',
        unit: 'hPa',
        description: 'Atmospheric pressure value'
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
        metricKey: 'current',
        metricLabel: 'current',
        metricType: 'number',
        unit: 'A',
        description: 'Current value'
      },
      {
        metricKey: 'power',
        metricLabel: 'power',
        metricType: 'number',
        unit: 'W',
        description: 'Power value'
      },
      {
        metricKey: 'energy',
        metricLabel: 'Electric energy',
        metricType: 'number',
        unit: 'kWh',
        description: 'Accumulated electric energy value'
      }
    ]
  }

  return metricMap[deviceType] || []
}

// Current selection status
const selectedDeviceId = ref<string>(props.preSelectedDevice?.deviceId || '')
const selectedMetricKey = ref<string>(props.preSelectedMetric?.metricKey || '')

// Device options
const deviceOptions = computed<SelectOption[]>(() => {
  return mockDevices.map(device => ({
    label: `${device.deviceName} (${device.deviceType})`,
    value: device.deviceId,
    device: device
  }))
})

// Currently selected device
const selectedDevice = computed<DeviceInfo | null>(() => {
  if (!selectedDeviceId.value) return null
  return mockDevices.find(device => device.deviceId === selectedDeviceId.value) || null
})

// Available indicator options（Dynamically changes based on selected device）
const availableMetrics = computed<DeviceMetric[]>(() => {
  if (!selectedDevice.value) return []
  return getMetricsByDeviceType(selectedDevice.value.deviceType)
})

// Indicator options
const metricOptions = computed<SelectOption[]>(() => {
  return availableMetrics.value.map(metric => ({
    label: `${metric.metricLabel}${metric.unit ? ` (${metric.unit})` : ''}`,
    value: metric.metricKey,
    metric: metric
  }))
})

// Currently selected indicator
const selectedMetric = computed<DeviceMetric | null>(() => {
  if (!selectedMetricKey.value) return null
  return availableMetrics.value.find(metric => metric.metricKey === selectedMetricKey.value) || null
})

// Is it possible to confirm the selection?
const canConfirm = computed(() => {
  return selectedDevice.value !== null && selectedMetric.value !== null
})

/**
 * Listen for device changes，Reset indicator selection
 */
watch(selectedDeviceId, (newDeviceId, oldDeviceId) => {
  if (newDeviceId !== oldDeviceId && !props.editMode) {
    selectedMetricKey.value = ''
  }
})

/**
 * Processing device selection
 */
const handleDeviceChange = (deviceId: string) => {
  selectedDeviceId.value = deviceId
}

/**
 * Handling indicator selection
 */
const handleMetricChange = (metricKey: string) => {
  selectedMetricKey.value = metricKey
}

/**
 * Confirm selection
 */
const confirmSelection = () => {
  if (!selectedDevice.value || !selectedMetric.value) return
  emit('selectionCompleted', {
    device: selectedDevice.value,
    metric: selectedMetric.value
  })
}

/**
 * Deselect
 */
const cancelSelection = () => {
  emit('cancel')
}
</script>

<template>
  <div class="device-metric-selector">
    <!-- selector title -->
    <div class="selector-header">
      <n-space align="center">
        <n-icon size="20" color="#2080f0">
          <MetricIcon />
        </n-icon>
        <n-text strong>{{ editMode ? '重新Select device metrics' : 'Select device metrics' }}</n-text>
      </n-space>
      <n-text depth="3" style="font-size: 12px; margin-top: 4px">
        Select device and indicator，will generate
        <strong>deviceId</strong>
        +
        <strong>metric</strong>
        two parameters
      </n-text>
    </div>

    <!-- Equipment selection -->
    <div class="selection-step">
      <n-space align="center" style="margin-bottom: 8px">
        <n-icon size="16"><DeviceIcon /></n-icon>
        <n-text strong>No.1step：Select device</n-text>
      </n-space>

      <n-select
        v-model:value="selectedDeviceId"
        :options="deviceOptions"
        placeholder="Please select a device..."
        clearable
        filterable
        @update:value="handleDeviceChange"
      />
    </div>

    <n-divider style="margin: 12px 0" />

    <!-- Indicator selection -->
    <div class="selection-step">
      <n-space align="center" style="margin-bottom: 8px">
        <n-icon size="16"><MetricIcon /></n-icon>
        <n-text strong>No.2step：Select indicators</n-text>
        <n-text v-if="!selectedDevice" depth="3" style="font-size: 12px">（Please select your device first）</n-text>
      </n-space>

      <n-select
        v-model:value="selectedMetricKey"
        :options="metricOptions"
        placeholder="Please select an indicator..."
        :disabled="!selectedDevice"
        clearable
        @update:value="handleMetricChange"
      />
    </div>

    <!-- Select Preview -->
    <div v-if="selectedDevice || selectedMetric" class="selection-preview">
      <n-alert type="info" style="margin-top: 16px">
        <template #header>
          <span>Select Preview</span>
        </template>

        <n-space vertical size="small">
          <!-- Device information -->
          <div v-if="selectedDevice">
            <n-space align="center" style="margin-bottom: 8px">
              <n-icon size="16"><DeviceIcon /></n-icon>
              <n-text strong>Selected device：</n-text>
            </n-space>
            <div style="padding-left: 20px">
              <n-space vertical size="small">
                <n-space>
                  <n-text depth="3">Device name：</n-text>
                  <n-text>{{ selectedDevice.deviceName }}</n-text>
                </n-space>
                <n-space>
                  <n-text depth="3">Device type：</n-text>
                  <n-text>{{ selectedDevice.deviceType }}</n-text>
                </n-space>
              </n-space>
            </div>
          </div>

          <!-- Indicator information -->
          <div v-if="selectedMetric">
            <n-space align="center" style="margin-bottom: 8px">
              <n-icon size="16"><MetricIcon /></n-icon>
              <n-text strong>Selected indicators：</n-text>
            </n-space>
            <div style="padding-left: 20px">
              <n-space vertical size="small">
                <n-space>
                  <n-text depth="3">Indicator name：</n-text>
                  <n-text>{{ selectedMetric.metricLabel }}</n-text>
                </n-space>
                <n-space>
                  <n-text depth="3">data type：</n-text>
                  <n-text>{{ selectedMetric.metricType }}</n-text>
                </n-space>
                <n-space v-if="selectedMetric.unit">
                  <n-text depth="3">unit：</n-text>
                  <n-text>{{ selectedMetric.unit }}</n-text>
                </n-space>
              </n-space>
            </div>
          </div>

          <!-- Generate parameter preview -->
          <div v-if="canConfirm" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color)">
            <n-text depth="3" style="font-size: 12px">💡 Parameters will be generated：</n-text>
            <div
              style="
                margin-top: 8px;
                padding: 8px;
                background: var(--code-color);
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
              "
            >
              <div>
                <strong>deviceId</strong>
                = "{{ selectedDevice!.deviceId }}"
              </div>
              <div>
                <strong>metric</strong>
                = "{{ selectedMetric!.metricKey }}"
              </div>
            </div>
          </div>
        </n-space>
      </n-alert>
    </div>

    <!-- Action button -->
    <div class="selector-actions">
      <n-space justify="end">
        <n-button @click="cancelSelection">Cancel</n-button>
        <n-button type="primary" :disabled="!canConfirm" @click="confirmSelection">
          {{ editMode ? 'Update parameters' : 'Generate parameters' }}
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<style scoped>
.device-metric-selector {
  padding: 20px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.selector-header {
  margin-bottom: 8px;
}

.selection-step {
  margin-bottom: 12px;
}

.selection-preview {
  margin: 16px 0;
}

.selector-actions {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
</style>
