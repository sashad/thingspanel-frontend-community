<template>
  <div
    ref="containerRef"
    :data-component-id="props.nodeId"
    class="card2-wrapper"
    @click="handleWrapperClick"
    @contextmenu="handleContextMenu"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <!-- 🔥 Component rendering - Based on unified configuration architecture -->
    <component
      v-if="currentComponentDef?.component"
      :is="currentComponentDef.component"
      ref="currentComponentRef"
      :config="displayData"
      :data="componentDataFromWarehouse"
      :component-id="props.nodeId"
      class="card2-component"
    />

    <!-- 🔥 First level debugging：Card2Wrapper Data passed to the component -->
    <div v-if="props.componentType === 'digit-indicator'" class="card2-wrapper-debug">
      <div class="debug-title">🔥 Card2Wrapper data transfer（first level）:</div>
      <div class="debug-content">
        <div>passed to the component data: {{ JSON.stringify(componentDataFromWarehouse) }}</div>
        <div>Timestamp: {{ new Date().toLocaleTimeString() }}</div>
      </div>
    </div>

    <!-- Component loading failure prompt -->
    <n-alert v-else-if="!currentComponentDef?.component" type="error" size="small">
      components {{ props.componentType }} Not found or failed to load
    </n-alert>
  </div>
</template>

<script setup lang="ts">
/**
 * 🔥 Card2Wrapper - Unified configuration architecture version
 * Based on the new unified configuration architecture，Implement complete configuration management
 */

import { ref, onMounted, onUnmounted, computed, inject, nextTick, watch } from 'vue'
import { NAlert } from 'naive-ui'
import { useComponentTree as useCard2Integration } from '@/card2.1/hooks/useComponentTree'
import { useCard2Props } from '@/card2.1/hooks/useCard2Props'
import { usePreviewMode } from '@/components/visual-editor/hooks/usePreviewMode'
// 🔥 Import loop protection manager
import { loopProtectionManager } from '@/utils/LoopProtectionManager'
import type {
  InteractionConfig,
  InteractionEventType,
  InteractionResponse,
  ComponentInteractionCapability
} from '@/card2.1/core2/interaction'
import type { UnifiedCard2Configuration } from '@/card2.1/hooks/useCard2Props'
// 🔥 importDataWarehouseTo obtain the data source execution results（Compatibility preserved）
import { dataWarehouse } from '@/core/data-architecture/DataWarehouse'
// 🔥 Import configuration managers and data bridges
import { configurationIntegrationBridge as configurationManager } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
// 🔥 Import interactive configuration router
import { interactionConfigRouter } from '@/components/visual-editor/configuration/InteractionConfigRouter'

// 🚀 New：importCard2.1 CoreResponsive data binding system
import { dataBindingManager } from '@/card2.1/core2/data-source'
import { reactiveDataManager } from '@/card2.1/core2/data-source'
import { componentRegistry } from '@/card2.1/core2/registry'
import { dataSourceMapper } from '@/card2.1/core2/data-source'
import type { ComponentDataBinding, DataBindingStatus } from '@/card2.1/core2/data-source'

interface Props {
  componentType: string
  config?: any
  data?: any
  nodeId: string
  previewMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  previewMode: false
})

// base reference
const currentComponentRef = ref<any>(null)
const containerRef = ref<HTMLElement | null>(null)

// Get component definition
const { filteredComponents } = useCard2Integration()
const currentComponentDef = computed(() => {
  const found = filteredComponents.value?.find((comp: any) => comp.type === props.componentType)

  // 🔥 repair：If the component is not found and the component list is empty，Wait for system initialization
  if (!found && filteredComponents.value.length === 0 && props.componentType) {
    // Removed：consolestatement
  }

  return found
})

// Inject editor context
const editorContext = inject('editorContext', null) as any

// 🔥 Inject component executor registry
const componentExecutorRegistry = inject('componentExecutorRegistry', null) as Map<string, () => Promise<void>> | null

// 🔥 Preview mode detection
const { isPreviewMode } = usePreviewMode()

// 🚀 Card2.1 CoreReactive data binding state
const card2CoreDataBinding = ref<string | null>(null)
const card2CoreBindingStatus = ref<DataBindingStatus>({})
const card2CoreData = ref<Record<string, any>>({})
const useCard2CoreDataBinding = ref(false)

// 🚀 Check if the component supportsCard2.1 Coredata binding
const checkCard2CoreSupport = () => {
  const isRegistered = componentRegistry.has(props.componentType)
  const dataSourceKeys = componentRegistry.getDataSourceKeys(props.componentType)
  const supportsDataBinding = isRegistered && dataSourceKeys.length > 0

  // Removed：consolestatement

  useCard2CoreDataBinding.value = supportsDataBinding
  return supportsDataBinding
}

