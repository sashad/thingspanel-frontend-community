/**
 * Component runtime data management interface
 * Responsible for managing the runtime data of components：data acquisition、cache、renew
 */

/**
 * Data source type
 */
export type DataSourceType = 'static' | 'http' | 'websocket' | 'script'

/**
 * Data source configuration
 */
export interface DataSourceDefinition {
  id: string
  type: DataSourceType
  config: {
    // HTTPConfiguration
    url?: string
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    params?: Record<string, any>
    body?: any
    timeout?: number

    // Static data configuration
    data?: any

    // WebSocketConfiguration
    wsUrl?: string
    reconnect?: boolean

    // Script configuration
    script?: string
    context?: Record<string, any>

    [key: string]: any
  }
  // Data filtering path（likeJSONPath）
  filterPath?: string
  // Data processing script
  processScript?: string
}

/**
 * Component data requirements
 */
export interface ComponentDataRequirement {
  /** componentsID */
  componentId: string
  /** Component type */
  componentType: string
  /** Data source list */
  dataSources: DataSourceDefinition[]
  /** Whether to enable */
  enabled: boolean
}

/**
 * Data execution results
 */
export interface DataExecutionResult {
  /** Is it successful? */
  success: boolean
  /** Data content */
  data?: any
  /** error message */
  error?: string
  /** Execution time（millisecond） */
  executionTime: number
  /** Timestamp */
  timestamp: number
}

/**
 * Component data status
 */
export interface ComponentDataState {
  /** componentsID */
  componentId: string
  /** Component type */
  componentType: string
  /** current data */
  currentData: Record<string, any>
  /** Last updated */
  lastUpdated: number
  /** Is loading */
  loading: boolean
  /** error message */
  error?: string
  /** Data source status */
  dataSourceStates: Record<
    string,
    {
      lastExecuted: number
      success: boolean
      error?: string
    }
  >
}

/**
 * data update event
 */
export interface DataUpdateEvent {
  componentId: string
  dataSourceId?: string
  oldData?: any
  newData: any
  timestamp: number
}

/**
 * Component runtime data manager interface
 * Responsibilities：
 * 1. Get and process data according to configuration
 * 2. Manage data caching and update policies
 * 3. Provide simple data conversion functions
 * 4. Notify component of data changes
 *
 * design principles：
 * - Simple and direct，No complex state management
 * - none轮询、noneWebSocketHeavy-duty features like connection pooling
 * - Only handle basicHTTPRequests and static data
 * - error tolerance，Does not block the interface
 */
export interface IComponentDataManager {
  // --- Data requirements management ---

  /**
   * Register component data requirements
   */
  registerComponent(requirement: ComponentDataRequirement): void

  /**
   * Unregister component data requirements
   */
  unregisterComponent(componentId: string): void

  /**
   * Update component data requirements
   */
  updateComponentRequirement(requirement: ComponentDataRequirement): void

  /**
   * Get component data requirements
   */
  getComponentRequirement(componentId: string): ComponentDataRequirement | null

  // --- data execution ---

  /**
   * Execution component data acquisition（manual trigger）
   */
  executeComponent(componentId: string): Promise<DataExecutionResult>

  /**
   * Execute specific data source
   */
  executeDataSource(componentId: string, dataSourceId: string): Promise<DataExecutionResult>

  /**
   * Execute multiple components in batches
   */
  executeMultipleComponents(componentIds: string[]): Promise<Record<string, DataExecutionResult>>

  // --- Data status query ---

  /**
   * Get the current data of the component
   */
  getComponentData(componentId: string): Record<string, any> | null

  /**
   * Get component data status
   */
  getComponentState(componentId: string): ComponentDataState | null

  /**
   * Get all component status
   */
  getAllStates(): Record<string, ComponentDataState>

  // --- Data cache management ---

  /**
   * Clear component data cache
   */
  clearComponentCache(componentId: string): void

  /**
   * clear all cache
   */
  clearAllCache(): void

  /**
   * Set cache expiration time（millisecond）
   */
  setCacheExpiry(milliseconds: number): void

  // --- event listening ---

  /**
   * Monitor data updates
   */
  onDataUpdate(listener: (event: DataUpdateEvent) => void): () => void

  /**
   * Monitor specific component data updates
   */
  onComponentDataUpdate(componentId: string, listener: (event: DataUpdateEvent) => void): () => void

  // --- Statistics ---

  /**
   * Get simple statistics
   */
  getStats(): {
    totalComponents: number
    activeComponents: number
    totalExecutions: number
    lastUpdate: number | null
  }

  /**
   * Clean up resources
   */
  destroy(): void
}
