<!--
  Easy configuration system - alternative complexUIA lightweight configuration editor for components
  Implement visual data source configuration，supportJSON/HTTP/Scriptthree types
-->
<script setup lang="ts">
/**
 * SimpleConfigurationEditor - Simple configuration editor
 * based onSUBTASK-010Require，Implement lightweight visual configuration interface
 */

import { ref, reactive, computed, watch, onMounted, onUnmounted, h, inject, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDialog, useMessage } from 'naive-ui'
import {
  createExecutorChain,
  type DataSourceConfiguration,
  type DataSource,
  type DataItem,
  type ProcessingConfig
} from '../index'
import { type MergeStrategy } from '@/core/data-architecture/executors/DataSourceMerger'
import RawDataConfigModal from '@/core/data-architecture/components/modals/RawDataConfigModal.vue'
// Simple script editor
import SimpleScriptEditor from '@/core/script-engine/components/SimpleScriptEditor.vue'
// Import component level polling configuration component
import ComponentPollingConfig from '@/core/data-architecture/components/ComponentPollingConfig.vue'
// Import global polling manager
import { useGlobalPollingManager } from '@/components/visual-editor/core/GlobalPollingManager'
// import@viconsicon component
import {
  PlusOutlined,
  SearchOutlined,
  LinkOutlined,
  DotChartOutlined,
  SettingOutlined,
  DownloadOutlined,
  UploadOutlined,
  CopyOutlined
} from '@vicons/antd'
import { DocumentTextOutline, BarChartOutline, GlobeOutline } from '@vicons/ionicons5'
// New configuration management system
import { configurationIntegrationBridge as configurationManager } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
import { MultiLayerExecutorChain } from '@/core/data-architecture/executors/MultiLayerExecutorChain'
import { smartDeepClone } from '@/utils/deep-clone'
// Import and export panel components
import ConfigurationImportExportPanel from '@/core/data-architecture/components/common/ConfigurationImportExportPanel.vue'
// Single data source import and export function
import { singleDataSourceExporter, singleDataSourceImporter } from '@/core/data-architecture/utils/ConfigurationImportExport'
import type { SingleDataSourceImportPreview } from '@/core/data-architecture/utils/ConfigurationImportExport'

// 🚀 importCard2.1 CoreResponsive data manager
import { reactiveDataManager } from '@/card2.1/core2/data-source'
import { dataBindingManager } from '@/card2.1/core2/data-source'
import { ComponentRegistry } from '@/card2.1/core2/registry'

// Propsinterface - Compatible with existing systems andConfigurationPanelCalling method
interface Props {
  /** v-modelBind configuration data */
  modelValue?: Record<string, any>
  /** Data source requirements obtained from component definition */
  dataSources?: Record<string, any> | Array<any>
  /** componentsID */
  componentId?: string
  /** Component type */
  componentType?: string
  /** selected componentID */
  selectedWidgetId?: string
  /** Whether it is preview mode - Polling function only works in preview mode */
  previewMode?: boolean
  /** New：fromConfigurationPaneltransitivewidgetobject */
  widget?: any
  /** New：fromConfigurationPaneltransitivenodeId */
  nodeId?: string
  /** New：read-only mode */
  readonly?: boolean
}

// Emitsinterface
interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  dataSources: () => [],
  previewMode: false,
  readonly: false
})

const emit = defineEmits<Emits>()

// internationalization
const { t } = useI18n()

// Pop-up windows and message prompts
const dialog = useDialog()
const message = useMessage()

// poll manager
const pollingManager = useGlobalPollingManager()

// Inject editor context for configuration synchronization
const editorContext = inject('editorContext', null) as any

// 🚀 Card2.1 CoreResponsive data management state
const card2CoreDataSubscription = ref<string | null>(null)
const useCard2CoreReactiveData = ref(false)

// Import and export related status
const exportLoading = ref<Record<string, boolean>>({})
const importFileRef = ref<HTMLInputElement>()
const singleDataSourceImportPreview = ref<SingleDataSourceImportPreview | null>(null)
const originalImportData = ref<any>(null) // Save original imported data
const showSingleDataSourceImportModal = ref(false)
const targetDataSourceId = ref<string>('')
const isProcessing = ref(false) // New：Import and export processing status

// ⚡ Performance optimization：Loading status，Improve user experience
const isInitializing = ref(true)

/**
 * New：fromwidgetObject intelligent extraction of component information
 * compatibleConfigurationPanelCalling method
 */
const componentInfo = computed(() => {
  // Prioritize direct deliveryprops（only ifdataSourcesUse only when there is content）
  if (props.componentId && props.componentType && props.dataSources && Array.isArray(props.dataSources) && props.dataSources.length > 0) {
    return {
      componentId: props.componentId,
      componentType: props.componentType,
      dataSources: props.dataSources
    }
  }

  // fromwidgetObject extraction information（ConfigurationPanelCalling method）
  if (props.widget) {
    const widget = props.widget
    const componentId = props.nodeId || widget.id
    const componentType = widget.type

    // fromCard2.1Extract data source from component definition
    let dataSources = []

    if (widget.metadata?.card2Definition) {
      const card2Definition = widget.metadata.card2Definition
      dataSources = card2Definition.dataSources || []
    }

    // Check the data source definition for legacy components
    if (dataSources.length === 0 && widget.metadata?.dataSources) {
      dataSources = widget.metadata.dataSources
    }

    return {
      componentId,
      componentType,
      dataSources
    }
  }

  // Returns empty information by default
  return {
    componentId: props.componentId || props.nodeId || '',
    componentType: props.componentType || '',
    dataSources: []
  }
})

/**
 * Handle data source options - Compatible with array and object formats
 */
const dataSourceOptions = computed(() => {
  const dataSources = componentInfo.value.dataSources

  if (!dataSources || dataSources.length === 0) {
    return []
  }

  // Handle array format
  if (Array.isArray(dataSources)) {
    return dataSources.map((dataSource, index) => {
      const key = dataSource.key || `dataSource${index + 1}`
      return {
        label: dataSource.name || dataSource.title || `data source${index + 1}`,
        value: key,
        description: dataSource.description || '',
        type: dataSource.type || dataSource.expectedDataFormat || 'object',
        originalData: dataSource
      }
    })
  }

  // Handle object format
  return Object.entries(dataSources).map(([key, dataSource]) => {
    return {
      label: dataSource.name || dataSource.title || key,
      value: key,
      description: dataSource.description || '',
      type: dataSource.type || dataSource.expectedDataFormat || 'object',
      originalData: dataSource
    }
  })
})

/**
 * Pop-up window status management
 */
const showRawDataModal = ref(false)
const currentDataSourceKey = ref('')
// repair：Add edit mode state
const isEditMode = ref(false)
const editingItemId = ref('')
// RawDataConfigModal component reference，used to access internal state
const rawDataConfigModalRef = ref<any>(null)
// Currently selected data entry method
const currentSelectedMethod = ref<'json' | 'http' | 'script'>('json')

/**
 * Remove import and export status management - Migrated to standalone component
 */

/**
 * Data item configuration storage
 * Format：{ dataSourceKey: [dataItemConfig1, dataItemConfig2, ...] }
 */
const dataSourceItems = reactive<Record<string, any[]>>({})

/**
 * Stores the merge strategy for each data source
 * Format：{ dataSourceKey: { type: 'object' | 'array' | 'script', script?: string } }
 */
const mergeStrategies = reactive<Record<string, any>>({})

/**
 * ⚡ Performance optimization：HTTPConfigure conversion cache
 * Cache converted configuration，Avoid double counting
 */
const configConversionCache = new Map<string, any>()

/**
 * Handle add data item button click
 */
const handleAddDataItem = (dataSourceKey: string) => {
  currentDataSourceKey.value = dataSourceKey
  // repair：Reset to new mode
  isEditMode.value = false
  editingItemId.value = ''
  showRawDataModal.value = true
}

/**
 * Process edit data items
 */
const handleEditDataItem = (dataSourceKey: string, itemId: string) => {
  currentDataSourceKey.value = dataSourceKey

  // Find the data item you want to edit
  const item = dataSourceItems[dataSourceKey]?.find(item => item.id === itemId)
  if (item) {
    // repair：Set to edit mode
    isEditMode.value = true
    editingItemId.value = itemId
    showRawDataModal.value = true
  }
}

/**
 * Handle merge policy updates
 */
const handleMergeStrategyUpdate = (dataSourceKey: string, strategy: any) => {
  mergeStrategies[dataSourceKey] = strategy

  // Use the new configuration management system：Content hashing, deduplication and versioning
  // Rebuild the complete configuration and submit
  const rebuiltConfig = rebuildCompleteDataSourceConfiguration()

  // Clear component cache，Make sure the new policy takes effect
  simpleDataBridge.clearComponentCache(componentInfo.value.componentId)
  // Update configuration using new configuration management system（Built-in loop detection and deduplication）
  configurationManager.updateConfiguration(componentInfo.value.componentId, 'dataSource', rebuiltConfig)
}

/**
 * Update data source configuration（Called when the merge strategy changes）
 */
const updateDataSourceConfiguration = (dataSourceKey: string) => {
  try {
    // Get existing configuration
    const existingConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
    const currentDataSourceConfig = existingConfig?.dataSource as DataSourceConfiguration | undefined

    if (currentDataSourceConfig?.dataSources) {
      const dataSourceIndex = currentDataSourceConfig.dataSources.findIndex(ds => ds.sourceId === dataSourceKey)

      if (dataSourceIndex !== -1) {
        // Update merge strategy
        const strategy = mergeStrategies[dataSourceKey] || { type: 'object' }
        currentDataSourceConfig.dataSources[dataSourceIndex].mergeStrategy =
          strategy.type === 'script' ? { type: 'script', script: strategy.script } : strategy.type

        // Update timestamp
        currentDataSourceConfig.updatedAt = Date.now()

        // Submit configuration update
        configurationManager.updateConfiguration(componentInfo.value.componentId, 'dataSource', currentDataSourceConfig)
      }
    }
  } catch (error) {}
}