// 🚀 initializationCard2.1 Coredata binding
const initializeCard2CoreBinding = async () => {
  if (!useCard2CoreDataBinding.value) {
    // Removed：consolestatement
    return
  }

  try {
    // Removed：consolestatement

    // Create component data binding configuration
    const bindingConfig: ComponentDataBinding = {
      componentId: props.nodeId,
      dataSourceId: `${props.nodeId}-datasource`, // Temporary data sourceID
      bindingConfig: {
        // Automatically generate binding configurations based on component definitions
        ...generateBindingConfig()
      }
    }

    // Create binding
    const bindingId = dataBindingManager.createBinding(bindingConfig)
    card2CoreDataBinding.value = bindingId

    // Subscribe to data updates
    dataBindingManager.subscribe(bindingId, (newData) => {
      card2CoreData.value = newData

      // 🔥 Update binding status
      const status = dataBindingManager.getBindingStatus(bindingId)
      if (status) {
        card2CoreBindingStatus.value = status
      }
    })

    // Removed：consolestatement
  } catch (error) {
    // Removed：consolestatement
  }
}

// 🚀 Generate binding configuration
const generateBindingConfig = () => {
  const dataSourceKeys = componentRegistry.getDataSourceKeys(props.componentType)
  const bindingConfig: Record<string, any> = {}

  dataSourceKeys.forEach(key => {
    bindingConfig[key] = {
      dataPath: key,
      fallbackValue: null
    }
  })

  // Removed：consolestatement
  return bindingConfig
}

// 🚀 clean upCard2.1 Corebinding
const cleanupCard2CoreBinding = () => {
  if (card2CoreDataBinding.value) {
    dataBindingManager.removeBinding(card2CoreDataBinding.value)
    card2CoreDataBinding.value = null
    card2CoreData.value = {}
    card2CoreBindingStatus.value = {}
    // Removed：consolestatement
  }
}

// 🔥 critical fix：Performance-optimized data source acquisition - solve200+Frequent calculation problem of components
let lastDataHash = ''
let cachedWarehouseData = {}
let dataFetchDebounce: NodeJS.Timeout | null = null

// 🔥 How to force clear cache
const clearDataCache = () => {
  lastDataHash = ''
  cachedWarehouseData = {}
  // Removed：consolestatement
}

const componentDataFromWarehouse = computed(() => {
  // Removed：consolestatement

  try {
    // 🚀 priority useCard2.1 CoreReactive data binding
    if (useCard2CoreDataBinding.value && Object.keys(card2CoreData.value).length > 0) {
      // Removed：consolestatement
      return card2CoreData.value
    }

    // 🚨 **critical fix**：Directly bypassDataWarehouseresponsive，Get latest data manually
    // Removed：consolestatement

    // Force clear cache，Make sure you get the latest data
    dataWarehouse.clearComponentMergedCache(props.nodeId)

    // call directlyDataWarehouseGet data，Bypassing reactive dependency issues
    const latestData = dataWarehouse.getComponentData(props.nodeId)

    // Removed：consolestatement

    return latestData || {}
  } catch (error) {
    // Removed：consolestatement
    return {}
  }
})

// 🔥 core：Use unified configuration management
const {
  config: componentConfig,
  displayData,
  unifiedConfig,
  updateConfig,
  updateUnifiedConfig,
  getFullConfiguration,
  setConfigChangeCallback,
  syncToEditor
} = useCard2Props({
  config: props.config || {},
  data: componentDataFromWarehouse, // 🔥 critical fix：Passing reactive computed properties，instead of a static value
  componentId: props.nodeId,
  initialUnifiedConfig: getInitialUnifiedConfig()
})

/**
 * Get initial unified configuration
 * Get an existing configuration from the editor context or other source
 */
function getInitialUnifiedConfig() {
  try {
    if (editorContext?.getNodeById) {
      const node = editorContext.getNodeById(props.nodeId)
      if (node?.metadata?.unifiedConfig) {
        return node.metadata.unifiedConfig
      }
    }
  } catch (error) {
    // Removed：consolestatement
  }
  return undefined
}

// Removed：consolestatement

// Configuration change callback
setConfigChangeCallback((config) => {
  // Removed：consolestatement
})

// ================== Interactive system integration ==================

// 🔥 Unified configuration center：Interaction configuration is based on unifiedConfig
const interactionConfigs = computed<InteractionConfig[]>(() => {
  return unifiedConfig.value.interaction?.configs || []
})

// 🔥 Unified configuration center：The data source configuration is based on unifiedConfig
const dataSourceConfig = computed(() => {
  return unifiedConfig.value.dataSource || {}
})

// Get the interactive capabilities of a component
const componentInteractionCapability = computed<ComponentInteractionCapability | undefined>(() => {
  return currentComponentDef.value?.interactionCapabilities
})

// 🔥 Field level mapping function：Determine which configuration layer the field should be updated to
const isBaseLayerField = (field: string): boolean => {
  // baselayer field：Device binding、UIBasic configuration
  const baseFields = [
    'deviceId', 'metricsList', // Device binding fields
    'title', 'showTitle', 'visible', 'opacity', // UIBasic fields
    'backgroundColor', 'borderWidth', 'borderColor', 'borderStyle', 'borderRadius',
    'padding', 'margin'
  ]
  return baseFields.includes(field)
}

