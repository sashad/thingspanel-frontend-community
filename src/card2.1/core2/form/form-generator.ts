/**
 * form builder
 * Automatically generate configuration forms based on component definitions
 */

import type { ComponentDefinition, TSConfig, FormField, FormGroup } from '../types'
import { ConfigManager } from './config-manager'

/**
 * form builder class
 */
export class FormGenerator {
  /**
   * Generate form configuration based on component definition
   */
  static generateFormConfig(definition: ComponentDefinition): TSConfig {
    // If the component is already configured，Return directly
    if (definition.defaultConfig?.staticParams) {
      return this.generateFromStaticParams(definition)
    }

    // If the component has a property whitelist，Generate based on whitelist
    if (definition.propertyWhitelist) {
      return this.generateFromPropertyWhitelist(definition)
    }

    // Generate default configuration
    return this.generateDefaultConfig(definition)
  }

  /**
   * Generate form configuration based on static parameters
   */
  private static generateFromStaticParams(definition: ComponentDefinition): TSConfig {
    const staticParams = definition.defaultConfig?.staticParams || {}
    const fields: FormField[] = []

    Object.entries(staticParams).forEach(([key, value]) => {
      const field = this.inferFieldFromValue(key, value)
      if (field) {
        fields.push(field)
      }
    })

    return {
      title: `${definition.name} Configuration`,
      description: definition.description,
      fields,
      groups: this.generateDefaultGroups(fields)
    }
  }

  /**
   * Generate form configuration based on attribute whitelist
   */
  private static generateFromPropertyWhitelist(definition: ComponentDefinition): TSConfig {
    const whitelist = definition.propertyWhitelist || {}
    const fields: FormField[] = []

    Object.entries(whitelist).forEach(([propName, config]) => {
      const field: FormField = {
        type: this.mapPropertyTypeToFieldType(config.type),
        label: config.label,
        field: propName,
        group: config.group || 'Basic configuration',
        placeholder: config.description || '',
        defaultValue: config.defaultValue,
        required: config.required || false,
        options: config.options || [],
        description: config.description || '',
        hidden: config.hidden || false,
        disabled: config.disabled || false
      }
      fields.push(field)
    })

    return {
      title: `${definition.name} Configuration`,
      description: definition.description,
      fields,
      groups: this.generateDefaultGroups(fields)
    }
  }

  /**
   * Generate default configuration
   */
  private static generateDefaultConfig(definition: ComponentDefinition): TSConfig {
    return ConfigManager.generateDefaultTSConfig(definition.type)
  }

  /**
   * Infer field type from value
   */
  private static inferFieldFromValue(key: string, value: any): FormField | null {
    const field: FormField = {
      type: 'input',
      label: this.formatLabel(key),
      field: key,
      group: 'Basic configuration',
      defaultValue: value
    }

    // Infer field type based on value type
    if (typeof value === 'boolean') {
      field.type = 'switch'
    } else if (typeof value === 'number') {
      field.type = 'number'
    } else if (Array.isArray(value)) {
      field.type = 'select'
      field.options = value.map((item, index) => ({
        label: `Options ${index + 1}`,
        value: item
      }))
    } else if (typeof value === 'object' && value !== null) {
      field.type = 'json'
    }

    return field
  }

  /**
   * formatting tags
   */
  private static formatLabel(key: string): string {
    // Will camelCase Convert to Chinese label
    const labelMap: Record<string, string> = {
      deviceId: 'equipmentID',
      metricsList: 'Indicator list',
      name: 'name',
      description: 'describe',
      title: 'title',
      size: 'size',
      color: 'color',
      enabled: 'Enabled status'
    }

    return labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  }

  /**
   * Mapping attribute types to field types
   */
  private static mapPropertyTypeToFieldType(propertyType: string): string {
    const typeMap: Record<string, string> = {
      string: 'input',
      number: 'number',
      boolean: 'switch',
      array: 'select',
      object: 'json'
    }

    return typeMap[propertyType] || 'input'
  }

  /**
   * Generate default grouping
   */
  private static generateDefaultGroups(fields: FormField[]): FormGroup[] {
    const groups: Record<string, FormGroup> = {}

    fields.forEach(field => {
      const groupName = field.group || 'Basic configuration'
      if (!groups[groupName]) {
        groups[groupName] = {
          name: groupName.toLowerCase().replace(/\s+/g, '-'),
          label: groupName,
          description: `${groupName}Related configuration items`,
          fields: [],
          collapsible: true,
          defaultExpanded: true
        }
      }
      groups[groupName].fields.push(field.field)
    })

    return Object.values(groups)
  }

  /**
   * Validate form configuration
   */
  static validateFormConfig(config: TSConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.fields || !Array.isArray(config.fields)) {
      errors.push('The form configuration must contain fields array')
      return { valid: false, errors }
    }

    config.fields.forEach((field, index) => {
      if (!field.type) {
        errors.push(`Field ${index} Lack type property`)
      }
      if (!field.label) {
        errors.push(`Field ${index} Lack label property`)
      }
      if (!field.field) {
        errors.push(`Field ${index} Lack field property`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get form statistics
   */
  static getFormStats(config: TSConfig): {
    fieldCount: number
    groupCount: number
    requiredFieldCount: number
    fieldTypes: Record<string, number>
  } {
    const fieldCount = config.fields?.length || 0
    const groupCount = config.groups?.length || 0
    const requiredFieldCount = config.fields?.filter(field => field.required).length || 0

    const fieldTypes: Record<string, number> = {}
    config.fields?.forEach(field => {
      fieldTypes[field.type] = (fieldTypes[field.type] || 0) + 1
    })

    return {
      fieldCount,
      groupCount,
      requiredFieldCount,
      fieldTypes
    }
  }
}

/**
 * Global form builder instance
 */
export const formGenerator = FormGenerator

/**
 * Default export
 */
export default FormGenerator