/**
 * Whitelist management tool
 * Provides verification of attribute whitelists、Filter and transform functions
 */

import type { ComponentPropertyWhitelist, PropertyExposureConfig } from '../types'

/**
 * Whitelist manager class
 */
export class WhitelistManager {
  /**
   * Filter invalid property configurations
   */
  static filterInvalidProperties(whitelist: ComponentPropertyWhitelist): ComponentPropertyWhitelist {
    const filtered: ComponentPropertyWhitelist = {}

    Object.entries(whitelist).forEach(([propName, config]) => {
      if (this.isValidPropertyConfig(config)) {
        filtered[propName] = config
      } else {
        console.warn(`⚠️ [WhitelistManager] Filter invalid attribute configurations: ${propName}`)
      }
    })

    return filtered
  }

  /**
   * Verify that the attribute configuration is valid
   */
  static isValidPropertyConfig(config: PropertyExposureConfig): boolean {
    if (!config) return false
    if (!config.type || !['string', 'number', 'boolean', 'array', 'object'].includes(config.type)) return false
    if (!config.label || typeof config.label !== 'string') return false
    return true
  }

  /**
   * Standardized attribute configuration
   */
  static normalizePropertyConfig(config: Partial<PropertyExposureConfig>): PropertyExposureConfig {
    return {
      type: config.type || 'string',
      label: config.label || 'unnamed property',
      description: config.description || '',
      required: config.required || false,
      defaultValue: config.defaultValue,
      options: config.options || [],
      group: config.group || 'Basic configuration',
      order: config.order || 0,
      hidden: config.hidden || false,
      disabled: config.disabled || false
    }
  }

  /**
   * Organize properties into groups
   */
  static groupProperties(whitelist: ComponentPropertyWhitelist): Record<string, ComponentPropertyWhitelist> {
    const groups: Record<string, ComponentPropertyWhitelist> = {}

    Object.entries(whitelist).forEach(([propName, config]) => {
      const group = config.group || 'Basic configuration'
      if (!groups[group]) {
        groups[group] = {}
      }
      groups[group][propName] = config
    })

    return groups
  }

  /**
   * Get a list of properties in sorted order
   */
  static getSortedProperties(whitelist: ComponentPropertyWhitelist): Array<{ name: string; config: PropertyExposureConfig }> {
    return Object.entries(whitelist)
      .map(([name, config]) => ({ name, config }))
      .sort((a, b) => (a.config.order || 0) - (b.config.order || 0))
  }

  /**
   * Get visible properties（Filter hidden properties）
   */
  static getVisibleProperties(whitelist: ComponentPropertyWhitelist): ComponentPropertyWhitelist {
    const visible: ComponentPropertyWhitelist = {}

    Object.entries(whitelist).forEach(([propName, config]) => {
      if (!config.hidden) {
        visible[propName] = config
      }
    })

    return visible
  }

  /**
   * Get required attributes
   */
  static getRequiredProperties(whitelist: ComponentPropertyWhitelist): ComponentPropertyWhitelist {
    const required: ComponentPropertyWhitelist = {}

    Object.entries(whitelist).forEach(([propName, config]) => {
      if (config.required) {
        required[propName] = config
      }
    })

    return required
  }

  /**
   * Verify that attribute values ​​match configuration
   */
  static validatePropertyValue(config: PropertyExposureConfig, value: any): { isValid: boolean; error?: string } {
    if (config.required && (value === null || value === undefined || value === '')) {
      return { isValid: false, error: `${config.label} is required` }
    }

    // Type verification
    if (value !== null && value !== undefined) {
      switch (config.type) {
        case 'string':
          if (typeof value !== 'string') {
            return { isValid: false, error: `${config.label} Must be of type string` }
          }
          break
        case 'number':
          if (typeof value !== 'number') {
            return { isValid: false, error: `${config.label} Must be of numeric type` }
          }
          break
        case 'boolean':
          if (typeof value !== 'boolean') {
            return { isValid: false, error: `${config.label} Must be of type boolean` }
          }
          break
        case 'array':
          if (!Array.isArray(value)) {
            return { isValid: false, error: `${config.label} Must be an array type` }
          }
          break
        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            return { isValid: false, error: `${config.label} Must be of object type` }
          }
          break
      }
    }

    // Option validation
    if (config.options && config.options.length > 0 && value !== null && value !== undefined) {
      const validValues = config.options.map(option => option.value)
      if (!validValues.includes(value)) {
        return { isValid: false, error: `${config.label} Must be a valid option` }
      }
    }

    return { isValid: true }
  }

  /**
   * Convert attribute value to appropriate type
   */
  static convertPropertyValue(config: PropertyExposureConfig, value: any): any {
    if (value === null || value === undefined) {
      return config.defaultValue
    }

    try {
      switch (config.type) {
        case 'string':
          return String(value)
        case 'number':
          return Number(value)
        case 'boolean':
          return Boolean(value)
        case 'array':
          return Array.isArray(value) ? value : [value]
        case 'object':
          return typeof value === 'object' ? value : { value }
        default:
          return value
      }
    } catch (error) {
      console.warn(`⚠️ [WhitelistManager] Attribute value conversion failed:`, { propName: config.label, value, error })
      return config.defaultValue
    }
  }
}

/**
 * Default export
 */
export default WhitelistManager
/**
 * Create attribute whitelist - Convenience function
 * @param properties Property configuration object
 * @returns Standardized attribute whitelist
 */
export function createPropertyWhitelist(
  properties: Record<string, Partial<PropertyExposureConfig>>
): ComponentPropertyWhitelist {
  const whitelist: ComponentPropertyWhitelist = {}

  Object.entries(properties).forEach(([propName, config]) => {
    whitelist[propName] = WhitelistManager.normalizePropertyConfig(config)
  })

  return WhitelistManager.filterInvalidProperties(whitelist)
}
