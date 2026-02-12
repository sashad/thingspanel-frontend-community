/**
 * Unified configuration service class
 * replace the originalConfigurationManager，Provide clear configuration managementAPI
 */

import { useUnifiedEditorStore } from '@/store/modules/visual-editor/unified-editor'
import type {
  WidgetConfiguration,
  BaseConfiguration,
  ComponentConfiguration,
  DataSourceConfiguration,
  InteractionConfiguration
} from './unified-editor'

/**
 * Configuration change event type
 */
export interface ConfigurationChangeEvent {
  widgetId: string
  section: keyof WidgetConfiguration
  oldValue: any
  newValue: any
  timestamp: Date
}

/**
 * Configuration verification results
 */
export interface ConfigurationValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Configure migration information
 */
export interface ConfigurationMigration {
  fromVersion: string
  toVersion: string
  migrate: (config: any) => any
}

/**
 * Unified configuration service class
 * 🔥 This is the only entrance to configuration management，Replaces all fragmented configuration management logic
 */
export class ConfigurationService {
  private store = useUnifiedEditorStore()
  private eventBus = new EventTarget()
  private migrations: ConfigurationMigration[] = []

  // ==================== Core configuration operations ====================

  /**
   * Get complete component configuration
   * 🔥 The only entry for configuration acquisition
   */
  getConfiguration(widgetId: string): WidgetConfiguration {
    return this.store.getFullConfiguration(widgetId)
  }

  /**
   * Get a specific part of the configuration
   */
  getConfigurationSection<T extends keyof WidgetConfiguration>(widgetId: string, section: T): WidgetConfiguration[T] {
    const fullConfig = this.getConfiguration(widgetId)
    return fullConfig[section]
  }

  /**
   * Set up complete component configuration
   */
  setConfiguration(widgetId: string, configuration: WidgetConfiguration): void {
    // Verify configuration
    const validation = this.validateConfiguration(configuration)
    if (!validation.valid) {
      throw new Error(`Configuration verification failed: ${validation.errors.join(', ')}`)
    }

    // Get old configuration for event
    const oldConfig = this.getConfiguration(widgetId)

    // Set up each part separately
    if (configuration.base) {
      this.store.setBaseConfiguration(widgetId, configuration.base)
    }
    if (configuration.component) {
      this.store.setComponentConfiguration(widgetId, configuration.component)
    }
    if (configuration.dataSource) {
      this.store.setDataSourceConfiguration(widgetId, configuration.dataSource)
    }
    if (configuration.interaction) {
      this.store.setInteractionConfiguration(widgetId, configuration.interaction)
    }

    // Trigger global configuration change event
    this.emitConfigurationChange(widgetId, 'full', oldConfig, configuration)
  }

  /**
   * Update a specific part of the configuration
   * 🔥 Type-safe configuration updates
   */
  updateConfigurationSection<T extends keyof WidgetConfiguration>(
    widgetId: string,
    section: T,
    data: WidgetConfiguration[T]
  ): void {
    // Get old value for event
    const oldValue = this.getConfigurationSection(widgetId, section)

    // according tosectionTypes are handled separately
    switch (section) {
      case 'base':
        this.store.setBaseConfiguration(widgetId, data as BaseConfiguration)
        break
      case 'component':
        this.store.setComponentConfiguration(widgetId, data as ComponentConfiguration)
        break
      case 'dataSource':
        this.store.setDataSourceConfiguration(widgetId, data as DataSourceConfiguration)
        break
      case 'interaction':
        this.store.setInteractionConfiguration(widgetId, data as InteractionConfiguration)
        break
      default:
        return
    }

    // Trigger configuration change event
    this.emitConfigurationChange(widgetId, section, oldValue, data)
  }

  /**
   * Batch update configuration
   */
  batchUpdateConfiguration(
    updates: Array<{
      widgetId: string
      section: keyof WidgetConfiguration
      data: any
    }>
  ): void {
    updates.forEach(update => {
      this.updateConfigurationSection(update.widgetId, update.section, update.data)
    })
  }

