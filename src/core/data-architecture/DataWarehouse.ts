/**
 * Enhance data warehouse system (Enhanced Data Warehouse)
 * SUBTASK-003: Data warehouse optimization and enhancement
 *
 * Core functions:
 * 1. Multiple data sources data isolation storage
 * 2. Performance optimization and memory management
 * 3. Dynamic parameter storage management（reserved）
 * 4. Cache strategy and expiration management
 */

import type { ComponentDataRequirement } from '@/core/data-architecture/SimpleDataBridge'
import { dataSourceLogger } from '@/utils/logger'
import { ref, reactive, type Ref } from 'vue'

/**
 * Data storage item interface
 */
export interface DataStorageItem {
  /** Data content */
  data: any
  /** Store timestamp */
  timestamp: number
  /** Expiration timestamp */
  expiresAt?: number
  /** Data source information */
  source: {
    /** data sourceID */
    sourceId: string
    /** Data source type */
    sourceType: string
    /** componentsID */
    componentId: string
  }
  /** Data size（byte） */
  size: number
  /** Visits */
  accessCount: number
  /** last access time */
  lastAccessed: number
  /** 🔥 New：Data version number */
  dataVersion?: string
  /** 🔥 New：implementID */
  executionId?: string
}

/**
 * Component data storage structure
 */
export interface ComponentDataStorage {
  /** componentsID */
  componentId: string
  /** Data source data mapping */
  dataSources: Map<string, DataStorageItem>
  /** Merged data（cache） */
  mergedData?: DataStorageItem
  /** Component creation time */
  createdAt: number
  /** Last updated */
  updatedAt: number
}

/**
 * Dynamic parameter storage interface（reservedPhase 2use）
 */
export interface DynamicParameterStorage {
  /** Parameter name */
  name: string
  /** Parameter value */
  value: any
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  /** Scope */
  scope: 'global' | 'component' | 'session'
  /** Expiration time */
  expiresAt?: number
  /** Dependencies */
  dependencies?: string[]
}

/**
 * Warehouse configuration options
 */
export interface DataWarehouseConfig {
  /** Default cache expiration time（millisecond） */
  defaultCacheExpiry: number
  /** Maximum memory usage（MB） */
  maxMemoryUsage: number
  /** Cleanup check interval（millisecond） */
  cleanupInterval: number
  /** Maximum number of storage items */
  maxStorageItems: number
  /** Enable performance monitoring */
  enablePerformanceMonitoring: boolean
}

/**
 * Performance monitoring data
 */
export interface PerformanceMetrics {
  /** Total memory usage（MB） */
  memoryUsage: number
  /** Number of storage items */
  itemCount: number
  /** Number of components */
  componentCount: number
  /** average response time（ms） */
  averageResponseTime: number
  /** Cache hit rate */
  cacheHitRate: number
  /** Last cleanup time */
  lastCleanupTime: number
}

/**
 * Enhanced data warehouse class
 * Provides multiple data source isolation storage and performance optimization functions
 */
export class EnhancedDataWarehouse {
  /** Component data storage */
  private componentStorage = new Map<string, ComponentDataStorage>()

  /** 🔥 Component-level reactive notifier：Avoid performance problems caused by global responsiveness */
  private componentChangeNotifiers = new Map<string, any>()

  /** 🔥 Remove global notifier，Avoid all components responding to data changes in any component */
  // private dataChangeNotifier = ref(0) // Removed，Use component-level notifiers instead

  /** 🔥 New：Component latest data version tracking */
  private componentLatestVersions = new Map<string, string>()

  /** Dynamic parameter storage（reserved） */
  private parameterStorage = new Map<string, DynamicParameterStorage>()

  /** Warehouse configuration */
  private config: DataWarehouseConfig

  /** Performance monitoring data */
  private metrics: PerformanceMetrics

  /** Cleanup timer */
  private cleanupTimer: NodeJS.Timeout | null = null

