/**
 * Unified type export entrance
 * Integratedata-architectureAll type definitions in the system，Provide a unified import entrance
 * Solve the problem of repeated type definitions and inconsistent naming
 */

// ==================== core base types ====================

/**
 * Parameter value pattern enumeration - Edit mode that unifies all parameter configurations
 */
export type ValueMode = 'manual' | 'dropdown' | 'property' | 'component'

/**
 * Data type enumeration - Common data type definitions in the system
 */
export type DataType = 'string' | 'number' | 'boolean' | 'json'

/**
 * Parameter type enum - HTTPClassification of parameters
 */
export type ParamType = 'path' | 'query' | 'header'

/**
 * Address type enum - HTTPRequested address source type
 */
export type AddressType = 'internal' | 'external'

/**
 * Data source type enumeration - Supported data source types
 */
export type DataSourceType = 'static' | 'api' | 'websocket' | 'mqtt' | 'database' | 'script'

/**
 * Trigger type enum
 */
export type TriggerType = 'timer' | 'websocket' | 'event' | 'manual'

/**
 * Field type enum - supportCard2.1extended type system
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'any' | 'object' | 'array'

/**
 * Component type enum
 */
export type ComponentType = 'visual-editor' | 'card2.1' | 'standard'

// ==================== Basic interface re-export ====================

// fromparameter-editor.tsExport enhanced parameter types
export type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'

// ==================== HTTPConfigure core types ====================

/**
 * HTTPParameter unified interface（standardized version）
 * Integratedenhanced-types.tsandhttp-config.tsDuplicate definitions in
 */
export interface HttpParameter {
  /** Parameter key name */
  key: string

  /** Parameter value - Example value，type withdataTypematch */
  value: string | number | boolean

  /** default value - whenvalueFallback value used when empty or binding fails */
  defaultValue?: string | number | boolean

  /** Whether to enable this parameter */
  enabled: boolean

  /** Whether it is a dynamic parameter */
  isDynamic: boolean

  /** data type，for type conversion and validation */
  dataType: DataType

  /** Automatically generated variable names when dynamic */
  variableName: string

  /** Parameter description，Recommended required */
  description: string

  /** Parameter type：path parameters、query parameters、Request header parameters */
  paramType: ParamType

  /** Parameter value mode：Manual entry、drop down selection、Property binding, etc. */
  valueMode?: ValueMode

  /** selected templateID */
  selectedTemplate?: string
}

/**
 * HTTPRequest header configuration（Reserved for backward compatibility）
 * @deprecated It is recommended to use a unifiedHttpParameter with paramType: 'header'
 */
export interface HttpHeader extends HttpParameter {
  paramType: 'header'
}

/**
 * HTTPQuery parameter configuration（Reserved for backward compatibility）
 * @deprecated It is recommended to use a unifiedHttpParameter with paramType: 'query'
 */
export interface HttpParam extends HttpParameter {
  paramType: 'query'
}

/**
 * HTTPPath parameter configuration（Reserved for backward compatibility）
 * @deprecated It is recommended to use a unifiedHttpParameter with paramType: 'path'
 */
export interface HttpPathParam extends HttpParameter {
  paramType: 'path'
  /** path parameter name（without braces），like 'device_id' */
  key: string
  /** existURLplaceholder format in，like '{device_id}' */
  placeholder: string
}

/**
 * Simplified configuration of path parameters
 * Only supports a single path parameter，directly spliced ​​toURLback
 */
export interface PathParameter {
  /** Parameter value - Example value，type withdataTypematch */
  value: string | number | boolean

  /** default value - whenvalueFallback value to use when empty */
  defaultValue?: string | number | boolean

  /** Whether it is a dynamic parameter */
  isDynamic: boolean

  /** data type，for type conversion and validation */
  dataType: DataType

  /** Automatically generated variable names when dynamic */
  variableName: string

  /** Parameter description */
  description: string

  /** Parameter value mode：Manual entry、drop down selection、Property binding, etc. */
  valueMode?: ValueMode

  /** selected templateID */
  selectedTemplate?: string

  /** Parameter key name（for internal identification） */
  key?: string

  /** Whether to enable（for backward compatibility） */
  enabled?: boolean
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

/**
 * HTTPConfigure interface（unified standard version）
 * Integrate multiple filesHTTPConfiguration definition
 */
export interface HttpConfig {
  /** Basic requestURL（The path parameters will be spliced ​​hereURLback） */
  url: string

  /** HTTPmethod */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

  /** timeout（millisecond） */
  timeout: number

  /** Address type：Internal or external address */
  addressType?: AddressType

