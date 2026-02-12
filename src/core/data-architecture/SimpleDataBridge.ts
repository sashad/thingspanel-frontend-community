/**
 * Simplified data bridge (SimpleDataBridge)
 * replace complexComponentExecutorManager，Provide lightweight configuration→data conversion
 *
 * 🔥 Task 2.1 Correction：integrated MultiLayerExecutorChain，Three-tier architecture in line with requirements documents
 *
 * design principles：
 * 1. Single responsibility：Only perform configuration format conversion and execution coordination
 * 2. Stateless management：Do not track execution history、Statistics
 * 3. Architecture compliance：Use multi-layered executor chains consistent with requirements documentation
 * 4. event driven：Communicate with external systems through callback functions
 * 5. executor delegate：useMultiLayerExecutorChainConduct a complete data processing pipeline
 */

// 🔥 Task 2.1 Correction: Import multi-layer executor chain（Three-tier architecture in line with requirements documents）
import {
  MultiLayerExecutorChain,
  type DataSourceConfiguration,
  type ExecutionResult
} from './executors/MultiLayerExecutorChain'

// 🆕 SUBTASK-003: Import enhanced data warehouse
import { dataWarehouse, type EnhancedDataWarehouse } from '@/core/data-architecture/DataWarehouse'

/**
 * Simplified data source configuration
 */
export interface SimpleDataSourceConfig {
  /** data sourceID */
  id: string
  /** Data source type */
  type: 'static' | 'http' | 'json' | 'websocket' | 'file' | 'data-source-bindings'
  /** Configuration options */
  config: {
    // static data
    data?: any
    // HTTPConfiguration
    url?: string
    method?: 'GET' | 'POST'
    headers?: Record<string, string>
    timeout?: number
    [key: string]: any
  }
  /** 🔥 New：filter path（JSONPath grammar） */
  filterPath?: string
  /** 🔥 New：Custom processing script */
  processScript?: string
}

/**
 * Data execution results
 */
export interface DataResult {
  /** Is it successful? */
  success: boolean
  /** Data content */
  data?: any
  /** error message */
  error?: string
  /** Execution timestamp */
  timestamp: number
}

/**
 * Component data requirements
 */
export interface ComponentDataRequirement {
  /** componentsID */
  componentId: string
  /** Data source configuration list */
  dataSources: SimpleDataSourceConfig[]
}

/**
 * Data update callback type
 */
export type DataUpdateCallback = (componentId: string, data: Record<string, any>) => void

/**
 * Simplified data bridge class
 * Only the most basic configuration is provided→Data conversion function
 */
export class SimpleDataBridge {
  /** ✅ simplify：Remove complex call counting and deduplication caching */
  /** Data update callback list */
  private callbacks = new Set<DataUpdateCallback>()

  /** Data warehouse example */
  private warehouse: EnhancedDataWarehouse = dataWarehouse

  /** 🔥 Multi-layer executor chain example（Comply with the requirements document structure） */
  private executorChain = new MultiLayerExecutorChain()

  /**
   * Execution component data acquisition
   * 🔥 Refactor: use MultiLayerExecutorChain Replace decentralized execution logic
   * @param requirement Component data requirements
   * @returns Execution result
   */
  async executeComponent(requirement: ComponentDataRequirement): Promise<DataResult> {
    // ✅ simplify：Direct execution，Remove complex deduplication and counting logic
    return await this.doExecuteComponent(requirement, Date.now(), 'direct-call')
  }