  /** Performance monitoring timer */
  private metricsTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<DataWarehouseConfig> = {}) {
    // Initial configuration
    this.config = {
      defaultCacheExpiry: 5 * 60 * 1000, // 5minute
      maxMemoryUsage: 100, // 100MB
      cleanupInterval: 60 * 1000, // 1minute
      maxStorageItems: 1000,
      enablePerformanceMonitoring: true,
      ...config
    }

    // Initialize performance monitoring data
    this.metrics = {
      memoryUsage: 0,
      itemCount: 0,
      componentCount: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      lastCleanupTime: Date.now()
    }

    // Start regular cleanup
    this.startCleanupTimer()

    // Start performance monitoring
    if (this.config.enablePerformanceMonitoring) {
      this.startMetricsCollection()
    }
  }

  /**
   * Store component data
   * @param componentId componentsID
   * @param sourceId data sourceID
   * @param data Data content
   * @param sourceType Data source type
   * @param customExpiry Custom expiration time
   */
  storeComponentData(
    componentId: string,
    sourceId: string,
    data: any,
    sourceType: string = 'unknown',
    customExpiry?: number
  ): void {
    const now = Date.now()
    const startTime = now

    // 🔥 critical fix：Add data value checking and execution sequence number tracking
    const dataValue = this.extractDataValue(data)
    const executionId = `${componentId}-${now}-${Math.random().toString(36).substr(2, 9)}`

    // 🔥 New：version control mechanism，Prevent expired data from overwriting new data
    const dataVersion = this.generateDataVersion(componentId, data)
    if (!this.shouldAcceptData(componentId, dataVersion)) {
      return
    }


    // 🔥 Temporary debugging：Detailed documentation of stored procedures，Contains execution trace
    ;(window as any).debugLastStorage = {
      componentId,
      sourceId,
      data,
      dataValue,
      sourceType,
      timestamp: now,
      executionId,
      step: 'start'
    }

    // Calculate data size（Estimate）
    const dataSize = this.calculateDataSize(data)

    // Check memory limits
    if (this.shouldRejectStorage(dataSize)) {
      ;(window as any).debugLastStorage.step = 'rejected'
      return
    }

    // Get or create component storage
    let componentStorage = this.componentStorage.get(componentId)
    if (!componentStorage) {
      componentStorage = {
        componentId,
        dataSources: new Map(),
        createdAt: now,
        updatedAt: now
      }
      this.componentStorage.set(componentId, componentStorage)
      ;(window as any).debugLastStorage.step = 'created_storage'
    }

    // Create storage item
    const storageItem: DataStorageItem = {
      data,
      timestamp: now,
      expiresAt: customExpiry ? now + customExpiry : now + this.config.defaultCacheExpiry,
      source: {
        sourceId,
        sourceType,
        componentId
      },
      size: dataSize,
      accessCount: 0,
      lastAccessed: now,
      // 🔥 New：Data versioning fields
      dataVersion,
      executionId
    }

    // Store data
    componentStorage.dataSources.set(sourceId, storageItem)
    componentStorage.updatedAt = now

    // Clear merge data cache（Because the data source changes）
    if (componentStorage.mergedData) {
      componentStorage.mergedData = undefined
    }

    // Update the latest data version of the component
    this.updateLatestDataVersion(componentId, dataVersion)


    // 🔥 Temporary debugging：Verify stored results，Contains data value tracking
    const verification = this.componentStorage.get(componentId)
    const storedData = verification?.dataSources.get(sourceId)?.data
    const storedValue = this.extractDataValue(storedData)
    ;(window as any).debugLastStorage.step = 'stored'
    ;(window as any).debugLastStorage.verification = verification

    // 🔥 critical fix：Only trigger responsive updates for this component，Avoid global recalculation
    let componentNotifier = this.componentChangeNotifiers.get(componentId)
    if (!componentNotifier) {
      componentNotifier = ref(0)
      this.componentChangeNotifiers.set(componentId, componentNotifier)
    }
    const oldValue = componentNotifier.value
    componentNotifier.value++

    // 🚨 Force debugging：Reactive update trigger

    // 🔥 Remove global notifier completely，Avoid triggering invalid recalculation of all components
    // this.dataChangeNotifier.value++ // Removed，avoid"Thousands of times"Repeat printing problem

    // 🔥 Remove circular print log，avoid200+Performance issues in component scenarios
    // DataWarehouse Storage operations should be silent，Avoid log explosion when there are a large number of components

    // Update performance monitoring
    const responseTime = Date.now() - startTime
    this.updateMetrics(responseTime, 'store')

    // 🔥 Temporary debugging：final status check
    const finalStats = this.getStorageStats()
    ;(window as any).debugLastStorage.finalStats = finalStats
  }

  /**
   * Get component data
   * @param componentId componentsID
   * @returns Component complete data ornull
   */
  getComponentData(componentId: string): Record<string, any> | null {
    const startTime = Date.now()

    // 🔥 critical fix：Use component-level reactivity，Recalculate only when the component's data is updated
    let componentNotifier = this.componentChangeNotifiers.get(componentId)
    if (!componentNotifier) {
      componentNotifier = ref(0)
      this.componentChangeNotifiers.set(componentId, componentNotifier)
    }
    // 🔥 critical fix：Access component-level notifiers，Build precise reactive dependencies
    // This ensures that it is only recalculated when that component's data is updated，instead of all components
    const changeNotifier = componentNotifier.value

    // 🚨 Force debugging：Responsive dependency access

    const componentStorage = this.componentStorage.get(componentId)
    if (!componentStorage) {
      // 🔥 Performance optimization：Reduce meaningless log output，avoid in200+Log explosion in component scenario
      // It is normal for a component to have no data.，No need to print every time
      this.updateMetrics(Date.now() - startTime, 'get', false)
      return null
    }

    // Check if there is cached merged data
    if (componentStorage.mergedData && !this.isExpired(componentStorage.mergedData)) {
      const cachedValue = this.extractDataValue(componentStorage.mergedData.data)
      componentStorage.mergedData.accessCount++
      componentStorage.mergedData.lastAccessed = Date.now()
      this.updateMetrics(Date.now() - startTime, 'get', true)
      // 🔥 Performance optimization：Reduce duplicate logs，avoid68Each component prints the cache acquisition log every time
      return componentStorage.mergedData.data
    }

    // Build component data objects
    const componentData: Record<string, any> = {}
    let hasValidData = false


    for (const [sourceId, item] of componentStorage.dataSources) {
      if (!this.isExpired(item)) {
        componentData[sourceId] = item.data
        item.accessCount++
        item.lastAccessed = Date.now()
        hasValidData = true
        const itemValue = this.extractDataValue(item.data)
      } else {
        componentStorage.dataSources.delete(sourceId)
      }
    }

    if (!hasValidData) {
      // 🔥 Performance optimization：It is normal for a component to have no data.，No need to print error log every time
      this.updateMetrics(Date.now() - startTime, 'get', false)
      return null
    }

    this.updateMetrics(Date.now() - startTime, 'get', true)

    // 🔥 repair：if there is complete data source，Unpack the actual data inside
    const sourceIds = Object.keys(componentData)

    // 🔥 critical fix：Handle data unpacking，Get the final data to be returned
    let finalData = componentData

    // if there is complete data source，解包其中的data source数据
    if ('complete' in componentData && componentData.complete) {
      const completeData = componentData.complete

      // examine complete Does it contain deviceData
      if (completeData.deviceData && completeData.deviceData.data) {
        finalData = completeData.deviceData.data
      } else {
        // If it is not a standard structure，return complete the direct content of
        finalData = completeData
      }
    }

    // 🔥 critical fix：Cache the final unpacked data，instead of raw packed data
    componentStorage.mergedData = {
      data: finalData,  // Cache the final unpacked data
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.defaultCacheExpiry,
      source: {
        sourceId: '*merged*',
        sourceType: 'merged',
        componentId
      },
      size: this.calculateDataSize(finalData),
      accessCount: 1,
      lastAccessed: Date.now()
    }

    const finalValue = this.extractDataValue(finalData)
    return finalData
  }

  // ==================== Add new tool method ====================

  /**
   * 🔥 New：Generate data version number
   */
  private generateDataVersion(componentId: string, data: any): string {
    const dataHash = this.calculateDataHash(data)
    const timestamp = Date.now()
    return `${componentId}-${timestamp}-${dataHash}`
  }

  /**
   * 🔥 New：Check if data should be accepted（version control）
   */
  private shouldAcceptData(componentId: string, dataVersion: string): boolean {
    const latestVersion = this.componentLatestVersions.get(componentId)
    if (!latestVersion) {
      return true // first save，Accept directly
    }

    // Extract timestamps for comparison
    const currentTimestamp = this.extractTimestampFromVersion(dataVersion)
    const latestTimestamp = this.extractTimestampFromVersion(latestVersion)

    return currentTimestamp >= latestTimestamp
  }

  /**
   * 🔥 New：Update the latest data version
   */
  private updateLatestDataVersion(componentId: string, dataVersion: string): void {
    this.componentLatestVersions.set(componentId, dataVersion)
  }

  /**
   * 🔥 New：Extract timestamp from version number
   */
  private extractTimestampFromVersion(version: string): number {
    const parts = version.split('-')
    if (parts.length >= 2) {
      return parseInt(parts[1]) || 0
    }
    return 0
  }

  /**
   * 🔥 New：Calculate data hash value
   */
  private calculateDataHash(data: any): string {
    try {
      const dataString = JSON.stringify(data)
      let hash = 0
      for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to32bit integer
      }
      return Math.abs(hash).toString(36)
    } catch (error) {
      return Math.random().toString(36).substr(2, 9)
    }
  }

  /**
   * 🔥 New：Extract key values ​​from data（for debugging trace）
   * Intelligently extract core values ​​from various data structures
   */
  private extractDataValue(data: any): any {
    if (!data) return undefined

    // Try many possible numeric fields
    const possibleFields = ['value', 'val', 'data', 'result', 'number', 'count']

    // direct numerical value
    if (typeof data === 'number') return data

    // Numeric fields in objects
    if (typeof data === 'object' && data !== null) {
      for (const field of possibleFields) {
        if (data[field] !== undefined) {
          return data[field]
        }
      }

      // Check nested structures
      if (data.deviceData?.data?.value !== undefined) {
        return data.deviceData.data.value
      }

      // If it is an array，Try to extract the value of the first element
      if (Array.isArray(data) && data.length > 0) {
        return this.extractDataValue(data[0])
      }
    }

    return data
  }

  /**
   * Get data from a single data source
   * @param componentId componentsID
   * @param sourceId data sourceID
   * @returns data source data ornull
   */
  getDataSourceData(componentId: string, sourceId: string): any {
    const componentStorage = this.componentStorage.get(componentId)
    if (!componentStorage) {
      return null
    }

    const item = componentStorage.dataSources.get(sourceId)
    if (!item || this.isExpired(item)) {
      if (item) {
        componentStorage.dataSources.delete(sourceId)
      }
      return null
    }

    item.accessCount++
    item.lastAccessed = Date.now()
    return item.data
  }

  /**
   * Clear component cache
   * @param componentId componentsID
   */
  clearComponentCache(componentId: string): void {
    const componentStorage = this.componentStorage.get(componentId)
    if (componentStorage) {
      this.componentStorage.delete(componentId)
      // 🔥 critical fix：Also clean up component-level reactive notifiers，Avoid memory leaks
      this.componentChangeNotifiers.delete(componentId)
    }
  }

  /**
   * 🔥 Force clearing of a component's merged data cache，Keep dependencies responsive
   * @param componentId componentsID
   */
  clearComponentMergedCache(componentId: string): void {
    const componentStorage = this.componentStorage.get(componentId)
    if (componentStorage) {
      // 🔥 critical fix：Clear merge cache unconditionally，Solving concurrent timing issues
      const hadCache = !!componentStorage.mergedData
      componentStorage.mergedData = undefined


      // 🔥 key：Trigger responsive updates regardless of cache，Make sure the component re-fetches data
      let componentNotifier = this.componentChangeNotifiers.get(componentId)
      if (!componentNotifier) {
        componentNotifier = ref(0)
        this.componentChangeNotifiers.set(componentId, componentNotifier)
      }
      componentNotifier.value++
    } else {
    }
  }

  /**
   * Clear data source cache
   * @param componentId componentsID
   * @param sourceId data sourceID
   */
  clearDataSourceCache(componentId: string, sourceId: string): void {
    const componentStorage = this.componentStorage.get(componentId)
    if (componentStorage) {
      const removed = componentStorage.dataSources.delete(sourceId)
      if (removed) {
        // Clear merge data cache
        componentStorage.mergedData = undefined
        // 🔥 critical fix：Only trigger responsive updates for this component
        const componentNotifier = this.componentChangeNotifiers.get(componentId)
        if (componentNotifier) {
          componentNotifier.value++
        }
      }
    }
  }

  /**
   * clear all cache
   */
  clearAllCache(): void {
    const componentCount = this.componentStorage.size
    this.componentStorage.clear()
    this.parameterStorage.clear()
    // 🔥 critical fix：Also clean up all component-level reactive notifiers，Avoid memory leaks
    this.componentChangeNotifiers.clear()
  }

  /**
   * Set cache expiration time
   * @param milliseconds Expiration time（millisecond）
   */
  setCacheExpiry(milliseconds: number): void {
    this.config.defaultCacheExpiry = milliseconds
  }

  /**
   * Get performance monitoring data
   */
  getPerformanceMetrics(): PerformanceMetrics {
    this.updateCurrentMetrics()
    return { ...this.metrics }
  }

  /**
   * Get storage statistics
   */
  getStorageStats() {
    let totalItems = 0
    let totalSize = 0
    const componentStats: Record<string, any> = {}

    for (const [componentId, storage] of this.componentStorage) {
      const componentSize = Array.from(storage.dataSources.values()).reduce((sum, item) => sum + item.size, 0)

      componentStats[componentId] = {
        dataSourceCount: storage.dataSources.size,
        totalSize: componentSize,
        createdAt: storage.createdAt,
        updatedAt: storage.updatedAt
      }

      totalItems += storage.dataSources.size
      totalSize += componentSize
    }

    return {
      totalComponents: this.componentStorage.size,
      totalDataSources: totalItems,
      totalSize,
      memoryUsageMB: totalSize / (1024 * 1024),
      componentStats,
      config: this.config
    }
  }

  /**
   * reserved：Store dynamic parameters（Phase 2use）
   */
  storeDynamicParameter(name: string, parameter: DynamicParameterStorage): void {
    this.parameterStorage.set(name, parameter)
  }

  /**
   * reserved：Get dynamic parameters（Phase 2use）
   */
  getDynamicParameter(name: string): DynamicParameterStorage | null {
    const param = this.parameterStorage.get(name)
    if (param && param.expiresAt && Date.now() > param.expiresAt) {
      this.parameterStorage.delete(name)
      return null
    }
    return param || null
  }

  /**
   * Destroy data warehouse
   */
  destroy(): void {
    // Stop timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer)
      this.metricsTimer = null
    }

    // Clear all data（Component-level reactive notifier cleanup included）
    this.clearAllCache()
  }

  // ==================== private method ====================

  /**
   * Check if the data item is expired
   */
  private isExpired(item: DataStorageItem): boolean {
    return item.expiresAt !== undefined && Date.now() > item.expiresAt
  }

  /**
   * Calculate data size（Estimate）
   */
  private calculateDataSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2 // Rough estimateUTF-16Number of bytes
    } catch {
      return 1024 // default1KB
    }
  }

  /**
   * Check if storage should be denied（memory limit）
   */
  private shouldRejectStorage(dataSize: number): boolean {
    const currentMemoryMB = this.getCurrentMemoryUsage()
    const newDataMB = dataSize / (1024 * 1024)

    return (
      currentMemoryMB + newDataMB > this.config.maxMemoryUsage ||
      this.getTotalItemCount() >= this.config.maxStorageItems
    )
  }

  /**
   * Get current memory usage（MB）
   */
  private getCurrentMemoryUsage(): number {
    let totalSize = 0
    for (const storage of this.componentStorage.values()) {
      for (const item of storage.dataSources.values()) {
        totalSize += item.size
      }
      if (storage.mergedData) {
        totalSize += storage.mergedData.size
      }
    }
    return totalSize / (1024 * 1024)
  }

  /**
   * Get the total number of stored items
   */
  private getTotalItemCount(): number {
    let count = 0
    for (const storage of this.componentStorage.values()) {
      count += storage.dataSources.size
      if (storage.mergedData) count++
    }
    return count
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * Perform cleanup operations
   */
  private performCleanup(): void {
    const startTime = Date.now()
    let removedItems = 0
    let removedComponents = 0

    // Clean up expired data
    for (const [componentId, storage] of this.componentStorage) {
      let hasValidData = false

      // Clean data source
      for (const [sourceId, item] of storage.dataSources) {
        if (this.isExpired(item)) {
          storage.dataSources.delete(sourceId)
          removedItems++
        } else {
          hasValidData = true
        }
      }

      // Clean merge data cache
      if (storage.mergedData && this.isExpired(storage.mergedData)) {
        storage.mergedData = undefined
        removedItems++
      }

      // If the component does not have valid data，Remove entire component
      if (!hasValidData && !storage.mergedData) {
        this.componentStorage.delete(componentId)
        removedComponents++
      }
    }

    // Memory pressure cleanup：Remove least accessed data
    if (this.getCurrentMemoryUsage() > this.config.maxMemoryUsage * 0.8) {
      const itemsToRemove = this.getLeastAccessedItems(10)
      itemsToRemove.forEach(({ componentId, sourceId }) => {
        this.clearDataSourceCache(componentId, sourceId)
        removedItems++
      })
    }

    this.metrics.lastCleanupTime = Date.now()
  }

  /**
   * Get the least accessed data items
   */
  private getLeastAccessedItems(count: number): Array<{ componentId: string; sourceId: string }> {
    const allItems: Array<{ componentId: string; sourceId: string; accessCount: number; lastAccessed: number }> = []

    for (const [componentId, storage] of this.componentStorage) {
      for (const [sourceId, item] of storage.dataSources) {
        allItems.push({
          componentId,
          sourceId,
          accessCount: item.accessCount,
          lastAccessed: item.lastAccessed
        })
      }
    }

    // Sort by number of visits and last visit time
    allItems.sort((a, b) => {
      if (a.accessCount !== b.accessCount) {
        return a.accessCount - b.accessCount
      }
      return a.lastAccessed - b.lastAccessed
    })

    return allItems.slice(0, count)
  }

  /**
   * Start performance monitoring
   */
  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.updateCurrentMetrics()
    }, 30000) // 30Update once every second
  }

  /**
   * Update current monitoring data
   */
  private updateCurrentMetrics(): void {
    this.metrics.memoryUsage = this.getCurrentMemoryUsage()
    this.metrics.itemCount = this.getTotalItemCount()
    this.metrics.componentCount = this.componentStorage.size
  }

  /**
   * Update performance monitoring metrics
   */
  private updateMetrics(responseTime: number, operation: 'store' | 'get', cacheHit?: boolean): void {
    // Update average response time
    this.metrics.averageResponseTime = (this.metrics.averageResponseTime + responseTime) / 2

    // Update cache hit rate
    if (operation === 'get' && cacheHit !== undefined) {
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate + (cacheHit ? 1 : 0)) / 2
    }
  }
}

/**
 * Default configured data warehouse instance
 */
export const dataWarehouse = new EnhancedDataWarehouse()

// 🔥 Temporary debugging：Exposed to the whole world
if (typeof window !== 'undefined') {
  ;(window as any).debugDataWarehouse = dataWarehouse
}

/**
 * Create a custom configured data warehouse instance
 */
export function createDataWarehouse(config: Partial<DataWarehouseConfig> = {}): EnhancedDataWarehouse {
  return new EnhancedDataWarehouse(config)
}
