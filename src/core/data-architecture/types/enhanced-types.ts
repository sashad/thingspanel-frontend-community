/**
 * Enhanced data schema type definition
 * Extend based on existing architecture，Maintain backward compatibility
 *
 * design goals：
 * 1. Generic data item configuration，Support extension
 * 2. Keep the existing type system100%compatible
 * 3. Reserved interface for dynamic parameter system
 * 4. Support configuration version management and automatic adaptation
 */

// ==================== Basic type import ====================
import type {
  DataItem as LegacyDataItem,
  JsonDataItemConfig as LegacyJsonDataItemConfig,
  HttpDataItemConfig as LegacyHttpDataItemConfig,
  WebSocketDataItemConfig,
  ScriptDataItemConfig
} from '../executors/DataItemFetcher'

import type { ProcessingConfig } from '@/core/data-architecture/executors/DataItemProcessor'

import type { MergeStrategy } from '@/core/data-architecture/executors/DataSourceMerger'

import type {
  DataSourceConfiguration as LegacyDataSourceConfiguration,
  ExecutionResult
} from '../executors/MultiLayerExecutorChain'

// ==================== Generic data item configuration ====================

/**
 * Generic data item configuration basic interface
 * Support any type of configuration structure extension
 */
export interface DataItemConfig<T = any> {
  /** Data item type identifier */
  type: string

  /** data item unique identifier */
  id: string

  /** Type-specific configuration parameters */
  config: T

  /** Data processing configuration（Reuse existingProcessingConfig） */
  processing?: ProcessingConfig

  /** Data item metadata */
  metadata?: DataItemMetadata
}

/**
 * Data item metadata interface
 * Used to store additional configuration information and status
 */
export interface DataItemMetadata {
  /** Data item display name */
  displayName?: string

  /** Data item description */
  description?: string

  /** creation time */
  createdAt?: number

  /** Last updated */
  lastUpdated?: number

  /** Data item enabled status */
  enabled?: boolean

  /** Custom labels */
  tags?: string[]
}

// ==================== Specific data item type implementation ====================

/**
 * JSONData item configuration（Enhanced version）
 * keep and existingJsonDataItemConfigCompatibility
 */
export interface EnhancedJsonDataItemConfig {
  /** JSONData content */
  jsonData: string

  /** Data validation options */
  validation?: {
    /** Whether to enableJSONFormat validation */
    enableFormat: boolean
    /** Whether to enable data structure validation */
    enableStructure: boolean
    /** JSON Schema（Optional） */
    schema?: any
  }

  /** Data preprocessing options */
  preprocessing?: {
    /** Whether to remove comments */
    removeComments: boolean
    /** Whether to format the output */
    formatOutput: boolean
  }
}

/**
 * HTTPData item configuration（Enhanced version）
 * Reserve expansion interface for dynamic parameter system
 */
export interface EnhancedHttpDataItemConfig {
  /** askURL（Support template syntax {{paramName}}） */
  url: string

  /** HTTPRequest method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

  /** Request header configuration（array format，Support dynamic parameters） */
  headers: HttpHeader[]

  /** URLParameter configuration（New，Support dynamic parameters） */
  params: HttpParam[]

  /** Request body configuration */
  body?: HttpBody

  /** Request timeout（millisecond） */
  timeout?: number

  /** pre-request script（reserved） */
  preRequestScript?: string

  /** Post-response script（reserved） */
  responseScript?: string

  /** Retry configuration */
  retry?: {
    /** Maximum number of retries */
    maxRetries: number
    /** Retry interval（millisecond） */
    retryDelay: number
  }
}

/**
 * HTTPHead configuration
 * Supports both static value and dynamic parameter modes
 */
export interface HttpHeader {
  /** Header field name */
  key: string

  /** Header field value（Actual value when static，Example value when dynamic） */
  value: string

  /** Whether to enable this header */
  enabled: boolean

