/**
 * Visual Editor Unified data management module entrance
 * 🔥 Unified export of new architecture，Replaces all fragmented data management components
 */

// Import core state management
import {
  useUnifiedEditorStore,
  type UnifiedEditorState,
  type BaseConfiguration,
  type ComponentConfiguration,
  type DataSourceConfiguration,
  type InteractionConfiguration
} from './unified-editor'

// Re-export for external use
export {
  useUnifiedEditorStore,
  type UnifiedEditorState,
  type BaseConfiguration,
  type ComponentConfiguration,
  type DataSourceConfiguration,
  type InteractionConfiguration
}

// Import configuration service
import {
  useConfigurationService,
  resetConfigurationService,
  type ConfigurationChangeEvent,
  type ConfigurationValidationResult,
  type ConfigurationMigration
} from './configuration-service'

// Import data flow management
import {
  useDataFlowManager,
  resetDataFlowManager,
  createAddNodeAction,
  createUpdateConfigAction,
  createSetRuntimeDataAction,
  type UserAction,
  type ActionType,
  type SideEffectHandler,
  type DataFlowContext
} from './data-flow-manager'

// importCard 2.1 integrated adapter
import {
  useCard2Adapter,
  resetCard2Adapter,
  type ComponentDefinition,
  type DataSourceDefinition,
  type FieldMapping,
  type ComponentConfig,
  type ReactiveDataBinding,
  type ComponentRequirement
} from './card2-adapter'

// Re-export the configuration service
export {
  useConfigurationService,
  resetConfigurationService,
  type ConfigurationChangeEvent,
  type ConfigurationValidationResult,
  type ConfigurationMigration
}

// Re-export data flow management
export {
  useDataFlowManager,
  resetDataFlowManager,
  createAddNodeAction,
  createUpdateConfigAction,
  createSetRuntimeDataAction,
  type UserAction,
  type ActionType,
  type SideEffectHandler,
  type DataFlowContext
}

// Re-exportCard 2.1 integrated adapter
export {
  useCard2Adapter,
  resetCard2Adapter,
  type ComponentDefinition,
  type DataSourceDefinition,
  type FieldMapping,
  type ComponentConfig,
  type ReactiveDataBinding,
  type ComponentRequirement
}

/**
 * unified Visual Editor System class
 * 🔥 This is the core coordinator of the new architecture，Replace the original decentralized management
 */
export class UnifiedVisualEditorSystem {
  public store: ReturnType<typeof useUnifiedEditorStore> | null = null
  public configService: ReturnType<typeof useConfigurationService> | null = null
  public dataFlowManager: ReturnType<typeof useDataFlowManager> | null = null
  public card2Adapter: ReturnType<typeof useCard2Adapter> | null = null

  private initialized = false
  private servicesInitialized = false

  constructor() {}

  /**
   * Lazy initialization of individual services
   */
  private initializeServices(): void {
    if (this.servicesInitialized) return

    this.store = useUnifiedEditorStore()
    this.configService = useConfigurationService()
    this.dataFlowManager = useDataFlowManager()
    this.card2Adapter = useCard2Adapter()

    this.servicesInitialized = true
  }

  /**
   * Initialize the system
   */
  async initialize(): Promise<void> {
    if (this.initialized && this.store && this.configService && this.dataFlowManager && this.card2Adapter) {
      return
    }

    if (this.initialized && !this.store) {
      this.initialized = false
    }
    try {
      // 0. Initialize each service first
      this.initializeServices()

      // 1. Initialize configuration service
      await this.initializeConfigurationService()

      // 2. Initialize data flow management
      this.initializeDataFlowManager()

      // 3. initializationCard2.1adapter
      await this.initializeCard2Adapter()

      // 4. Set up system event monitoring
      this.setupSystemEventListeners()

      // 5. Verify that all services have been initialized correctly
      if (!this.store || !this.configService || !this.dataFlowManager || !this.card2Adapter) {
        throw new Error('Service initialization verification failed：Some services arenull')
      }

      this.initialized = true
    } catch (error) {
      throw error
    }
  }

  /**
   * Initialize configuration service
   */
  private async initializeConfigurationService(): Promise<void> {
    if (!this.configService) {
      throw new Error('Configuration service not initialized')
    }

    // Register configuration migration
    this.configService.registerMigration({
      fromVersion: '1.0.0',
      toVersion: '1.1.0',
      migrate: config => {
        // Sample migration logic
        return {
          ...config,
          metadata: {
            ...config.metadata,
            version: '1.1.0'
          }
        }
      }
    })
  }

  /**
   * Initialize data flow management
   */
  private initializeDataFlowManager(): void {
    if (!this.dataFlowManager) {
      throw new Error('Data flow manager not initialized')
    }

    // Register a custom side effect handler
    this.dataFlowManager.registerSideEffect({
      name: 'SystemStateSync',
      condition: () => true, // Monitor all operations
      execute: action => {
        // System status synchronization logic
      }
    })
  }

  /**
   * initializationCard2.1adapter
   */
  private async initializeCard2Adapter(): Promise<void> {
    // Card2.1The adapter will automatically initialize
    // Additional initialization logic can be added here
  }

  /**
   * Set up system event monitoring
   */
  private setupSystemEventListeners(): void {
    if (!this.configService || !this.dataFlowManager) {
      throw new Error('Service not initialized，Unable to set up event listening')
    }

    // Listen for configuration changes
    this.configService.onConfigurationChange(event => {})

    // Monitor data stream updates
    this.dataFlowManager.onDataFlowUpdate(action => {})

    // Listen for error events
    this.dataFlowManager.onError((action, error) => {})
  }