const isDataSourceLayerField = (field: string): boolean => {
  // dataSourcelayer field：Data binding configuration
  const dataSourceFields = [
    'dataSourceConfig', 'fieldMappings', 'refreshInterval', 'autoRefresh'
  ]
  return dataSourceFields.includes(field)
}

const isInteractionLayerField = (field: string): boolean => {
  // interactionlayer field：Interactive configuration
  const interactionFields = [
    'interactions', 'clickActions', 'hoverActions', 'eventHandlers'
  ]
  return interactionFields.includes(field)
}

// 🔥 Execute interactive responses in batches - Solve the problem of mutual overwriting of multiple attribute modifications
const executeBatchedInteractionResponses = async (responses: InteractionResponse[]) => {
  // Removed：consolestatement

  // by componentIDand action type group responses
  const groupedResponses = {
    self: { modify: [] as InteractionResponse[], other: [] as InteractionResponse[] },
    cross: new Map<string, InteractionResponse[]>(),  // componentId -> responses
    nonModify: [] as InteractionResponse[]  // Non-modification actions such as jumps
  }

  // Classify all responses
  for (const response of responses) {
    if (response.action === 'modify' || response.action === 'modifyProperty' || response.action === 'updateComponentData') {
      if (response.modifyConfig) {
        const { targetComponentId } = response.modifyConfig

        if (targetComponentId === props.nodeId) {
          // modify yourself
          groupedResponses.self.modify.push(response)
        } else {
          // Modify other components
          if (!groupedResponses.cross.has(targetComponentId)) {
            groupedResponses.cross.set(targetComponentId, [])
          }
          groupedResponses.cross.get(targetComponentId)!.push(response)
        }
      }
    } else {
      // non-modifying action（Jump etc.）
      groupedResponses.nonModify.push(response)
    }
  }

  // Removed：consolestatement

  // 🔥 critical fix1：Batch processing of self-component property modifications
  if (groupedResponses.self.modify.length > 0) {
    const batchedSelfUpdates = {}

    groupedResponses.self.modify.forEach(response => {
      if (response.modifyConfig) {
        const { targetProperty, updateValue } = response.modifyConfig
        batchedSelfUpdates[targetProperty] = updateValue
        // Removed：consolestatement
      }
    })

    // Removed：consolestatement

    // 🔥 Restore original logic：For modifying self-components updateConfig，Stay in sync with configuration forms
    updateConfig('component', batchedSelfUpdates)
    // Removed：consolestatement
  }

  // 🔥 critical fix2：Batch processing of cross-component property modifications
  for (const [targetComponentId, targetResponses] of groupedResponses.cross.entries()) {
    // 🔥 Tiered collection configuration updates - Assigned to different configuration layers based on field characteristics
    const layeredUpdates = {
      base: {},        // Basic configuration such as device binding
      component: {},   // Component specific properties
      dataSource: {}, // Data source configuration
      interaction: {} // Interactive configuration
    }

    targetResponses.forEach(response => {
      if (response.modifyConfig) {
        const { targetProperty, updateValue } = response.modifyConfig

        // 🔥 Processing field names with hierarchical prefixes（like "base.deviceId"）
        let actualProperty = targetProperty
        let targetLayer = 'component' // Default level

        if (targetProperty.includes('.')) {
          const [layerPrefix, fieldName] = targetProperty.split('.')
          actualProperty = fieldName
          targetLayer = layerPrefix
    // Removed：consolestatement
        } else {
          // 🔥 Field level mapping：Determine which configuration layer should be updated based on the field name
          if (isBaseLayerField(targetProperty)) {
            targetLayer = 'base'
          } else if (isDataSourceLayerField(targetProperty)) {
            targetLayer = 'dataSource'
          } else if (isInteractionLayerField(targetProperty)) {
            targetLayer = 'interaction'
          }
        }

        // Collect updates based on target level
        layeredUpdates[targetLayer][actualProperty] = updateValue
    // Removed：consolestatement
      }
    })

    // Removed：consolestatement

    try {
      // 🔥 Hierarchical batch update：Updated separately by configuration level
      for (const [layer, updates] of Object.entries(layeredUpdates)) {
        if (Object.keys(updates).length > 0) {
    // Removed：consolestatement
          configurationManager.updateConfigurationForInteraction(
            targetComponentId,
            layer as keyof UnifiedCard2Configuration,
            updates,
            'cross-component-interaction'
          )
        }
      }
    // Removed：consolestatement
    } catch (error) {
    // Removed：consolestatement
    }
  }

  // Handle non-modification actions（Jump etc.）
  for (const response of groupedResponses.nonModify) {
    const delay = response.delay || 0
    setTimeout(() => {
      executeInteractionResponse(response)
    }, delay)
  }
}

