/**
 * Card2.1 type verification system
 * Provides runtime type verification capabilities，Ensure the correctness of type definitions
 */

import type {
  ComponentDefinition,
  DataSourceRequirement,
  StaticParamRequirement,
  Setting,
  CustomConfig,
  DataFieldType,
  DataValidationRule
} from './index'

// ============ Validation result type ============

/**
 * Verification result interface
 */
export interface ValidationResult {
  /** Verification passed */
  valid: boolean
  /** Error message list */
  errors: string[]
  /** Warning message list */
  warnings: string[]
  /** Verified object type */
  objectType: string
}

// ============ Basic type validation ============

/**
 * Validate data field type
 * @param type Type to be verified
 * @returns Is it a valid data field type?
 */
export function isValidDataFieldType(type: any): type is DataFieldType {
  const validTypes: DataFieldType[] = ['value', 'object', 'array', 'string', 'number', 'boolean', 'date']
  return typeof type === 'string' && validTypes.includes(type as DataFieldType)
}

/**
 * Validate data validation rules
 * @param rule Rules to be verified
 * @returns Verification results
 */
export function validateDataValidationRule(rule: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    objectType: 'DataValidationRule'
  }

  if (rule && typeof rule === 'object') {
    // Check necessary fields
    const { min, max, pattern, enum: enumValues, customValidator } = rule

    // verifymin/max
    if (min !== undefined && typeof min !== 'number') {
      result.errors.push('min Field must be of numeric type')
    }
    if (max !== undefined && typeof max !== 'number') {
      result.errors.push('max Field must be of numeric type')
    }
    if (min !== undefined && max !== undefined && min > max) {
      result.errors.push('min value不能大于 max value')
    }

    // verifypattern
    if (pattern !== undefined) {
      if (typeof pattern !== 'string') {
        result.errors.push('pattern Field must be of type string')
      } else {
        try {
          new RegExp(pattern)
        } catch (e) {
          result.errors.push('pattern Must be a valid regular expression')
        }
      }
    }

    // verifyenum
    if (enumValues !== undefined && !Array.isArray(enumValues)) {
      result.errors.push('enum Field must be of array type')
    }

    // verifycustomValidator
    if (customValidator !== undefined && typeof customValidator !== 'string') {
      result.errors.push('customValidator Field must be of type string')
    }
  } else if (rule !== undefined) {
    result.errors.push('Validation rules must be of object type')
  }

  result.valid = result.errors.length === 0
  return result
}

// ============ Component type validation ============

/**
 * Verify data source requirements
 * @param requirement Data source requirement object
 * @returns Verification results
 */
export function validateDataSourceRequirement(requirement: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    objectType: 'DataSourceRequirement'
  }

  if (!requirement || typeof requirement !== 'object') {
    result.errors.push('Data source requirements must be of object type')
    result.valid = false
    return result
  }

  const { key, name, description, supportedTypes, fieldMappings, example } = requirement

  // Validate required fields
  if (!key || typeof key !== 'string') {
    result.errors.push('key Field is required and must be of type string')
  }
  if (!name || typeof name !== 'string') {
    result.errors.push('name Field is required and must be of type string')
  }
  if (!description || typeof description !== 'string') {
    result.errors.push('description Field is required and must be of type string')
  }

  // verifysupportedTypes
  if (!Array.isArray(supportedTypes)) {
    result.errors.push('supportedTypes Must be an array type')
  } else {
    const validTypes = ['static', 'api', 'websocket', 'mqtt', 'database', 'script']
    const invalidTypes = supportedTypes.filter(type => !validTypes.includes(type))
    if (invalidTypes.length > 0) {
      result.errors.push(`Invalid data source type: ${invalidTypes.join(', ')}`)
    }
  }

  // verifyfieldMappings
  if (fieldMappings !== undefined) {
    if (typeof fieldMappings !== 'object' || Array.isArray(fieldMappings)) {
      result.errors.push('fieldMappings Must be of object type')
    } else {
      Object.entries(fieldMappings).forEach(([key, mapping]: [string, any]) => {
        if (!mapping || typeof mapping !== 'object') {
          result.errors.push(`fieldMapping[${key}] Must be of object type`)
          return
        }

        const { targetField, type, required, defaultValue, validation } = mapping

        if (!targetField || typeof targetField !== 'string') {
          result.errors.push(`fieldMapping[${key}].targetField is required and must be a string`)
        }

        if (!isValidDataFieldType(type)) {
          result.errors.push(`fieldMapping[${key}].type Must be a valid data field type`)
        }

        if (typeof required !== 'boolean') {
          result.errors.push(`fieldMapping[${key}].required Must be of type boolean`)
        }

        if (validation !== undefined) {
          const validationResult = validateDataValidationRule(validation)
          if (!validationResult.valid) {
            result.errors.push(...validationResult.errors.map(err => `fieldMapping[${key}].validation: ${err}`))
          }
        }
      })
    }
  }

  // verifyexample
  if (example !== undefined && (typeof example !== 'object' || Array.isArray(example))) {
    result.warnings.push('example Field should be of object type，used to provide sample data')
  }

  result.valid = result.errors.length === 0
  return result
}

