<script setup lang="ts">
/**
 * PanelEditor V2 - based on PanelLayout A new generation of visual editor
 *
 * Implement real toolbar and renderer switching functions
 */

import { ref, computed, onMounted, onUnmounted, watch, toRaw, provide, nextTick } from 'vue'
import { $t } from '@/locales'
import PanelLayout from '@/components/visual-editor/components/PanelLayout.vue'
import { VisualEditorToolbar } from '@/components/visual-editor/components/toolbar'
import WidgetLibrary from '@/components/visual-editor/components/WidgetLibrary/WidgetLibrary.vue'
import { CanvasRenderer, GridstackRenderer } from '@/components/visual-editor/renderers'
// TODO: FabricCanvasRenderer has been deleted，Need to be reimplemented or used CanvasRenderer substitute
import { createEditor } from '@/components/visual-editor/hooks'
import { ConfigurationPanel } from '@/components/visual-editor/configuration'
import { usePreviewMode } from '@/components/visual-editor/hooks/usePreviewMode'
import type { RendererType } from '@/components/visual-editor/types'
import { useMessage, useDialog } from 'naive-ui'
import { smartDeepClone } from '@/utils/deep-clone'

// 🔥 Polling system import
import { useGlobalPollingManager } from '@/components/visual-editor/core/GlobalPollingManager'
import { usePanelPollingManager } from '@/components/visual-editor/hooks/usePanelPollingManager'
import { configurationIntegrationBridge as configurationManager } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import PollingController from '@/components/visual-editor/components/PollingController.vue'

// 🔥 critical fix：Import configuration event bus and data source triggers
import { registerDataExecutionTrigger, type ConfigChangeEvent } from '@/core/data-architecture/ConfigEventBus'

// 🔥 importCard2.1Component registration system，Used to restore complete component definitions（Use unified entrance）
import { getAllComponents } from '@/card2.1/index'

// 🔥 Component caching - Avoid repeated calls getAllComponents()
let componentCache: any[] | null = null
let cachePromise: Promise<any[]> | null = null

const getComponentDefinition = async (componentType: string) => {
  // Use caching to avoid repeated calls
  if (componentCache) {
    return componentCache.find(comp => comp.type === componentType)
  }

  // Prevent concurrent calls
  if (!cachePromise) {
    cachePromise = getAllComponents()
  }

  const allComponents = await cachePromise
  componentCache = allComponents
  return allComponents.find(comp => comp.type === componentType)
}

// 🔥 Receive configuration for test pageprops
interface Props {
  panelId: string // Only as editor identifier
  initialConfig?: { widgets: any[]; config: any } // 🔥 Initial editor configuration passed by the parent component
  showToolbar?: boolean
  showPageHeader?: boolean
  enableHeaderArea?: boolean
  enableToolbarArea?: boolean
  enableFooterArea?: boolean
  customLayoutClass?: string
  defaultRenderer?: RendererType // 🔥 Default renderer type
  customSaveHandler?: (state: any) => Promise<void> // 🔥 Save function implemented by parent component
  mode?: 'template' | 'dashboard' // 🔥 WidgetLibrarymodel：template=Template configuration，dashboard=Kanban board editor
}

const props = withDefaults(defineProps<Props>(), {
  showToolbar: true,
  showPageHeader: true,
  enableHeaderArea: true,
  enableToolbarArea: true,
  enableFooterArea: false,
  customLayoutClass: '',
  defaultRenderer: 'gridstack', // 🔥 Used by defaultGridStackRenderer
  mode: 'dashboard' // 🔥 Default is kanban mode
})

const message = useMessage()
const dialog = useDialog()

// 🔥 definitionemitevent
const emit = defineEmits<{
  'state-manager-ready': [stateManager: any]
  'widget-added': [widget: any]
  'node-select': [nodeId: string]
  'editor-ready': [editor: any]
  'save': [state: any] // save event，Pass current status
  'save-success': [] // Save successful event
  'save-error': [error: any] // Save failure event
  'config-loaded': [] // 🔥 Configure loading completion event
  'load-error': [error: any] // 🔥 Configure loading failure event
}>()

// 🔥 Remove panelData internal state，Editors no longer manage business data
const preEditorConfig = ref<any>(null)

// base state
const isEditing = ref(true)
const leftCollapsed = ref(true) // 🔥 The left side is closed by default，Only opens when clicking the Add Component button
const rightCollapsed = ref(true) // 🔥 The right side is closed by default

// 🔥 Editor core functions
const currentRenderer = ref<RendererType>(props.defaultRenderer)

// 🔥 monitorprops.defaultRendererchanges，Implement responsive renderer switching
watch(
  () => props.defaultRenderer,
  newRenderer => {
    if (newRenderer && newRenderer !== currentRenderer.value) {
      currentRenderer.value = newRenderer
      if (process.env.NODE_ENV === 'development') {
      }
    }
  },
  { immediate: true }
)
const showWidgetTitles = ref(true)
const isSaving = ref(false)
const hasChanges = ref(false)
const dataFetched = ref(false) // Simplified version，Set directly totrue
const isUnmounted = ref(false)

// 🔥 Drag and drop state management
const isDragging = ref(false)
const isDragOver = ref(false)
const draggedComponent = ref<string | null>(null)
const selectedNodeId = ref<string>('')

// 🔥 Status management shown at the bottom
const showFooter = ref(false) // Trigger status of preview mode

// 🔥 Calculate the actualfooterShow status
const actualFooterShow = computed(() => {
  if (isEditing.value) {
    // edit mode：According to the external incomingenableFooterAreaDecide
    return props.enableFooterArea
  } else {
    // preview mode：Controlled by triggers，and mustenableFooterAreafortrue
    return props.enableFooterArea && showFooter.value
  }
})

