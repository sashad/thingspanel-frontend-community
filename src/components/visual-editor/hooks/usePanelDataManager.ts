/**
 * Panel editor data management combined functions
 * Responsible for panel data loading、Status management、Configuration storage
 */

import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { getBoard } from '@/service/api'
import { $t } from '@/locales'
import { smartDeepClone } from '@/utils/deep-clone'
import { usePanelConfigManager } from '@/components/visual-editor/hooks/usePanelConfigManager'
import type { Panel } from '#/entity'

/**
 * Collection of data management related functions
 */
export function usePanelDataManager(
  props: { panelId: string },
  dependencies: {
    stateManager: any
    configurationManager: any
    multiDataSourceConfigStore: any
    isUnmounted: any
  }
) {
  const message = useMessage()
  const { parseConfig, getDefaultConfig } = usePanelConfigManager()

  // Panel data status
  const panelData = ref<Panel.Board>()
  const dataFetched = ref(false)
  const editorConfig = ref<any>({})
  const preEditorConfig = ref<any>({})

  /**
   * Restore editor state
   * Restore the complete state of the editor from the configuration object
   */
  const setState = (config: any) => {
    // reset state
    dependencies.stateManager.reset()

    // 🔥 Unified field name：deal with widgets instead of nodes
    if (config.widgets && Array.isArray(config.widgets)) {
      config.widgets.forEach((node: any) => {
        dependencies.stateManager.addNode(node)
      })
    }

    // Load viewport settings
    if (config.viewport) {
      dependencies.stateManager.updateViewport(config.viewport)
    }

    // 🔥 critical fix：Restore configuration data for all components
    if (config.componentConfigurations) {
      try {
        // Restore the configuration of each component
        for (const [nodeId, nodeConfig] of Object.entries(config.componentConfigurations)) {
          if (nodeConfig && typeof nodeConfig === 'object') {
            try {
              // 🔥 critical fix：separation and recovery multiDataSourceConfigStore data
              const typedConfig = nodeConfig as any

              // Check whether any data source configuration needs to be restored
              if (typedConfig.dataSource?.type === 'data-mapping' && typedConfig.dataSource?.config) {
                // Revert to multiDataSourceConfigStore
                dependencies.multiDataSourceConfigStore.value[nodeId] = typedConfig.dataSource.config
              }

              // 🔥 repair：Keep full configuration，Do not delete dataSource Field
              dependencies.configurationManager.setConfiguration(nodeId, typedConfig)
            } catch (configError) {
              // Configuration recovery failure should not prevent the entire state recovery process
            }
          }
        }
      } catch (error) {}
    } else {
    }
  }

  /**
   * Get the current editor status
   * Collect all component configuration and editor state for saving
   */
  const getState = () => {
    // Collect configuration data for all components
    const componentConfigurations: Record<string, any> = {}
    try {
      // Traverse all nodes，Collect their configurations
      for (const node of dependencies.stateManager.nodes) {
        const config = dependencies.configurationManager.getConfiguration(node.id)
        if (config) {
          // 🔥 critical fix：integrated multiDataSourceConfigStore data
          const nodeId = node.id
          const multiDataSourceConfig = dependencies.multiDataSourceConfigStore.value[nodeId]

          if (multiDataSourceConfig) {
            // Consolidate multiple data source configurations into dataSource in field
            const enhancedConfig = {
              ...config,
              dataSource: {
                type: 'data-mapping',
                enabled: true,
                config: multiDataSourceConfig,
                metadata: {
                  componentType: node.type,
                  mappingType: 'json-path',
                  updatedAt: Date.now()
                }
              }
            }
            componentConfigurations[nodeId] = enhancedConfig
          } else {
            componentConfigurations[nodeId] = config
          }
        }
      }
    } catch (error) {}

    const finalState = {
      widgets: dependencies.stateManager.nodes, // 🔥 Unified field name：use widgets
      config: {
        canvasConfig: editorConfig.value.canvasConfig || {},
        gridConfig: editorConfig.value.gridConfig || {}
      },
      viewport: dependencies.stateManager.viewport,
      mode: dependencies.stateManager.mode,
      // 🔥 critical fix：Contains configuration data for all components
      componentConfigurations: componentConfigurations
    }
    return finalState
  }

  /**
   * Get panel data and initialize the editor
   * fromAPILoad panel data，Parse configuration，and restore the editor state
   */
  const fetchBoard = async () => {
    try {
      const { data } = await getBoard(props.panelId)
      // Check if the component has been uninstalled
      if (dependencies.isUnmounted.value) {
        return
      }
      if (data) {
        panelData.value = data

        if (data.config) {
          const config = parseConfig(data.config)
          editorConfig.value = config.visualEditor || getDefaultConfig()
          // 🔥 Smart deep copy：Use optimizedsmartDeepClone
          preEditorConfig.value = smartDeepClone(editorConfig.value)

          // Load into editor
          setState(editorConfig.value)
        } else {
          editorConfig.value = getDefaultConfig()
          preEditorConfig.value = smartDeepClone(editorConfig.value)
          setState(editorConfig.value)
        }
        if (!dependencies.isUnmounted.value) {
          dataFetched.value = true
          message.success($t('visualEditor.success'))
        }
      } else {
        if (!dependencies.isUnmounted.value) {
          message.warning($t('visualEditor.warning'))
        }

        // Initialize default configuration even if there is no data
        editorConfig.value = getDefaultConfig()
        preEditorConfig.value = smartDeepClone(editorConfig.value)
        setState(editorConfig.value)
        if (!dependencies.isUnmounted.value) {
          dataFetched.value = true
        }
      }
    } catch (error: any) {
      if (!dependencies.isUnmounted.value) {
        message.warning($t('visualEditor.warning'))
      }

      // Also initialize the default configuration when an error occurs，Make the editor work properly
      editorConfig.value = getDefaultConfig()
      // 🔥 Smart deep copy：Use optimizedsmartDeepClone
      preEditorConfig.value = smartDeepClone(editorConfig.value)
      setState(editorConfig.value)
      if (!dependencies.isUnmounted.value) {
        dataFetched.value = true
      }
    }
  }

  /**
   * Initialize panel data and related configurations
   * Load panel data and complete basic initialization
   */
  const initializePanelData = async () => {
    // Load panel data
    await fetchBoard()
  }

  return {
    // state variables
    panelData,
    dataFetched,
    editorConfig,
    preEditorConfig,

    // data management functions
    setState,
    getState,
    fetchBoard,
    initializePanelData
  }
}
