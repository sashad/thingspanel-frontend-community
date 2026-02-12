/**
 * 🔥 Card 2.1 Unified configuration management center - New refactored version
 * 
 * Core responsibilities：
 * 1. Serves as the only source of configuration data
 * 2. management basics、components、data source、Interactive four-layer configuration
 * 3. Provides configuration update and event communication mechanisms
 * 4. Keep configuration synchronized with editor
 */

import { computed, ref, watch, inject, type ComputedRef, isRef } from 'vue'
import { DataSourceMapper } from '@/card2.1/core2/data-source'
import type { MetricItem } from '@/card2.1/core2'

// 🔥 Key optimization：Property binding check cache，Avoid repeated configuration retrieval and checking
const propertyBindingCache = new Map<string, {
  hasBinding: boolean
  lastCheck: number
  configHash: string
}>()

// Cache validity period：2Second（Avoid delays after configuration changes）
const BINDING_CACHE_TTL = 2000

/**
 * 🔥 Efficient property binding checking function
 * Use caching to avoid duplicate configuration queries andHTTPConfiguration analysis
 */
async function checkPropertyBinding(componentId: string, propertyPath: string): Promise<boolean> {
  const cacheKey = `${componentId}:${propertyPath}`
  const now = Date.now()

  // Check cache
  const cached = propertyBindingCache.get(cacheKey)
  if (cached && (now - cached.lastCheck) < BINDING_CACHE_TTL) {
    return cached.hasBinding
  }

  try {
    // Get the data source configuration of the current component
    const { configurationIntegrationBridge } = await import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
    const config = configurationIntegrationBridge.getConfiguration(componentId)

    if (!config?.dataSource) {
      // cache"No binding"result
      propertyBindingCache.set(cacheKey, {
        hasBinding: false,
        lastCheck: now,
        configHash: 'no-datasource'
      })
      return false
    }

    // Generate configuration hashes to detect changes
    const configHash = JSON.stringify(config.dataSource).substring(0, 100)

    // If the configuration has not changed and the cache is valid，Return cached results directly
    if (cached && cached.configHash === configHash) {
      return cached.hasBinding
    }

    // Perform binding check
    let hasBinding = false
    const dataSource = config.dataSource

    // 🔥 Key optimization：unifiedHTTPConfigure search logic
    const httpConfigs = []

    // 1. Check new format：dataSourcesin arrayHTTPConfiguration
    if (dataSource?.dataSources && Array.isArray(dataSource.dataSources)) {
      for (const ds of dataSource.dataSources) {
        if (ds.dataItems && Array.isArray(ds.dataItems)) {
          for (const item of ds.dataItems) {
            if (item.item?.type === 'http' && item.item?.config?.params) {
              httpConfigs.push(item.item.config)
            }
          }
        }
      }
    }

    // 2. Check old format：directHTTPConfiguration
    if (dataSource?.type === 'http' && dataSource?.config?.params) {
      httpConfigs.push(dataSource.config)
    }

    // 3. examinerawDataListFormat
    if (dataSource?.rawDataList && Array.isArray(dataSource.rawDataList)) {
      for (const item of dataSource.rawDataList) {
        if (item.type === 'http' && item.config?.params) {
          httpConfigs.push(item.config)
        }
      }
    }

    // 🔥 Key optimization：found in allHTTPCheck parameter binding in configuration
    for (const httpConfig of httpConfigs) {
      if (httpConfig.params && Array.isArray(httpConfig.params)) {
        for (const param of httpConfig.params) {
          if (param.enabled !== false && param.value === propertyPath) {
            hasBinding = true
            break
          }
        }
      }
      if (hasBinding) break
    }

    // Cache check results
    propertyBindingCache.set(cacheKey, {
      hasBinding,
      lastCheck: now,
      configHash
    })


    return hasBinding
  } catch (error) {
    console.error(`❌ [checkPropertyBinding] Check failed:`, {
      componentId,
      propertyPath,
      error: error instanceof Error ? error.message : error
    })
    return false
  }
}

/**
 * Basic configuration interface - Define a common basic configuration structure
 */