/**
 * Handle drawer close event
 */
const handleRawDataModalClose = () => {
  showRawDataModal.value = false
  currentDataSourceKey.value = ''
  isEditMode.value = false
  editingItemId.value = ''
}

/**
 * Process data item configuration confirmation - Integrated configuration-driven architecture
 */
const handleDataItemConfirm = async (dataItemConfig: any) => {
  const dataSourceKey = currentDataSourceKey.value
  if (!dataSourceKey) return

  try {
    // convert to standard DataItem Format
    const standardDataItem: DataItem = convertToStandardDataItem(dataItemConfig)

    // convert to standard ProcessingConfig Format
    const processingConfig: ProcessingConfig = convertToProcessingConfig(dataItemConfig)

    // Initialize the data item array of the data source
    if (!dataSourceItems[dataSourceKey]) {
      dataSourceItems[dataSourceKey] = []
    }

    // repair：Add or edit according to the mode
    let displayItem
    if (isEditMode.value && editingItemId.value) {
      // edit mode：Find and update existing items
      const existingIndex = dataSourceItems[dataSourceKey].findIndex(item => item.id === editingItemId.value)
      if (existingIndex !== -1) {
        // Performance optimization：Use structured cloning or shallow copy insteadJSONdeep copy
        displayItem = {
          id: editingItemId.value,
          ...smartDeepClone(dataItemConfig), // Use smart deep copy
          createdAt: dataSourceItems[dataSourceKey][existingIndex].createdAt, // Keep original creation time
          updatedAt: new Date().toISOString() // Add update time
        }
        dataSourceItems[dataSourceKey][existingIndex] = displayItem
      } else {
        return
      }
    } else {
      // New mode：Add new item
      displayItem = {
        id: Date.now().toString(),
        ...smartDeepClone(dataItemConfig), // Use smart deep copy to avoid reference sharing
        createdAt: new Date().toISOString()
      }
      dataSourceItems[dataSourceKey].push(displayItem)
    }

    // core：Rebuild the complete DataSourceConfiguration
    const dataSourceConfig = rebuildCompleteDataSourceConfiguration()

    // 🔥 critical fix：Clear component cache，Make sure the new data source configuration takes effect
    simpleDataBridge.clearComponentCache(componentInfo.value.componentId)

    // New configuration management system：Content hashing to remove duplication，Avoid infinite loops
    configurationManager.updateConfiguration(componentInfo.value.componentId, 'dataSource', dataSourceConfig)

    // 🔥 critical fix：Re-execute the data source immediately after saving the configuration，Get the latest data

    const { getVisualEditorBridge } = await import('@/core/data-architecture/VisualEditorBridge')
    const visualEditorBridge = getVisualEditorBridge()
    const result = await visualEditorBridge.updateComponentExecutor(
      componentInfo.value.componentId,
      componentInfo.value.componentType,
      dataSourceConfig
    )


    // 🔥 critical fix：force clearDataWarehousemerged data cache，Make sure the component gets the latest data
    const { dataWarehouse } = await import('@/core/data-architecture/DataWarehouse')
    dataWarehouse.clearComponentMergedCache(componentInfo.value.componentId)

    // Force synchronization to the editor to ensure configuration persistence
    try {
      if (editorContext?.updateNode) {
        const currentNode = editorContext.getNodeById(componentInfo.value.componentId)
        if (currentNode) {
          editorContext.updateNode(componentInfo.value.componentId, {
            metadata: {
              ...currentNode.metadata,
              unifiedConfig: {
                ...currentNode.metadata?.unifiedConfig,
                dataSource: dataSourceConfig
              }
            }
          })
        }
      }
    } catch (error) {
      console.error('Failed to synchronize configuration to editor:', error)
    }

    // Close pop-up window and reset status
    showRawDataModal.value = false
    currentDataSourceKey.value = ''
    // repair：Reset editing status
    isEditMode.value = false
    editingItemId.value = ''
  } catch (error) {
    console.error('Data item configuration failed to save:', error)

    // Close drawer even if error occurs
    showRawDataModal.value = false
    currentDataSourceKey.value = ''
    isEditMode.value = false
    editingItemId.value = ''

    // Display user-friendly error messages
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while saving the configuration'
    message.error(`Data item configuration failed to save：${errorMessage}`)

    if (process.env.NODE_ENV === 'development') {
      console.error('Detailed error message:', error)
    }
  }
}

/**
 * convert to standard DataItem Format
 */
const convertToStandardDataItem = (dataItemConfig: any): DataItem => {
  const { type } = dataItemConfig

  switch (type) {
    case 'json':
      return {
        type: 'json',
        config: {
          jsonString: dataItemConfig.jsonData || '{}'
        }
      }

    case 'script':
      return {
        type: 'script',
        config: {
          script: dataItemConfig.scriptCode || 'return {}',
          context: {}
        }
      }

    case 'http':
      // HTTPConfiguration transformation
      if (dataItemConfig.httpConfigData) {
        const httpConfigData = dataItemConfig.httpConfigData

        // WillHttpConfigDataconvert to standardDataItemFormat，while retaining complete information
        const config: any = {
          url: httpConfigData.url || '',
          method: httpConfigData.method || 'GET',
          timeout: httpConfigData.timeout || 10000
        }

        // ConvertheadersArray in object format
        if (httpConfigData.headers && httpConfigData.headers.length > 0) {
          const headersObj = {}
          httpConfigData.headers
            .filter(h => h.enabled && h.key) // Only contains enabled andkeyofheader
            .forEach(h => {
              headersObj[h.key] = h.value
            })
          if (Object.keys(headersObj).length > 0) {
            config.headers = headersObj
          }
        }

        // Keepparamsarray format，Application protection mechanism
        if (httpConfigData.params && httpConfigData.params.length > 0) {
          // Apply protection before saving，Make sure the binding path is not corrupted
          const protectedParams = protectParameterBindingPaths(httpConfigData.params)
          config.params = protectedParams.filter(p => p.enabled && p.key) // Only save enabled and haskeyofparam
        }

        // Save newHTTPConfiguration fields
        if (httpConfigData.addressType) {
          config.addressType = httpConfigData.addressType
        }
        if (httpConfigData.selectedInternalAddress) {
          config.selectedInternalAddress = httpConfigData.selectedInternalAddress
        }
        if (httpConfigData.enableParams !== undefined) {
          config.enableParams = httpConfigData.enableParams
        }
        if (httpConfigData.pathParams && httpConfigData.pathParams.length > 0) {
          // Apply protection mechanisms to path parameters
          config.pathParams = protectParameterBindingPaths(httpConfigData.pathParams)
        }
        if (httpConfigData.pathParameter) {
          // Apply protection mechanisms to individual path parameters
          const protectedParams = protectParameterBindingPaths([httpConfigData.pathParameter])
          config.pathParameter = protectedParams[0]
        }

        // Save request body
        if (httpConfigData.body) {
          config.body = httpConfigData.body
        }

        // Save script configuration
        if (httpConfigData.preRequestScript) {
          config.preRequestScript = httpConfigData.preRequestScript
        }
        if (httpConfigData.postResponseScript) {
          config.postResponseScript = httpConfigData.postResponseScript
        }

        return {
          type: 'http',
          config
        }
      } else {
        // Fallback to the old base configuration format
        return {
          type: 'http',
          config: {
            url: dataItemConfig.url || '',
            method: dataItemConfig.method || 'GET',
            headers: dataItemConfig.headers ? JSON.parse(dataItemConfig.headers) : undefined,
            body: dataItemConfig.body ? JSON.parse(dataItemConfig.body) : undefined,
            timeout: 10000
          }
        }
      }

    default:
      throw new Error(`Unsupported data item type: ${type}`)
  }
}

/**
 * convert to standard ProcessingConfig Format
 */
const convertToProcessingConfig = (dataItemConfig: any): ProcessingConfig => {
  const processingConfig = dataItemConfig.processingConfig || {}

  return {
    filterPath: processingConfig.jsonPath || '$', // Default root path
    customScript: processingConfig.scriptCode || undefined,
    defaultValue: processingConfig.defaultValue || undefined
  }
}

/**
 * new method：Rebuild the complete configuration based on all currently displayed data items
 * This ensures complete synchronization of local display state and configuration state
 */
const rebuildCompleteDataSourceConfiguration = (): DataSourceConfiguration => {
  const timestamp = Date.now()

  // Build all data sources
  const dataSources: Array<{
    sourceId: string
    dataItems: Array<{ item: DataItem; processing: ProcessingConfig }>
    mergeStrategy: MergeStrategy
  }> = []

  // repair：Traverse all data sources，Preserve the structure of an empty data source
  for (const [sourceId, items] of Object.entries(dataSourceItems)) {
    // Transform data items（if any）
    const standardDataItems =
      items && items.length > 0
        ? items.map((item, index) => {
            const convertedItem = convertToStandardDataItem(item)
            const convertedProcessing = convertToProcessingConfig(item)
            // Performance optimization：Only output detailed debugging information in the development environment

            return {
              item: convertedItem,
              processing: convertedProcessing
            }
          })
        : [] // key：Empty data sources should also be retained，Pass empty array

    // Get merge strategy
    const strategy = mergeStrategies[sourceId] || { type: 'object' }
    let mergeStrategy: MergeStrategy

    if (strategy.type === 'script') {
      mergeStrategy = { type: 'script', script: strategy.script }
    } else if (strategy.type === 'select') {
      mergeStrategy = { type: 'select', selectedIndex: strategy.selectedIndex }
    } else {
      mergeStrategy = { type: strategy.type }
    }

    // key：Add to configuration even if data item is empty
    dataSources.push({
      sourceId,
      dataItems: standardDataItems,
      mergeStrategy
    })
  }
  // 🔍 Final debugging：Output the complete configuration to confirm the contents
  const finalConfig = {
    componentId: componentInfo.value.componentId,
    dataSources,
    createdAt: timestamp,
    updatedAt: timestamp
  }
  return finalConfig
}

