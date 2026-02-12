<template>
  <div class="device-dispatch-selector">
    <!-- Equipment selection -->
    <div class="device-selector mb-4">
      <n-select
        v-model:value="selectedDeviceId"
        :options="deviceOptions || []"
        :placeholder="$t('generate.select-device')"
        :loading="isLoadingDevices"
        :disabled="disabled"
        class="w-full"
        label-field="name"
        value-field="id"
        filterable
        clearable
        @update:value="onDeviceChange"
      >
        <template #header>{{ $t('generate.deviceSelection') }}</template>
      </n-select>
    </div>

    <!-- Data type selection -->
    <div class="data-type-selector mb-4">
      <n-select
        v-model:value="selectedDataType"
        :options="dataTypeOptions || []"
        :placeholder="$t('generate.selectDataType')"
        :disabled="disabled"
        class="w-full"
        clearable
        @update:value="onDataTypeChange"
      />
    </div>

    <!-- Indicator selection -->
    <div class="metrics-selector">
      <n-select
        v-model:value="selectedMetricsId"
        :options="processedMetricsOptions || []"
        :placeholder="$t('generate.selectMetrics')"
        :loading="isLoadingMetrics"
        :disabled="!selectedDeviceId || !selectedDataType || disabled"
        :show="metricsShow"
        class="w-full"
        :consistent-menu-width="false"
        filterable
        clearable
        @update:show="onMetricsDropdownShow"
        @update:value="onMetricsChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { SelectOption } from 'naive-ui'
import { deviceListForPanel, deviceMetricsList } from '@/service/api'
import { $t } from '@/locales'

interface DeviceOption {
  id: string
  name: string
  [key: string]: any
}

interface MetricsOption {
  key: string
  label: string
  data_type: string
  data_source_type?: string
  [key: string]: any
}

interface DeviceDispatchSelectorProps {
  modelValue?: {
    deviceId?: string
    deviceName?: string
    dataType?: string
    metricsId?: string
    metricsName?: string
  }
  deviceOptions?: DeviceOption[]
  disabled?: boolean
}

interface DeviceDispatchSelectorEmits {
  (e: 'update:modelValue', value: any): void
  (e: 'device-change', deviceId: string, device: DeviceOption): void
  (e: 'data-type-change', dataType: string): void
  (e: 'metrics-change', metricsId: string, metrics: MetricsOption): void
}

const props = withDefaults(defineProps<DeviceDispatchSelectorProps>(), {
  deviceOptions: () => [],
  disabled: false
})

const emit = defineEmits<DeviceDispatchSelectorEmits>()

// Responsive data
const selectedDeviceId = ref<string>('')
const selectedDeviceName = ref<string>('')
const selectedDataType = ref<string>('')
const selectedMetricsId = ref<string>('')
const selectedMetricsName = ref<string>('')
const metricsShow = ref<boolean>(false)
const isLoadingDevices = ref<boolean>(false)
const isLoadingMetrics = ref<boolean>(false)
const metricsOptions = ref<MetricsOption[]>([])
const metricsOptionsFetched = ref<boolean>(false)
const internalDeviceOptions = ref<DeviceOption[]>([])

// Data type options
const dataTypeOptions: SelectOption[] = [
  { label: $t('generate.attributes'), value: 'attributes' },
  { label: $t('generate.telemetry'), value: 'telemetry' },
  { label: $t('generate.command'), value: 'command' }
]

// Computed properties
const deviceOptions = computed(() => {
  if (props.deviceOptions && props.deviceOptions.length > 0) {
    return props.deviceOptions
  }
  return internalDeviceOptions.value
})

// Handling indicator options，Group by data source type
const processedMetricsOptions = computed(() => {
  try {
    if (!metricsOptions.value || !Array.isArray(metricsOptions.value) || !metricsOptions.value.length) {
      return []
    }

    const groupedOptions: SelectOption[] = []

    // APIThe returned data structure is [{ data_source_type, options: [{ key, label, data_type }] }]
    metricsOptions.value.forEach((group: any) => {
      if (!group || typeof group !== 'object') return

      const sourceType = group.data_source_type || 'default'

      // Filter based on data type
      if (selectedDataType.value) {
        if (selectedDataType.value === 'attributes' && sourceType !== 'attributes') return
        if (selectedDataType.value === 'telemetry' && sourceType !== 'telemetry') return
        if (selectedDataType.value === 'command' && sourceType !== 'command') return
      }

      // Add group title
      groupedOptions.push({
        label: sourceType,
        value: `group-${sourceType}`,
        disabled: true,
        type: 'group'
      })

      // Add options under this group
      if (group.options && Array.isArray(group.options)) {
        group.options.forEach((option: any) => {
          if (option && option.key) {
            groupedOptions.push({
              label: `${option.label || option.key} (${option.key})`,
              value: option.key,
              data: {
                ...option,
                data_source_type: sourceType
              }
            })
          }
        })
      }
    })

    return groupedOptions
  } catch (error) {
    console.error('Error while processing indicator options:', error)
    return []
  }
})