  /** Whether it is a dynamic parameter */
  isDynamic: boolean

  /** data type，for type conversion and validation */
  dataType: 'string' | 'number' | 'boolean' | 'json'

  /** Automatically generated variable names（Format：http_${key}） */
  variableName: string

  /** Parameter description（Dynamic parameters are required，Static parameters are optional） */
  description?: string
}

/**
 * HTTPParameter configuration
 * Supports both static value and dynamic parameter modes
 */
export interface HttpParam {
  /** Parameter name */
  key: string

  /** Parameter value（Actual value when static，Example value when dynamic） */
  value: string

  /** Whether to enable this parameter */
  enabled: boolean

  /** Whether it is a dynamic parameter */
  isDynamic: boolean

  /** data type，for type conversion and validation */
  dataType: 'string' | 'number' | 'boolean' | 'json'

  /** Automatically generated variable names（Format：http_${key}） */
  variableName: string

  /** Parameter description（Dynamic parameters are required，Static parameters are optional） */
  description?: string
}

/**
 * HTTPRequest body configuration
 */
export interface HttpBody {
  /** Request body type */
  type: 'json' | 'form' | 'text' | 'binary'

  /** Request body content */
  content: any

  /** Content type */
  contentType?: string
}

// ==================== Dynamic parameter system and placeholder parsing ====================

/**
 * Dynamic parameter definition（Reserved interface）
 * used forHTTPdynamic parameter system
 */
export interface DynamicParam {
  /** Parameter name */
  name: string

  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'object'

  /** Current parameter value */
  currentValue: any

  /** Example value */
  exampleValue?: any

  /** Parameter description */
  description?: string

  /** Is the parameter required? */
  required?: boolean

  /** Parameter validation rules */
  validation?: {
    /** minimum value/minimum length */
    min?: number
    /** maximum value/maximum length */
    max?: number
    /** regular expression */
    pattern?: string
    /** enumeration value */
    enum?: any[]
  }
}

/**
 * Placeholder configuration interface
 * used for{{variableName}}placeholder system
 */
export interface PlaceholderConfig {
  /** placeholder name（Not included{{}}） */
  name: string

  /** placeholder current value */
  value: any

  /** data type */
  dataType: 'string' | 'number' | 'boolean' | 'json'

  /** Is it a required placeholder? */
  required: boolean

  /** Placeholder description */
  description?: string

  /** default value */
  defaultValue?: any

  /** Validation rules */
  validation?: PlaceholderValidationRule
}

/**
 * Placeholder validation rules
 */
export interface PlaceholderValidationRule {
  /** minimum value/minimum length */
  min?: number

  /** maximum value/maximum length */
  max?: number

  /** regular expression（Used when string type） */
  pattern?: string

  /** List of enumeration values */
  enum?: any[]

  /** Custom validation function name */
  customValidator?: string
}

/**
 * Placeholder dependency analysis results
 */
export interface PlaceholderDependencyAnalysis {
  /** Analyzed configuration object ID */
  configId: string

  /** List of all placeholder names found */
  placeholders: string[]

  /** Placeholder details map */
  placeholderDetails: Map<string, PlaceholderDependencyDetail>

  /** Whether circular dependencies are detected */
  hasCircularDependency: boolean

  /** circular dependency path（if exists） */
  circularDependencyPaths?: string[][]
}

/**
 * Dependency details for a single placeholder
 */
export interface PlaceholderDependencyDetail {
  /** placeholder name */
  name: string

  /** The location path that appears in the configuration */
  occurrences: PlaceholderOccurrence[]

  /** Other placeholders for dependencies */
  dependencies: string[]

  /** Dependent placeholder */
  dependents: string[]
}

/**
 * Placeholder location information
 */
export interface PlaceholderOccurrence {
  /** Configure object path（like: "config.url", "config.headers[0].value"） */
  path: string

  /** original value（String containing placeholders） */
  originalValue: string

  /** The placeholder position in the value */
  position: {
    start: number
    end: number
  }
}