  /**
   * Get system status
   */
  getSystemStatus(): {
    initialized: boolean
    nodeCount: number
    widgetCount: number
    card2ComponentCount: number
    hasUnsavedChanges: boolean
  } {
    if (!this.store) {
      return {
        initialized: false,
        nodeCount: 0,
        widgetCount: 0,
        card2ComponentCount: 0,
        hasUnsavedChanges: false
      }
    }

    return {
      initialized: this.initialized,
      nodeCount: this.store.nodes.length,
      widgetCount: this.store.allWidgets.length,
      card2ComponentCount: this.store.card2ComponentCount,
      hasUnsavedChanges: this.store.hasUnsavedChanges
    }
  }

  /**
   * Save all configurations
   */
  async saveAll(): Promise<void> {
    if (!this.configService) {
      throw new Error('Configuration service not initialized')
    }

    await this.configService.saveAllConfigurations()
  }

  /**
   * Clean up system resources
   */
  cleanup(): void {
    if (this.store) {
      this.store.clearAll()
    }

    this.initialized = false
    this.servicesInitialized = false
  }
}

// ==================== Singleton pattern ====================

let unifiedEditorSystemInstance: UnifiedVisualEditorSystem | null = null

/**
 * get unityVisual EditorSystem instance（Singleton）
 * 🔥 This is the main entry point for the new architecture
 */
export function useUnifiedVisualEditorSystem(): UnifiedVisualEditorSystem {
  if (!unifiedEditorSystemInstance) {
    unifiedEditorSystemInstance = new UnifiedVisualEditorSystem()
  }

  return unifiedEditorSystemInstance
}

/**
 * reset unityVisual EditorSystem instance（for testing）
 */
export function resetUnifiedVisualEditorSystem(): void {
  if (unifiedEditorSystemInstance) {
    unifiedEditorSystemInstance.cleanup()
  }
  unifiedEditorSystemInstance = null
}

// ==================== Convenient Hook ====================

/**
 * Visual Editor Hook
 * 🔥 Provide simplifiedAPIUsed by components
 */
export function useVisualEditor() {
  const system = useUnifiedVisualEditorSystem()

  return {
    // status access - 🔥 use computed Ensure the latest service instance is always returned
    get store() {
      return system.store
    },
    get configService() {
      return system.configService
    },
    get dataFlowManager() {
      return system.dataFlowManager
    },
    get card2Adapter() {
      return system.card2Adapter
    },

    // System operation
    initialize: () => system.initialize(),
    saveAll: () => system.saveAll(),
    getStatus: () => system.getSystemStatus(),
    cleanup: () => system.cleanup(),

    // Quick operation
    addNode: async (node: any) => {
      if (!system.dataFlowManager) {
        throw new Error('Data flow manager not initialized，Please call first initialize()')
      }
      return system.dataFlowManager.handleUserAction({
        type: 'ADD_NODE',
        data: node
      })
    },

    updateNode: async (nodeId: string, updates: any) => {
      if (!system.dataFlowManager) {
        throw new Error('Data flow manager not initialized，Please call first initialize()')
      }
      return system.dataFlowManager.handleUserAction({
        type: 'UPDATE_NODE',
        targetId: nodeId,
        data: updates
      })
    },

    removeNode: async (nodeId: string) => {
      if (!system.dataFlowManager) {
        throw new Error('Data flow manager not initialized，Please call first initialize()')
      }
      return system.dataFlowManager.handleUserAction({
        type: 'REMOVE_NODE',
        targetId: nodeId
      })
    },

    updateConfiguration: async (widgetId: string, section: any, config: any) => {
      if (!system.dataFlowManager) {
        throw new Error('Data flow manager not initialized，Please call first initialize()')
      }
      return system.dataFlowManager.handleUserAction({
        type: 'UPDATE_CONFIGURATION',
        targetId: widgetId,
        data: { section, config }
      })
    },

    selectNodes: async (ids: string[]) => {
      if (!system.dataFlowManager) {
        throw new Error('Data flow manager not initialized，Please call first initialize()')
      }
      return system.dataFlowManager.handleUserAction({
        type: 'SELECT_NODES',
        data: ids
      })
    },

    // Status query
    getSelectedNodes: () => {
      if (!system.store) {
        return []
      }
      return system.store.selectedNodes
    },
    getConfiguration: (widgetId: string) => {
      if (!system.configService) {
        throw new Error('Configuration service not initialized，Please call first initialize()')
      }
      return system.configService.getConfiguration(widgetId)
    },
    getRuntimeData: (widgetId: string) => {
      if (!system.configService) {
        throw new Error('Configuration service not initialized，Please call first initialize()')
      }
      return system.configService.getRuntimeData(widgetId)
    }
  }
}

/**
 * Migration aid
 * Help with migration from old to new systems
 */
export const MigrationHelper = {
  /**
   * Migrate data from old editor store
   */
  migrateFromOldStore(oldStoreData: any): void {
    const system = useUnifiedVisualEditorSystem()

    // Migrate node data
    if (oldStoreData.nodes) {
      oldStoreData.nodes.forEach((node: any) => {
        system.store.addNode(node)
      })
    }

    // Migrate selected state
    if (oldStoreData.selectedIds) {
      system.store.selectNodes(oldStoreData.selectedIds)
    }

    // Migrate configuration data
    if (oldStoreData.configurations) {
      Object.entries(oldStoreData.configurations).forEach(([widgetId, config]: [string, any]) => {
        system.configService.setConfiguration(widgetId, config)
      })
    }
  },

  /**
   * Check if migration is required
   */
  needsMigration(): boolean {
    // Check if old stored data exists
    return localStorage.getItem('old_editor_data') !== null
  }
}