// Create editor context
const editorContext = createEditor()
const { stateManager, addWidget, updateNode, selectNode } = editorContext
const { setPreviewMode, isPreviewMode } = usePreviewMode()

// 🔥 Monitor global preview mode changes，Synchronize to component internal state
watch(
  () => isPreviewMode.value,
  (newPreviewMode) => {
    const shouldBeEditing = !newPreviewMode
    if (isEditing.value !== shouldBeEditing) {
      isEditing.value = shouldBeEditing
      if (!shouldBeEditing) {
        // Switch to preview mode
        showFooter.value = false
        leftCollapsed.value = true
        rightCollapsed.value = true
        // Start polling（Need to wait for the component to be fully initialized）
        nextTick(() => {
          if (typeof initializePollingTasksAndEnable === 'function') {
            initializePollingTasksAndEnable()
          }
        })
      } else {
        // Switch to edit mode
        if (pollingManager) {
          pollingManager.disableGlobalPolling()
        }
      }
    }
  },
  { immediate: true }
)

// 🔥 Poll manager instance
const pollingManager = useGlobalPollingManager()

// 🔥 Component Executor Registry
const componentExecutorRegistry = ref(new Map<string, () => Promise<void>>())

// 🔥 critical fix：Data execution trigger - Handle configuration change events and trigger data source re-execution
const handleDataExecutionTrigger = async (event: ConfigChangeEvent) => {


  // Check if data execution needs to be triggered
  if (!event.context?.shouldTriggerExecution) {
    return
  }

  const executor = componentExecutorRegistry.value.get(event.componentId)
  if (executor) {
    try {
      await executor()
    } catch (error) {

        console.error(`Component data source execution failed: ${event.componentId}`, error)
    }
  } else {

    // 🔥 New：Directly call the core data architecture system to execute the data source
    try {
      const { SimpleDataBridge } = await import('@/core/data-architecture/SimpleDataBridge')
      const dataBridge = new SimpleDataBridge()

      // Get the complete configuration of a component
      const fullConfig = configurationManager.getConfiguration(event.componentId)
      if (fullConfig && fullConfig.dataSource) {
        // 🔥 Performance optimization：Reduce log output，avoid366duplicate logs

        // 🔥 critical fix：Force all caches to be cleared before execution，Make sure to send a real request
        dataBridge.clearComponentCache(event.componentId)

        // 🔥 Also clean up DataWarehouse cache
        const { dataWarehouse } = await import('@/core/data-architecture/DataWarehouse')
        dataWarehouse.clearComponentCache(event.componentId)

        // Build data requirements and execute
        const dataRequirement = {
          componentId: event.componentId,
          dataSourceBindings: fullConfig.dataSource,
          // Maintain compatibility，if notdataSourceBindingsthen use the original configuration
          dataSources: fullConfig.dataSource.dataSources || [fullConfig.dataSource]
        }

        const result = await dataBridge.executeComponent(dataRequirement)

        // 🔥 repair：passCard2WrapperData update mechanism to transfer data
        if (result.success && result.data) {
          // Trigger component data update event，letCard2Wrappernew data received
          const dataUpdateEvent = new CustomEvent('componentDataUpdate', {
            detail: {
              componentId: event.componentId,
              data: result.data,
              timestamp: Date.now(),
              source: 'PanelEditorV2-directExecution'
            },
            bubbles: true
          })

          // Find the target component element and dispatch the event
          const targetElement = document.querySelector(`[data-component-id="${event.componentId}"]`)
          if (targetElement) {
            targetElement.dispatchEvent(dataUpdateEvent)
            // 🔥 Performance optimization：Only output event distribution success log in debug mode
          } else {
            // 🔥 Performance optimization：It is usually normal for component elements not to be found（Component may not be rendered yet），Only output when debugging
          }
        }
      } else {
        // 🔥 Performance optimization：It is normal for the component to have no data source configuration.，no warning needed
      }
    } catch (error) {
      console.error(`❌ [PanelEditorV2] Data source execution exception: ${event.componentId}`, error)
    }
  }
}

// Data execution trigger cleaning function
let dataExecutionTriggerCleanup: (() => void) | null = null

// 🔥 Provide managers for use by subcomponents (Removed EditorDataSourceManager)
// 🔥 critical fix：supply editorContext to all child components，Ensure configurations are truly synchronized
provide('editorContext', editorContext)
provide('componentExecutorRegistry', componentExecutorRegistry.value)

// 🔥 Poll management combined functions (Migrated to core data architecture system)
const pollingManagerDependencies = {
  pollingManager,
  stateManager,
  configurationManager
}
const {
  initializePollingTasksAndEnable: initializePollingTasksAndEnableFromManager,
  handlePollingToggle: handlePollingToggleFromManager,
  handlePollingEnabled: handlePollingEnabledFromManager,
  handlePollingDisabled: handlePollingDisabledFromManager
} = usePanelPollingManager(pollingManagerDependencies)

// 🔥 Global polling status
const globalPollingEnabled = computed(() => pollingManager.isGlobalPollingEnabled())
const pollingStats = computed(() => pollingManager.getStatistics())

// 🔥 Calculate selected component objects - Migrate from old version
const selectedWidget = computed(() => {
  if (!selectedNodeId.value) return null
  const node = stateManager.nodes.find(n => n.id === selectedNodeId.value)
  return node || null
})

// Editor configuration
const editorConfig = ref({
  gridConfig: {},
  canvasConfig: {}
})

