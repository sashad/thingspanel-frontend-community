/**
 * Data source binding configuration
 * Centrally manage dynamic parameter binding rules and trigger whitelists
 *
 * support：
 * 1. Automatic parameter binding rule configuration
 * 2. Attribute changes trigger whitelist management
 * 3. Custom binding rule extension
 * 4. Component specific binding configuration
 */

/**
 * Parameter binding rule interface
 */
export interface BindingRule {
  /** Property path，like 'base.deviceId' */
  propertyPath: string
  /** HTTPParameter name */
  paramName: string
  /** data conversion function（Optional） */
  transform?: (value: any) => any
  /** Are parameters required? */
  required?: boolean
  /** Parameter description */
  description?: string
}

/**
 * Trigger rule interface
 */
export interface TriggerRule {
  /** Property path */
  propertyPath: string
  /** Whether to enable */
  enabled: boolean
  /** Anti-shake time（millisecond），Use global configuration by default */
  debounceMs?: number
  /** Rule description */
  description?: string
}

/**
 * Component specific configuration interface
 */
export interface ComponentBindingConfig {
  /** Component type */
  componentType: string
  /** Additional binding rules */
  additionalBindings?: BindingRule[]
  /** Additional triggering rules */
  additionalTriggers?: TriggerRule[]
  /** Whether to enable automatic binding */
  autoBindEnabled?: boolean
}

/**
 * Automatic binding configuration interface
 * Used to simplify data source configuration，supplyautoBindOptions
 */
export interface AutoBindConfig {
  /** Whether to enable automatic binding */
  enabled: boolean
  /** binding mode */
  mode: 'strict' | 'loose' | 'custom'
  /** Custom binding rules */
  customRules?: BindingRule[]
  /** Excluded attribute list */
  excludeProperties?: string[]
  /** List of properties included（only instrictEffective in mode） */
  includeProperties?: string[]
}

/**
 * 🚀 Completely dynamic data source binding configuration class
 * Eliminate all hard coding，Support dynamic configuration of binding rules at runtime
 */
export class DataSourceBindingConfig {
  // 🔥 repair：Change to dynamically registered binding rules，No more hardcoding any fields
  private bindingRules: Map<string, BindingRule> = new Map()

  // 🔥 repair：Change to dynamic registration triggering rules，No more hardcoding any fields
  private triggerRules: Map<string, TriggerRule> = new Map()

  constructor() {
    // 🚀 Register default rules during initialization（but can be overwritten or deleted）
    this.initializeDefaultRules()
  }

  /**
   * 🚀 Initialize default rules - Can be modified dynamically
   * These are not hardcoded，Instead, the default recommendation is，Can be completely replaced
   */
  private initializeDefaultRules(): void {
    // Register default binding rules
    this.registerBindingRule({
      propertyPath: 'base.deviceId',
      paramName: 'deviceId',
      required: true,
      description: 'equipmentID - Default rules，Can be modified or deleted'
    })

    this.registerBindingRule({
      propertyPath: 'base.metricsList',
      paramName: 'metrics',
      transform: (value: any[]) => Array.isArray(value) ? value.join(',') : value,
      description: 'Indicator list - Default rules，Can be modified or deleted'
    })

    this.registerBindingRule({
      propertyPath: 'component.startTime',
      paramName: 'startTime',
      transform: (value: any) => value instanceof Date ? value.toISOString() : value,
      description: 'start time - Default rules，Can be modified or deleted'
    })

    this.registerBindingRule({
      propertyPath: 'component.endTime',
      paramName: 'endTime',
      transform: (value: any) => value instanceof Date ? value.toISOString() : value,
      description: 'end time - Default rules，Can be modified or deleted'
    })

    this.registerBindingRule({
      propertyPath: 'component.dataType',
      paramName: 'dataType',
      description: 'data type - Default rules，Can be modified or deleted'
    })

    this.registerBindingRule({
      propertyPath: 'component.refreshInterval',
      paramName: 'refreshInterval',
      transform: (value: any) => parseInt(value) || 30,
      description: 'refresh interval - Default rules，Can be modified or deleted'
    })

    this.registerBindingRule({
      propertyPath: 'component.filterCondition',
      paramName: 'filter',
      description: 'filter conditions - Default rules，Can be modified or deleted'
    })

    // Register default trigger rules
    this.registerTriggerRule({
      propertyPath: 'base.deviceId',
      enabled: true,
      debounceMs: 100,
      description: 'equipmentIDtrigger - Default rules，Can be modified or deleted'
    })

    this.registerTriggerRule({
      propertyPath: 'base.metricsList',
      enabled: true,
      debounceMs: 200,
      description: 'Indicator list trigger - Default rules，Can be modified or deleted'
    })

    this.registerTriggerRule({
      propertyPath: 'component.startTime',
      enabled: true,
      debounceMs: 300,
      description: 'start time trigger - Default rules，Can be modified or deleted'
    })

    this.registerTriggerRule({
      propertyPath: 'component.endTime',
      enabled: true,
      debounceMs: 300,
      description: 'end time trigger - Default rules，Can be modified or deleted'
    })

    this.registerTriggerRule({
      propertyPath: 'component.dataType',
      enabled: true,
      debounceMs: 150,
      description: 'Data type trigger - Default rules，Can be modified or deleted'
    })

    this.registerTriggerRule({
      propertyPath: 'component.refreshInterval',
      enabled: false,
      description: 'Refresh interval trigger - Default rules，Can be modified or deleted'
    })

    this.registerTriggerRule({
      propertyPath: 'component.filterCondition',
      enabled: true,
      debounceMs: 250,
      description: 'Filter condition triggers - Default rules，Can be modified or deleted'
    })
  }