  /** Selected internal address value（whenaddressTypeforinternalused when） */
  selectedInternalAddress?: string

  /** Whether to enable parameter passing（Path parameter configuration for internal addresses） */
  enableParams?: boolean

  /** Path parameter configuration array（new format，Support multiple parameters） */
  pathParams?: EnhancedParameter[]

  /** path parameters（Optional，A single parameter is spliced ​​directly toURLback） */
  pathParameter?: PathParameter

  /** Query parameter configuration */
  params: HttpParam[]

  /** Request header configuration */
  headers: HttpHeader[]

  /** Request body（Optional） */
  body?: string | HttpBody

  /** Pre-request processing script（Optional） */
  preRequestScript?: string

  /** Response post-processing script（Optional） */
  postResponseScript?: string

  /** Retry configuration */
  retry?: {
    /** Maximum number of retries */
    maxRetries: number
    /** Retry interval（millisecond） */
    retryDelay: number
  }

  // ========== backward compatibility fields（Deprecated） ==========
  /** @deprecated Use simplified pathParameter field substitution */
  pathParams_deprecated?: HttpPathParam[]
  /** @deprecated Use the new unity parameters field substitution */
  parameters?: HttpParameter[]
}

// ==================== Data source system type ====================

/**
 * Component Data Requirements Statement - andCard2.1Fully compatible
 * fromsimple-types.tsRe-export and normalize
 */
export interface ComponentDataRequirement {
  /** componentsID */
  componentId: string
  /** Component name */
  componentName: string
  /** Static parameter requirement declaration - andCard2.1 StaticParamRequirementcorrespond */
  staticParams?: StaticParamRequirement[]
  /** Data source requirement statement - andCard2.1 DataSourceRequirementcorrespond */
  dataSources: DataSourceRequirement[]
}

/**
 * Static parameter requirement definition - andCard2.1completely consistent
 */
export interface StaticParamRequirement {
  /** Parameter unique identifier */
  key: string
  /** Parameter name */
  name: string
  /** Parameter type */
  type: FieldType
  /** Parameter description */
  description: string
  /** default value */
  defaultValue?: any
  /** Is it required? */
  required?: boolean
  /** Parameter validation rules */
  validation?: ValidationRule
  /** UI Rendering tips */
  ui?: UIConfig
}

/**
 * Data source requirement statement - andCard2.1Fully compatible version
 */
export interface DataSourceRequirement {
  /** Data source unique identifier - andCard2.1 keycorrespond */
  key: string
  /** Data source name */
  name: string
  /** Data source description */
  description: string
  /** Supported data source types - andCard2.1Alignment */
  supportedTypes: DataSourceType[]
  /** Field mapping rules - andCard2.1 fieldMappingscompatible */
  fieldMappings: Record<string, FieldMapping>
  /** Is it required? */
  required?: boolean

  // ==== backward compatibility fields - Support original simplified format ====
  /** data structure type - backward compatible */
  structureType?: 'object' | 'array'
  /** Field requirements - backward compatible */
  fields?: FieldRequirement[]
  /** data sourceID - backward compatible */
  id?: string
}

/**
 * Field mapping rules
 */
export interface FieldMapping {
  /** Target field name */
  targetField: string
  /** Field type */
  type: 'value' | 'object' | 'array'
  /** Is it required? */
  required: boolean
  /** default value */
  defaultValue?: any
  /** data conversion function */
  transform?: string
}

/**
 * Field requirement statement - andCard2.1Compatible extended version
 */
export interface FieldRequirement {
  /** Field name */
  name: string
  /** Field type - Extended supportCard2.1type system */
  type: FieldType
  /** value type - Used to further subdivide types */
  valueType?: 'number' | 'string' | 'boolean' | 'any'
  /** Is it required? */
  required: boolean
  /** Field description */
  description: string
  /** Example value */
  example?: any
  /** default value - andCard2.1 StaticParamRequirementcompatible */
  defaultValue?: any
  /** Nested structure definition - Supports complex objects and arrays */
  structure?: DataSourceRequirement
  /** Validation rules - andCard2.1Compatible authentication configurations */
  validation?: ValidationRule
  /** UIRendering tips - supportCard2.1ofUIConfiguration */
  ui?: UIConfig
}

/**
 * Verification rules unified interface
 */
export interface ValidationRule {
  /** minimum value/minimum length */
  min?: number
  /** maximum value/maximum length */
  max?: number
  /** regular expression */
  pattern?: string
  /** Enum options */
  options?: Array<{ label: string; value: any }>
}

/**
 * UIConfigure unified interface
 */
export interface UIConfig {
  /** UIComponent type */
  component?: 'input' | 'select' | 'number' | 'switch' | 'textarea' | 'color' | 'slider'
  /** placeholder text */
  placeholder?: string
  /** label text */
  label?: string
  /** Group name */
  group?: string
}

// ==================== Data source configuration type ====================

/**
 * Simplified data source configuration - Output to external systems for use
 */
export interface SimpleDataSourceConfig {
  /** ConfigurationID */
  id: string
  /** componentsID */
  componentId: string
  /** Data source definition list */
  dataSources: DataSourceDefinition[]
  /** Trigger configuration - ReuseCard2.1excellent design */
  triggers: TriggerConfig[]
  /** Whether to enable */
  enabled: boolean
}

/**
 * Data source definition
 */
export interface DataSourceDefinition {
  /** data sourceID */
  id: string
  /** Data source type */
  type: DataSourceType
  /** Data source configuration */
  config: any
  /** Field mapping - learn fromvisual-editormapping mechanism */
  fieldMapping?: { [targetField: string]: string }
}

/**
 * Trigger configuration - ReuseCard2.1trigger system
 */
export interface TriggerConfig {
  /** Trigger type */
  type: TriggerType
  /** Trigger configuration */
  config: TriggerConfigData
}

/**
 * Trigger configuration data
 */
export interface TriggerConfigData {
  // Timer configuration
  interval?: number
  immediate?: boolean

