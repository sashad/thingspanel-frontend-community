/**
 * Grid Performance optimization tool functions
 * Specialized in image stabilization、Throttle、Performance-related features such as virtualization
 */

import type { GridLayoutPlusItem, PerformanceConfig } from '../gridLayoutPlusTypes'

/**
 * Anti-shake function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let lastTime = 0
  let timeoutId: NodeJS.Timeout | null = null

  return function (...args: Parameters<T>) {
    const now = Date.now()

    if (now - lastTime >= delay) {
      lastTime = now
      func.apply(this, args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(
        () => {
          lastTime = Date.now()
          func.apply(this, args)
          timeoutId = null
        },
        delay - (now - lastTime)
      )
    }
  }
}

/**
 * Performance-optimized layout handling
 */
export function optimizeLayoutPerformance(
  layout: GridLayoutPlusItem[],
  config: PerformanceConfig
): GridLayoutPlusItem[] {
  try {
    let optimizedLayout = [...layout]

    // Lazy loading processing
    if (config.enableLazyLoading) {
      optimizedLayout = applyLazyLoading(optimizedLayout, config)
    }

    return optimizedLayout
  } catch (error) {
    console.error('Failed to optimize layout performance:', error)
    return layout
  }
}



/**
 * Application lazy loading
 */
function applyLazyLoading(layout: GridLayoutPlusItem[], config: PerformanceConfig): GridLayoutPlusItem[] {
  try {
    const buffer = config.lazyLoadingBuffer || 5

    // Mark items that require lazy loading
    return layout.map((item, index) => ({
      ...item,
      metadata: {
        ...item.metadata,
        lazy: index >= buffer,
        lazyIndex: index
      }
    }))
  } catch (error) {
    console.error('Failed to apply lazy loading:', error)
    return layout
  }
}

/**
 * performance monitor
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private isEnabled = true

  /**
   * Start monitoring operation
   */
  start(operation: string): string {
    if (!this.isEnabled) return ''

    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    performance.mark(`${id}_start`)

    return id
  }

  /**
   * End monitoring and record
   */
  end(id: string, operation: string): number | null {
    if (!this.isEnabled || !id) return null

    try {
      performance.mark(`${id}_end`)
      performance.measure(id, `${id}_start`, `${id}_end`)

      const measures = performance.getEntriesByName(id, 'measure')
      if (measures.length > 0) {
        const duration = measures[0].duration

        // recorded in the indicator
        if (!this.metrics.has(operation)) {
          this.metrics.set(operation, [])
        }
        const operationMetrics = this.metrics.get(operation)!
        operationMetrics.push(duration)

        // Limit the number of records
        if (operationMetrics.length > 100) {
          operationMetrics.shift()
        }

        // Clean up performance entries
        performance.clearMarks(`${id}_start`)
        performance.clearMarks(`${id}_end`)
        performance.clearMeasures(id)

        return duration
      }
    } catch (error) {
      console.error('Performance monitoring error:', error)
    }

    return null
  }

  /**
   * Get statistics for an operation
   */
  getStats(operation: string): {
    count: number
    average: number
    min: number
    max: number
    recent: number
  } | null {
    const metrics = this.metrics.get(operation)
    if (!metrics || metrics.length === 0) return null

    const count = metrics.length
    const sum = metrics.reduce((a, b) => a + b, 0)
    const average = sum / count
    const min = Math.min(...metrics)
    const max = Math.max(...metrics)
    const recent = metrics[metrics.length - 1]

    return { count, average, min, max, recent }
  }

  /**
   * Get all statistics
   */
  getAllStats(): Record<string, ReturnType<PerformanceMonitor['getStats']>> {
    const stats: Record<string, ReturnType<PerformanceMonitor['getStats']>> = {}

    for (const operation of this.metrics.keys()) {
      stats[operation] = this.getStats(operation)
    }

    return stats
  }

  /**
   * Clean monitoring data
   */
  clear(operation?: string): void {
    if (operation) {
      this.metrics.delete(operation)
    } else {
      this.metrics.clear()
    }
  }

  /**
   * enable/Disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }
}

/**
 * Global performance monitoring example
 */
export const performanceMonitor = new PerformanceMonitor()

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): {
  used: number
  total: number
  percentage: number
} | null {
  try {
    // Modern browser memoryAPI
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      }
    }
  } catch (error) {
    console.error('Failed to get memory usage:', error)
  }

  return null
}

/**
 * cache manager
 */
export class CacheManager<K, V> {
  private cache = new Map<K, { value: V; timestamp: number; hits: number }>()
  private maxSize: number
  private ttl: number // survival time(ms)

  constructor(maxSize = 100, ttl = 5 * 60 * 1000) {
    // default5minute
    this.maxSize = maxSize
    this.ttl = ttl
  }

  /**
   * Get cached value
   */
  get(key: K): V | null {
    const item = this.cache.get(key)
    if (!item) return null

    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    // Update access count
    item.hits++
    return item.value
  }

  /**
   * Set cache value
   */
  set(key: K, value: V): void {
    // if cache is full，Remove least used items
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0
    })
  }

  /**
   * Delete cached items
   */
  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    totalHits: number
  } {
    let totalHits = 0
    let totalAccess = 0

    for (const item of this.cache.values()) {
      totalHits += item.hits
      totalAccess += item.hits + 1 // +1 for the initial set
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalAccess > 0 ? totalHits / totalAccess : 0,
      totalHits
    }
  }

  /**
   * Remove least used items
   */
  private evictLeastUsed(): void {
    let leastUsedKey: K | null = null
    let minHits = Infinity
    let oldestTime = Infinity

    for (const [key, item] of this.cache.entries()) {
      if (item.hits < minHits || (item.hits === minHits && item.timestamp < oldestTime)) {
        leastUsedKey = key
        minHits = item.hits
        oldestTime = item.timestamp
      }
    }

    if (leastUsedKey !== null) {
      this.cache.delete(leastUsedKey)
    }
  }
}

/**
 * asynchronous queue handler
 */
export class AsyncQueue<T> {
  private queue: Array<() => Promise<T>> = []
  private running = false
  private concurrency: number

  constructor(concurrency = 1) {
    this.concurrency = concurrency
  }

  /**
   * Add task to queue
   */
  add<R>(task: () => Promise<R>): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task()
          resolve(result as any)
          return result as any
        } catch (error) {
          reject(error)
          throw error
        }
      })

      this.process()
    })
  }

  /**
   * processing queue
   */
  private async process(): Promise<void> {
    if (this.running) return

    this.running = true

    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.concurrency)
        await Promise.allSettled(batch.map(task => task()))
      }
    } finally {
      this.running = false
    }
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = []
  }

  /**
   * Get queue length
   */
  size(): number {
    return this.queue.length
  }
}