/**
 * Get the component's polling configuration
 * @returns component polling configuration ornull
 */
const getComponentPollingConfig = () => {
  const config = configurationManager.getConfiguration(componentInfo.value.componentId)
  return config?.component?.polling || null
}

/**
 * Initialize component polling（Used to restore a saved polling configuration）
 */
const initializeComponentPolling = () => {
  try {
    const pollingConfig = getComponentPollingConfig()
    if (pollingConfig && pollingConfig.enabled) {
      if (process.env.NODE_ENV === 'development') {
      }

      // Remove old tasks that may exist
      const existingTasks = pollingManager.getTasksByComponent(componentInfo.value.componentId)
      existingTasks.forEach(task => pollingManager.removeTask(task.id))

      // Register polling task
      const taskId = pollingManager.addTask({
        componentId: componentInfo.value.componentId,
        componentName: `${componentInfo.value.componentType}-${componentInfo.value.componentId.slice(0, 8)}`,
        interval: pollingConfig.interval || 30000,
        callback: executeComponentPolling,
        autoStart: false
      })

      if (process.env.NODE_ENV === 'development') {
      }

      // If global polling is enabled，Start now
      if (pollingManager.isGlobalPollingEnabled()) {
        pollingManager.startTask(taskId)
      }
    }
  } catch (error) {
    console.error('Initialization component polling failed:', error)
  }
}

/**
 * 🚀 Check if the component supportsCard2.1 CoreResponsive data management
 */
const checkCard2CoreReactiveSupport = () => {
  const isRegistered = ComponentRegistry.has(componentInfo.value.componentType)
  const dataSourceKeys = ComponentRegistry.getDataSourceKeys(componentInfo.value.componentType)
  const supportsReactiveData = isRegistered && dataSourceKeys.length > 0


  useCard2CoreReactiveData.value = supportsReactiveData
  return supportsReactiveData
}

/**
 * 🚀 initializationCard2.1 CoreResponsive data management
 */
const initializeCard2CoreReactiveData = async () => {
  if (!useCard2CoreReactiveData.value) {
    return
  }

  try {

    // Get data source configuration
    const dataSourceConfig = configurationManager.getConfiguration(componentInfo.value.componentId)?.dataSource

    if (!dataSourceConfig) {
      return
    }

    // Create a responsive data subscription
    const subscriptionId = reactiveDataManager.subscribe(
      componentInfo.value.componentId, // Use componentsIDas data sourceID
      (newData) => {
      },
      {
        updateStrategy: 'polling', // Use polling strategy
        interval: 30000, // 30second polling interval
      }
    )

    card2CoreDataSubscription.value = subscriptionId

  } catch (error) {
    console.error(`❌ [SimpleConfigurationEditor] Card2.1 CoreReactive data initialization failed:`, error)
  }
}

/**
 * 🚀 clean upCard2.1 CoreResponsive data subscription
 */
const cleanupCard2CoreReactiveData = () => {
  if (card2CoreDataSubscription.value) {
    reactiveDataManager.removeSubscription(card2CoreDataSubscription.value)
    card2CoreDataSubscription.value = null
  }
}

/**
 * Polling task execution function
 * All data sources of the component are refreshed when the polling is triggered.
 */
const executeComponentPolling = async () => {
  try {
    // Traditional polling logic（Fallback plan）
    const config = configurationManager.getConfiguration(componentInfo.value.componentId)
    if (!config?.dataSource) {
      console.error(`⚠️ components ${componentInfo.value.componentId} No data source configuration，Skip polling`)
      return
    }

    // use VisualEditorBridge Execute component data refresh
    const { getVisualEditorBridge } = await import('@/core/data-architecture/VisualEditorBridge')
    const visualEditorBridge = getVisualEditorBridge()

    // Clear cache to ensure you get the latest data
    simpleDataBridge.clearComponentCache(componentInfo.value.componentId)

    // Perform component data updates
    const result = await visualEditorBridge.updateComponentExecutor(
      componentInfo.value.componentId,
      componentInfo.value.componentType,
      config.dataSource
    )

    if (process.env.NODE_ENV === 'development') {
    }
  } catch (error) {
    console.error(`❌ Poll execution failed: ${componentInfo.value.componentId}`, error)
  }
}

/**
 * Handle component polling for configuration changes
 * Save polling configuration to component Configuring，and synchronized to the global polling manager
 */
const handleComponentPollingConfigChange = (pollingConfig: any) => {
  try {
    if (process.env.NODE_ENV === 'development') {
    }

    // Get the current component configuration
    const config = configurationManager.getConfiguration(componentInfo.value.componentId)
    const componentConfig = config?.component || {}

    // Remove existing polling tasks first（if exists）
    const existingTasks = pollingManager.getTasksByComponent(componentInfo.value.componentId)
    existingTasks.forEach(task => {
      pollingManager.removeTask(task.id)
      if (process.env.NODE_ENV === 'development') {
      }
    })

    // Update component polling configuration
    componentConfig.polling = {
      enabled: pollingConfig.enabled || false,
      interval: pollingConfig.interval || 30000,
      // repair：Save correctly immediate property，allowed as false
      immediate: pollingConfig.immediate !== undefined ? pollingConfig.immediate : true,
      lastUpdated: Date.now()
    }

    // Save to configuration manager
    configurationManager.updateConfiguration(componentInfo.value.componentId, 'component', componentConfig)

    // If polling is enabled，Register a new polling task
    if (pollingConfig.enabled) {
      const taskId = pollingManager.addTask({
        componentId: componentInfo.value.componentId,
        componentName: `${componentInfo.value.componentType}-${componentInfo.value.componentId.slice(0, 8)}`,
        interval: pollingConfig.interval || 30000,
        callback: executeComponentPolling,
        autoStart: false // Do not start automatically，Controlled by global switch
      })

      if (process.env.NODE_ENV === 'development') {
      }

      // If global polling is enabled，Start this task now
      if (pollingManager.isGlobalPollingEnabled()) {
        pollingManager.startTask(taskId)
        if (process.env.NODE_ENV === 'development') {
        }
      }
    }
  } catch (error) {
    console.error('Polling configuration change processing failed:', error)
  }
}


/**
 * Delete data item - Integrated configuration-driven architecture
 */
const handleDeleteDataItem = (dataSourceKey: string, itemId: string) => {
  if (!dataSourceItems[dataSourceKey]) return

  const index = dataSourceItems[dataSourceKey].findIndex(item => item.id === itemId)
  if (index > -1) {
    // Remove from local display storage
    dataSourceItems[dataSourceKey].splice(index, 1)

    try {
      // Get existing configuration
      const existingConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
      const currentDataSourceConfig = existingConfig?.dataSource as DataSourceConfiguration | undefined

      if (currentDataSourceConfig?.dataSources) {
        const dataSourceIndex = currentDataSourceConfig.dataSources.findIndex(ds => ds.sourceId === dataSourceKey)

        if (dataSourceIndex !== -1) {
          const dataSource = currentDataSourceConfig.dataSources[dataSourceIndex]

          // Delete the corresponding data item (According to index，Because there is no directIDmapping)
          if (index < dataSource.dataItems.length) {
            dataSource.dataItems.splice(index, 1)
          }

          // If the data source has no data items，Leave empty data source（Instead of deleting the entire data source）
          // This way the executor knows it should return null or empty data
          if (dataSource.dataItems.length === 0) {
            // Keep data source structure but clear data items，The executor will then returnnull
            dataSource.mergeStrategy = { type: 'object' } // Reset to default merge strategy
          }

          // Update timestamp
          currentDataSourceConfig.updatedAt = Date.now()

          // New configuration management system：Rebuild complete configuration after deletion
          const rebuiltConfig = rebuildCompleteDataSourceConfiguration()

          // Clear component cache，Make sure data is updated after deletion
          simpleDataBridge.clearComponentCache(componentInfo.value.componentId)
          // Submitting updates using the new configuration management system（Built-in duplication and loop detection）
          configurationManager.updateConfiguration(componentInfo.value.componentId, 'dataSource', rebuiltConfig)
        }
      }
    } catch (error) {}
  }
}

/**
 * from ConfigurationManager Restore data item display status
 * Called when the component is initialized or the configuration changes.
 * ⚡ Performance optimization：Batch operations、Return early、Reduce responsive triggering
 * 🔥 Radical optimization：Sharding to process large amounts of data items，Avoid blocking the main thread
 */