  // WebSocketConfiguration
  url?: string
  protocols?: string[]

  // event configuration
  eventName?: string
  target?: EventTarget
}

// ==================== Enhanced version type（fromenhanced-types.tsSelective export） ====================

// Re-export core types for enhanced configuration
export type {
  // component mapping system
  ComponentMappingConfig,
  ComponentMappingSource,
  HttpConfigMappingTarget,
  ComponentProperty,
  HttpMappableParameter,
  PropertyToParameterMapping,
  DataTransformationConfig,
  ConditionalMappingConfig,

  // placeholder system
  PlaceholderConfig,
  PlaceholderValidationRule,
  PlaceholderDependencyAnalysis,
  PlaceholderDependencyDetail,
  PlaceholderOccurrence,
  PlaceholderValidationResult,
  PlaceholderValidationError,
  PlaceholderValidationWarning,

  // Enhanced configuration system
  EnhancedDataSourceConfiguration,
  EnhancedFeatureFlags,
  ConfigurationMetadata,
  ConfigurationVersion,

  // Configuration Manager Extension
  EnhancedConfigurationManager,
  CircularDependencyResult
} from './enhanced-types'

// ==================== Execution results and data types ====================

/**
 * The final data format received by the component
 */
export interface ComponentData {
  [dataSourceId: string]: {
    /** Data source type */
    type: string
    /** parsed data */
    data: any
    /** Last updated */
    lastUpdated?: number
    /** metadata */
    metadata?: any
  }
}

/**
 * Standard componentsProps - The interface used by the new component
 */
export interface StandardComponentProps {
  /** Data source configuration */
  dataSourceConfig?: ComponentData
}

/**
 * Data execution results
 */
export interface ExecutionResult {
  /** Is it successful? */
  success: boolean
  /** Data content */
  data?: ComponentData
  /** error message */
  error?: string
  /** Execution time（millisecond） */
  executionTime: number
  /** Timestamp */
  timestamp: number
}

/**
 * Configuration verification results
 */
export interface ValidationResult {
  /** Is it valid? */
  valid: boolean
  /** error message */
  errors: string[]
  /** warning message */
  warnings: string[]
}

/**
 * Field mapping preview results
 */
export interface MappingPreviewResult {
  /** target field */
  targetField: string
  /** source path */
  sourcePath: string
  /** mapped value */
  mappedValue: any
  /** Is it successful? */
  success: boolean
  /** error message */
  error?: string
}

// ==================== Compatibility type ====================

/**
 * Visual Editor Compatible formats
 */
export interface VisualEditorCompatibleProps {
  widgetConfiguration?: {
    dataSource: {
      config: {
        dataSourceBindings: {
          [dataSourceId: string]: {
            rawData: string
          }
        }
      }
    }
  }
}

/**
 * Card2.1 Compatible formats
 */
export interface Card21CompatibleProps {
  rawDataSources?: {
    dataSourceBindings: {
      [dataSourceId: string]: {
        rawData: string
      }
    }
  }
}

// ==================== Tool types and type guards ====================

/**
 * type guard：Check if it is validHttpParameter
 */
export function isValidHttpParameter(param: any): param is HttpParameter {
  return (
    param &&
    typeof param.key === 'string' &&
    param.value !== undefined &&
    typeof param.enabled === 'boolean' &&
    typeof param.isDynamic === 'boolean' &&
    ['string', 'number', 'boolean', 'json'].includes(param.dataType) &&
    typeof param.variableName === 'string' &&
    ['path', 'query', 'header'].includes(param.paramType)
  )
}

/**
 * type guard：Check if it is validPathParameter
 */
export function isValidPathParameter(param: any): param is PathParameter {
  return (
    param &&
    param.value !== undefined &&
    typeof param.isDynamic === 'boolean' &&
    ['string', 'number', 'boolean', 'json'].includes(param.dataType) &&
    typeof param.variableName === 'string'
  )
}

/**
 * type guard：Check if it is validHttpConfig
 */
export function isValidHttpConfig(config: any): config is HttpConfig {
  return (
    config &&
    typeof config.url === 'string' &&
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method) &&
    typeof config.timeout === 'number' &&
    Array.isArray(config.params) &&
    Array.isArray(config.headers)
  )
}

