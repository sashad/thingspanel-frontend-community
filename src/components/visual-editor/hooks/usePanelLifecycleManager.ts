/**
 * Panel editor life cycle management combined functions
 * Responsible for component initialization、Listener settings、Lifecycle management such as cleanup and destruction
 */

import { onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '@/store/modules/app'

/**
 * Collection of life cycle management related functions
 */
export function usePanelLifecycleManager(dependencies: {
  // Status management
  isEditing: any
  isUnmounted: any
  dataFetched: any
  multiDataSourceConfigStore: any
  selectedWidgetTimer: any

  // Editor features
  stateManager: any
  setPreviewMode: any
  initializePanelData: any
  editorDataSourceManager: any
  handleComponentAdded: any
  handleComponentRemoved: any
  handleComponentConfigChanged: any

  // Event listener reference
  dataUpdateListener: any
  statusChangeListener: any
  pollingStatusListener: any

  // Component communication
  emit: any
}) {
  const appStore = useAppStore()

  /**
   * Set up component lifecycle listeners
   * Monitor component node changes and configuration changes，Automatically handle the addition of components、Delete and configure updates
   */
  const setupComponentLifecycleListeners = () => {
    // Monitor component node changes
    watch(
      () => dependencies.stateManager.nodes,
      async (newNodes, oldNodes) => {
        if (!newNodes || !oldNodes) return

        // Detect new components
        const oldNodeIds = new Set(oldNodes.map(node => node.id))
        const newNodeIds = new Set(newNodes.map(node => node.id))

        // Handle new components
        for (const node of newNodes) {
          if (!oldNodeIds.has(node.id)) {
            await dependencies.handleComponentAdded(node)
          }
        }

        // Handle deleted components
        for (const oldNode of oldNodes) {
          if (!newNodeIds.has(oldNode.id)) {
            await dependencies.handleComponentRemoved(oldNode.id)
          }
        }
      },
      { deep: true }
    )

    // Monitor component configuration changes
    watch(
      () => dependencies.multiDataSourceConfigStore.value,
      (newConfigs, oldConfigs) => {
        if (!newConfigs || !oldConfigs) return

        // 🔥 Performance optimization：Only detect components with configuration changes，Avoid deep contrast
        for (const [componentId, config] of Object.entries(newConfigs)) {
          const oldConfig = oldConfigs[componentId]

          // simple check：If the configuration object references are different，Description subject to change
          if (!oldConfig || oldConfig !== config) {
            try {
              // Only do deep comparisons if the references are different
              const configChanged = !oldConfig || JSON.stringify(config) !== JSON.stringify(oldConfig)
              if (configChanged) {
                dependencies.handleComponentConfigChanged(componentId, config)
              }
            } catch (error) {}
          }
        }

        // Detect deleted configurations
        for (const componentId of Object.keys(oldConfigs)) {
          if (!newConfigs[componentId]) {
            // The logic of configuration deletion can be handled here
          }
        }
      },
      { deep: true }
    )
  }

  /**
   * V6: Restoring a multiple data source configuration（Deprecated）
   * 🔥 Repair instructions：Configuration recovery is now integrated into setState in method
   * This function is reserved for debugging and status checking
   */
  const restoreMultiDataSourceConfigs = () => {
    if (!dependencies.stateManager?.nodes || dependencies.stateManager.nodes.length === 0) {
      return
    }

    // 🔥 Configuration recovery is now in setState completed in，Only status reports are done here
    return

    const restored: Record<string, any> = {}
    let restoredCount = 0
    let skippedCount = 0

    // Traverse all nodes，fromConfigurationManagerRestore configuration
    dependencies.stateManager.nodes.forEach(node => {
      const widgetId = node.id

      try {
        // The logic here has been moved to setState in method
        // Retain function frames for possible future debugging needs
      } catch (error) {
        console.error(`❌ [restoreMultiDataSourceConfigs] Failed to restore configuration: ${widgetId}`, error)
        skippedCount++
      }
    })

    if (process.env.NODE_ENV === 'development') {
    }
    return { restored, restoredCount, skippedCount }
  }

  /**
   * Initialization logic when mounting components
   */
  const initializeComponent = async () => {
    // Synchronize preview mode status during initialization
    dependencies.setPreviewMode(!dependencies.isEditing.value)

    // Perform initialization
    await dependencies.initializePanelData()

    // Emits the state manager ready event，For use by upper-level components
    dependencies.emit('state-manager-ready', dependencies.stateManager)
  }

  /**
   * Set tab refresh listener
   * Listen for the application's refresh flag，Reinitialize data when the tab is refreshed
   */
  const setupPageRefreshWatcher = () => {
    // 🔥 critical fix：Listen for tab refresh flag，Make sure the configuration is reloaded when the tab is refreshed
    watch(
      () => appStore.reloadFlag,
      async (newFlag, oldFlag) => {
        // when reloadFlag from false become true hour，Description tab refresh completed，Need to reinitialize
        if (newFlag && !oldFlag && dependencies.dataFetched.value) {
          if (process.env.NODE_ENV === 'development') {
          }
          try {
            // Reinitialize panel data and configuration
            await dependencies.initializePanelData()
          } catch (error) {
            console.error('❌ [PanelEditor] Reinitialization failed after tab refresh:', error)
          }
        }
      },
      { immediate: false }
    )
  }

  /**
   * Cleanup logic when components are uninstalled
   */
  const cleanupComponent = () => {
    dependencies.isUnmounted.value = true

    // Cleanup timer
    if (dependencies.selectedWidgetTimer.value) {
      clearTimeout(dependencies.selectedWidgetTimer.value)
    }

    // Clean up event listeners
    try {
      if (dependencies.dataUpdateListener.value) {
        dependencies.editorDataSourceManager.off('data-updated', dependencies.dataUpdateListener.value)
      }
      if (dependencies.statusChangeListener.value) {
        dependencies.editorDataSourceManager.off('component-status-changed', dependencies.statusChangeListener.value)
      }
      if (dependencies.pollingStatusListener.value) {
        dependencies.editorDataSourceManager.off('polling-status-changed', dependencies.pollingStatusListener.value)
      }
    } catch (error) {
      console.error('❌ [PanelEditor] Data source event listener cleanup failed:', error)
    }

    // Clean up the editor data source manager
    try {
      dependencies.editorDataSourceManager.destroy()
    } catch (error) {
      console.error('❌ [PanelEditor] Editor data source manager cleanup failed:', error)
    }
  }

  /**
   * register Vue life cycle hooks
   */
  const registerLifecycleHooks = () => {
    // Component mounting
    onMounted(async () => {
      await initializeComponent()
    })

    // Component uninstallation
    onUnmounted(() => {
      cleanupComponent()
    })
  }

  /**
   * Initialize all lifecycle management functions
   */
  const initializeLifecycleManagement = () => {
    // register Vue life cycle hooks
    registerLifecycleHooks()

    // Set up component lifecycle listeners
    setupComponentLifecycleListeners()

    // Set tab refresh listener
    setupPageRefreshWatcher()
  }

  return {
    // Core initialization function
    initializeLifecycleManagement,

    // Independent life cycle management function
    setupComponentLifecycleListeners,
    restoreMultiDataSourceConfigs,
    initializeComponent,
    setupPageRefreshWatcher,
    cleanupComponent,
    registerLifecycleHooks
  }
}
