/**
 * 🔥 Interactively configure the router - Unified interactive configuration distribution system
 *
 * Core responsibilities：
 * 1. according tocomponentIdRoute interaction configuration to corresponding components
 * 2. Supports concurrent management of multiple interactive configurations for one component
 * 3. Managing the lifecycle of interaction listeners
 * 4. Provides a cross-component property modification mechanism
 *
 * Problem solved：
 * - Interaction fails after refresh → Unified configuration loading and registration timing
 * - One component supports multiple interaction configurations → Concurrent interaction management
 * - Cross-component property modification → Configuration level property modification response
 */

export interface InteractionConfig {
  id: string
  event: 'click' | 'hover' | 'dataChange'
  condition?: {
    type: 'comparison' | 'range' | 'expression'
    operator?: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains'
    value?: any
  }
  responses: Array<{
    action: 'jump' | 'modify'
    target?: string
    value?: any
    targetComponentId?: string
    targetProperty?: string
  }>
  watchedProperty?: string
}

export interface InteractionListener {
  id: string
  componentId: string
  config: InteractionConfig
  unwatch?: () => void
  cleanup?: () => void
}

/**
 * Interactively configure the router - Singleton pattern
 */
export class InteractionConfigRouter {
  private static instance: InteractionConfigRouter

  // Configuration storage：componentId -> InteractionConfig[]
  private configMap = new Map<string, InteractionConfig[]>()

  // listener storage：componentId -> InteractionListener[]
  private listenerMap = new Map<string, InteractionListener[]>()

  // Component instance cache：componentId -> ComponentExpose
  private componentCache = new Map<string, any>()

  // Configure change listener
  private configChangeListeners = new Map<string, ((configs: InteractionConfig[]) => void)[]>()

  private constructor() {
  }

  static getInstance(): InteractionConfigRouter {
    if (!InteractionConfigRouter.instance) {
      InteractionConfigRouter.instance = new InteractionConfigRouter()
    }
    return InteractionConfigRouter.instance
  }

  /**
   * 🔥 core methods：Register the interaction configuration of the component
   */
  registerComponentConfigs(componentId: string, configs: InteractionConfig[]): void {

    // Clean up old configuration and listeners
    this.clearComponentListeners(componentId)

    // Save new configuration
    this.configMap.set(componentId, configs)

    // Try registering a listener now（If the component is cached）
    this.tryRegisterListeners(componentId)

    // Notify configuration change listener
    this.notifyConfigChange(componentId, configs)
  }

  /**
   * 🔥 core methods：Register component instance，enable it to be monitored
   */
  registerComponentInstance(componentId: string, componentExpose: any): void {

    this.componentCache.set(componentId, componentExpose)

    // Try registering a listener now（If the configuration already exists）
    this.tryRegisterListeners(componentId)
  }

  /**
   * 🔥 core methods：Try to register a listener（When the configuration and component instances are complete）
   */
  private tryRegisterListeners(componentId: string): void {
    const configs = this.configMap.get(componentId)
    const componentExpose = this.componentCache.get(componentId)

    if (!configs || !componentExpose) {
      return
    }


    const listeners: InteractionListener[] = []

    configs.forEach((config, index) => {
      const listener: InteractionListener = {
        id: `${componentId}_${config.id}_${index}`,
        componentId,
        config
      }

      // Register different listeners based on event type
      switch (config.event) {
        case 'click':
          this.registerClickListener(listener, componentExpose)
          break
        case 'hover':
          this.registerHoverListener(listener, componentExpose)
          break
        case 'dataChange':
          this.registerDataChangeListener(listener, componentExpose)
          break
      }

      listeners.push(listener)
    })

    // Save listener reference
    this.listenerMap.set(componentId, listeners)

  }

