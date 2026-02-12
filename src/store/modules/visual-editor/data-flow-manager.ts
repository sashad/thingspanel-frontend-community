/**
 * data flow manager
 * Unified processing of user operations → status update → Complete data flow for view refresh
 */

import { useUnifiedEditorStore } from '@/store/modules/visual-editor/unified-editor'
import { useConfigurationService } from '@/store/modules/visual-editor/configuration-service'
import type { GraphData, WidgetConfiguration } from '@/store/modules/visual-editor/unified-editor'

/**
 * User operation type definition
 */
export interface UserAction {
  type: ActionType
  targetId?: string
  data?: any
  metadata?: Record<string, any>
}

export type ActionType =
  | 'ADD_NODE'
  | 'UPDATE_NODE'
  | 'REMOVE_NODE'
  | 'SELECT_NODES'
  | 'UPDATE_CONFIGURATION'
  | 'SET_RUNTIME_DATA'
  | 'BATCH_UPDATE'

/**
 * Operation verification results
 */
export interface ActionValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
}

/**
 * Side Effect Handler Interface
 */
export interface SideEffectHandler {
  name: string
  condition: (action: UserAction, context?: DataFlowContext) => boolean
  execute: (action: UserAction, context: DataFlowContext) => Promise<void> | void
}

/**
 * data flow context
 */
export interface DataFlowContext {
  store: ReturnType<typeof useUnifiedEditorStore>
  configService: ReturnType<typeof useConfigurationService>
  action: UserAction
  timestamp: Date
}

/**
 * data flow manager
 * 🔥 Unified data flow control center，Solve the problem of data flow confusion
 */
export class DataFlowManager {
  private store = useUnifiedEditorStore()
  private configService = useConfigurationService()
  private eventBus = new EventTarget()
  private sideEffectHandlers: SideEffectHandler[] = []
  private isProcessing = false

  constructor() {
    this.registerDefaultSideEffects()
  }

  // ==================== core data stream processing ====================

