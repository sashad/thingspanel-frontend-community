<template>
  <BaseRendererComponent
    :readonly="readonly"
    @ready="onRendererReady"
    @error="onRendererError"
    @node-select="onNodeSelect"
    @canvas-click="onCanvasClick"
  >
    <div class="gridstack-renderer" @click="onCanvasClick">
      <GridLayoutPlusWrapper
        v-if="stateManager.nodes"
        :graph-data="stateManager"
        :readonly="readonly || isPreviewMode"
        :show-widget-titles="showWidgetTitles"
        :static-grid="isPreviewMode"
        :grid-config="gridConfig"
        :multi-data-source-store="multiDataSourceStore"
        :multi-data-source-config-store="multiDataSourceConfigStore"
        @node-select="onNodeSelect"
        @request-settings="onRequestSettings"
      />
    </div>
  </BaseRendererComponent>
</template>

<script setup lang="ts">
/**
 * Gridstack renderer component
 * Migrated to new unified architecture
 */

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useEditorStore } from '@/store/modules/editor'
import { useWidgetStore } from '@/store/modules/widget'
import { globalPreviewMode } from '@/components/visual-editor/hooks/usePreviewMode'
import BaseRendererComponent from '@/components/visual-editor/renderers/base/BaseRendererComponent.vue'
import GridLayoutPlusWrapper from '@/components/visual-editor/renderers/gridstack/GridLayoutPlusWrapper.vue'
// Add configuration event listening
import { configEventBus, type ConfigChangeEvent } from '@/core/data-architecture/ConfigEventBus'
// Add data source to obtain directly
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
// Add configuration manager，For data source configuration updates
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'

const props = defineProps<{
  readonly?: boolean
  showWidgetTitles?: boolean
  gridConfig?: any
}>()

const emit = defineEmits(['ready', 'error', 'node-select', 'canvas-click', 'request-settings'])

// Use the original store
const editorStore = useEditorStore()
const widgetStore = useWidgetStore()

// For compatibility with old component interfaces，createstateManageradaptation
const stateManager = computed(() => ({
  nodes: editorStore.nodes || [],
  selectedIds: widgetStore.selectedNodeIds || [],
  viewport: editorStore.viewport || { zoom: 1, offsetX: 0, offsetY: 0 }
}))

// Select node method adaptation
const selectNode = (nodeId: string) => {
  if (nodeId) {
    widgetStore.selectNodes([nodeId])
  } else {
    widgetStore.selectNodes([])
  }
}

// Global preview mode
const { isPreviewMode } = globalPreviewMode

// Data source management - directly from data-architecture Get
const multiDataSourceStore = ref<Record<string, Record<string, any>>>({})
const multiDataSourceConfigStore = ref<Record<string, any>>({})

// Configure event listening - Let the renderer respond directly to configuration changes
let configChangeListener: ((event: ConfigChangeEvent) => void) | null = null

onMounted(() => {
  // Listen for configuration change events，Automatically update components
  configChangeListener = async (event: ConfigChangeEvent) => {
    // Process accordingly based on the type of configuration change
    if (event.section === 'base' || event.section === 'component') {
      // Basic configuration or component configuration changes，Need to update component status

      // critical fix：When basic configuration changes，Automatically update property bindings in data source configuration
      if (event.section === 'base' && event.newConfig) {
        await updateDataSourceConfigForBaseConfigChange(event.componentId, event.newConfig, event.oldConfig)
      }

      // critical fix：Ensure that component configuration changes trigger component re-rendering
      // By updating the componentpropertiesto trigger responsive updates
      const node = stateManager.nodes.find(n => n.id === event.componentId)
      if (node && event.newConfig) {
        // Update componentsproperties，Trigger re-rendering
        if (event.section === 'component' && event.newConfig.properties) {
          Object.assign(node.properties || {}, event.newConfig.properties)
        }
        // Force triggering of responsive updates
        editorStore.updateNode(event.componentId, { ...node })
      }
    } else if (event.section === 'dataSource') {
      // Data source configuration changes，pass directly data-architecture deal with

      try {
        // Build data requirements
        const requirement = {
          componentId: event.componentId,
          dataSources: event.newConfig ? [event.newConfig] : []
        }

        // pass directly simpleDataBridge Perform data acquisition
        const result = await simpleDataBridge.executeComponent(requirement)

        if (result.success && result.data) {
          // Update data source storage
          multiDataSourceStore.value[event.componentId] = result.data
          multiDataSourceConfigStore.value[event.componentId] = event.newConfig
        } else {
    if (import.meta.env.DEV) console.error(`⚠️ components ${event.componentId} Data acquisition failed:`, result.error)
        }
      } catch (error) {
    if (import.meta.env.DEV) console.error(`❌ components ${event.componentId} Data processing exception:`, error)
      }
    }
  }

  // repair：use the correctAPIRegister listener
  if (configEventBus && typeof configEventBus.onConfigChange === 'function') {
    const unsubscribe = configEventBus.onConfigChange('config-changed', configChangeListener)
    // Store unsubscribe function for cleanup
    ;(configChangeListener as any).__unsubscribe = unsubscribe
  }

  // Initialize data source data - Check the data of existing components
  initializeDataSources()
})