// ==================== component mapping system ====================

/**
 * Component mapping configuration interface
 * used forCard2.1Component properties andHTTPParameter mapping
 */
export interface ComponentMappingConfig {
  /** Mapping configuration unique identifier */
  id: string

  /** Mapping name */
  name: string

  /** Source component information */
  sourceComponent: ComponentMappingSource

  /** TargetHTTPConfiguration information */
  targetHttpConfig: HttpConfigMappingTarget

  /** Mapping relationship list */
  mappings: PropertyToParameterMapping[]

  /** Mapping status */
  status: 'active' | 'inactive' | 'error'

  /** Mapping creation time */
  createdAt: number

  /** Last updated */
  lastUpdated: number

  /** Mapping description */
  description?: string
}

/**
 * Component mapping source information
 */
export interface ComponentMappingSource {
  /** components/cardID */
  componentId: string

  /** Component type */
  componentType: string

  /** Component display name */
  displayName?: string

  /** List of mappable properties */
  availableProperties: ComponentProperty[]
}

/**
 * HTTPConfigure mapping target information
 */
export interface HttpConfigMappingTarget {
  /** HTTPConfiguration ID */
  configId: string

  /** HTTPConfiguration name */
  configName?: string

  /** mappable parameter list */
  availableParameters: HttpMappableParameter[]
}

/**
 * Component property definition
 */
export interface ComponentProperty {
  /** Property name */
  name: string

  /** Property display name */
  displayName: string

  /** Property data type */
  dataType: 'string' | 'number' | 'boolean' | 'object' | 'array'

  /** Property current value */
  currentValue?: any

  /** Property description */
  description?: string

  /** Whether it is a read-only attribute */
  readonly?: boolean

  /** Property path（for nested objects） */
  path?: string
}

/**
 * HTTPMapping parameter information
 */
export interface HttpMappableParameter {
  /** Parameter identification（correspondvariableNameor placeholder name） */
  parameterId: string

  /** Parameter display name */
  displayName: string

  /** Parameter type（header/param/url/body） */
  parameterType: 'header' | 'param' | 'url' | 'body'

  /** data type */
  dataType: 'string' | 'number' | 'boolean' | 'json'

  /** Parameter description */
  description?: string

  /** Is it a required parameter? */
  required?: boolean

  /** The path of the parameter in the configuration */
  configPath: string
}

/**
 * Mapping relationship from attributes to parameters
 */
export interface PropertyToParameterMapping {
  /** Mapping relationship unique identifier */
  id: string

  /** Source component properties */
  sourceProperty: ComponentProperty

  /** TargetHTTPparameter */
  targetParameter: HttpMappableParameter

  /** Mapping type */
  mappingType: 'direct' | 'transform' | 'conditional'

  /** Data conversion configuration（mappingTypefortransformused when） */
  transformation?: DataTransformationConfig

  /** Conditional mapping configuration（mappingTypeforconditionalused when） */
  condition?: ConditionalMappingConfig

  /** Mapping status */
  status: 'active' | 'inactive' | 'error'

  /** Last sync time */
  lastSyncTime?: number
}

/**
 * Data conversion configuration
 */
export interface DataTransformationConfig {
  /** conversion type */
  type: 'format' | 'calculate' | 'lookup' | 'script'

  /** Conversion parameters */
  parameters: Record<string, any>

  /** conversion script（typeforscriptused when） */
  script?: string
}

/**
 * Conditional mapping configuration
 */
export interface ConditionalMappingConfig {
  /** conditional expression */
  condition: string

  /** The value when the condition is met */
  trueValue: any

  /** The value when the condition is not true */
  falseValue: any

  /** conditional evaluation context */
  context?: Record<string, any>
}

// ==================== Enhanced version configuration system ====================

/**
 * EnhancedHttpConfiginterface
 * used forUnifiedDataConfigofHTTPConfiguration section，based onSUBTASK-008design
 */