// interactive event executor（Handle non-attribute modification actions）
const executeInteractionResponse = async (response: InteractionResponse) => {
    // Removed：consolestatement

  try {
    switch (response.action) {
      case 'navigateToUrl':
      case 'jump':
    // Removed：consolestatement
        // Support multipleURLData format
        let url = response.jumpConfig?.url || response.value || response.url
        let target = response.jumpConfig?.target || response.target || '_self'

        if (url) {
    // Removed：consolestatement
          if (target === '_self') {
            window.location.href = url
          } else {
            window.open(url, target)
          }
        } else {
    // Removed：consolestatement
        }
        break

      case 'updateComponentData':
      case 'modifyProperty':
      case 'modify':
        // 🔥 Repair instructions：Property modifications are now made by executeBatchedInteractionResponses Batch processing
    // Removed：consolestatement
        break

      case 'changeVisibility':
        // change visibility
        if (containerRef.value) {
          containerRef.value.style.visibility = response.value === 'visible' ? 'visible' : 'hidden'
        }
        break

      case 'changeBackgroundColor':
        // Change background color
        if (containerRef.value) {
          containerRef.value.style.backgroundColor = response.value
        }
        break

      case 'triggerAnimation':
        // trigger animation
        if (containerRef.value && response.value) {
          containerRef.value.style.animation = `${response.value} ${response.duration || 300}ms ease`
          setTimeout(() => {
            if (containerRef.value) {
              containerRef.value.style.animation = ''
            }
          }, response.duration || 300)
        }
        break

      default:
    // Removed：consolestatement
    }
  } catch (error) {
    // Removed：consolestatement
  }
}

// Universal interaction event handler
const handleInteractionEvent = async (eventType: InteractionEventType, event?: Event) => {
  // 🔥 critical fix：Disable interaction in edit mode，Avoid conflicts with editing operations
  if (!isPreviewMode.value) {
    // Removed：consolestatement
    return // No interaction is performed in edit mode
  }

  if (!componentInteractionCapability.value?.supportedEvents.includes(eventType)) {
    // Removed：consolestatement
    return // The component does not support this event type
  }

    // Removed：consolestatement

  // Execute matching interaction configuration
  const matchingConfigs = interactionConfigs.value.filter(config =>
    config.event === eventType && config.enabled !== false
  )

    // Removed：consolestatement

  // 🔥 critical fix：All matching configuredresponsesmerge，Avoid multiple configurations overwriting each other
  const allResponses: InteractionResponse[] = []
  for (const config of matchingConfigs) {
    // Removed：consolestatement
    allResponses.push(...config.responses)
  }

    // Removed：consolestatement

  // Batch all responses at once，Avoid configurations overwriting each other
  if (allResponses.length > 0) {
    await executeBatchedInteractionResponses(allResponses)
  }
}

// ================== event handling ==================

const handleWrapperClick = async (event: MouseEvent) => {
    // Removed：consolestatement

  // Perform interactive responses（There is already a preview mode check internally）
  await handleInteractionEvent('click', event)

  // Original preview mode logic remains compatible
  if (!props.previewMode) return
}

const handleContextMenu = (event: MouseEvent) => {
    // Removed：consolestatement
  event.preventDefault() // Block default right-click menu
}

// Added interactive event handler function
const handleMouseEnter = async (event: MouseEvent) => {
    // Removed：consolestatement
  await handleInteractionEvent('hover', event)
}

const handleMouseLeave = (event: MouseEvent) => {
    // Removed：consolestatement
  // hoverThe departure of an event can trigger some reset operations
}

const handleFocus = async (event: FocusEvent) => {
    // Removed：consolestatement
  await handleInteractionEvent('focus', event)
}

const handleBlur = async (event: FocusEvent) => {
    // Removed：consolestatement
  await handleInteractionEvent('blur', event)
}

// 🔥 Listen for configuration update events from the editor layer
const handleConfigUpdateEvent = (event: CustomEvent) => {
  const { componentId, layer, config } = event.detail
  if (componentId === props.nodeId) {
    // Removed：consolestatement

    if (layer === 'interaction') {
    // Removed：consolestatement

      // 🔥 Unified configuration center：passupdateConfigUpdate interaction configuration
      if (config?.configs) {
        updateConfig('interaction', { configs: config.configs })
      }
    } else {
      // Non-interactive configuration is processed normally
      updateConfig(layer, config)
    }

    // Removed：consolestatement
  }
}

// 🔥 Respond to configuration request events
const handleConfigRequestEvent = (event: CustomEvent) => {
  const { componentId, layer } = event.detail
  if (componentId === props.nodeId) {
    // Removed：consolestatement

    const fullConfig = getFullConfiguration()
    const requestedConfig = layer ? fullConfig[layer] : fullConfig

    // Send configuration response event
    window.dispatchEvent(new CustomEvent('card2-config-response', {
      detail: {
        componentId,
        layer,
        config: requestedConfig
      }
    }))
  }
}