  /**
   * 🚀 New：Dynamic registration binding rules
   */
  registerBindingRule(rule: BindingRule): void {
    this.bindingRules.set(rule.propertyPath, rule)
  }

  /**
   * 🚀 New：Dynamic registration triggering rules
   */
  registerTriggerRule(rule: TriggerRule): void {
    this.triggerRules.set(rule.propertyPath, rule)
  }

  /**
   * 🚀 New：Remove binding rule
   */
  removeBindingRule(propertyPath: string): boolean {
    const removed = this.bindingRules.delete(propertyPath)
    return removed
  }

  /**
   * 🚀 New：Remove trigger rule
   */
  removeTriggerRule(propertyPath: string): boolean {
    const removed = this.triggerRules.delete(propertyPath)
    return removed
  }

  /**
   * 🚀 New：Clear all rules（Fully customizable）
   */
  clearAllRules(): void {
    this.bindingRules.clear()
    this.triggerRules.clear()
  }

  // Component specific configuration
  private componentConfigs: Map<string, ComponentBindingConfig> = new Map()

  // User-defined rules
  private customBindingRules: BindingRule[] = []
  private customTriggerRules: TriggerRule[] = []

  /**
   * 🔥 repair：Get all valid binding rules（Fully dynamic）
   */
  getAllBindingRules(componentType?: string): BindingRule[] {
    // From dynamicMapGet all rules in
    const rules = Array.from(this.bindingRules.values())

    // Add user-defined rules（Stay backwards compatible）
    rules.push(...this.customBindingRules)

    // Add component-specific binding rules
    if (componentType) {
      const componentConfig = this.componentConfigs.get(componentType)
      if (componentConfig?.additionalBindings) {
        rules.push(...componentConfig.additionalBindings)
      }
    }

    return rules
  }

  /**
   * 🔥 repair：Get all valid trigger rules（Fully dynamic）
   */
  getAllTriggerRules(componentType?: string): TriggerRule[] {
    // From dynamicMapGet all rules in
    const rules = Array.from(this.triggerRules.values())

    // Add user-defined rules（Stay backwards compatible）
    rules.push(...this.customTriggerRules)

    // Add component-specific triggering rules
    if (componentType) {
      const componentConfig = this.componentConfigs.get(componentType)
      if (componentConfig?.additionalTriggers) {
        rules.push(...componentConfig.additionalTriggers)
      }
    }

    return rules.filter(rule => rule.enabled)
  }

  /**
   * Get binding rules based on attribute path
   */
  getBindingRule(propertyPath: string, componentType?: string): BindingRule | undefined {
    const allRules = this.getAllBindingRules(componentType)
    return allRules.find(rule => rule.propertyPath === propertyPath)
  }

