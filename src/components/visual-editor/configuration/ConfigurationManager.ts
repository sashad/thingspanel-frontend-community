/**
 * configuration manager
 * Responsible for managing the configuration data of all components，Provide configurationCRUDOperation and event listening
 *
 * Task 1.2 Refactor：Integrated configuration event bus，Implement a decoupled architecture
 */
import { reactive, ref, computed } from 'vue'

import type {
  IConfigurationManager,
  WidgetConfiguration,
  ValidationResult,
  ConfigurationPreset,
  ConfigurationMigrator,
  BaseConfiguration,
  ComponentConfiguration,
  DataSourceConfiguration,
  InteractionConfiguration
} from './types'

// 🔥 import SimpleDataBridge for clearing cache
import { simpleDataBridge } from '@/core/data-architecture/SimpleDataBridge'

// 🆕 Task 1.2: Import configuration event bus
import { configEventBus, type ConfigChangeEvent } from '@/core/data-architecture/ConfigEventBus'
import { smartDeepClone } from '@/utils/deep-clone'

/**
 * Default configuration factory
 * 🔧 Refactor：The principle of autonomy at all levels - Configurator only provides empty structure，Filled by each layer itself
 */
export const createDefaultConfiguration = (): WidgetConfiguration => ({
  // 🔧 BaseConfiguration：Depend onNodeWrapperLayer autonomy management and definition
  base: {},

  // 🔧 ComponentConfiguration：by eachCard2.1Autonomous management and definition of components
  component: {},

  // 🔧 DataSourceConfiguration：Managed and defined by independent data source systems
  dataSource: {},

  // 🔧 InteractionConfiguration：Managed and defined by independent interactive systems
  interaction: {},

  // 🔧 metadata：Configurator layer unified management
  metadata: {
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    description: ''
  }
})

/**
 * Configuration manager implementation
 */
export class ConfigurationManager implements IConfigurationManager {
  // Stores the configuration of all components
  private configurations = reactive(new Map<string, WidgetConfiguration>())

  // Configure change listener
  private listeners = new Map<string, Set<(config: WidgetConfiguration) => void>>()

  // 🆕 Task 1.2: Configuration change context tracking
  private lastUpdatedSection: keyof WidgetConfiguration = 'component'
  private previousConfigs = new Map<string, WidgetConfiguration>()

  // Configure presets
  private presets = ref<ConfigurationPreset[]>([])

  // Configure the migrator
  private migrators: ConfigurationMigrator[] = []

  // 🆕 Persistence storage key name
  /**
   * Constructor - 🔥 RemovedlocalStoragerely，Comply with architectural principles
   */
  constructor() {
    // 🔥 Configuration completely relies on the unified configuration center，No needlocalStorage
  }

  /**
   * Get component configuration
   */
  getConfiguration(widgetId: string): WidgetConfiguration | null {
    const config = this.configurations.get(widgetId)
    if (!config) {
      return null
    }

    // 🔍 [DEBUG-Configure warehouse] Print the read configuration object
    // Returns a copy of the configuration，Avoid direct external modifications
    return this.deepClone(config)
  }

  /**
   * Set component configuration
   */
  setConfiguration(widgetId: string, config: WidgetConfiguration): void {
    // Verify configuration
    const validationResult = this.validateConfiguration(config)
    if (!validationResult.valid) {
      throw new Error(`Configuration verification failed: ${validationResult.errors?.[0]?.message || 'unknown error'}`)
    }

    // Update timestamp
    const updatedConfig = {
      ...config,
      metadata: {
        ...config.metadata,
        updatedAt: Date.now()
      }
    }
    // Save configuration
    this.configurations.set(widgetId, updatedConfig)
    // 🔥 RemovedlocalStoragepersistence - Configuration depends on the unified configuration center

    // trigger listener
    this.notifyListeners(widgetId, updatedConfig)
  }