// ================== Interactive configuration management ==================

// Update interaction configuration
const updateInteractionConfigs = (configs: InteractionConfig[]) => {
    // Removed：consolestatement

    // Removed：consolestatement

  // 🔥 Unified configuration center：pass directlyupdateConfigrenew，Computed properties automatically respond to
  updateConfig('interaction', { configs })

    // Removed：consolestatement
}

// Get interaction configuration
const getInteractionConfigs = (): InteractionConfig[] => {
  return interactionConfigs.value
}

// Get component interaction capabilities
const getInteractionCapability = (): ComponentInteractionCapability | undefined => {
  return componentInteractionCapability.value
}

// ================== Property change monitoring system ==================

// Store the last attribute value，used to detect changes
const previousValues = ref<Record<string, any>>({})

// monitordisplayDatachange，Detect property change events
watch(
  () => displayData.value,
  (newDisplayData, oldDisplayData) => {
    if (!isPreviewMode.value) {
      // Property change events are not processed in edit mode
      return
    }

    // Removed：consolestatement

    // Check eachdataChangeInteractive configuration
    const dataChangeConfigs = interactionConfigs.value.filter(config =>
      config.event === 'dataChange' && config.enabled !== false
    )

    // Removed：consolestatement

    // 🔥 critical fix：Collect all triggereddataChangeresponse，Perform batch processing
    const triggeredResponses: InteractionResponse[] = []

    for (const config of dataChangeConfigs) {
      // 🔥 repair：dataChangeThe listening properties of the event are stored inconfig.watchedProperty，noresponsemiddle
      if (config.watchedProperty) {
        const propertyPath = config.watchedProperty
        const newValue = getNestedValue(newDisplayData, propertyPath)
        const oldValue = getNestedValue(oldDisplayData || {}, propertyPath)

    // Removed：consolestatement

        // If the attribute value changes
        if (newValue !== oldValue) {
          // Check execution conditions（useconfig.conditioninstead ofresponse.executionCondition）
          if (checkDataChangeCondition(config.condition, newValue)) {
    // Removed：consolestatement

            // 🔥 critical fix：Collect responses instead of executing immediately
            triggeredResponses.push(...config.responses)
    // Removed：consolestatement
          } else {
    // Removed：consolestatement
          }
        }
      }
    }

    // 🔥 critical fix：Execute all triggered responses in batches，Avoid covering each other
    if (triggeredResponses.length > 0) {
    // Removed：consolestatement

      // Delayed execution to avoid conflicts with synchronous updates
      setTimeout(async () => {
        await executeBatchedInteractionResponses(triggeredResponses)
      }, 100)
    }
  },
  { deep: true }
)

// Helper function for getting nested object property values
const getNestedValue = (obj: any, path: string): any => {
  if (!obj || !path) return undefined

  // Supports dot-separated paths，like 'base.deviceId' 或简单属性like 'title'
  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return undefined
    }
  }

  return current
}

// 🔥 dedicated todataChangeEvent condition checking function
const checkDataChangeCondition = (condition: any, currentValue: any): boolean => {
  if (!condition) return true // Execute directly without conditions

    // Removed：consolestatement

  switch (condition.type) {
    case 'comparison':
      const operator = condition.operator || 'equals'
      const targetValue = condition.value

    // Removed：consolestatement

      return compareValues(currentValue, targetValue, operator)

    case 'range':
      return checkRangeCondition(currentValue, condition.value)

    case 'expression':
      return checkExpressionCondition(currentValue, condition.value)

    default:
    // Removed：consolestatement
      return true
  }
}

// General execution condition checking function（for other event types）
const checkExecutionCondition = (response: any, currentValue: any): boolean => {
  const condition = response.executionCondition
  if (!condition) return true // Execute directly without conditions

    // Removed：consolestatement

  switch (condition.type) {
    case 'equals':
    case 'comparison':
      const operator = condition.operator || '=='
      const targetValue = condition.value

    // Removed：consolestatement

      return compareValues(currentValue, targetValue, operator)

    case 'range':
      return checkRangeCondition(currentValue, condition.value)

    case 'expression':
      return checkExpressionCondition(currentValue, condition.value)

    default:
    // Removed：consolestatement
      return true
  }
}

// value comparison function
const compareValues = (currentValue: any, targetValue: any, operator: string): boolean => {
  switch (operator) {
    case '==':
    case 'equals':
      return String(currentValue) === String(targetValue)
    case '!=':
    case 'notEquals':
      return String(currentValue) !== String(targetValue)
    case '>':
      return Number(currentValue) > Number(targetValue)
    case '>=':
      return Number(currentValue) >= Number(targetValue)
    case '<':
      return Number(currentValue) < Number(targetValue)
    case '<=':
      return Number(currentValue) <= Number(targetValue)
    default:
      return String(currentValue) === String(targetValue)
  }
}

