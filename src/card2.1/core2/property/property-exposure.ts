/**
 * Card2.1 Property Exposure Manager
 * Simplified attribute whitelist management mechanism
 */

import type { ComponentPropertyWhitelist, PropertyExposureConfig, IPropertyExposureManager } from '../types'

/**
 * Property exposure manager class
 */
export class PropertyExposureManager implements IPropertyExposureManager {
  private propertyWhitelists = new Map<string, ComponentPropertyWhitelist>()

  /**
   * Register component attribute whitelist
   */
  registerPropertyWhitelist(componentType: string, whitelist: ComponentPropertyWhitelist | any): void {
    if (!componentType) {
      console.warn('❌ [PropertyExposureManager] Component type cannot be empty')
      return
    }

    // Compatible with nested structures of older systems { properties: {...}, enabled: true, ... }
    let normalizedWhitelist: ComponentPropertyWhitelist
    if (whitelist && typeof whitelist === 'object' && 'properties' in whitelist) {
      // old system format：extract properties Field
      normalizedWhitelist = whitelist.properties as ComponentPropertyWhitelist
    } else {
      // new system format：Use directly
      normalizedWhitelist = whitelist as ComponentPropertyWhitelist
    }

    // Add global basic properties
    const enhancedWhitelist = this.addGlobalBaseProperties(normalizedWhitelist)

    this.propertyWhitelists.set(componentType, enhancedWhitelist)
  }

  /**
   * Get component attribute whitelist
   */
  getPropertyWhitelist(componentType: string): ComponentPropertyWhitelist | undefined {
    return this.propertyWhitelists.get(componentType)
  }

  /**
   * Get all attribute whitelist
   */
  getAllPropertyWhitelists(): Record<string, ComponentPropertyWhitelist> {
    const result: Record<string, ComponentPropertyWhitelist> = {}
    this.propertyWhitelists.forEach((whitelist, componentType) => {
      result[componentType] = whitelist
    })
    return result
  }

  /**
   * Add global basic properties
   * Notice：no longer added automatically deviceId and metricsList
   * These two properties are represented by ComponentPropertySelector Handled as a mandatory required attribute
   */
  addGlobalBaseProperties(whitelist: ComponentPropertyWhitelist): ComponentPropertyWhitelist {
    // Normalize component-specific properties（Extra fields compatible with older systems）
    const normalizedWhitelist: ComponentPropertyWhitelist = {}
    for (const [propName, config] of Object.entries(whitelist)) {
      // Extract core fields，Ignore extra fields from old systems（like level, visibleInInteraction wait）
      normalizedWhitelist[propName] = {
        type: config.type || 'string',
        label: config.label || propName,
        description: config.description,
        required: config.required,
        defaultValue: config.defaultValue,
        options: config.options,
        group: config.group,
        order: config.order,
        hidden: config.hidden,
        disabled: config.disabled
      }
    }

    // Return only normalized properties，Do not add global basic properties
    return normalizedWhitelist
  }

  /**
   * Verify property configuration
   */
  validatePropertyConfig(config: PropertyExposureConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.type || !['string', 'number', 'boolean', 'array', 'object'].includes(config.type)) {
      errors.push('Property type must be a valid type')
    }

    if (!config.label || typeof config.label !== 'string') {
      errors.push('Property labels must be non-empty strings')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get attribute statistics
   */
  getStats() {
    const whitelists = this.getAllPropertyWhitelists()
    const totalComponents = Object.keys(whitelists).length
    const totalProperties = Object.values(whitelists).reduce(
      (sum, whitelist) => sum + Object.keys(whitelist).length,
      0
    )

    return {
      totalComponents,
      totalProperties,
      componentTypes: Object.keys(whitelists)
    }
  }

  /**
   * Clear all whitelists
   */
  clear(): void {
    this.propertyWhitelists.clear()
  }

  /**
   * Get the whitelist properties of a component（Backwards compatible with older systems）
   * Compatible with old systems getWhitelistedProperties method
   */
  getWhitelistedProperties(
    componentType: string,
    accessLevel?: string,
    context?: any
  ): Record<string, any> {
    const whitelist = this.propertyWhitelists.get(componentType)

    if (!whitelist) {
      return {}
    }

    // Convert new format to old format（Add to level and other fields to be compatible with old systems）
    const result: Record<string, any> = {}
    for (const [propName, config] of Object.entries(whitelist)) {
      result[propName] = {
        ...config,
        level: 'public', // New system simplifies access levels，Set uniformly to public
        readonly: false,
        visibleInInteraction: true,
        visibleInDebug: true
      }
    }

    return result
  }

  /**
   * Safely obtain exposed properties（Backwards compatible with older systems）
   * Compatible with old systems getExposedProperty method
   */
  getExposedProperty<T = any>(
    componentType: string,
    componentId: string,
    propertyName: string,
    currentValue: T,
    context?: any
  ): { allowed: boolean; value?: T; config?: any } {
    const whitelist = this.propertyWhitelists.get(componentType)

    if (!whitelist) {
      return {
        allowed: false,
        value: undefined
      }
    }

    const propertyConfig = whitelist[propertyName]
    if (!propertyConfig) {
      return {
        allowed: false,
        value: undefined
      }
    }

    // Property exists in whitelist，Allow access
    return {
      allowed: true,
      value: currentValue,
      config: {
        ...propertyConfig,
        level: 'public',
        readonly: false,
        visibleInInteraction: true,
        visibleInDebug: true
      }
    }
  }
}

/**
 * Global property exposure manager instance
 */
export const propertyExposureManager = new PropertyExposureManager()

/**
 * Default export
 */
export default propertyExposureManager