// Monitor external data changes
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      selectedDeviceId.value = newValue.deviceId || ''
      selectedDeviceName.value = newValue.deviceName || ''
      selectedDataType.value = newValue.dataType || ''
      selectedMetricsId.value = newValue.metricsId || ''
      selectedMetricsName.value = newValue.metricsName || ''
    }
  },
  { immediate: true, deep: true }
)

// Monitor internal data changes，Sync to external
watch(
  [selectedDeviceId, selectedDeviceName, selectedDataType, selectedMetricsId, selectedMetricsName],
  () => {
    const value = {
      deviceId: selectedDeviceId.value,
      deviceName: selectedDeviceName.value,
      dataType: selectedDataType.value,
      metricsId: selectedMetricsId.value,
      metricsName: selectedMetricsName.value
    }
    emit('update:modelValue', value)
  },
  { deep: true }
)

// Equipment selection changes
const onDeviceChange = async (deviceId: string) => {
  selectedDeviceId.value = deviceId

  // Clear indicator related data
  selectedMetricsId.value = ''
  selectedMetricsName.value = ''
  metricsOptions.value = []
  metricsOptionsFetched.value = false

  if (deviceId) {
    const device = deviceOptions.value.find(d => d.id === deviceId)
    if (device) {
      selectedDeviceName.value = device.name
      emit('device-change', deviceId, device)
    }
  }
}

// Data type changes
const onDataTypeChange = (dataType: string) => {
  selectedDataType.value = dataType

  // Clear indicator related data
  selectedMetricsId.value = ''
  selectedMetricsName.value = ''
  metricsOptions.value = []
  metricsOptionsFetched.value = false

  emit('data-type-change', dataType)
}

// Indicator drop-down display control
const onMetricsDropdownShow = async (show: boolean) => {
  metricsShow.value = show

  if (show && selectedDeviceId.value && selectedDataType.value && !metricsOptionsFetched.value) {
    await loadMetricsOptions()
  }
}

// Load indicator options
const loadMetricsOptions = async () => {
  if (!selectedDeviceId.value || !selectedDataType.value) return

  try {
    isLoadingMetrics.value = true
    const res = await deviceMetricsList(selectedDeviceId.value)

    // Check the returned data structure
    if (res && res.data && Array.isArray(res.data)) {
      // Filter metrics based on data type
      const allMetrics = res.data
      metricsOptions.value = allMetrics.filter(metric => {
        if (!metric || typeof metric !== 'object') return false
        // Filter based on data type，This needs to be based on actualAPIReturned data structure adjustment
        if (selectedDataType.value === 'attributes') {
          return metric.data_source_type === 'attributes'
        } else if (selectedDataType.value === 'telemetry') {
          return metric.data_source_type === 'telemetry'
        } else if (selectedDataType.value === 'command') {
          return metric.data_source_type === 'command'
        }
        return true
      })
    } else {
      console.error('APIReturn data format exception:', res)
      metricsOptions.value = []
    }

    metricsOptionsFetched.value = true
  } catch (error) {
    console.error('Failed to load indicators:', error)
    metricsOptions.value = []
  } finally {
    isLoadingMetrics.value = false
  }
}

// Indicator selection changes
const onMetricsChange = (metricsId: string) => {
  selectedMetricsId.value = metricsId

  if (metricsId && metricsOptions.value && Array.isArray(metricsOptions.value)) {
    // Find indicators in new data structures
    let foundMetrics: any = null
    for (const group of metricsOptions.value) {
      if (group && group.options && Array.isArray(group.options)) {
        const metric = group.options.find((opt: any) => opt && opt.key === metricsId)
        if (metric) {
          foundMetrics = {
            ...metric,
            data_source_type: group.data_source_type
          }
          break
        }
      }
    }

    if (foundMetrics) {
      selectedMetricsName.value = foundMetrics.label || foundMetrics.key
      emit('metrics-change', metricsId, foundMetrics)
    }
  }
}

// Load device options
const loadDeviceOptions = async () => {
  try {
    isLoadingDevices.value = true
    const res = await deviceListForPanel({})
    internalDeviceOptions.value = res.data || []
  } catch (error) {
    console.error('Failed to load device list:', error)
    internalDeviceOptions.value = []
  } finally {
    isLoadingDevices.value = false
  }
}

// Automatically load the device list when the component is mounted
onMounted(() => {
  if (!props.deviceOptions || props.deviceOptions.length === 0) {
    loadDeviceOptions()
  }
})

// exposure method
defineExpose({
  loadDeviceOptions,
  reset: () => {
    selectedDeviceId.value = ''
    selectedDeviceName.value = ''
    selectedDataType.value = ''
    selectedMetricsId.value = ''
    selectedMetricsName.value = ''
    metricsOptions.value = []
    metricsOptionsFetched.value = false
  }
})
</script>

<style scoped>
.device-dispatch-selector {
  width: 100%;
}

:deep(.n-select-group-header) {
  font-weight: 600;
  color: #666;
  background-color: #f5f5f5;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.n-select-option) {
  padding: 8px 12px;
}

:deep(.n-select-option:hover) {
  background-color: #f0f9ff;
}
</style>