// This is from PanelEditor.vue's usePanelDataManager
const getState = () => {
  if (process.env.NODE_ENV === 'development') {
  }

  const widgets = toRaw(stateManager.nodes).map(widget => {
    // 🔥 Unified configuration architecture：Prioritize from ConfigurationManager Get the latest configuration
    let unifiedConfig = widget.metadata?.unifiedConfig

    // 🔥 critical fix：always try to start fromConfigurationManagerGet the latest configuration（as a source of truth）
    const configFromManager = configurationManager.getConfiguration(widget.id)
    if (configFromManager) {
      // use ConfigurationManager The latest configuration in
      unifiedConfig = configFromManager
    }
    const dataSourceConfig = unifiedConfig?.dataSource || {}

    // 🔥 Data optimization：Only save necessary data，Remove redundantmetadata
    // 🔥 critical fix：Remove duplicates dataSource Field，only remain in unifiedConfig middle
    const optimizedWidget = {
      id: widget.id,
      type: widget.type,
      x: widget.x,
      y: widget.y,
      width: widget.width,
      height: widget.height,
      label: widget.label,
      showLabel: widget.showLabel,
      properties: widget.properties,
      renderer: widget.renderer,
      layout: widget.layout,
      // 🔥 Remove duplicates dataSource Field，Avoid duplication of configuration structures
      // dataSource: dataSourceConfig, // Removed，only remain in unifiedConfig middle
      // 🔥 Unified configuration architecture：Keep complete unified configuration information
      metadata: {
        version: widget.metadata?.version || '2.0.0',
        createdAt: widget.metadata?.createdAt,
        updatedAt: Date.now(),
        isCard2Component: widget.metadata?.isCard2Component,
        card2ComponentId: widget.metadata?.card2ComponentId,
        // 🔥 critical fix：Use the latest unified configuration，Prioritize fromConfigurationManagerGet
        unifiedConfig: unifiedConfig || {
          base: {},
          component: widget.properties || {},
          dataSource: {},
          interaction: {}
        },
        // 🔥 compatibility：Keep basic definition information of data source
        card2Definition: widget.metadata?.card2Definition ? {
          type: widget.metadata.card2Definition.type,
          name: widget.metadata.card2Definition.name,
          description: widget.metadata.card2Definition.description,
          dataSources: widget.metadata.card2Definition.dataSources
        } : undefined
      }
    }

    return optimizedWidget
  })

  const config = toRaw(editorConfig.value)

  if (process.env.NODE_ENV === 'development') {
  }
  if (process.env.NODE_ENV === 'development') {
  }

  return {
    widgets,
    config
  }
}

// This is also from PanelEditor.vue's usePanelDataManager, simplified
const setState = async (state: any) => {
  if (!state) return

  const clonedState = smartDeepClone(state)
  const widgets = clonedState.widgets || []
  const config = clonedState.config || {}

  if (process.env.NODE_ENV === 'development') {
  }

  if (Array.isArray(widgets)) {
    // 🔥 Process component data，Restore data source configuration and necessarymetadata
    const processedWidgets = []

    for (const widget of widgets) {
      // 🔥 Unified configuration architecture：Restore unified configuration to component metadata


      if (widget.metadata?.unifiedConfig) {

        // useConfigurationIntegrationBridgeofsetConfigurationSet up complete configuration in one go
        configurationManager.setConfiguration(widget.id, widget.metadata.unifiedConfig, widget.type)
        // 🔍 Verify that the configuration is actually updated
      } else if (widget.dataSource) {
        // 🔥 compatibility：Falling back to traditional configuration recovery methods
        configurationManager.updateConfiguration(widget.id, 'dataSource', widget.dataSource)
      }

      // 🔥 critical fix：fromCard2.1Component registration system restores complete component definitions
      let fullCard2Definition = widget.metadata?.card2Definition

      // If the saved definition is incomplete（LackconfigComponent），Restore from registered system
      if (fullCard2Definition && !fullCard2Definition.configComponent) {
        try {
          const registeredDefinition = await getComponentDefinition(widget.type)
          if (registeredDefinition) {
            fullCard2Definition = registeredDefinition
          }
        } catch (error) {
          console.error(`❌ [setState] Restoring component definition failed: ${widget.type}`, error)
        }
      }

      // 🔥 Make sure the component has a complete runtimemetadata
      const processedWidget = {
        ...widget,
        metadata: {
          ...widget.metadata,
          isCard2Component: true,
          card2ComponentId: widget.type,
          card2Definition: fullCard2Definition,
          // 🔥 Whether the mark requires subsequent refreshes（When the component system is ready）
          needsCard2Refresh: !fullCard2Definition?.configComponent,
          // 🔥 Unified configuration architecture：useConfigurationManagerThe latest configuration in
          unifiedConfig: (() => {
            const latestConfig = configurationManager.getConfiguration(widget.id)
            if (latestConfig) {
              return latestConfig
            } else {
              return widget.metadata?.unifiedConfig || {
                component: widget.properties || {},
                dataSource: widget.dataSource || null
              }
            }
          })()
        }
      }

      if (process.env.NODE_ENV === 'development') {
      }

      processedWidgets.push(processedWidget)
    }

    stateManager.setNodes(processedWidgets)
  }

  editorConfig.value = {
    gridConfig: config.gridConfig || {},
    canvasConfig: config.canvasConfig || {}
  }
}

/**
 * 🔥 Initialize editor configuration
 * passed from parent component initialConfig Load configuration，No longer called internally API
 */
