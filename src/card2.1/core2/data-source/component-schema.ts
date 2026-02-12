/**
 * Component Data Schema Manager
 * Data field definitions for management components、Validation rules and default values
 * Used for data checksum conversion in data binding systems
 */

import type { ComponentDefinition, DataFieldType, DataValidationRule } from '../types'
import { ComponentRegistry } from '../registry/component-registry'

/**
 * Component field definition interface
 */
export interface ComponentFieldSchema {
  /** Field name */
  name: string
  /** Field type */
  type: DataFieldType
  /** Field description */
  description?: string
  /** Is it necessary */
  required?: boolean
  /** default value */
  defaultValue?: any
  /** Validation rules */
  validation?: DataValidationRule
  /** Field alias（Mapping for data binding） */
  alias?: string[]
}

/**
 * Component Data Schema Interface
 */
export interface ComponentSchema {
  /** Component type */
  componentType: string
  /** Field definition mapping */
  fields: Record<string, ComponentFieldSchema>
  /** Schema version */
  version?: string
  /** creation time */
  createdAt?: Date
  /** Update time */
  updatedAt?: Date
}

/**
 * Data verification result interface
 */
export interface ValidationResult {
  /** Is it valid? */
  valid: boolean
  /** Validation error message */
  errors: Array<{
    field: string
    message: string
    value?: any
  }>
  /** processed data */
  processedData?: Record<string, any>
}

/**
 * Component Data Schema Manager Class
 */
export class ComponentSchemaManager {
  /** Component mode caching */
  private schemas = new Map<string, ComponentSchema>()

  /** Default field definition（Basic common fields） */
  private readonly defaultFields: Record<string, ComponentFieldSchema> = {
    // Numeric indicator common fields
    value: {
      name: 'value',
      type: 'string',
      description: 'Main values',
      required: false,
      defaultValue: '0',
      alias: ['val', 'number', 'data']
    },
    unit: {
      name: 'unit',
      type: 'string',
      description: 'numerical unit',
      required: false,
      defaultValue: '',
      alias: ['units', 'measure']
    },
    metricsName: {
      name: 'metricsName',
      type: 'string',
      description: 'Indicator name',
      required: false,
      defaultValue: 'index',
      alias: ['metricName', 'name', 'title']
    },
    // Common component fields
    title: {
      name: 'title',
      type: 'string',
      description: 'title',
      required: false,
      defaultValue: '',
      alias: ['name', 'label']
    },
    description: {
      name: 'description',
      type: 'string',
      description: 'describe',
      required: false,
      defaultValue: '',
      alias: ['desc', 'detail']
    },
    amount: {
      name: 'amount',
      type: 'string',
      description: 'quantity or amount',
      required: false,
      defaultValue: '0',
      alias: ['count', 'quantity']
    },
    // Status and control fields
    status: {
      name: 'status',
      type: 'string',
      description: 'state',
      required: false,
      defaultValue: 'normal',
      alias: ['state', 'condition']
    },
    color: {
      name: 'color',
      type: 'string',
      description: 'color',
      required: false,
      defaultValue: '#1890ff',
      alias: ['backgroundColor', 'bgColor']
    },
    iconName: {
      name: 'iconName',
      type: 'string',
      description: 'Icon name',
      required: false,
      defaultValue: 'default',
      alias: ['icon', 'iconType']
    }
  }

  /**
   * Register or update component data schema
   * @param componentType Component type
   * @param schema Component pattern definition
   */
  registerSchema(componentType: string, schema: ComponentSchema): void {

    // Merge default fields and custom fields
    const mergedFields = {
      ...this.defaultFields,
      ...schema.fields
    }

    const finalSchema: ComponentSchema = {
      ...schema,
      componentType,
      fields: mergedFields,
      updatedAt: new Date()
    }

    this.schemas.set(componentType, finalSchema)

  }