  /**
   * Handle user actions
   * 🔥 Unified entrance for all user operations
   */
  async handleUserAction(action: UserAction): Promise<void> {
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true

    try {
      // 1. Verify operation
      const validationResult = this.validateAction(action)
      if (!validationResult.valid) {
        throw new Error(validationResult.error)
      }

      // 2. update status
      await this.updateState(action)

      // 3. Trigger side effects
      await this.triggerSideEffects(action)

      // 4. Notify view updates
      this.notifyViewUpdate(action)
    } catch (error) {
      // Trigger error recovery
      await this.handleError(action, error as Error)

      throw error
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Batch processing of user actions
   */
  async handleBatchActions(actions: UserAction[]): Promise<void> {
    // Batch operations use transaction mode
    this.store.setLoading(true)

    try {
      for (const action of actions) {
        await this.handleUserAction(action)
      }
    } catch (error) {
      throw error
    } finally {
      this.store.setLoading(false)
    }
  }

  // ==================== Status update logic ====================

  /**
   * Update status based on action type
   */
  private async updateState(action: UserAction): Promise<void> {
    switch (action.type) {
      case 'ADD_NODE':
        this.handleAddNode(action)
        break

      case 'UPDATE_NODE':
        await this.handleUpdateNode(action)
        break

      case 'REMOVE_NODE':
        this.handleRemoveNode(action)
        break

      case 'SELECT_NODES':
        this.handleSelectNodes(action)
        break

      case 'UPDATE_CONFIGURATION':
        await this.handleUpdateConfiguration(action)
        break

      case 'SET_RUNTIME_DATA':
        this.handleSetRuntimeData(action)
        break

      case 'BATCH_UPDATE':
        await this.handleBatchUpdate(action)
        break

      default:
    }
  }

  /**
   * Handle adding node operation
   */
  private handleAddNode(action: UserAction): void {
    const node = action.data as GraphData
    this.store.addNode(node)
  }

  /**
   * Handle update node operations
   * 🔥 critical fix：Simultaneously update node status and configuration system
   */
  private async handleUpdateNode(action: UserAction): Promise<void> {
    if (!action.targetId) {
      throw new Error('Update node operation requirestargetId')
    }

    if (process.env.NODE_ENV === 'development') {
    }

    // 1. renewstorenode status in
    this.store.updateNode(action.targetId, action.data)

    // 🔥 critical fix：If the update containsproperties，Also update the configuration system
    if (action.data && action.data.properties) {
      if (process.env.NODE_ENV === 'development') {
      }

      try {
        // Get updated complete node data
        const updatedNode = this.store.nodes.find(n => n.id === action.targetId)
        if (updatedNode) {
          // Change the node'spropertiesSynchronized to the configuration systemcomponentConfiguring
          await this.syncNodePropertiesToConfiguration(action.targetId, updatedNode.properties)
        }
      } catch (error) {
        console.error(`❌ [DataFlowManager] Configuration system synchronization failed`, {
          componentId: action.targetId,
          error: error instanceof Error ? error.message : error
        })
        // Don't throw an error，Avoid blocking node updates
      }
    }
  }

  /**
   * Handle deletion of nodes
   */
  private handleRemoveNode(action: UserAction): void {
    if (!action.targetId) {
      throw new Error('Delete node operation requirestargetId')
    }

    this.store.removeNode(action.targetId)
  }

  /**
   * Handle select node operations
   */
  private handleSelectNodes(action: UserAction): void {
    const nodeIds = action.data as string[]
    this.store.selectNodes(nodeIds)
  }

  /**
   * Handle update configuration operations
   */
  private async handleUpdateConfiguration(action: UserAction): Promise<void> {
    if (!action.targetId) {
      throw new Error('Update configuration operation requirestargetId')
    }

    const { section, config } = action.data as {
      section: keyof WidgetConfiguration
      config: any
    }

    // Update configuration using configuration service
    this.configService.updateConfigurationSection(action.targetId, section, config)
  }

  /**
   * Handling setup runtime data operations
   */
  private handleSetRuntimeData(action: UserAction): void {
    if (!action.targetId) {
      throw new Error('Set up runtime data operation requirementstargetId')
    }

    this.configService.setRuntimeData(action.targetId, action.data)
  }

  /**
   * Handle batch update operations
   */
  private async handleBatchUpdate(action: UserAction): Promise<void> {
    const updates = action.data as Array<{
      widgetId: string
      section: keyof WidgetConfiguration
      data: any
    }>

    this.configService.batchUpdateConfiguration(updates)
  }

  /**
   * 🔥 New：Synchronize node properties to configuration system
   * This is the key way to fix property binding links
   * @param componentId componentsID
   * @param properties node attribute object
   */
  private async syncNodePropertiesToConfiguration(componentId: string, properties: Record<string, any>): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
    }

    try {
      // Get current configuration
      const currentConfig = this.configService.getConfiguration(componentId)
      if (process.env.NODE_ENV === 'development') {
      }

      if (!currentConfig) {
        // If not configured，Create default configuration
        if (process.env.NODE_ENV === 'development') {
        }
        this.configService.initializeConfiguration(componentId)
      }

      // 🔥 key：Willpropertiesupdated tocomponentIn the configuration section
      // This configuration change event will be triggered
      if (process.env.NODE_ENV === 'development') {
      }

      // useupdateConfigurationSectionTrigger configuration change event
      this.configService.updateConfigurationSection(componentId, 'component', {
        ...properties // will allpropertiesascomponentConfiguration
      })

      if (process.env.NODE_ENV === 'development') {
      }

    } catch (error) {
      console.error(`❌ [DataFlowManager] syncNodePropertiesToConfiguration fail`, {
        componentId,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  // ==================== Operation verification ====================

  /**
   * Verify user actions
   */
  private validateAction(action: UserAction): ActionValidationResult {
    // Basic verification
    if (!action.type) {
      return { valid: false, error: 'Operation type cannot be empty' }
    }

    // type specific validation
    switch (action.type) {
      case 'ADD_NODE':
        return this.validateAddNodeAction(action)

      case 'UPDATE_NODE':
      case 'REMOVE_NODE':
        return this.validateNodeTargetAction(action)

      case 'UPDATE_CONFIGURATION':
        return this.validateConfigurationAction(action)

      case 'SET_RUNTIME_DATA':
        return this.validateRuntimeDataAction(action)

      default:
        return { valid: true }
    }
  }

  /**
   * Verify adding node operation
   */
  private validateAddNodeAction(action: UserAction): ActionValidationResult {
    if (!action.data) {
      return { valid: false, error: 'Add node operation requires node data' }
    }

    const node = action.data as GraphData
    if (!node.id) {
      return { valid: false, error: 'The node must haveID' }
    }

    // examineIDDoes it already exist?
    const existingNode = this.store.nodes.find(n => n.id === node.id)
    if (existingNode) {
      return { valid: false, error: `nodeIDAlready exists: ${node.id}` }
    }

    return { valid: true }
  }

  /**
   * Validation requires targetIDNode operations
   */
  private validateNodeTargetAction(action: UserAction): ActionValidationResult {
    if (!action.targetId) {
      return { valid: false, error: 'Operational needstargetId' }
    }

    // Check if the node exists
    const node = this.store.nodes.find(n => n.id === action.targetId)
    if (!node) {
      return { valid: false, error: `Node does not exist: ${action.targetId}` }
    }

    return { valid: true }
  }

  /**
   * Verify configuration operations
   */
  private validateConfigurationAction(action: UserAction): ActionValidationResult {
    if (!action.targetId) {
      return { valid: false, error: 'Configuration operations requiretargetId' }
    }

    if (!action.data || !action.data.section) {
      return { valid: false, error: 'Configuration operations requiresectionparameter' }
    }

    const validSections = ['base', 'component', 'dataSource', 'interaction']
    if (!validSections.includes(action.data.section)) {
      return { valid: false, error: `Invalid configurationsection: ${action.data.section}` }
    }

    return { valid: true }
  }

  /**
   * Verify runtime data operations
   */
  private validateRuntimeDataAction(action: UserAction): ActionValidationResult {
    if (!action.targetId) {
      return { valid: false, error: 'Runtime data manipulation requiredtargetId' }
    }

    return { valid: true }
  }

  // ==================== Side effects treatment ====================

  /**
   * trigger side effects
   */
  private async triggerSideEffects(action: UserAction): Promise<void> {
    const context: DataFlowContext = {
      store: this.store,
      configService: this.configService,
      action,
      timestamp: new Date()
    }

    // Execute all matching side effect handlers in parallel
    const matchingHandlers = this.sideEffectHandlers.filter(handler => handler.condition(action, context))

    await Promise.all(
      matchingHandlers.map(async handler => {
        try {
          await handler.execute(action, context)
        } catch (error) {}
      })
    )
  }

  /**
   * Register side effect handler
   */
  registerSideEffect(handler: SideEffectHandler): void {
    this.sideEffectHandlers.push(handler)
  }

  /**
   * Register default side effect handler
   */
  private registerDefaultSideEffects(): void {
    // Configure automatic saving
    this.registerSideEffect({
      name: 'AutoSaveConfiguration',
      condition: action => action.type === 'UPDATE_CONFIGURATION',
      execute: async (action, context) => {
        if (action.targetId) {
          await context.configService.saveConfiguration(action.targetId)
        }
      }
    })

    // Data source change processing
    this.registerSideEffect({
      name: 'DataSourceChangeHandler',
      condition: action => action.type === 'UPDATE_CONFIGURATION' && action.data?.section === 'dataSource',
      execute: async (action, context) => {
        // Clean old runtime data
        if (action.targetId) {
          context.configService.setRuntimeData(action.targetId, null)
        }

        // Trigger data retrieval
        // TODO: Integrate actual data acquisition logic
      }
    })

    // Card2.1Special handling of components
    this.registerSideEffect({
      name: 'Card2ComponentHandler',
      condition: (action, context) => {
        if (!action.targetId || !context?.store) return false
        return context.store.card2Components.has(action.targetId)
      },
      execute: async (action, context) => {
        // Card2.1Special data binding handling
        if (action.type === 'UPDATE_CONFIGURATION' && action.data?.section === 'dataSource') {
          context.store.updateDataBinding(action.targetId!)
        }
      }
    })
  }

  // ==================== View update notification ====================

  /**
   * Notify view updates
   */
  private notifyViewUpdate(action: UserAction): void {
    const event = new CustomEvent('data-flow-update', {
      detail: {
        action,
        timestamp: new Date()
      }
    })

    this.eventBus.dispatchEvent(event)
  }

  /**
   * Listen to data stream update events
   */
  onDataFlowUpdate(callback: (action: UserAction) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail.action)
    }

    this.eventBus.addEventListener('data-flow-update', handler as EventListener)

    return () => {
      this.eventBus.removeEventListener('data-flow-update', handler as EventListener)
    }
  }

  // ==================== Error handling ====================

  /**
   * Handling errors and recovery
   */
  private async handleError(action: UserAction, error: Error): Promise<void> {
    // trigger error event
    const errorEvent = new CustomEvent('data-flow-error', {
      detail: {
        action,
        error,
        timestamp: new Date()
      }
    })

    this.eventBus.dispatchEvent(errorEvent)

    // TODO: Implement error recovery logic
    // For example：Rollback status changes、Display user-friendly error prompts, etc.
  }

  /**
   * Listen for error events
   */
  onError(callback: (action: UserAction, error: Error) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail.action, event.detail.error)
    }

    this.eventBus.addEventListener('data-flow-error', handler as EventListener)

    return () => {
      this.eventBus.removeEventListener('data-flow-error', handler as EventListener)
    }
  }
}

// ==================== Singleton pattern ====================

let dataFlowManagerInstance: DataFlowManager | null = null

/**
 * Get data flow manager instance（Singleton）
 */
export function useDataFlowManager(): DataFlowManager {
  if (!dataFlowManagerInstance) {
    dataFlowManagerInstance = new DataFlowManager()
  }

  return dataFlowManagerInstance
}

/**
 * Reset the Data Flow Manager instance（for testing）
 */
export function resetDataFlowManager(): void {
  dataFlowManagerInstance = null
}

// ==================== Convenient operation functions ====================

/**
 * Create add node operation
 */
export function createAddNodeAction(node: GraphData): UserAction {
  return {
    type: 'ADD_NODE',
    data: node
  }
}

/**
 * Create update configuration action
 */
export function createUpdateConfigAction(
  widgetId: string,
  section: keyof WidgetConfiguration,
  config: any
): UserAction {
  return {
    type: 'UPDATE_CONFIGURATION',
    targetId: widgetId,
    data: { section, config }
  }
}

/**
 * Create settings runtime data operations
 */
export function createSetRuntimeDataAction(widgetId: string, data: any): UserAction {
  return {
    type: 'SET_RUNTIME_DATA',
    targetId: widgetId,
    data
  }
}