  /**
   * Register click event listener
   */
  private registerClickListener(listener: InteractionListener, componentExpose: any): void {

    // passDOMEvent delegate registers click listener
    const handleClick = async (event: Event) => {

      // Check conditions（if there is）
      if (listener.config.condition && !this.checkCondition(listener.config.condition, null)) {
        return
      }

      // Execute response
      await this.executeResponses(listener.config.responses, listener.componentId)
    }

    // Find component elements and add listeners
    const componentElement = document.querySelector(`[data-component-id="${listener.componentId}"]`)
    if (componentElement) {
      componentElement.addEventListener('click', handleClick)

      // Save clean function
      listener.cleanup = () => {
        componentElement.removeEventListener('click', handleClick)
      }

    } else {
      console.warn(`❌ [InteractionConfigRouter] Component element not found: ${listener.componentId}`)
    }
  }

  /**
   * Register a hover event listener
   */
  private registerHoverListener(listener: InteractionListener, componentExpose: any): void {

    const handleMouseEnter = async (event: Event) => {
      await this.executeResponses(listener.config.responses, listener.componentId)
    }

    const handleMouseLeave = async (event: Event) => {
      // TODO: Support hover-away configuration
    }

    // Find component elements and add listeners
    const componentElement = document.querySelector(`[data-component-id="${listener.componentId}"]`)
    if (componentElement) {
      componentElement.addEventListener('mouseenter', handleMouseEnter)
      componentElement.addEventListener('mouseleave', handleMouseLeave)

      // Save clean function
      listener.cleanup = () => {
        componentElement.removeEventListener('mouseenter', handleMouseEnter)
        componentElement.removeEventListener('mouseleave', handleMouseLeave)
      }

    } else {
      console.warn(`❌ [InteractionConfigRouter] Component element not found: ${listener.componentId}`)
    }
  }

  /**
   * Register property change listener
   */
  private registerDataChangeListener(listener: InteractionListener, componentExpose: any): void {
    if (!listener.config.watchedProperty) {
      console.warn(`❌ [InteractionConfigRouter] dataChangeConfiguration is missingwatchedProperty: ${listener.id}`)
      return
    }

    if (!componentExpose.watchProperty) {
      console.warn(`❌ [InteractionConfigRouter] Component does not supportwatchProperty: ${listener.componentId}`)
      return
    }


    try {
      const unwatch = componentExpose.watchProperty(
        listener.config.watchedProperty,
        async (newValue: any, oldValue: any) => {

          // Check conditions
          let conditionMet = true
          if (listener.config.condition) {
            conditionMet = this.checkCondition(listener.config.condition, newValue)
          }

          if (conditionMet) {
            await this.executeResponses(listener.config.responses, listener.componentId)
          } else {
          }
        }
      )

      // saveunwatchfunction
      listener.unwatch = unwatch

    } catch (error) {
      console.error(`❌ [InteractionConfigRouter] Failed to register property listener:`, error)
    }
  }

  /**
   * 🔥 core methods：Perform interactive responses
   */
  private async executeResponses(responses: InteractionConfig['responses'], sourceComponentId: string): Promise<void> {

    for (const response of responses) {
      switch (response.action) {
        case 'jump':
          this.executeJumpResponse(response)
          break
        case 'modify':
          await this.executeModifyResponse(response, sourceComponentId)
          break
        default:
          console.warn(`🔥 [InteractionConfigRouter] Unknown response type:`, response.action)
      }
    }
  }

  /**
   * Execute jump response
   */
  private executeJumpResponse(response: InteractionConfig['responses'][0]): void {

    if (response.value) {
      if (response.target === '_blank') {
        window.open(response.value, '_blank')
      } else {
        window.location.href = response.value
      }
    }
  }