  /**
   * Update some part of the configuration
   *
   * 🔥 Important note：
   * - Data source configuration uses direct replacement，avoid deepMerge resulting in an infinite loop
   * - Other configurations use deep merging，Maintain backward compatibility
   */
  updateConfiguration<K extends keyof WidgetConfiguration>(
    widgetId: string,
    section: K,
    config: WidgetConfiguration[K]
  ): void {
    const currentConfig = this.configurations.get(widgetId)
    if (!currentConfig) {
      this.initializeConfiguration(widgetId)
      return this.updateConfiguration(widgetId, section, config)
    }

    // 🆕 Task 1.2: Save the configuration status before changes
    this.previousConfigs.set(widgetId, this.deepClone(currentConfig))
    this.lastUpdatedSection = section

    // 🔥 critical fix：Data source configuration uses replace instead of merge，Avoid infinite loops
    const currentSectionValue = currentConfig[section]
    const mergedSectionValue =
      section === 'dataSource'
        ? (() => {
            return config // Direct replacement of data source configuration，avoiddeepMergeCirculation problems caused by
          })()
        : currentSectionValue !== null && currentSectionValue !== undefined
          ? this.deepMerge(currentSectionValue, config)
          : config // If the current value is null or undefined，Use the new configuration directly

    const updatedConfig = {
      ...currentConfig,
      [section]: mergedSectionValue,
      metadata: {
        ...currentConfig.metadata,
        updatedAt: Date.now()
      }
    }

    this.configurations.set(widgetId, updatedConfig)

    // 🔥 RemovedlocalStoragepersistence - Configuration depends on the unified configuration center

    // 🔥 Important fixes：Clear component cache，Make sure the new configuration can be executed
    if (section === 'dataSource') {
      simpleDataBridge.clearComponentCache(widgetId)
    }
    // 🔍 [DEBUG-Configure warehouse] Print the entire configuration object
    // trigger listener
    this.notifyListeners(widgetId, updatedConfig)
  }

  /**
   * Reset configuration to default
   */
  resetConfiguration(widgetId: string): void {
    const defaultConfig = createDefaultConfiguration()
    this.configurations.set(widgetId, defaultConfig)
    // trigger listener
    this.notifyListeners(widgetId, defaultConfig)
  }

  /**
   * Initialize component configuration
   */
  initializeConfiguration(widgetId: string, customDefaults?: Partial<WidgetConfiguration>): void {
    if (this.configurations.has(widgetId)) {
      return
    }

    const defaultConfig = createDefaultConfiguration()
    const initialConfig = customDefaults ? this.deepMerge(defaultConfig, customDefaults) : defaultConfig

    this.configurations.set(widgetId, initialConfig)

    // trigger listener，Notification configuration initialized
    this.notifyListeners(widgetId, initialConfig)
  }

  /**
   * Delete component configuration
   */
  removeConfiguration(widgetId: string): boolean {
    const exists = this.configurations.has(widgetId)
    if (exists) {
      this.configurations.delete(widgetId)

      // Clean up listeners
      this.listeners.delete(widgetId)
    }
    return exists
  }

