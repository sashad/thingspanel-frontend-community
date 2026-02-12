/**
 * Data Schema Type System Export Index
 * Unified export of existing types and enhanced types
 */

// ==================== Existing type system export ====================
// Keep existing exports unchanged，Ensure backward compatibility
export type {
  // Actuator chain type
  DataItem,
  JsonDataItemConfig,
  HttpDataItemConfig,
  WebSocketDataItemConfig,
  ScriptDataItemConfig,
  ProcessingConfig,
  MergeStrategy,
  DataSourceConfiguration,
  ExecutionState,
  ExecutionResult,

  // Actuator interface
  IDataItemFetcher,
  IDataItemProcessor,
  IDataSourceMerger,
  IMultiSourceIntegrator,
  IMultiLayerExecutorChain,

  // data type
  ComponentData,
  DataSourceResult,
  AllDataItemTypes,
  AllMergeStrategyTypes
} from '../executors'

// ==================== Enhanced type system export ====================
export type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'
export type {
  // Generic configuration type
  DataItemConfig,
  DataItemMetadata,

  // Specific data item type
  EnhancedJsonDataItemConfig,
  EnhancedHttpDataItemConfig,
  HttpHeader,
  HttpParam,
  HttpBody,

  // dynamic parameter system
  DynamicParam,

  // Enhanced configuration system
  EnhancedDataSourceConfiguration,
  EnhancedFeatureFlags,
  ConfigurationMetadata,

  // adapter system
  ConfigurationAdapter
} from './enhanced-types'

// ==================== Simplified data source system type export ====================
export type {
  // Component data requirements
  ComponentDataRequirement,
  StaticParamRequirement,
  DataSourceRequirement,
  FieldRequirement,

  // Data source configuration
  SimpleDataSourceConfig,
  DataSourceDefinition,
  TriggerConfig,
  TriggerConfigData,

  // User input type
  UserDataSourceInput,
  DataSourceUserConfig,
  StaticDataSourceConfig,
  ApiDataSourceConfig,
  WebSocketDataSourceConfig,
  ScriptDataSourceConfig,

  // Execution result
  ExecutionResult as SimpleExecutionResult,
  MappingPreviewResult,
  ValidationResult,

  // component data
  ComponentData as SimpleComponentData,
  StandardComponentProps,

  // Compatibility type
  VisualEditorCompatibleProps,
  Card21CompatibleProps,

  // Tool type
  DataSourceType,
  FieldType,
  FieldValueType,
  TriggerType,
  ComponentType
} from './simple-types'

// ==================== Type guards and tool exports ====================
export { isEnhancedConfiguration, isGenericDataItemConfig, isEnhancedHttpConfig } from '@/core/data-architecture/types/enhanced-types'

// ==================== Default configuration export ====================
export { DEFAULT_ENHANCED_FEATURES, ConfigurationVersionEnum } from '@/core/data-architecture/types/enhanced-types'

// Simplified data source system constants
export { SIMPLE_DATA_SOURCE_CONSTANTS, FIELD_TYPE_MAPPING } from '@/core/data-architecture/types/simple-types'

// ==================== Type system version information ====================
export const TYPE_SYSTEM_VERSION = {
  LEGACY: '1.0.0',
  ENHANCED: '2.0.0',
  CURRENT: '2.0.0'
} as const

/**
 * List of supported configuration versions
 */
export const SUPPORTED_CONFIG_VERSIONS = ['1.0.0', '2.0.0'] as const

/**
 * Type system feature flags
 */
export const TYPE_SYSTEM_FEATURES = {
  GENERIC_DATA_ITEMS: true,
  DYNAMIC_PARAMETERS: true,
  HTTP_ARRAY_FORMAT: true,
  VERSION_MANAGEMENT: true,
  BACKWARD_COMPATIBILITY: true
} as const

export * from '@/core/data-architecture/types/enhanced-types'
export * from '@/core/data-architecture/types/parameter-editor'
