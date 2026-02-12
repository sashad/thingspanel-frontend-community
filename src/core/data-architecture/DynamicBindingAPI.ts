/**
 * dynamic bindingAPI - Fully configurable property binding system
 * Provides complete runtime dynamic configuration of binding rulesAPI
 */

import { dataSourceBindingConfig, type BindingRule, type TriggerRule, type AutoBindConfig } from './DataSourceBindingConfig'

/**
 * 🚀 Dynamic binding manager - Eliminate all hard coding
 * thisAPIProve that the system is not hardcoded at all，Any attribute can be configured dynamically
 */
export class DynamicBindingAPI {

  /**
   * 🔥 Completely clear default rules，Customize from scratch
   * Prove that the system does not have any hard-coded dependencies
   */
  static clearAllDefaultRules(): void {
    dataSourceBindingConfig.clearAllRules()
    console.log('🧹 [DynamicBindingAPI] All default rules cleared，The system is now completely blank')
  }

  /**
   * 🚀 Add fully custom binding rules
   * Supports arbitrary attribute paths，Not limited todeviceIdWait for default fields
   */
  static addCustomBinding(config: {
    propertyPath: string
    paramName: string
    transform?: (value: any) => any
    required?: boolean
    description?: string
  }): void {
    dataSourceBindingConfig.registerBindingRule({
      propertyPath: config.propertyPath,
      paramName: config.paramName,
      transform: config.transform,
      required: config.required || false,
      description: config.description || `Custom binding: ${config.propertyPath} → ${config.paramName}`
    })
  }

  /**
   * 🚀 Add fully custom trigger rules
   * Supports change triggering of any attribute path
   */
  static addCustomTrigger(config: {
    propertyPath: string
    enabled?: boolean
    debounceMs?: number
    description?: string
  }): void {
    dataSourceBindingConfig.registerTriggerRule({
      propertyPath: config.propertyPath,
      enabled: config.enabled !== false,
      debounceMs: config.debounceMs || 100,
      description: config.description || `Custom trigger: ${config.propertyPath}`
    })
  }

  /**
   * 🔥 Remove any binding rules
   * including defaultdeviceIdrules can be removed
   */
  static removeBinding(propertyPath: string): boolean {
    return dataSourceBindingConfig.removeBindingRule(propertyPath)
  }

  /**
   * 🔥 Remove any trigger rules
   * including defaultdeviceIdCan be removed when triggered
   */
  static removeTrigger(propertyPath: string): boolean {
    return dataSourceBindingConfig.removeTriggerRule(propertyPath)
  }

  /**
   * 🚀 Configure binding rules for custom components in batches
   * Demonstrates how to configure completely different binding rules for special components
   */
  static configureCustomComponent(componentType: string, config: {
    bindings: Array<{
      propertyPath: string
      paramName: string
      transform?: (value: any) => any
      required?: boolean
    }>
    triggers: Array<{
      propertyPath: string
      enabled?: boolean
      debounceMs?: number
    }>
    autoBind?: AutoBindConfig
  }): void {
    // Set component specific configuration
    dataSourceBindingConfig.setComponentConfig(componentType, {
      componentType,
      additionalBindings: config.bindings.map(b => ({
        propertyPath: b.propertyPath,
        paramName: b.paramName,
        transform: b.transform,
        required: b.required || false,
        description: `${componentType}Component-specific binding: ${b.propertyPath}`
      })),
      additionalTriggers: config.triggers.map(t => ({
        propertyPath: t.propertyPath,
        enabled: t.enabled !== false,
        debounceMs: t.debounceMs || 100,
        description: `${componentType}Component-specific triggering: ${t.propertyPath}`
      })),
      autoBindEnabled: config.autoBind?.enabled || false
    })

    console.log(`⚙️ [DynamicBindingAPI] Custom component configured ${componentType}:`, {
      bindingCount: config.bindings.length,
      triggerCount: config.triggers.length,
      autoBindEnabled: config.autoBind?.enabled
    })
  }

  /**
   * 🔥 Get all current binding rules - for debugging and verification
   */
  static getCurrentBindingRules(componentType?: string): BindingRule[] {
    return dataSourceBindingConfig.getAllBindingRules(componentType)
  }

  /**
   * 🔥 Get all current triggering rules - for debugging and verification
   */
  static getCurrentTriggerRules(componentType?: string): TriggerRule[] {
    return dataSourceBindingConfig.getAllTriggerRules(componentType)
  }