  /**
   * Verify configuration
   */
  validateConfiguration(config: WidgetConfiguration): ValidationResult {
    const errors: ValidationResult['errors'] = []
    const warnings: ValidationResult['warnings'] = []

    try {
      // Basic configuration verification
      if (config.base) {
        if (typeof config.base.showTitle !== 'boolean') {
          errors?.push({
            field: 'base.showTitle',
            message: 'showTitle Must be a boolean value'
          })
        }

        if (config.base.title && typeof config.base.title !== 'string') {
          errors?.push({
            field: 'base.title',
            message: 'title Must be a string'
          })
        }

        if (
          config.base.opacity !== undefined &&
          (typeof config.base.opacity !== 'number' || config.base.opacity < 0 || config.base.opacity > 1)
        ) {
          errors?.push({
            field: 'base.opacity',
            message: 'opacity must be0-1value between'
          })
        }
      }

      // Data source configuration verification
      if (config.dataSource) {
        const validTypes = ['static', 'api', 'websocket', 'multi-source', 'data-mapping', 'data-source-bindings', '']
        if (config.dataSource.type && !validTypes.includes(config.dataSource.type)) {
          errors?.push({
            field: 'dataSource.type',
            message: 'Invalid data source type'
          })
        }

        // Verify multiple data source configuration
        if (config.dataSource.type === 'multi-source') {
          if (!config.dataSource.sources || !Array.isArray(config.dataSource.sources)) {
            errors?.push({
              field: 'dataSource.sources',
              message: 'Multiple data source configurations must includesourcesarray'
            })
          }
        }

        // Verify data mapping configuration
        if (config.dataSource.type === 'data-mapping') {
          if (!config.dataSource.config) {
            errors?.push({
              field: 'dataSource.config',
              message: 'Data mapping configuration must containconfigobject'
            })
          } else {
            // Check if necessary mapping configuration is included
            const mappingConfig = config.dataSource.config
            if (!mappingConfig.arrayDataSource && !mappingConfig.objectDataSource) {
              warnings?.push({
                field: 'dataSource.config',
                message: 'It is recommended to configure at least one data source（array or object）'
              })
            }
          }
        }

        // Verify data source binding configuration（Simplify verification，Mainly used for presentations）
        if (config.dataSource.type === 'data-source-bindings') {
          if (!config.dataSource.config) {
            // For demo components，config Can be empty，only give warning
            warnings?.push({
              field: 'dataSource.config',
              message: 'Data source binding configuration is empty，The component will use default data'
            })
          } else if (config.dataSource.config.dataSourceBindings) {
            // Examine the basic structure of the binding configuration
            const bindings = config.dataSource.config.dataSourceBindings
            if (typeof bindings !== 'object') {
              warnings?.push({
                field: 'dataSource.config.dataSourceBindings',
                message: 'The data source binding should be an object'
              })
            }
          }
        }
      }

      // Interactive configuration verification
      if (config.interaction) {
        for (const [eventName, eventConfig] of Object.entries(config.interaction)) {
          if (
            eventConfig &&
            eventConfig.type &&
            !['none', 'link', 'internal_route', 'modal', 'drawer', 'custom_script', 'emit_event'].includes(
              eventConfig.type
            )
          ) {
            errors?.push({
              field: `interaction.${eventName}.type`,
              message: `Invalid interaction type: ${eventConfig.type}`
            })
          }
        }
      }

      // Component configuration verification
      if (config.component?.validation?.required) {
        for (const requiredField of config.component.validation.required) {
          if (!config.component.properties[requiredField]) {
            warnings?.push({
              field: `component.properties.${requiredField}`,
              message: `Required fields are missing: ${requiredField}`
            })
          }
        }
      }
    } catch (error) {
      errors?.push({
        field: 'global',
        message: `Configuration validation exception: ${error instanceof Error ? error.message : 'unknown error'}`
      })
    }

    return {
      valid: errors?.length === 0,
      errors: errors?.length ? errors : undefined,
      warnings: warnings?.length ? warnings : undefined
    }
  }

