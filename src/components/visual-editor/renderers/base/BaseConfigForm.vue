<template>
  <div class="base-config-form">
    <n-form :model="formData" label-placement="left" label-width="80" size="small">
      <!-- 🔥 Device configuration - highest priority -->
      <n-divider title-placement="left">{{ t('config.base.device.section') }}</n-divider>

      <n-form-item :label="t('config.base.deviceId')">
        <DeviceSelectSingle
          v-model="formData.deviceId"
          :options="deviceOptions"
          :loading="loadingDevices"
          :has-more="hasMoreDevices"
          :placeholder="t('config.base.deviceIdPlaceholder')"
          clearable
          @load-more="loadMoreDevices"
          @initial-load="loadInitialDevices"
          @search="handleDeviceSearch"
        />
      </n-form-item>

      <n-form-item :label="t('config.base.metricsList')">
        <n-dynamic-tags
          v-model:value="formData.metricsListTags"
          :placeholder="t('config.base.metricsListPlaceholder')"
          @update:value="handleMetricsListUpdate"
        />
      </n-form-item>

      <!-- Title configuration -->
      <n-divider title-placement="left">{{ t('config.base.title.section') }}</n-divider>

      <n-form-item :label="t('config.base.showTitle')">
        <n-switch v-model:value="formData.showTitle" @update:value="handleUpdate" />
      </n-form-item>

      <n-form-item v-if="formData.showTitle" :label="t('config.base.title')">
        <n-input
          v-model:value="formData.title"
          :placeholder="t('config.base.titlePlaceholder')"
          clearable
          @input="handleUpdate"
        />
      </n-form-item>

      <!-- show configuration -->
      <n-divider title-placement="left">{{ t('config.base.display.section') }}</n-divider>

      <n-form-item :label="t('config.base.visible')">
        <n-switch v-model:value="formData.visible" @update:value="handleUpdate" />
      </n-form-item>

      <n-form-item :label="t('config.base.opacity')">
        <n-slider
          v-model:value="formData.opacity"
          :min="0"
          :max="1"
          :step="0.01"
          :format-tooltip="value => `${Math.round(value * 100)}%`"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <!-- Style configuration -->
      <n-divider title-placement="left">{{ t('config.base.style.section') }}</n-divider>

      <n-form-item :label="t('config.base.backgroundColor')">
        <n-color-picker v-model:value="formData.backgroundColor" :show-alpha="true" @update:value="handleUpdate" />
      </n-form-item>

      <n-form-item :label="t('config.base.borderWidth')">
        <n-slider
          v-model:value="formData.borderWidth"
          :min="0"
          :max="10"
          :step="1"
          :format-tooltip="value => `${value}px`"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <n-form-item v-if="formData.borderWidth > 0" :label="t('config.base.borderColor')">
        <n-color-picker v-model:value="formData.borderColor" @update:value="handleUpdate" />
      </n-form-item>

      <n-form-item v-if="formData.borderWidth > 0" :label="t('config.base.borderStyle')">
        <n-select v-model:value="formData.borderStyle" :options="borderStyleOptions" @update:value="handleUpdate" />
      </n-form-item>

      <n-form-item :label="t('config.base.borderRadius')">
        <n-slider
          v-model:value="formData.borderRadius"
          :min="0"
          :max="20"
          :step="1"
          :format-tooltip="value => `${value}px`"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <!-- spacing configuration -->
      <n-divider title-placement="left">{{ t('config.base.layout.section') }}</n-divider>

      <n-form-item :label="t('config.base.padding')">
        <n-slider
          v-model:value="formData.paddingValue"
          :min="0"
          :max="50"
          :step="2"
          :format-tooltip="value => `${value}px`"
          @update:value="handlePaddingUpdate"
        />
      </n-form-item>

      <n-form-item :label="t('config.base.margin')">
        <n-slider
          v-model:value="formData.marginValue"
          :min="0"
          :max="50"
          :step="2"
          :format-tooltip="value => `${value}px`"
          @update:value="handleMarginUpdate"
        />
      </n-form-item>

      <!-- Quick operation -->
      <n-divider title-placement="left">{{ t('config.base.advanced.section') }}</n-divider>

      <n-space>
        <n-button size="small" @click="resetToDefaults">{{ t('config.base.resetDefault') }}</n-button>
        <n-button size="small" type="primary" @click="applyConfig">{{ t('config.base.apply') }}</n-button>
      </n-space>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * BaseConfiguration form - Simplified version
 * imitateSimpleTestConfigThe simplicityUIstyle
 */