export interface EnhancedHttpConfig {
  /** askURL（support{{placeholder}}） */
  url: string

  /** HTTPRequest method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

  /** Request timeout（millisecond，default5000） */
  timeout?: number

  /** Request header configuration array */
  headers?: HttpHeader[]

  /** URLParameter configuration array */
  params?: HttpParam[]

  /** Request body configuration */
  body?: HttpBody

  /** pre-request script（Adjust configuration） */
  preRequestScript?: string

  /** Post-response script（Modify response results） */
  postResponseScript?: string

  /** Retry configuration */
  retry?: {
    /** Maximum number of retries */
    maxRetries: number
    /** Retry interval（millisecond） */
    retryDelay: number
  }

  /** Component mapping configuration */
  componentMappings?: ComponentMappingConfig[]
}

/**
 * ConfigurationManagerExtended interface
 * Support placeholder parsing and template management
 */
export interface EnhancedConfigurationManager {
  /**
   * Analyze placeholder dependencies in configuration
   * @param config Configuration object
   * @returns Dependence analysis results
   */
  analyzePlaceholderDependencies(config: any): PlaceholderDependencyAnalysis

  /**
   * Extract all placeholders in the configuration
   * @param config Configuration object
   * @returns List of placeholder names
   */
  extractPlaceholders(config: any): string[]

  /**
   * Replace placeholder values ​​in configuration
   * @param config Configuration object
   * @param placeholderValues placeholder value mapping
   * @returns Configuration after replacement
   */
  replacePlaceholders(config: any, placeholderValues: Map<string, any>): any

  /**
   * Verify placeholder configuration
   * @param config Configuration object
   * @param placeholderConfigs Placeholder configuration mapping
   * @returns Verification results
   */
  validatePlaceholders(config: any, placeholderConfigs: Map<string, PlaceholderConfig>): PlaceholderValidationResult

  /**
   * Detect circular dependencies
   * @param dependencies Dependency mapping
   * @returns Circular dependency detection results
   */
  detectCircularDependencies(dependencies: Map<string, string[]>): CircularDependencyResult
}

/**
 * Placeholder verification results
 */
export interface PlaceholderValidationResult {
  /** Verification passed */
  isValid: boolean

  /** Validation error list */
  errors: PlaceholderValidationError[]

  /** Validation warning list */
  warnings: PlaceholderValidationWarning[]

  /** Missing required placeholder */
  missingRequired: string[]

  /** undefined placeholder */
  undefined: string[]
}

/**
 * Placeholder validation error
 */
export interface PlaceholderValidationError {
  /** placeholder name */
  placeholder: string

  /** Error type */
  type: 'missing' | 'invalid_type' | 'validation_failed' | 'circular_dependency'

  /** error message */
  message: string

  /** Error location path */
  path?: string
}

/**
 * Placeholder validation warning
 */
export interface PlaceholderValidationWarning {
  /** placeholder name */
  placeholder: string

  /** warning type */
  type: 'unused' | 'deprecated' | 'performance'

  /** warning message */
  message: string
}

/**
 * Circular dependency detection results
 */
export interface CircularDependencyResult {
  /** Are there circular dependencies? */
  hasCircularDependency: boolean

  /** Circular dependency path list */
  circularPaths: string[][]

  /** Placeholders involving circular dependencies */
  affectedPlaceholders: string[]
}

/**
 * Enhanced data source configuration
 * Inherit existing configuration，Add version management and dynamic parameter support
 */
export interface EnhancedDataSourceConfiguration extends LegacyDataSourceConfiguration {
  /** Configuration version identifier */
  version: string

  /** Dynamic parameter definition（reserved） */
  dynamicParams?: DynamicParam[]

  /** Enhanced function switch */
  enhancedFeatures?: EnhancedFeatureFlags

  /** Configuration metadata */
  metadata?: ConfigurationMetadata