  /**
   * The actual component execution logic（fromexecuteComponentextracted from）
   */
  private async doExecuteComponent(requirement: ComponentDataRequirement, startTime: number, callerInfo: string): Promise<DataResult> {
    const executionId = `${requirement.componentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      // 🔥 critical fix：Force cache skip，Make sure you get the latest configuration and data every time
      // The data source must be re-executed after the configuration is modified.，Can't rely on old cache
      this.warehouse.clearComponentCache(requirement.componentId)

      // 🔥 critical fix：Make sure to get the latest configuration snapshot
      const configSnapshot = await this.captureConfigurationSnapshot(requirement.componentId, executionId)
      if (configSnapshot) {
        // Reconstruct data requirements using the latest configuration
        requirement = this.reconstructRequirementFromSnapshot(requirement, configSnapshot)
      }

      // 🔥 Check data format：if it is already DataSourceConfiguration Format，Use directly
      let dataSourceConfig: DataSourceConfiguration

      // 🎯 Print these words as requested by the user - debug：Check format judgment process
      const isDataSourceConfigFormat = this.isDataSourceConfiguration(requirement)

      if (isDataSourceConfigFormat) {
        dataSourceConfig = requirement as any
      } else {

        // 🔥 repair：Check whether it is a double-level nested structure
        if (requirement.dataSources?.[0]?.dataSources) {
          // Double nesting：Get the real configuration of the inner layer
          const innerConfig = requirement.dataSources[0] as any
          dataSourceConfig = {
            componentId: requirement.componentId,
            dataSources: innerConfig.dataSources,
            createdAt: innerConfig.createdAt || Date.now(),
            updatedAt: innerConfig.updatedAt || Date.now()
          }
        } else {
          dataSourceConfig = this.convertToDataSourceConfiguration(requirement)
        }
      }

      // 🎯 Print these words as requested by the user - debug：finally passed toMultiLayerExecutorChainconfiguration
      const enhancedDataSourceConfig = {
        ...dataSourceConfig,
        configHash: this.calculateConfigHash(dataSourceConfig)
      }

      // 🔥 Execute a complete data processing pipeline using a multi-layer executor chain


      const executionResult: ExecutionResult = await this.executorChain.executeDataProcessingChain(
        enhancedDataSourceConfig,
        true
      )

      if (executionResult.success && executionResult.componentData) {

        // 🎯 Print these words as requested by the user - stage1：SimpleDataBridgeData execution completed

        // 🔥 repair：Store data separately for each data source，and store the merged complete data
        if (executionResult.componentData && typeof executionResult.componentData === 'object') {
          // 🔥 critical fix：with executionIDatomic data storage

          // Clear old data first，Store new data（Atomic operations）
          this.warehouse.clearComponentCache(requirement.componentId)

          // Store data from various data sources
          Object.entries(executionResult.componentData).forEach(([sourceId, sourceData]) => {
            this.warehouse.storeComponentData(
              requirement.componentId,
              sourceId,
              sourceData,
              'multi-source'
            )
          })

          // Also stores the complete merged data as a backup
          this.warehouse.storeComponentData(
            requirement.componentId,
            'complete',
            executionResult.componentData,
            'multi-source'
          )
        }

        // Notify data updates
        this.notifyDataUpdate(requirement.componentId, executionResult.componentData)
        return {
          success: true,
          data: executionResult.componentData,
          timestamp: Date.now()
        }
      } else {
        return {
          success: false,
          error: executionResult.error || 'Execution failed',
          timestamp: Date.now()
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: errorMsg,
        timestamp: Date.now()
      }
    }
  }

  /**
   * 🔥 Check if it is DataSourceConfiguration Format
   * @param data Data to be checked
   * @returns Is it DataSourceConfiguration Format
   */
  private isDataSourceConfiguration(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'componentId' in data &&
      'dataSources' in data &&
      Array.isArray(data.dataSources) &&
      data.dataSources.length > 0 &&
      'sourceId' in data.dataSources[0] &&
      'dataItems' in data.dataSources[0] &&
      'mergeStrategy' in data.dataSources[0]
    )
  }

  /**
   * 🔥 New：Convert to DataSourceConfiguration Format
   * Will SimpleDataBridge The configuration format is converted to MultiLayerExecutorChain required format
   * @param requirement Component data requirements
   * @returns DataSourceConfiguration Format configuration
   */
  private convertToDataSourceConfiguration(requirement: ComponentDataRequirement): DataSourceConfiguration {
    const dataSources = requirement.dataSources.map(dataSource => ({
      sourceId: dataSource.id,
      dataItems: [
        {
          item: {
            type: dataSource.type,
            config: dataSource.config
          },
          processing: {
            filterPath: dataSource.filterPath || '$',
            customScript: dataSource.processScript,
            defaultValue: {}
          }
        }
      ],
      mergeStrategy: 'object' as const // Use object merging strategy by default
    }))

    return {
      componentId: requirement.componentId,
      dataSources,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  // 🗑️ Task 2.1: Remove duplicate executor implementations
  // executeStaticDataSource and executeHttpDataSource Already UnifiedDataExecutor Unified processing

  /**
   * Check that the configuration contains valid data items
   * @param requirement Data requirements configuration
   * @returns Is there a valid data item?
   */
  private hasValidDataItems(requirement: ComponentDataRequirement): boolean {
    try {
      // in the case of DataSourceConfiguration Format
      if (this.isDataSourceConfiguration(requirement)) {
        const config = requirement as any as DataSourceConfiguration
        return config.dataSources?.some(dataSource => dataSource.dataItems && dataSource.dataItems.length > 0) || false
      }

      // If it is other format，Check if there is data source configuration
      const hasDataSources =
        requirement.dataSources &&
        Object.values(requirement.dataSources).some(
          dataSource => dataSource && Array.isArray(dataSource.dataItems) && dataSource.dataItems.length > 0
        )

      return hasDataSources || false
    } catch (error) {
      return true // Return conservatively on error true，Avoid accidentally deleting cache
    }
  }

  /**
   * Notify data updates
   * @param componentId componentsID
   * @param data data
   */
  private notifyDataUpdate(componentId: string, data: Record<string, any>): void {
    this.callbacks.forEach(callback => {
      try {
        callback(componentId, data)
      } catch (error) {}
    })
  }

  /**
   * Register data update callback
   * @param callback callback function
   * @returns Unregister function
   */
  onDataUpdate(callback: DataUpdateCallback): () => void {
    this.callbacks.add(callback)

    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * 🆕 SUBTASK-003: Get component data（cache interface）
   * @param componentId componentsID
   * @returns component data ornull
   */
  getComponentData(componentId: string): Record<string, any> | null {
    return this.warehouse.getComponentData(componentId)
  }

  /**
   * 🆕 SUBTASK-003: Clear component cache
   * @param componentId componentsID
   */
  clearComponentCache(componentId: string): void {
    this.warehouse.clearComponentCache(componentId)
  }

  /**
   * 🆕 SUBTASK-003: clear all cache
   */
  clearAllCache(): void {
    this.warehouse.clearAllCache()
  }

  /**
   * 🆕 SUBTASK-003: Set cache expiration time
   * @param milliseconds Expiration time（millisecond）
   */
  setCacheExpiry(milliseconds: number): void {
    this.warehouse.setCacheExpiry(milliseconds)
  }

  /**
   * 🆕 SUBTASK-003: Get data warehouse performance metrics
   */
  getWarehouseMetrics() {
    return this.warehouse.getPerformanceMetrics()
  }

  /**
   * 🆕 SUBTASK-003: Get storage statistics
   */
  getStorageStats() {
    return this.warehouse.getStorageStats()
  }

  /**
   * Get simple statistics
   * 🆕 SUBTASK-003: Enhance statistics，Contains data warehouse data
   */
  getStats() {
    const warehouseStats = this.warehouse.getStorageStats()
    return {
      activeCallbacks: this.callbacks.size,
      timestamp: Date.now(),
      warehouse: {
        totalComponents: warehouseStats.totalComponents,
        totalDataSources: warehouseStats.totalDataSources,
        memoryUsageMB: warehouseStats.memoryUsageMB
      }
    }
  }

  /**
   * 🔥 New：Verify configuration integrity before execution，special inspectionHTTPParameter binding path
   */
  private validateConfigBeforeExecution(config: DataSourceConfiguration): void {

    config.dataSources.forEach((dataSource, dsIndex) => {

      dataSource.dataItems.forEach((dataItem, itemIndex) => {
        const { item } = dataItem

        // 🚨 special inspectionHTTPtype parameters
        if (item.type === 'http' && item.config) {
          const httpConfig = item.config

          // Check all parameter sources
          const allParams = [
            ...(httpConfig.params || []).map(p => ({ source: 'params', param: p })),
            ...(httpConfig.parameters || []).map(p => ({ source: 'parameters', param: p })),
            ...(httpConfig.pathParams || []).map(p => ({ source: 'pathParams', param: p }))
          ]

          allParams.forEach(({ source, param }, paramIndex) => {

            // 🚨 Detecting broken binding paths
            if (param.value && typeof param.value === 'string') {
              const isSuspiciousPath = !param.value.includes('.') && param.value.length < 10 && param.variableName

              if (isSuspiciousPath) {
                console.error(`🚨 [SimpleDataBridge] passing toMultiLayerExecutorChainCorrupted binding path found before!`, {
                  dataSourceIndex: dsIndex,
                  dataItemIndex: itemIndex,
                  parameterSource: source,
                  parameterIndex: paramIndex,
                  parameterKey: param.key,
                  damagedValue: param.value,
                  variableName: param.variableName,
                  detectionTimestamp: Date.now(),
                  stackTrace: new Error().stack
                })
              } else {
              }
            }
          })
        }
      })
    })

  }

  /**
   * 🔥 New：Capture configuration snapshot，Ensure execution with consistent configuration
   */
  private async captureConfigurationSnapshot(componentId: string, executionId: string): Promise<{ config: any; timestamp: number } | null> {
    try {
      // 🔥 repair：Use dynamic import insteadrequire
      const { configurationIntegrationBridge } = await import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
      const config = configurationIntegrationBridge.getConfiguration(componentId)

      if (config) {
        const snapshot = {
          config: JSON.parse(JSON.stringify(config)), // deep copy
          timestamp: Date.now()
        }
        return snapshot
      }
      return null
    } catch (error) {
      console.error(`❌ [SimpleDataBridge] [${executionId}] Configuration snapshot capture failed:`, error)
      return null
    }
  }

  /**
   * 🔥 New：Reconstruct data requirements based on configuration snapshots
   */
  private reconstructRequirementFromSnapshot(
    originalRequirement: ComponentDataRequirement,
    snapshot: { config: any; timestamp: number }
  ): ComponentDataRequirement {
    // If the snapshot contains the complete data source configuration，Refactor using snapshots
    if (snapshot.config.dataSource) {
      return {
        ...originalRequirement,
        dataSources: this.convertSnapshotToDataSources(snapshot.config)
      }
    }
    return originalRequirement
  }

  /**
   * 🔥 New：Convert configuration snapshot to data source format
   */
  private convertSnapshotToDataSources(config: any): any[] {
    // Convert to standard data source format according to configuration structure
    if (config.dataSource && config.dataSource.dataSources) {
      return config.dataSource.dataSources
    }
    return []
  }

  /**
   * 🔥 New：Calculate configuration hash，Used to detect configuration changes
   */
  private calculateConfigHash(config: any): string {
    try {
      const configString = JSON.stringify(config)
      let hash = 0
      for (let i = 0; i < configString.length; i++) {
        const char = configString.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to32bit integer
      }
      return Math.abs(hash).toString(36)
    } catch (error) {
      return Date.now().toString(36)
    }
  }

  /**
   * Clean up resources
   * 🆕 SUBTASK-003: Also destroy the data warehouse
   */
  destroy(): void {
    this.callbacks.clear()
    this.warehouse.destroy()
  }
}

/**
 * Export global singleton instance
 */
export const simpleDataBridge = new SimpleDataBridge()

/**
 * Create a new data bridge instance
 */
export function createSimpleDataBridge(): SimpleDataBridge {
  return new SimpleDataBridge()
}

/**
 * Development environment automatic verification
 * Output in console Phase 2 Architecture status information
 */