import { reactive, watch, computed, onMounted, onUnmounted, shallowReactive, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import { configurationManager } from '@/components/visual-editor/configuration'
import type { BaseConfiguration } from '@/card2.1/hooks/useCard2Props'
import type { MetricItem } from '@/card2.1/core2'
import { getDeviceListForSelect } from '@/service/api/device-template-model'
import DeviceSelectSingle from '@/components/DeviceSelectSingle.vue'

// take overprops
interface Props {
  nodeId?: string
  readonly?: boolean
}

const props = defineProps<Props>()

// definitionemits
interface Emits {
  (e: 'apply', config: BaseConfiguration): void
  (e: 'reset'): void
}

const emit = defineEmits<Emits>()

// Combined functions
const { t } = useI18n()
const message = useMessage()

// Inject editor context
const editorContext = inject('editorContext', null) as any

// Tags that prevent cyclic updates
let isUpdating = false

/**
 * form data structure - Simplified version，Control spacing using a single value，Contains device fields
 */
const formData = shallowReactive({
  showTitle: false,
  title: '',
  opacity: 1,
  visible: true,
  backgroundColor: undefined as string | undefined,
  borderWidth: 0,
  borderColor: '#d9d9d9',
  borderStyle: 'solid',
  borderRadius: 6,
  paddingValue: 0, // Uniform padding values
  marginValue: 0, // Uniform margin values
  // 🔥 New：Device related fields
  deviceId: '', // equipmentID
  metricsListTags: [] as string[], // Indicator list（label form）
  metricsList: [] as MetricItem[], // The actual indicator list object
  // actualpaddingandmarginobject（Internal use）
  padding: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  margin: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
})

/**
 * Border style options
 */
const borderStyleOptions = [
  { label: t('config.base.borderStyles.solid'), value: 'solid' },
  { label: t('config.base.borderStyles.dashed'), value: 'dashed' },
  { label: t('config.base.borderStyles.dotted'), value: 'dotted' },
  { label: t('config.base.borderStyles.double'), value: 'double' }
]

// 🔥 Device selection related status - infinite scroll version
const deviceOptions = ref<Api.Device.DeviceSelectItem[]>([])
const loadingDevices = ref(false)
const hasMoreDevices = ref(true)
const currentPage = ref(1)
const pageSize = 20
const searchKeyword = ref('')

/**
 * Load initial device list
 */
const loadInitialDevices = async () => {
  if (loadingDevices.value) return

  currentPage.value = 1
  deviceOptions.value = []
  hasMoreDevices.value = true

  await loadDevicePage()
}

/**
 * Load more devices
 */
const loadMoreDevices = async () => {
  if (loadingDevices.value || !hasMoreDevices.value) return

  currentPage.value += 1
  await loadDevicePage()
}

/**
 * Load device paging data
 */
const loadDevicePage = async () => {
  loadingDevices.value = true

  try {
    const response = await getDeviceListForSelect({
      page: currentPage.value.toString(),
      page_size: pageSize.toString(),
      search: searchKeyword.value || undefined
    })

    if (response.data && response.data.list) {
      const { list, total } = response.data

      // Append data instead of replace（Fix infinite scroll）
      if (currentPage.value === 1) {
        deviceOptions.value = list
      } else {
        deviceOptions.value.push(...list)
      }

      // Check if there is more data
      hasMoreDevices.value = deviceOptions.value.length < total
    }
  } catch (error) {
    console.error('Failed to load device list:', error)
    message.error(t('config.base.loadDevicesFailed'))
  } finally {
    loadingDevices.value = false
  }
}

/**
 * Handle device searches
 */
const handleDeviceSearch = (keyword: string) => {
  searchKeyword.value = keyword
  // Reset pagination when searching
  currentPage.value = 1
  deviceOptions.value = []
  hasMoreDevices.value = true

  // Delayed search execution，Avoid frequent requests
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadDevicePage()
  }, 300)
}

