<template>
  <n-card class="alert-status" embedded>
    <div class="content">
      <!-- 🔥 display directly props.data Converted string -->
      <div class="field-group">
        <label class="field-label">🔥 Data source data:</label>
        <div class="field-value">{{ JSON.stringify(props.data) }}</div>
      </div>

      <!-- title display -->
      <div class="field-group">
        <label class="field-label">title:</label>
        <div class="field-value">{{ getDisplayValue('title', 'not set') }}</div>
        <n-button size="tiny" @click="changeTitle">Modify title</n-button>
      </div>

      <!-- Amount display -->
      <div class="field-group">
        <label class="field-label">Amount:</label>
        <div class="field-value">{{ getDisplayValue('amount', 0) }}</div>
        <n-button size="tiny" @click="changeAmount">Modify amount</n-button>
      </div>

      <!-- Introduction display -->
      <div class="field-group">
        <label class="field-label">Introduction:</label>
        <div class="field-value">{{ getDisplayValue('description', 'No description') }}</div>
        <n-button size="tiny" @click="changeDescription">Edit introduction</n-button>
      </div>

      <!-- Data source debugging information -->
      <div class="debug-info">
        <n-divider>🔍 debugging information</n-divider>
        <div class="debug-section">
          <span class="debug-label">Unified configuration values:</span>
          <pre class="debug-value debug-scrollable">{{ JSON.stringify({
            title: unifiedConfig.component?.title,
            amount: unifiedConfig.component?.amount,
            description: unifiedConfig.component?.description
          }, null, 2) }}</pre>
        </div>
        <div class="debug-section">
          <span class="debug-label">data source value:</span>
          <pre class="debug-value debug-scrollable">{{ JSON.stringify(props.data, null, 2) }}</pre>
        </div>
        <div class="debug-section">
          <span class="debug-label">final displayed value（Data source first）:</span>
          <pre class="debug-value debug-scrollable">{{ JSON.stringify({
            title: getDisplayValue('title', 'not set'),
            amount: getDisplayValue('amount', 0),
            description: getDisplayValue('description', 'No description')
          }, null, 2) }}</pre>
        </div>
        <div class="debug-section">
          <span class="debug-label">Data source analysis:</span>
          <pre class="debug-value debug-scrollable">{{ JSON.stringify({
            title: getDataSource('title'),
            amount: getDataSource('amount'),
            description: getDataSource('description')
          }, null, 2) }}</pre>
        </div>
      </div>

      <!-- test button -->
      <div class="actions">
        <n-button type="primary" size="small" @click="randomUpdate">Randomly update all values</n-button>
        <n-button size="small" @click="resetToDefault">reset to default</n-button>
        <n-button type="warning" size="small" @click="testDataSource">Test data source</n-button>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
/**
 * Alarm status component - Unified configuration management version
 * 🔥 Adopt a new unified configuration architecture：All configurations are collected at the card level
 */

import { watch, onMounted, onUnmounted, ref } from 'vue'
import { NCard, NButton, useMessage } from 'naive-ui'
import { useCard2Props, type UnifiedCard2Configuration } from '@/card2.1/hooks'
import type { AlertStatusCustomize } from './settingConfig'

// Component property interface - Support unified configuration architecture
interface Props {
  config: AlertStatusCustomize  // Receives a flat configuration object
  data?: Record<string, unknown>
  componentId?: string  // 🔥 New：componentsIDfor configuration management
}

