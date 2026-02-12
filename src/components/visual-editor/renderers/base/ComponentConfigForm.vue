<template>
  <div class="component-config-form">

    <!-- Card2.1Component configuration -->
    <div v-if="isCard2Component && card2ConfigComponent">
      <component
        :is="card2ConfigComponent"
        v-model="componentConfig"
        :widget="widget"
        :config="componentConfig"
        :readonly="readonly"
        @update:modelValue="handleConfigUpdate"
        @change="handleConfigUpdate"
      />
    </div>

    <!-- Card2Component but no configuration component -->
    <div v-else-if="isCard2Component && !card2ConfigComponent">
      <div
        style="
          border: 2px solid orange;
          padding: 16px;
          margin: 16px 0;
          background: #fff8e1;
          border-radius: 6px;
          text-align: center;
        "
      >
        <h3 style="color: #f57c00; margin: 0 0 8px 0">🔧 Card2Component configuration</h3>
        <p style="margin: 0; font-size: 14px; color: #666">Component type: {{ widget?.type || 'unknown' }}</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #999">ShouldCard2There is currently no configuration form for the component</p>
      </div>
    </div>

    <!-- Traditional component configuration -->
    <div v-else-if="!isCard2Component">
      <div
        style="
          border: 2px solid #ccc;
          padding: 16px;
          margin: 16px 0;
          background: #f9f9f9;
          border-radius: 6px;
          text-align: center;
        "
      >
        <h3 style="color: #666; margin: 0 0 8px 0">📦 Traditional component configuration</h3>
        <p style="margin: 0; font-size: 14px; color: #888">Component type: {{ widget?.type || 'unknown' }}</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #999">The traditional component configuration function needs to be implemented</p>
      </div>
    </div>

    <!-- Development mode debuggingtip -->
    <div v-if="isDevelopment" class="debug-tip">
      <n-tooltip>
        <template #trigger>
          <span class="debug-icon">🐛</span>
        </template>
        <div>
          <div>type: {{ widget?.type }}</div>
          <div>Card2.1: {{ isCard2Component ? 'yes' : 'no' }}</div>
          <div>Have configuration: {{ !!card2ConfigComponent ? 'yes' : 'no' }}</div>
          <div style="margin-top: 8px;">
            <n-button size="tiny" @click="logToConsole">console output</n-button>
          </div>
        </div>
      </n-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Component specific configuration form - rewritten version
 * Location：src/components/visual-editor/renderers/base/ComponentConfigForm.vue
 * Responsible for handling the specific configuration of each component，supportCard2.1Independent configuration of components
 */

import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import {
  NTooltip,
  NButton,
  useMessage
} from 'naive-ui'
import { useComponentTree as useCard2Integration } from '@/card2.1/hooks/useComponentTree'

interface Props {
  widget?: any
  readonly?: boolean
}

