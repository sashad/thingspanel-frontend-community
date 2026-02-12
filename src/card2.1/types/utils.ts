/**
 * Card2.1 Collection of type utility functions
 * Provide type operations、Transformations and Accessibility
 */

import type {
  ComponentDefinition,
  DataSourceRequirement,
  StaticParamRequirement,
  Setting,
  CustomConfig,
  DataConfig,
  SettingControlType,
  ComponentSettingConfig,
  SettingGroup,
  DataFieldType,
  InteractionEventType,
  InteractionActionType
} from './index'

// ============ Type conversion tools ============

/**
 * Generate a default configuration object from a list of settings
 * @param settings Setting list
 * @returns Default configuration object
 */
export function generateDefaultConfigFromSettings<T = Record<string, any>>(settings: Setting[]): T {
  const config = {} as T
  
  settings.forEach(setting => {
    const keys = setting.field.split('.')
    let current = config as any
    
    // Handling nested field paths，like 'customize.title'
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!current[key]) {
        current[key] = {}
      }
      current = current[key]
    }
    
    const finalKey = keys[keys.length - 1]
    current[finalKey] = setting.defaultValue
  })
  
  return config
}

/**
 * Organize setting items into groups
 * @param settings Setting list
 * @returns Settings organized into groups
 */
export function groupSettingsByGroup(settings: Setting[]): Record<string, Setting[]> {
  const groups: Record<string, Setting[]> = {}
  
  settings.forEach(setting => {
    const group = setting.group || 'Default grouping'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(setting)
  })
  
  return groups
}

/**
 * Inferred based on control typeTypeScripttype
 * @param controlType Control type
 * @returns TypeScripttype string
 */
export function inferTSTypeFromControlType(controlType: SettingControlType | string): string {
  switch (controlType) {
    case SettingControlType.INPUT:
    case SettingControlType.TEXTAREA:
    case SettingControlType.SELECT:
    case SettingControlType.RADIO_GROUP:
    case SettingControlType.COLOR_PICKER:
      return 'string'
    
    case SettingControlType.INPUT_NUMBER:
    case SettingControlType.SLIDER:
      return 'number'
    
    case SettingControlType.SWITCH:
    case SettingControlType.CHECKBOX:
      return 'boolean'
    
    case SettingControlType.DATE_PICKER:
      return 'Date'
    
    case SettingControlType.DYNAMIC_TAGS:
      return 'string[]'
    
    case SettingControlType.VUE_COMPONENT:
      return 'any'
    
    default:
      return 'any'
  }
}

/**
 * Infer default value from data field type
 * @param fieldType Data field type
 * @returns default value
 */
export function getDefaultValueForFieldType(fieldType: DataFieldType): any {
  switch (fieldType) {
    case 'string':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'date':
      return new Date()
    case 'array':
      return []
    case 'object':
      return {}
    case 'value':
      return null
    default:
      return undefined
  }
}

// ============ Configuration object manipulation tools ============

/**
 * Deep merge configuration objects
 * @param target target configuration object
 * @param source source configuration object
 * @returns Merged configuration object
 */
export function deepMergeConfig<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key]
      const targetValue = result[key]
      
      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) &&
          targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
        result[key] = deepMergeConfig(targetValue, sourceValue)
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>]
      }
    }
  }
  
  return result
}

/**
 * Extract field values ​​from configuration object
 * @param config Configuration object
 * @param fieldPath field path，like 'customize.title'
 * @returns field value
 */
export function extractFieldValue(config: any, fieldPath: string): any {
  const keys = fieldPath.split('.')
  let current = config
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return undefined
    }
  }
  
  return current
}

/**
 * Set field value to configuration object
 * @param config Configuration object
 * @param fieldPath field path，like 'customize.title'
 * @param value value to set
 * @returns Updated configuration object
 */
export function setFieldValue<T extends Record<string, any>>(config: T, fieldPath: string, value: any): T {
  const keys = fieldPath.split('.')
  const result = { ...config }
  let current = result as any
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {}
    } else {
      current[key] = { ...current[key] }
    }
    current = current[key]
  }
  
  const finalKey = keys[keys.length - 1]
  current[finalKey] = value
  
  return result
}

// ============ Component definition operation tool ============

/**
 * Create component configuration template
 * @param componentType Component type
 * @param settings Setting list
 * @returns Component settings configuration
 */
