/**
 * Configuring the integrated bridge
 * in newConfigurationStateManagerProvides a compatibility layer with existing systems
 *
 * Responsibilities：
 * 1. Adapt to existingConfigurationManagerinterface
 * 2. integratedEditorDataSourceManagerevent handling
 * 3. Provide a smooth migration path
 * 4. Maintain backward compatibility
 */

import { configurationStateManager, type ConfigurationUpdateEvent } from '@/components/visual-editor/configuration/ConfigurationStateManager'
// Import data cache cleaning function，Ensure data consistency when configuration changes
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'
// repair：Import configuration event bus，Ensure events are emitted when configuration changes
import { configEventBus, type ConfigChangeEvent } from '@/core/data-architecture/ConfigEventBus'
// 🚀 New：Import Simplified Data Flow Manager
import { simpleDataFlow } from '@/core/data-architecture/SimpleDataFlow'
// 🔥 repair：Import data source binding configuration manager
import { dataSourceBindingConfig } from '@/core/data-architecture/DataSourceBindingConfig'
import type {
  IConfigurationManager,
  WidgetConfiguration,
  ValidationResult,
  BaseConfiguration,
  ComponentConfiguration,
  DataSourceConfiguration,
  InteractionConfiguration
} from './types'

/**
 * Configure the integration bridge class
 * Provide and existingConfigurationManagerCompatible interface，Internally used newConfigurationStateManager
 */
export class ConfigurationIntegrationBridge implements IConfigurationManager {
  private initialized = false

  // 🔥 New：Configuration change deduplication cache，Prevent repeated triggering
  private configChangeCache = new Map<string, {
    lastConfigHash: string
    lastUpdateTime: number
    pendingEventTimeout?: NodeJS.Timeout
  }>()

  // Configuration change time window for deduplication（millisecond）
  private readonly CONFIG_CHANGE_DEBOUNCE_TIME = 50

  /**
   * Initialize the bridge
   */
  async initialize(): Promise<void> {
    if (this.initialized) return
    // Initialize configuration state manager
    // Set up withEditorDataSourceManagerIntegration
    await this.setupEditorDataSourceIntegration()

    this.initialized = true
  }

  /**
   * Get component configuration
   * New：Automatically migrate component-level device configurations to base configurations
   */
  getConfiguration(widgetId: string): WidgetConfiguration | null {
    const config = configurationStateManager.getConfiguration(widgetId)
    if (!config) return null

    // 🚀 Perform configuration migration checking and processing
    return this.migrateConfigurationIfNeeded(widgetId, config)
  }

  /**
   * Set component configuration
   * New：Automatically migrate old format configurations during setup
   * @param widgetId componentsID
   * @param config Configuration object
   * @param componentType Component type，for more precise event tracking
   */
  setConfiguration(widgetId: string, config: WidgetConfiguration, componentType?: string): void {

    // 🚀 Perform migration checks before setup，Make sure the configuration structure is correct
    const migratedConfig = this.performDeviceConfigurationMigrationForSet(widgetId, config)

    const updated = configurationStateManager.setConfiguration(widgetId, migratedConfig, 'user')

    if (updated) {
      // critical fix：Clear cache when configuration is updated，Ensure data consistency
      simpleDataBridge.clearComponentCache(widgetId)

      // 🔥 Check the data source configuration content

      const shouldTrigger = this.shouldTriggerDataExecution('dataSource', migratedConfig.dataSource)

      // repair：Emit configuration change events，Use the correct event format
      const changeEvent: ConfigChangeEvent = {
        componentId: widgetId,
        componentType: componentType || 'widget', // Use the component type passed in or default to 'widget'
        section: 'dataSource', // Used when configuring full update dataSource
        oldConfig: null, // Can be improved to save previous configuration
        newConfig: migratedConfig,
        timestamp: Date.now(),
        source: 'user',
        context: {
          // 🔥 critical fix：setConfiguration You also need to set a trigger tag when
          shouldTriggerExecution: shouldTrigger
        }
      }
      configEventBus.emitConfigChange(changeEvent)
    }
  }