  /** Placeholder configuration mapping */
  placeholderConfigs?: Map<string, PlaceholderConfig>

  /** Component mapping configuration list */
  componentMappings?: ComponentMappingConfig[]
}

/**
 * Enhanced function switch
 */
export interface EnhancedFeatureFlags {
  /** enableHTTParray format */
  httpArrayFormat: boolean

  /** Enable dynamic parameter support */
  dynamicParameterSupport: boolean

  /** Enable secure script execution */
  secureScriptExecution: boolean

  /** Enable configuration verification */
  configurationValidation: boolean

  /** Enable performance monitoring */
  performanceMonitoring: boolean
}

/**
 * Configuration metadata
 */
export interface ConfigurationMetadata {
  /** Configuration name */
  name?: string

  /** Configuration description */
  description?: string

  /** Configuration creator */
  author?: string

  /** Configuration version history */
  versionHistory?: ConfigurationVersion[]

  /** Configure tags */
  tags?: string[]
}

/**
 * Configure version information
 */
export interface ConfigurationVersion {
  /** version number */
  version: string

  /** Change time */
  timestamp: number

  /** Change description */
  changelog: string

  /** Change author */
  author?: string
}

// ==================== Configure adapter system ====================

/**
 * Configure version adapter
 * Handles automatic conversion of old and new configuration formats
 */
export interface ConfigurationAdapter {
  /**
   * Check configuration version
   * @param config Configuration object
   * @returns Version ID
   */
  detectVersion(config: any): 'v1.0' | 'v2.0'

  /**
   * Adapt configuration to specified version
   * @param config Source configuration
   * @param targetVersion target version
   * @returns Configuration after adaptation
   */
  adaptToVersion(config: any, targetVersion: 'v1.0' | 'v2.0'): any

  /**
   * v1upgrade tov2（Lossless upgrade）
   * @param v1Config v1Format configuration
   * @returns v2Format configuration
   */
  upgradeV1ToV2(v1Config: LegacyDataSourceConfiguration): EnhancedDataSourceConfiguration

  /**
   * v2downgrade tov1（Functional tailoring）
   * @param v2Config v2Format configuration
   * @returns v1Format configuration
   */
  downgradeV2ToV1(v2Config: EnhancedDataSourceConfiguration): LegacyDataSourceConfiguration
}

// ==================== Type tools and helper functions ====================

/**
 * data type converter
 * used forHttpHeaderandHttpParamvalue conversion
 */
export class DataTypeConverter {
  /**
   * Convert a string value to a specified type
   * @param value raw string value
   * @param dataType target data type
   * @returns converted value
   */
  static convertValue(value: string, dataType: 'string' | 'number' | 'boolean' | 'json'): any {
    if (value === null || value === undefined || value === '') {
      return value
    }

    switch (dataType) {
      case 'string':
        return String(value)

      case 'number': {
        const num = Number(value)
        if (isNaN(num)) {
          throw new Error(`Unable to convert value "${value}" Convert to numeric type`)
        }
        return num
      }

      case 'boolean': {
        const lowerValue = String(value).toLowerCase().trim()
        if (lowerValue === 'true' || lowerValue === '1') {
          return true
        }
        if (lowerValue === 'false' || lowerValue === '0') {
          return false
        }
        throw new Error(`Unable to convert value "${value}" Convert to boolean type`)
      }

      case 'json': {
        try {
          return JSON.parse(value)
        } catch (error) {
          throw new Error(`Unable to convert value "${value}" Convert toJSONtype: ${error.message}`)
        }
      }

      default:
        return value
    }
  }

  /**
   * Verify that the value conforms to the specified type
   * @param value value to verify
   * @param dataType expected data type
   * @returns Verification results
   */
  static validateType(value: any, dataType: 'string' | 'number' | 'boolean' | 'json'): boolean {
    switch (dataType) {
      case 'string':
        return typeof value === 'string'

      case 'number':
        return typeof value === 'number' && !isNaN(value)

      case 'boolean':
        return typeof value === 'boolean'

      case 'json':
        try {
          if (typeof value === 'string') {
            JSON.parse(value)
            return true
          }
          // If it is already an object，Check if serializable
          JSON.stringify(value)
          return true
        } catch {
          return false
        }

      default:
        return false
    }
  }