// Search for anti-shake timer
let searchTimer: number | null = null

/**
 * Listen for device selection changes
 */
watch(() => formData.deviceId, (newDeviceId) => {
  // equipmentIDTrigger configuration updates when changes occur
  handleUpdate()
}, { deep: true })

// Currently selected nodeID
const selectedNodeId = computed(() => {
  return props.nodeId || null
})

/**
 * Anti-shake update timer
 */
let updateTimer: number | null = null

/**
 * Handling padding updates
 */
const handlePaddingUpdate = () => {
  const value = formData.paddingValue
  formData.padding = {
    top: value,
    right: value,
    bottom: value,
    left: value
  }
  handleUpdate()
}

/**
 * Handle margin updates
 */
const handleMarginUpdate = () => {
  const value = formData.marginValue
  formData.margin = {
    top: value,
    right: value,
    bottom: value,
    left: value
  }
  handleUpdate()
}

/**
 * Handling indicator list updates
 * Convert label form to MetricItem object array
 */
const handleMetricsListUpdate = (tags: string[]) => {
  // Convert string label to MetricItem object
  formData.metricsList = tags.map(tag => ({
    id: tag.toLowerCase().replace(/\s+/g, '_'), // Generate simpleID
    name: tag,
    unit: '',
    description: `index: ${tag}`,
    dataType: 'number' as const,
    aggregation: 'last' as const
  }))

  // Update configuration
  handleUpdate()
}

/**
 * 🔥 Communicate directly with the card layer to update configurations
 * Use a reliable configuration manager approach，avoidDOMQuery
 */
const updateCardLayerConfig = (baseConfig: BaseConfiguration) => {
  const nodeId = selectedNodeId.value
  if (!nodeId) return false

  try {
    // 🔥 method1: Prioritize updating configuration using Configuration Manager
    configurationManager.updateConfiguration(nodeId, 'base', baseConfig)

    // 🔥 method2: Send custom event notification card layer（for real-time updates）
    window.dispatchEvent(new CustomEvent('card2-config-update', {
      detail: {
        componentId: nodeId,
        layer: 'base',
        config: baseConfig
      }
    }))

    return true
  } catch (error) {
    console.error('🔥 [BaseConfigForm] Card layer communication failed:', error)
    return false
  }
}

/**
 * Handle configuration updates - Anti-shake processing
 */
const handleUpdate = () => {
  const nodeId = selectedNodeId.value
  if (!nodeId || isUpdating) {
    return
  }

  // Anti-shake processing
  if (updateTimer) {
    clearTimeout(updateTimer)
  }

  updateTimer = window.setTimeout(() => {
    try {
      // BuildbaseConfiguration object，Contains device fields
      const baseConfig: BaseConfiguration = {
        showTitle: formData.showTitle,
        title: formData.title,
        opacity: formData.opacity,
        visible: formData.visible,
        backgroundColor: formData.backgroundColor,
        borderWidth: formData.borderWidth > 0 ? formData.borderWidth : undefined,
        borderColor: formData.borderWidth > 0 ? formData.borderColor : undefined,
        borderStyle: formData.borderWidth > 0 ? formData.borderStyle : undefined,
        borderRadius: formData.borderRadius > 0 ? formData.borderRadius : undefined,
        padding: { ...formData.padding },
        margin: { ...formData.margin },
        // 🔥 Device field
        deviceId: formData.deviceId || '',
        metricsList: formData.metricsList
      }

      // 🔥 Prioritize trying to communicate directly with the card layer
      const cardUpdateSuccess = updateCardLayerConfig(baseConfig)

      if (!cardUpdateSuccess) {
        // Fallback to usingconfigurationManager
        configurationManager.updateConfiguration(nodeId, 'base', baseConfig)
      }
    } catch (error) {
      message.error(t('common.updateFailed'))
    }
  }, 300)
}