const initializeEditorConfig = async () => {
  try {
    dataFetched.value = false

    // If the parent component provides initial configuration，Use directly
    if (props.initialConfig) {
      const config = props.initialConfig

      if (config.widgets !== undefined || config.config !== undefined) {
        // standard format：{widgets: [...], config: {...}}
        await setState(config)
        preEditorConfig.value = smartDeepClone(config)
      } else {
        // Empty configuration
        const emptyState = { widgets: [], config: { gridConfig: {}, canvasConfig: {} } }
        await setState(emptyState)
        preEditorConfig.value = emptyState
      }
    } else {
      // No initial configuration provided，Use empty state
      const emptyState = { widgets: [], config: { gridConfig: {}, canvasConfig: {} } }
      await setState(emptyState)
      preEditorConfig.value = emptyState
    }

    dataFetched.value = true
    emit('config-loaded')
  } catch (error) {
    console.error('❌ Failed to initialize editor configuration:', error)
    message.error($t('common.loadFailed') || 'Failed to load configuration')
    emit('load-error', error)
    dataFetched.value = true // Even if it fails, it is set to true，Show empty editor
  }
}

// Handling component system ready events
const handleCard2SystemReady = () => {
  refreshCard2Definitions()
}

// Component System Readiness Check（backup mechanism）
let card2SystemCheckInterval: number | null = null
const startCard2SystemCheck = () => {
  // Every2Check once every second whether the component system is ready
  card2SystemCheckInterval = window.setInterval(async () => {
    try {
      // Try to get a component definition to test whether the system is ready
      const testDefinition = await getComponentDefinition('alert-status')
      if (testDefinition && testDefinition.configComponent) {
        if (card2SystemCheckInterval) {
          clearInterval(card2SystemCheckInterval)
          card2SystemCheckInterval = null
        }
        refreshCard2Definitions()
      }
    } catch (error) {
      // System is not ready，Keep waiting
    }
  }, 2000)

  // 30Automatically stop checking after seconds
  setTimeout(() => {
    if (card2SystemCheckInterval) {
      clearInterval(card2SystemCheckInterval)
      card2SystemCheckInterval = null
    }
  }, 30000)
}

onMounted(async () => {
  // 🔥 critical fix：First initialize the manager and set up the registry，Reload configuration
  try {
    await configurationManager.initialize()

    // 🔥 critical fix：Register data execution trigger，Used to handle configuration change events
    dataExecutionTriggerCleanup = registerDataExecutionTrigger(handleDataExecutionTrigger)

    // 🔥 Migrated：Data source management is now handled through the Core Data Architecture system
    // The component executor registry is now represented by Card2Wrapper self-management

  } catch (error) {
    console.error('Initialization manager failed:', error)
  }

  await nextTick() // make sureDOMUpdate completed

  // 🔥 provided from parent component initialConfig Load configuration
  await initializeEditorConfig()

  // Other initialization
  try {
    // Listen for component system ready events
    window.addEventListener('card2-system-ready', handleCard2SystemReady)

    // Start component system readiness check（backup mechanism）
    startCard2SystemCheck()
  } catch (error) {
    console.error('Initialization manager failed:', error)
  }

  // 🔥 Initialize the polling system（Only in preview mode）
  if (!isEditing.value && isPreviewMode.value) {
    initializePollingTasksAndEnable()
  }

  // Initialization completed，No need for global monitoring

  // 🔥 triggerstate-manager-readyevent，Let the test page know the editor is ready
  emit('state-manager-ready', stateManager)
  emit('editor-ready', editorContext)
})

// 🔥 Cleanup when components are uninstalled
onUnmounted(() => {
  // 🔥 critical fix：Clean data execution trigger
  if (dataExecutionTriggerCleanup) {
    dataExecutionTriggerCleanup()
    dataExecutionTriggerCleanup = null
  }

  // Clean up event listening
  window.removeEventListener('card2-system-ready', handleCard2SystemReady)

  // Cleanup component system check interval
  if (card2SystemCheckInterval) {
    clearInterval(card2SystemCheckInterval)
    card2SystemCheckInterval = null
  }
})

// Watch for changes to set hasChanges flag
watch(
  () => stateManager.nodes,
  (newValue, oldValue) => {
    if (dataFetched.value && JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      hasChanges.value = true
    }
  },
  { deep: true }
)

watch(
  () => editorConfig.value,
  (newValue, oldValue) => {
    if (dataFetched.value && JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
      hasChanges.value = true
    }
  },
  { deep: true }
)

// Renderer options
const rendererOptions = computed(() => [
  { label: $t('visualEditor.canvas'), value: 'canvas' as RendererType },
  { label: $t('visualEditor.gridstack'), value: 'gridstack' as RendererType }
])

// 🔥 Polling event handler function（Use real processing logic）
const handlePollingToggle = handlePollingToggleFromManager
const handlePollingEnabled = handlePollingEnabledFromManager
const handlePollingDisabled = handlePollingDisabledFromManager

// 🔥 Initialize the polling task and enable it（Use real polling logic）
const initializePollingTasksAndEnable = () => {
  initializePollingTasksAndEnableFromManager()
}

// 🔥 Footer Polling switching function
const toggleFooterPolling = () => {
  const wasEnabled = globalPollingEnabled.value

  if (!wasEnabled) {
    pollingManager.enableGlobalPolling()
    message.success($t('visualEditor.pollingEnabled'))
    handlePollingEnabled()
  } else {
    pollingManager.disableGlobalPolling()
    message.info($t('visualEditor.pollingDisabled'))
    handlePollingDisabled()
  }

  handlePollingToggle(!wasEnabled)
}

// 🔥 Trigger interaction in the lower right corner
const handleTriggerHover = () => {
  showFooter.value = true
}

const handleFooterMouseLeave = () => {
  showFooter.value = false
}

