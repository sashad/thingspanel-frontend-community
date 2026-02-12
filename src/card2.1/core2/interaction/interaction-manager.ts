/**
 * Interaction Manager
 * Simplified interaction management system，Focus on core interactive features
 * Significantly simplify the original2700+Complex implementation
 */

import type {
  InteractionConfig,
  InteractionEvent,
  InteractionAction,
  InteractionHandler,
  InteractionContext,
  InteractionHandlerRegistration,
  InteractionManagerConfig,
  InteractionState,
  InteractionStats
} from './types'

/**
 * Interaction manager class
 */
export class InteractionManager {
  private static instance: InteractionManager
  private config: InteractionManagerConfig
  private handlers: Map<string, InteractionHandlerRegistration>
  private componentConfigs: Map<string, InteractionConfig>
  private state: InteractionState

  /**
   * private constructor
   */
  private constructor(config: InteractionManagerConfig = {}) {
    this.config = {
      enableLogging: false,
      enableDebugMode: false,
      defaultPreventDefault: true,
      defaultStopPropagation: true,
      ...config
    }

    this.handlers = new Map()
    this.componentConfigs = new Map()
    this.state = {
      isEnabled: true,
      activeEvents: new Set(),
      eventHistory: []
    }

    // Register default handler
    this.registerDefaultHandlers()
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: InteractionManagerConfig): InteractionManager {
    if (!InteractionManager.instance) {
      InteractionManager.instance = new InteractionManager(config)
    }
    return InteractionManager.instance
  }

  /**
   * Register default handler
   */
  private registerDefaultHandlers(): void {
    this.registerHandler({
      type: 'navigate',
      handler: this.handleNavigate.bind(this),
      priority: 10
    })

    this.registerHandler({
      type: 'showMessage',
      handler: this.handleShowMessage.bind(this),
      priority: 5
    })

    this.registerHandler({
      type: 'updateData',
      handler: this.handleUpdateData.bind(this),
      priority: 8
    })

    this.registerHandler({
      type: 'toggleVisibility',
      handler: this.handleToggleVisibility.bind(this),
      priority: 7
    })
  }