// Component events - Used to notify configuration changes
interface Emits {
  (e: 'update:config', config: AlertStatusCustomize): void
  (e: 'update:unified-config', config: UnifiedCard2Configuration): void  // 🔥 New：Unified configuration change events
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

const emit = defineEmits<Emits>()

// 🔥 Get initial unified configuration - fromCard2WrapperUnified configuration architecture acquisition
function getInitialUnifiedConfig(): UnifiedCard2Configuration | undefined {
  if (!props.componentId) return undefined


  try {
    // passDOMFindCard2WrapperInstance gets complete configuration
    const cardElement = document.querySelector(`[data-component-id="${props.componentId}"]`)
    if (cardElement && (cardElement as any)?.__vueParentComponent?.exposed?.getFullConfiguration) {
      const fullConfig = (cardElement as any).__vueParentComponent.exposed.getFullConfiguration()

      // 🔥 critical debugging：Show the specific content of the component configuration
      if (fullConfig?.component) {
      } else {
        console.warn(`🔥 [alert-status] Not included in initial configurationcomponentFestival!`)
      }

      return fullConfig
    } else {
      console.warn(`🔥 [alert-status] not foundCard2Wrapperelement or exposure method`)
    }
  } catch (error) {
    console.warn(`🔥 [alert-status] Failed to obtain initial configuration:`, error)
  }

  return undefined
}

// 🔥 Use enhanced Card 2.1 data binding，Support unified configuration management
const {
  config,
  displayData,
  unifiedConfig,
  updateConfig: updateCard2Config,   // 🔥 Rename to avoid conflicts
  updateUnifiedConfigWithSync,       // 🔥 Update using enhanced configuration（Automatic synchronization）
  getFullConfiguration,
  cleanupAutoSync,                   // 🔥 Cleanup function
  // 🔥 New：Attribute exposure function（Now handled automatically，But keep the interface）
  exposeProperty,
  exposeProperties,
  exposePropertyWithWatch,
  // 🔥 critical fix：add missing watchProperty method
  watchProperty
} = useCard2Props({
  config: props.config,
  data: props.data,
  componentId: props.componentId,
  initialUnifiedConfig: getInitialUnifiedConfig()  // 🔥 Pass initial unified configuration
})

const message = useMessage()

// 🔥 Core data acquisition function：Fixed to be completely based on unified configuration
const getDisplayValue = (field: string, defaultValue: any) => {

  // 🔥 critical fix：title, amount, description Is the component configuration property，Get it from unified configuration first
  if (['title', 'amount', 'description'].includes(field)) {
    // Get only from component configuration in unified configuration
    if (unifiedConfig.value.component && field in unifiedConfig.value.component && unifiedConfig.value.component[field] !== undefined) {
      const value = unifiedConfig.value.component[field]
      return String(value)
    }

    // Use default value
    return String(defaultValue)
  }

  // 🔥 Other fields can continue to use the original logic（Data source first，post configuration，final default value）
  // 1. Prioritize data source data（This is the execution result）
  if (props.data && typeof props.data === 'object' && field in props.data && props.data[field] !== undefined && props.data[field] !== null) {
    return String(props.data[field])
  }

  // 2. Fallback to component configuration in unified configuration
  if (unifiedConfig.value.component && field in unifiedConfig.value.component && unifiedConfig.value.component[field] !== undefined) {
    return String(unifiedConfig.value.component[field])
  }

  // 3. Use default value
  return String(defaultValue)
}

// 🔥 Data source analysis function：Determine where the data comes from
const getDataSource = (field: string) => {
  // Check data source data
  if (props.data && typeof props.data === 'object' && field in props.data && props.data[field] !== undefined && props.data[field] !== null) {
    return `data source: ${props.data[field]}`
  }

  // Check configuration data
  if (unifiedConfig.value.component && field in unifiedConfig.value.component && unifiedConfig.value.component[field] !== undefined) {
    return `Configuration: ${unifiedConfig.value.component[field]}`
  }

  // default value
  return 'Use default value'
}

// 🔥 Fix recursive updates：Deep comparison function，substituteJSON.stringifyavoidproxySerialization problem
const isConfigEqual = (a: any, b: any): boolean => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false

  if (typeof a === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
      if (!keysB.includes(key)) return false
      if (!isConfigEqual(a[key], b[key])) return false
    }

    return true
  }

  return false
}

// 🔥 Monitor unified configuration changes - Properties are now exposed by useCard2Props Automatic processing
watch(
  () => unifiedConfig.value,
  (newUnifiedConfig) => {
    // 🔥 Property exposure is now represented by useCard2Props Automatic processing，No need to call manually
  },
  { deep: true, immediate: true }
)

// 🔥 Monitor data source changes - Properties are now exposed by useCard2Props Automatic processing
watch(
  () => props.data,
  () => {
  },
  { deep: true, immediate: true }
)

// life cycle management
onMounted(() => {
})

onUnmounted(() => {
  // 🔥 call Hook Cleanup functions provided
  cleanupAutoSync()
})

// 🔥 Simplified configuration update function - Use unified configuration management directly
const updateConfig = (partialCustomize: Partial<AlertStatusCustomize>) => {

  // 🔥 critical fix：Use directly updateCard2Config Update component configuration layer
  updateCard2Config('component', partialCustomize)

  // 🔥 New：Sync to configuration manager，Ensure configuration forms are synchronized
  if (props.componentId) {
    import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
      .then(({ configurationIntegrationBridge }) => {
        configurationIntegrationBridge.updateConfiguration(
          props.componentId!,
          'component',
          partialCustomize,
          'component-internal-update'
        )
      })
      .catch(error => {
        console.error(`❌ [alert-status] Synchronizing configuration to manager failed:`, error)
      })
  }

  // 🔥 Issue an update event
  emit('update:config', partialCustomize)

}

// Modify title
const changeTitle = () => {
  // 🔥 critical fix：Use actual values ​​from unified configuration，instead ofconfig.value
  const currentTitle = unifiedConfig.value.component?.title || 'Alarm status'
  const newTitle = currentTitle === 'Alarm status' ? 'new title' : 'Alarm status'
  updateConfig({ title: newTitle })

  // 🔥 Property exposure is now represented by useCard2Props Automatic processing，No need to call manually

  message.success(`The title has been changed to: ${newTitle}`)
}