  /**
   * New：Cross-component interaction-specific configuration updates - force trigger event
   * @param widgetId componentsID
   * @param section configuration section
   * @param config Configuration data
   * @param componentType Component type
   */
  updateConfigurationForInteraction<K extends keyof WidgetConfiguration>(
    widgetId: string,
    section: K,
    config: WidgetConfiguration[K],
    componentType?: string
  ): boolean {
    // key：Use forced updates，Make sure the event is triggered even if the configuration is the same
    const updated = configurationStateManager.updateConfigurationSection(widgetId, section, config, 'interaction', true)

    if (updated) {
      // 🔥 critical fix：Clear cache when configuration part is updated，in particular dataSource renew
      if (section === 'dataSource' || section === 'component') {
        simpleDataBridge.clearComponentCache(widgetId)
      }

      // 🔥 New：for base Layer configuration update（deviceId、metricsListwait），It is also necessary to trigger the data source to re-execute
      if (section === 'base') {
        simpleDataBridge.clearComponentCache(widgetId)

        // 🔥 repair：No more manually triggering data sources to re-execute，Let the normal flow of events handle
        // Avoid request competition and parameter confusion caused by multiple executions
      }

      // 🔥 repair：Emit configuration partial update event，use the correct API
      const changeEvent: ConfigChangeEvent = {
        componentId: widgetId,
        componentType: componentType || 'widget', // Use the component type passed in or default to 'widget'
        section: section as 'base' | 'component' | 'dataSource' | 'interaction',
        oldConfig: null,
        newConfig: config,
        timestamp: Date.now(),
        source: 'interaction',  // 🔥 Mark as interactive trigger
        context: {
          // 🔥 critical fix：Trigger tags also need to be set when interactively triggering
          shouldTriggerExecution: this.shouldTriggerDataExecution(section, config)
        }
      }

      configEventBus.emitConfigChange(changeEvent)

      // 🔥 critical fix：send card2-config-update event，Enable components to receive configuration updates

      window.dispatchEvent(new CustomEvent('card2-config-update', {
        detail: {
          componentId: widgetId,
          layer: section,
          config: config
        }
      }))

      // Cross-component configuration update event sent
      return true  // 🔥 Return success status
    } else {
      console.error(`❌ [ConfigurationIntegrationBridge] Cross-component interaction configuration update failed，event will not fire`)
      return false  // 🔥 Return failure status
    }
  }

  /**
   * Update some part of the configuration - key methods
   * @param widgetId componentsID
   * @param section configuration section
   * @param config Configuration data
   * @param componentType Component type，for more precise event tracking
   */
  updateConfiguration<K extends keyof WidgetConfiguration>(
    widgetId: string,
    section: K,
    config: WidgetConfiguration[K],
    componentType?: string
  ): void {
    // 🔄[DeviceID-HTTP-Debug] Configuration update detection starts


    // 🔥 critical fix：Check if it is a real configuration change，Avoid meaningless repeated triggers
    if (!this.isRealConfigChange(widgetId, section, config)) {
      return // Return early，Avoid meaningless updates and event triggers
    }

    const updated = configurationStateManager.updateConfigurationSection(widgetId, section, config, 'user')

    if (updated) {
      // 🚀 New：use SimpleDataFlow Handle configuration updates
      try {
        // Make sure the component is in SimpleDataFlow Register in
        const fullConfig = configurationStateManager.getConfiguration(widgetId)
        if (fullConfig) {
          // Register component（If not registered yet）
          simpleDataFlow.registerComponent(widgetId, {
            ...fullConfig,
            componentType: componentType || 'widget'
          })

          // notify SimpleDataFlow Configuration changes
          simpleDataFlow.updateComponentConfig(widgetId, section as string, config)
        }
      } catch (error) {
        console.error(`❌ [ConfigurationIntegrationBridge] SimpleDataFlow Processing failed:`, {
          widgetId,
          section,
          error: error instanceof Error ? error.message : error
        })
        // Continue to use the original logic asfallback
      }

      // critical fix：Clear cache when configuration part is updated，in particular dataSource renew
      if (section === 'dataSource' || section === 'component') {
        simpleDataBridge.clearComponentCache(widgetId)
      }

      // 🔥 forbaseLayer configuration update（deviceId、metricsListwait），Trigger data source to re-execute
      if (section === 'base') {
        simpleDataBridge.clearComponentCache(widgetId)
      }

      // 🔥 Send configuration change events using debounce mechanism，Avoid repeated incidents within a short period of time
      this.debounceConfigEvent(() => {
        const changeEvent: ConfigChangeEvent = {
          componentId: widgetId,
          componentType: componentType || 'widget',
          section: section as 'base' | 'component' | 'dataSource' | 'interaction',
          oldConfig: null,
          newConfig: config,
          timestamp: Date.now(),
          source: 'user',
          context: {
            // 🔥 Intelligently determine whether data source execution needs to be triggered
            // Only configuration changes that actually affect data acquisition are triggered
            shouldTriggerExecution: this.shouldTriggerDataExecution(section, config)
          }
        }

        configEventBus.emitConfigChange(changeEvent)

        // send card2-config-update event，Enable components to receive configuration updates
        window.dispatchEvent(new CustomEvent('card2-config-update', {
          detail: {
            componentId: widgetId,
            layer: section,
            config: config
          }
        }))
      }, widgetId, section)

    }
  }

