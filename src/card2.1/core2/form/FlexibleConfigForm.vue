<template>
  <div class="flexible-config-form">
    <!-- mode indicator -->
    <div v-if="showModeIndicator" class="mode-indicator">
      <n-tag :type="getModeTagType()" size="small">
        {{ getModeLabel() }}
      </n-tag>
    </div>

    <!-- Automatic form builder -->
    <AutoFormGenerator
      v-model="configValues"
      :ts-config="tsConfig"
      :vue-config="vueConfig"
      :mode="detectedMode"
      :readonly="readonly"
      @change="handleConfigChange"
      @validate="handleValidate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NTag } from 'naive-ui'
import type { Component } from 'vue'
import AutoFormGenerator from '@/card2.1/core2/form/AutoFormGenerator.vue'
import type { TSConfig, ConfigMode, ConfigValues } from '@/card2.1/types/setting-config'

/**
 * Detect configuration mode
 * according to vueConfig and tsConfig Determine the configuration type by its existence
 */
function detectConfigMode(vueConfig?: Component, tsConfig?: TSConfig): ConfigMode {
  const hasVue = !!vueConfig
  const hasTS = !!tsConfig

  if (hasTS && hasVue) {
    return 'hybrid'
  } else if (hasTS) {
    return 'ts-only'
  } else if (hasVue) {
    return 'vue-only'
  } else {
    return 'vue-only' // Default is vue-only
  }
}

interface Props {
  // Component type（For automatic detection of configuration）
  componentType?: string

  // Pass configuration directly（Optional）
  tsConfig?: TSConfig
  vueConfig?: Component

  // Current configuration value
  modelValue?: ConfigValues

  // Is it read-only?
  readonly?: boolean

  // Whether to display the mode indicator
  showModeIndicator?: boolean
}

interface Emits {
  (event: 'update:modelValue', value: ConfigValues): void
  (event: 'change', value: ConfigValues): void
  (event: 'validate', result: { valid: boolean; errors: string[] }): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  readonly: false,
  showModeIndicator: false
})

const emit = defineEmits<Emits>()

// Responsive data
const configValues = ref<ConfigValues>({})
const tsConfig = ref<TSConfig>()
const vueConfig = ref<Component>()

// Configuration mode detected
const detectedMode = computed<ConfigMode>(() => {
  try {
    return detectConfigMode(vueConfig.value, tsConfig.value)
  } catch {
    return 'vue-only'
  }
})

// Schema tag type
const getModeTagType = () => {
  switch (detectedMode.value) {
    case 'ts-only':
      return 'info'
    case 'vue-only':
      return 'success'
    case 'hybrid':
      return 'warning'
    default:
      return 'default'
  }
}

// Mode label text
const getModeLabel = () => {
  switch (detectedMode.value) {
    case 'ts-only':
      return 'TSConfiguration'
    case 'vue-only':
      return 'VueConfiguration'
    case 'hybrid':
      return 'hybrid configuration'
    default:
      return 'Unknown mode'
  }
}

// Automatically detect component configuration
const detectComponentConfig = async () => {
  if (!props.componentType) return

  try {
    // Try dynamic importTSConfiguration
    try {
      // Use dynamic import，Supports any component type
      const tsConfigPath = `/src/card2.1/components/${props.componentType}/config.ts`
      const tsModule = await import(/* @vite-ignore */ tsConfigPath)

      if (tsModule.testComponentTSConfig || tsModule.default) {
        tsConfig.value = tsModule.testComponentTSConfig || tsModule.default
      }
    } catch (e) {}

    // Try dynamic importVueConfiguration
    try {
      const vueConfigPath = `/src/card2.1/components/${props.componentType}/config.vue`
      const vueModule = await import(/* @vite-ignore */ vueConfigPath)

      if (vueModule.default) {
        vueConfig.value = vueModule.default
      }
    } catch (e) {}
  } catch (error) {}
}

// Handle configuration changes
const handleConfigChange = (newValues: ConfigValues) => {
  configValues.value = { ...newValues }
  emit('update:modelValue', newValues)
  emit('change', newValues)
}

// Handle verification results
const handleValidate = (result: { valid: boolean; errors: string[] }) => {
  emit('validate', result)
}

// Monitor external value changes
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      configValues.value = { ...newValue }
    }
  },
  { immediate: true, deep: true }
)

// Monitor component type changes
watch(
  () => props.componentType,
  () => {
    detectComponentConfig()
  },
  { immediate: true }
)

// Listen for directly passed configuration
watch(
  () => [props.tsConfig, props.vueConfig],
  () => {
    if (props.tsConfig) tsConfig.value = props.tsConfig
    if (props.vueConfig) vueConfig.value = props.vueConfig
  },
  { immediate: true }
)

// Component mounting
onMounted(() => {
  // Set initial value
  if (props.modelValue) {
    configValues.value = { ...props.modelValue }
  }
})
</script>

<style scoped>
.flexible-config-form {
  width: 100%;
}

.mode-indicator {
  margin-bottom: 12px;
  text-align: right;
}
</style>
