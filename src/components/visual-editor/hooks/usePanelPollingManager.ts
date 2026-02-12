/**
 * Panel editor polling manages combined functions
 * Responsible for initialization of polling tasks、management and control
 */

import { computed } from 'vue'

/**
 * Collection of polling management related functions
 */
export function usePanelPollingManager(dependencies: {
  pollingManager: any
  stateManager: any
  configurationManager: any
  editorDataSourceManager?: any // 🔥 repair：Set as optional parameter，Compatible with new architecture
}) {
  // Global polling switch status
  const globalPollingEnabled = computed(() => dependencies.pollingManager.isGlobalPollingEnabled())
  const pollingStats = computed(() => dependencies.pollingManager.getStatistics())

  /**
   * Initialize polling task and enable global polling
   * Scan all components，Create a polling task for a polling-enabled component
   */
  const initializePollingTasksAndEnable = () => {
    try {
      // 🔥 Fix repeat timer vulnerability：Clear all existing tasks first
      dependencies.pollingManager.clearAllTasks()

      // Get polling configuration for all components
      const allComponents = dependencies.stateManager.nodes

      allComponents.forEach(component => {
        const componentId = component.id
        // from ConfigurationManager Read component-level polling configuration
        const config = dependencies.configurationManager.getConfiguration(componentId)


        let pollingConfig = config?.component?.polling

        // 🔥 critical fix：Automatically enable polling in preview mode（If the component has a data source）
        if (!pollingConfig && config?.dataSource) {
          pollingConfig = {
            enabled: true,
            interval: 30000,
            immediate: true
          }

          // Save polling configuration to component configuration
          dependencies.configurationManager.updateConfiguration(componentId, 'component.polling', pollingConfig)
        }

        if (pollingConfig && pollingConfig.enabled) {

          const interval = pollingConfig.interval || 30000

          // Create polling task（but does not start automatically）
          const taskId = dependencies.pollingManager.addTask({
            componentId: componentId,
            componentName: `components-${component.type}`,
            interval: interval,
            callback: async () => {
              try {
                // 🔥 Call component executor directly，This should be the correct way
                // 🔥 Use directly VisualEditorBridge call，This is a sure and effective method
                try {
                  // import VisualEditorBridge and call
                  const { getVisualEditorBridge } = await import('@/core/data-architecture/VisualEditorBridge')
                  const visualEditorBridge = getVisualEditorBridge()

                  // Get component configuration
                  const config = dependencies.configurationManager.getConfiguration(componentId)
                  if (!config || !config.dataSource) {
                    console.error(`⚠️ [PanelPollingManager] Component data source configuration does not exist: ${componentId}`)
                    return
                  }


                  // Get component type
                  const component = dependencies.stateManager.nodes.find(n => n.id === componentId)
                  const componentType = component?.type || 'unknown'

                  // 🔥 critical fix：Clear component cache before polling execution，Force data retrieval
                  const { simpleDataBridge } = await import('@/core/data-architecture/SimpleDataBridge')
                  simpleDataBridge.clearComponentCache(componentId)

                  const result = await visualEditorBridge.updateComponentExecutor(
                    componentId,
                    componentType,
                    config.dataSource
                  )
                } catch (bridgeError) {
                  console.error(`❌ [PanelPollingManager] VisualEditorBridge call failed: ${componentId}`, bridgeError)
                  console.error(`⚠️ [PanelPollingManager] Poll execution failed: ${componentId}`)
                }
              } catch (error) {
                console.error(`❌ [PanelPollingManager] Polling execution error: ${componentId}`, error)
              }
            },
            autoStart: false // Unification does not start automatically，Controlled by global switch
          })


          // Start this task
          dependencies.pollingManager.startTask(taskId)
        } else {
        }
      })

      // Final polling task statistics
      const finalStats = dependencies.pollingManager.getStatistics()

      // 🔛 Enable global polling switch
      dependencies.pollingManager.enableGlobalPolling()
    } catch (error) {
      console.error('❌ [PanelPollingManager] Failed to initialize polling task:', error)
    }
  }

  /**
   * Handling polling controller switching events
   * Triggered when polling switch state changes
   */
  const handlePollingToggle = (enabled: boolean) => {
    if (process.env.NODE_ENV === 'development') {
    }

    if (enabled) {
      // When enabled, the polling task needs to be initialized first.
      initializePollingTasksAndEnable()
    }
    // when closed PollingController The component has been processed internally
  }

  /**
   * Polling enables event handling
   * Fires when polling is successfully enabled
   */
  const handlePollingEnabled = () => {
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Polling disables event handling
   * Fires when polling is disabled
   */
  const handlePollingDisabled = () => {
  }

  return {
    // state variables
    globalPollingEnabled,
    pollingStats,

    // Polling management function
    initializePollingTasksAndEnable,
    handlePollingToggle,
    handlePollingEnabled,
    handlePollingDisabled
  }
}