// 🔥 Toolbar event handling
const handleModeChange = (mode: 'edit' | 'preview') => {
  const editMode = mode === 'edit'
  isEditing.value = editMode
  setPreviewMode(!editMode)

  if (editMode) {
    // 🔴 Turn off global polling（edit mode）
    pollingManager.disableGlobalPolling()

    // No control required in edit modeshowFooter，Depend onactualFooterShowAutomatic processing
  } else {
    // 🔛 Automatically start global polling（Preview mode is enabled by default）
    initializePollingTasksAndEnable()

    // 🔥 preview mode：resetfooterStatus is hidden
    showFooter.value = false

    leftCollapsed.value = true
    rightCollapsed.value = true
  }
}

const handleRendererChange = (renderer: RendererType) => {
  currentRenderer.value = renderer
}

const handleSave = async () => {
  isSaving.value = true
  try {
    const currentState = getState()

    // 🔥 The save function must be provided by the parent component
    if (props.customSaveHandler) {
      // Use a custom save function provided by the parent component
      await props.customSaveHandler(currentState)
    } else {
      // 🔥 No save function provided，throw error
      throw new Error('customSaveHandler is required')
    }

    // 🔥 Trigger save success event
    emit('save', currentState)
    emit('save-success')

    message.success($t('page.dataForward.saveSuccess') || 'Saved successfully')
    hasChanges.value = false
    preEditorConfig.value = smartDeepClone(currentState)
  } catch (error) {
    console.error('❌ Save failed:', error)
    // 🔥 Trigger save failure event
    emit('save-error', error)

    message.error($t('page.dataForward.saveFailed') || 'Save failed')
  } finally {
    isSaving.value = false
  }
}

// 🔥 Drag event handling - fromWidgetLibrarycomponents
const handleDragStart = (widget: any, event: DragEvent) => {
  isDragging.value = true
  draggedComponent.value = widget.type
}

const handleDragEnd = (widget: any, event: DragEvent) => {
  isDragging.value = false
  draggedComponent.value = null
}

// 🔥 Drag and drop event handling - Support dragging and adding components from the left panel
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

const handleDragLeave = (event: DragEvent) => {
  // Highlighting is only canceled when leaving the entire drop area
  if (!event.currentTarget || !event.relatedTarget) {
    isDragOver.value = false
    return
  }

  const target = event.currentTarget as HTMLElement
  const relatedTarget = event.relatedTarget as HTMLElement

  if (!target.contains(relatedTarget)) {
    isDragOver.value = false
  }
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  try {
    if (!event.dataTransfer) return

    const dragDataStr = event.dataTransfer.getData('application/json')
    if (!dragDataStr) {
      return
    }

    const dragData = JSON.parse(dragDataStr)

    if (!dragData.type) {
      return
    }

    // Reuse existing add component logic
    await handleAddWidget({ type: dragData.type })
    message.success(`components "${dragData.type}" Added successfully`)
  } catch (error) {
    message.error('Drag and drop to add component failed')
  }
}

// 🔥 Component operation processing
const handleAddWidget = async (widget: { type: string }) => {
  try {
    await addWidget(widget.type)
    hasChanges.value = true
    // 🔥 emissionwidget-addedevent，Notification test page
    emit('widget-added', { type: widget.type })
  } catch (error: any) {
    console.error('❌ Failed to add component:', widget.type, error)
  }
}

