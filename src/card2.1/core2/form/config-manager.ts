/**
 * configuration manager
 * Simplified configuration mode detection and management capabilities
 */

import type { Component } from 'vue'
import type { TSConfig, ConfigMode, FormField, FormGroup } from '../types'

/**
 * Configuration manager class
 */
export class ConfigManager {
  /**
   * Detect configuration mode
   */
  static detectConfigMode(vueConfig?: Component, tsConfig?: TSConfig): ConfigMode {
    const hasVueConfig = !!vueConfig
    const hasTSConfig = !!(tsConfig?.fields && tsConfig.fields.length > 0)

    if (hasVueConfig && hasTSConfig) {
      return 'hybrid'
    } else if (hasVueConfig) {
      return 'vue-component'
    } else if (hasTSConfig) {
      return 'standard'
    } else {
      return 'standard' // Default mode
    }
  }

  /**
   * verify TS Configuration
   */
  static validateTSConfig(tsConfig?: TSConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!tsConfig) {
      return { valid: true, errors: [] } // Optional configuration
    }

    if (!tsConfig.fields) {
      errors.push('TSConfig must contain fields property')
    } else if (!Array.isArray(tsConfig.fields)) {
      errors.push('TSConfig.fields Must be an array')
    } else {
      // Validate field configuration
      tsConfig.fields.forEach((field, index) => {
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
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * verify Vue Configuration
   */
  static validateVueConfig(vueConfig?: Component): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!vueConfig) {
      return { valid: true, errors: [] } // Optional configuration
    }

    if (typeof vueConfig !== 'object' && typeof vueConfig !== 'function') {
      errors.push('VueConfig must be valid Vue components')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Merge configuration verification results
   */
  static validateConfigs(tsConfig?: TSConfig, vueConfig?: Component): { valid: boolean; errors: string[] } {
    const tsValidation = this.validateTSConfig(tsConfig)
    const vueValidation = this.validateVueConfig(vueConfig)

    return {
      valid: tsValidation.valid && vueValidation.valid,
      errors: [...tsValidation.errors, ...vueValidation.errors]
    }
  }

  /**
   * Get configuration mode description
   */
  static getModeDescription(mode: ConfigMode): string {
    switch (mode) {
      case 'standard':
        return 'Standard configuration mode：use TypeScript Configuration definition form'
      case 'vue-component':
        return 'Vue Component pattern：Use custom Vue Component rendering configuration interface'
      case 'hybrid':
        return 'blend mode：Use at the same time TypeScript configuration and Vue components'
      default:
        return 'Unknown configuration mode'
    }
  }

  /**
   * Check if the configuration is empty
   */
  static isEmptyConfig(tsConfig?: TSConfig, vueConfig?: Component): boolean {
    const hasFields = tsConfig?.fields && tsConfig.fields.length > 0
    const hasVueComponent = !!vueConfig

    return !hasFields && !hasVueComponent
  }

  /**
   * generate default TS Configuration
   */
  static generateDefaultTSConfig(componentType: string): TSConfig {
    return {
      title: `${componentType} Configuration`,
      description: `${componentType} Basic configuration items of components`,
      fields: [
        {
          type: 'input',
          label: 'Component name',
          field: 'name',
          group: 'Basic settings',
          placeholder: 'Please enter the component name',
          defaultValue: componentType,
          required: true
        },
        {
          type: 'textarea',
          label: 'Component description',
          field: 'description',
          group: 'Basic settings',
          placeholder: 'Please enter a component description'
        }
      ],
      groups: [
        {
          name: 'basic',
          label: 'Basic settings',
          description: 'Basic configuration items of components',
          fields: ['name', 'description'],
          collapsible: false,
          defaultExpanded: true
        }
      ]
    }
  }

  /**
   * Standardized form fields
   */
  static normalizeFormField(field: Partial<FormField>): FormField {
    return {
      type: field.type || 'input',
      label: field.label || 'unnamed field',
      field: field.field || '',
      group: field.group || 'Basic settings',
      placeholder: field.placeholder || '',
      defaultValue: field.defaultValue,
      required: field.required || false,
      options: field.options || [],
      description: field.description || '',
      hidden: field.hidden || false,
      disabled: field.disabled || false
    }
  }

  /**
   * Standardized form grouping
   */
  static normalizeFormGroup(group: Partial<FormGroup>): FormGroup {
    return {
      name: group.name || 'default',
      label: group.label || 'Default grouping',
      description: group.description || '',
      fields: group.fields || [],
      collapsible: group.collapsible !== undefined ? group.collapsible : true,
      defaultExpanded: group.defaultExpanded !== undefined ? group.defaultExpanded : true
    }
  }
}

/**
 * Default export
 */
export default ConfigManager