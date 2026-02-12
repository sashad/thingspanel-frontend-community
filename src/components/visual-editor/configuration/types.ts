/**
 * Visual Editor Configure system type definition
 * Define standardized configuration data structures and interfaces
 */

// Data source related imports have been removed

/**
 * Basic configuration interface - definitionNodeWrapperAll basic configuration items supported
 * Contains display、style、layout、Common configurations such as device association
 */
export interface BaseConfiguration {
  // show configuration
  /** Whether to display title */
  showTitle?: boolean
  /** Component title */
  title?: string
  /** visible or not */
  visible?: boolean
  /** transparency (0-1) */
  opacity?: number

  // Style configuration
  /** background color */
  backgroundColor?: string
  /** border width */
  borderWidth?: number
  /** border color */
  borderColor?: string
  /** border style */
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge'
  /** Fillet size */
  borderRadius?: number
  /** shadow effect */
  boxShadow?: string

  // layout configuration
  /** padding */
  padding?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  /** margins */
  margin?: {
    top: number
    right: number
    bottom: number
    left: number
  }

  // Device association configuration - Unified management of device associations for all components
  /** Associated devicesID - Used for data source auto-configuration and device templates */
  deviceId?: string
  /** List of monitored indicators - Define device metrics that the component focuses on */
  metricsList?: Array<{
    /** Indicator unique identifier */
    id: string
    /** Indicator display name */
    name: string
    /** Index unit */
    unit?: string
    /** Indicator description */
    description?: string
    /** data type */
    dataType?: 'number' | 'string' | 'boolean' | 'object'
    /** Aggregation method */
    aggregation?: 'last' | 'avg' | 'sum' | 'min' | 'max' | 'count'
  }>

  // Extended field support
  [key: string]: any
}

/**
 * 🔧 Data source configuration interface - Genericization，Specifically defined by independent data source systems
 * The configurator layer only defines the structure，No specific fields defined
 */
export interface DataSourceConfiguration extends Record<string, any> {
  // 🔧 Keep the generic structure，Specific fields are defined by the data source system

  // 🚀 New：autoBindConfiguration support
  /** Automatic binding configuration - Simplify data source configuration */
  autoBind?: {
    /** Whether to enable automatic binding */
    enabled: boolean
    /** binding mode */
    mode: 'strict' | 'loose' | 'custom'
    /** Custom binding rules */
    customRules?: Array<{
      propertyPath: string
      paramName: string
      transform?: (value: any) => any
      required?: boolean
      description?: string
    }>
    /** Excluded attribute list */
    excludeProperties?: string[]
    /** List of properties included（only instrictEffective in mode） */
    includeProperties?: string[]
  }
}

/**
 * 🔧 Interactive configuration interface - Genericization，Specifically defined by independent interactive systems
 * The configurator layer only defines the structure，No specific fields defined
 */
export interface InteractionConfiguration extends Record<string, any> {
  // 🔧 Keep the generic structure，Specific fields are defined by the interactive system
}

export interface ComponentConfiguration {
  /** Component specific property configuration */
  properties: Record<string, any>
  /** Component style configuration */
  styles?: Record<string, any>
  /** Component behavior configuration */
  behavior?: Record<string, any>
  /** Component validation rules */
  validation?: {
    required?: string[]
    rules?: Record<string, any>
  }
}

/**
 * 🔧 Complete component configuration interface - Refactored into a layered autonomous architecture
 * Configurator as interface layer，Each layer independently manages its own configuration
 */
export interface WidgetConfiguration {
  /** 🔧 Basic configuration - Depend onNodeWrapperLayer self-definition and management */
  base: BaseConfiguration

  /** 🔧 Component configuration - by eachCard2.1Component self-definition and management */
  component: ComponentConfiguration

  /** 🔧 Data source configuration - Self-defined and managed by independent data source systems */
  dataSource: DataSourceConfiguration

  /** 🔧 Interactive configuration - Autonomously defined and managed by an independent interactive system */
  interaction: InteractionConfiguration

  /** 🔧 Configuration metadata - Configurator layer unified management */
  metadata?: {
    /** Configuration version */
    version: string
    /** creation time */
    createdAt: number
    /** Update time */
    updatedAt: number
    /** Creator */
    createdBy?: string
    /** Configuration description */
    description?: string
  }
}

/**
 * Common interface for configuring form components
 */
export interface ConfigFormProps<T = any> {
  /** Current configuration value */
  modelValue: T
  /** Component instance reference */
  widget?: any
  /** Is it read-only? */
  readonly?: boolean
}

/**
 * Configure the event interface of the form component
 */
export interface ConfigFormEmits<T = any> {
  (event: 'update:modelValue', value: T): void
  (event: 'validate', result: ValidationResult): void
  (event: 'change', value: T, oldValue: T): void
}

/**
 * Configuration verification results
 */
export interface ValidationResult {
  /** Is verification passed? */
  valid: boolean
  /** Validation error message */
  errors?: {
    field: string
    message: string
    code?: string
  }[]
  /** Verification warning message */
  warnings?: {
    field: string
    message: string
    code?: string
  }[]
}

/**
 * Configuration Manager Interface
 */
export interface IConfigurationManager {
  /** Get component configuration */
  getConfiguration(widgetId: string): WidgetConfiguration | null

  /** Set component configuration */
  setConfiguration(widgetId: string, config: WidgetConfiguration): void

  /** Update some part of the configuration */
  updateConfiguration<K extends keyof WidgetConfiguration>(
    widgetId: string,
    section: K,
    config: WidgetConfiguration[K]
  ): void

  /** Reset configuration to default */
  resetConfiguration(widgetId: string): void

  /** Verify configuration */
  validateConfiguration(config: WidgetConfiguration): ValidationResult

  /** Export configuration */
  exportConfiguration(widgetId: string): string

  /** Import configuration */
  importConfiguration(widgetId: string, configData: string): boolean

  /** Listen for configuration changes */
  onConfigurationChange(widgetId: string, callback: (config: WidgetConfiguration) => void): () => void
}

/**
 * Configure form registration information
 */
export interface ConfigFormRegistration {
  /** Component type */
  componentType: string
  /** Configure form components */
  formComponent: any
  /** Configure form title */
  title?: string
  /** Configuration form description */
  description?: string
}

/**
 * Configure presets
 */
export interface ConfigurationPreset {
  /** Default name */
  name: string
  /** Default description */
  description?: string
  /** Default configuration */
  config: Partial<WidgetConfiguration>
  /** Applicable component types */
  componentTypes?: string[]
  /** Default category */
  category?: string
  /** Is it the system default? */
  isSystem?: boolean
}

/**
 * Default configuration generator
 */
export type ConfigurationGenerator<T = any> = (context: T) => WidgetConfiguration

/**
 * Configure the migrator interface
 * Used to handle configuration version upgrades
 */
export interface ConfigurationMigrator {
  /** source version */
  fromVersion: string
  /** target version */
  toVersion: string
  /** migration function */
  migrate: (oldConfig: any) => WidgetConfiguration
}
