/**
 * Configure event bus
 * Used to decouple configuration changes and executor calls，Implement a loosely coupled event-driven architecture
 *
 * Core functions：
 * 1. Unified distribution of configuration change events
 * 2. Conditional event filtering and processing
 * 3. Event priority and execution sequence control
 * 4. Decoupling and controllability of executor calls
 *
 * Created for Task 1.2: Decoupling configuration events and executor calls
 */

export interface ConfigChangeEvent {
  /** componentsID */
  componentId: string
  /** Component type */
  componentType: string
  /** Changed configuration level */
  section: 'base' | 'component' | 'dataSource' | 'interaction'
  /** Configuration before change */
  oldConfig: any
  /** Configuration after change */
  newConfig: any
  /** Change timestamp */
  timestamp: number
  /** Change source */
  source: 'user' | 'system' | 'api' | 'import'
  /** additional contextual information */
  context?: {
    /** triggering changesUIcomponents */
    triggerComponent?: string
    /** Do you need to trigger data execution? */
    shouldTriggerExecution?: boolean
    /** Changed specific field path */
    changedFields?: string[]
  }
}

export type ConfigEventType =
  | 'config-changed' // Any configuration changes
  | 'data-source-changed' // Data source configuration changes
  | 'component-props-changed' // Component property changes
  | 'base-config-changed' // Basic configuration changes
  | 'interaction-changed' // Interactive configuration changes
  | 'before-config-change' // Before configuration changes（available for verification）
  | 'after-config-change' // After configuration changes（for cleaning work）

export type ConfigEventHandler = (event: ConfigChangeEvent) => void | Promise<void>

export interface ConfigEventFilter {
  /** filter name */
  name: string
  /** filter function */
  condition: (event: ConfigChangeEvent) => boolean
  /** filter priority（The larger the number, the higher the priority.） */
  priority?: number
}

/**
 * Configure event bus class
 * Implement event-driven processing of configuration changes，Decoupling configuration management and business logic
 */
export class ConfigEventBus {
  /** event handler mapping */
  private eventHandlers = new Map<ConfigEventType, Set<ConfigEventHandler>>()

  /** Global event filter list */
  private globalFilters: ConfigEventFilter[] = []

  /** Event processing statistics（for debugging and performance analysis） */
  private statistics = {
    eventsEmitted: 0,
    eventsFiltered: 0,
    handlersExecuted: 0,
    errors: 0
  }

  /**
   * Register configuration change event handler
   * @param eventType event type
   * @param handler event handler
   * @returns Unregister function
   */
  onConfigChange(eventType: ConfigEventType, handler: ConfigEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set())
    }

    const handlers = this.eventHandlers.get(eventType)!
    handlers.add(handler)
    // Returns the unregistered function
    return () => {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventType)
      }
    }
  }

  /**
   * Emit configuration change events
   * @param event Configuration change event
   */
  async emitConfigChange(event: ConfigChangeEvent): Promise<void> {
    // 🔄[DeviceID-HTTP-Debug] Configuration change event emission starts


    this.statistics.eventsEmitted++

    // Apply global filter
    if (!this.passesGlobalFilters(event)) {
      this.statistics.eventsFiltered++
      // 🔄[DeviceID-HTTP-Debug] Events are filtered by global filters
      return
    }

    // Determine the type of event to trigger
    const eventTypesToTrigger = this.determineEventTypes(event)


    // Processors that execute all relevant event types in parallel
    const handlerPromises: Promise<void>[] = []

    for (const eventType of eventTypesToTrigger) {
      const handlers = this.eventHandlers.get(eventType)
      if (handlers) {
        for (const handler of handlers) {
          handlerPromises.push(this.executeHandler(handler, event, eventType))
        }
      }
    }

    // Wait for all processors to complete
    if (handlerPromises.length > 0) {
      try {
        await Promise.allSettled(handlerPromises)
        // 🔄[DeviceID-HTTP-Debug] All processors execute
      } catch (error) {
        // 🔄[DeviceID-HTTP-Debug] Processor execution error
      }
    }
  }

  /**
   * Add global event filter
   * @param filter event filter
   */
  addEventFilter(filter: ConfigEventFilter): void {
    // Insert by priority（Highest priority first）
    const insertIndex = this.globalFilters.findIndex(f => (f.priority || 0) < (filter.priority || 0))
    if (insertIndex === -1) {
      this.globalFilters.push(filter)
    } else {
      this.globalFilters.splice(insertIndex, 0, filter)
    }
  }

  /**
   * Remove global event filter
   * @param filterName filter name
   */
  removeEventFilter(filterName: string): void {
    const index = this.globalFilters.findIndex(f => f.name === filterName)
    if (index !== -1) {
      this.globalFilters.splice(index, 1)
    }
  }

  /**
   * Get event bus statistics
   */
  getStatistics() {
    return { ...this.statistics }
  }

  /**
   * Clear all event handlers and filters（for testing and cleaning）
   */
  clear(): void {
    this.eventHandlers.clear()
    this.globalFilters.length = 0
    this.statistics = {
      eventsEmitted: 0,
      eventsFiltered: 0,
      handlersExecuted: 0,
      errors: 0
    }
  }

  // ===== private method =====

  /**
   * Check if event passes global filter
   */
  private passesGlobalFilters(event: ConfigChangeEvent): boolean {
    for (const filter of this.globalFilters) {
      try {
        if (!filter.condition(event)) {
          return false
        }
      } catch (error) {
        // When filter execution fails，Let events pass by default
      }
    }
    return true
  }

  /**
   * Determine the event type to trigger based on event content
   */
  private determineEventTypes(event: ConfigChangeEvent): ConfigEventType[] {
    const eventTypes: ConfigEventType[] = ['config-changed'] // Always trigger generic events

    // Add specific event types based on configuration hierarchy
    switch (event.section) {
      case 'dataSource':
        eventTypes.push('data-source-changed')
        break
      case 'component':
        eventTypes.push('component-props-changed')
        break
      case 'base':
        eventTypes.push('base-config-changed')
        break
      case 'interaction':
        eventTypes.push('interaction-changed')
        break
    }
    return eventTypes
  }

  /**
   * Safely execute event handlers
   */
  private async executeHandler(
    handler: ConfigEventHandler,
    event: ConfigChangeEvent,
    eventType: ConfigEventType
  ): Promise<void> {
    try {
      this.statistics.handlersExecuted++

      const result = handler(event)

      // If the processor returnsPromise，Wait for execution to complete
      if (result instanceof Promise) {
        await result
      }
    } catch (error) {
      this.statistics.errors++

      // Do not rethrow errors，Avoid affecting the execution of other processors
    }
  }
}