export function createComponentSettingConfig<T = Record<string, any>>(
  componentType: string,
  settings: Setting[],
  customConfig?: CustomConfig<T>
): ComponentSettingConfig<T> {
  const defaultCustomConfig: CustomConfig<T> = customConfig || {
    type: componentType,
    root: {
      transform: {
        rotate: 0,
        scale: 1
      }
    },
    customize: generateDefaultConfigFromSettings<T>(settings)
  }

  return {
    componentType,
    settings,
    customConfig: defaultCustomConfig
  }
}

/**
 * Extract the data source requirements of the component
 * @param definition Component definition
 * @returns Data source requirements list
 */
export function extractDataSourceRequirements(definition: ComponentDefinition): DataSourceRequirement[] {
  return definition.dataSources || []
}

/**
 * Extract the static parameter requirements of the component
 * @param definition Component definition
 * @returns Static parameter requirement list
 */
export function extractStaticParamRequirements(definition: ComponentDefinition): StaticParamRequirement[] {
  return definition.staticParams || []
}

/**
 * Check if a component supports a specific data source type
 * @param definition Component definition
 * @param dataSourceType Data source type
 * @returns Whether to support
 */
export function supportsDataSourceType(
  definition: ComponentDefinition,
  dataSourceType: 'static' | 'api' | 'websocket' | 'mqtt' | 'database' | 'script'
): boolean {
  const dataSources = definition.dataSources || []
  return dataSources.some(ds => ds.supportedTypes.includes(dataSourceType))
}

// ============ Data source and field mapping tools ============

/**
 * Create field mapping configuration
 * @param sourceField Source field name
 * @param targetField Target field name
 * @param fieldType Field type
 * @param options Optional configuration
 * @returns Field mapping configuration
 */
export function createFieldMapping(
  sourceField: string,
  targetField: string,
  fieldType: DataFieldType,
  options: {
    required?: boolean
    defaultValue?: any
    transform?: string
  } = {}
): Record<string, any> {
  return {
    [sourceField]: {
      targetField,
      type: fieldType,
      required: options.required ?? false,
      defaultValue: options.defaultValue ?? getDefaultValueForFieldType(fieldType),
      transform: options.transform
    }
  }
}

/**
 * Merge multiple field mapping configurations
 * @param mappings Field mapping configuration array
 * @returns Merged field mapping configuration
 */
export function mergeFieldMappings(...mappings: Record<string, any>[]): Record<string, any> {
  return Object.assign({}, ...mappings)
}

// ============ Interactive configuration tool ============

/**
 * Create a simple click-to-jump interaction configuration
 * @param url JumpURL
 * @param external Is it an external link?
 * @returns Interactive configuration
 */
export function createClickJumpInteraction(url: string, external: boolean = true) {
  return {
    event: 'click' as InteractionEventType,
    responses: [{
      action: 'jump' as InteractionActionType,
      jumpConfig: {
        jumpType: external ? 'external' : 'internal',
        url: external ? url : undefined,
        internalPath: !external ? url : undefined,
        target: external ? '_blank' : '_self'
      }
    }],
    enabled: true
  }
}

/**
 * Create attributes and modify interaction configurations
 * @param targetComponentId target componentID
 * @param targetProperty target attribute
 * @param updateValue update value
 * @returns Interactive configuration
 */
export function createModifyInteraction(
  targetComponentId: string,
  targetProperty: string,
  updateValue: any
) {
  return {
    event: 'click' as InteractionEventType,
    responses: [{
      action: 'modify' as InteractionActionType,
      modifyConfig: {
        targetComponentId,
        targetProperty,
        updateValue,
        updateMode: 'replace'
      }
    }],
    enabled: true
  }
}

// ============ Grouping and classification tools ============

/**
 * Infer component classification based on file path
 * @param filePath Component file path
 * @returns Classified information
 */
export function inferCategoryFromPath(filePath: string): {
  mainCategory: string
  subCategory?: string
  category: string
} {
  const pathParts = filePath.split('/').filter(part => part && part !== '.')
  
  // FindcomponentsThe path part after the directory
  const componentsIndex = pathParts.findIndex(part => part === 'components')
  if (componentsIndex === -1 || componentsIndex >= pathParts.length - 1) {
    return {
      mainCategory: 'other',
      category: 'other'
    }
  }
  
  const categoryParts = pathParts.slice(componentsIndex + 1)
  const mainCategory = categoryParts[0] || 'other'
  const subCategory = categoryParts.length > 2 ? categoryParts[1] : undefined
  
  return {
    mainCategory,
    subCategory,
    category: subCategory ? `${mainCategory}/${subCategory}` : mainCategory
  }
}