// Range check function
const checkRangeCondition = (currentValue: any, rangeValue: string): boolean => {
  // Simple implementation，support "10-20" Format
  const range = rangeValue.split('-').map(v => Number(v.trim()))
  if (range.length === 2) {
    const numValue = Number(currentValue)
    return numValue >= range[0] && numValue <= range[1]
  }
  return false
}

// Expression checking function
const checkExpressionCondition = (currentValue: any, expression: string): boolean => {
  try {
    // Simple expression checking，Will${value}Replace with actual value
    const expr = expression.replace(/\${value}/g, String(currentValue))
    // A safe expression evaluator should be used here，Temporarily simplify processing
    return eval(expr)
  } catch (error) {
    // Removed：consolestatement
    return false
  }
}

// ================== component executor ==================

/**
 * 🔥 critical fix：Loop-proof component data source executor
 * This is registered to componentExecutorRegistry core function
 */
let executionInProgress = false
let lastExecutionConfig = ''
let executionDebounce: NodeJS.Timeout | null = null
// 🔥 New：Execution serial number tracking，Ensure that only the latest execution results are applied
let currentExecutionSequence = 0
// 🔥 New：Configure version tracking，Prevent the use of outdated configurations
let lastConfigHash = ''

const executeComponentDataSource = async (): Promise<void> => {
  // 🔥 Generate the current execution sequence number
  currentExecutionSequence++
  const currentSequence = currentExecutionSequence
  const executionId = `${props.nodeId}-seq${currentSequence}-${Date.now()}`

  // Removed：consolestatement

  // 🔥 critical fix：Get the latest configuration snapshot now，Prevent configuration changes during execution
  const configSnapshot = await captureLatestConfigurationSnapshot(executionId)
  if (!configSnapshot) {
    // Removed：consolestatement
    return
  }

  // 🔥 critical fix：Check configuration version，Prevent repeated execution of the same configuration
  const currentConfigHash = calculateConfigurationHash(configSnapshot.dataSource)
  if (currentConfigHash === lastConfigHash && currentConfigHash !== '') {
    // Removed：consolestatement
    return
  }
  lastConfigHash = currentConfigHash

  // 🔥 cycle protection：Check whether this execution should be allowed
  const callId = loopProtectionManager.markCallStart(
    'Card2Wrapper.executeComponentDataSource',
    props.nodeId,
    'data-source-execution'
  )

  if (!callId) {
    // Removed：consolestatement
    return
  }

  // 🔥 critical fix1：Prevent concurrent execution and recursive calls
  if (executionInProgress) {
    loopProtectionManager.markCallEnd(callId, 'Card2Wrapper.executeComponentDataSource', props.nodeId)
    // Removed：consolestatement
    return
  }

  // 🔥 critical fix2：Anti-shake processing，Avoid frequent triggering
  if (executionDebounce) {
    clearTimeout(executionDebounce)
  }

  return new Promise((resolve) => {
    executionDebounce = setTimeout(async () => {
      // 🔥 Check the serial number again，Make sure this is the latest execution request
      if (currentSequence !== currentExecutionSequence) {
        // Removed：consolestatement
        resolve()
        return
      }

      if (executionInProgress) {
        resolve()
        return
      }

      executionInProgress = true
      try {
        // 🔥 critical fix：Using configuration snapshots，instead of reacquiring（may have expired）
        const dataSourceConfig = configSnapshot.dataSource

        if (!dataSourceConfig) {
          // Removed：consolestatement
          resolve()
          return
        }

        // 🔥 critical fix3：Using snapshot's configuration hash，Avoid repeated checks
        // Removed：consolestatement

        // 🎯 Print these words as requested by the user - stage0：Card2WrapperThe component executor is called
        if (process.env.NODE_ENV === 'development') {
    // Removed：consolestatement
        }

        // 🔥 use VisualEditorBridge Execute data source
        const { getVisualEditorBridge } = await import('@/core/data-architecture/VisualEditorBridge')
        const visualEditorBridge = getVisualEditorBridge()

        // 🔥 critical fix：pass with executionIDFull configuration snapshot of
        const enhancedConfig = {
          ...configSnapshot,
          executionId,
          executionSequence: currentSequence,
          configHash: currentConfigHash
        }

        // Clear cache to ensure you get the latest data
        simpleDataBridge.clearComponentCache(props.nodeId)

        // Execute data source
        const result = await visualEditorBridge.updateComponentExecutor(
          props.nodeId,
          props.componentType,
          enhancedConfig
        )

        // 🔥 Check the serial number again，Make sure this result remains up to date
        if (currentSequence !== currentExecutionSequence) {
          // Removed：consolestatement
          resolve()
          return
        }

        if (process.env.NODE_ENV === 'development') {
    // Removed：consolestatement
        }

        // 🔥 After the data source execution is completed，Clear cache to force re-fetching of latest data
        clearDataCache()

        // 🔥 force clear DataWarehouse merge cache and trigger responsive updates
        dataWarehouse.clearComponentMergedCache(props.nodeId)

        // 🔥 New：Delay forced refresh，Ensure data dissemination
        setTimeout(() => {
          forceDataRefresh()
        }, 100)

        resolve()
      } catch (error) {
    // Removed：consolestatement
        resolve() // Even if you failresolve，avoid blocking
      } finally {
        executionInProgress = false
        executionDebounce = null
        // 🔥 cycle protection：Mark the end of the call
        loopProtectionManager.markCallEnd(callId, 'Card2Wrapper.executeComponentDataSource', props.nodeId)
      }
    }, 300) // 300msAnti-shake delay，Adapt to a large number of component scenarios
  })
}