export interface BaseConfiguration {
  // Device binding configuration（highest priority）
  deviceId?: string
  metricsList?: MetricItem[]
  // UIBasic configuration
  title?: string
  showTitle?: boolean
  visible?: boolean
  opacity?: number
  backgroundColor?: string
  borderWidth?: number
  borderColor?: string
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double'
  borderRadius?: number
  padding?: { top: number; right: number; bottom: number; left: number }
  margin?: { top: number; right: number; bottom: number; left: number }
}

/**
 * Unified configuration interface - Four-layer configuration structure
 */
export interface UnifiedCard2Configuration {
  /** Basic configuration - Device binding、UICommon configurations such as styles */
  base?: BaseConfiguration
  /** Component configuration - Component-specific properties and settings */
  component?: Record<string, unknown>
  /** Data source configuration - Data binding and source configuration */
  dataSource?: Record<string, unknown>
  /** Interactive configuration - Interaction and behavior configuration between components */
  interaction?: Record<string, unknown>
  /** componentsID - For configuration management and persistence */
  componentId?: string
}

/**
 * Configure management options
 */
interface ConfigManagementOptions {
  config: any
  data?: Record<string, unknown> | ComputedRef<Record<string, unknown>>
  componentId?: string
  /** Initial unified configuration received from editor */
  initialUnifiedConfig?: UnifiedCard2Configuration
}

/**
 * 🔥 Unified configuration management center Hook
 */