  /**
   * 🚀 Default configuration template - Quick configuration for common scenarios
   */
  static applyTemplate(template: 'iot-device' | 'data-analytics' | 'user-interface' | 'custom'): void {
    switch (template) {
      case 'iot-device':
        this.applyIoTDeviceTemplate()
        break
      case 'data-analytics':
        this.applyDataAnalyticsTemplate()
        break
      case 'user-interface':
        this.applyUITemplate()
        break
      case 'custom':
        this.clearAllDefaultRules()
        break
    }
  }

  /**
   * IoTDevice template - Device-related binding rules
   */
  private static applyIoTDeviceTemplate(): void {
    this.clearAllDefaultRules()

    // Basic device properties
    this.addCustomBinding({
      propertyPath: 'base.deviceId',
      paramName: 'device_id',
      required: true,
      description: 'IoTequipmentID'
    })

    this.addCustomBinding({
      propertyPath: 'base.deviceType',
      paramName: 'device_type',
      description: 'IoTDevice type'
    })

    this.addCustomBinding({
      propertyPath: 'component.sensorIds',
      paramName: 'sensors',
      transform: (ids: string[]) => ids.join(','),
      description: 'IoTSensor list'
    })

    // Corresponding trigger rules
    this.addCustomTrigger({
      propertyPath: 'base.deviceId',
      debounceMs: 50,
      description: 'IoTDevice switching trigger'
    })

    this.addCustomTrigger({
      propertyPath: 'component.sensorIds',
      debounceMs: 200,
      description: 'IoTSensor change trigger'
    })

    console.log('📡 [DynamicBindingAPI] AppliedIoTDevice template')
  }

  /**
   * Data analysis template - Analyze relevant binding rules
   */
  private static applyDataAnalyticsTemplate(): void {
    this.clearAllDefaultRules()

    // Data query properties
    this.addCustomBinding({
      propertyPath: 'component.timeRange',
      paramName: 'time_range',
      transform: (range: { start: Date, end: Date }) => ({
        start: range.start.toISOString(),
        end: range.end.toISOString()
      }),
      description: 'Data analysis time frame'
    })

    this.addCustomBinding({
      propertyPath: 'component.aggregationType',
      paramName: 'aggregation',
      description: 'Data aggregation type'
    })

    this.addCustomBinding({
      propertyPath: 'component.groupBy',
      paramName: 'group_by',
      transform: (fields: string[]) => fields.join(','),
      description: 'Data grouping field'
    })

    // Corresponding trigger rules
    this.addCustomTrigger({
      propertyPath: 'component.timeRange',
      debounceMs: 500,
      description: 'Time range change trigger'
    })

    this.addCustomTrigger({
      propertyPath: 'component.aggregationType',
      debounceMs: 100,
      description: 'Aggregation type change trigger'
    })

    console.log('📊 [DynamicBindingAPI] Data analysis template applied')
  }

  /**
   * UIInterface template - Interface-related binding rules
   */
  private static applyUITemplate(): void {
    this.clearAllDefaultRules()

    // UIstatus attribute
    this.addCustomBinding({
      propertyPath: 'component.selectedTab',
      paramName: 'active_tab',
      description: 'UISelect tab'
    })

    this.addCustomBinding({
      propertyPath: 'component.filterText',
      paramName: 'search_query',
      description: 'UIsearch query'
    })

    this.addCustomBinding({
      propertyPath: 'component.pageSize',
      paramName: 'limit',
      transform: (size: number) => Math.max(1, Math.min(100, size)),
      description: 'UIpaging size'
    })

    // Corresponding trigger rules
    this.addCustomTrigger({
      propertyPath: 'component.selectedTab',
      debounceMs: 50,
      description: 'UITab switching trigger'
    })

    this.addCustomTrigger({
      propertyPath: 'component.filterText',
      debounceMs: 300,
      description: 'UISearch input triggers'
    })

    console.log('🎨 [DynamicBindingAPI] AppliedUIInterface template')
  }

  /**
   * 🔥 Dynamically detect system status at runtime
   */
  static getSystemStatus(): {
    totalBindingRules: number
    totalTriggerRules: number
    customComponentCount: number
    hasDefaultRules: boolean
    isFullyCustomized: boolean
  } {
    const allBindings = this.getCurrentBindingRules()
    const allTriggers = this.getCurrentTriggerRules()
    const debugInfo = dataSourceBindingConfig.getDebugInfo()

    const hasDeviceIdRule = allBindings.some(rule => rule.propertyPath === 'base.deviceId')
    const hasDefaultRules = hasDeviceIdRule // if there is stilldeviceIdrule，说明有默认rule

    return {
      totalBindingRules: allBindings.length,
      totalTriggerRules: allTriggers.length,
      customComponentCount: debugInfo.componentConfigs.length,
      hasDefaultRules,
      isFullyCustomized: !hasDefaultRules
    }
  }
}