  // ==================== Data source management ====================

  /**
   * Dedicated data source configuration management
   * 🔥 Solve the problem of confusing data source configuration
   */
  setDataSourceConfig(widgetId: string, config: DataSourceConfiguration): void {
    // Verify data source configuration
    const validation = this.validateDataSourceConfig(config)
    if (!validation.valid) {
      throw new Error(`Data source configuration verification failed: ${validation.errors.join(', ')}`)
    }

    // Update configuration
    this.updateConfigurationSection(widgetId, 'dataSource', config)

    // Handling data source related side effects
    this.handleDataSourceSideEffects(widgetId, config)
  }

  /**
   * Update data source binding
   */
  updateDataSourceBindings(widgetId: string, bindings: Record<string, any>): void {
    const currentConfig = this.getConfigurationSection(widgetId, 'dataSource')
    if (!currentConfig) {
      throw new Error(`components ${widgetId} No data source configuration`)
    }

    const updatedConfig: DataSourceConfiguration = {
      ...currentConfig,
      bindings: { ...currentConfig.bindings, ...bindings }
    }

    this.setDataSourceConfig(widgetId, updatedConfig)
  }

  /**
   * Set runtime data
   */
  setRuntimeData(widgetId: string, data: any): void {
    this.store.setRuntimeData(widgetId, data)

    // Trigger runtime data change events
    this.emitRuntimeDataChange(widgetId, data)
  }

  /**
   * Get runtime data
   */
  getRuntimeData(widgetId: string): any {
    return this.store.getRuntimeData(widgetId)
  }

  // ==================== Configure persistence ====================

  /**
   * Save configuration to local storage
   */
  async saveConfiguration(widgetId: string): Promise<void> {
    const config = this.getConfiguration(widgetId)

    try {
      // save tolocalStorage（Can be expanded to the server later）
      const storageKey = `widget_config_${widgetId}`
      localStorage.setItem(storageKey, JSON.stringify(config))
    } catch (error) {
      throw error
    }
  }

  /**
   * Load configuration from local storage
   */
  async loadConfiguration(widgetId: string): Promise<WidgetConfiguration | null> {
    try {
      const storageKey = `widget_config_${widgetId}`
      const savedData = localStorage.getItem(storageKey)

      if (!savedData) {
        return null
      }

      const config = JSON.parse(savedData)

      // Configure migration processing
      const migratedConfig = this.migrateConfiguration(config)

      // Verify loaded configuration
      const validation = this.validateConfiguration(migratedConfig)
      if (!validation.valid) {
        return null
      }
      return migratedConfig
    } catch (error) {
      return null
    }
  }

  /**
   * Save all configurations in batches
   */
  async saveAllConfigurations(): Promise<void> {
    const nodeIds = this.store.nodes.map(node => node.id)

    await Promise.all(nodeIds.map(id => this.saveConfiguration(id)))

    this.store.markSaved()
  }

  // ==================== Configuration verification ====================

  /**
   * Verify complete configuration
   */
  private validateConfiguration(config: WidgetConfiguration): ConfigurationValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic configuration verification
    if (config.base) {
      if (typeof config.base.opacity !== 'undefined' && (config.base.opacity < 0 || config.base.opacity > 1)) {
        errors.push('Transparency must be in0-1between')
      }
    }

