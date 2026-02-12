/**
 * Card2.1 Unified type export
 * Provide complete、consistent type system，Supports component development and editor integration
 * 
 * Usage：
 * import type { ComponentDefinition, Setting, DataSourceRequirement } from '@/card2.1/types'
 */

// ============ core type system ============
// Import from refactored core type files
export type {
  // base type
  ComponentPermission,
  Position,
  Size,
  MetricItem,

  // Layout system type
  LayoutItem,
  CanvasItem,
  RendererType,

  // Data source system type
  DataFieldType,
  DataValidationRule,
  DataSourceRequirement,
  StaticParamRequirement,

  // component definition system
  ComponentDefinition,
  ComponentInstance,
  WidgetConfiguration,
  RendererConfig,
  PanelConfig,

  // Data system type
  DataSourceInfo,
  DataUpdateEvent,
  ComponentLifecycleHooks,

  // Registration system type
  IComponentRegistry,
  IConfigComponent,
  IComponentDefinition
} from '../core/types'

// ============ Set configuration type system ============
export type {
  // Setting item configuration
  Setting,
  CustomConfig,
  DataConfig,
  TargetComponent,
  ComponentSettingConfig,

  // Control types and validation
  SettingValidationRule,
  EnhancedSetting,
  PropertyDataTypeFromSetting,

  // Integrated configuration system（fromconfig-types.tsmerge）
  ConfigMode,
  SettingGroup,
  TSConfig,
  ConfigValues,
  EnhancedComponentSettingConfig
} from './setting-config'

// Export enumeration
export { SettingControlType } from '@/card2.1/types/setting-config'

// Export settings configuration tool function
export {
  createSetting,
  createCustomConfig,
  inferPropertyDataType
} from './setting-config'

// ============ type utility function system ============

export {
  // Type conversion tools
  generateDefaultConfigFromSettings,
  groupSettingsByGroup,
  inferTSTypeFromControlType,
  getDefaultValueForFieldType,
  
  // Configuration object manipulation tools
  deepMergeConfig,
  extractFieldValue,
  setFieldValue,
  
  // Component definition operation tool
  createComponentSettingConfig,
  extractDataSourceRequirements,
  extractStaticParamRequirements,
  supportsDataSourceType,
  
  // Data source and field mapping tools
  createFieldMapping,
  mergeFieldMappings,
  
  // Interactive configuration tool
  createClickJumpInteraction,
  createModifyInteraction,
  
  // Grouping and classification tools
  inferCategoryFromPath,
  createSettingGroup,
  
  // Development aids
  generateTSInterfaceFromDefinition,
  validateComponentConfig,
  
  // Collection of utility functions
  TypeUtils
} from './utils'

// ============ Interactive system type ============
export type {
  ComponentInteractionDefinition,
  InteractionCapability,
  InteractionEvent,
  InteractionTrigger,
  InteractionAction,
  InteractionContext
} from '../core/interaction-types'

// ============ data binding type（Simplified version） ============
// 🔥 simplify：数据绑定功能已simplify，Use the core type system

// ============ type utility functions ============

/**
 * Extract the configuration type defined by the component
 * Configuration object for type-safe access to components
 */
export type ExtractConfigType<T extends ComponentDefinition> = T extends ComponentDefinition<infer Config> 
  ? Config 
  : Record<string, unknown>

/**
 * Extract custom configuration customize type
 * Custom configuration for type-safe access to components
 */
export type ExtractCustomizeType<T extends CustomConfig> = T extends CustomConfig<infer Customize>
  ? Customize
  : Record<string, unknown>

/**
 * Type inference for component settings configuration
 * Derive the complete component configuration type based on the setting item configuration
 */
export type InferConfigFromSettings<T extends readonly Setting[]> = {
  [K in T[number] as K['field']]: K['defaultValue'] extends infer V 
    ? V extends undefined 
      ? unknown 
      : V
    : unknown
}

// ============ type assertion tool ============

/**
 * Check if the object is a valid component definition
 * @param obj Object to be checked
 * @returns Whether it is defined for the component
 */
export function isComponentDefinition(obj: unknown): obj is ComponentDefinition {
  return obj && 
         typeof obj === 'object' &&
         typeof obj.type === 'string' &&
         typeof obj.name === 'string' &&
         obj.component
}

/**
 * Check whether the object is a valid setting item configuration
 * @param obj Object to be checked
 * @returns Whether to configure the setting item
 */
export function isSetting(obj: unknown): obj is Setting {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.type === 'string' &&
         typeof obj.label === 'string' &&
         typeof obj.field === 'string'
}

/**
 * Check whether the object is a valid data source requirement
 * @param obj Object to be checked
 * @returns Whether it is a data source requirement
 */
export function isDataSourceRequirement(obj: unknown): obj is DataSourceRequirement {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.key === 'string' &&
         typeof obj.name === 'string' &&
         typeof obj.description === 'string' &&
         Array.isArray(obj.supportedTypes)
}

// ============ type verification system ============

export type {
  ValidationResult
} from './validation'

export {
  // Basic type validation
  isValidDataFieldType,
  validateDataValidationRule,

  // Component type validation
  validateDataSourceRequirement,
  validateStaticParamRequirement,
  validateSetting,
  validateComponentDefinition,
  validateComponentDefinitions,

  // type assertion tool
  isValidComponentDefinition,
  isValidDataSourceRequirement,
  isValidSetting,

  // development tools
  devModeValidationWarning
} from './validation'

// ============ Development tool type（Stay backwards compatible） ============

/**
 * Component definition verification results in development mode
 * @deprecated use ValidationResult substitute
 */
export interface ComponentValidationResult {
  /** Whether passed the verification */
  valid: boolean
  /** Validation error list */
  errors: string[]
  /** warning list */
  warnings: string[]
  /** Component type */
  componentType: string
}

/**
 * Component registration statistics
 */
export interface ComponentRegistryStats {
  /** Total component quantity */
  total: number
  /** Number of components grouped by category */
  byCategory: Record<string, number>
  /** Number of components grouped by data source type */
  byDataSource: Record<string, number>
  /** Effective number of components */
  valid: number
  /** Invalid component quantity */
  invalid: number
}

/**
 * Card2.1 type system version
 */
export const CARD2_TYPES_VERSION = '2.1.0'

/**
 * Type system properties
 */
export const CARD2_TYPE_FEATURES = {
  /** supportTypeScriptstrict mode */
  strictTypeScript: true,
  /** Support generic component configuration */
  genericConfig: true,
  /** Support multiple renderers */
  multiRenderer: true,
  /** Support interactive system */
  interactionSystem: true,
  /** Support data binding */
  dataBinding: true,
  /** Support life cycle hooks */
  lifecycleHooks: true
} as const