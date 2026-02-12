/**
 * Simplified Data Flow Manager
 * Unified processing of attribute changes to the process triggered by the data source，Implement dynamic parameter binding
 *
 * design principles：
 * 1. Convention over configuration：Standard attribute automatic binding
 * 2. direct trigger：Reduce middle levels
 * 3. general mechanism：Supports arbitrary attribute binding
 * 4. Whitelist control：Clarify which attribute changes trigger the data source
 */

import { ref, reactive, watchEffect, nextTick } from 'vue'
import { simpleDataBridge } from './SimpleDataBridge'
import { dataSourceBindingConfig, type ComponentBindingConfig } from './DataSourceBindingConfig'

/**
 * Property change event interface
 */
export interface PropertyChangeEvent {
  componentId: string
  propertyPath: string  // like 'base.deviceId' or 'component.startTime'
  oldValue: any
  newValue: any
  timestamp: number
}

/**
 * Data source execution configuration interface
 */
export interface DataSourceExecutionConfig {
  componentId: string
  componentType: string
  httpParams: Record<string, any>
  forceRefresh?: boolean
}

/**
 * Simplified data flow manager class
 */
export class SimpleDataFlow {
  private static instance: SimpleDataFlow | null = null

  // Component configuration cache
  private componentConfigs = reactive<Map<string, any>>(new Map())

  // Property change listener
  private propertyWatchers = new Map<string, Set<(event: PropertyChangeEvent) => void>>()

  // Anti-shake control
  private debounceTimers = new Map<string, NodeJS.Timeout>()
  private readonly DEBOUNCE_TIME = 100 // 100ms Anti-shake

  // A collection of executing components（Prevent repeated execution）
  private executingComponents = new Set<string>()

  private constructor() {
    this.setupGlobalWatcher()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SimpleDataFlow {
    if (!SimpleDataFlow.instance) {
      SimpleDataFlow.instance = new SimpleDataFlow()
    }
    return SimpleDataFlow.instance
  }

  /**
   * Register component configuration
   * @param componentId componentsID
   * @param config Complete configuration of components
   */
  registerComponent(componentId: string, config: any): void {
    console.log(`🚀 [SimpleDataFlow] Register component:`, { componentId, hasConfig: !!config })
    this.componentConfigs.set(componentId, config)
  }

  /**
   * Update some part of the component configuration
   * @param componentId componentsID
   * @param section configuration section (base, component, dataSource, interaction)
   * @param newConfig New configuration content
   */
  updateComponentConfig(componentId: string, section: string, newConfig: any): void {
    const currentConfig = this.componentConfigs.get(componentId) || {}
    const oldSectionConfig = currentConfig[section] || {}

    // Update configuration
    currentConfig[section] = { ...oldSectionConfig, ...newConfig }
    this.componentConfigs.set(componentId, currentConfig)

    console.log(`🔄 [SimpleDataFlow] Component configuration update:`, {
      componentId,
      section,
      hasChanges: true,
      newConfigKeys: Object.keys(newConfig)
    })

    // Check whether there are any attribute changes that need to trigger the data source
    this.checkAndTriggerDataSource(componentId, section, oldSectionConfig, newConfig)
  }

  /**
   * Check for property changes and trigger data sources（if needed）
   */
  private checkAndTriggerDataSource(
    componentId: string,
    section: string,
    oldConfig: any,
    newConfig: any
  ): void {
    const changedProperties: PropertyChangeEvent[] = []

    // Detect specific property changes
    for (const [key, newValue] of Object.entries(newConfig)) {
      const oldValue = oldConfig[key]
      if (oldValue !== newValue) {
        const propertyPath = `${section}.${key}`

        changedProperties.push({
          componentId,
          propertyPath,
          oldValue,
          newValue,
          timestamp: Date.now()
        })
      }
    }

    if (changedProperties.length === 0) {
      return
    }

    console.log(`🔍 [SimpleDataFlow] Property change detected:`, {
      componentId,
      section,
      changedProperties: changedProperties.map(p => ({
        property: p.propertyPath,
        oldValue: p.oldValue,
        newValue: p.newValue
      }))
    })

    // Check if any changed properties are in the trigger whitelist
    const config = this.componentConfigs.get(componentId)
    const componentType = config?.componentType

    const triggerProperties = changedProperties.filter(change =>
      this.shouldTriggerDataSource(change.propertyPath, componentType)
    )

    if (triggerProperties.length > 0) {
      console.log(`🎯 [SimpleDataFlow] Trigger data source update:`, {
        componentId,
        triggerProperties: triggerProperties.map(p => p.propertyPath)
      })

      // Anti-shake execution data source update
      this.debounceDataSourceExecution(componentId, triggerProperties)
    }

    // Trigger property change listener
    changedProperties.forEach(change => {
      this.notifyPropertyWatchers(change)
    })
  }

  /**
   * Check if the property is in the trigger whitelist
   */
  private shouldTriggerDataSource(propertyPath: string, componentType?: string): boolean {
    return dataSourceBindingConfig.shouldTriggerDataSource(propertyPath, componentType)
  }

  /**
   * Anti-shake execution data source update
   */
  private debounceDataSourceExecution(componentId: string, triggerProperties: PropertyChangeEvent[]): void {
    // Clear previous timer
    const existingTimer = this.debounceTimers.get(componentId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.executeDataSource(componentId, triggerProperties)
      this.debounceTimers.delete(componentId)
    }, this.DEBOUNCE_TIME)

    this.debounceTimers.set(componentId, timer)
  }