  /**
   * Get the actual data type of the value
   * @param value value to check
   * @returns data type string
   */
  static getActualType(value: any): 'string' | 'number' | 'boolean' | 'json' | 'unknown' {
    if (typeof value === 'string') {
      return 'string'
    }
    if (typeof value === 'number' && !isNaN(value)) {
      return 'number'
    }
    if (typeof value === 'boolean') {
      return 'boolean'
    }
    if (typeof value === 'object' || Array.isArray(value)) {
      return 'json'
    }
    return 'unknown'
  }
}

/**
 * Placeholder tool class
 * for processing{{variableName}}placeholder
 */
export class PlaceholderUtils {
  /** Placeholder regular expression */
  private static readonly PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g

  /**
   * Extract all placeholders in a string
   * @param text Text containing placeholders
   * @returns Array of placeholder names
   */
  static extractPlaceholders(text: string): string[] {
    if (typeof text !== 'string') {
      return []
    }

    const matches: string[] = []
    let match: RegExpExecArray | null

    // Reset regular expression status
    this.PLACEHOLDER_REGEX.lastIndex = 0

    while ((match = this.PLACEHOLDER_REGEX.exec(text)) !== null) {
      const placeholderName = match[1].trim()
      if (placeholderName && !matches.includes(placeholderName)) {
        matches.push(placeholderName)
      }
    }

    return matches
  }

  /**
   * Replace placeholders in string
   * @param text Text containing placeholders
   * @param values placeholder value mapping
   * @returns Replaced text
   */
  static replacePlaceholders(text: string, values: Map<string, any>): string {
    if (typeof text !== 'string') {
      return text
    }

    return text.replace(this.PLACEHOLDER_REGEX, (match, placeholderName) => {
      const trimmedName = placeholderName.trim()
      if (values.has(trimmedName)) {
        const value = values.get(trimmedName)
        return value !== null && value !== undefined ? String(value) : match
      }
      return match // Keep the original placeholder if no value is found
    })
  }

  /**
   * Validate placeholder name format
   * @param name placeholder name
   * @returns Is it a valid name?
   */
  static isValidPlaceholderName(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false
    }

    // Placeholder name rules：Beginning with letters，Can contain letters、number、Underline
    const nameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/
    return nameRegex.test(name.trim())
  }

  /**
   * generateHTTPPlaceholder name for parameter
   * @param parameterKey Parameter key name
   * @returns Standardized placeholder names
   */
  static generateHttpPlaceholderName(parameterKey: string): string {
    if (!parameterKey || typeof parameterKey !== 'string') {
      throw new Error('Parameter key name cannot be empty')
    }

    // Clean up parameter key names，Keep only letters, numbers and underscores
    const cleanKey = parameterKey
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_') // Combine consecutive underscores
      .replace(/^_+|_+$/g, '') // Remove leading and trailing underscores

    if (!cleanKey) {
      throw new Error(`Invalid parameter key name: ${parameterKey}`)
    }

    return `http_${cleanKey}`
  }
}

/**
 * type guard：Check whether it is an enhanced version configuration
 */
export function isEnhancedConfiguration(config: any): config is EnhancedDataSourceConfiguration {
  return config && typeof config.version === 'string' && config.version.startsWith('2.')
}

/**
 * type guard：Check whether it is configured for generic data items
 */
export function isGenericDataItemConfig(item: any): item is DataItemConfig {
  return item && typeof item.type === 'string' && typeof item.id === 'string' && item.config
}

/**
 * type guard：Check if it is an enhanced versionHTTPConfiguration
 */
