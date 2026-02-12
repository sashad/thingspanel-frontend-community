<!--
  Configure component wrapper
  Support original configuration components to work normally in the new system，Provides compatible injection modes
-->

<script setup lang="ts">
import { ref, reactive, provide, watch, onMounted, onUnmounted, computed, nextTick, type Component } from 'vue'
import type { IConfigCtx } from '@/card2.1/core2/legacy'
import type { IComponentDefinition } from '@/card2.1/core2'
import { createLogger } from '@/utils/logger'
import { smartDeepClone } from '@/utils/deep-clone'

const logger = createLogger('ConfigWrapper')

// ====== Props definition ======
interface Props {
  // Component definition
  componentDefinition?: IComponentDefinition
  // Configure components（can be Vue component or async component）
  configComponent?: Component | (() => Promise<Component>)
  // Current configuration value
  modelValue?: Record<string, any>
  // Whether it is preview mode
  preview?: boolean
  // Whether to enable compatibility mode
  legacyMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  preview: false,
  legacyMode: true
})

// ====== Emits definition ======
interface Emits {
  'update:modelValue': [value: Record<string, any>]
  'config-change': [value: Record<string, any>]
  'validation-change': [isValid: boolean, errors: string[]]
  'component-loaded': [component: Component | null]
  'component-error': [error: string]
  'config-reset': [value: Record<string, any>]
}

const emit = defineEmits<Emits>()

// ====== Responsive state ======
const configRef = ref<Component>()
const isLoading = ref(false)
const error = ref<string | null>(null)
const loadedComponent = ref<Component | null>(null)

// Internal configuration status（Responsive）
const internalConfig = reactive<Record<string, any>>({ ...props.modelValue })

// Verification status
const validationErrors = ref<string[]>([])
const isValid = computed(() => validationErrors.value.length === 0)

// ====== Configuration context creation ======

// Create a compatible configuration context，For use by original configuration components
// Reference original config-ctx.vue implementation model
const configContext: IConfigCtx = {
  config: internalConfig,
  view: props.preview
}

// Provide configuration context to child components
provide('config-ctx', configContext)

// ====== Configuration component loading ======

/**
 * Load configuration components
 */
async function loadConfigComponent() {
  if (!props.configComponent) {
    logger.warn('No configuration components provided')
    return
  }

  isLoading.value = true
  error.value = null

  try {
    let component: Component

    // Handle asynchronous components
    if (typeof props.configComponent === 'function') {
      component = await props.configComponent()
      // deal with default export
      if (component && typeof component === 'object' && 'default' in component) {
        component = (component as any).default
      }
    } else {
      component = props.configComponent
    }

    loadedComponent.value = component
    emit('component-loaded', component)
    logger.info('Configuration component loaded successfully')
  } catch (err: any) {
    error.value = err.message || 'Configuration component loading failed'
    emit('component-error', error.value)
    logger.error('Configuration component loading failed:', err)
  } finally {
    isLoading.value = false
  }
}

// ====== Configuration value synchronization ======

// Monitor external configuration changes，Sync to internal state
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && typeof newValue === 'object') {
      // Avoid cyclic updates
      const currentStr = JSON.stringify(internalConfig)
      const newStr = JSON.stringify(newValue)
      if (currentStr !== newStr) {
        logger.debug('External configuration updates，Sync to internal:', newValue)
        // Clear existing configuration，and then reassign
        Object.keys(internalConfig).forEach(key => delete internalConfig[key])
        Object.assign(internalConfig, newValue)
      }
    }
  },
  { deep: true, immediate: true }
)

// Monitor internal configuration changes，pass outward（Reference original config-ctx.vue realization）
watch(
  internalConfig,
  newValue => {
    // Prevent cyclic updates
    const currentStr = JSON.stringify(newValue)
    const propsStr = JSON.stringify(props.modelValue)
    if (currentStr !== propsStr) {
      logger.debug('Internal configuration update，pass outward:', newValue)
      // 🔥 Use smart deep copy，Automatic processingVueReactive objects
      const clonedValue = smartDeepClone(newValue)
      emit('update:modelValue', clonedValue)
      emit('config-change', clonedValue)
    }
  },
  { deep: true }
)

// Monitor preview mode changes，update context
watch(
  () => props.preview,
  newPreview => {
    configContext.view = newPreview
  }
)

// ====== Default configuration processing ======

/**
 * Apply default configuration from component definition
 */