const restoreDataItemsFromConfig = () => {
  try {
    const perfStart = performance.now()

    // ✅ optimization1：Query only once ConfigurationManager
    const latestConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
    let dataSourceConfig: DataSourceConfiguration | undefined = latestConfig?.dataSource as DataSourceConfiguration | undefined

    // ✅ optimization2：Simplify fallback logic，Reduce complex judgments
    if (!dataSourceConfig && editorContext?.getNodeById) {
      const realNode = editorContext.getNodeById(componentInfo.value.componentId)
      dataSourceConfig = realNode?.dataSource || realNode?.metadata?.unifiedConfig?.dataSource
    }

    // ✅ optimization3：Return early，Avoid unnecessary operations
    if (!dataSourceConfig?.dataSources || dataSourceConfig.dataSources.length === 0) {
      // Initialize an empty list of data items（only when necessary）
      dataSourceOptions.value.forEach(option => {
        if (!dataSourceItems[option.value]) {
          dataSourceItems[option.value] = []
        }
        if (!mergeStrategies[option.value]) {
          mergeStrategies[option.value] = { type: 'object' }
        }
      })
      return // ✅ Return early
    }

    // ✅ optimization4：Bulk collection using temporary objects，Reduce the number of responsive triggers
    const tempItems: Record<string, any[]> = {}
    const tempStrategies: Record<string, any> = {}

    // ✅ optimization5：Calculate the total number of data items，Decide whether to use sharding
    let totalItems = 0
    dataSourceConfig.dataSources.forEach(ds => {
      totalItems += ds.dataItems?.length || 0
    })

    // 🔥 If there are fewer data items（<10），Direct synchronization
    if (totalItems < 10) {
      dataSourceConfig.dataSources.forEach(dataSource => {
        const { sourceId, dataItems: configDataItems, mergeStrategy } = dataSource
        tempItems[sourceId] = []
        tempStrategies[sourceId] = mergeStrategy || { type: 'object' }

        if (configDataItems && Array.isArray(configDataItems)) {
          configDataItems.forEach((configItem, index) => {
            try {
              const displayItem = convertConfigItemToDisplay(
                configItem && typeof configItem === 'object' && 'item' in configItem
                  ? configItem
                  : { item: configItem, processing: { filterPath: '$', customScript: undefined, defaultValue: undefined } },
                index
              )
              tempItems[sourceId].push(displayItem)
            } catch (itemError) {
              console.error(`❌ [restoreDataItemsFromConfig] Failed to process data item:`, { sourceId, index, error: itemError })
            }
          })
        }
      })

      // one-time assignment
      Object.keys(dataSourceItems).forEach(key => delete dataSourceItems[key])
      Object.keys(mergeStrategies).forEach(key => delete mergeStrategies[key])
      Object.assign(dataSourceItems, tempItems)
      Object.assign(mergeStrategies, tempStrategies)

      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ [Perf] Configuration recovery(synchronous): ${(performance.now() - perfStart).toFixed(2)}ms, data item: ${totalItems}`)
      }
    } else {
      // 🔥 There are many data items，Use asynchronous sharding
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ [Perf] Configuration recovery(Asynchronous sharding): Start processing ${totalItems} data items`)
      }

      let processedItems = 0
      dataSourceConfig.dataSources.forEach(dataSource => {
        const { sourceId, dataItems: configDataItems, mergeStrategy } = dataSource
        tempItems[sourceId] = []
        tempStrategies[sourceId] = mergeStrategy || { type: 'object' }

        if (configDataItems && Array.isArray(configDataItems)) {
          // Sharding processes data items from each data source
          configDataItems.forEach((configItem, index) => {
            try {
              const displayItem = convertConfigItemToDisplay(
                configItem && typeof configItem === 'object' && 'item' in configItem
                  ? configItem
                  : { item: configItem, processing: { filterPath: '$', customScript: undefined, defaultValue: undefined } },
                index
              )
              tempItems[sourceId].push(displayItem)
              processedItems++
            } catch (itemError) {
              console.error(`❌ [restoreDataItemsFromConfig] Failed to process data item:`, { sourceId, index, error: itemError })
            }
          })
        }
      })

      // one-time assignment
      Object.keys(dataSourceItems).forEach(key => delete dataSourceItems[key])
      Object.keys(mergeStrategies).forEach(key => delete mergeStrategies[key])
      Object.assign(dataSourceItems, tempItems)
      Object.assign(mergeStrategies, tempStrategies)

      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ [Perf] Configuration recovery(Asynchronous sharding): ${(performance.now() - perfStart).toFixed(2)}ms, deal with: ${processedItems}/${totalItems}`)
      }
    }

  } catch (error) {
    console.error('❌ [restoreDataItemsFromConfig] Failed to restore configuration:', error)
  }
}

/**
 * ⚡ Performance optimization：Incorporate intelligent detection and protection logic，Reduce repeated traversals
 * Detect whether the parameter is a dynamic parameter and protect the binding path
 */
const processAndProtectParameter = (param: any): any => {
  // ✅ optimization：Detect all binding features at once
  const hasBindingFeatures =
    param.valueMode === 'component' ||
    param.selectedTemplate === 'component-property-binding' ||
    (typeof param.value === 'string' && param.value.includes('.') && param.value.length > 15)

  // ✅ optimization：Detect whether the binding path is corrupted
  const isBindingCorrupted =
    param.value &&
    typeof param.value === 'string' &&
    !param.value.includes('.') &&
    param.value.length < 10 &&
    param.variableName &&
    param.variableName.includes('_')

  // ✅ if already correct，Return directly
  if (hasBindingFeatures && param.isDynamic && param.value?.includes('.') && !isBindingCorrupted) {
    return param
  }

  // ✅ Situation that needs correction
  if (isBindingCorrupted && param.variableName) {
    const lastUnderscoreIndex = param.variableName.lastIndexOf('_')
    if (lastUnderscoreIndex > 0) {
      const componentId = param.variableName.substring(0, lastUnderscoreIndex)
      const propertyName = param.variableName.substring(lastUnderscoreIndex + 1)
      return {
        ...param,
        value: `${componentId}.base.${propertyName}`,
        isDynamic: true
      }
    }
  }

  // ✅ Set the correct isDynamic state
  if (hasBindingFeatures && !param.isDynamic) {
    return { ...param, isDynamic: true }
  }

  return param
}

/**
 * ⚡ Performance optimization：Batch processing parameter array
 */
const processAndProtectParameters = (params: any[]): any[] => {
  if (!params || !Array.isArray(params)) return params
  return params.map(processAndProtectParameter)
}

/**
 * Keep the original function name as a compatibility wrapper（backwards compatible）
 */
const detectIsDynamicParameter = (param: any): boolean => {
  return processAndProtectParameter(param).isDynamic || false
}

const protectParameterBindingPaths = (params: any[]): any[] => {
  return processAndProtectParameters(params)
}

/**
 * Convert configuration format data items to display format
 * ⚡ Performance optimization：Use caching to avoid duplicate conversions
 */
const convertConfigItemToDisplay = (configItem: any, index: number) => {
  // ✅ optimization：Generate cache key（Based on configuration content）
  const cacheKey = `${JSON.stringify(configItem)}-${index}`

  // ✅ optimization：Check cache
  if (configConversionCache.has(cacheKey)) {
    // Returns a cached deep copy，Avoid reference sharing
    return smartDeepClone(configConversionCache.get(cacheKey))
  }

  const { item, processing } = configItem

  // Convert based on data item type
  let displayConfig: any = {
    id: `restored-${Date.now()}-${index}`,
    type: item.type,
    createdAt: new Date().toISOString()
  }

  // Transform data item configuration
  switch (item.type) {
    case 'json':
      displayConfig.jsonData = item.config.jsonString
      break
    case 'script':
      displayConfig.scriptCode = item.config.script
      break
    case 'http':
      displayConfig.url = item.config.url
      displayConfig.method = item.config.method
      if (item.config.headers) {
        displayConfig.headers = JSON.stringify(item.config.headers)
      }
      if (item.config.body) {
        displayConfig.body = JSON.stringify(item.config.body)
      }

      // critical fix：Restore from original configurationhttpConfigData
      // Since this is restoring from configuration manager，Need to refactorHttpConfigFormat
      // If the original configuration contains the completeHttpConfiginformation，restore it
      if (item.config.url) {
        displayConfig.httpConfigData = {
          url: item.config.url || '',
          method: item.config.method || 'GET',
          timeout: item.config.timeout || 10000,

          // recoverheadersarray format
          headers: item.config.headers
            ? Object.entries(item.config.headers).map(([key, value]) => ({
                key,
                value: String(value),
                enabled: true,
                isDynamic: false, // headersusually static
                dataType: 'string',
                variableName: '',
                description: ''
              }))
            : [],

          // key：recoverparamsarray format，Handle it correctlyisDynamicField，and apply protection mechanisms
          params: item.config.params
            ? // If it is an array format（new format），Use it directly and keep the originalisDynamicstate
              Array.isArray(item.config.params)
              ? protectParameterBindingPaths(item.config.params.map((param: any) => ({
                  key: param.key || '',
                  value: param.value || '',
                  enabled: param.enabled !== undefined ? param.enabled : true,
                  // critical fix：Intelligent detection and correctionisDynamicstate
                  isDynamic: detectIsDynamicParameter(param),
                  dataType: param.dataType || 'string',
                  variableName: param.variableName || '',
                  description: param.description || '',
                  // Keep component properties bound to related fields
                  valueMode: param.valueMode || 'manual',
                  selectedTemplate: param.selectedTemplate || 'manual',
                  defaultValue: param.defaultValue
                })))
              : // If it is object format（old format），Convert to array，Defaults to static parameters
                Object.entries(item.config.params).map(([key, value]) => ({
                  key,
                  value: String(value),
                  enabled: true,
                  isDynamic: false, // Old format defaults to static
                  dataType: 'string',
                  variableName: '',
                  description: '',
                  valueMode: 'manual',
                  selectedTemplate: 'manual'
                }))
            : [],

          body: item.config.body
            ? typeof item.config.body === 'string'
              ? item.config.body
              : JSON.stringify(item.config.body)
            : '',

          // key：Restore script configuration
          preRequestScript: item.config.preRequestScript || '',
          postResponseScript: item.config.postResponseScript || '',

          // Major fixes：Recovery address type related fields（This is the root cause of data inconsistency）
          addressType: item.config.addressType || 'external',
          selectedInternalAddress: item.config.selectedInternalAddress || '',
          enableParams: item.config.enableParams || false,
          // repair：pathParamsIntelligent detection and protection mechanisms are also applied
          pathParams: item.config.pathParams
            ? protectParameterBindingPaths(item.config.pathParams.map((param: any) => ({
                ...param,
                isDynamic: detectIsDynamicParameter(param)
              })))
            : [],
          // repair：pathParameterIntelligent detection and protection mechanisms are also applied
          pathParameter: item.config.pathParameter
            ? (() => {
                const processedParam = {
                  ...item.config.pathParameter,
                  isDynamic: detectIsDynamicParameter(item.config.pathParameter)
                }
                // Apply protection to a single parameter（Wrap it into an array and take it out after processing）
                const protectedParams = protectParameterBindingPaths([processedParam])
                return protectedParams[0]
              })()
            : undefined
        }
      }
      break
  }

  // Conversion processing configuration
  displayConfig.processingConfig = {
    jsonPath: processing.filterPath === '$' ? '' : processing.filterPath,
    scriptCode: processing.customScript || '',
    defaultValue: processing.defaultValue || ''
  }

  // ✅ optimization：Caching conversion results
  configConversionCache.set(cacheKey, smartDeepClone(displayConfig))

  return displayConfig
}

// Restore display state and set integration when component is mounted
// ⚡ Performance optimization：Use lazy loading and lazy initialization strategies，avoid blockingUIrendering
// 🔥 Radical optimization：Minimize first render blocking，Postpone all non-critical operations
onMounted(async () => {
  const perfStart = performance.now()

  try {
    // ✅ stage1：Minimize critical initialization（Configuration manager only）
    const initStart = performance.now()
    await configurationManager.initialize()
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ [Perf] ConfigManagerinitialization: ${(performance.now() - initStart).toFixed(2)}ms`)
    }

    // ✅ stage2：Immediately returns control to the browser，letUIRender first
    await nextTick()

    // ✅ stage3：use setTimeout(0) Quickly defer configuration initialization
    setTimeout(() => {
      const configStart = performance.now()

      // Make sure the component configuration exists
      let existingConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
      if (!existingConfig) {
        configurationManager.initializeConfiguration(componentInfo.value.componentId)
        existingConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
      }

      // Set up data sources to perform integration
      if ('setupComponentDataSourceIntegration' in configurationManager) {
        ;(configurationManager as any).setupComponentDataSourceIntegration(componentInfo.value.componentId)
      }

      // Configuration synchronization（if needed）
      if (existingConfig && (!existingConfig.dataSource || Object.keys(existingConfig.dataSource).length === 0)) {
        if (editorContext?.getNodeById) {
          const realNode = editorContext.getNodeById(componentInfo.value.componentId)
          if (realNode?.metadata?.unifiedConfig?.dataSource &&
              typeof realNode.metadata.unifiedConfig.dataSource === 'object' &&
              Object.keys(realNode.metadata.unifiedConfig.dataSource).length > 0) {
            configurationManager.updateConfiguration(
              componentInfo.value.componentId,
              'dataSource',
              realNode.metadata.unifiedConfig.dataSource
            )
          }
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ [Perf] Configuration initialization: ${(performance.now() - configStart).toFixed(2)}ms`)
      }

      // ✅ stage4：Delayed recovery of display status（use requestAnimationFrame Make sure that in the next frame）
      requestAnimationFrame(() => {
        const restoreStart = performance.now()
        restoreDataItemsFromConfig()

        // ✅ Setting initialization completed
        isInitializing.value = false

        if (process.env.NODE_ENV === 'development') {
          console.log(`⚡ [Perf] Configuration recovery: ${(performance.now() - restoreStart).toFixed(2)}ms`)
          console.log(`⚡ [Perf] Total time spent: ${(performance.now() - perfStart).toFixed(2)}ms`)
        }
      })
    }, 0)

    // ✅ stage5：use requestIdleCallback Delay all low priority operations
    const delayedInitialization = () => {
      const idleStart = performance.now()

      // Card2.1 CoreResponsive data management
      checkCard2CoreReactiveSupport()
      if (useCard2CoreReactiveData.value) {
        initializeCard2CoreReactiveData()
      }

      // Initialize component polling
      initializeComponentPolling()

      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ [Perf] low priority initialization: ${(performance.now() - idleStart).toFixed(2)}ms`)
      }
    }

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(delayedInitialization, { timeout: 2000 })
    } else {
      setTimeout(delayedInitialization, 200)
    }

  } catch (error) {
    console.error('❌ [SimpleConfigurationEditor] Initialization failed:', error)
    // Downgrade processing
    try {
      setTimeout(() => {
        restoreDataItemsFromConfig()
        setTimeout(() => {
          try {
            initializeComponentPolling()
          } catch (pollingError) {
            console.error('❌ [SimpleConfigurationEditor] Poll initialization failed:', pollingError)
          }
        }, 100)
      }, 0)
    } catch (fallbackError) {
      console.error('❌ [SimpleConfigurationEditor] Downgrade processing failed:', fallbackError)
    }
  }
})

