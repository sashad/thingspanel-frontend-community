/**
 * Component configuration management interface
 * Responsible for managing the four-layer configuration of individual components：Basic configuration、Component properties、Data source configuration、Interactive configuration
 */

/**
 * Configuration layer type
 */
export type ConfigLayer = 'base' | 'component' | 'dataSource' | 'interaction'

/**
 * Basic configuration（Location、size、style etc.）
 */
export interface BaseConfig {
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  zIndex?: number
  visible?: boolean
  locked?: boolean
  [key: string]: any
}

/**
 * Component property configuration（Component-specific business properties）
 */
export interface ComponentConfig {
  properties?: Record<string, any>
  styles?: Record<string, any>
  behavior?: Record<string, any>
  [key: string]: any
}

/**
 * Data source configuration（Data binding related）
 */
export interface DataSourceConfig {
  type?: 'static' | 'api' | 'websocket' | 'data-source-bindings'
  enabled?: boolean
  dataSourceBindings?: Record<string, any>
  config?: Record<string, any>
  metadata?: {
    componentType?: string
    updatedAt?: number
    source?: string
    [key: string]: any
  }
  [key: string]: any
}

/**
 * Interactive configuration（incident response、Actions etc.）
 */
export interface InteractionConfig {
  configs?: Array<{
    trigger: string
    action: string
    target?: string
    [key: string]: any
  }>
  enabled?: boolean
  metadata?: {
    updatedAt?: number
    [key: string]: any
  }
  [key: string]: any
}

/**
 * Complete configuration of components
 */
export interface WidgetConfiguration {
  /** Basic configuration layer */
  base: BaseConfig
  /** Component configuration layer */
  component: ComponentConfig
  /** Data source configuration layer */
  dataSource: DataSourceConfig
  /** interactive configuration layer */
  interaction: InteractionConfig
  /** Configuration metadata */
  metadata: {
    version: string
    createdAt: number
    updatedAt: number
    description?: string
  }
}

/**
 * Configuration change event
 */
export interface ConfigChangeEvent {
  widgetId: string
  layer: ConfigLayer
  oldConfig?: any
  newConfig: any
  timestamp: number
}

/**
 * Configuration verification results
 */
export interface ConfigValidationResult {
  valid: boolean
  errors?: Array<{
    layer: ConfigLayer
    field: string
    message: string
  }>
  warnings?: Array<{
    layer: ConfigLayer
    field: string
    message: string
  }>
}

/**
 * Component Configuration Manager Interface
 * Responsibilities：
 * 1. Four-layer configuration data access for management components
 * 2. Provides configuration validation and default value handling
 * 3. Emit configuration change events，But it does not directly trigger data execution
 * 4. Supports configuration import, export and version management
 */
export interface IComponentConfigManager {
  /**
   * Get the complete configuration of the component
   */
  getConfiguration(widgetId: string): WidgetConfiguration | null

  /**
   * Set component complete configuration
   */
  setConfiguration(widgetId: string, config: WidgetConfiguration): void

  /**
   * Get the configuration of a specific layer
   */
  getLayerConfig<T = any>(widgetId: string, layer: ConfigLayer): T | null

  /**
   * Update the configuration of a specific layer
   */
  updateLayerConfig<T = any>(widgetId: string, layer: ConfigLayer, config: T): void

  /**
   * Delete component configuration
   */
  deleteConfiguration(widgetId: string): boolean

  // --- Configure validation and default values ---

  /**
   * Verify configuration
   */
  validateConfiguration(config: WidgetConfiguration): ConfigValidationResult

  /**
   * Create default configuration
   */
  createDefaultConfiguration(): WidgetConfiguration

  /**
   * Get the default configuration of the hierarchy
   */
  getLayerDefaults<T = any>(layer: ConfigLayer): T

  // --- Batch operations ---

  /**
   * Get all component configurations
   */
  getAllConfigurations(): Record<string, WidgetConfiguration>

  /**
   * Batch setup configuration
   */
  setMultipleConfigurations(configs: Record<string, WidgetConfiguration>): void

  /**
   * Clear all configuration
   */
  clearAllConfigurations(): void

  // --- event listening ---

  /**
   * Listen for configuration changes
   */
  onConfigChange(listener: (event: ConfigChangeEvent) => void): () => void

  /**
   * Monitor configuration changes of specific components
   */
  onWidgetConfigChange(widgetId: string, listener: (event: ConfigChangeEvent) => void): () => void

  /**
   * Monitor specific layer configuration changes
   */
  onLayerConfigChange(layer: ConfigLayer, listener: (event: ConfigChangeEvent) => void): () => void

  // --- Import and export ---

  /**
   * Export configuration
   */
  exportConfiguration(widgetId?: string): any

  /**
   * Import configuration
   */
  importConfiguration(data: any, widgetId?: string): boolean

  /**
   * Clean up resources
   */
  destroy(): void
}