  /**
   * Get trigger rules based on attribute path
   */
  getTriggerRule(propertyPath: string, componentType?: string): TriggerRule | undefined {
    const allRules = this.getAllTriggerRules(componentType)
    return allRules.find(rule => rule.propertyPath === propertyPath)
  }

  /**
   * Check if a property should trigger data source execution
   */
  shouldTriggerDataSource(propertyPath: string, componentType?: string): boolean {
    const triggerRule = this.getTriggerRule(propertyPath, componentType)
    return triggerRule?.enabled === true
  }

  /**
   * BuildHTTPparameter object
   */
  buildHttpParams(componentConfig: any, componentType?: string): Record<string, any> {
    const httpParams: Record<string, any> = {}
    const bindingRules = this.getAllBindingRules(componentType)

    for (const rule of bindingRules) {
      const [section, property] = rule.propertyPath.split('.')
      const sectionConfig = componentConfig[section]

      if (sectionConfig && sectionConfig[property] !== undefined) {
        let value = sectionConfig[property]

        // Apply data transformation functions
        if (rule.transform && typeof rule.transform === 'function') {
          try {
            value = rule.transform(value)
          } catch (error) {
            console.warn(`⚠️ [DataSourceBindingConfig] Parameter conversion failed:`, {
              propertyPath: rule.propertyPath,
              paramName: rule.paramName,
              originalValue: sectionConfig[property],
              error: error instanceof Error ? error.message : error
            })
            // Use original value if conversion fails
            value = sectionConfig[property]
          }
        }

        httpParams[rule.paramName] = value
      }
    }

    return httpParams
  }

  /**
   * 🚀 New：useautoBindConfigure automatic buildHTTPparameter
   * @param componentConfig Component configuration
   * @param autoBindConfig Automatic binding configuration
   * @param componentType Component type
   * @returns automatically boundHTTPparameter
   */
  buildAutoBindParams(
    componentConfig: any,
    autoBindConfig: AutoBindConfig,
    componentType?: string
  ): Record<string, any> {
    if (!autoBindConfig.enabled) {
      return this.buildHttpParams(componentConfig, componentType)
    }

    const httpParams: Record<string, any> = {}

    switch (autoBindConfig.mode) {
      case 'strict':
        // strict mode：Only bind specified properties
        return this.buildStrictModeParams(componentConfig, autoBindConfig, componentType)

      case 'loose':
        // Relaxed mode：Bind all available properties，Exclude specified attributes
        return this.buildLooseModeParams(componentConfig, autoBindConfig, componentType)

      case 'custom':
        // Custom mode：Use custom binding rules
        return this.buildCustomModeParams(componentConfig, autoBindConfig, componentType)

      default:
        return this.buildHttpParams(componentConfig, componentType)
    }
  }

  /**
   * Build strict mode parameters
   */
  private buildStrictModeParams(
    componentConfig: any,
    autoBindConfig: AutoBindConfig,
    componentType?: string
  ): Record<string, any> {
    const httpParams: Record<string, any> = {}
    const includeProperties = autoBindConfig.includeProperties || []

    // Only process specified attributes
    const bindingRules = this.getAllBindingRules(componentType)
      .filter(rule => includeProperties.includes(rule.propertyPath))

    for (const rule of bindingRules) {
      const [section, property] = rule.propertyPath.split('.')
      const sectionConfig = componentConfig[section]

      if (sectionConfig && sectionConfig[property] !== undefined) {
        let value = sectionConfig[property]

        if (rule.transform && typeof rule.transform === 'function') {
          try {
            value = rule.transform(value)
          } catch (error) {
            value = sectionConfig[property]
          }
        }

        httpParams[rule.paramName] = value
      }
    }

    return httpParams
  }