/**
 * type guard：Check if it is validComponentDataRequirement
 */
export function isValidComponentDataRequirement(requirement: any): requirement is ComponentDataRequirement {
  return (
    requirement &&
    typeof requirement.componentId === 'string' &&
    typeof requirement.componentName === 'string' &&
    Array.isArray(requirement.dataSources)
  )
}

// ==================== constant definition ====================

/**
 * System constants
 */
export const DATA_ARCHITECTURE_CONSTANTS = {
  /** Maximum number of data sources */
  MAX_DATA_SOURCES: 5,

  /** Default trigger interval */
  DEFAULT_TRIGGER_INTERVAL: 30000,

  /** defaultHTTPtimeout */
  DEFAULT_HTTP_TIMEOUT: 10000,

  /** Configuration version */
  CONFIG_VERSION: '2.1.0',

  /** Supported data types */
  SUPPORTED_DATA_TYPES: ['string', 'number', 'boolean', 'json'] as const,

  /** Supported parameter types */
  SUPPORTED_PARAM_TYPES: ['path', 'query', 'header'] as const,

  /** Supported value patterns */
  SUPPORTED_VALUE_MODES: ['manual', 'dropdown', 'property', 'component'] as const,

  /** Supported data source types */
  SUPPORTED_DATA_SOURCE_TYPES: ['static', 'api', 'websocket', 'mqtt', 'database', 'script'] as const
} as const

/**
 * Field type mapping table - Card2.1Type mapping to and from the data source system
 * fromsimple-types.tsRe-export
 */
export const FIELD_TYPE_MAPPING = {
  // Card2.1 -> Data source system
  card2ToDataSource: {
    value: 'any' as FieldType,
    object: 'object' as FieldType,
    array: 'array' as FieldType,
    string: 'string' as FieldType,
    number: 'number' as FieldType,
    boolean: 'boolean' as FieldType
  },
  // Data source system -> Card2.1
  dataSourceToCard2: {
    string: 'value',
    number: 'value',
    boolean: 'value',
    any: 'value',
    object: 'object',
    array: 'array'
  }
} as const

// ==================== Tool function re-export ====================

// fromhttp-config.tsRe-export utility functions
export {
  convertValue,
  createDefaultPathParameter,
  extractPathParamsFromUrl,
  replaceUrlPathParams,
  generateVariableName
} from './http-config'

// fromenhanced-types.tsRe-export tool class
export {
  DataTypeConverter,
  PlaceholderUtils,
  isEnhancedConfiguration,
  isGenericDataItemConfig,
  isEnhancedHttpConfig,
  isUnifiedHttpConfig,
  isValidHttpHeader,
  isValidHttpParam,
  isValidPlaceholderConfig,
  isValidComponentMappingConfig,
  DEFAULT_ENHANCED_FEATURES,
  ConfigurationVersionEnum
} from './enhanced-types'

// ==================== Default configuration export ====================

/**
 * defaultHTTPConfiguration
 */
export const DEFAULT_HTTP_CONFIG: Partial<HttpConfig> = {
  method: 'GET',
  timeout: DATA_ARCHITECTURE_CONSTANTS.DEFAULT_HTTP_TIMEOUT,
  addressType: 'external',
  params: [],
  headers: [],
  enableParams: false
}

/**
 * Default trigger configuration
 */
export const DEFAULT_TRIGGER_CONFIG: TriggerConfig = {
  type: 'timer',
  config: {
    interval: DATA_ARCHITECTURE_CONSTANTS.DEFAULT_TRIGGER_INTERVAL,
    immediate: true
  }
}