/**
 * 🔥 Get configuration data from card layer
 * Use a reliable configuration manager approach，avoidDOMQuery
 */
const getCardLayerConfig = (nodeId: string): BaseConfiguration | null => {
  try {
    // 🔥 method1: Prefer using the configuration manager to obtain configuration
    const config = configurationManager.getConfiguration(nodeId)
    if (config?.base) {
      return config.base
    }

    // 🔥 method2: Send custom event request configuration（Used to get real-time configuration）
    const configRequestEvent = new CustomEvent('card2-config-request', {
      detail: { componentId: nodeId, layer: 'base' }
    })

    let receivedConfig: BaseConfiguration | null = null
    const handleConfigResponse = (event: CustomEvent) => {
      if (event.detail.componentId === nodeId && event.detail.layer === 'base') {
        receivedConfig = event.detail.config
      }
    }

    window.addEventListener('card2-config-response', handleConfigResponse as EventListener)
    window.dispatchEvent(configRequestEvent)
    window.removeEventListener('card2-config-response', handleConfigResponse as EventListener)

    return receivedConfig
  } catch (error) {
    console.error('🔥 [BaseConfigForm] Failed to obtain card layer configuration:', error)
    return null
  }
}

/**
 * from the card layer orconfigurationManagerLoad configuration data into the form
 */
const loadConfigurationFromManager = async () => {
  const nodeId = selectedNodeId.value
  if (!nodeId) {
    resetToDefaults()
    return
  }

  // Prevent cyclic updates
  isUpdating = true

  try {
    // 🔥 Prioritize trying to obtain configuration from the card layer
    let baseConfig = getCardLayerConfig(nodeId)

    // fall back to fromconfigurationManagerGet configuration
    if (!baseConfig) {
      console.warn('🔥 [BaseConfigForm] Failed to obtain card layer configuration，Fallback toconfigurationManager')
      const config = configurationManager.getConfiguration(nodeId)
      baseConfig = config?.base
    }

    if (baseConfig) {
      // Synchronize configuration to form
      formData.showTitle = baseConfig.showTitle ?? false
      formData.title = baseConfig.title || ''
      formData.opacity = baseConfig.opacity ?? 1
      formData.visible = baseConfig.visible ?? true
      formData.backgroundColor = baseConfig.backgroundColor
      formData.borderWidth = baseConfig.borderWidth ?? 0
      formData.borderColor = baseConfig.borderColor || '#d9d9d9'
      formData.borderStyle = baseConfig.borderStyle || 'solid'
      formData.borderRadius = baseConfig.borderRadius ?? 6

      // 🔥 Load device fields
      formData.deviceId = baseConfig.deviceId || ''
      formData.metricsList = baseConfig.metricsList || []

      // Will MetricItem Objects are converted to labels and displayed
      formData.metricsListTags = formData.metricsList.map(metric => metric.name)

      // If there is a selected deviceID，Make sure the device information is included in the device list
      if (formData.deviceId && deviceOptions.value.length === 0) {
        await loadInitialDevices()
      }

      // deal withpadding - Take the maximum value as the unified value
      if (baseConfig.padding) {
        const padding = baseConfig.padding
        formData.paddingValue = Math.max(padding.top || 0, padding.right || 0, padding.bottom || 0, padding.left || 0)
        formData.padding = { ...padding }
      } else {
        formData.paddingValue = 0
        formData.padding = { top: 0, right: 0, bottom: 0, left: 0 }
      }

      // deal withmargin - Take the maximum value as the unified value
      if (baseConfig.margin) {
        const margin = baseConfig.margin
        formData.marginValue = Math.max(margin.top || 0, margin.right || 0, margin.bottom || 0, margin.left || 0)
        formData.margin = { ...margin }
      } else {
        formData.marginValue = 0
        formData.margin = { top: 0, right: 0, bottom: 0, left: 0 }
      }
    } else {
      resetToDefaults()
    }
  } catch (error) {
    console.error('🔥 [BaseConfigForm] Configuration load failed:', error)
    resetToDefaults()
  } finally {
    // delayed reset flag
    setTimeout(() => {
      isUpdating = false
    }, 50)
  }
}

