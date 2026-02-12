<!--
  Component level polling configures components
  Configure a unified polling strategy for the entire component
-->
<script setup lang="ts">
/**
 * ComponentPollingConfig - Component level polling configuration
 * Polling configuration of unified management components，All data sources of the component will be triggered when executed.
 */

import { reactive, computed, watch, onMounted, ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'

// Polling configuration interface
interface PollingConfig {
  /** Whether to enable polling */
  enabled: boolean
  /** Polling interval（millisecond） */
  interval: number
  /** Whether to perform the first poll immediately */
  immediate: boolean
}

// Propsinterface
interface Props {
  /** componentsID */
  componentId: string
  /** Component name */
  componentName?: string
  /** Whether it is preview mode - only forUIstatus display */
  previewMode?: boolean
  /** Initial polling configuration */
  initialConfig?: PollingConfig | null
}

// Emitsinterface
interface Emits {
  (e: 'configChange', config: PollingConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  componentName: 'components',
  previewMode: false,
  initialConfig: null
})

const emit = defineEmits<Emits>()
const { t } = useI18n()
const themeStore = useThemeStore()

/**
 * Flag to prevent configuration cycle updates
 */
const isInternalUpdate = ref(false)

/**
 * Local polling configuration status
 */
const pollingConfig = reactive<PollingConfig>({
  enabled: props.initialConfig?.enabled || false,
  interval: props.initialConfig?.interval || 30000,
  // 🔥 repair：Handle it correctly immediate The default value of the property
  immediate: props.initialConfig?.immediate !== undefined ? props.initialConfig.immediate : true
})

/**
 * Interval options
 */
const intervalOptions = [
  { label: '5Second', value: 5000 },
  { label: '10Second', value: 10000 },
  { label: '30Second', value: 30000 },
  { label: '1minute', value: 60000 },
  { label: '5minute', value: 300000 },
  { label: '10minute', value: 600000 }
]

/**
 * Poll status display text
 */
const statusText = computed(() => {
  if (!props.previewMode && pollingConfig.enabled) {
    return 'configured（Preview mode execution）'
  }

  if (pollingConfig.enabled) {
    return 'configured'
  }

  return 'Not configured'
})

/**
 * Status display type
 */
const statusType = computed(() => {
  if (pollingConfig.enabled) {
    return props.previewMode ? 'success' : 'info'
  }
  return 'default'
})

/**
 * Handle configuration changes
 */
const handleConfigChange = () => {
  // 🔥 Prevent events from being triggered during internal updates
  if (isInternalUpdate.value) {
    return
  }

  // Emit configuration change events，Saved by parent component
  emit('configChange', { ...pollingConfig })
}

/**
 * Listen for configuration changes
 */
watch(() => pollingConfig.enabled, handleConfigChange)
watch(() => pollingConfig.interval, handleConfigChange)
watch(() => pollingConfig.immediate, handleConfigChange)

/**
 * Listen for initial configuration changes（Used to restore saved configuration）
 */
watch(
  () => props.initialConfig,
  newConfig => {
    if (newConfig) {
      // 🔥 Set internal update flag，Prevent configuration change events from being triggered
      isInternalUpdate.value = true

      pollingConfig.enabled = newConfig.enabled || false
      pollingConfig.interval = newConfig.interval || 30000
      // 🔥 repair：Handle it correctly immediate property，allowed as false
      pollingConfig.immediate = newConfig.immediate !== undefined ? newConfig.immediate : true

      // 🔥 delayed reset flag，Ensure all responsive updates are completed
      nextTick(() => {
        isInternalUpdate.value = false
      })
    }
  },
  { deep: true, immediate: true }
)

/**
 * Initialize debugging when component is mounted
 */
onMounted(() => {})
</script>

<template>
  <div class="component-polling-config">
    <!-- Compact polling configuration line -->
    <div class="polling-row">
      <div class="polling-left">
        <n-text class="polling-title">Component polling configuration</n-text>
        <n-tag :type="statusType" size="small">
          {{ statusText }}
        </n-tag>
      </div>

      <div class="polling-right">
        <n-switch v-model:value="pollingConfig.enabled" size="small" />
      </div>
    </div>

    <!-- Polling detailed configuration（Collapse display） -->
    <div v-if="pollingConfig.enabled" class="polling-details">
      <div class="detail-item">
        <span class="detail-label">Polling interval</span>
        <n-select v-model:value="pollingConfig.interval" :options="intervalOptions" size="small" style="width: 80px" />
      </div>

      <div class="detail-item">
        <span class="detail-label">Execute immediately</span>
        <n-switch v-model:value="pollingConfig.immediate" size="small" />
      </div>

      <div class="detail-note">
        <n-text depth="3" size="small">Polling is only performed in preview mode，All data sources for the component will be refreshed</n-text>
      </div>
    </div>
  </div>
</template>

<style scoped>
.component-polling-config {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-color);
  margin-bottom: 12px;
  font-size: 13px;
}

/* Main configuration line - horizontal layout */
.polling-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  gap: 12px;
}

.polling-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.polling-title {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.polling-right {
  flex-shrink: 0;
}

/* Detailed configuration area */
.polling-details {
  border-top: 1px solid var(--border-color);
  padding: 8px 12px 10px;
  background: var(--body-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.detail-label {
  font-size: 12px;
  color: var(--text-color-2);
  white-space: nowrap;
}

.detail-note {
  padding-top: 6px;
  border-top: 1px dashed var(--divider-color);
  margin-top: 2px;
}

/* Respond to theme changes */
[data-theme='dark'] .component-polling-config {
  background: var(--card-color);
  border-color: var(--border-color);
}

[data-theme='dark'] .polling-details {
  background: var(--body-color);
  border-top-color: var(--border-color);
}
</style>