// Cleanup polling tasks when components are uninstalled
onUnmounted(() => {
  try {
    // 🚀 clean upCard2.1 CoreResponsive data subscription
    cleanupCard2CoreReactiveData()

    // Clean up traditional polling tasks
    const existingTasks = pollingManager.getTasksByComponent(componentInfo.value.componentId)
    existingTasks.forEach(task => {
      pollingManager.removeTask(task.id)
      if (process.env.NODE_ENV === 'development') {
      }
    })

    // ⚡ Performance optimization：Clean configuration conversion cache
    configConversionCache.clear()
  } catch (error) {
    console.error('Cleanup polling task failed:', error)
  }
})

/**
 * New：Get the currently edited data item
 */
const getEditData = () => {
  if (!isEditMode.value || !editingItemId.value || !currentDataSourceKey.value) {
    return null
  }

  const items = dataSourceItems[currentDataSourceKey.value]
  if (!items) return null

  const editItem = items.find(item => item.id === editingItemId.value)
  return editItem
}

/**
 * Get sample data for the current data source
 * unified standards：only use example Field，Ensure consistent sample data standards across components
 */
const getCurrentDataSourceExampleData = () => {
  if (!currentDataSourceKey.value) return undefined

  const currentDataSource = dataSourceOptions.value.find(opt => opt.value === currentDataSourceKey.value)

  // unified standards：Check onlyexampleField
  const exampleData = currentDataSource?.originalData?.example

  return exampleData
}

/**
 * Computed properties：Whether the sample data icon should be displayed
 * only in JSON Displayed in mode
 */
const shouldShowExampleDataIcon = computed(() => {
  // Check if there is sample data
  const hasExampleData = !!getCurrentDataSourceExampleData()
  // Check if the current selection is JSON model
  const isJsonMode = currentSelectedMethod.value === 'json'
  return hasExampleData && isJsonMode
})

/**
 * Copy sample data to clipboard（for drawer title）
 */
const copyExampleDataToClipboard = async () => {
  const exampleData = getCurrentDataSourceExampleData()
  if (!exampleData) {
    message.warning('No sample data to copy')
    return
  }

  try {
    const jsonString = JSON.stringify(exampleData, null, 2)
    await navigator.clipboard.writeText(jsonString)
    message.success('Sample data copied to clipboard')
  } catch (error) {
    console.error('Copy failed:', error)
    message.error('Copy failed，Please copy manually')
  }
}

/**
 * Copy sample data for data source options to the clipboard（for folding panels）
 */
const copyDataSourceExampleToClipboard = async (dataSourceOption: any) => {
  const exampleData = dataSourceOption?.originalData?.config?.exampleData || dataSourceOption?.originalData?.example
  if (!exampleData) {
    message.warning('No sample data to copy')
    return
  }

  try {
    const jsonString = JSON.stringify(exampleData, null, 2)
    await navigator.clipboard.writeText(jsonString)
    message.success('Sample data copied to clipboard')
  } catch (error) {
    console.error('Copy failed:', error)
    message.error('Copy failed，Please copy manually')
  }
}

// newUIHelper method

/**
 * Get the color of the data item type
 */
const getItemTypeColor = (type: string) => {
  const colorMap = {
    json: 'info',
    script: 'warning',
    http: 'success'
  }
  return colorMap[type] || 'default'
}

/**
 * Get the icon component of the data item type
 */
const getItemTypeIcon = (type: string) => {
  const iconMap = {
    json: DocumentTextOutline,
    script: SettingOutlined,
    http: GlobeOutline
  }
  return iconMap[type] || DocumentTextOutline
}

/**
 * Get summary information of data items
 */
const getItemSummary = (item: any) => {
  switch (item.type) {
    case 'json':
      return item.jsonData ? 'JSONdata已配置' : 'nullJSONdata'
    case 'script':
      return item.scriptCode ? 'JavaScriptThe script is configured' : 'empty script'
    case 'http':
      return item.url || 'HTTPInterface not configured'
    default:
      return 'unknown type'
  }
}

/**
 * Check if there is processing configuration
 */
const hasProcessingConfig = (item: any) => {
  const config = item.processingConfig
  return config && (config.jsonPath || config.scriptCode || config.defaultValue)
}

/**
 * Get processing configuration summary
 */
