/**
 * Card2.1 core type definition
 * Unified management of all core types，avoid type fragmentation
 */

import type { Component } from 'vue'

// ============ Component definition related types ============

/**
 * Component definition interface
 */
export interface ComponentDefinition<TConfig = Record<string, any>> {
  type: string
  name: string
  description: string
  component: Component
  dataSources?: DataSourceRequirement[]
  propertyWhitelist?: ComponentPropertyWhitelist
  defaultConfig?: ComponentDefaultConfig<TConfig>
  staticParams?: Record<string, StaticParamDefinition>
  supportedDataSources?: string[]
  permission?: string
  version?: string
  tags?: string[]
  isRegistered?: boolean

  // Classified information
  mainCategory?: string
  subCategory?: string
  category?: string
}

/**
 * Data source requirement definition
 */
export interface DataSourceRequirement {
  key: string
  type: 'static' | 'dynamic' | 'websocket'
  description?: string
  required?: boolean
  defaultValue?: any
}

/**
 * Component property whitelist
 */
export interface ComponentPropertyWhitelist {
  [propName: string]: PropertyExposureConfig
}

/**
 * Property exposure configuration
 */
export interface PropertyExposureConfig {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  label: string
  description?: string
  required?: boolean
  defaultValue?: any
  options?: Array<{ label: string; value: any }>
  group?: string
  order?: number
  hidden?: boolean
  disabled?: boolean
}

/**
 * Component default configuration
 */
export interface ComponentDefaultConfig<TConfig = Record<string, any>> {
  staticParams?: TConfig
  dataSources?: Record<string, any>
  interactions?: any[]
}

/**
 * Static parameter definition
 */
export interface StaticParamDefinition {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  label: string
  description?: string
  default?: any
  required?: boolean
  options?: Array<{ label: string; value: any }>
  group?: string
  order?: number
}

// ============ Classification system type ============

/**
 * Classification configuration interface
 */
export interface CategoryConfig {
  id: string
  displayName: string
  order: number
  icon?: string
  description?: string
  enabled?: boolean
  devOnly?: boolean
  parentId?: 'system' | 'chart'
}

/**
 * Component classification
 */
export interface ComponentCategory {
  id: string
  name: string
  description?: string
  icon?: string
  children?: ComponentCategory[]
}

/**
 * Component tree structure
 */
export interface ComponentTree {
  categories: ComponentCategory[]
  components: ComponentDefinition[]
  totalCount: number
}

// ============ Data source related types ============

/**
 * Actuator data format
 */
export interface ExecutorData {
  [key: string]: unknown
  main?: {
    [dataSourceKey: string]: unknown
  }
  primaryData?: any
}

/**
 * Data source mapping results
 */
export interface DataSourceMappingResult {
  [propName: string]: unknown
}

// ============ Interactive system type ============

/**
 * Interactive configuration
 */
export interface InteractionConfig {
  id: string
  name: string
  description?: string
  eventType: InteractionEventType
  conditions?: ConditionConfig[]
  responses: InteractionResponse[]
  enabled?: boolean
}

/**
 * Interaction event type
 */
export type InteractionEventType = 'click' | 'hover' | 'focus' | 'blur' | 'change' | 'custom'

/**
 * Conditional configuration
 */
export interface ConditionConfig {
  property: string
  operator: ComparisonOperator
  value: any
}

/**
 * comparison operator
 */
export type ComparisonOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'notContains'

/**
 * interactive response
 */
export interface InteractionResponse {
  action: InteractionActionType
  [key: string]: any
}

/**
 * Interaction type
 */
export type InteractionActionType = 'jump' | 'modify' | 'showNotification' | 'changeVisibility'

/**
 * Jump configuration
 */
export interface JumpConfig {
  jumpType: 'internal' | 'external'
  target?: string
  url?: string
  internalPath?: string
}

/**
 * Modify configuration
 */
export interface ModifyConfig {
  targetComponentId: string
  targetProperty: string
  updateValue: any
  updateMode: 'replace' | 'append' | 'increment'
}

/**
 * Component interaction state
 */
export interface ComponentInteractionState {
  [interactionId: string]: any
}

// ============ Form configuration type ============

/**
 * TypeScript Configuration
 */
export interface TSConfig {
  title?: string
  description?: string
  fields: FormField[]
  groups?: FormGroup[]
}

/**
 * configuration mode
 */
export type ConfigMode = 'standard' | 'vue-component' | 'hybrid'

/**
 * form fields
 */
export interface FormField {
  type: string
  label: string
  field: string
  group?: string
  placeholder?: string
  defaultValue?: any
  required?: boolean
  options?: Array<{ label: string; value: any }>
  description?: string
  hidden?: boolean
  disabled?: boolean
}

/**
 * Form grouping
 */
export interface FormGroup {
  name: string
  label: string
  description?: string
  fields: string[]
  collapsible?: boolean
  defaultExpanded?: boolean
}

// ============ Permission related types ============

/**
 * User permission type
 */
export type UserAuthority = 'SYS_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER' | 'NO_LIMIT'

// ============ Registry interface ============

/**
 * Component registry interface
 */
export interface IComponentRegistry {
  register(definition: ComponentDefinition): void
  get(type: string): ComponentDefinition | undefined
  getAll(): ComponentDefinition[]
  has(type: string): boolean
  clear(): void
  getDataSourceKeys(type: string): string[]
  getStaticParamKeys(type: string): string[]
}

/**
 * Data source mapper interface
 */
export interface IDataSourceMapper {
  mapDataSources(componentType: string, executorData: ExecutorData | null | undefined): DataSourceMappingResult
  mapStaticParams(componentType: string, staticParams: Record<string, any> | null | undefined): Record<string, any>
  validateMapping(
    componentType: string,
    mappingResult: DataSourceMappingResult
  ): {
    isValid: boolean
    missingKeys: string[]
    extraKeys: string[]
  }
}

/**
 * Property exposure manager interface
 */
export interface IPropertyExposureManager {
  registerPropertyWhitelist(componentType: string, whitelist: ComponentPropertyWhitelist): void
  getPropertyWhitelist(componentType: string): ComponentPropertyWhitelist | undefined
  getAllPropertyWhitelists(): Record<string, ComponentPropertyWhitelist>
  addGlobalBaseProperties(whitelist: ComponentPropertyWhitelist): ComponentPropertyWhitelist
}

// ============ Export all types ============

export type {
  ComponentDefinition,
  DataSourceRequirement,
  ComponentPropertyWhitelist,
  PropertyExposureConfig,
  ComponentDefaultConfig,
  StaticParamDefinition,
  CategoryConfig,
  ComponentCategory,
  ComponentTree,
  ExecutorData,
  DataSourceMappingResult,
  InteractionConfig,
  InteractionEventType,
  ConditionConfig,
  ComparisonOperator,
  InteractionResponse,
  InteractionActionType,
  JumpConfig,
  ModifyConfig,
  ComponentInteractionState,
  TSConfig,
  ConfigMode,
  FormField,
  FormGroup,
  UserAuthority,
  IComponentRegistry,
  IDataSourceMapper,
  IPropertyExposureManager
}