  /**
   * Perform data source updates
   */
  private async executeDataSource(componentId: string, triggerProperties: PropertyChangeEvent[]): Promise<void> {
    // Prevent repeated execution
    if (this.executingComponents.has(componentId)) {
      console.log(`⏳ [SimpleDataFlow] Component is executing，jump over:`, { componentId })
      return
    }

    this.executingComponents.add(componentId)

    try {
      console.log(`🚀 [SimpleDataFlow] Start executing the data source:`, {
        componentId,
        triggerProperties: triggerProperties.map(p => p.propertyPath)
      })

      // Get component configuration
      const config = this.componentConfigs.get(componentId)
      if (!config || !config.dataSource) {
        console.log(`⚠️ [SimpleDataFlow] Component has no data source configuration:`, { componentId })
        return
      }

      // BuildHTTPparameter
      const httpParams = this.buildHttpParams(componentId, config)

      console.log(`📤 [SimpleDataFlow] BuildHTTPparameter:`, {
        componentId,
        httpParams
      })

      // clear cache，Make sure you get the latest data
      simpleDataBridge.clearComponentCache(componentId)

      // use VisualEditorBridge Execute data source
      const { getVisualEditorBridge } = await import('./VisualEditorBridge')
      const visualEditorBridge = getVisualEditorBridge()

      // Build a complete configuration object
      const executionConfig = {
        base: config.base || {},
        dataSource: config.dataSource,
        component: config.component || {},
        interaction: config.interaction || {},
        // injected into the buildHTTPparameter
        _httpParams: httpParams
      }

      // Execute data source
      const result = await visualEditorBridge.updateComponentExecutor(
        componentId,
        config.componentType || 'widget',
        executionConfig
      )

      console.log(`✅ [SimpleDataFlow] Data source execution completed:`, {
        componentId,
        success: !!result
      })

    } catch (error) {
      console.error(`❌ [SimpleDataFlow] Data source execution failed:`, {
        componentId,
        error: error instanceof Error ? error.message : error
      })
    } finally {
      this.executingComponents.delete(componentId)
    }
  }

  /**
   * BuildHTTPparameter
   * Map component properties toHTTPparameter
   */
  private buildHttpParams(componentId: string, config: any): Record<string, any> {
    const componentType = config.componentType

    // 🚀 New：Check if there isautoBindConfiguration
    const autoBindConfig = this.getAutoBindConfig(config)

    if (autoBindConfig) {
      return dataSourceBindingConfig.buildAutoBindParams(config, autoBindConfig, componentType)
    }

    return dataSourceBindingConfig.buildHttpParams(config, componentType)
  }

  /**
   * 🚀 New：GetautoBindConfiguration
   * @param config Component configuration
   * @returns autoBindconfigure ornull
   */
  private getAutoBindConfig(config: any): import('./DataSourceBindingConfig').AutoBindConfig | null {
    // Extract from data source configurationautoBindset up
    if (config.dataSource?.autoBind) {
      return config.dataSource.autoBind
    }

    // Extracted from global configurationautoBindset up
    if (config.autoBind) {
      return config.autoBind
    }

    // Check component specific configuration
    const componentConfig = dataSourceBindingConfig.getComponentConfig(config.componentType)
    if (componentConfig?.autoBindEnabled) {
      // Relaxed mode enabled by default
      return {
        enabled: true,
        mode: 'loose'
      }
    }

    return null
  }

