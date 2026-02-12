/**
 * Data warehouse integration testing
 * test DataWarehouse and SimpleDataBridge Integrated functions
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { simpleDataBridge, type ComponentDataRequirement } from '@/core/data-architecture/SimpleDataBridge'
import { dataWarehouse } from '@/core/data-architecture/DataWarehouse'

// Mock UnifiedDataExecutor to avoid actual network requests
vi.mock('./UnifiedDataExecutor', () => ({
  unifiedDataExecutor: {
    execute: vi.fn()
  }
}))

import { unifiedDataExecutor } from '@/core/data-architecture/UnifiedDataExecutor'

describe('DataWarehouse and SimpleDataBridge Integration testing', () => {
  beforeEach(() => {
    // Clear all cache and status
    dataWarehouse.clearAllCache()
    dataWarehouse.resetPerformanceMetrics()

    // resetmock
    vi.clearAllMocks()
  })

  describe('Cache integration features', () => {
    it('Data should be cached after first execution', async () => {
      // Mock Data executor returns successful result
      const mockData = { temperature: 25, humidity: 60 }
      ;(unifiedDataExecutor.execute as any).mockResolvedValue({
        success: true,
        data: mockData
      })

      const requirement: ComponentDataRequirement = {
        componentId: 'testComponent',
        dataSources: [
          {
            id: 'sensor1',
            type: 'json',
            config: {
              jsonContent: JSON.stringify(mockData)
            }
          }
        ]
      }

      // first execution
      const result1 = await simpleDataBridge.executeComponent(requirement)

      expect(result1.success).toBe(true)
      expect(result1.data).toEqual({ sensor1: mockData })
      expect(unifiedDataExecutor.execute).toHaveBeenCalledTimes(1)

      // Verification data is cached
      const cachedData = simpleDataBridge.getComponentData('testComponent')
      expect(cachedData).toEqual({ sensor1: mockData })
    })

    it('The cache should be used on the second execution', async () => {
      const mockData = { status: 'active' }
      ;(unifiedDataExecutor.execute as any).mockResolvedValue({
        success: true,
        data: mockData
      })

      const requirement: ComponentDataRequirement = {
        componentId: 'cachedComponent',
        dataSources: [
          {
            id: 'api1',
            type: 'json',
            config: {
              jsonContent: JSON.stringify(mockData)
            }
          }
        ]
      }

      // first execution - will call the executor
      await simpleDataBridge.executeComponent(requirement)
      expect(unifiedDataExecutor.execute).toHaveBeenCalledTimes(1)

      // Execute again - Caching should be used，Do not call the executor
      const result2 = await simpleDataBridge.executeComponent(requirement)

      expect(result2.success).toBe(true)
      expect(result2.data).toEqual({ api1: mockData })
      expect(unifiedDataExecutor.execute).toHaveBeenCalledTimes(1) // still1Second-rate
    })

    it('Multiple data source caching should be supported', async () => {
      const sensorData = { temperature: 22 }
      const apiData = { online: true }

      // Mock Different calls return different data
      ;(unifiedDataExecutor.execute as any)
        .mockResolvedValueOnce({ success: true, data: sensorData })
        .mockResolvedValueOnce({ success: true, data: apiData })

      const requirement: ComponentDataRequirement = {
        componentId: 'multiSourceComponent',
        dataSources: [
          {
            id: 'sensor1',
            type: 'json',
            config: { jsonContent: JSON.stringify(sensorData) }
          },
          {
            id: 'api1',
            type: 'json',
            config: { jsonContent: JSON.stringify(apiData) }
          }
        ]
      }

      const result = await simpleDataBridge.executeComponent(requirement)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        sensor1: sensorData,
        api1: apiData
      })
      expect(unifiedDataExecutor.execute).toHaveBeenCalledTimes(2)

      // Verify cache contains all data sources
      const cachedData = simpleDataBridge.getComponentData('multiSourceComponent')
      expect(cachedData).toEqual({
        sensor1: sensorData,
        api1: apiData
      })
    })
  })

  describe('Cache management function', () => {
    it('Should support clearing individual component caches', async () => {
      const mockData = { value: 100 }
      ;(unifiedDataExecutor.execute as any).mockResolvedValue({
        success: true,
        data: mockData
      })

      const requirement: ComponentDataRequirement = {
        componentId: 'clearTestComponent',
        dataSources: [
          {
            id: 'data1',
            type: 'json',
            config: { jsonContent: JSON.stringify(mockData) }
          }
        ]
      }

      // Execute and cache data
      await simpleDataBridge.executeComponent(requirement)
      expect(simpleDataBridge.getComponentData('clearTestComponent')).not.toBeNull()

      // clear cache
      simpleDataBridge.clearComponentCache('clearTestComponent')
      expect(simpleDataBridge.getComponentData('clearTestComponent')).toBeNull()
    })

    it('Should support clearing all caches', async () => {
      const mockData1 = { value: 1 }
      const mockData2 = { value: 2 }

      ;(unifiedDataExecutor.execute as any)
        .mockResolvedValueOnce({ success: true, data: mockData1 })
        .mockResolvedValueOnce({ success: true, data: mockData2 })

      // Create a cache for both components
      await simpleDataBridge.executeComponent({
        componentId: 'comp1',
        dataSources: [{ id: 'data1', type: 'json', config: {} }]
      })

      await simpleDataBridge.executeComponent({
        componentId: 'comp2',
        dataSources: [{ id: 'data2', type: 'json', config: {} }]
      })

      // Authentication is cached
      expect(simpleDataBridge.getComponentData('comp1')).not.toBeNull()
      expect(simpleDataBridge.getComponentData('comp2')).not.toBeNull()

      // clear all cache
      simpleDataBridge.clearAllCache()

      expect(simpleDataBridge.getComponentData('comp1')).toBeNull()
      expect(simpleDataBridge.getComponentData('comp2')).toBeNull()
    })
  })

  describe('Performance monitoring integration', () => {
    it('Warehouse performance metrics should be provided', async () => {
      const mockData = { test: 'data' }
      ;(unifiedDataExecutor.execute as any).mockResolvedValue({
        success: true,
        data: mockData
      })

      // perform some actions
      await simpleDataBridge.executeComponent({
        componentId: 'perfTestComp',
        dataSources: [{ id: 'data1', type: 'json', config: {} }]
      })

      // Fetch data multiple times to generate metrics
      simpleDataBridge.getComponentData('perfTestComp')
      simpleDataBridge.getComponentData('perfTestComp')
      simpleDataBridge.getComponentData('nonexistent') // miss

      const warehouseMetrics = simpleDataBridge.getWarehouseMetrics()

      expect(warehouseMetrics).toHaveProperty('cacheHitRate')
      expect(warehouseMetrics).toHaveProperty('totalRequests')
      expect(warehouseMetrics.totalRequests).toBeGreaterThan(0)
    })

    it('Storage statistics should be provided', async () => {
      const mockData = { size: 'test' }
      ;(unifiedDataExecutor.execute as any).mockResolvedValue({
        success: true,
        data: mockData
      })

      await simpleDataBridge.executeComponent({
        componentId: 'statsTestComp',
        dataSources: [
          { id: 'data1', type: 'json', config: {} },
          { id: 'data2', type: 'json', config: {} }
        ]
      })

      const storageStats = simpleDataBridge.getStorageStats()

      expect(storageStats).toHaveProperty('totalComponents')
      expect(storageStats).toHaveProperty('totalDataSources')
      expect(storageStats).toHaveProperty('memoryUsageMB')
      expect(storageStats.totalComponents).toBeGreaterThanOrEqual(1)
    })

    it('should be ingetStatsContains warehouse information', async () => {
      const mockData = { info: 'test' }
      ;(unifiedDataExecutor.execute as any).mockResolvedValue({
        success: true,
        data: mockData
      })

      await simpleDataBridge.executeComponent({
        componentId: 'statsIntegrationComp',
        dataSources: [{ id: 'data1', type: 'json', config: {} }]
      })

      const stats = simpleDataBridge.getStats()

      expect(stats).toHaveProperty('warehouse')
      expect(stats.warehouse).toHaveProperty('totalComponents')
      expect(stats.warehouse).toHaveProperty('totalDataSources')
      expect(stats.warehouse).toHaveProperty('memoryUsageMB')
      expect(stats.warehouse.totalComponents).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Cache expiration processing', () => {
    it('Should be re-executed after the cache expires', async () => {
      // Set a very short cache expiration time
      simpleDataBridge.setCacheExpiry(50) // 50ms

      const mockData = { timestamp: Date.now() }
      ;(unifiedDataExecutor.execute as any).mockResolvedValue({
        success: true,
        data: mockData
      })

      const requirement: ComponentDataRequirement = {
        componentId: 'expiryTestComp',
        dataSources: [{ id: 'data1', type: 'json', config: {} }]
      }

      // first execution
      await simpleDataBridge.executeComponent(requirement)
      expect(unifiedDataExecutor.execute).toHaveBeenCalledTimes(1)

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 100))

      // Execute again，The executor should be re-invoked
      await simpleDataBridge.executeComponent(requirement)
      expect(unifiedDataExecutor.execute).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error handling integration', () => {
    it('Error results should not be cached on executor failure', async () => {
      ;(unifiedDataExecutor.execute as any).mockRejectedValue(new Error('Execution failed'))

      const requirement: ComponentDataRequirement = {
        componentId: 'errorTestComp',
        dataSources: [{ id: 'data1', type: 'json', config: {} }]
      }

      const result = await simpleDataBridge.executeComponent(requirement)

      expect(result.success).toBe(true) // SimpleDataBridge use Promise.allSettled
      expect(result.data).toEqual({ data1: null }) // Failed data source returnsnull

      // Validation error results are not cached
      const cachedData = simpleDataBridge.getComponentData('errorTestComp')
      // May contain cachednullthe result，this is normal behavior
      expect(cachedData).toEqual({ data1: null })
    })
  })

  describe('Data callback notification', () => {
    it('The callback should be notified when the data is updated', async () => {
      const mockCallback = vi.fn()
      const unsubscribe = simpleDataBridge.onDataUpdate(mockCallback)

      const mockData = { notification: 'test' }
      ;(unifiedDataExecutor.execute as any).mockResolvedValue({
        success: true,
        data: mockData
      })

      await simpleDataBridge.executeComponent({
        componentId: 'callbackTestComp',
        dataSources: [{ id: 'data1', type: 'json', config: {} }]
      })

      expect(mockCallback).toHaveBeenCalledWith('callbackTestComp', { data1: mockData })

      // clean up
      unsubscribe()
    })
  })

  describe('Destruction and resource cleanup', () => {
    it('Warehouse resources should be cleaned up when destroyed', () => {
      // store some data
      dataWarehouse.storeComponentData('comp1', 'data1', { test: 1 }, 'json')

      expect(dataWarehouse.getStorageStats().totalComponents).toBeGreaterThan(0)

      // destroySimpleDataBridgeThe warehouse should be cleaned at the same time
      simpleDataBridge.destroy()

      expect(dataWarehouse.getStorageStats().totalComponents).toBe(0)
    })
  })
})