/**
 * Create settings group
 * @param name Group name
 * @param label Group labels
 * @param fields Field list
 * @param options Optional configuration
 * @returns Set group configuration
 */
export function createSettingGroup(
  name: string,
  label: string,
  fields: string[],
  options: {
    description?: string
    collapsible?: boolean
    defaultExpanded?: boolean
  } = {}
): SettingGroup {
  return {
    name,
    label,
    fields,
    description: options.description,
    collapsible: options.collapsible ?? true,
    defaultExpanded: options.defaultExpanded ?? true
  }
}

// ============ Development aids ============

/**
 * Generate component definitionTypeScriptInterface code
 * @param definition Component definition
 * @returns TypeScriptInterface code string
 */
export function generateTSInterfaceFromDefinition(definition: ComponentDefinition): string {
  const interfaceName = `${pascalCase(definition.type)}Config`
  const staticParams = definition.staticParams || []
  const dataSources = definition.dataSources || []
  
  let interfaceCode = `interface ${interfaceName} {\n`
  
  // Generate static parameter fields
  staticParams.forEach(param => {
    const tsType = param.type === 'array' ? 'any[]' : 
                   param.type === 'object' ? 'Record<string, any>' : param.type
    interfaceCode += `  /** ${param.description} */\n`
    interfaceCode += `  ${param.key}${param.required === false ? '?' : ''}: ${tsType}\n`
  })
  
  // Generate data source fields
  dataSources.forEach(ds => {
    if (ds.fieldMappings) {
      Object.entries(ds.fieldMappings).forEach(([_, mapping]) => {
        const tsType = mapping.type === 'array' ? 'any[]' :
                       mapping.type === 'object' ? 'Record<string, any>' : 
                       mapping.type === 'number' ? 'number' :
                       mapping.type === 'boolean' ? 'boolean' : 'string'
        interfaceCode += `  /** ${ds.description} - ${mapping.targetField} */\n`
        interfaceCode += `  ${mapping.targetField}${!mapping.required ? '?' : ''}: ${tsType}\n`
      })
    }
  })
  
  interfaceCode += '}'
  
  return interfaceCode
}

/**
 * Convert string toPascalCase
 * @param str input string
 * @returns PascalCasestring
 */
function pascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

/**
 * Verify integrity of component configuration
 * @param definition Component definition
 * @param config Component configuration
 * @returns Verification results
 */
export function validateComponentConfig(
  definition: ComponentDefinition,
  config: any
): {
  valid: boolean
  missingFields: string[]
  invalidFields: string[]
  warnings: string[]
} {
  const result = {
    valid: true,
    missingFields: [] as string[],
    invalidFields: [] as string[],
    warnings: [] as string[]
  }
  
  // Check static parameters
  const staticParams = definition.staticParams || []
  staticParams.forEach(param => {
    const value = extractFieldValue(config, param.key)
    
    if (param.required && (value === undefined || value === null)) {
      result.missingFields.push(param.key)
    }
    
    if (value !== undefined && value !== null) {
      // simple type checking
      const expectedType = param.type
      const actualType = Array.isArray(value) ? 'array' : typeof value
      
      if (expectedType !== actualType && expectedType !== 'object') {
        result.invalidFields.push(`${param.key}: expect ${expectedType}, actual ${actualType}`)
      }
    }
  })
  
  result.valid = result.missingFields.length === 0 && result.invalidFields.length === 0
  return result
}

// ============ Export all utility functions ============

export const TypeUtils = {
  // type conversion
  generateDefaultConfigFromSettings,
  groupSettingsByGroup,
  inferTSTypeFromControlType,
  getDefaultValueForFieldType,
  
  // Configuration operations
  deepMergeConfig,
  extractFieldValue,
  setFieldValue,
  
  // Component definition
  createComponentSettingConfig,
  extractDataSourceRequirements,
  extractStaticParamRequirements,
  supportsDataSourceType,
  
  // Field mapping
  createFieldMapping,
  mergeFieldMappings,
  
  // Interactive configuration
  createClickJumpInteraction,
  createModifyInteraction,
  
  // Group classification
  inferCategoryFromPath,
  createSettingGroup,
  
  // development tools
  generateTSInterfaceFromDefinition,
  validateComponentConfig
}