function applyDefaultConfig(force: boolean = false) {
  if (!props.componentDefinition?.properties) return

  const defaults: Record<string, any> = {}
  const overrides: Record<string, any> = {}

  Object.entries(props.componentDefinition.properties).forEach(([key, prop]) => {
    if (prop && typeof prop === 'object' && 'default' in prop) {
      const hasExistingValue =
        key in internalConfig && internalConfig[key] !== undefined && internalConfig[key] !== null

      if (force) {
        // Forced mode：override all values
        overrides[key] = prop.default
      } else if (!hasExistingValue) {
        // normal mode：Only set empty values
        defaults[key] = prop.default
      }
    }
  })

  // Apply defaults
  if (Object.keys(defaults).length > 0) {
    Object.assign(internalConfig, defaults)
    logger.info('Apply default configuration:', defaults)
  }

  // Apply force override value
  if (Object.keys(overrides).length > 0) {
    Object.assign(internalConfig, overrides)
    logger.info('Force application of default configuration:', overrides)
  }
}

/**
 * Smart merge configuration
 * Intelligently merge configurations based on priority and source of configuration items
 */
function smartMergeConfig(newConfig: Record<string, any>, source: 'user' | 'component' | 'system' = 'user') {
  if (!newConfig || typeof newConfig !== 'object') return

  const mergedConfig: Record<string, any> = {}

  Object.entries(newConfig).forEach(([key, value]) => {
    const prop = props.componentDefinition?.properties?.[key]
    const currentValue = internalConfig[key]

    // Determine whether the value should be updated
    let shouldUpdate = true

    if (prop && typeof prop === 'object') {
      // Check the update policy of configuration items
      const updateStrategy = prop.updateStrategy || 'replace'

      switch (updateStrategy) {
        case 'merge':
          // merge mode：Object types for deep merging
          if (typeof value === 'object' && typeof currentValue === 'object' && !Array.isArray(value)) {
            mergedConfig[key] = { ...currentValue, ...value }
          } else {
            mergedConfig[key] = value
          }
          break

        case 'append':
          // append mode：Array type to append
          if (Array.isArray(currentValue) && Array.isArray(value)) {
            mergedConfig[key] = [...currentValue, ...value]
          } else {
            mergedConfig[key] = value
          }
          break

        case 'preserve':
          // hold mode：If there is currently a value, do not update
          if (currentValue === undefined || currentValue === null) {
            mergedConfig[key] = value
          } else {
            shouldUpdate = false
          }
          break

        case 'replace':
        default:
          // replacement pattern：direct replacement
          mergedConfig[key] = value
          break
      }
    } else {
      // no attribute definition，direct replacement
      mergedConfig[key] = value
    }

    // Decide whether to update based on source and priority
    if (shouldUpdate && source === 'system') {
      // System-level configuration has the highest priority
      mergedConfig[key] = value
    } else if (shouldUpdate && source === 'component' && currentValue === undefined) {
      // Component level configuration is only applied if there is no value
      mergedConfig[key] = value
    } else if (shouldUpdate && source === 'user') {
      // User configuration has medium priority
      if (key in mergedConfig) {
        // Already in merge configuration，Use merged results
      } else {
        mergedConfig[key] = value
      }
    }
  })

  // Apply the merged configuration
  if (Object.keys(mergedConfig).length > 0) {
    Object.assign(internalConfig, mergedConfig)
    logger.info(`Smart merge configuration (${source}):`, mergedConfig)
  }
}

/**
 * Best time to check and apply default configuration
 */
function checkAndApplyDefaults() {
  // Check if it is loading for the first time
  const isFirstLoad = Object.keys(internalConfig).length === 0

  // Check if there are any component definition changes
  const hasComponentChanged = props.componentDefinition?.id !== lastComponentId.value

  if (isFirstLoad || hasComponentChanged) {
    // Apply default configuration when first loading or component changes
    applyDefaultConfig(isFirstLoad)
    lastComponentId.value = props.componentDefinition?.id || ''
  }
}

// Record the last componentID，Used to detect component changes
const lastComponentId = ref('')

// ====== Configuration verification ======

/**
 * Verify a single configuration item
 */