  /**
   * 🔥 key methods：Perform cross-component property modification responses
   */
  private async executeModifyResponse(response: InteractionConfig['responses'][0], sourceComponentId: string): Promise<void> {
    if (!response.targetComponentId || !response.targetProperty) {
      console.warn(`❌ [InteractionConfigRouter] Property modification response is missing target information:`, response)
      return
    }

    // 🔥 Use components directlyID，No need "self" concept
    const actualTargetComponentId = response.targetComponentId


    try {
      // 🔥 key：passConfigurationIntegrationBridgeUpdate target component configuration
      // This ensures that the configuration is being modified，rather than a temporary state，thus triggering a chain reaction
      const { configurationIntegrationBridge } = await import('./ConfigurationIntegrationBridge')

      const success = configurationIntegrationBridge.updateConfigurationForInteraction(
        actualTargetComponentId,
        'component',
        { [response.targetProperty!]: response.value }
      )

      if (success) {

        // 🔥 Send property change event，Trigger dynamic parameter update of data source
        window.dispatchEvent(new CustomEvent('property-change', {
          detail: {
            componentId: actualTargetComponentId,
            propertyName: response.targetProperty,
            newValue: response.value,
            source: 'interaction'
          }
        }))

      } else {
        console.warn(`❌ [InteractionConfigRouter] Cross-component property modification failed`)
      }
    } catch (error) {
      console.error(`❌ [InteractionConfigRouter] An error occurred while performing attribute modification:`, error)
    }
  }

  /**
   * condition check
   */
  private checkCondition(condition: InteractionConfig['condition'], value: any): boolean {
    if (!condition) return true

    switch (condition.type) {
      case 'comparison':
        switch (condition.operator) {
          case 'equals':
            return value === condition.value
          case 'notEquals':
            return value !== condition.value
          case 'greaterThan':
            return Number(value) > Number(condition.value)
          case 'lessThan':
            return Number(value) < Number(condition.value)
          case 'contains':
            return String(value).includes(String(condition.value))
          default:
            return true
        }
      case 'range':
        // TODO: Implement range checking
        return true
      case 'expression':
        // TODO: Implement expression checking
        return true
      default:
        return true
    }
  }

  /**
   * Clean up all listeners for the component
   */
  private clearComponentListeners(componentId: string): void {
    const listeners = this.listenerMap.get(componentId)
    if (listeners) {

      listeners.forEach(listener => {
        if (listener.unwatch) {
          listener.unwatch()
        }
        if (listener.cleanup) {
          listener.cleanup()
        }
      })

      this.listenerMap.delete(componentId)
    }
  }

  /**
   * Remove all configuration and listeners from the component
   */
  unregisterComponent(componentId: string): void {

    this.clearComponentListeners(componentId)
    this.configMap.delete(componentId)
    this.componentCache.delete(componentId)
    this.configChangeListeners.delete(componentId)
  }

  /**
   * Listen for configuration changes
   */
  onConfigChange(componentId: string, callback: (configs: InteractionConfig[]) => void): () => void {
    if (!this.configChangeListeners.has(componentId)) {
      this.configChangeListeners.set(componentId, [])
    }

    this.configChangeListeners.get(componentId)!.push(callback)

    // Returns the function to cancel listening
    return () => {
      const listeners = this.configChangeListeners.get(componentId)
      if (listeners) {
        const index = listeners.indexOf(callback)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }

  /**
   * Notify configuration changes
   */
  private notifyConfigChange(componentId: string, configs: InteractionConfig[]): void {
    const listeners = this.configChangeListeners.get(componentId)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(configs)
        } catch (error) {
          console.error(`❌ [InteractionConfigRouter] Configuration change notification failed:`, error)
        }
      })
    }
  }

  /**
   * Get the interaction configuration of the component
   */
  getComponentConfigs(componentId: string): InteractionConfig[] {
    return this.configMap.get(componentId) || []
  }

  /**
   * Get global statistics
   */
  getStats(): {
    totalComponents: number
    totalConfigs: number
    totalListeners: number
  } {
    let totalConfigs = 0
    let totalListeners = 0

    this.configMap.forEach(configs => {
      totalConfigs += configs.length
    })

    this.listenerMap.forEach(listeners => {
      totalListeners += listeners.length
    })

    return {
      totalComponents: this.configMap.size,
      totalConfigs,
      totalListeners
    }
  }
}

// Export singleton instance
export const interactionConfigRouter = InteractionConfigRouter.getInstance()

export default interactionConfigRouter