  /**
   * Automatically generate data schema from component definition
   * @param definition Component definition
   */
  generateSchemaFromDefinition(definition: ComponentDefinition): ComponentSchema {
    const fields: Record<string, ComponentFieldSchema> = { ...this.defaultFields }

    // If there is a data source requirement in the component definition，Add corresponding fields
    if (definition.dataSources && Array.isArray(definition.dataSources)) {
      definition.dataSources.forEach(dataSource => {
        if (dataSource.example) {
          // Infer field types from sample data
          Object.keys(dataSource.example).forEach(key => {
            if (!fields[key]) {
              const value = dataSource.example![key]
              const type = this.inferFieldType(value)

              fields[key] = {
                name: key,
                type,
                description: `from data source ${dataSource.name} fields`,
                required: false,
                defaultValue: this.getDefaultValueForType(type)
              }
            }
          })
        }
      })
    }

    const schema: ComponentSchema = {
      componentType: definition.type,
      fields,
      version: definition.version || '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Automatically register generated schema
    this.registerSchema(definition.type, schema)

    return schema
  }

  /**
   * Get component data schema
   * @param componentType Component type
   * @returns component pattern or undefined
   */
  getSchema(componentType: string): ComponentSchema | undefined {
    let schema = this.schemas.get(componentType)

    // if pattern not found，Try to generate from component registry
    if (!schema) {
      const definition = ComponentRegistry.get(componentType)
      if (definition) {
        schema = this.generateSchemaFromDefinition(definition)
      } else {
        console.warn(`⚠️ [ComponentSchemaManager] Component definition not found: ${componentType}`)
        // Return to basic default mode
        schema = {
          componentType,
          fields: { ...this.defaultFields },
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        this.registerSchema(componentType, schema)
      }
    }

    return schema
  }

  /**
   * Validate component data
   * @param componentType Component type
   * @param data Data to verify
   * @returns Verification results
   */
  validateComponentData(componentType: string, data: Record<string, any>): ValidationResult {
    const schema = this.getSchema(componentType)
    if (!schema) {
      return {
        valid: false,
        errors: [{ field: 'schema', message: `Component not found ${componentType} data pattern` }]
      }
    }

    const errors: Array<{ field: string; message: string; value?: any }> = []
    const processedData: Record<string, any> = {}

    // Validate each field
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
      const value = data[fieldName]

      // Check required fields
      if (fieldSchema.required && (value === undefined || value === null)) {
        errors.push({
          field: fieldName,
          message: `Field ${fieldName} is required`,
          value
        })
        continue
      }

      // Use default or provided value
      let finalValue = value !== undefined ? value : fieldSchema.defaultValue

      // Type conversion and validation
      if (finalValue !== undefined) {
        try {
          finalValue = this.convertValueToType(finalValue, fieldSchema.type)

          // Apply validation rules
          if (fieldSchema.validation) {
            const validationError = this.validateField(fieldName, finalValue, fieldSchema.validation)
            if (validationError) {
              errors.push(validationError)
              continue
            }
          }

          processedData[fieldName] = finalValue
        } catch (error) {
          errors.push({
            field: fieldName,
            message: `Field ${fieldName} Type conversion failed: ${error}`,
            value: finalValue
          })
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      processedData: errors.length === 0 ? processedData : undefined
    }
  }

  /**
   * Get all registered component modes
   * @returns component pattern array
   */
  getAllSchemas(): ComponentSchema[] {
    return Array.from(this.schemas.values())
  }

  /**
   * Clear the mode of the specified component
   * @param componentType Component type
   */
  clearSchema(componentType: string): void {
    this.schemas.delete(componentType)
  }

  /**
   * Clear all component modes
   */
  clearAllSchemas(): void {
    const count = this.schemas.size
    this.schemas.clear()
  }

  // ==================== private method ====================

  /**
   * Infer field type
   * @param value field value
   * @returns Inferred field type
   */
  private inferFieldType(value: any): DataFieldType {
    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (Array.isArray(value)) return 'array'
    if (value instanceof Date) return 'date'
    if (typeof value === 'object' && value !== null) return 'object'
    return 'value' // Default type
  }

  /**
   * Get the default value of a type
   * @param type Field type
   * @returns default value
   */
  private getDefaultValueForType(type: DataFieldType): any {
    switch (type) {
      case 'string': return ''
      case 'number': return 0
      case 'boolean': return false
      case 'array': return []
      case 'object': return {}
      case 'date': return new Date()
      case 'value':
      default: return null
    }
  }

  /**
   * Convert a value to a specified type
   * @param value original value
   * @param type target type
   * @returns converted value
   */
  private convertValueToType(value: any, type: DataFieldType): any {
    if (value === null || value === undefined) {
      return this.getDefaultValueForType(type)
    }

    switch (type) {
      case 'string':
        return String(value)
      case 'number':
        const num = Number(value)
        if (isNaN(num)) throw new Error(`Cannot convert to number: ${value}`)
        return num
      case 'boolean':
        if (typeof value === 'boolean') return value
        if (typeof value === 'string') {
          const lower = value.toLowerCase()
          if (lower === 'true' || lower === '1') return true
          if (lower === 'false' || lower === '0') return false
        }
        return Boolean(value)
      case 'array':
        if (Array.isArray(value)) return value
        try {
          return JSON.parse(String(value))
        } catch {
          return [value]
        }
      case 'object':
        if (typeof value === 'object' && value !== null) return value
        try {
          return JSON.parse(String(value))
        } catch {
          return { value }
        }
      case 'date':
        if (value instanceof Date) return value
        const date = new Date(value)
        if (isNaN(date.getTime())) throw new Error(`Cannot convert to date: ${value}`)
        return date
      case 'value':
      default:
        return value
    }
  }

  /**
   * Validate field value
   * @param fieldName Field name
   * @param value field value
   * @param validation Validation rules
   * @returns Validation error or null
   */
  private validateField(
    fieldName: string,
    value: any,
    validation: DataValidationRule
  ): { field: string; message: string; value?: any } | null {
    // minimum value/length check
    if (validation.min !== undefined) {
      const length = typeof value === 'string' || Array.isArray(value) ? value.length : value
      if (length < validation.min) {
        return {
          field: fieldName,
          message: `Field ${fieldName} The value is less than the minimum requirement ${validation.min}`,
          value
        }
      }
    }

    // maximum value/length check
    if (validation.max !== undefined) {
      const length = typeof value === 'string' || Array.isArray(value) ? value.length : value
      if (length > validation.max) {
        return {
          field: fieldName,
          message: `Field ${fieldName} The value exceeds the maximum limit ${validation.max}`,
          value
        }
      }
    }

    // Regular expression check
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(value)) {
        return {
          field: fieldName,
          message: `Field ${fieldName} The value does not meet the format requirements`,
          value
        }
      }
    }

    // Enumeration value checking
    if (validation.enum && !validation.enum.includes(value)) {
      return {
        field: fieldName,
        message: `Field ${fieldName} The value for is not among the allowed options: ${validation.enum.join(', ')}`,
        value
      }
    }

    return null
  }
}

/**
 * Default component data schema manager instance
 */
export const componentSchemaManager = new ComponentSchemaManager()

/**
 * Create a custom component data schema manager
 * @returns New component data schema manager instance
 */
export function createComponentSchemaManager(): ComponentSchemaManager {
  return new ComponentSchemaManager()
}

// Default export
export default componentSchemaManager