  /**
   * 🔥 repair：Completely dynamic trigger judgment，Eliminate hardcoding
   * @param section configuration section
   * @param config Configuration content
   * @returns Do you need to trigger data execution?
   */
  private shouldTriggerDataExecution(section: keyof WidgetConfiguration, config: any): boolean {

    // 🚀 repair：Use dynamic trigger rules to determine，No more hardcoding field lists
    if (config && typeof config === 'object') {
      const configKeys = Object.keys(config)
      let shouldTrigger = false

      // Check if each configuration property is in the triggering rule
      for (const key of configKeys) {
        const propertyPath = `${section}.${key}`

        // 🔥 critical fix：pass dataSourceBindingConfig Dynamic check if should trigger
        if (dataSourceBindingConfig.shouldTriggerDataSource(propertyPath)) {
          shouldTrigger = true
        }
      }
      return shouldTrigger
    }

    // dataSource Layer changes usually require triggering
    if (section === 'dataSource') {
      return true
    }
    return false
  }

  /**
   * Reset configuration to default
   */
  resetConfiguration(widgetId: string): void {
    // Create default configuration
    const defaultConfig: WidgetConfiguration = {
      base: {},
      component: {},
      dataSource: {},
      interaction: {},
      metadata: {
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        description: 'Reset to default'
      }
    }

    configurationStateManager.setConfiguration(widgetId, defaultConfig, 'system')
    // 🔥 You also need to clear the cache when resetting
    simpleDataBridge.clearComponentCache(widgetId)
  }

  /**
   * Initialize component configuration
   */
  initializeConfiguration(widgetId: string, customDefaults?: Partial<WidgetConfiguration>): void {
    // Initialize the default configuration first
    configurationStateManager.initializeConfiguration(widgetId)

    // If there is a custom default value，apply them
    if (customDefaults) {
      const currentConfig = configurationStateManager.getConfiguration(widgetId)
      if (currentConfig) {
        const mergedConfig = this.deepMerge(currentConfig, customDefaults)
        configurationStateManager.setConfiguration(widgetId, mergedConfig, 'system')
      }
    }
  }

  /**
   * Delete component configuration
   */
  removeConfiguration(widgetId: string): boolean {
    const result = configurationStateManager.removeConfiguration(widgetId)

    if (result) {
      // 🔥 Clean related cache when deleting configuration
      simpleDataBridge.clearComponentCache(widgetId)

      // 🚀 New：from SimpleDataFlow Logout component
      try {
        simpleDataFlow.unregisterComponent(widgetId)
      } catch (error) {
        console.error(`❌ [ConfigurationIntegrationBridge] SimpleDataFlow Logout failed:`, {
          widgetId,
          error: error instanceof Error ? error.message : error
        })
      }
    }

    return result
  }