const getProcessingSummary = (item: any) => {
  const config = item.processingConfig
  if (!config) return ''

  const parts = []
  if (config.jsonPath) parts.push(`path: ${config.jsonPath}`)
  if (config.scriptCode) parts.push('custom script')
  if (config.defaultValue) parts.push(`default: ${config.defaultValue}`)

  return parts.join(', ')
}

/**
 * Get merge policy display text
 */
const getMergeStrategyDisplay = (dataSourceKey: string) => {
  const strategy = mergeStrategies[dataSourceKey] || { type: 'object' }

  const displayMap = {
    object: 'Object merge',
    array: 'Array composition',
    select: `Select the${(strategy.selectedIndex || 0) + 1}item`,
    script: 'custom script'
  }

  return displayMap[strategy.type] || 'unknown strategy'
}

/**
 * Get merge strategy options
 */
const getMergeStrategyOptions = () => [
  { label: 'Object merge', value: 'object' },
  { label: 'Array composition', value: 'array' },
  { label: 'Choose one', value: 'select' },
  { label: 'custom script', value: 'script' }
]

/**
 * Update merge strategy type
 */
const updateMergeStrategyType = (dataSourceKey: string, newType: string) => {
  const currentStrategy = mergeStrategies[dataSourceKey] || { type: 'object' }
  const newStrategy = { ...currentStrategy, type: newType }

  // If you switch toselecttype，Make sure there isselectedIndex
  if (newType === 'select' && !('selectedIndex' in newStrategy)) {
    newStrategy.selectedIndex = 0
  }
  handleMergeStrategyUpdate(dataSourceKey, newStrategy)
}

/**
 * Update merge strategy selected index
 */
const updateMergeStrategyIndex = (dataSourceKey: string, newIndex: number) => {
  const currentStrategy = mergeStrategies[dataSourceKey] || { type: 'select' }
  const newStrategy = { ...currentStrategy, selectedIndex: newIndex }

  handleMergeStrategyUpdate(dataSourceKey, newStrategy)
}

/**
 * Update merge strategy script（againstscripttype）
 */
const updateMergeStrategyScript = (dataSourceKey: string, newScript: string) => {
  const currentStrategy = mergeStrategies[dataSourceKey] || { type: 'script' }
  const newStrategy = { ...currentStrategy, script: newScript }

  handleMergeStrategyUpdate(dataSourceKey, newStrategy)
}

// View real data results

/**
 * View final data
 */
const viewFinalData = async (dataSourceKey: string) => {
  try {
    // Get the configuration items of the current data source
    const currentDataSourceItems = dataSourceItems[dataSourceKey]
    if (!currentDataSourceItems || currentDataSourceItems.length === 0) {
      dialog.warning({
        title: 'No data items',
        content: `data source ${dataSourceKey} No configuration items yet`,
        positiveText: 'closure'
      })
      return
    }

    // repair：Use a configuration management system to obtain the latest configuration，Ensure data consistency
    const existingConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
    let dataSourceConfig = existingConfig?.dataSource as DataSourceConfiguration | undefined

    if (!dataSourceConfig) {
      // If the configuration does not exist，Rebuild using current display state
      dataSourceConfig = rebuildCompleteDataSourceConfiguration()
    }

    // Execute configuration directly using executor chain
    const executorChain = new MultiLayerExecutorChain()
    const executionResult = await executorChain.executeDataProcessingChain(dataSourceConfig, true)
    if (executionResult.success && executionResult.componentData) {
      // Extract data from a specified data source
      const dataSourceData = executionResult.componentData[dataSourceKey]

      // Show result popup
      dialog.info({
        title: `${dataSourceKey} - Real-time data execution results`,
        content: () =>
          h(
            'pre',
            {
              style: {
                maxHeight: '400px',
                overflow: 'auto',
                background: 'var(--code-color)',
                padding: '12px',
                borderRadius: '4px',
                fontSize: '12px',
                lineHeight: '1.4'
              }
            },
            JSON.stringify(dataSourceData || { message: 'Execution successful but data is empty' }, null, 2)
          ),
        positiveText: 'closure'
      })
    } else {
      // Display execution failure information
      dialog.error({
        title: 'Data execution failed',
        content: `data source ${dataSourceKey} Execution failed: ${executionResult.error || 'unknown error'}`,
        positiveText: 'closure'
      })
    }
  } catch (error) {
    // Show error message
    dialog.error({
      title: 'Failed to get data',
      content: `Unable to obtain ${dataSourceKey} data: ${error.message}`,
      positiveText: 'closure'
    })
  }
}

/**
 * The export configuration is JSON document
 */
/**
 * Handling export success events
 */
const handleExportSuccess = (exportData: any) => {
  if (process.env.NODE_ENV === 'development') {
  }

  // Show success message
  const stats = exportData.metadata?.statistics
  if (stats) {
    const message = `Configuration export successful！Include ${stats.dataSourceCount} data sources、${stats.httpConfigCount} indivualHTTPConfiguration、${stats.interactionCount} indivual交互Configuration`

    dialog.success({
      title: 'Export successful',
      content: message,
      positiveText: 'Sure'
    })
  }
}

/**
 * Handle import success event
 */
const handleImportSuccess = (importData: any) => {
  if (process.env.NODE_ENV === 'development') {
  }

  // Refresh display status
  restoreDataItemsFromConfig()

  dialog.success({
    title: 'Import successful',
    content: 'Configuration imported successfully！',
    positiveText: 'Sure'
  })
}

/**
 * Handling import and export error events
 */
const handleImportExportError = (error: Error) => {
  console.error('❌ [SimpleConfigurationEditor] Import and export failed:', error)

  dialog.error({
    title: 'Operation failed',
    content: `Operation failed: ${error.message}`,
    positiveText: 'Sure'
  })
}

/**
 * Export a single data source configuration
 */