export function useCard2Props<T = Record<string, unknown>>(options: ConfigManagementOptions) {
  const { config, data, componentId, initialUnifiedConfig } = options
  
  // Inject editor context for synchronization
  const editorContext = inject('editorContext', null) as any
  

  // 🔥 Unified configuration status - The only source of configuration data
  const unifiedConfig = ref<UnifiedCard2Configuration>({
    // Basic configuration：Device binding、UICommon configurations such as styles
    base: {
      // Device binding configuration（highest priority）
      deviceId: initialUnifiedConfig?.base?.deviceId || '',
      metricsList: initialUnifiedConfig?.base?.metricsList || [],
      // UIBasic configuration
      title: initialUnifiedConfig?.base?.title || '',
      showTitle: initialUnifiedConfig?.base?.showTitle || false,
      visible: initialUnifiedConfig?.base?.visible ?? true,
      opacity: initialUnifiedConfig?.base?.opacity ?? 1,
      backgroundColor: initialUnifiedConfig?.base?.backgroundColor,
      borderWidth: initialUnifiedConfig?.base?.borderWidth || 0,
      borderColor: initialUnifiedConfig?.base?.borderColor || '#d9d9d9',
      borderStyle: initialUnifiedConfig?.base?.borderStyle || 'solid',
      borderRadius: initialUnifiedConfig?.base?.borderRadius || 6,
      padding: initialUnifiedConfig?.base?.padding || { top: 0, right: 0, bottom: 0, left: 0 },
      margin: initialUnifiedConfig?.base?.margin || { top: 0, right: 0, bottom: 0, left: 0 }
    },
    // Component configuration：fromsettingConfigComponent-specific properties of
    component: initialUnifiedConfig?.component || { ...config },
    // Data source configuration：Data binding configuration
    dataSource: initialUnifiedConfig?.dataSource || {},
    // Interactive configuration：组件间Interactive configuration
    interaction: initialUnifiedConfig?.interaction || {},
    componentId
  })

  // 🔥 critical debugging：Display the unified configuration after initialization

  // 🔥 Configuration change callback function
  let configChangeCallback: ((config: UnifiedCard2Configuration) => void) | null = null

  /**
   * 🔥 Update configuration by level - Core configuration management functions
   */
  const updateConfig = (layer: keyof UnifiedCard2Configuration, newConfig: any) => {

    // 🔥 Force responsive updates - Deep merge and trigger responses
    const updatedLayer = { ...unifiedConfig.value[layer], ...newConfig }

    // 🔥 critical fix：Use a completely new object reference，Ensure responsive updates
    const newUnifiedConfig = {
      ...unifiedConfig.value,
      [layer]: updatedLayer
    }


    // 🔥 Directly assign new objects，Ensure responsive updates are triggered
    unifiedConfig.value = newUnifiedConfig


    // Sync to editor
    syncToEditor()

    // 🚀 critical fix：Sync to configuration manager，make sureVisualEditorBridgeCan get the latest value
    syncToConfigurationManager()

    // 🔥 critical fix：Clean binding cache when configuration is updated，Make sure the next check uses the latest configuration
    if (componentId && (layer === 'dataSource' || layer === 'component')) {
      clearPropertyBindingCache(componentId)
    }

    // Trigger configuration change event
    emitConfigChange()
  }

  /**
   * 🔥 Batch update configuration
   */
  const updateUnifiedConfig = (partialConfig: Partial<UnifiedCard2Configuration>) => {
    
    unifiedConfig.value = {
      ...unifiedConfig.value,
      ...partialConfig
    }
    
    syncToEditor()
    emitConfigChange()
  }

  /**
   * 🚀 critical fix：Synchronize configuration to configuration manager
   * make sure VisualEditorBridge Ability to obtain the latest attribute values
   */
  const syncToConfigurationManager = () => {
    if (!componentId) {
      return
    }

    try {

      // Dynamically import configuration manager
      import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
        .then(({ configurationIntegrationBridge }) => {
          // Get current configuration
          const currentConfig = configurationIntegrationBridge.getConfiguration(componentId)

          // Create updated configuration
          const updatedConfig = {
            ...currentConfig,
            component: unifiedConfig.value.component,
            base: unifiedConfig.value.base,
            dataSource: unifiedConfig.value.dataSource || currentConfig?.dataSource,
            interaction: unifiedConfig.value.interaction || currentConfig?.interaction
          }


          // 🚀 key：Directly update the status of the configuration manager，Don't trigger event
          // Use internal methods to ensure configuration synchronization without creating additional event loops
          const configurationStateManager = (configurationIntegrationBridge as any).configurationStateManager
          if (configurationStateManager) {
            // Set configuration status directly，Bypass event sending
            configurationStateManager.updateConfigurationSection(
              componentId,
              'component',
              updatedConfig.component,
              'sync', // Mark for sync updates
              false   // No forced update
            )
          } else {
            // Downgrade plan：Use normal update methods
            configurationIntegrationBridge.updateConfiguration(
              componentId,
              'component',
              updatedConfig.component,
              'card2-sync'
            )
          }

        })
        .catch(error => {
          console.error(`❌ [useCard2Props] Configuration manager sync failed:`, error)
        })
    } catch (error) {
      console.error(`❌ [useCard2Props] syncToConfigurationManager fail:`, error)
    }
  }

  /**
   * 🔥 Synchronize configuration to editor
   */
  const syncToEditor = () => {

    if (!editorContext?.updateNode || !componentId) {
      return
    }

    const currentNode = editorContext.getNodeById(componentId)
    if (!currentNode) {
      return
    }

    // Prevent cyclic updates
    const currentUnifiedConfig = currentNode.metadata?.unifiedConfig
    if (JSON.stringify(currentUnifiedConfig) === JSON.stringify(unifiedConfig.value)) {
      return
    }


    // 🚨 create a without interaction Configured version，Avoid saving zombie interaction configuration
    const configWithoutInteraction = {
      ...unifiedConfig.value,
      interaction: {} // 🔥 Clear interaction，Avoid zombie configurations
    }


    editorContext.updateNode(componentId, {
      properties: unifiedConfig.value.component || {},
      metadata: {
        ...currentNode.metadata,
        unifiedConfig: configWithoutInteraction, // 🔥 Remove on save interaction
        updatedAt: Date.now()
      }
    })

  }

  /**
   * 🔥 Set configuration change callback
   */
  const setConfigChangeCallback = (callback: (config: UnifiedCard2Configuration) => void) => {
    configChangeCallback = callback
  }

  /**
   * 🔥 Trigger configuration change event
   */
  const emitConfigChange = () => {
    if (configChangeCallback) {
      configChangeCallback({ ...unifiedConfig.value })
    }
  }

  /**
   * 🔥 Get full configuration
   */
  const getFullConfiguration = (): UnifiedCard2Configuration => {
    return { ...unifiedConfig.value }
  }

  /**
   * 🔥 repair：Display data calculation - Ensure full response to unified configuration changes
   */
  const displayData = computed(() => {
    // 🔥 critical fix：Visit directly firstdatato build reactive dependencies
    // regardlessdatawhat type，Visit once first，letVuetrace dependencies
    const rawData = data

    // 🔥 critical fix：Get it correctlydatavalue，Whether it's a reactive reference or a normal value
    let currentData: Record<string, unknown>

    if (isRef(rawData)) {
      // in the case of ref，Get it directly .value
      currentData = rawData.value as Record<string, unknown>
    } else if (typeof rawData === 'object' && rawData !== null && 'value' in rawData) {
      // If it is a computed property object，Get .value
      currentData = (rawData as any).value as Record<string, unknown>
    } else if (typeof rawData === 'function') {
      // If it is a function（In some cases computed properties may behave as functions），Call it to get the value
      try {
        currentData = (rawData as any)() as Record<string, unknown>
      } catch (error) {
        console.warn(`🔥 [useCard2Props] Function call failed，Use empty object:`, error)
        currentData = {}
      }
    } else {
      // ordinary object or value
      currentData = (rawData as Record<string, unknown>) || {}
    }

    // 🔥 fix logic：Check if there is a valid data source execution result
    const hasValidDataSource = currentData &&
      typeof currentData === 'object' &&
      Object.keys(currentData).length > 0

    // 🔥 critical fix：Check if the data comes fromDataWarehouseAnd contains the fields required by the component
    // Support nested structures（like { main: { data: { value, ... } } }）
    const isDataFromWarehouse = hasValidDataSource && (() => {
      const dataKeys = Object.keys(currentData)

      // Check if the top level contains the basic fields required by the component
      const hasDirectFields = dataKeys.some(key =>
        ['value', 'unit', 'metricsName', 'data', 'title', 'amount', 'description', 'timestamp'].includes(key)
      )

      if (hasDirectFields) return true

      // 🔥 critical fix：Check if it is a data source nested structure（like { main: { data: {...} }, secondary: {...} }）
      const hasNestedData = dataKeys.some(key => {
        const value = currentData[key]
        return value && typeof value === 'object' && ('data' in value || 'type' in value)
      })

      return hasNestedData
    })()

    if (isDataFromWarehouse) {
      // 🔥 Return directlyDataWarehousedata，This is already the format required by the component
      return currentData
    }

    // 🔥 Core fix：When there is no data source result，Directly use unified configuration component configuration
    // remove initialconfigdependency，Ensure full responseunifiedConfig.componentchanges
    const result = {
      ...unifiedConfig.value.component  // 🔥 key：Only use unified configuration，remove initialconfiginterference
    }

    return result
  })

  /**
   * 🔥 Listen for initial configuration changes
   */
  watch(() => config, (newConfig) => {
    if (newConfig && typeof newConfig === 'object') {
      updateConfig('component', newConfig)
    }
  }, { deep: true, immediate: false })

  // 🔥 New：Attribute exposure mapping table，Record the current value of the component's internal property
  const exposedProperties = ref<Record<string, any>>({})

  /**
   * 🔒 Security exposure attribute value - Whitelist verified attribute exposure
   */
  const exposeProperty = (propertyName: string, value: any) => {
    console.warn(`⚠️ [useCard2Props] exposeProperty Deprecated，Please use exposeWhitelistedProperties()`)
    console.warn(`⚠️ Try exposing properties: ${componentId}.${propertyName} = ${value}`)

    // 🔒 No longer expose properties directly，Call the whitelist mechanism instead
    // This is to prevent components from directly exposing properties by bypassing the whitelist.
    exposeWhitelistedProperties()
  }

  /**
   * 🔒 Safe batch exposure of attributes - Only attributes that pass whitelist verification will be exposed
   */
  const exposeProperties = (properties: Record<string, any>) => {
    console.warn(`⚠️ [useCard2Props] exposeProperties Deprecated，Please use exposeWhitelistedProperties()`)
    console.warn(`⚠️ Try exposing attributes in batches: ${componentId}:`, Object.keys(properties))

    // 🔒 No longer expose properties directly，Call the whitelist mechanism instead
    // This is to prevent components from directly exposing properties by bypassing the whitelist.
    exposeWhitelistedProperties()
  }

  /**
   * 🔥 New：Get exposed attribute values
   */
  const getExposedProperty = (propertyName: string) => {
    return exposedProperties.value[propertyName]
  }

  /**
   * 🔥 New：Get all exposed properties
   */
  const getAllExposedProperties = () => {
    return { ...exposedProperties.value }
  }

  /**
   * 🔥 New：Property change listener mapping table
   */
  const propertyWatchers = ref<Record<string, ((newValue: any, oldValue: any) => void)[]>>({})

  /**
   * 🔥 Automatic configuration synchronization：Listen for external configuration update events
   */
  const handleExternalConfigUpdate = (event: CustomEvent) => {
    const { componentId: eventComponentId, layer, config } = event.detail
    if (eventComponentId === componentId && layer === 'component') {

      // Get old configuration values，Used to trigger property change listeners
      const oldConfig = { ...unifiedConfig.value.component }

      // Automatically synchronize to internal unified configuration
      updateUnifiedConfig({ component: config })

      // 🔥 critical fix：For cross-component interactions，You need to manually trigger the property change listener
      if (config && typeof config === 'object') {
        Object.keys(config).forEach(propertyName => {
          const oldValue = oldConfig[propertyName]
          const newValue = config[propertyName]

          if (oldValue !== newValue) {

            // 🔥 Trigger property listener - This is required for interactive systems
            const watchers = propertyWatchers.value[propertyName]
            if (watchers && watchers.length > 0) {
              watchers.forEach(callback => {
                try {
                  callback(newValue, oldValue)
                } catch (error) {
                  console.error(`❌ [useCard2Props] Property listener execution failed ${componentId}.${propertyName}:`, error)
                }
              })
            } else {
            }

            // 🔥 Send attribute change events to the interactive system
            window.dispatchEvent(new CustomEvent('property-change', {
              detail: {
                componentId,
                propertyName,
                oldValue,
                newValue,
                source: 'cross-component-interaction'
              }
            }))
          }
        })
      }
    }
  }

  /**
   * 🔥 Enhanced configuration updates：Automatic synchronization to configuration manager
   */
  const updateUnifiedConfigWithSync = (partialConfig: Partial<UnifiedCard2Configuration>) => {

    // 1. Update local unified configuration
    updateUnifiedConfig(partialConfig)

    // 2. Automatic synchronization to configuration manager（If there is a component configuration update）
    if (partialConfig.component && componentId) {
      import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
        .then(({ configurationIntegrationBridge }) => {
          configurationIntegrationBridge.updateConfiguration(
            componentId,
            'component',
            partialConfig.component,
            'auto-sync'
          )
        })
        .catch(error => {
          console.error(`❌ [useCard2Props] Automatic synchronization configuration failed:`, error)
        })
    }
  }

  /**
   * 🔥 New：Listen for property changes
   */
  const watchProperty = (propertyName: string, callback: (newValue: any, oldValue: any) => void) => {
    if (!propertyWatchers.value[propertyName]) {
      propertyWatchers.value[propertyName] = []
    }
    propertyWatchers.value[propertyName].push(callback)


    // Returns the function to cancel listening
    return () => {
      const watchers = propertyWatchers.value[propertyName]
      if (watchers) {
        const index = watchers.indexOf(callback)
        if (index > -1) {
          watchers.splice(index, 1)
        }
      }
    }
  }

  /**
   * 🔒 abandoned：Expose property values ​​and trigger listeners（Has been replaced by the whitelist mechanism）
   */
  const exposePropertyWithWatch = (propertyName: string, newValue: any) => {
    console.warn(`⚠️ [useCard2Props] exposePropertyWithWatch Deprecated，Please use exposeWhitelistedProperties()`)
    console.warn(`⚠️ Try exposing and listening properties: ${componentId}.${propertyName} = ${newValue}`)

    // 🔒 Trigger the whitelist mechanism to re-expose all security attributes
    exposeWhitelistedProperties()

    // Keep listener functionality，Because this is a legitimate internal mechanism
    const oldValue = exposedProperties.value[propertyName]
    const watchers = propertyWatchers.value[propertyName]
    if (watchers && watchers.length > 0) {
      watchers.forEach(callback => {
        try {
          callback(newValue, oldValue)
        } catch (error) {
          console.error(`🔥 [useCard2Props] Property listener execution failed ${componentId}.${propertyName}:`, error)
        }
      })
    }
  }

  /**
   * 🔒 Secure whitelist-based attribute exposure
   * Expose only properties explicitly declared in the component definition
   */
  const exposeWhitelistedProperties = async () => {
    if (!unifiedConfig.value.component || !componentId) return

    try {
      // 🔒 Import attribute exposure manager
      const { propertyExposureManager } = await import('@/card2.1/core2/property')

      // Get component type（Obtained from injected context or other means）
      const componentType = getComponentType()
      if (!componentType) {
        console.warn(`⚠️ [useCard2Props] Unable to determine component type，Skip attribute exposure: ${componentId}`)
        return
      }

      // Get whitelist attribute configuration
      const whitelistedProperties = propertyExposureManager.getWhitelistedProperties(
        componentType,
        'public',
        { source: 'system' }
      )

      if (Object.keys(whitelistedProperties).length === 0) {
        return
      }

      // 🔒 Security exposure whitelisted attributes
      const safeExposedProperties: Record<string, any> = {}
      const componentConfig = unifiedConfig.value.component

      for (const [propertyName, config] of Object.entries(whitelistedProperties)) {
        const actualPropertyName = Object.keys(componentConfig).find(key => key === propertyName)

        if (actualPropertyName && componentConfig[actualPropertyName] !== undefined) {
          const accessResult = propertyExposureManager.exposeProperty(
            componentType,
            componentId,
            propertyName,
            componentConfig[actualPropertyName],
            {
              accessType: 'read',
              timestamp: Date.now(),
              source: 'system'
            }
          )

          if (accessResult.allowed) {
            const exposedName = config.alias || propertyName
            safeExposedProperties[exposedName] = accessResult.value
          }
        }
      }

      // Add secure metadata
      safeExposedProperties.lastUpdated = new Date().toISOString()
      safeExposedProperties.componentId = componentId

      // 🔒 Directly set properties filtered by whitelist，Bypassing old exposed functions
      exposedProperties.value = { ...safeExposedProperties }

      // 🔒 Comment out editor node update，Avoid circular dependencies
      // editor node's metadata Updates should be managed by the editor itself，instead of triggering here
      // if (editorContext?.updateNode && componentId) {
      //   const currentNode = editorContext.getNodeById(componentId)
      //   if (currentNode) {
      //     editorContext.updateNode(componentId, {
      //       metadata: {
      //         ...currentNode.metadata,
      //         exposedProperties: { ...exposedProperties.value },
      //         lastPropertyUpdate: Date.now()
      //       }
      //     })
      //   }
      // }

    } catch (error) {
      console.error(`❌ [useCard2Props] Attribute whitelist exposure failed ${componentId}:`, error)
    }
  }

  /**
   * 🔍 Get component type
   * Try to get component type information from multiple sources
   */
  const getComponentType = (): string | null => {
    // 1. Get from editor context
    if (editorContext?.getNodeById && componentId) {
      const node = editorContext.getNodeById(componentId)
      if (node?.type) {
        return node.type
      }
    }

    // 2. fromDOMProperty acquisition
    if (typeof window !== 'undefined' && componentId) {
      const element = document.querySelector(`[data-component-id="${componentId}"]`)
      const componentType = element?.getAttribute('data-component-type')
      if (componentType) {
        return componentType
      }
    }

    // 3. Obtained from initial configuration（if any）
    if (initialUnifiedConfig?.componentType) {
      return initialUnifiedConfig.componentType as string
    }

    return null
  }

  /**
   * 🔥 life cycle management：Automatic monitoring and cleaning
   */
  const setupAutoSync = () => {
    if (typeof window !== 'undefined') {
      // Automatically listen for configuration update events
      window.addEventListener('card2-config-update', handleExternalConfigUpdate as EventListener)
    }

    // Returns enhanced cleanup function
    return () => {
      // Clear anti-shake timer
      if (exposePropertiesTimer) {
        clearTimeout(exposePropertiesTimer)
        exposePropertiesTimer = null
      }
      
      // Clean up event listeners
      if (typeof window !== 'undefined') {
        window.removeEventListener('card2-config-update', handleExternalConfigUpdate as EventListener)
      }
    }
  }

  // 🔥 Automatic settings synchronization and property exposure
  const cleanupAutoSync = setupAutoSync()

  // 🔒 Anti-shake mechanism：Avoid infinite loop calls
  let exposePropertiesTimer: NodeJS.Timeout | null = null
  const debouncedExposeProperties = () => {
    if (exposePropertiesTimer) {
      clearTimeout(exposePropertiesTimer)
    }
    exposePropertiesTimer = setTimeout(() => {
      exposeWhitelistedProperties()
    }, 100) // 100ms Anti-shake delay
  }

  // 🔒 Monitor unified configuration changes，Safely re-expose whitelisted attributes，and trigger data source update
  watch(
    () => unifiedConfig.value.component,
    (newComponent, oldComponent) => {
      // 🔒 Use anti-shake mechanism to re-expose whitelist attributes，Avoid infinite loops
      debouncedExposeProperties()

      // 🔥 New：Check for property changes and trigger data source updates
      if (componentId && newComponent && oldComponent) {
        Object.keys(newComponent).forEach(async propertyName => {
          const newValue = newComponent[propertyName]
          const oldValue = oldComponent?.[propertyName]

          if (newValue !== oldValue) {

            // 🔥 critical fix：Trigger internal property listener（This is always needed）
            const watchers = propertyWatchers.value[propertyName]
            if (watchers && watchers.length > 0) {
              watchers.forEach(callback => {
                try {
                  callback(newValue, oldValue)
                } catch (error) {
                  console.error(`❌ [useCard2Props] Property listener execution failed ${componentId}.${propertyName}:`, error)
                }
              })
            }

            // 🚀 critical fix：Only if the property is actually bound to the data source，before triggering the data source to re-execute

            try {
              // 🔥 Key optimization：Construct property binding paths in advance
              const propertyPath = `${componentId}.component.${propertyName}`

              // 🔥 First step optimization：Using cached binding check functions，Avoid repeated configuration retrieval
              const hasBinding = await checkPropertyBinding(componentId, propertyPath)


              if (hasBinding) {

                // The interaction manager is called only for properties that are actually bound
                const { interactionManager } = await import('@/card2.1/core2/interaction')
                interactionManager.notifyPropertyUpdate(componentId, propertyPath, newValue, oldValue)

                // Send global attribute change event（Only for bound properties）
                window.dispatchEvent(new CustomEvent('property-change', {
                  detail: {
                    componentId,
                    propertyName,
                    propertyPath,
                    oldValue,
                    newValue,
                    source: 'bound-property-change',
                    hasBinding: true,
                    timestamp: Date.now()
                  }
                }))
              } else {

                // Send global attribute change event（Mark as unbound）
                window.dispatchEvent(new CustomEvent('property-change', {
                  detail: {
                    componentId,
                    propertyName,
                    propertyPath,
                    oldValue,
                    newValue,
                    source: 'unbound-property-change',
                    hasBinding: false,
                    timestamp: Date.now()
                  }
                }))
              }
            } catch (error) {
              console.error(`❌ [useCard2Props] Check property binding failed:`, {
                componentId,
                propertyName,
                error: error instanceof Error ? error.message : error
              })
            }
          }
        })
      }
    },
    { deep: true, immediate: true }
  )

  /**
   * 🔥 Clear property binding cache
   * When the configuration is updated, the relevant cache needs to be cleared，Ensure the accuracy of binding checks
   */
  const clearPropertyBindingCache = (componentId?: string) => {
    if (componentId) {
      // Clear the cache of a specific component
      const keysToDelete = []
      for (const [key] of propertyBindingCache) {
        if (key.startsWith(`${componentId}:`)) {
          keysToDelete.push(key)
        }
      }
      keysToDelete.forEach(key => propertyBindingCache.delete(key))
    } else {
      // clear all cache
      const cacheSize = propertyBindingCache.size
      propertyBindingCache.clear()
    }
  }

  // Return to configuration management interface
  return {
    // Configuration data
    config: computed(() => unifiedConfig.value.component || {}),
    displayData,
    unifiedConfig: computed(() => unifiedConfig.value),

    // Configuration management functions
    updateConfig,
    updateUnifiedConfig,
    getFullConfiguration,

    // event management
    setConfigChangeCallback,
    emitConfigChange,
    syncToEditor,

    // 🔥 New：Attribute exposure function
    exposeProperty,
    exposeProperties,
    exposePropertyWithWatch,
    getExposedProperty,
    getAllExposedProperties,
    watchProperty,

    // 🔥 Enhanced functionality：Automatic synchronization configuration management
    updateUnifiedConfigWithSync,  // Enhanced version configuration update，Automatic synchronization to configuration manager
    exposeWhitelistedProperties,  // 🔒 Safe whitelist attribute exposure（Replace automatic full exposure）
    cleanupAutoSync,              // Cleanup function，Used to be called when the component is uninstalled
    clearPropertyBindingCache     // 🔥 New：Clear binding cache function
  }
}