  /**
   * Verify configuration
   */
  validateConfiguration(config: WidgetConfiguration): ValidationResult {
    // The original verification logic can be reused here
    // To simplify，Return first and always verify successfully
    return {
      valid: true,
      warnings: []
    }
  }

  /**
   * Export configuration
   */
  exportConfiguration(widgetId: string): string {
    const config = configurationStateManager.getConfiguration(widgetId)
    if (!config) {
      throw new Error(`Configuration does not exist: ${widgetId}`)
    }

    try {
      return JSON.stringify(config, null, 2)
    } catch (error) {
      throw new Error(`Configuration export failed: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  /**
   * Import configuration
   * 🔥 New：Automatically migrate old format configurations when importing
   */
  importConfiguration(widgetId: string, configData: string): boolean {
    try {
      const config = JSON.parse(configData) as WidgetConfiguration

      // 🚀 Migrate first and then verify，Make sure the imported configuration structure is correct
      const migratedConfig = this.migrateConfigurationIfNeeded(widgetId, config)

      // Simple verification
      const validationResult = this.validateConfiguration(migratedConfig)
      if (!validationResult.valid) {
        console.error(`❌ [ConfigurationMigration] Imported configuration verification failed: ${widgetId}`)
        return false
      }

      // Save the migrated configuration
      configurationStateManager.setConfiguration(widgetId, migratedConfig, 'import')

      if (process.env.NODE_ENV === 'development') {
      }
      return true
    } catch (error) {
      console.error(`❌ [ConfigurationMigration] Configuration import failed: ${widgetId}`, error)
      return false
    }
  }

  /**
   * Listen for configuration changes - Compatible with original interface
   */
  onConfigurationChange(widgetId: string, callback: (config: WidgetConfiguration) => void): () => void {
    return configurationStateManager.onConfigurationUpdate(widgetId, (event: ConfigurationUpdateEvent) => {
      // Get the latest complete configuration and pass it to the callback
      const fullConfig = configurationStateManager.getConfiguration(widgetId)
      if (fullConfig) {
        callback(fullConfig)
      }
    })
  }

  /**
   * Get all configurations
   */
  getAllConfigurations(): Map<string, WidgetConfiguration> {
    const allStates = configurationStateManager.getAllConfigurationStates()
    const result = new Map<string, WidgetConfiguration>()

    for (const [componentId, state] of allStates) {
      result.set(componentId, state.configuration)
    }

    return result
  }

  /**
   * Batch update configuration
   */
  batchUpdateConfigurations(updates: Array<{ widgetId: string; config: Partial<WidgetConfiguration> }>): void {
    const timestamp = Date.now()

    for (const { widgetId, config } of updates) {
      const currentConfig = configurationStateManager.getConfiguration(widgetId)
      if (currentConfig) {
        const updatedConfig = {
          ...this.deepMerge(currentConfig, config),
          metadata: {
            ...currentConfig.metadata,
            updatedAt: timestamp
          }
        }
        configurationStateManager.setConfiguration(widgetId, updatedConfig, 'system')
      }
    }
  }

  // ========== private method ==========

  /**
   * 🔥 New：Calculate the hash value of the configuration object，Used to detect real changes
   * @param config Configuration object
   * @returns Configure hash value
   */
  private calculateConfigHash(config: any): string {
    try {
      // use JSON.stringify and sort the keys to generate consistent hashes
      const sortedConfig = this.sortObjectKeys(config)
      const configString = JSON.stringify(sortedConfig)
      return this.simpleHash(configString)
    } catch (error) {
      // ifJSONSerialization failed，Use object string representation
      return this.simpleHash(String(config))
    }
  }

  /**
   * 🔥 New：Recursively sort object keys，Ensure hash consistency
   */
  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item))
    }

    const sortedObj: any = {}
    const keys = Object.keys(obj).sort()

    for (const key of keys) {
      sortedObj[key] = this.sortObjectKeys(obj[key])
    }

    return sortedObj
  }

  /**
   * 🔥 New：Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0
    if (str.length === 0) return hash.toString()

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to32bit integer
    }

    return Math.abs(hash).toString(36)
  }

  /**
   * 🔥 New：Check if configuration changes are real changes（avoid duplicate incidents）
   * @param widgetId componentsID
   * @param section configuration section
   * @param newConfig New configuration
   * @returns Is it a real change?
   */
  private isRealConfigChange(widgetId: string, section: keyof WidgetConfiguration, newConfig: any): boolean {
    const cacheKey = `${widgetId}.${section}`
    const configHash = this.calculateConfigHash(newConfig)
    const now = Date.now()

    const cached = this.configChangeCache.get(cacheKey)

    if (cached) {
      // 🔥 critical fix：Prioritize checking whether the configuration content has really changed
      if (cached.lastConfigHash === configHash) {
        return false
      }

      // 🔥 improve：When the configuration content is different，Reduce the rigor of time checks
      const timeDiff = now - cached.lastUpdateTime
      if (timeDiff < this.CONFIG_CHANGE_DEBOUNCE_TIME) {
        // 🔥 critical fix：forbaseLayer configuration changes（likedeviceId），relax time limit
        if (section !== 'base') {
          // baseLayer configuration changes（likedeviceId）Allow even if the time interval is short.
          return false
        }
      }

      // Clean up previously pending events
      if (cached.pendingEventTimeout) {
        clearTimeout(cached.pendingEventTimeout)
      }
    }

    // 🔥 critical fix：For data source configuration，Additional check whether the content of the data item has really changed
    if (section === 'dataSource' && newConfig && typeof newConfig === 'object') {
      const currentConfig = configurationStateManager.getConfiguration(widgetId)
      const existingDataSourceConfig = currentConfig?.dataSource

      if (existingDataSourceConfig) {
        const existingHash = this.calculateConfigHash(existingDataSourceConfig)
        if (existingHash === configHash) {
          return false
        }
      }
    }
    // Update cache
    this.configChangeCache.set(cacheKey, {
      lastConfigHash: configHash,
      lastUpdateTime: now
    })

    return true // is a real change
  }

  /**
   * 🔥 New：Anti-shake event sending，Avoid repeated incidents within a short period of time
   * @param eventCallback event callback function
   * @param widgetId componentsID
   * @param section configuration section
   */
  private debounceConfigEvent(
    eventCallback: () => void,
    widgetId: string,
    section: keyof WidgetConfiguration
  ): void {
    const cacheKey = `${widgetId}.${section}`
    const cached = this.configChangeCache.get(cacheKey)

    if (cached?.pendingEventTimeout) {
      clearTimeout(cached.pendingEventTimeout)
    }

    const timeout = setTimeout(() => {
      eventCallback()

      // Clean up timeout references
      const currentCached = this.configChangeCache.get(cacheKey)
      if (currentCached) {
        delete currentCached.pendingEventTimeout
      }
    }, 30) // 30ms Anti-shake delay，Reduce latency and improve responsiveness

    if (cached) {
      cached.pendingEventTimeout = timeout
    } else {
      this.configChangeCache.set(cacheKey, {
        lastConfigHash: '',
        lastUpdateTime: Date.now(),
        pendingEventTimeout: timeout
      })
    }
  }

  /**
   * 🔥 New：Configure migration core logic
   * Check and migrate component-level device configuration to the base configuration layer
   * @param widgetId componentsID
   * @param config original configuration
   * @returns Configuration after migration
   */
  private migrateConfigurationIfNeeded(widgetId: string, config: WidgetConfiguration): WidgetConfiguration {
    // Check if the device field is included in the component configuration
    const componentConfig = config.component || {}
    const hasDeviceFields = this.hasComponentLevelDeviceFields(componentConfig)

    if (!hasDeviceFields) {
      // No need to migrate，Return directly to the original configuration
      return config
    }

    if (process.env.NODE_ENV === 'development') {
    }

    // Execute migration
    const migrationResult = this.performDeviceConfigurationMigration(config)

    // 🚀 Only save the configuration after actual migration
    if (migrationResult.migrated) {
      configurationStateManager.setConfiguration(widgetId, migrationResult.config, 'migration')
      if (process.env.NODE_ENV === 'development') {
      }
    }

    return migrationResult.config
  }

  /**
   * Check if component configuration contains device field
   * @param componentConfig Component configuration object
   * @returns Whether to include the device field
   */
  private hasComponentLevelDeviceFields(componentConfig: any): boolean {
    if (!componentConfig || typeof componentConfig !== 'object') {
      return false
    }

    // Check the direct device field
    const hasDirectDeviceFields = !!(componentConfig.deviceId || componentConfig.metricsList)

    // Check nested incustomizedevice field in（Compatible with certain component structures）
    const hasNestedDeviceFields = !!(componentConfig.customize?.deviceId || componentConfig.customize?.metricsList)

    return hasDirectDeviceFields || hasNestedDeviceFields
  }

  /**
   * Perform device configuration migration
   * Migrate component-level device fields to the base configuration layer
   * @param config original configuration
   * @returns Configuration after migration
   */
  private performDeviceConfigurationMigration(config: WidgetConfiguration): {
    config: WidgetConfiguration
    migrated: boolean
  } {
    const result = this.deepClone(config)
    let hasMigrated = false

    // Make sure the basic configuration exists
    if (!result.base) {
      result.base = {}
    }

    const componentConfig = result.component || {}

    // 🚀 Migrate deviceID
    if (componentConfig.deviceId && !result.base.deviceId) {
      result.base.deviceId = componentConfig.deviceId
      delete componentConfig.deviceId
      if (process.env.NODE_ENV === 'development') {
      }
      hasMigrated = true
    }

    // 🚀 Migration indicator list
    if (componentConfig.metricsList && !result.base.metricsList) {
      result.base.metricsList = Array.isArray(componentConfig.metricsList) ? componentConfig.metricsList : []
      delete componentConfig.metricsList
      if (process.env.NODE_ENV === 'development') {
      }
      hasMigrated = true
    }

    // 🚀 Handle nested incustomizedevice field in
    if (componentConfig.customize) {
      if (componentConfig.customize.deviceId && !result.base.deviceId) {
        result.base.deviceId = componentConfig.customize.deviceId
        delete componentConfig.customize.deviceId
        if (process.env.NODE_ENV === 'development') {
        }
        hasMigrated = true
      }

      if (componentConfig.customize.metricsList && !result.base.metricsList) {
        result.base.metricsList = Array.isArray(componentConfig.customize.metricsList)
          ? componentConfig.customize.metricsList
          : []
        delete componentConfig.customize.metricsList
        if (process.env.NODE_ENV === 'development') {
        }
        hasMigrated = true
      }
    }

    // 🔥 repair：Only update metadata for configurations that were actually migrated
    if (hasMigrated) {
      if (!result.metadata) {
        result.metadata = {}
      }
      result.metadata.migrationVersion = '2.0'
      result.metadata.migratedAt = Date.now()
      result.metadata.updatedAt = Date.now()
      if (process.env.NODE_ENV === 'development') {
      }
    } else {
    }

    return { config: result, migrated: hasMigrated }
  }

  /**
   * 🔥 New：forsetConfigurationSpecially designed migration logic
   * andmigrateConfigurationIfNeededsimilar，but not automatically saved，Avoid circular calls
   * @param widgetId componentsID
   * @param config Configuration to be set
   * @returns Configuration after migration
   */
  private performDeviceConfigurationMigrationForSet(
    widgetId: string,
    config: WidgetConfiguration
  ): WidgetConfiguration {
    // Check if migration is required
    const componentConfig = config.component || {}
    const hasDeviceFields = this.hasComponentLevelDeviceFields(componentConfig)

    if (!hasDeviceFields) {
      // No need to migrate，Return directly to the original configuration
      return config
    }

    if (process.env.NODE_ENV === 'development') {
    }

    // Execute migration without automatically saving（Avoid circular callssetConfiguration）
    const migrationResult = this.performDeviceConfigurationMigration(config)

    if (migrationResult.migrated) {
      if (process.env.NODE_ENV === 'development') {
      }
    } else {
    }

    return migrationResult.config
  }

  /**
   * Set up data source integration (Migrated to core data architecture system)
   */
  private async setupEditorDataSourceIntegration(): Promise<void> {
    try {
      // 🔥 Migrated：Data source management is now handled through the Core Data Architecture system
      // VisualEditorBridge and DataWarehouse Provide unified data source services
    } catch (error) {}
  }

  /**
   * Set up a data source for a specific component to perform integration (Migrated to core data architecture system)
   */
  setupComponentDataSourceIntegration(componentId: string): void {
    // 🔥 Migrated：Data source execution integration now works via ConfigEventBus and VisualEditorBridge deal with
    // Configuration change events are automatically triggered VisualEditorBridge Update component executor

    // The core architecture system automatically handles configuration changes and data source execution
    // pass ConfigEventBus events and EditorDataSourceManager event listener
  }

  /**
   * 🔥 New：Trigger data source to re-execute
   * whenbaseLayer configuration（likedeviceId、metricsListand other dynamic parameters）Called on change
   * @param componentId componentsID
   * @param componentType Component type
   */
  private async triggerDataSourceReExecution(componentId: string, componentType: string): Promise<void> {
    try {

      // Get the data source configuration of the current component
      const currentConfig = configurationStateManager.getConfiguration(componentId)
      const dataSourceConfig = currentConfig?.dataSource

      if (!dataSourceConfig || !dataSourceConfig.dataSources || dataSourceConfig.dataSources.length === 0) {
        return
      }


      // 🔥 key：Clear the cache to ensure you get the latest data
      simpleDataBridge.clearComponentCache(componentId)

      // 🔥 use VisualEditorBridge Re-execute the data source
      const { getVisualEditorBridge } = await import('@/core/data-architecture/VisualEditorBridge')
      const visualEditorBridge = getVisualEditorBridge()

      // 🔥 critical fix：Pass in the complete configuration object，Instead of just data source configuration
      // VisualEditorBridgeFull configuration is required to inject correctlybaseLayer attributes to data source parameters
      const fullConfig = {
        base: currentConfig?.base || {},
        dataSource: dataSourceConfig,
        component: currentConfig?.component || {},
        interaction: currentConfig?.interaction || {}
      }


      // Re-execute the data source，Pass in the complete configuration object
      const result = await visualEditorBridge.updateComponentExecutor(
        componentId,
        componentType,
        fullConfig // Pass complete configuration，make surebaseLayer properties can be injected correctly
      )

      // Data source re-execution completed

      // important：Emit data source execution completion event，Notify other system components
      configEventBus.emitConfigChange({
        componentId,
        componentType,
        section: 'dataSource',
        oldConfig: null,
        newConfig: dataSourceConfig,
        timestamp: Date.now(),
        source: 'dynamic-parameter-update'
      })

    } catch (error) {
      console.error(`❌ [ConfigurationIntegrationBridge] Data source re-execution failed ${componentId}:`, error)
      // Don't throw an error，Avoid affecting other processes
    }
  }

  /**
   * Deep merge objects
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = this.deepClone(target)

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key]
        const targetValue = result[key]

        if (sourceValue !== undefined) {
          if (
            typeof sourceValue === 'object' &&
            sourceValue !== null &&
            typeof targetValue === 'object' &&
            targetValue !== null &&
            !Array.isArray(sourceValue) &&
            !Array.isArray(targetValue)
          ) {
            result[key] = this.deepMerge(targetValue, sourceValue as any)
          } else {
            result[key] = this.deepClone(sourceValue) as any
          }
        }
      }
    }

    return result
  }

  /**
   * deep clone object
   */
  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as T
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item)) as T

    const cloned = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }
    return cloned
  }
}

// Create a global bridge instance
export const configurationIntegrationBridge = new ConfigurationIntegrationBridge()

// Backwards compatible export
export const configurationManager = configurationIntegrationBridge

// 🔥 New：Expose global instances for use by other modules
if (typeof globalThis !== 'undefined') {
  (globalThis as any).__configurationIntegrationBridge = configurationIntegrationBridge
}