// Other placeholder event handling
const handleImportConfig = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async e => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = event => {
      try {
        const configStr = event.target?.result as string
        const newConfig = JSON.parse(configStr)
        setState(newConfig)
        hasChanges.value = true
        message.success($t('visualEditor.configImportSuccess', 'Configuration imported successfully'))
      } catch (error) {
        message.error($t('visualEditor.configImportFailed', 'Configuration file parsing failed'))
      }
    }
    reader.readAsText(file)
  }
  input.click()
}
const handleExportConfig = () => {
  const state = getState()
  const dataStr = JSON.stringify(state, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${panelData.value.name || 'dashboard'}-config.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
const handleUndo = () => {
  stateManager.undo()
  hasChanges.value = true
}
const handleRedo = () => {
  stateManager.redo()
  hasChanges.value = true
}
const handleClearAll = () => {
  dialog.warning({
    title: $t('visualEditor.confirmClearAll', 'Confirm clearing'),
    content: $t('visualEditor.confirmClearAllContent', 'This operation will clear all components and cannot be recovered，Are you sure you want to continue?？'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      console.log('🗑️ [PanelEditorV2] Start clearing everything')

      // 1. Clear all nodes in the state manager
      stateManager.reset()
      console.log('✅ [PanelEditorV2] Cleared stateManager node')

      // 2. Clear editor configuration
      editorConfig.value = { gridConfig: {}, canvasConfig: {} }
      console.log('✅ [PanelEditorV2] Cleared editorConfig')

      // 3. ClearConfigurationManagerAll configurations in
      try {
        configurationManager.clearAll()
        console.log('✅ [PanelEditorV2] Cleared ConfigurationManager')
      } catch (error) {
        console.warn('⚠️ [PanelEditorV2] Clear ConfigurationManager fail:', error)
      }

      // 4. Clear component executor registry
      componentExecutorRegistry.value.clear()
      console.log('✅ [PanelEditorV2] Component executor registry cleared')

      // 5. Clear poll manager（If there are active tasks）
      try {
        if (pollingManager) {
          pollingManager.clearAll()
          console.log('✅ [PanelEditorV2] Poll manager cleared')
        }
      } catch (error) {
        console.warn('⚠️ [PanelEditorV2] Failed to clear poll manager:', error)
      }

      // 6. Clear selection
      selectedNodeId.value = ''
      selectNode('')

      // 7. Marked with changes
      hasChanges.value = true

      console.log('✅ [PanelEditorV2] Clearing completed')
      message.success($t('visualEditor.clearedSuccess', 'All content cleared'))
    }
  })
}
const handleZoomIn = () => {
  const currentZoom = editorConfig.value.canvasConfig?.transform?.s || 1
  const newZoom = currentZoom + 0.1
  editorConfig.value.canvasConfig = {
    ...editorConfig.value.canvasConfig,
    transform: { ...editorConfig.value.canvasConfig.transform, s: newZoom }
  }
}
const handleZoomOut = () => {
  const currentZoom = editorConfig.value.canvasConfig?.transform?.s || 1
  const newZoom = Math.max(0.1, currentZoom - 0.1)
  editorConfig.value.canvasConfig = {
    ...editorConfig.value.canvasConfig,
    transform: { ...editorConfig.value.canvasConfig.transform, s: newZoom }
  }
}
const handleResetZoom = () => {
  editorConfig.value.canvasConfig = {
    ...editorConfig.value.canvasConfig,
    transform: { x: 0, y: 0, s: 1 }
  }
}
const handleToggleLeftDrawer = () => {
  leftCollapsed.value = !leftCollapsed.value
}
const handleToggleRightDrawer = () => {
  rightCollapsed.value = !rightCollapsed.value
}
// 🔥 Grid configuration change processing - Implemented according to the old version
const handleGridstackConfigChange = (config: Record<string, any>) => {
  editorConfig.value.gridConfig = { ...editorConfig.value.gridConfig, ...config }
  hasChanges.value = true
}

const handleCanvasConfigChange = (config: Record<string, any>) => {
  editorConfig.value.canvasConfig = { ...editorConfig.value.canvasConfig, ...config }
  hasChanges.value = true
}

// 🔥 Renderer event handling - Simplified version，Remove unnecessary transfers
const handleNodeSelect = (nodeId: string) => {
  selectedNodeId.value = nodeId
  selectNode(nodeId)

  // 🔥 emissionnode-selectevent，Notification test page
  emit('node-select', nodeId)
}

const handleCanvasClick = () => {
  selectedNodeId.value = ''
  selectNode('')
}

const handleRequestSettings = (nodeId: string) => {
  selectedNodeId.value = nodeId
  selectNode(nodeId)
  rightCollapsed.value = false // Only right-click menu"Configuration"Just open the right panel
}

// 🔥 Data source related event processing - Simplified version，Mainly used forConfigurationPanelworking normally
const handleDataSourceManagerUpdate = (updateData: any) => {
  // in new architecture，Data source updates directly throughConfigEventBusdeal with
  // The main purpose here is to allowConfigurationPanelworking normally，No specific processing
  // Data source management update processing
}

const handleMultiDataSourceUpdate = (componentId: string, data: any) => {
  // In the new architecture, data sources pass directly throughGridstackRenderermanage
  // Multiple data source update processing
}

const handleMultiDataSourceConfigUpdate = (componentId: string, config: any) => {
  // Configuration update passed in new architectureConfigEventBusdeal with
  // Data source configuration update processing
}

const handleRequestCurrentData = (componentId: string) => {
  // In the new architecture, data requests go directly throughsimpleDataBridgedeal with
  // Request current data processing
}

/**
 * 🔥 Refresh all neededCard2.1Define updated components
 * This function is called when the component system is initialized.
 */
const refreshCard2Definitions = async () => {
  try {

    // 🔥 repair：from stateManager.nodes Get component list，而不是from editorConfig.widgets
    const currentWidgets = toRaw(stateManager.nodes)
    if (!currentWidgets || !Array.isArray(currentWidgets) || currentWidgets.length === 0) {
      return
    }

    // Create a copy to make modifications
    const updatedWidgets = [...currentWidgets]
    let updated = false

    // Check if each component needs to be refreshed
    for (let i = 0; i < updatedWidgets.length; i++) {
      const widget = updatedWidgets[i]
      if (widget.metadata?.needsCard2Refresh) {

        try {
          const registeredDefinition = await getComponentDefinition(widget.type)
          if (registeredDefinition && registeredDefinition.configComponent) {
            // Update component definition
            updatedWidgets[i] = {
              ...widget,
              metadata: {
                ...widget.metadata,
                card2Definition: registeredDefinition,
                needsCard2Refresh: false
              }
            }
            updated = true
          }
        } catch (error) {
          console.error(`❌ [refreshCard2Definitions] Refresh component failed: ${widget.type}`, error)
        }
      }
    }

    // If there is an update，reset status
    if (updated) {
      // direct update stateManager nodes in，instead of passing setState
      stateManager.setNodes(updatedWidgets)
    }
  } catch (error) {
    console.error('❌ [refreshCard2Definitions] Refresh failed:', error)
  }
}
</script>

<template>
  <div class="panel-editor-wrapper">
    <PanelLayout
      :mode="isEditing ? 'edit' : 'preview'"
      :left-collapsed="leftCollapsed"
      :right-collapsed="rightCollapsed"
      :show-header="props.enableHeaderArea && props.showPageHeader"
      :show-toolbar="props.enableToolbarArea && props.showToolbar"
      :show-footer="actualFooterShow"
      :custom-class="props.customLayoutClass"
      @update:left-collapsed="leftCollapsed = $event"
      @update:right-collapsed="rightCollapsed = $event"
    >
      <!-- title area -->
      <template #header>
        <div class="panel-header">
          <h1 class="panel-title">Visual panel editor V2</h1>
          <div class="panel-meta">
            <span class="panel-id">{{ props.panelId.slice(0, 8) }}...</span>
            <span class="panel-version">Based on multi-renderer architecture</span>
          </div>
        </div>
      </template>

      <!-- 🔥 real toolbar -->
      <template #toolbar>
        <VisualEditorToolbar
          v-if="dataFetched && !isUnmounted"
          :key="`toolbar-v2-${currentRenderer}-${isEditing ? 'edit' : 'preview'}`"
          :mode="isEditing ? 'edit' : 'preview'"
          :current-renderer="currentRenderer"
          :available-renderers="rendererOptions"
          :is-saving="isSaving"
          :has-changes="hasChanges"
          :show-left-drawer="!leftCollapsed"
          :show-right-drawer="!rightCollapsed"
          :gridstack-config="editorConfig.gridConfig"
          :canvas-config="editorConfig.canvasConfig"
          @mode-change="handleModeChange"
          @renderer-change="handleRendererChange"
          @save="handleSave"
          @import="handleImportConfig"
          @export="handleExportConfig"
          @import-config="handleImportConfig"
          @export-config="handleExportConfig"
          @undo="handleUndo"
          @redo="handleRedo"
          @clear-all="handleClearAll"
          @zoom-in="handleZoomIn"
          @zoom-out="handleZoomOut"
          @reset-zoom="handleResetZoom"
          @toggle-left-drawer="handleToggleLeftDrawer"
          @toggle-right-drawer="handleToggleRightDrawer"
          @gridstack-config-change="handleGridstackConfigChange"
          @canvas-config-change="handleCanvasConfigChange"
        />
      </template>

      <!-- 🔥 Real left side component library -->
      <template #left>
        <WidgetLibrary :mode="props.mode" @add-widget="handleAddWidget" />
      </template>

      <!-- 🔥 main content area - Real renderer implementation -->
      <template #main>
        <!-- Loading status -->
        <div v-if="!dataFetched" class="h-full flex items-center justify-center w-full">
          <n-spin size="large">
            <template #description>
              {{ $t('visualEditor.loading') }}
            </template>
          </n-spin>
        </div>

        <!-- renderer area -->
        <div v-else class="renderer-main-area w-full relative" @click="handleCanvasClick">
          <!-- Canvas Renderer -->
          <CanvasRenderer
            v-if="currentRenderer === 'canvas' && dataFetched && !isUnmounted"
            key="canvas-renderer-v2"
            :readonly="!isEditing"
            :show-widget-titles="showWidgetTitles"
            class="renderer-container"
            @node-select="handleNodeSelect"
            @canvas-click="handleCanvasClick"
            @request-settings="handleRequestSettings"
          />

          <!-- Gridstack Renderer -->
          <GridstackRenderer
            v-else-if="currentRenderer === 'gridstack' && dataFetched && !isUnmounted"
            key="gridstack-renderer-v2"
            :readonly="!isEditing"
            :show-widget-titles="showWidgetTitles"
            :grid-config="editorConfig.gridConfig"
            class="renderer-container"
            @node-select="handleNodeSelect"
            @canvas-click="handleCanvasClick"
            @request-settings="handleRequestSettings"
          />
        </div>
      </template>

      <!-- 🔥 Right configuration panel -->
      <template #right>
        <ConfigurationPanel
          :selected-widget="selectedWidget"
          :show-widget-titles="showWidgetTitles"
          :grid-config="editorConfig.gridConfig"
          @toggle-widget-titles="showWidgetTitles = $event"
          @grid-config-change="handleGridstackConfigChange"
          @data-source-manager-update="handleDataSourceManagerUpdate"
          @multi-data-source-update="handleMultiDataSourceUpdate"
          @multi-data-source-config-update="handleMultiDataSourceConfigUpdate"
          @request-current-data="handleRequestCurrentData"
        />
      </template>

      <!-- bottom status bar -->
      <template #footer>
        <div class="panel-footer auto-hide-footer" @mouseleave="handleFooterMouseLeave">
          <div class="status-section">
            <span class="status-text">Renderer: {{ currentRenderer }}</span>
            <span class="status-text">Number of components: {{ stateManager.nodes.length }}</span>
            <span v-if="hasChanges" class="status-text">There are unsaved changes</span>

            <!-- 🔥 Polling status display -->
            <span v-if="!isEditing" class="status-text polling-status">
              polling: {{ globalPollingEnabled ? 'Running' : 'Suspended' }}
              <span class="polling-stats">({{ pollingStats.activeTasks }}/{{ pollingStats.totalTasks }})</span>
            </span>
          </div>
          <div class="info-section">
            <span class="info-text">{{ $t('visualEditor.ready', 'V2 Editor is ready') }}</span>

            <!-- 🔥 Built-in polling controller - Only shown in preview mode -->
            <div v-if="!isEditing && dataFetched" class="footer-polling-controller">
              <n-button
                :type="globalPollingEnabled ? 'success' : 'default'"
                :ghost="!globalPollingEnabled"
                size="small"
                class="footer-polling-btn"
                @click="toggleFooterPolling"
              >
                <template #icon>
                  <span class="polling-icon">{{ globalPollingEnabled ? '⏸️' : '▶️' }}</span>
                </template>
                {{ globalPollingEnabled ? $t('visualEditor.pollingPause') : $t('visualEditor.pollingStart') }}
              </n-button>
            </div>
          </div>
        </div>
      </template>
    </PanelLayout>

    <!-- 🔥 lower right corner trigger - Only shown in preview mode -->
    <div v-if="props.enableFooterArea && !isEditing" class="footer-trigger" @mouseenter="handleTriggerHover"></div>
  </div>
</template>

<style scoped>
/* 🔥 Editor wrapper */
.panel-editor-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--body-color);
}