// Modify amount
const changeAmount = () => {
  // 🔥 critical fix：Use actual values ​​from unified configuration，instead ofconfig.value
  const currentAmount = unifiedConfig.value.component?.amount || 0
  const newAmount = currentAmount === 0 ? Math.floor(Math.random() * 10000) : 0
  updateConfig({ amount: newAmount })

  // 🔥 Property exposure is now represented by useCard2Props Automatic processing，No need to call manually

  message.success(`The amount has been changed to: ${newAmount}`)
}

// Edit introduction
const changeDescription = () => {
  const descriptions = ['The system is running normally', 'Data is being updated', 'Monitoring...', 'in good condition']
  // 🔥 critical fix：Use actual values ​​from unified configuration，instead ofconfig.value
  const currentDescription = unifiedConfig.value.component?.description || 'The system is running normally'
  const currentIndex = descriptions.indexOf(currentDescription)
  const newDescription = descriptions[(currentIndex + 1) % descriptions.length]
  updateConfig({ description: newDescription })

  // 🔥 Property exposure is now represented by useCard2Props Automatic processing，No need to call manually

  message.success(`Introduction has been changed to: ${newDescription}`)
}

// Randomly update all values
const randomUpdate = () => {
  const newConfig = {
    title: `random title ${Math.floor(Math.random() * 100)}`,
    amount: Math.floor(Math.random() * 50000),
    description: `random description ${new Date().toLocaleTimeString()}`
  }

  updateConfig(newConfig)

  // 🔥 Property exposure is now represented by useCard2Props Automatic processing，No need to call manually

  message.success('All configurations have been randomly updated')
}

// reset to default
const resetToDefault = () => {
  const defaultConfig = {
    title: 'Alarm status',
    amount: 0,
    description: 'The system is running normally'
  }

  updateConfig(defaultConfig)

  // 🔥 Property exposure is now represented by useCard2Props Automatic processing，No need to call manually

  message.info('Reset to default')
}

// Test data source
const testDataSource = () => {

  message.info('Data source test information has been output to the console，Please pressF12Check')
}

// 🔥 Simplified external interface，Most features have been useCard2Props Automatic processing
const expose = {
  getFullConfiguration,
  updateConfig,  // Use simplified local update functions
  // 🔥 reserve：Property listening interface，For use by interaction engines
  watchProperty: (propertyName: string, callback: (newValue: any, oldValue: any) => void) => {
    return watchProperty(propertyName, callback)
  }
}

defineExpose(expose)
</script>

<style scoped>
/* Main container style */
.alert-status {
  height: 100%;
  padding: 16px;
}

/* content area */
.content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

/* Field group style */
.field-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--card-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.field-label {
  font-size: 12px;
  color: var(--text-color-2);
  min-width: 40px;
  font-weight: 500;
}

.field-value {
  flex: 1;
  font-size: 13px;
  color: var(--text-color-1);
  padding: 4px 8px;
  background: var(--input-color);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  min-height: 20px;
  height: 120px;
  overflow: auto;
  word-break: break-all;
}

/* Debug information area */
.debug-info {
  margin: 16px 0;
  padding: 12px;
  background: var(--code-color);
  border-radius: 6px;
  font-size: 11px;
}

.debug-section {
  margin-bottom: 8px;
}

.debug-label {
  display: block;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.debug-value {
  background: var(--input-color);
  padding: 6px;
  border-radius: 3px;
  border: 1px solid var(--border-color);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 10px;
  line-height: 1.4;
  /* 🔥 Enhance scrolling display effect */
  max-height: 120px;
  overflow-y: auto;
  overflow-x: auto;
  color: var(--text-color-1);
  white-space: pre-wrap;
  word-break: break-all;
  /* 🔥 Beautify scroll bar */
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-color) transparent;
}

/* 🔥 WebKit Browser scroll bar beautification */
.debug-value::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.debug-value::-webkit-scrollbar-track {
  background: var(--fill-color-1);
  border-radius: 3px;
}

.debug-value::-webkit-scrollbar-thumb {
  background: var(--fill-color-3);
  border-radius: 3px;
  transition: background-color 0.2s;
}

.debug-value::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
}

/* 🔥 Scroll bar enhancement in focus state */
.debug-value:focus-within::-webkit-scrollbar-thumb {
  background: var(--primary-color-hover);
}

/* Operation button area */
.actions {
  display: flex;
  gap: 6px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.actions .n-button {
  flex: 1;
  min-width: 80px;
}

/* Responsive design */
@media (max-width: 480px) {
  .alert-status {
    padding: 12px;
  }

  .field-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .field-label {
    min-width: auto;
  }

  .field-value {
    width: 100%;
  }

  .actions {
    flex-direction: column;
  }
}
</style>