export function isEnhancedHttpConfig(config: any): config is EnhancedHttpDataItemConfig {
  return config && Array.isArray(config.headers) && Array.isArray(config.params)
}

/**
 * type guard：Check if it isEnhancedHttpConfig（used forUnifiedDataConfig）
 */
export function isUnifiedHttpConfig(config: any): config is EnhancedHttpConfig {
  return (
    config &&
    typeof config.url === 'string' &&
    typeof config.method === 'string' &&
    (config.headers === undefined || Array.isArray(config.headers)) &&
    (config.params === undefined || Array.isArray(config.params))
  )
}

/**
 * type guard：Check if it is validHttpHeader
 */
export function isValidHttpHeader(header: any): header is HttpHeader {
  return (
    header &&
    typeof header.key === 'string' &&
    typeof header.value === 'string' &&
    typeof header.enabled === 'boolean' &&
    typeof header.isDynamic === 'boolean' &&
    ['string', 'number', 'boolean', 'json'].includes(header.dataType) &&
    typeof header.variableName === 'string'
  )
}

/**
 * type guard：Check if it is validHttpParam
 */
export function isValidHttpParam(param: any): param is HttpParam {
  return (
    param &&
    typeof param.key === 'string' &&
    typeof param.value === 'string' &&
    typeof param.enabled === 'boolean' &&
    typeof param.isDynamic === 'boolean' &&
    ['string', 'number', 'boolean', 'json'].includes(param.dataType) &&
    typeof param.variableName === 'string'
  )
}

/**
 * type guard：Check if it is validPlaceholderConfig
 */
export function isValidPlaceholderConfig(config: any): config is PlaceholderConfig {
  return (
    config &&
    typeof config.name === 'string' &&
    config.value !== undefined &&
    ['string', 'number', 'boolean', 'json'].includes(config.dataType) &&
    typeof config.required === 'boolean'
  )
}

/**
 * type guard：Check if it is validComponentMappingConfig
 */
export function isValidComponentMappingConfig(config: any): config is ComponentMappingConfig {
  return (
    config &&
    typeof config.id === 'string' &&
    typeof config.name === 'string' &&
    config.sourceComponent &&
    config.targetHttpConfig &&
    Array.isArray(config.mappings) &&
    ['active', 'inactive', 'error'].includes(config.status)
  )
}

// ==================== Backward compatibility guaranteed ====================

/**
 * Configuration type version enum
 */
export enum ConfigurationVersionEnum {
  V1_0 = 'v1.0',
  V2_0 = 'v2.0'
}

/**
 * Default enhanced feature switch configuration
 */
export const DEFAULT_ENHANCED_FEATURES: EnhancedFeatureFlags = {
  httpArrayFormat: true,
  dynamicParameterSupport: true,
  secureScriptExecution: true,
  configurationValidation: true,
  performanceMonitoring: true
}

// ==================== Export summary ====================

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

  // EnhanceHTTPConfiguration（used forUnifiedDataConfig）
  EnhancedHttpConfig,

  // dynamic parameter system
  DynamicParam,

  // placeholder system
  PlaceholderConfig,
  PlaceholderValidationRule,
  PlaceholderDependencyAnalysis,
  PlaceholderDependencyDetail,
  PlaceholderOccurrence,
  PlaceholderValidationResult,
  PlaceholderValidationError,
  PlaceholderValidationWarning,

  // component mapping system
  ComponentMappingConfig,
  ComponentMappingSource,
  HttpConfigMappingTarget,
  ComponentProperty,
  HttpMappableParameter,
  PropertyToParameterMapping,
  DataTransformationConfig,
  ConditionalMappingConfig,

  // ConfigurationManagerExpand
  EnhancedConfigurationManager,
  CircularDependencyResult,

  // Enhanced configuration system
  EnhancedDataSourceConfiguration,
  EnhancedFeatureFlags,
  ConfigurationMetadata,

  // adapter system
  ConfigurationAdapter
}