  /**
   * Add property change listener
   */
  addPropertyWatcher(propertyPath: string, callback: (event: PropertyChangeEvent) => void): () => void {
    if (!this.propertyWatchers.has(propertyPath)) {
      this.propertyWatchers.set(propertyPath, new Set())
    }

    this.propertyWatchers.get(propertyPath)!.add(callback)

    // Returns a function that removes the listener
    return () => {
      const watchers = this.propertyWatchers.get(propertyPath)
      if (watchers) {
        watchers.delete(callback)
        if (watchers.size === 0) {
          this.propertyWatchers.delete(propertyPath)
        }
      }
    }
  }

  /**
   * Notify property change listeners
   */
  private notifyPropertyWatchers(event: PropertyChangeEvent): void {
    const watchers = this.propertyWatchers.get(event.propertyPath)
    if (watchers) {
      watchers.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error(`❌ [SimpleDataFlow] Property listener execution error:`, {
            propertyPath: event.propertyPath,
            error: error instanceof Error ? error.message : error
          })
        }
      })
    }
  }

  /**
   * Set global monitor（Reserve the interface temporarily，Possible for more advanced responsive integration in the future）
   */
  private setupGlobalWatcher(): void {
    // Here you can set up global responsive monitoring
    // At present, it is mainly through explicit updateComponentConfig call to trigger
  }

  /**
   * Manually trigger component data source execution
   * @param componentId componentsID
   * @param reason Trigger reason
   */
  async triggerDataSource(componentId: string, reason: string = 'manual'): Promise<void> {
    console.log(`🔄 [SimpleDataFlow] Manually trigger data sources:`, { componentId, reason })

    const config = this.componentConfigs.get(componentId)
    if (!config) {
      console.warn(`⚠️ [SimpleDataFlow] Component configuration does not exist:`, { componentId })
      return
    }

    // Create a dummy property change event to trigger execution
    const virtualEvent: PropertyChangeEvent = {
      componentId,
      propertyPath: 'manual.trigger',
      oldValue: null,
      newValue: reason,
      timestamp: Date.now()
    }

    await this.executeDataSource(componentId, [virtualEvent])
  }

  /**
   * Remove component registration
   */
  unregisterComponent(componentId: string): void {
    console.log(`🗑️ [SimpleDataFlow] Unregister component:`, { componentId })

    this.componentConfigs.delete(componentId)

    // Clear related anti-shake timers
    const timer = this.debounceTimers.get(componentId)
    if (timer) {
      clearTimeout(timer)
      this.debounceTimers.delete(componentId)
    }

    // Remove execution status
    this.executingComponents.delete(componentId)
  }

  /**
   * Get the current trigger whitelist
   */
  getTriggerWhitelist(componentType?: string): string[] {
    return dataSourceBindingConfig.getAllTriggerRules(componentType).map(rule => rule.propertyPath)
  }

  /**
   * Dynamically add trigger attributes to the whitelist
   */
  addTriggerProperty(propertyPath: string, enabled: boolean = true, debounceMs?: number): void {
    dataSourceBindingConfig.addCustomTriggerRule({
      propertyPath,
      enabled,
      debounceMs,
      description: `Dynamically added trigger rules: ${propertyPath}`
    })
  }

  /**
   * Dynamically add automatic binding rules
   */
  addBindingRule(propertyPath: string, paramName: string, transform?: (value: any) => any, required?: boolean): void {
    dataSourceBindingConfig.addCustomBindingRule({
      propertyPath,
      paramName,
      transform,
      required,
      description: `Dynamically added binding rules: ${propertyPath} → ${paramName}`
    })
  }

  /**
   * Set component-specific binding configuration
   */
  setComponentBindingConfig(componentType: string, config: ComponentBindingConfig): void {
    dataSourceBindingConfig.setComponentConfig(componentType, config)
  }

  /**
   * Get debugging information for the binding configuration
   */
  getBindingDebugInfo(componentType?: string): any {
    return dataSourceBindingConfig.getDebugInfo(componentType)
  }
}

// Create a global instance
export const simpleDataFlow = SimpleDataFlow.getInstance()

// global exposure，for debugging
if (typeof globalThis !== 'undefined') {
  (globalThis as any).__simpleDataFlow = simpleDataFlow
}