  /**
   * Register interaction handler
   */
  registerHandler(registration: InteractionHandlerRegistration): void {
    const key = `${registration.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.handlers.set(key, registration)

    if (this.config.enableLogging) {
      console.log(`[InteractionManager] Register handler: ${registration.type} (${key})`)
    }
  }

  /**
   * Register component interaction configuration
   */
  registerComponentConfig(componentId: string, config: InteractionConfig): void {
    this.componentConfigs.set(componentId, config)

    if (this.config.enableLogging) {
      console.log(`[InteractionManager] Register component interaction configuration: ${componentId}`, {
        eventCount: Object.keys(config.events || {}).length
      })
    }
  }

  /**
   * Remove component interaction configuration
   */
  removeComponentConfig(componentId: string): void {
    this.componentConfigs.delete(componentId)

    if (this.config.enableLogging) {
      console.log(`[InteractionManager] Remove component interaction configuration: ${componentId}`)
    }
  }

  /**
   * Handle interaction events
   */
  async handleEvent(
    event: Event,
    componentId: string,
    eventType: string,
    context: InteractionContext
  ): Promise<boolean> {
    if (!this.state.isEnabled) {
      return false
    }

    const config = this.componentConfigs.get(componentId)
    if (!config || !config.events[eventType]) {
      return false
    }

    const interactionEvent = config.events[eventType]

    // Record event history
    this.state.eventHistory.push({
      event: eventType as any,
      target: componentId,
      timestamp: Date.now()
    })

    // Limit the number of history records
    if (this.state.eventHistory.length > 100) {
      this.state.eventHistory = this.state.eventHistory.slice(-100)
    }

    // Execute event handling
    if (interactionEvent.preventDefault !== false && this.config.defaultPreventDefault) {
      event.preventDefault()
    }

    if (interactionEvent.stopPropagation !== false && this.config.defaultStopPropagation) {
      event.stopPropagation()
    }

    // perform all actions
    for (const action of interactionEvent.actions) {
      await this.executeAction(event, context, action)
    }

    return true
  }

  /**
   * perform interactive actions
   */
  private async executeAction(
    event: Event,
    context: InteractionContext,
    action: InteractionAction
  ): Promise<void> {
    try {
      // Find processor
      const handlers = Array.from(this.handlers.values())
        .filter(registration => registration.type === action.type)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))

      if (handlers.length === 0) {
        console.warn(`[InteractionManager] not found ${action.type} type of processor`)
        return
      }

      // execution processor
      for (const registration of handlers) {
        await registration.handler(event, context, action)
      }

      if (this.config.enableLogging) {
        console.log(`[InteractionManager] perform action: ${action.type}`, {
          componentId: context.componentId,
          componentType: context.componentType
        })
      }
    } catch (error) {
      console.error(`[InteractionManager] Action failed: ${action.type}`, error)
    }
  }

  /**
   * navigation processor
   */
  private async handleNavigate(
    event: Event,
    context: InteractionContext,
    action: InteractionAction
  ): Promise<void> {
    if (!action.target) {
      console.warn('[InteractionManager] Navigation action is missing target path')
      return
    }

    // in actual projects，A routing system should be used here
    console.log(`[InteractionManager] Navigate to: ${action.target}`, {
      componentId: context.componentId
    })

    // Simulate route jump
    if (typeof window !== 'undefined') {
      window.location.hash = action.target
    }
  }

  /**
   * Show message handler
   */
  private async handleShowMessage(
    event: Event,
    context: InteractionContext,
    action: InteractionAction
  ): Promise<void> {
    const message = action.message || 'interactive messages'

    // in actual projects，The message prompt component should be used here
    console.log(`[InteractionManager] show message: ${message}`, {
      componentId: context.componentId
    })

    // Simulate message prompt
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(message)
    }
  }

  /**
   * Update data handler
   */
  private async handleUpdateData(
    event: Event,
    context: InteractionContext,
    action: InteractionAction
  ): Promise<void> {
    if (!action.data) {
      console.warn('[InteractionManager] Update data action is missing data')
      return
    }

    console.log(`[InteractionManager] Update data:`, {
      componentId: context.componentId,
      data: action.data
    })

    // in actual projects，Component data or global state should be updated here
    // For example：context.componentData = { ...context.componentData, ...action.data }
  }

  /**
   * Toggle visibility handler
   */
  private async handleToggleVisibility(
    event: Event,
    context: InteractionContext,
    action: InteractionAction
  ): Promise<void> {
    const visible = action.visible !== undefined ? action.visible : true

    console.log(`[InteractionManager] Toggle visibility: ${visible}`, {
      componentId: context.componentId,
      target: action.target
    })

    // in actual projects，This should update the visibility state of the component
    // For example：Hide by modifying component properties or global state/display component
  }

  /**
   * enable/Disable interaction manager
   */
  setEnabled(enabled: boolean): void {
    this.state.isEnabled = enabled

    if (this.config.enableLogging) {
      console.log(`[InteractionManager] ${enabled ? 'enable' : 'Disable'}Interaction Manager`)
    }
  }

  /**
   * Get interaction status
   */
  getState(): InteractionState {
    return { ...this.state }
  }

  /**
   * Get statistics
   */
  getStats(): InteractionStats {
    const eventDistribution: Record<string, number> = {}
    this.state.eventHistory.forEach(record => {
      eventDistribution[record.event] = (eventDistribution[record.event] || 0) + 1
    })

    return {
      totalEvents: this.state.eventHistory.length,
      activeComponents: this.componentConfigs.size,
      registeredHandlers: this.handlers.size,
      eventDistribution
    }
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.state.eventHistory = []

    if (this.config.enableLogging) {
      console.log('[InteractionManager] Clear event history')
    }
  }

  /**
   * destroy manager
   */
  destroy(): void {
    this.handlers.clear()
    this.componentConfigs.clear()
    this.state.activeEvents.clear()
    this.state.eventHistory = []
    this.state.isEnabled = false

    if (this.config.enableLogging) {
      console.log('[InteractionManager] destroy manager')
    }
  }
}

/**
 * Global interaction manager instance
 */
export const interactionManager = InteractionManager.getInstance()

/**
 * Default export
 */
export default InteractionManager