/**
 * reset to default
 */
const resetToDefaults = () => {
  formData.showTitle = false
  formData.title = ''
  formData.opacity = 1
  formData.visible = true
  formData.backgroundColor = undefined
  formData.borderWidth = 0
  formData.borderColor = '#d9d9d9'
  formData.borderStyle = 'solid'
  formData.borderRadius = 6
  formData.paddingValue = 0
  formData.marginValue = 0
  formData.padding = { top: 0, right: 0, bottom: 0, left: 0 }
  formData.margin = { top: 0, right: 0, bottom: 0, left: 0 }
  // 🔥 New：Reset device fields
  formData.deviceId = ''
  formData.metricsListTags = []
  formData.metricsList = []
}

// Configure change listener
let removeConfigListener: (() => void) | null = null

/**
 * Monitor changes in selected nodes，Reload configuration
 */
watch(
  selectedNodeId,
  (newNodeId, oldNodeId) => {
    // Remove old listener
    if (removeConfigListener) {
      removeConfigListener()
      removeConfigListener = null
    }

    // Load the configuration of the new node
    loadConfigurationFromManager()

    // If there is a new node，Add configuration change listener
    if (newNodeId) {
      try {
        removeConfigListener = configurationManager.onConfigurationChange(newNodeId, newConfig => {
          // Reload configuration（Prevent the form from being desynchronized when the configuration is modified externally）
          loadConfigurationFromManager()
        })
      } catch (error) {}
    }
  },
  { immediate: true }
)

// Initialized when component is mounted
onMounted(() => {
  loadConfigurationFromManager()
  // Initialize device list
  loadInitialDevices()
})

/**
 * Application configuration
 */
const applyConfig = () => {
  handleUpdate()
  message.success(t('config.base.applySuccess'))
  emit('apply', {
    showTitle: formData.showTitle,
    title: formData.title,
    opacity: formData.opacity,
    visible: formData.visible,
    backgroundColor: formData.backgroundColor,
    borderWidth: formData.borderWidth > 0 ? formData.borderWidth : undefined,
    borderColor: formData.borderWidth > 0 ? formData.borderColor : undefined,
    borderStyle: formData.borderWidth > 0 ? formData.borderStyle : undefined,
    borderRadius: formData.borderRadius > 0 ? formData.borderRadius : undefined,
    padding: { ...formData.padding },
    margin: { ...formData.margin }
  })
}

// Cleanup when components are uninstalled
onUnmounted(() => {
  if (removeConfigListener) {
    try {
      removeConfigListener()
    } catch (error) {}
  }

  if (updateTimer) {
    clearTimeout(updateTimer)
  }

  if (searchTimer) {
    clearTimeout(searchTimer)
  }
})
</script>

<style scoped>
.base-config-form {
  padding: 12px;
}

/* Form item style optimization */
:deep(.n-form-item) {
  margin-bottom: 12px;
}

:deep(.n-form-item-label) {
  font-size: 12px;
  color: var(--text-color-2);
}

/* Input control style */
:deep(.n-input),
:deep(.n-input-number),
:deep(.n-select) {
  width: 100%;
}

/* Slider style */
:deep(.n-slider) {
  margin: 8px 0;
}

/* Divider style */
:deep(.n-divider) {
  margin: 16px 0 12px 0;
}

:deep(.n-divider__title) {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

/* color picker */
:deep(.n-color-picker) {
  width: 100%;
}

/* Device selector container style */
:deep(.device-select-popover-content) {
  min-width: 280px;
  max-width: 400px;
}
</style>