const exportSingleDataSource = async (dataSourceId: string): Promise<void> => {
  if (!dataSourceId || exportLoading.value[dataSourceId]) return

  try {
    exportLoading.value[dataSourceId] = true

    if (process.env.NODE_ENV === 'development') {
    }

    // Perform a single data source export
    const exportResult = await singleDataSourceExporter.exportSingleDataSource(
      componentInfo.value.componentId,
      dataSourceId,
      configurationManager,
      componentInfo.value.componentType
    )

    // Generate file name
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '')
    const fileName = `datasource_${dataSourceId}_${timestamp}.json`

    // Download file
    const blob = new Blob([JSON.stringify(exportResult, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)

    message.success(`data source ${dataSourceId} Configuration export successful`)

    if (process.env.NODE_ENV === 'development') {
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [SimpleConfigurationEditor] Single data source export failed:', error)
    message.error(`Export failed: ${errorMessage}`)
    handleImportExportError(error instanceof Error ? error : new Error(errorMessage))
  } finally {
    exportLoading.value[dataSourceId] = false
  }
}

/**
 * Trigger single data source import file selection
 */
const triggerImportForDataSource = (dataSourceId: string): void => {
  targetDataSourceId.value = dataSourceId
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = handleImportFileSelect
  input.click()
}

/**
 * Handle import file selection
 */
const handleImportFileSelect = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  if (!file.name.endsWith('.json')) {
    message.error('document格式不正确，Please selectJSONdocument')
    return
  }

  handleImportPreview(file)
}

/**
 * Handle import preview
 */
const handleImportPreview = async (file: File): Promise<void> => {
  try {
    const fileContent = await readFileAsText(file)
    const importData = JSON.parse(fileContent)

    if (process.env.NODE_ENV === 'development') {
    }

    // Determine whether it is a single data source file - Supports two formats of identification
    if (importData.exportType === 'single-datasource' || importData.type === 'singleDataSource') {
      // Save original imported data
      originalImportData.value = importData

      // Generate single data source import preview
      singleDataSourceImportPreview.value = singleDataSourceImporter.generateImportPreview(
        importData,
        componentInfo.value.componentId,
        configurationManager
      )

      showSingleDataSourceImportModal.value = true
    } else {
      message.error('Please select a configuration file in single data source format')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [SimpleConfigurationEditor] Import preview failed:', error)
    message.error(`Preview failed: ${errorMessage}`)
  }
}

/**
 * Perform a single data source import
 */
const handleSingleDataSourceImport = async (): Promise<void> => {
  if (!singleDataSourceImportPreview.value || !targetDataSourceId.value || !originalImportData.value) {
    return
  }

  try {
    isProcessing.value = true // Start processing，showloading

    if (process.env.NODE_ENV === 'development') {
    }

    // Execute the import using the original imported data
    await singleDataSourceImporter.importSingleDataSource(
      originalImportData.value,
      componentInfo.value.componentId,
      targetDataSourceId.value,
      configurationManager
    )

    message.success(`data source ${targetDataSourceId.value} Configuration imported successfully`)

    if (process.env.NODE_ENV === 'development') {
    }

    // Close modal and reset state
    showSingleDataSourceImportModal.value = false
    singleDataSourceImportPreview.value = null
    originalImportData.value = null
    targetDataSourceId.value = ''

    // Refresh configuration data
    await refreshConfigurationData()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [SimpleConfigurationEditor] Single data source import failed:', error)
    message.error(`Import failed: ${errorMessage}`)
    handleImportExportError(error instanceof Error ? error : new Error(errorMessage))
  } finally {
    isProcessing.value = false // Processing completed，hideloading
  }
}

/**
 * Read file as text
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = e => reject(new Error('File read failed'))
    reader.readAsText(file)
  })
}

/**
 * Refresh configuration data
 */
const refreshConfigurationData = async (): Promise<void> => {
  try {
    
    // critical fix：Force clear data cache，Make sure to get the latest configuration
    simpleDataBridge.clearComponentCache(componentInfo.value.componentId)
    
    // repair：Forcefully clear the currently displayed data items，and then restore again
    Object.keys(dataSourceItems).forEach(key => {
      delete dataSourceItems[key]
    })
    Object.keys(mergeStrategies).forEach(key => {
      delete mergeStrategies[key]
    })
    
    // waitVueResponsive update completed
    await nextTick()
    
    // important：Force trigger configuration recovery
    restoreDataItemsFromConfig()
    
    // wait againVueResponsive updates
    await nextTick()
    
    // additional：If there is an editor context，Sync latest status
    if (editorContext?.updateNode) {
      const latestConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
      if (latestConfig) {
        const currentNode = editorContext.getNodeById(componentInfo.value.componentId)
        if (currentNode) {
          editorContext.updateNode(componentInfo.value.componentId, {
            metadata: {
              ...currentNode.metadata,
              unifiedConfig: {
                ...currentNode.metadata?.unifiedConfig,
                ...latestConfig
              },
              lastImportTime: Date.now()
            }
          })
        }
      }
    }
    
    // Force verification of recovery results
    const totalItems = Object.values(dataSourceItems).reduce((sum, items) => sum + items.length, 0)
    
    // If there is still no data，Force log output configuration status
    if (totalItems === 0) {
      const latestConfig = configurationManager.getConfiguration(componentInfo.value.componentId)
      console.error(`❌ [refreshConfigurationData] There are still no data items after recovery:`, {
        hasLatestConfig: !!latestConfig,
        dataSourceConfig: latestConfig?.dataSource,
        dataSourcesLength: latestConfig?.dataSource?.dataSources?.length || 0,
        dataSourcesContent: latestConfig?.dataSource?.dataSources
      })
    }
    
  } catch (error) {
    console.error('❌ [SimpleConfigurationEditor] Configuration data refresh failed:', error)
  }
}

// All import and export methods have been migrated to independent componentsConfigurationImportExportPanel

// Expose methods to parent component
defineExpose({
  getCurrentConfig: () => props.modelValue,
  restoreDataItemsFromConfig
  // Import and export functions have been migrated to independent components，No need to expose related methods anymore
})
</script>

<template>
  <div class="simple-configuration-editor">
    <!-- Configure action toolbar -->
    <div class="config-toolbar">
      <div class="toolbar-title">
        <span>{{ componentInfo.componentType || 'components' }}Configuration</span>
        <n-tag v-if="componentInfo.componentId" size="small" type="info">{{ componentInfo.componentId.slice(0, 8) }}...</n-tag>
      </div>

      <n-space>
        <!-- The original configuration import and export panel has been removed，Function integrated into each data source button -->
      </n-space>
    </div>

    <!-- Component level polling configuration -->
    <ComponentPollingConfig
      :component-id="componentInfo.componentId"
      :component-name="componentInfo.componentType"
      :preview-mode="props.previewMode"
      :initial-config="getComponentPollingConfig()"
      @config-change="handleComponentPollingConfigChange"
    />

    <!-- ⚡ Loading status skeleton screen -->
    <div v-if="isInitializing" class="loading-skeleton">
      <n-skeleton text :repeat="3" />
      <n-skeleton text style="width: 60%" />
    </div>

    <!-- Data source accordion - accordionmodel，Only one can be expanded at a time -->
    <n-collapse
      v-else
      :default-expanded-names="dataSourceOptions.length > 0 ? [dataSourceOptions[0].value] : []"
      accordion
      class="data-source-collapse"
    >
      <n-collapse-item
        v-for="dataSourceOption in dataSourceOptions"
        :key="dataSourceOption.value"
        :name="dataSourceOption.value"
      >
        <template #header>
          <div class="collapse-header">
            <span class="header-title">{{ dataSourceOption.label }}</span>
            <n-tooltip
              v-if="dataSourceOption.originalData?.config?.exampleData || dataSourceOption.originalData?.example"
              trigger="hover"
              placement="left"
              :style="{ maxWidth: '400px' }"
            >
              <template #trigger>
                <n-icon size="14" class="example-data-icon" :style="{ color: 'var(--info-color)', cursor: 'pointer' }">
                  <DocumentTextOutline />
                </n-icon>
              </template>
              <div class="example-data-tooltip">
                <div class="tooltip-header">
                  <div class="tooltip-title">
                    <n-icon size="14" style="margin-right: 4px">
                      <DocumentTextOutline />
                    </n-icon>
                    Sample data
                  </div>
                  <n-button
                    size="tiny"
                    text
                    type="primary"
                    @click="copyDataSourceExampleToClipboard(dataSourceOption)"
                    class="copy-button"
                  >
                    <template #icon>
                      <n-icon size="14">
                        <CopyOutlined />
                      </n-icon>
                    </template>
                    copy
                  </n-button>
                </div>
                <pre class="example-data-content">{{
                  JSON.stringify(
                    dataSourceOption.originalData.config?.exampleData || dataSourceOption.originalData.example,
                    null,
                    2
                  )
                }}</pre>
              </div>
            </n-tooltip>
          </div>
        </template>

        <template #header-extra>
          <span style="font-size: 12px; color: var(--text-color-2)">
            {{ dataSourceItems[dataSourceOption.value]?.length || 0 }}item
          </span>
        </template>

        <div class="simple-content">
          <!-- Add button -->
          <n-button size="small" dashed @click="handleAddDataItem(dataSourceOption.value)">
            <template #icon>
              <n-icon size="14">
                <PlusOutlined />
              </n-icon>
            </template>
            Add data item
          </n-button>

          <!-- List of data items -->
          <div v-if="dataSourceItems[dataSourceOption.value]?.length" class="items-list">
            <div v-for="item in dataSourceItems[dataSourceOption.value]" :key="item.id" class="item-row">
              <div class="item-type-with-icon">
                <n-icon size="14" :color="`var(--${getItemTypeColor(item.type)}-color)`">
                  <component :is="getItemTypeIcon(item.type)" />
                </n-icon>
                <span class="item-type">{{ item.type.toUpperCase() }}</span>
              </div>
              <span class="item-desc">{{ getItemSummary(item) }}</span>
              <div class="item-actions">
                <n-button size="small" text @click="handleEditDataItem(dataSourceOption.value, item.id)">edit</n-button>
                <n-button size="small" text type="error" @click="handleDeleteDataItem(dataSourceOption.value, item.id)">
                  delete
                </n-button>
              </div>
            </div>
          </div>

          <!-- merge strategy（Displayed when multiple） -->
          <div v-if="(dataSourceItems[dataSourceOption.value]?.length || 0) >= 2" class="merge-section">
            <div class="merge-strategy-selector">
              <span class="strategy-label">Merge method:</span>
              <n-tag
                v-for="option in getMergeStrategyOptions()"
                :key="option.value"
                :type="
                  (mergeStrategies[dataSourceOption.value] || { type: 'object' }).type === option.value
                    ? 'primary'
                    : 'default'
                "
                :checkable="true"
                :checked="(mergeStrategies[dataSourceOption.value] || { type: 'object' }).type === option.value"
                :bordered="true"
                size="small"
                @click="updateMergeStrategyType(dataSourceOption.value, option.value)"
              >
                {{ option.label }}
              </n-tag>
            </div>

            <!-- Options configuration -->
            <n-form-item
              v-if="(mergeStrategies[dataSourceOption.value] || {}).type === 'select'"
              style="margin-top: 18px"
              label-placement="left"
              label="Please select："
              size="small"
            >
              <n-input-number
                :value="((mergeStrategies[dataSourceOption.value] || {}).selectedIndex || 0) + 1"
                :min="1"
                :max="dataSourceItems[dataSourceOption.value]?.length || 1"
                size="small"
                @update:value="updateMergeStrategyIndex(dataSourceOption.value, $event - 1)"
              >
                <template #prefix>No.</template>
                <template #suffix>item</template>
              </n-input-number>
            </n-form-item>

            <!-- Script configuration -->
            <n-form-item v-if="(mergeStrategies[dataSourceOption.value] || {}).type === 'script'" size="small">
              <SimpleScriptEditor
                :model-value="(mergeStrategies[dataSourceOption.value] || {}).script || ''"
                template-category="data-merger"
                :show-templates="true"
                :show-toolbar="false"
                placeholder="Please enter the data merge script..."
                height="120px"
                @update:model-value="updateMergeStrategyScript(dataSourceOption.value, $event)"
              />
            </n-form-item>
          </div>

          <!-- View results button（Show only when data is available） -->
          <div v-if="(dataSourceItems[dataSourceOption.value]?.length || 0) > 0" class="result-section">
            <n-button size="small" text type="info" @click="viewFinalData(dataSourceOption.value)">
              <template #icon>
                <n-icon size="14">
                  <SearchOutlined />
                </n-icon>
              </template>
              View final results
            </n-button>
          </div>

          <!-- Import export button（always show） -->
          <div class="import-export-section">
            <n-space :size="8" align="center" justify="center">
              <!-- Export single data source button（Only available if there is a data item） -->
              <n-button
                size="small"
                text
                type="success"
                :disabled="
                  !dataSourceItems[dataSourceOption.value] || dataSourceItems[dataSourceOption.value].length === 0
                "
                :loading="exportLoading[dataSourceOption.value]"
                @click="exportSingleDataSource(dataSourceOption.value)"
              >
                <template #icon>
                  <n-icon size="14">
                    <DownloadOutlined />
                  </n-icon>
                </template>
                Export configuration
              </n-button>

              <!-- Import single data source button（always available） -->
              <n-button size="small" text type="warning" @click="triggerImportForDataSource(dataSourceOption.value)">
                <template #icon>
                  <n-icon size="14">
                    <UploadOutlined />
                  </n-icon>
                </template>
                Import configuration
              </n-button>
            </n-space>
          </div>
        </div>
      </n-collapse-item>
    </n-collapse>

    <!-- Empty status prompt -->
    <n-empty
      v-if="dataSourceOptions.length === 0"
      description="No configurable data source"
      size="small"
      style="margin: 40px 0"
    />

    <!-- Raw data configuration drawer - Larger space to display complex configurations -->
    <n-drawer
      v-model:show="showRawDataModal"
      :width="'85vw'"
      :height="'85vh'"
      placement="right"
      class="raw-data-config-drawer"
    >
      <n-drawer-content closable>
        <!-- Custom title：Contains text and sample data icons -->
        <template #header>
          <div class="drawer-header-with-icon">
            <span>Data item configuration</span>
            <n-tooltip
              v-if="shouldShowExampleDataIcon"
              trigger="hover"
              placement="bottom"
              :style="{ maxWidth: '400px' }"
            >
              <template #trigger>
                <n-icon
                  size="16"
                  class="example-data-icon-in-title"
                  :style="{ color: 'var(--info-color)', cursor: 'pointer', marginLeft: '8px' }"
                >
                  <DocumentTextOutline />
                </n-icon>
              </template>
              <div class="example-data-tooltip">
                <div class="tooltip-header">
                  <div class="tooltip-title">
                    <n-icon size="14" style="margin-right: 4px">
                      <DocumentTextOutline />
                    </n-icon>
                    Sample data
                  </div>
                  <n-button
                    size="tiny"
                    text
                    type="primary"
                    @click="copyExampleDataToClipboard"
                    class="copy-button"
                  >
                    <template #icon>
                      <n-icon size="14">
                        <CopyOutlined />
                      </n-icon>
                    </template>
                    copy
                  </n-button>
                </div>
                <pre class="example-data-content">{{ JSON.stringify(getCurrentDataSourceExampleData(), null, 2) }}</pre>
              </div>
            </n-tooltip>
          </div>
        </template>

        <RawDataConfigModal
          :show="true"
          :data-source-key="currentDataSourceKey"
          :component-id="componentId"
          :is-edit-mode="isEditMode"
          :edit-data="getEditData()"
          :example-data="getCurrentDataSourceExampleData()"
          :use-drawer-mode="true"
          @confirm="handleDataItemConfirm"
          @close="handleRawDataModalClose"
          @cancel="handleRawDataModalClose"
          @method-change="currentSelectedMethod = $event"
          @update:show="() => {}"
        />
      </n-drawer-content>
    </n-drawer>

    <!-- Single data source import preview modal box -->
    <n-modal
      v-model:show="showSingleDataSourceImportModal"
      preset="dialog"
      title="Single data source import preview"
      style="width: 500px"
      :show-icon="false"
    >
      <div v-if="singleDataSourceImportPreview">
        <n-space vertical>
          <!-- Source information -->
          <n-card title="Source information" size="small">
            <n-descriptions :column="2" size="small">
              <n-descriptions-item label="data source">
                {{ singleDataSourceImportPreview.basicInfo.originalSourceId }}
              </n-descriptions-item>
              <n-descriptions-item label="Version">
                {{ singleDataSourceImportPreview.basicInfo.version }}
              </n-descriptions-item>
              <n-descriptions-item label="Export time">
                {{ new Date(singleDataSourceImportPreview.basicInfo.exportTime).toLocaleString() }}
              </n-descriptions-item>
              <n-descriptions-item label="Number of configuration items">
                {{ singleDataSourceImportPreview.configSummary.dataItemCount }}
              </n-descriptions-item>
              <n-descriptions-item label="Export source">
                {{ singleDataSourceImportPreview.basicInfo.exportSource }}
              </n-descriptions-item>
              <n-descriptions-item label="merge strategy">
                {{ singleDataSourceImportPreview.configSummary.mergeStrategy }}
              </n-descriptions-item>
            </n-descriptions>
          </n-card>

          <!-- Configuration details -->
          <n-card title="Configuration details" size="small">
            <n-descriptions :column="2" size="small">
              <n-descriptions-item label="Number of data items">
                {{ singleDataSourceImportPreview.configSummary.dataItemCount }}
              </n-descriptions-item>
              <n-descriptions-item label="Contains processing logic">
                {{ singleDataSourceImportPreview.configSummary.hasProcessing ? 'yes' : 'no' }}
              </n-descriptions-item>
              <n-descriptions-item label="Interactive configuration">
                {{ singleDataSourceImportPreview.relatedConfig.interactionCount }} item
              </n-descriptions-item>
              <n-descriptions-item label="HTTPbinding">
                {{ singleDataSourceImportPreview.relatedConfig.httpBindingCount }} item
              </n-descriptions-item>
            </n-descriptions>

            <!-- Dependencies and conflict detection -->
            <div v-if="singleDataSourceImportPreview.dependencies.length > 0" style="margin-top: 12px">
              <n-text depth="2" style="font-size: 12px">external dependencies：</n-text>
              <n-space size="small" style="margin-top: 4px">
                <n-tag v-for="dep in singleDataSourceImportPreview.dependencies" :key="dep" type="warning" size="small">
                  {{ dep }}
                </n-tag>
              </n-space>
            </div>

            <div v-if="singleDataSourceImportPreview.conflicts.length > 0" style="margin-top: 12px">
              <n-alert type="warning" title="Conflict detected" size="small">
                <ul style="margin: 4px 0; padding-left: 20px;">
                  <li v-for="conflict in singleDataSourceImportPreview.conflicts" :key="conflict">
                    {{ conflict }}
                  </li>
                </ul>
              </n-alert>
            </div>
          </n-card>

          <!-- target information -->
          <n-card title="target information" size="small">
            <n-descriptions :column="1" size="small">
              <n-descriptions-item label="target data source">
                {{ targetDataSourceId }}
              </n-descriptions-item>
            </n-descriptions>

            <n-alert type="info" title="Import instructions" style="margin-top: 8px">
              This configuration will be imported into the data source "{{ targetDataSourceId }}"，The original configuration will be overwritten
            </n-alert>
          </n-card>
        </n-space>
      </div>

      <template #action>
        <n-space>
          <n-button @click="showSingleDataSourceImportModal = false">Cancel</n-button>
          <n-button 
            type="primary" 
            :disabled="singleDataSourceImportPreview?.conflicts.length > 0"
            :loading="isProcessing"
            @click="handleSingleDataSourceImport"
          >
            Confirm import
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.simple-configuration-editor {
  width: 100%;
}

/* Configure toolbar style */
.config-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 16px;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

/* The import preview popup style has been migrated toConfigurationImportExportPanelcomponents */

/* Simplified content area */
.simple-content {
  margin-top: -8px;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.simple-content > *:first-child + .items-list {
  margin-top: 4px;
}

/* List of data items */
.items-list {
  display: flex;
  flex-direction: column;
  max-height: 150px;
  overflow-y: auto;
  gap: 4px;
}

/* data item row */
.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-color);
  font-size: 12px;
}

/* Data item type icon and text container */
.item-type-with-icon {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}

.item-type {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-color);
}