/**
 * Verify static parameter requirements
 * @param requirement Static parameter requirement object
 * @returns Verification results
 */
export function validateStaticParamRequirement(requirement: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    objectType: 'StaticParamRequirement'
  }

  if (!requirement || typeof requirement !== 'object') {
    result.errors.push('Static parameter requirements must be of object type')
    result.valid = false
    return result
  }

  const { key, name, type, description } = requirement

  // Validate required fields
  if (!key || typeof key !== 'string') {
    result.errors.push('key Field is required and must be of type string')
  }
  if (!name || typeof name !== 'string') {
    result.errors.push('name Field is required and must be of type string')
  }
  if (!type || !['string', 'number', 'boolean', 'object', 'array'].includes(type)) {
    result.errors.push('type Field must be a valid parameter type')
  }
  if (!description || typeof description !== 'string') {
    result.errors.push('description Field is required and must be of type string')
  }

  result.valid = result.errors.length === 0
  return result
}

/**
 * Verify settings configuration
 * @param setting settings object
 * @returns Verification results
 */
export function validateSetting(setting: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    objectType: 'Setting'
  }

  if (!setting || typeof setting !== 'object') {
    result.errors.push('The setting item must be of object type')
    result.valid = false
    return result
  }

  const { type, label, field } = setting

  // Validate required fields
  if (!type || typeof type !== 'string') {
    result.errors.push('type Field is required and must be of type string')
  }
  if (!label || typeof label !== 'string') {
    result.errors.push('label Field is required and must be of type string')
  }
  if (!field || typeof field !== 'string') {
    result.errors.push('field Field is required and must be of type string')
  }

  // Validation option fields
  if (setting.options !== undefined) {
    if (!Array.isArray(setting.options)) {
      result.errors.push('options Field must be of array type')
    } else {
      setting.options.forEach((option: any, index: number) => {
        if (!option || typeof option !== 'object') {
          result.errors.push(`options[${index}] Must be of object type`)
        } else if (!option.label || !option.hasOwnProperty('value')) {
          result.errors.push(`options[${index}] must contain label and value Field`)
        }
      })
    }
  }

  result.valid = result.errors.length === 0
  return result
}

/**
 * Verify component definition
 * @param definition component definition object
 * @returns Verification results
 */