/* 🔥 Full screen mode style */
.panel-editor-wrapper:fullscreen {
  background: var(--body-color);
  display: flex;
  flex-direction: column;
  z-index: 9999;
}

/* Safari support */
.panel-editor-wrapper:-webkit-full-screen {
  background: var(--body-color);
  display: flex;
  flex-direction: column;
  z-index: 9999;
}

/* Firefox support */
.panel-editor-wrapper:-moz-full-screen {
  background: var(--body-color);
  display: flex;
  flex-direction: column;
  z-index: 9999;
}

/* IE11 support */
.panel-editor-wrapper:-ms-fullscreen {
  background: var(--body-color);
  display: flex;
  flex-direction: column;
  z-index: 9999;
}

/* 🔥 Header and bottom styles */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: var(--card-color);
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.panel-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-id {
  font-size: 12px;
  color: var(--text-color-2);
  font-family: monospace;
}

.panel-version {
  font-size: 12px;
  color: var(--info-color);
  font-weight: 500;
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 16px;
  background: var(--card-color);
  border-top: 1px solid var(--border-color);
}

/* 🔥 auto-hide Footer animation style */
.auto-hide-footer {
  transform: translateY(0);
  opacity: 1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

/* 🔥 Footer Hidden state - pass PanelLayout of v-show control */
.panel-layout[data-footer-hidden='true'] .auto-hide-footer {
  transform: translateY(100%);
  opacity: 0;
}

/* 🔥 Footer Enhanced styles when hovering */
.auto-hide-footer:hover {
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  background: var(--card-color);
}

/* 🔥 Dark theme adaptation */
[data-theme='dark'] .auto-hide-footer {
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);
}

