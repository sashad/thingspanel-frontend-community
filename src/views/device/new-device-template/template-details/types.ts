/**
 * Device template related type definitions
 */

// ==================== base type ====================

/**
 * Data type enumeration
 */
export type DataType = 'String' | 'Number' | 'Boolean' | 'Enum'

/**
 * Read and write identification
 */
export type ReadWriteFlag = 'R' | 'RW'

/**
 * Parameter type
 */
export type ParamType = 'String' | 'Number' | 'Boolean' | 'Enum'

// ==================== Template basic information ====================

/**
 * Basic information about device templates
 */
export interface DeviceTemplate {
  id?: string
  name: string
  label: string // Label（comma separated）
  path: string // Cover image path
  author: string
  version: string
  description: string
  web_chart_config?: string // WebChart configuration（JSONstring）
  app_chart_config?: string // APPChart configuration（JSONstring）
  created_at?: string
  updated_at?: string
}

/**
 * Template form data（Front-end use）
 */
export interface TemplateFormData {
  id?: string
  name: string
  templateTags: string[] // frontend tag array
  label: string // Backend tag string
  path: string
  author: string
  version: string
  description: string
}

// ==================== Enum configuration ====================

/**
 * Enumeration item configuration
 */
export interface EnumConfig {
  value_type: 'String' | 'Number' | 'Boolean'
  value: string | number | boolean
  description: string
}

/**
 * Command parameter enumeration configuration
 */
export interface CommandEnumConfig {
  value: string | number | boolean
  desc: string
}

// ==================== telemetry data ====================

/**
 * Telemetry data definition
 */
export interface TelemetryData {
  id?: string
  device_template_id: string
  data_name: string
  data_identifier: string
  data_type: DataType
  read_write_flag: ReadWriteFlag
  unit: string
  description: string
  additional_info: string // JSONstring
}

/**
 * Telemetry form data（Front-end use）
 */
export interface TelemetryFormData {
  id?: string
  device_template_id: string
  data_name: string
  data_identifier: string
  data_type: DataType
  read_write_flag: 'R-只read' | 'RW-read/Write'
  unit: string
  description: string
  additional_info: EnumConfig[] // Enum configuration array
}

// ==================== attribute data ====================

/**
 * Attribute data definition（Same as telemetry structure）
 */
export type AttributeData = TelemetryData
export type AttributeFormData = TelemetryFormData

// ==================== event data ====================

/**
 * Event parameter definition
 */
export interface EventParam {
  id?: number
  data_name: string
  data_identifier: string
  read_write_flag: DataType // Actually the data type
  description: string
}

/**
 * event data definition
 */
export interface EventData {
  id?: string
  device_template_id: string
  data_name: string
  data_identifier: string
  description: string
  params: string // JSONstring
  paramsOrigin?: string // Save original while editingJSON
}

/**
 * event form data（Front-end use）
 */
export interface EventFormData {
  id?: string
  device_template_id: string
  data_name: string
  data_identifier: string
  description: string
  params: EventParam[]
}

// ==================== command data ====================

/**
 * Command parameter definition
 */
export interface CommandParam {
  id?: number
  data_name: string
  data_identifier: string
  param_type: ParamType
  description: string
  data_type?: 'String' | 'Number' | 'Boolean' // onlyEnumtype required
  enum_config?: CommandEnumConfig[]
}

/**
 * Command data definition
 */
export interface CommandData {
  id?: string
  device_template_id: string
  data_name: string
  data_identifier: string
  description: string
  params: string // JSONstring
  paramsOrigin?: string
}

/**
 * command form data（Front-end use）
 */
export interface CommandFormData {
  id?: string
  device_template_id: string
  data_name: string
  data_identifier: string
  description: string
  params: CommandParam[]
}

// ==================== Page query ====================

/**
 * Pagination query parameters
 */
export interface PageQuery {
  page: number
  page_size: number
  device_template_id: string
}

/**
 * Paginated response data
 */
export interface PageResponse<T> {
  list: T[]
  total: number
}

// ==================== APIresponse ====================

/**
 * UniversalAPIresponse
 */
export interface ApiResponse<T = any> {
  data: T
  error?: string
}