// 🔥 New：Utility function to capture the latest configuration snapshot
const captureLatestConfigurationSnapshot = async (executionId: string): Promise<{ dataSource: any; base: any; timestamp: number } | null> => {
  try {
    const latestConfig = configurationManager.getConfiguration(props.nodeId)
    if (!latestConfig) {
      // Removed：consolestatement
      return null
    }

    const snapshot = {
      dataSource: latestConfig.dataSource ? JSON.parse(JSON.stringify(latestConfig.dataSource)) : null,
      base: latestConfig.base ? JSON.parse(JSON.stringify(latestConfig.base)) : null,
      timestamp: Date.now()
    }

    // Removed：consolestatement

    return snapshot
  } catch (error) {
    // Removed：consolestatement
    return null
  }
}

// 🔥 New：Utility function to calculate configuration hash value
const calculateConfigurationHash = (config: any): string => {
  try {
    if (!config) return ''
    const configString = JSON.stringify(config)
    let hash = 0
    for (let i = 0; i < configString.length; i++) {
      const char = configString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to32bit integer
    }
    return Math.abs(hash).toString(36)
  } catch (error) {
    return Date.now().toString(36)
  }
}

// ================== life cycle ==================

/**
 * 🔥 Initialize data source configuration - Trigger data source execution through configuration changes
 * This is the correct way to trigger datasource execution when entering the editor
 */
const initializeDataSourceConfiguration = async () => {
  try {
    // Removed：consolestatement

    // Check if there is data source configuration
    const currentConfig = configurationManager.getConfiguration(props.nodeId)
    const hasDataSourceConfig = currentConfig?.dataSource

    if (hasDataSourceConfig) {
    // Removed：consolestatement

      // 🔥 key：pass"touch"Configure to trigger execution，rather than executing it directly
      // This ensures that all listeners are triggered correctly
      configurationManager.updateConfiguration(
        props.nodeId,
        'dataSource',
        currentConfig.dataSource,
        props.componentType
      )
    } else {
    // Removed：consolestatement
    }
  } catch (error) {
    // Removed：consolestatement
  }
}

// 🔥 Listen for component definition changes，make suremetadataAlways in sync
watch(
  () => currentComponentDef.value,
  (newDef, oldDef) => {
    if (newDef && newDef !== oldDef && editorContext?.updateNode) {
      const currentNode = editorContext.getNodeById(props.nodeId)
      if (currentNode) {
        const updatedMetadata = {
          ...currentNode.metadata,
          card2Definition: newDef,
          lastDefinitionUpdate: Date.now()
        }

        editorContext.updateNode(props.nodeId, {
          metadata: updatedMetadata
        })

    // Removed：consolestatement
      }
    }
  },
  { immediate: false }
)

// 🔥 monitor componentDataFromWarehouse change
watch(
  () => componentDataFromWarehouse.value,
  (newData, oldData) => {
    // Removed：consolestatement
  },
  { deep: true, immediate: true }
)

// 🔥 New：Forced data update mechanism - Manually triggered when the data source execution is completed
const forceDataRefresh = () => {
  // force clearDataWarehousecache
  dataWarehouse.clearComponentMergedCache(props.nodeId)

  // Manually triggering computed property recalculation
  nextTick(() => {
    const freshData = componentDataFromWarehouse.value
    // Removed：consolestatement
  })
}