interface Emits {
  (e: 'validate', isValid: boolean): void
  (e: 'update', config: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Card2integratedhook
const card2Integration = useCard2Integration({ autoInit: true })

// Development environment judgment
const isDevelopment = computed(() => import.meta.env.DEV)

/**
 * Determine whether it isCard2.1components
 */
const isCard2Component = computed(() => {
  return props.widget?.metadata?.isCard2Component === true
})

/**
 * GetCard2Component configuration component
 */
const card2ConfigComponent = computed(() => {
  if (!isCard2Component.value || !props.widget?.type) {
    return null
  }

  try {
    // 🔥 Prioritize fromwidget.metadata.card2DefinitionGet configuration components
    const card2Definition = props.widget?.metadata?.card2Definition
    if (card2Definition?.configComponent) {
      return card2Definition.configComponent
    }

    // passCard2integratedhookGet component definition（fromfilteredComponentsSearch in）
    const componentDefinition = card2Integration.filteredComponents.value.find(
      comp => comp.type === props.widget.type
    )

    // Prioritize the use of component-customized configuration components
    if (componentDefinition?.configComponent) {
      return componentDefinition.configComponent
    }

    // If the component has configuration properties but no custom configuration component，Use the common configuration form
    const hasProperties =
      componentDefinition?.config?.properties &&
      Object.keys(componentDefinition.config.properties).length > 0

    if (hasProperties) {
      // return genericCard2Configuration form（useFlexibleConfigForm）
      return () => import('@/card2.1/core2/form/FlexibleConfigForm.vue')
    }

    return null
  } catch (error) {
    console.error('❌ [ComponentConfigForm] Error getting configuration component', error)
    return null
  }
})

/**
 * 🔥 Unified configuration center：Get component configuration from configuration manager
 */
const getComponentConfig = (): any => {
  if (!props.widget) return {}

  if (props.widget?.metadata?.isCard2Component) {
    // 🔥 Card2components：Get configuration from configuration manager
    const nodeId = props.widget.id

    // 🔥 Get configuration asynchronously，Avoid module import issues
    import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
      .then(({ configurationIntegrationBridge }) => {
        const fullConfig = configurationIntegrationBridge.getConfiguration(nodeId)
        if (fullConfig?.component) {
          componentConfig.value = fullConfig.component
        }
      })
      .catch(error => {
        console.warn(`⚠️ [ComponentConfigForm] Failed to get configuration:`, error)
      })

    // 🔥 Return default configuration as initial value
    const card2Definition = props.widget?.metadata?.card2Definition
    const defaultConfig = card2Definition?.defaultConfig?.customize || {}
    return defaultConfig
  } else {
    // traditional components：frompropertiesGet
    return props.widget?.properties || {}
  }
}

/**
 * Component configuration data
 */
const componentConfig = ref<any>(getComponentConfig())

// 🔥 New：User edit status tag
const isUserEditing = ref(false)

/**
 * 🔥 Unified configuration center：Configuration update handling - Fix configuration merge and duplicate update issues
 */
const handleConfigUpdate = (newConfig: any) => {

  // 🔥 Flag user is editing，Prevent external updates from overwriting
  isUserEditing.value = true

  // 🔥 repair：Complete merge configuration，Avoid overwriting other fields
  const mergedConfig = {
    ...componentConfig.value,
    ...newConfig
  }

  // Update local configuration
  componentConfig.value = mergedConfig

  // 🔥 Unified configuration center：Save complete configuration directly through Configuration Manager
  if (props.widget?.metadata?.isCard2Component && props.widget?.id) {
    const nodeId = props.widget.id

    // 🔥 repair：Use dynamicsimport，avoidrequireReport an error
    import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
      .then(({ configurationIntegrationBridge }) => {
        configurationIntegrationBridge.updateConfiguration(
          nodeId,
          'component',
          mergedConfig, // 🔥 Save complete configuration，Not a partial configuration
          props.widget.type
        )
      })
      .catch(error => {
        console.error(`❌ [ComponentConfigForm] Failed to save configuration:`, error)
      })
  } else {
    // traditional components：direct updateproperties
    if (props.widget?.properties) {
      Object.assign(props.widget.properties, mergedConfig)
    }
  }

  // notification editor
  emit('update', mergedConfig)

  // 🔥 Delayed reset of edit state，Give the configuration enough time to save
  setTimeout(() => {
    isUserEditing.value = false
  }, 500)
}

/**
 * 🔥 monitorCard2Configuration change event，Real-time synchronization configuration panel display
 */
const handleCard2ConfigUpdate = (event: CustomEvent) => {
  const { componentId, layer, config } = event.detail
  if (componentId === props.widget?.id && layer === 'component') {
    // 🔥 repair：Only updates if someone other than the user is editing
    if (!isUserEditing.value) {
      // 🔥 critical fix：Completely replace configuration，instead of merging，Ensure configuration panels are fully synchronized
      componentConfig.value = { ...config }  // Completely use new configuration
    } else {
    }
  }
}

// 🔥 Listen for configuration update events（Remove scheduled sync，Avoid overwriting user input）
onMounted(() => {
  window.addEventListener('card2-config-update', handleCard2ConfigUpdate as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('card2-config-update', handleCard2ConfigUpdate as EventListener)
})

/**
 * monitorwidgetchange，Retrieve configuration
 */
watch(
  () => props.widget?.id,
  (newId) => {
    if (newId) {
      const newConfig = getComponentConfig()
      componentConfig.value = newConfig
    }
  },
  { immediate: true }
)

// ============ Debugging method ============

/**
 * Output debugging information to the console
 */
const logToConsole = () => {
  console.group('🔍 [ComponentConfigForm] debugging information')
  console.groupEnd()
}
</script>

<style scoped>
.component-config-form {
  /* Takes up the entire configuration panel */
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  position: relative;
}

/* Card2Component configuration area */
.component-config-form > div {
  flex: 1;
  height: 100%;
  overflow-y: auto;
}

/* Ensure that dynamic components can be displayed normally and occupy full space */
:deep(.simple-test-config) {
  border: none;
  padding: 0;
  height: 100%;
}

/* Ensure legacy component tooltips are centered */
.component-config-form > div[style*='border: 2px solid'] {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

/* debugtipstyle */
.debug-tip {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.debug-icon {
  font-size: 16px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.debug-icon:hover {
  opacity: 1;
}
</style>