export function validateComponentDefinition(definition: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    objectType: 'ComponentDefinition'
  }

  if (!definition || typeof definition !== 'object') {
    result.errors.push('Component definition must be of object type')
    result.valid = false
    return result
  }

  const { type, name, description, component, dataSources, staticParams } = definition

  // Validate required fields
  if (!type || typeof type !== 'string') {
    result.errors.push('type Field is required and must be of type string')
  } else if (!/^[a-z0-9-]+$/.test(type)) {
    result.warnings.push('type Fields are recommended to use kebab-case Naming convention')
  }

  if (!name || typeof name !== 'string') {
    result.errors.push('name Field is required and must be of type string')
  }

  if (!description || typeof description !== 'string') {
    result.errors.push('description Field is required and must be of type string')
  }

  if (!component) {
    result.errors.push('component Field is required，must beVuecomponents')
  }

  // Verify data source requirements
  if (dataSources !== undefined) {
    if (!Array.isArray(dataSources)) {
      result.errors.push('dataSources Field must be of array type')
    } else {
      dataSources.forEach((dataSource: any, index: number) => {
        const validationResult = validateDataSourceRequirement(dataSource)
        if (!validationResult.valid) {
          result.errors.push(...validationResult.errors.map(err => `dataSources[${index}]: ${err}`))
        }
        if (validationResult.warnings.length > 0) {
          result.warnings.push(...validationResult.warnings.map(warn => `dataSources[${index}]: ${warn}`))
        }
      })
    }
  }

  // Verify static parameter requirements
  if (staticParams !== undefined) {
    if (!Array.isArray(staticParams)) {
      result.errors.push('staticParams Field must be of array type')
    } else {
      staticParams.forEach((staticParam: any, index: number) => {
        const validationResult = validateStaticParamRequirement(staticParam)
        if (!validationResult.valid) {
          result.errors.push(...validationResult.errors.map(err => `staticParams[${index}]: ${err}`))
        }
        if (validationResult.warnings.length > 0) {
          result.warnings.push(...validationResult.warnings.map(warn => `staticParams[${index}]: ${warn}`))
        }
      })
    }
  }

  result.valid = result.errors.length === 0
  return result
}

// ============ Batch verification function ============

/**
 * Bulk verification component definition list
 * @param definitions component definition list
 * @returns Aggregated verification results
 */
export function validateComponentDefinitions(definitions: any[]): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    objectType: 'ComponentDefinition[]'
  }

  if (!Array.isArray(definitions)) {
    result.errors.push('The component definition list must be of array type')
    result.valid = false
    return result
  }

  const typeSet = new Set<string>()
  definitions.forEach((definition, index) => {
    const validationResult = validateComponentDefinition(definition)

    // Collect errors and warnings
    if (!validationResult.valid) {
      result.errors.push(`definition[${index}]: ${validationResult.errors.join(', ')}`)
    }
    if (validationResult.warnings.length > 0) {
      result.warnings.push(`definition[${index}]: ${validationResult.warnings.join(', ')}`)
    }

    // Check for type duplication
    if (definition && definition.type) {
      if (typeSet.has(definition.type)) {
        result.errors.push(`Duplicate component type: ${definition.type}`)
      } else {
        typeSet.add(definition.type)
      }
    }
  })

  result.valid = result.errors.length === 0
  return result
}

// ============ Type safety tools ============

/**
 * type assertion：Check if the object is a valid component definition
 * @param obj Object to be checked
 * @returns type guard
 */
export function isValidComponentDefinition(obj: any): obj is ComponentDefinition {
  const result = validateComponentDefinition(obj)
  return result.valid
}

/**
 * type assertion：Check whether the object is a valid data source requirement
 * @param obj Object to be checked
 * @returns type guard
 */
export function isValidDataSourceRequirement(obj: any): obj is DataSourceRequirement {
  const result = validateDataSourceRequirement(obj)
  return result.valid
}

/**
 * type assertion：Check whether the object is a valid setting item
 * @param obj Object to be checked
 * @returns type guard
 */
export function isValidSetting(obj: any): obj is Setting {
  const result = validateSetting(obj)
  return result.valid
}

/**
 * Validation warning in development mode
 * Output verification warning messages in the development environment
 */
export function devModeValidationWarning(result: ValidationResult, objectName: string = 'object'): void {
  if (!import.meta.env.DEV) return

  if (!result.valid) {
    console.error(`❌ [TypeValidation] ${objectName} validation failed:`, result.errors)
  }

  if (result.warnings.length > 0) {
    console.error(`⚠️ [TypeValidation] ${objectName} validation warnings:`, result.warnings)
  }
}
