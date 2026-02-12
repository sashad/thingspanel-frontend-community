/**
 * Panel editor event handling combined function
 * ResponsibleUIinteraction、drag、Component operations、Import and export event processing
 */

import { useMessage } from 'naive-ui'
import { $t } from '@/locales'
import type { RendererType } from '@/components/visual-editor/types'

/**
 * Collection of event processing related functions
 */
export function usePanelEventHandler(
  props: { panelId: string },
  dependencies: {
    // Status management
    showLeftDrawer: any
    showRightDrawer: any
    isDragging: any
    draggedComponent: any
    currentRenderer: any
    showWidgetTitles: any
    hasChanges: any
    multiDataSourceStore: any
    multiDataSourceConfigStore: any
    selectedNodeId: any

    // Configuration management
    editorConfig: any
    panelData: any

    // Editor features
    stateManager: any
    addWidget: any
    setState: any
    getState: any
    getDefaultConfig: any
    selectNode: any
    editorDataSourceManager: any
  }
) {
  const message = useMessage()

  // ===== Drawer control event handling =====

  /**
   * Switch the display status of the left drawer
   */
  const handleToggleLeftDrawer = () => {
    dependencies.showLeftDrawer.value = !dependencies.showLeftDrawer.value
    dependencies.hasChanges.value = true
  }

  /**
   * Switch the display status of the right drawer
   */
  const handleToggleRightDrawer = () => {
    dependencies.showRightDrawer.value = !dependencies.showRightDrawer.value
    dependencies.hasChanges.value = true
  }

  // ===== Drag event handling =====

  /**
   * Start dragging components
   * @param componentType Component type
   */
  const handleDragStart = (componentType: string) => {
    dependencies.isDragging.value = true
    dependencies.draggedComponent.value = componentType
  }

  /**
   * End drag
   */
  const handleDragEnd = () => {
    dependencies.isDragging.value = false
    dependencies.draggedComponent.value = null
  }

  // ===== Renderers and view controls =====

  /**
   * Handle renderer changes
   * @param renderer New renderer type
   */
  const handleRendererChange = (renderer: RendererType) => {
    if (process.env.NODE_ENV === 'development') {
    }
    dependencies.currentRenderer.value = renderer
    dependencies.hasChanges.value = true
  }

  /**
   * Toggle component title display state
   * @param value Whether to display title
   */
  const handleToggleWidgetTitles = (value: boolean) => {
    dependencies.showWidgetTitles.value = value
    dependencies.hasChanges.value = true
  }

  // ===== Component operation event handling =====

  /**
   * Add components to the editor
   * @param widget Component information
   */
  const handleAddWidget = async (widget: { type: string }) => {
    try {
      const widgetType = widget.type

      await dependencies.addWidget(widgetType)
      dependencies.hasChanges.value = true
      message.success($t('visualEditor.addWidgetSuccess', { type: widgetType }))
    } catch (error: any) {
      const widgetType = widget.type
      console.error(`❌ Failed to add component [${widgetType}]:`, error)
      message.error($t('visualEditor.addWidgetFailed', { type: widgetType, error: error.message || 'unknown error' }))
    }
  }

  /**
   * Clear all components
   */
  const handleClearAll = () => {
    dependencies.stateManager.reset()
    dependencies.hasChanges.value = true
    message.success($t('visualEditor.clearAllSuccess'))
  }

  // ===== Import and export processing =====

  /**
   * Import configuration
   * @param config Configuration object
   */
  const handleImportConfig = (config: Record<string, any>) => {
    try {
      if (process.env.NODE_ENV === 'development') {
      }

      // Verify configuration format
      if (config && typeof config === 'object') {
        // If it is a new format configuration
        if (config.visualEditor) {
          dependencies.editorConfig.value = config.visualEditor
          dependencies.setState(config.visualEditor)
        }
        // If it is a direct editor configuration
        else if (config.nodes || config.canvasConfig) {
          dependencies.editorConfig.value = config
          dependencies.setState(config)
        }
        // Otherwise, it will be treated as the old format.
        else {
          const newConfig = dependencies.getDefaultConfig()
          dependencies.editorConfig.value = newConfig
          dependencies.setState(newConfig)
        }

        dependencies.hasChanges.value = true
        message.success($t('visualEditor.configImportSuccess'))
      } else {
        throw new Error('Invalid config format')
      }
    } catch (error: any) {
      console.error('Import configuration failed:', error)
      message.error($t('visualEditor.configImportFailed', { error: error.message || 'unknown error' }))
    }
  }

  /**
   * Export configuration
   */
  const handleExportConfig = () => {
    try {
      const currentState = dependencies.getState()
      const exportConfig = {
        visualEditor: {
          ...currentState,
          metadata: {
            version: '1.0.0',
            exportedAt: Date.now(),
            editorType: 'visual-editor',
            // Panel information when exporting
            panelInfo: {
              id: props.panelId,
              name: dependencies.panelData.value?.name || '',
              homeFlag: dependencies.panelData.value?.home_flag || false,
              exportedAt: Date.now()
            },
            // Editor state when exporting
            exportInfo: {
              totalNodes: currentState.nodes.length,
              rendererType: currentState.currentRenderer,
              hasGridConfig: !!currentState.gridConfig,
              hasCanvasConfig: !!currentState.canvasConfig,
              showWidgetTitles: currentState.showWidgetTitles
            }
          }
        }
      }

      // Create download link
      const blob = new Blob([JSON.stringify(exportConfig, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `panel-config-${dependencies.panelData.value?.name || 'unnamed'}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      message.success($t('visualEditor.configExportSuccess'))
    } catch (error: any) {
      console.error('Export configuration failed:', error)
      message.error($t('visualEditor.configExportFailed', { error: error.message || 'unknown error' }))
    }
  }

  // ===== Configuration change handling =====

  /**
   * Handle grid configuration changes
   * @param newGridConfig New grid configuration
   */
  const handleGridConfigChange = (newGridConfig: any) => {
    dependencies.editorConfig.value.gridConfig = { ...dependencies.editorConfig.value.gridConfig, ...newGridConfig }
    dependencies.hasChanges.value = true
  }

  /**
   * deal withGridstackConfiguration changes
   * @param newGridConfig newGridstackConfiguration
   */
  const handleGridstackConfigChange = (newGridConfig: any) => {
    dependencies.editorConfig.value.gridConfig = { ...dependencies.editorConfig.value.gridConfig, ...newGridConfig }
    dependencies.hasChanges.value = true
  }

  /**
   * Handle canvas configuration changes
   * @param newCanvasConfig New canvas configuration
   */
  const handleCanvasConfigChange = (newCanvasConfig: any) => {
    dependencies.editorConfig.value.canvasConfig = {
      ...dependencies.editorConfig.value.canvasConfig,
      ...newCanvasConfig
    }
    dependencies.hasChanges.value = true
  }

  // ===== Data source processing =====

  /**
   * Handle data updates from multiple data sources
   * @param widgetId componentsID
   * @param dataSources Data source data
   */
  const handleMultiDataSourceUpdate = (widgetId: string, dataSources: Record<string, any>) => {
    // Store data source data
    dependencies.multiDataSourceStore.value[widgetId] = dataSources

    // Tags have changed
    dependencies.hasChanges.value = true
  }

  /**
   * Handle multiple data source configuration updates
   * @param widgetId componentsID
   * @param config Configuration object
   */
  const handleMultiDataSourceConfigUpdate = (widgetId: string, config: any) => {
    // Store configuration information
    dependencies.multiDataSourceConfigStore.value[widgetId] = config

    // Tags have changed
    dependencies.hasChanges.value = true
  }

  // ===== Canvas operation control =====

  /**
   * Enlarge view
   */
  const handleZoomIn = () => {
    // TODO: Implement zoom function
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Zoom out
   */
  const handleZoomOut = () => {
    // TODO: Implement zoom function
  }

  /**
   * Reset zoom
   */
  const handleResetZoom = () => {
    // TODO: Implement reset zoom function
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Undo operation
   */
  const handleUndo = () => {
    // TODO: Implement undo function
  }

  /**
   * redo operation
   */
  const handleRedo = () => {
    // TODO: Implement redo function
    if (process.env.NODE_ENV === 'development') {
    }
  }

  // ===== Renderer event handling =====

  /**
   * Renderer ready
   */
  const handleRendererReady = () => {}

  /**
   * Renderer error handling
   * @param error error object
   */
  const handleRendererError = (error: Error) => {
    console.error('❌ renderer error:', error)
    message.error($t('visualEditor.rendererLoadFailed', { error: error.message }))
  }

  // ===== Node selection and interaction =====

  /**
   * Handle node selection
   * @param nodeId nodeID
   */
  const handleNodeSelect = (nodeId: string) => {
    dependencies.selectedNodeId.value = nodeId
    dependencies.selectNode(nodeId)
    // Node selection usually does not trigger save，but can be marked as changed
    // dependencies.hasChanges.value = true
  }

  /**
   * Request settings panel
   * @param nodeId nodeID
   */
  const handleRequestSettings = (nodeId: string) => {
    if (nodeId) {
      dependencies.selectedNodeId.value = nodeId
      dependencies.selectNode(nodeId)
      dependencies.showRightDrawer.value = true
    }
  }

  /**
   * Handling canvas clicks（Deselect）
   */
  const handleCanvasClick = () => {
    dependencies.selectedNodeId.value = ''
    dependencies.selectNode('')
    // Properties panel can be selectively hidden when unchecked（or keep expanded）
    // rightCollapsed.value = true
  }

  // ===== Component life cycle events =====

  /**
   * Handle component addition event
   * @param node Node data
   */
  const handleComponentAdded = async (node: any) => {
    try {
      // Check if there is data source configuration
      const config = dependencies.multiDataSourceConfigStore.value[node.id]
      if (config && Object.keys(config).length > 0) {
        // Register to the Editor Data Source Manager
        dependencies.editorDataSourceManager.registerComponentDataSource(
          node.id,
          node.type,
          config,
          { type: 'timer', interval: 30000 } // default30Second polling
        )
      }
    } catch (error) {
      console.error(`❌ [PanelEditor] Handle component addition failure: ${node.id}`, error)
    }
  }

  /**
   * Handle component deletion events
   * @param componentId componentsID
   */
  const handleComponentRemoved = async (componentId: string) => {
    try {
      // Remove from Editor Data Source Manager
      dependencies.editorDataSourceManager.removeComponentDataSource(componentId)

      // Clean local configuration store
      delete dependencies.multiDataSourceConfigStore.value[componentId]
      delete dependencies.multiDataSourceStore.value[componentId]
    } catch (error) {
      console.error(`❌ [PanelEditor] Processing component deletion failed: ${componentId}`, error)
    }
  }

  /**
   * Handle component configuration change events
   * @param componentId componentsID
   * @param config New configuration
   */
  const handleComponentConfigChanged = async (componentId: string, config: any) => {
    // 🔥 error bounds：Make sure the data source manager is initialized
    if (!dependencies.editorDataSourceManager.isInitialized()) {
      console.error(`⚠️ [PanelEditor] Data source manager not initialized，Skip configuration changes: ${componentId}`)
      return
    }

    try {
      // If the component is registered in the data source manager，Update configuration
      const existingConfig = dependencies.editorDataSourceManager.getComponentConfig(componentId)
      if (existingConfig) {
        // Remove the old configuration first
        dependencies.editorDataSourceManager.removeComponentDataSource(componentId)

        // Re-register new configuration
        const node = dependencies.stateManager.nodes.find(n => n.id === componentId)
        if (node) {
          dependencies.editorDataSourceManager.registerComponentDataSource(
            componentId,
            node.type,
            config,
            { type: 'timer', interval: 30000 } // default30Second polling
          )
        }
      }
    } catch (error) {
      console.error(`❌ [PanelEditor] Failed to process component configuration changes: ${componentId}`, error)
    }
  }

  return {
    // Drawer control
    handleToggleLeftDrawer,
    handleToggleRightDrawer,

    // Drag and drop processing
    handleDragStart,
    handleDragEnd,

    // Renderers and view controls
    handleRendererChange,
    handleToggleWidgetTitles,

    // Component operations
    handleAddWidget,
    handleClearAll,

    // Import and export
    handleImportConfig,
    handleExportConfig,

    // Configuration changes
    handleGridConfigChange,
    handleGridstackConfigChange,
    handleCanvasConfigChange,

    // Data source processing
    handleMultiDataSourceUpdate,
    handleMultiDataSourceConfigUpdate,

    // Canvas operation control
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleUndo,
    handleRedo,

    // Renderer event handling
    handleRendererReady,
    handleRendererError,

    // Node selection and interaction
    handleNodeSelect,
    handleRequestSettings,
    handleCanvasClick,

    // Component life cycle events
    handleComponentAdded,
    handleComponentRemoved,
    handleComponentConfigChanged
  }
}