    // Data source configuration verification
    if (config.dataSource) {
      const dsValidation = this.validateDataSourceConfig(config.dataSource)
      errors.push(...dsValidation.errors)
      warnings.push(...dsValidation.warnings)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Verify data source configuration
   */
  private validateDataSourceConfig(config: DataSourceConfiguration): ConfigurationValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check data source type
    const validTypes = ['static', 'api', 'websocket', 'device', 'script']
    if (!validTypes.includes(config.type)) {
      errors.push(`Invalid data source type: ${config.type}`)
    }

    // type specific validation
    switch (config.type) {
      case 'api':
        if (!config.config.url) {
          errors.push('APIData source must be providedURL')
        }
        break
      case 'websocket':
        if (!config.config.url) {
          errors.push('WebSocketData source must be providedURL')
        }
        break
      case 'device':
        if (!config.config.deviceId) {
          errors.push('The device data source must provide the deviceID')
        }
        break
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  // ==================== Configuration migration ====================

  /**
   * Register configuration migration
   */
  registerMigration(migration: ConfigurationMigration): void {
    this.migrations.push(migration)
  }

  /**
   * Perform configuration migration
   */
  private migrateConfiguration(config: any): WidgetConfiguration {
    let migratedConfig = { ...config }

    for (const migration of this.migrations) {
      if (config.metadata?.version === migration.fromVersion) {
        migratedConfig = migration.migrate(migratedConfig)
      }
    }

    return migratedConfig
  }

  // ==================== event system ====================

  /**
   * Listen for configuration change events
   */
  onConfigurationChange(callback: (event: ConfigurationChangeEvent) => void): () => void {
    const handler = (event: CustomEvent<ConfigurationChangeEvent>) => {
      callback(event.detail)
    }

    this.eventBus.addEventListener('configuration-change', handler as EventListener)

    // Return to cancel listening function
    return () => {
      this.eventBus.removeEventListener('configuration-change', handler as EventListener)
    }
  }

  /**
   * Trigger configuration change event
   */
  private emitConfigurationChange(
    widgetId: string,
    section: keyof WidgetConfiguration | 'full',
    oldValue: any,
    newValue: any
  ): void {
    const event: ConfigurationChangeEvent = {
      widgetId,
      section: section as keyof WidgetConfiguration,
      oldValue,
      newValue,
      timestamp: new Date()
    }

    this.eventBus.dispatchEvent(new CustomEvent('configuration-change', { detail: event }))
  }

  /**
   * Trigger runtime data change events
   */
  private emitRuntimeDataChange(widgetId: string, data: any): void {
    this.eventBus.dispatchEvent(
      new CustomEvent('runtime-data-change', {
        detail: { widgetId, data, timestamp: new Date() }
      })
    )
  }

  // ==================== Data source side effects processing ====================

  /**
   * Handling side effects of data source configuration
   */
  private handleDataSourceSideEffects(widgetId: string, config: DataSourceConfiguration): void {
    // in the case ofCard2.1components，Trigger data binding updates
    if (this.store.card2Components.has(widgetId)) {
      this.store.updateDataBinding(widgetId)
    }

    // Clean old runtime data
    this.store.setRuntimeData(widgetId, null)

    // Trigger corresponding data acquisition logic based on data source type
    switch (config.type) {
      case 'static':
        this.handleStaticDataSource(widgetId, config)
        break
      case 'api':
        this.handleApiDataSource(widgetId, config)
        break
      // Other types of processing...
    }
  }

  /**
   * Working with static data sources
   */
  private handleStaticDataSource(widgetId: string, config: DataSourceConfiguration): void {
    if (config.config.data) {
      this.setRuntimeData(widgetId, config.config.data)
    }
  }

  /**
   * deal withAPIdata source
   */
  private handleApiDataSource(widgetId: string, config: DataSourceConfiguration): void {
    // TODO: accomplishAPIData acquisition logic
  }
}

// ==================== Singleton pattern ====================

let configurationServiceInstance: ConfigurationService | null = null

/**
 * Get configuration service instance（Singleton）
 */
export function useConfigurationService(): ConfigurationService {
  if (!configurationServiceInstance) {
    configurationServiceInstance = new ConfigurationService()
  }

  return configurationServiceInstance
}

/**
 * Reset configuration service instance（for testing）
 */
export function resetConfigurationService(): void {
  configurationServiceInstance = null
}