onMounted(async () => {
    // Removed：consolestatement

  // 🚀 First initializeCard2.1 CoreResponsive data binding system
  checkCard2CoreSupport()
  if (useCard2CoreDataBinding.value) {
    await initializeCard2CoreBinding()
  }

  // 🔥 Force clear cache，Make sure you get the latest data
  clearDataCache()

  // 🚨 **critical fix**：Force initialization of computed properties，EstablishVueReactive dependencies
  try {
    // Force access to computed properties，make sureVueReactive systems track dependencies
    const initialData = componentDataFromWarehouse.value

  } catch (initError) {
    // Removed：consolestatement
  }

  // 🔥 New：Make sure the component definition is injected into the node'smetadatamiddle
  if (currentComponentDef.value && editorContext?.updateNode) {
    const currentNode = editorContext.getNodeById(props.nodeId)
    if (currentNode) {
      const updatedMetadata = {
        ...currentNode.metadata,
        card2Definition: currentComponentDef.value,
        lastDefinitionUpdate: Date.now()
      }

      editorContext.updateNode(props.nodeId, {
        metadata: updatedMetadata
      })

    // Removed：consolestatement
    }
  }

  // 🔥 critical fix：Register the component executor to the executor registry
  if (componentExecutorRegistry) {
    componentExecutorRegistry.set(props.nodeId, executeComponentDataSource)

    // 🔥 critical fix：After the executor is registered，Check and retrigger execution of existing configurations
    nextTick(async () => {
      try {
        // Check if there is already a configuration（illustratefetchBoardAlready executed）
        const existingConfig = configurationManager.getConfiguration(props.nodeId)
        if (existingConfig && existingConfig.dataSource) {
          // Call the executor directly，Re-execute the data source
          await executeComponentDataSource()
        } else {
          // No configuration，Perform initialization
          await initializeDataSourceConfiguration()
        }
      } catch (error) {
         // Removed：consolestatement
      }
    })
  }
  // 🔥 Comment：Data source initialization has taken place after executor registration，No need to call repeatedly here
  // 🔥 Unified configuration center：Interaction configuration initialization is handled automatically by computed properties
  const savedConfigs = unifiedConfig.value.interaction?.configs as InteractionConfig[]
  // Listen for configuration updates and request events
  window.addEventListener('card2-config-update', handleConfigUpdateEvent as EventListener)
  window.addEventListener('card2-config-request', handleConfigRequestEvent as EventListener)

  // 🔥 Register the component instance to the interactive configuration router
  nextTick(() => {
    const componentExpose = {
      getFullConfiguration,
      updateConfig,
      updateUnifiedConfig,
      getDisplayData: () => displayData.value,
      getUnifiedConfig: () => unifiedConfig.value,
      updateInteractionConfigs,
      getInteractionConfigs,
      getInteractionCapability,
      watchProperty: (propertyName: string, callback: (newValue: any, oldValue: any) => void) => {
        if (currentComponentRef.value?.watchProperty) {
          return currentComponentRef.value.watchProperty(propertyName, callback)
        } else {
          return watch(
            () => unifiedConfig.value.component?.[propertyName],
            (newValue, oldValue) => {
              if (newValue !== oldValue) {
                callback(newValue, oldValue)
              }
            },
            { immediate: false }
          )
        }
      }
    }

    interactionConfigRouter.registerComponentInstance(props.nodeId, componentExpose)
  })
})

// Clean up event listening
onUnmounted(() => {
  // 🚀 clean upCard2.1 Coredata binding
  cleanupCard2CoreBinding()

  // 🔥 Clean up component executor registration
  if (componentExecutorRegistry) {
    componentExecutorRegistry.delete(props.nodeId)
    // Removed：consolestatement
  }

  // 🔥 Clean up component registration in interactive configuration router
  interactionConfigRouter.unregisterComponent(props.nodeId)
    // Removed：consolestatement

  window.removeEventListener('card2-config-update', handleConfigUpdateEvent as EventListener)
  window.removeEventListener('card2-config-request', handleConfigRequestEvent as EventListener)
})

// 🔥 Expose the configuration management interface to the outside world，forNodeWrappercall
defineExpose({
  getFullConfiguration,
  updateConfig,
  updateUnifiedConfig,
  getDisplayData: () => displayData.value,
  getUnifiedConfig: () => unifiedConfig.value,
  // 🎯 Interactive system related interfaces
  updateInteractionConfigs,
  getInteractionConfigs,
  getInteractionCapability,
  // 🔥 New：Property listening interface，For use by interaction engines
  watchProperty: (propertyName: string, callback: (newValue: any, oldValue: any) => void) => {
    // Check if the current component instance haswatchPropertymethod
    if (currentComponentRef.value?.watchProperty) {
      return currentComponentRef.value.watchProperty(propertyName, callback)
    } else {
      // Fallback：monitor unifiedConfig change
      return watch(
        () => unifiedConfig.value.component?.[propertyName],
        (newValue, oldValue) => {
          if (newValue !== oldValue) {
            callback(newValue, oldValue)
          }
        },
        { deep: true }
      )
    }
  }
})
</script>

<style scoped>
.card2-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
}

/* 🔥 Card2Wrapper debug style */
.card2-wrapper-debug {
  background: #e8f4ff;
  border: 2px solid #1890ff;
  border-radius: 4px;
  padding: 8px;
  margin-top: 8px;
  font-size: 12px;
}

.card2-wrapper-debug .debug-title {
  color: #1890ff;
  font-weight: bold;
  margin-bottom: 4px;
}

.card2-wrapper-debug .debug-content {
  background: #fff;
  padding: 4px;
  border-radius: 2px;
  font-family: monospace;
  word-break: break-all;
}

.card2-component {
  width: 100%;
  height: 100%;
}
</style>