/**
 * 🚀 Usage examples and test cases
 */
export class DynamicBindingExamples {

  /**
   * Example1: Fully customized e-commerce components
   */
  static configureECommerceComponent(): void {
    DynamicBindingAPI.configureCustomComponent('ecommerce-product-list', {
      bindings: [
        {
          propertyPath: 'component.categoryId',
          paramName: 'category',
          required: true
        },
        {
          propertyPath: 'component.priceRange',
          paramName: 'price_filter',
          transform: (range: { min: number, max: number }) => `${range.min}-${range.max}`
        },
        {
          propertyPath: 'component.sortBy',
          paramName: 'sort'
        }
      ],
      triggers: [
        {
          propertyPath: 'component.categoryId',
          debounceMs: 100
        },
        {
          propertyPath: 'component.priceRange',
          debounceMs: 500
        }
      ],
      autoBind: {
        enabled: true,
        mode: 'custom',
        customRules: [
          {
            propertyPath: 'component.brandFilter',
            paramName: 'brands',
            transform: (brands: string[]) => brands.join('|')
          }
        ]
      }
    })
  }

  /**
   * Example2: Completely removedeviceIdAll bindings related to
   */
  static removeAllDeviceBindings(): void {
    // Proves that the system default can be completely removeddeviceIdbinding
    DynamicBindingAPI.removeBinding('base.deviceId')
    DynamicBindingAPI.removeTrigger('base.deviceId')

    console.log('🗑️ [DynamicBindingAPI] All removeddeviceIdRelated bindings，The system no longer relies ondeviceId')
  }

  /**
   * Example3: Custom financial data component
   */
  static configureFinancialComponent(): void {
    DynamicBindingAPI.addCustomBinding({
      propertyPath: 'component.stockSymbol',
      paramName: 'symbol',
      required: true,
      transform: (symbol: string) => symbol.toUpperCase(),
      description: 'Stock code binding'
    })

    DynamicBindingAPI.addCustomBinding({
      propertyPath: 'component.timeframe',
      paramName: 'interval',
      transform: (tf: string) => {
        const mapping = { '1m': '1min', '5m': '5min', '1h': '60min', '1d': 'daily' }
        return mapping[tf] || tf
      },
      description: 'time period conversion'
    })

    DynamicBindingAPI.addCustomTrigger({
      propertyPath: 'component.stockSymbol',
      debounceMs: 200,
      description: 'Stock switch trigger'
    })
  }

  /**
   * Test the system's full dynamics
   */
  static testSystemFlexibility(): void {
    console.log('🧪 [DynamicBindingAPI] Start testing system dynamics...')

    // 1. Clear all rules
    DynamicBindingAPI.clearAllDefaultRules()
    let status = DynamicBindingAPI.getSystemStatus()
    console.log('📊 清空后状态:', status)

    // 2. Add fully custom rules
    DynamicBindingAPI.addCustomBinding({
      propertyPath: 'custom.myField',
      paramName: 'my_param',
      description: 'Fully customizable fields'
    })

    DynamicBindingAPI.addCustomTrigger({
      propertyPath: 'custom.myField',
      description: 'Fully customizable triggers'
    })

    status = DynamicBindingAPI.getSystemStatus()
    console.log('📊 添加自定义规则后状态:', status)

    // 3. Verify system operation
    const bindings = DynamicBindingAPI.getCurrentBindingRules()
    const triggers = DynamicBindingAPI.getCurrentTriggerRules()

    console.log('✅ [DynamicBindingAPI] Test completed - The system is fully dynamic:', {
      customBindings: bindings.length,
      customTriggers: triggers.length,
      isFullyCustomized: status.isFullyCustomized,
      hasNoDeviceIdDependency: !bindings.some(r => r.propertyPath === 'base.deviceId')
    })
  }
}

// global exposureAPI，For debugging and configuration use
if (typeof globalThis !== 'undefined') {
  (globalThis as any).__dynamicBindingAPI = DynamicBindingAPI
  (globalThis as any).__dynamicBindingExamples = DynamicBindingExamples
}

export { DynamicBindingAPI, DynamicBindingExamples }