[data-theme='dark'] .auto-hide-footer:hover {
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.4);
}

/* 🔥 Lower right corner trigger style */
.footer-trigger {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  z-index: 1000;
  background: transparent;
  cursor: pointer;
}

/* 🔥 Trigger floating prompt（Optional） */
.footer-trigger::before {
  content: '';
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: rgba(24, 160, 88, 0.6);
  border-radius: 50%;
  opacity: 0.8;
  transition: all 0.2s ease;
}

.footer-trigger:hover::before {
  opacity: 1;
  background: rgba(24, 160, 88, 0.8);
  transform: scale(1.2);
}

/* Dark theme adaptation */
[data-theme='dark'] .footer-trigger::before {
  background: rgba(16, 185, 129, 0.6);
}

[data-theme='dark'] .footer-trigger:hover::before {
  background: rgba(16, 185, 129, 0.8);
}

.status-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-text {
  font-size: 12px;
  color: var(--text-color-2);
}

/* 🔥 Poll status special style */
.status-text.polling-status {
  color: var(--success-color);
  font-weight: 500;
}

.polling-stats {
  font-size: 11px;
  opacity: 0.8;
  color: inherit;
  margin-left: 4px;
}

.info-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-text {
  font-size: 12px;
  color: var(--success-color);
  font-weight: 500;
}

/* 🔥 Footer Polling controller style */
.footer-polling-controller {
  display: flex;
  align-items: center;
}

.footer-polling-btn {
  padding: 4px 8px !important;
  font-size: 11px !important;
  height: 28px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.footer-polling-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.footer-polling-btn .polling-icon {
  font-size: 12px;
  line-height: 1;
}

/* 🔥 Renderer container style - Avoid double scrollbars but keep functionality */
.renderer-main-area {
  position: relative;
  background-color: var(--body-color, #f8fafc);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.renderer-container {
  width: 100%;
  position: relative; /* 🔥 Change torelative，Avoid absolute positioning restrictions */
  flex: 1;
  min-height: 0;
  overflow: auto;
}

/* 🔥 Drag state style */
.renderer-main-area.dragging {
  border: 2px dashed var(--primary-color, #1890ff);
  background-color: var(--primary-color-hover, rgba(24, 144, 255, 0.1));
}

.renderer-main-area.dragging::before {
  content: 'Drag the component here';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  color: var(--primary-color, #1890ff);
  font-weight: 500;
  z-index: 10;
  pointer-events: none;
}

/* 🔥 Drag and drop hover state styles */
.renderer-main-area.drag-over {
  border: 2px solid var(--success-color, #52c41a);
  background-color: rgba(82, 196, 26, 0.1);
  box-shadow: 0 0 10px rgba(82, 196, 26, 0.2);
}

.renderer-main-area.drag-over::before {
  content: 'Release the mouse to add the component';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  color: var(--success-color, #52c41a);
  font-weight: 600;
  z-index: 10;
  pointer-events: none;
}

/* 🔥 Theme adaptation */
[data-theme='dark'] .renderer-main-area {
  background-color: var(--body-color, #1f1f1f);
}

[data-theme='dark'] .renderer-main-area.dragging {
  border-color: var(--primary-color, #3b82f6);
  background-color: rgba(59, 130, 246, 0.1);
}

[data-theme='dark'] .renderer-main-area.dragging::before {
  color: var(--primary-color, #3b82f6);
}

[data-theme='dark'] .renderer-main-area.drag-over {
  border-color: var(--success-color, #10b981);
  background-color: rgba(16, 185, 129, 0.1);
}

[data-theme='dark'] .renderer-main-area.drag-over::before {
  color: var(--success-color, #10b981);
}

/* 🔥 Full screen drag and drop receiving overlay - Neat and clear */
.drag-drop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: transparent;
  pointer-events: auto;
}

.drag-drop-overlay::before {
  content: 'loosen add';
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  color: rgba(0, 0, 0, 0.4);
  font-weight: 400;
  user-select: none;
  z-index: 10000;
  pointer-events: none;
}

[data-theme='dark'] .drag-drop-overlay::before {
  color: rgba(255, 255, 255, 0.5);
}
</style>