  /**
   * Build relaxed mode parameters
   */
  private buildLooseModeParams(
    componentConfig: any,
    autoBindConfig: AutoBindConfig,
    componentType?: string
  ): Record<string, any> {
    const httpParams: Record<string, any> = {}
    const excludeProperties = autoBindConfig.excludeProperties || []

    // Process all properties，Exclude specified attributes
    const bindingRules = this.getAllBindingRules(componentType)
      .filter(rule => !excludeProperties.includes(rule.propertyPath))

    for (const rule of bindingRules) {
      const [section, property] = rule.propertyPath.split('.')
      const sectionConfig = componentConfig[section]

      if (sectionConfig && sectionConfig[property] !== undefined) {
        let value = sectionConfig[property]

        if (rule.transform && typeof rule.transform === 'function') {
          try {
            value = rule.transform(value)
          } catch (error) {
            value = sectionConfig[property]
          }
        }

        httpParams[rule.paramName] = value
      }
    }

    return httpParams
  }

  /**
   * Build custom pattern parameters
   */
  private buildCustomModeParams(
    componentConfig: any,
    autoBindConfig: AutoBindConfig,
    componentType?: string
  ): Record<string, any> {
    const httpParams: Record<string, any> = {}
    const customRules = autoBindConfig.customRules || []

    // Use custom binding rules
    for (const rule of customRules) {
      const [section, property] = rule.propertyPath.split('.')
      const sectionConfig = componentConfig[section]

      if (sectionConfig && sectionConfig[property] !== undefined) {
        let value = sectionConfig[property]

        if (rule.transform && typeof rule.transform === 'function') {
          try {
            value = rule.transform(value)
          } catch (error) {
            value = sectionConfig[property]
          }
        }

        httpParams[rule.paramName] = value
      }
    }

    return httpParams
  }

  /**
   * Add custom binding rules
   */
  addCustomBindingRule(rule: BindingRule): void {
    // Check if the same property path already exists
    const existingIndex = this.customBindingRules.findIndex(r => r.propertyPath === rule.propertyPath)
    if (existingIndex >= 0) {
      this.customBindingRules[existingIndex] = rule
    } else {
      this.customBindingRules.push(rule)
    }

  }

  /**
   * Add custom trigger rules
   */
  addCustomTriggerRule(rule: TriggerRule): void {
    // Check if the same property path already exists
    const existingIndex = this.customTriggerRules.findIndex(r => r.propertyPath === rule.propertyPath)
    if (existingIndex >= 0) {
      this.customTriggerRules[existingIndex] = rule
    } else {
      this.customTriggerRules.push(rule)
    }

  }

  /**
   * Set component specific configuration
   */
  setComponentConfig(componentType: string, config: ComponentBindingConfig): void {
    this.componentConfigs.set(componentType, config)

  }

  /**
   * Get component specific configuration
   */
  getComponentConfig(componentType: string): ComponentBindingConfig | undefined {
    return this.componentConfigs.get(componentType)
  }

  /**
   * Remove custom rules
   */
  removeCustomBindingRule(propertyPath: string): boolean {
    const index = this.customBindingRules.findIndex(r => r.propertyPath === propertyPath)
    if (index >= 0) {
      this.customBindingRules.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Remove custom trigger rules
   */
  removeCustomTriggerRule(propertyPath: string): boolean {
    const index = this.customTriggerRules.findIndex(r => r.propertyPath === propertyPath)
    if (index >= 0) {
      this.customTriggerRules.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Get debugging information
   */
  getDebugInfo(componentType?: string): any {
    return {
      baseBindingRules: this.baseBindingRules.length,
      baseTriggerRules: this.baseTriggerRules.length,
      customBindingRules: this.customBindingRules.length,
      customTriggerRules: this.customTriggerRules.length,
      componentConfigs: Array.from(this.componentConfigs.keys()),
      currentBindingRules: this.getAllBindingRules(componentType).map(r => ({
        propertyPath: r.propertyPath,
        paramName: r.paramName,
        required: r.required
      })),
      currentTriggerRules: this.getAllTriggerRules(componentType).map(r => ({
        propertyPath: r.propertyPath,
        enabled: r.enabled,
        debounceMs: r.debounceMs
      }))
    }
  }
}

// Create a global configuration instance
export const dataSourceBindingConfig = new DataSourceBindingConfig()

// global exposure，for debugging
if (typeof globalThis !== 'undefined') {
  (globalThis as any).__dataSourceBindingConfig = dataSourceBindingConfig
}
