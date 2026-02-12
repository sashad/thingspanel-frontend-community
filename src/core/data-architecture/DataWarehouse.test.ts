/**
 * Data warehouse test suite
 * Test multiple data source isolation、Performance optimization、Memory management and other functions
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { dataWarehouse, EnhancedDataWarehouse, type DataStorageItem, type PerformanceMetrics } from '@/core/data-architecture/DataWarehouse'

describe('EnhancedDataWarehouse', () => {
  let warehouse: EnhancedDataWarehouse

  beforeEach(() => {
    // Create a new repository instance for each test
    warehouse = new EnhancedDataWarehouse()
    // Set a shorter cache expiration time for testing
    warehouse.setCacheExpiry(100)
  })

  describe('Basic data storage and retrieval', () => {
    it('Should be able to store and retrieve component data', () => {
      const testData = { temperature: 25, humidity: 60 }

      warehouse.storeComponentData('comp1', 'sensor1', testData, 'json')

      const retrievedData = warehouse.getComponentData('comp1')
      expect(retrievedData).toEqual({ sensor1: testData })
    })

    it('Multiple data sources should be supported for isolated storage', () => {
      const sensorData = { temperature: 25 }
      const apiData = { status: 'ok' }

      warehouse.storeComponentData('comp1', 'sensor1', sensorData, 'json')
      warehouse.storeComponentData('comp1', 'api1', apiData, 'http')

      const allData = warehouse.getComponentData('comp1')
      expect(allData).toEqual({
        sensor1: sensorData,
        api1: apiData
      })
    })

    it('should returnnullWhen component data does not exist', () => {
      const result = warehouse.getComponentData('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('Cache expiration mechanism', () => {
    it('Should be returned after the data has expirednull', async () => {
      const testData = { value: 123 }

      warehouse.storeComponentData('comp1', 'source1', testData, 'json')

      // Verify initial existence of data
      expect(warehouse.getComponentData('comp1')).toEqual({ source1: testData })

      // Waiting for expiration
      await new Promise(resolve => setTimeout(resolve, 150))

      // Verification data has expired
      expect(warehouse.getComponentData('comp1')).toBeNull()
    })

    it('Expired data should be automatically cleaned', async () => {
      warehouse.storeComponentData('comp1', 'source1', { value: 1 }, 'json')
      warehouse.storeComponentData('comp2', 'source2', { value: 2 }, 'json')

      // Waiting for expiration
      await new Promise(resolve => setTimeout(resolve, 150))

      // trigger cleanup
      warehouse.performMaintenance()

      const stats = warehouse.getStorageStats()
      expect(stats.totalComponents).toBe(0)
      expect(stats.totalDataSources).toBe(0)
    })
  })

  describe('Performance monitoring', () => {
    it('Cache hit ratio should be tracked', () => {
      const testData = { value: 123 }

      // Store data
      warehouse.storeComponentData('comp1', 'source1', testData, 'json')

      // Multiple visits to generate hit statistics
      warehouse.getComponentData('comp1') // hit
      warehouse.getComponentData('comp1') // hit
      warehouse.getComponentData('comp2') // miss

      const metrics = warehouse.getPerformanceMetrics()
      expect(metrics.cacheHitRate).toBe(2 / 3) // 2hit / 3total visits
      expect(metrics.totalRequests).toBe(3)
    })

    it('Response times should be tracked', () => {
      const testData = { value: 123 }

      warehouse.storeComponentData('comp1', 'source1', testData, 'json')
      warehouse.getComponentData('comp1')

      const metrics = warehouse.getPerformanceMetrics()
      expect(metrics.averageResponseTime).toBeGreaterThan(0)
      expect(metrics.totalRequests).toBe(1)
    })
  })

  describe('Memory management', () => {
    it('Memory usage should be calculated', () => {
      const largeData = { data: 'x'.repeat(1000) }

      warehouse.storeComponentData('comp1', 'source1', largeData, 'json')

      const stats = warehouse.getStorageStats()
      expect(stats.memoryUsageMB).toBeGreaterThan(0)
    })

    it('The number of components and data sources should be tracked', () => {
      warehouse.storeComponentData('comp1', 'source1', { a: 1 }, 'json')
      warehouse.storeComponentData('comp1', 'source2', { b: 2 }, 'http')
      warehouse.storeComponentData('comp2', 'source3', { c: 3 }, 'json')

      const stats = warehouse.getStorageStats()
      expect(stats.totalComponents).toBe(2)
      expect(stats.totalDataSources).toBe(3)
    })
  })

  describe('Cache cleaning function', () => {
    it('Should be able to clear individual component caches', () => {
      warehouse.storeComponentData('comp1', 'source1', { a: 1 }, 'json')
      warehouse.storeComponentData('comp2', 'source2', { b: 2 }, 'json')

      warehouse.clearComponentCache('comp1')

      expect(warehouse.getComponentData('comp1')).toBeNull()
      expect(warehouse.getComponentData('comp2')).toEqual({ source2: { b: 2 } })
    })

    it('This should clear all caches', () => {
      warehouse.storeComponentData('comp1', 'source1', { a: 1 }, 'json')
      warehouse.storeComponentData('comp2', 'source2', { b: 2 }, 'json')

      warehouse.clearAllCache()

      expect(warehouse.getComponentData('comp1')).toBeNull()
      expect(warehouse.getComponentData('comp2')).toBeNull()

      const stats = warehouse.getStorageStats()
      expect(stats.totalComponents).toBe(0)
    })
  })

  describe('Dynamic parameter reservation interface', () => {
    it('A dynamic parameter storage interface should be provided（reserved）', () => {
      // Verify that the interface exists（forPhase 2Prepare）
      expect(typeof warehouse.storeDynamicParameter).toBe('function')
      expect(typeof warehouse.getDynamicParameter).toBe('function')
      expect(typeof warehouse.getAllDynamicParameters).toBe('function')
    })

    it('Dynamic parameter interfaces should return expected values', () => {
      // Return to default value for current stage
      warehouse.storeDynamicParameter('comp1', 'param1', 'value1')

      const value = warehouse.getDynamicParameter('comp1', 'param1')
      const allParams = warehouse.getAllDynamicParameters('comp1')

      // Phase 1: Return to default value，Phase 2: Realize full functionality
      expect(value).toBeDefined()
      expect(allParams).toBeDefined()
    })
  })

  describe('Error handling', () => {
    it('Invalid input should be handled gracefully', () => {
      expect(() => {
        warehouse.storeComponentData('', 'source1', {}, 'json')
      }).not.toThrow()

      expect(() => {
        warehouse.storeComponentData('comp1', '', {}, 'json')
      }).not.toThrow()
    })

    it('Circular reference data should be handled', () => {
      const circularData: any = { name: 'test' }
      circularData.self = circularData

      expect(() => {
        warehouse.storeComponentData('comp1', 'source1', circularData, 'json')
      }).not.toThrow()
    })
  })

  describe('Boundary condition testing', () => {
    it('Should handle large amounts of data storage', () => {
      // storage100components，each2data sources
      for (let i = 0; i < 100; i++) {
        warehouse.storeComponentData(`comp${i}`, 'source1', { value: i }, 'json')
        warehouse.storeComponentData(`comp${i}`, 'source2', { value: i * 2 }, 'http')
      }

      const stats = warehouse.getStorageStats()
      expect(stats.totalComponents).toBe(100)
      expect(stats.totalDataSources).toBe(200)
      expect(stats.memoryUsageMB).toBeGreaterThan(0)
    })

    it('Should handle frequent read and write operations', () => {
      const startTime = Date.now()

      // implement1000Read and write operations
      for (let i = 0; i < 1000; i++) {
        warehouse.storeComponentData('testComp', 'source1', { iteration: i }, 'json')
        warehouse.getComponentData('testComp')
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Performance check：1000The operation should be completed within a reasonable time
      expect(duration).toBeLessThan(1000) // less than1Second

      const metrics = warehouse.getPerformanceMetrics()
      expect(metrics.totalRequests).toBe(1000)
    })
  })

  describe('Maintenance and monitoring', () => {
    it('Detailed performance metrics should be provided', () => {
      warehouse.storeComponentData('comp1', 'source1', { value: 1 }, 'json')
      warehouse.getComponentData('comp1')
      warehouse.getComponentData('nonexistent')

      const metrics = warehouse.getPerformanceMetrics()

      expect(metrics).toHaveProperty('cacheHitRate')
      expect(metrics).toHaveProperty('averageResponseTime')
      expect(metrics).toHaveProperty('totalRequests')
      expect(metrics).toHaveProperty('cacheHits')
      expect(metrics).toHaveProperty('cacheMisses')

      expect(typeof metrics.cacheHitRate).toBe('number')
      expect(typeof metrics.averageResponseTime).toBe('number')
      expect(metrics.totalRequests).toBe(2)
    })

    it('Performance indicator reset should be supported', () => {
      warehouse.getComponentData('comp1') // Generate some indicators

      warehouse.resetPerformanceMetrics()

      const metrics = warehouse.getPerformanceMetrics()
      expect(metrics.totalRequests).toBe(0)
      expect(metrics.cacheHits).toBe(0)
      expect(metrics.cacheMisses).toBe(0)
    })
  })
})

describe('Global data warehouse instance', () => {
  it('A global singleton should be provided', () => {
    expect(dataWarehouse).toBeInstanceOf(EnhancedDataWarehouse)
  })

  it('Global instances should be isolated from new instances', () => {
    const newWarehouse = new EnhancedDataWarehouse()

    dataWarehouse.storeComponentData('comp1', 'source1', { global: true }, 'json')
    newWarehouse.storeComponentData('comp1', 'source1', { global: false }, 'json')

    expect(dataWarehouse.getComponentData('comp1')).toEqual({ source1: { global: true } })
    expect(newWarehouse.getComponentData('comp1')).toEqual({ source1: { global: false } })
  })
})