  /**
   * Export configuration
   */
  exportConfiguration(widgetId: string): string {
    const config = this.configurations.get(widgetId)
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
   * Import component configuration
   * @param componentId - componentsID
   * @param configuration - Configuration to import
   */
  public importConfiguration(componentId: string, configuration: Record<string, any>): void {

    // Before setting up a new configuration，Iterate through all data sources in the old configuration that will be replaced，and clear their cache
    const oldConfig = this.configurations[componentId]
    if (oldConfig) {
      for (const key in oldConfig) {
        // Check if the property is of data source type
        if (oldConfig[key] && oldConfig[key].dataType === 'dataSource') {
          this.clearDataSourceCache(componentId, key)
        }
      }
    }

    this.setConfiguration(componentId, configuration)
  }

  /**
   * Listen for configuration changes
   */
  onConfigurationChange(widgetId: string, callback: (config: WidgetConfiguration) => void): () => void {
    if (!this.listeners.has(widgetId)) {
      this.listeners.set(widgetId, new Set())
    }

    this.listeners.get(widgetId)!.add(callback)

    // Returns the function to cancel listening
    return () => {
      const listeners = this.listeners.get(widgetId)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(widgetId)
        }
      }
    }
  }

  /**
   * Get all configurations
   */
  getAllConfigurations(): Map<string, WidgetConfiguration> {
    return new Map(this.configurations)
  }

  /**
   * Batch update configuration
   */
  batchUpdateConfigurations(updates: Array<{ widgetId: string; config: Partial<WidgetConfiguration> }>): void {
    const timestamp = Date.now()

    for (const { widgetId, config } of updates) {
      const currentConfig = this.configurations.get(widgetId)
      if (currentConfig) {
        const updatedConfig = {
          ...this.deepMerge(currentConfig, config),
          metadata: {
            ...currentConfig.metadata,
            updatedAt: timestamp
          }
        }
        this.configurations.set(widgetId, updatedConfig)
      }
    }
  }

  // private method

  /**
   * notification listener
   * Task 1.2 Refactor：Integrated event bus，Realize the coexistence of old and new architectures
   */
  private notifyListeners(widgetId: string, config: WidgetConfiguration): void {
    // 1. Original listener notification（backwards compatible）
    const listeners = this.listeners.get(widgetId)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(this.deepClone(config))
        } catch (error) {}
      })
    }

    // 2. 🆕 Task 1.2: Send to event bus（new architecture）
    this.emitToEventBus(widgetId, config)
  }

  /**
   * 🆕 Task 1.2: Send configuration change events to the event bus
   */
  private emitToEventBus(widgetId: string, config: WidgetConfiguration): void {
    try {
      const previousConfig = this.previousConfigs.get(widgetId)

      const event: ConfigChangeEvent = {
        componentId: widgetId,
        componentType: '', // Component type cannot be obtained here，The listener is responsible for filtering
        section: this.lastUpdatedSection,
        oldConfig: previousConfig,
        newConfig: config,
        timestamp: Date.now(),
        source: 'user', // Default is user triggered
        context: {
          triggerComponent: 'ConfigurationManager',
          shouldTriggerExecution: true,
          changedFields: this.getChangedFields(previousConfig, config)
        }
      }
      // Send events asynchronously，Avoid blocking the current process
      configEventBus.emitConfigChange(event).catch(error => {})
    } catch (error) {}
  }

  /**
   * 🆕 Task 1.2: Get a list of changed fields
   */
  private getChangedFields(oldConfig: WidgetConfiguration | undefined, newConfig: WidgetConfiguration): string[] {
    if (!oldConfig) return []

    const changedFields: string[] = []

    // Check for changes at various configuration levels
    if (JSON.stringify(oldConfig.base) !== JSON.stringify(newConfig.base)) {
      changedFields.push('base')
    }
    if (JSON.stringify(oldConfig.component) !== JSON.stringify(newConfig.component)) {
      changedFields.push('component')
    }
    if (JSON.stringify(oldConfig.dataSource) !== JSON.stringify(newConfig.dataSource)) {
      changedFields.push('dataSource')
    }
    if (JSON.stringify(oldConfig.interaction) !== JSON.stringify(newConfig.interaction)) {
      changedFields.push('interaction')
    }

    return changedFields
  }

  /**
   * Deep clone object
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
   * Migrate configuration to the latest version
   */
  private migrateConfiguration(config: WidgetConfiguration): WidgetConfiguration {
    let result = config

    for (const migrator of this.migrators) {
      if (config.metadata?.version === migrator.fromVersion) {
        result = migrator.migrate(result)
      }
    }

    return result
  }

  /**
   * Register configuration migrator
   */
  registerMigrator(migrator: ConfigurationMigrator): void {
    this.migrators.push(migrator)
  }

  /**
   * Add configuration preset
   */
  addPreset(preset: ConfigurationPreset): void {
    this.presets.value.push(preset)
  }

  /**
   * Get configuration presets
   */
  getPresets(componentType?: string): ConfigurationPreset[] {
    if (componentType) {
      return this.presets.value.filter(
        preset => !preset.componentTypes || preset.componentTypes.includes(componentType)
      )
    }
    return [...this.presets.value]
  }

  /**
   * Apply configuration presets
   */
  applyPreset(widgetId: string, presetName: string): boolean {
    const preset = this.presets.value.find(p => p.name === presetName)
    if (!preset) {
      return false
    }

    const currentConfig = this.configurations.get(widgetId)
    if (!currentConfig) {
      return false
    }

    const updatedConfig = this.deepMerge(currentConfig, preset.config)
    this.setConfiguration(widgetId, updatedConfig)
    return true
  }

}

// Export global configuration manager singleton
export const configurationManager = new ConfigurationManager()

export default configurationManager