// Create a global configuration event bus instance
export const configEventBus = new ConfigEventBus()

// ✅ simplify：Remove overly complex event deduplication system
// Event deduplication is handled by the caller himself，Keep the event system simple and straightforward

// Add some default filters
configEventBus.addEventFilter({
  name: 'ignore-system-updates',
  condition: event => {
    // Ignore certain system-level configuration updates，Avoid infinite loops
    return event.source !== 'system' || event.context?.shouldTriggerExecution !== false
  },
  priority: 100
})

// ✅ simplify：Remove event deduplication filter，Keep the event system simple and straightforward
// The event deduplication logic is handled by the caller himself

// ✅ simplify：Remove smart event enhancement filter
// Keep event handling logic simple and straightforward，Do not over-analyze configuration content

// 🔥 New：Listen to basic configuration change events，Automatically trigger data source re-execution
let dataExecutionTriggerCallback: ((event: ConfigChangeEvent) => void) | null = null

/**
 * 🔥 Register data execution trigger
 * Allow external systems to register a callback function，Trigger data re-execution when configuration changes
 */
export function registerDataExecutionTrigger(callback: (event: ConfigChangeEvent) => void): () => void {
  dataExecutionTriggerCallback = callback

  if (process.env.NODE_ENV === 'development') {
  }

  return () => {
    dataExecutionTriggerCallback = null
  }
}

// 🔥 Listen to all configuration change events，Pay special attention to basic configuration and data source configuration changes
configEventBus.onConfigChange('config-changed', async event => {
  // For events that need to trigger data execution，Call registered trigger
  if (event.context?.shouldTriggerExecution && dataExecutionTriggerCallback) {
    try {
      if (process.env.NODE_ENV === 'development') {
      }

      if (process.env.NODE_ENV === 'development') {
      }
      const result = dataExecutionTriggerCallback(event)

      if (result instanceof Promise) {
        await result
        if (process.env.NODE_ENV === 'development') {
        }
      }
    } catch (error) {
      console.error(`❌ [ConfigEventBus] Data execution trigger failed`, {
        componentId: event.componentId,
        error: error instanceof Error ? error.message : error
      })
    }
  }
})

// 🔥 Specially monitor basic configuration change events
configEventBus.onConfigChange('base-config-changed', async event => {
  if (process.env.NODE_ENV === 'development') {
  }
  // Basic configuration changes usually require triggering data re-execution
  if (!event.context) {
    event.context = {}
  }
  event.context.shouldTriggerExecution = true
  // Call data execution trigger
  if (dataExecutionTriggerCallback) {
    try {
      dataExecutionTriggerCallback(event)
    } catch (error) {
      console.error(`❌ [ConfigEventBus] Basic configuration data execution trigger failed`, {
        componentId: event.componentId,
        error: error instanceof Error ? error.message : error
      })
    }
  }
})

// 🔥 Specifically monitor data source configuration change events
configEventBus.onConfigChange('data-source-changed', async event => {

  // Data source configuration changes usually require triggering data re-execution
  if (!event.context) {
    event.context = {}
  }
  event.context.shouldTriggerExecution = true
  // Call data execution trigger
  if (dataExecutionTriggerCallback) {
    try {
      dataExecutionTriggerCallback(event)
    } catch (error) {
      console.error(`❌ [ConfigEventBus] Data source configuration data execution trigger failed`, {
        componentId: event.componentId,
        error: error instanceof Error ? error.message : error
      })
    }
  }
})

// 🔧 Debugging support：Expose event bus to global scope，Convenient for console debugging
if (typeof window !== 'undefined') {
  ;(window as any).configEventBus = configEventBus
  ;(window as any).registerDataExecutionTrigger = registerDataExecutionTrigger
}