/**
 * Initialize data source data
 * For existing components from simpleDataBridge Get cached data
 */
const initializeDataSources = () => {
  const nodes = stateManager.nodes
  if (!nodes || !Array.isArray(nodes)) return

  nodes.forEach(node => {
    // try to start from simpleDataBridge Get cached data
    const cachedData = simpleDataBridge.getComponentData(node.id)
    if (cachedData) {
      multiDataSourceStore.value[node.id] = cachedData
    }
  })
}

/**
 * critical fix：Update property bindings in the data source configuration when the underlying configuration changes
 * whendeviceIdWaiting for basic configuration changes，Automatically update binding values ​​that depend on these fields in the data source configuration
 */
const updateDataSourceConfigForBaseConfigChange = async (
  componentId: string,
  newBaseConfig: any,
  oldBaseConfig: any
) => {
  try {
    // Get the complete configuration of the current component
    const fullConfig = configurationIntegrationBridge.getConfiguration(componentId)
    if (!fullConfig || !fullConfig.dataSource) {
      return
    }

    // Check if data source configuration needs to be updated
    let needsUpdate = false
    const updatedDataSourceConfig = JSON.parse(JSON.stringify(fullConfig.dataSource)) // deep clone

    // Check for key field changes in the base configuration
    const baseConfigFields = ['deviceId', 'metricsList']
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = []

    baseConfigFields.forEach(fieldName => {
      const newValue = newBaseConfig[fieldName]
      const oldValue = oldBaseConfig?.[fieldName]

      if (newValue !== oldValue) {
        changes.push({ field: fieldName, oldValue, newValue })
      }
    })

    if (changes.length === 0) {
      return
    }

    // repair：Recursively update property binding references in data source configuration，Supports multiple binding formats
    const updateBindingReferences = (obj: any, path: string = '') => {
      if (!obj || typeof obj !== 'object') return

      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key]
          const currentPath = path ? `${path}.${key}` : key

          if (typeof value === 'string') {
            // critical fix：Never replace the binding path！
            // string type value If the field contains the binding path，Explain that this is a binding relationship，
            // Bind path format must be maintained，cannot be replaced with actual value
            changes.forEach(({ field, newValue }) => {
              const bindingPattern = `${componentId}.base.${field}`
              if (value.includes(bindingPattern)) {
                // repair：Do not modify the binding path，Let the runtime parse dynamically
                // obj[key] = newValue // Remove this destructive operation
                // needsUpdate = true // No need to update，Because the binding path remains the same
              }
            })
          } else if (Array.isArray(value)) {
            // 2. Processing arrays（likepathParams）
            value.forEach((item, index) => {
              if (item && typeof item === 'object') {
                updateBindingReferences(item, `${currentPath}[${index}]`)
              }
            })
          } else if (typeof value === 'object') {
            // 3. examineHTTPWhether the parameter object uses component attribute binding
            if (value.selectedTemplate === 'component-property-binding' && value.valueMode === 'component') {
              changes.forEach(({ field, newValue }) => {
                // Check if bound to base configuration field
                // Smarter detection logic is needed here
                const isBaseConfigBinding = path.includes('pathParam') || path.includes('Param')
                if (isBaseConfigBinding && field === 'deviceId') {
                  // critical fix：Do not modifyvalue（binding path），Update onlydefaultValue
                  // valueFields must remain in bind path format：componentId.layer.propertyName
                  // Update onlydefaultValueas preview value，The binding path will be dynamically resolved during the actual request.
                  value.defaultValue = newValue
                  needsUpdate = true
                }
              })
            }
            // Continue recursively processing sub-objects
            updateBindingReferences(value, currentPath)
          }
        }
      }
    }

    updateBindingReferences(updatedDataSourceConfig)

    // If there is an update，Trigger data source configuration changes
    if (needsUpdate) {
      // passConfigurationIntegrationBridgeUpdate data source configuration，this will triggerConfigEventBusevent
      configurationIntegrationBridge.updateConfiguration(componentId, 'dataSource', updatedDataSourceConfig)
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error(`❌ [GridstackRenderer] Basic configuration change processing failed`, {
      componentId,
      error: error instanceof Error ? error.message : error
    })
  }
}

onUnmounted(() => {
  // repair：use the correctAPIClean up event listeners
  if (configChangeListener && (configChangeListener as any).__unsubscribe) {
    ;(configChangeListener as any).__unsubscribe()
  }
})

// --- Event Handlers to emit upwards to PanelEditor ---

const onRendererReady = () => {
  emit('ready')
}

const onRendererError = (error: Error) => {
  emit('error', error)
}

const onNodeSelect = (nodeId: string) => {
  emit('node-select', nodeId)
}

const onRequestSettings = (nodeId: string) => {
  emit('request-settings', nodeId)
}

const onCanvasClick = () => {
  selectNode('') // use the hook's method to clear selection
  emit('canvas-click')
}
</script>

<style scoped>
.gridstack-renderer {
  width: 100%;
  position: relative;
}
</style>
