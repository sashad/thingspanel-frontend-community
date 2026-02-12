<!--
  equipmentIDselector component
  Simple mode：Just select the device，generatedeviceIdparameter
-->
<script setup lang="ts">
/**
 * DeviceIdSelector - equipmentIDselector（Simple mode）
 * Provide the most basic device selection function，Only generatedeviceIdparameter
 */

import { ref, computed } from 'vue'
import { NSelect, NSpace, NText, NIcon, NButton, NAlert } from 'naive-ui'
import { PhonePortraitOutline as DeviceIcon } from '@vicons/ionicons5'
import type { DeviceInfo } from '@/core/data-architecture/types/device-parameter-group'
import type { SelectOption } from 'naive-ui'

interface Props {
  /** Pre-selected devices（Used in edit mode） */
  preSelectedDevice?: DeviceInfo
  /** Is it in edit mode? */
  editMode?: boolean
}

interface Emits {
  (e: 'deviceSelected', device: DeviceInfo): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * Analog device data（In actual projects, it should be based onAPIGet）
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
    deviceId: 'camera_001',
    deviceName: 'surveillance camera-A1',
    deviceType: 'video equipment',
    deviceModel: 'CAM-4K'
  },
  {
    deviceId: 'switch_001',
    deviceName: 'Smart switch-living room',
    deviceType: 'control equipment',
    deviceModel: 'SW-100'
  },
  {
    deviceId: 'gateway_001',
    deviceName: 'IoT gateway-master control',
    deviceType: 'gateway device',
    deviceModel: 'GW-5000'
  }
]

// Currently selected deviceID
const selectedDeviceId = ref<string>(props.preSelectedDevice?.deviceId || '')

// Convert to dropdown option format
const deviceOptions = computed<SelectOption[]>(() => {
  return mockDevices.map(device => ({
    label: `${device.deviceName} (${device.deviceType})`,
    value: device.deviceId,
    device: device // Carry complete device information
  }))
})

// Currently selected device information
const selectedDevice = computed<DeviceInfo | null>(() => {
  if (!selectedDeviceId.value) return null
  return mockDevices.find(device => device.deviceId === selectedDeviceId.value) || null
})

// Is it possible to confirm the selection?
const canConfirm = computed(() => {
  return selectedDevice.value !== null
})

/**
 * Processing device selection
 */
const handleDeviceChange = (deviceId: string) => {
  selectedDeviceId.value = deviceId
}

/**
 * Confirm selection
 */
const confirmSelection = () => {
  if (!selectedDevice.value) return
  emit('deviceSelected', selectedDevice.value)
}

/**
 * Deselect
 */
const cancelSelection = () => {
  emit('cancel')
}
</script>

<template>
  <div class="device-id-selector">
    <!-- selector title -->
    <div class="selector-header">
      <n-space align="center">
        <n-icon size="20" color="#2080f0">
          <DeviceIcon />
        </n-icon>
        <n-text strong>{{ editMode ? 'Reselect device' : 'Select device' }}</n-text>
      </n-space>
      <n-text depth="3" style="font-size: 12px; margin-top: 4px">
        Choose a device，will generate
        <strong>deviceId</strong>
        parameter
      </n-text>
    </div>

    <!-- Device selector -->
    <div class="device-selector">
      <n-select
        v-model:value="selectedDeviceId"
        :options="deviceOptions"
        placeholder="Please select a device..."
        clearable
        filterable
        @update:value="handleDeviceChange"
      />
    </div>

    <!-- Select Preview -->
    <div v-if="selectedDevice" class="selection-preview">
      <n-alert type="info" style="margin-top: 12px">
        <template #header>
          <n-space align="center">
            <n-icon size="16"><DeviceIcon /></n-icon>
            <span>Device selected</span>
          </n-space>
        </template>

        <n-space vertical size="small">
          <n-space>
            <n-text strong>Device name：</n-text>
            <n-text>{{ selectedDevice.deviceName }}</n-text>
          </n-space>
          <n-space>
            <n-text strong>Device type：</n-text>
            <n-text>{{ selectedDevice.deviceType }}</n-text>
          </n-space>
          <n-space>
            <n-text strong>Device model：</n-text>
            <n-text>{{ selectedDevice.deviceModel }}</n-text>
          </n-space>

          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color)">
            <n-text depth="3" style="font-size: 12px">
              💡 Parameters will be generated：
              <strong>deviceId = "{{ selectedDevice.deviceId }}"</strong>
            </n-text>
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
.device-id-selector {
  padding: 20px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.selector-header {
  margin-bottom: 8px;
}

.device-selector {
  flex: 1;
}

.selection-preview {
  margin: 12px 0;
}

.selector-actions {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
</style>