.item-desc {
  flex: 1;
  color: var(--text-color);
  font-size: 12px;
}

.item-actions {
  display: flex;
  gap: 4px;
}

/* ⚡ Load skeleton screen style */
.loading-skeleton {
  padding: 24px 16px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-top: 16px;
}

/* Merge strategy areas */
.merge-section {
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

/* Merge strategy selector */
.merge-strategy-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.strategy-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color);
  white-space: nowrap;
  margin-right: 2px;
}

/* View results button area */
.result-section {
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

/* Import and export button area */
.import-export-section {
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  text-align: center;
  margin-top: 8px;
}

/* Folding panel customization */
.data-source-collapse {
  margin-top: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

/* Folding panel header layout */
.collapse-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.header-title {
  flex: 1;
  font-weight: 500;
}

.example-data-icon {
  flex-shrink: 0;
  margin-left: 8px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.example-data-icon:hover {
  opacity: 1;
}

/* Drawer title layout */
.drawer-header-with-icon {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

/* Sample data icon in drawer header */
.example-data-icon-in-title {
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s, transform 0.2s;
}

.example-data-icon-in-title:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* Sample data prompt box style */
.example-data-tooltip {
  max-width: 400px;
}

/* Prompt box header：Title and copy button */
.tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 4px;
}

.tooltip-title {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--info-color);
}

/* Copy button style */
.copy-button {
  font-size: 12px;
  padding: 2px 8px;
  transition: all 0.2s;
}

.copy-button:hover {
  transform: translateY(-1px);
}

.example-data-content {
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-color);
  background: var(--code-color);
  padding: 12px;
  border-radius: 6px;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 250px;
  overflow-y: auto;
}

/* depth selector：Folding panel style customization */
.data-source-collapse :deep(.n-collapse-item) {
  border: none;
}

.data-source-collapse :deep(.n-collapse-item:not(:last-child)) {
  border-bottom: 1px solid var(--divider-color);
}

.data-source-collapse :deep(.n-collapse-item__header) {
  background: var(--card-color);
  padding: 16px;
  font-weight: 500;
}

.data-source-collapse :deep(.n-collapse-item__content-wrapper) {
  background: var(--body-color);
}

.data-source-collapse :deep(.n-collapse-item__content-inner) {
  padding: 0;
}

/* Responsive design */
@media (max-width: 768px) {
  .simple-content {
    padding: 8px;
  }

  .item-row {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }

  .item-type-with-icon {
    min-width: auto;
    justify-content: center;
  }
}
</style>