function validateConfigItem(key: string, value: any, prop: any): string[] {
  const errors: string[] = []
  const label = prop.label || key

  // Check required fields
  if (prop.required && (value === undefined || value === null || value === '')) {
    errors.push(`${label} is required`)
    return errors // Required field check failed，Skip other checks
  }

  // If the value is empty and not required，Skip other checks
  if (value === undefined || value === null || value === '') {
    return errors
  }

  // Check type
  if (prop.type) {
    const expectedType = prop.type
    const actualType = Array.isArray(value) ? 'array' : typeof value

    if (expectedType !== actualType) {
      // Special type conversion checks
      if (!(expectedType === 'number' && !isNaN(Number(value)))) {
        errors.push(`${label} type error，expect ${expectedType}，actual ${actualType}`)
        return errors // type error，Skip follow-up checks
      }
    }
  }

  // Range checking for numeric types
  if (typeof value === 'number' || (prop.type === 'number' && !isNaN(Number(value)))) {
    const numValue = typeof value === 'number' ? value : Number(value)

    if (prop.min !== undefined && numValue < prop.min) {
      errors.push(`${label} cannot be less than ${prop.min}`)
    }
    if (prop.max !== undefined && numValue > prop.max) {
      errors.push(`${label} cannot be greater than ${prop.max}`)
    }
    if (prop.step !== undefined && numValue % prop.step !== 0) {
      errors.push(`${label} must be ${prop.step} multiples of`)
    }
  }

  // String type check
  if (typeof value === 'string' || prop.type === 'string') {
    const strValue = String(value)

    if (prop.minLength !== undefined && strValue.length < prop.minLength) {
      errors.push(`${label} The length cannot be less than ${prop.minLength}`)
    }
    if (prop.maxLength !== undefined && strValue.length > prop.maxLength) {
      errors.push(`${label} The length cannot be greater than ${prop.maxLength}`)
    }
    if (prop.pattern && !new RegExp(prop.pattern).test(strValue)) {
      errors.push(`${label} Incorrect format`)
    }
  }

  // Array type check
  if (Array.isArray(value) || prop.type === 'array') {
    const arrValue = Array.isArray(value) ? value : []

    if (prop.minItems !== undefined && arrValue.length < prop.minItems) {
      errors.push(`${label} At least required ${prop.minItems} item`)
    }
    if (prop.maxItems !== undefined && arrValue.length > prop.maxItems) {
      errors.push(`${label} At most there can only be ${prop.maxItems} item`)
    }
  }

  // Enumeration value checking
  if (prop.enum && !prop.enum.includes(value)) {
    errors.push(`${label} Must be one of the following values: ${prop.enum.join(', ')}`)
  }

  // Custom validation function
  if (prop.validator && typeof prop.validator === 'function') {
    try {
      const result = prop.validator(value)
      if (result !== true) {
        errors.push(typeof result === 'string' ? result : `${label} Authentication failed`)
      }
    } catch (err: any) {
      errors.push(`${label} Verification error: ${err.message}`)
    }
  }

  return errors
}

/**
 * Verify current configuration
 */
function validateConfig() {
  const errors: string[] = []

  if (props.componentDefinition?.properties) {
    Object.entries(props.componentDefinition.properties).forEach(([key, prop]) => {
      if (prop && typeof prop === 'object') {
        const value = internalConfig[key]
        const itemErrors = validateConfigItem(key, value, prop)
        errors.push(...itemErrors)
      }
    })
  }

  // Custom configuration level validation
  if (props.componentDefinition?.validator && typeof props.componentDefinition.validator === 'function') {
    try {
      const result = props.componentDefinition.validator(internalConfig)
      if (result !== true) {
        errors.push(typeof result === 'string' ? result : 'Configuration verification failed')
      }
    } catch (err: any) {
      errors.push(`Configuration validation error: ${err.message}`)
    }
  }

  validationErrors.value = errors
  emit('validation-change', isValid.value, errors)
}

/**
 * Asynchronous verification configuration
 */
async function validateConfigAsync(): Promise<boolean> {
  validateConfig() // Perform sync verification first

  // If there is an async validator
  if (props.componentDefinition?.asyncValidator && typeof props.componentDefinition.asyncValidator === 'function') {
    try {
      const result = await props.componentDefinition.asyncValidator(internalConfig)
      if (result !== true) {
        const asyncError = typeof result === 'string' ? result : 'Asynchronous configuration verification failed'
        validationErrors.value = [...validationErrors.value, asyncError]
        emit('validation-change', false, validationErrors.value)
        return false
      }
    } catch (err: any) {
      const asyncError = `Asynchronous configuration validation error: ${err.message}`
      validationErrors.value = [...validationErrors.value, asyncError]
      emit('validation-change', false, validationErrors.value)
      return false
    }
  }

  return isValid.value
}

// Listen for configuration changes，trigger verification
watch(internalConfig, validateConfig, { deep: true })

// ====== Tool method ======

/**
 * Reset configuration to default
 */
function resetToDefaults() {
  // Clear current configuration
  Object.keys(internalConfig).forEach(key => {
    delete internalConfig[key]
  })

  // Reapply default configuration
  applyDefaultConfig()

  // Send reset event
  emit('config-reset', { ...internalConfig })

  logger.info('Configuration has been reset to default')
}

/**
 * Get configuration summary information
 */
function getConfigSummary() {
  return {
    total: Object.keys(internalConfig).length,
    hasErrors: !isValid.value,
    errorCount: validationErrors.value.length,
    hasDefaults: props.componentDefinition?.properties
      ? Object.keys(props.componentDefinition.properties).length > 0
      : false
  }
}

// ====== life cycle ======

onMounted(async () => {
  // Load configuration components
  await loadConfigComponent()

  // Check and apply default configuration（smart timing）
  checkAndApplyDefaults()

  // Initial verification
  await nextTick()
  validateConfig()
})

// Listen for component definition changes，Reapply default configuration
watch(
  () => props.componentDefinition,
  (newDefinition, oldDefinition) => {
    if (newDefinition?.id !== oldDefinition?.id) {
      logger.info('Component definition has changed，Reapply default configuration')
      checkAndApplyDefaults()
    }
  },
  { deep: true }
)

onUnmounted(() => {
  // Clean up resources
  loadedComponent.value = null
})

// ====== Methods exposed to the parent component ======
defineExpose({
  resetToDefaults,
  validateConfig,
  validateConfigAsync,
  getConfigSummary,
  isValid,
  validationErrors,
  validateConfigItem,
  applyDefaultConfig,
  smartMergeConfig,
  checkAndApplyDefaults
})
</script>

<template>
  <div class="config-wrapper">
    <!-- Loading status -->
    <div v-if="isLoading" class="config-loading">
      <n-spin size="medium">
        <template #description>{{ $t('common.loading') }}Configure components...</template>
      </n-spin>
    </div>

    <!-- error status -->
    <div v-else-if="error" class="config-error">
      <n-alert type="error" :title="$t('common.error')">
        {{ error }}
      </n-alert>
    </div>

    <!-- Configure component rendering -->
    <div v-else-if="loadedComponent" class="config-content">
      <!-- Verification error message -->
      <div v-if="!isValid && validationErrors.length > 0" class="config-validation-errors mb-4">
        <n-alert type="warning" :title="$t('common.validationErrors')">
          <ul class="mt-2">
            <li v-for="error in validationErrors" :key="error" class="text-sm">
              {{ error }}
            </li>
          </ul>
        </n-alert>
      </div>

      <!-- Configure component content -->
      <div class="config-component-wrapper">
        <component :is="loadedComponent" ref="configRef" v-bind="$attrs" />
      </div>

      <!-- debugging information（development environment） -->
      <div v-if="process.env.NODE_ENV === 'development'" class="config-debug mt-4">
        <n-collapse>
          <n-collapse-item title="debugging information" name="debug">
            <div class="space-y-2 text-xs">
              <div>
                <strong>componentsID:</strong>
                {{ componentDefinition?.id }}
              </div>
              <div>
                <strong>Number of configuration items:</strong>
                {{ Object.keys(internalConfig).length }}
              </div>
              <div>
                <strong>Verification status:</strong>
                {{ isValid ? 'pass' : 'fail' }}
              </div>
              <div>
                <strong>number of errors:</strong>
                {{ validationErrors.length }}
              </div>
              <div>
                <strong>preview mode:</strong>
                {{ preview ? 'yes' : 'no' }}
              </div>
              <div>
                <strong>Compatibility mode:</strong>
                {{ legacyMode ? 'yes' : 'no' }}
              </div>

              <n-divider />

              <div><strong>Current configuration:</strong></div>
              <pre class="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">{{
                JSON.stringify(internalConfig, null, 2)
              }}</pre>
            </div>
          </n-collapse-item>
        </n-collapse>
      </div>
    </div>

    <!-- No configuration components -->
    <div v-else class="config-empty">
      <n-empty description="This component has no configurable options" />
    </div>
  </div>
</template>

<style scoped>
.config-wrapper {
  @apply w-full;
}

.config-loading {
  @apply flex items-center justify-center py-8;
}

.config-error {
  @apply py-4;
}

.config-content {
  @apply space-y-4;
}

.config-component-wrapper {
  @apply w-full;
}

.config-validation-errors {
  @apply border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-900/20;
}

.config-empty {
  @apply py-8 text-center text-gray-500;
}

.config-debug {
  @apply border-t border-gray-200 pt-4;
}

/* Deep style override，Make sure internal components are styled correctly */
:deep(.n-form) {
  @apply w-full;
}

:deep(.n-form-item) {
  @apply mb-4;
}

:deep(.n-form-item-label) {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

:deep(.n-input),
:deep(.n-select),
:deep(.n-slider),
:deep(.n-color-picker) {
  @apply w-full;
}
</style>
