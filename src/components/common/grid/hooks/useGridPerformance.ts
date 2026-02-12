/**
 * Grid Performance monitoring and optimization Hook
 * Provide performance indicator monitoring and optimization functions
 */

import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { GridLayoutPlusItem, PerformanceConfig } from '../gridLayoutPlusTypes'
import { debounce, throttle } from '../gridLayoutPlusUtils'

export interface UseGridPerformanceOptions {
  /** Performance configuration */
  performanceConfig?: Partial<PerformanceConfig>
  /** Whether to enable performance monitoring */
  enableMonitoring?: boolean
  /** Performance data collection interval(ms) */
  monitoringInterval?: number
  /** Whether to automatically optimize */
  autoOptimize?: boolean
}

export interface PerformanceMetrics {
  /** render time(ms) */
  renderTime: number
  /** Layout calculation time(ms) */
  layoutTime: number
  /** Number of items */
  itemCount: number
  /** Memory usage estimate(KB) */
  memoryUsage: number
  /** FPSvalue */
  fps: number
  /** Last updated */
  lastUpdated: number
}

/**
 * Grid performance managementHook
 * Provide performance monitoring、Optimization suggestions and automatic optimization functions
 */
export function useGridPerformance(options: UseGridPerformanceOptions = {}) {
  const { performanceConfig = {}, enableMonitoring = true, monitoringInterval = 1000, autoOptimize = false } = options

  // Performance configuration
  const config = ref<PerformanceConfig>({
    debounceDelay: 100,
    throttleDelay: 16,
    enableLazyLoading: false,
    lazyLoadingBuffer: 5,
    ...performanceConfig
  })

  // Performance indicators
  const metrics = ref<PerformanceMetrics>({
    renderTime: 0,
    layoutTime: 0,
    itemCount: 0,
    memoryUsage: 0,
    fps: 60,
    lastUpdated: Date.now()
  })

  // Performance monitoring status
  const isMonitoring = ref(false)
  const performanceHistory = ref<PerformanceMetrics[]>([])
  const maxHistoryLength = 100

  // FPSMonitoring related
  let fpsFrameCount = 0
  let fpsStartTime = 0
  let animationFrameId = 0
  let monitoringTimer: NodeJS.Timeout | null = null

  // Computed properties
  const needsVirtualization = computed(() => {
    return metrics.value.itemCount >= config.value.virtualizationThreshold
  })

  const performanceScore = computed(() => {
    const { renderTime, layoutTime, fps, itemCount } = metrics.value

    // Calculate performance scores based on multiple metrics (0-100)
    let score = 100

    // Render time penalty
    if (renderTime > 16) score -= Math.min(30, (renderTime - 16) / 2)

    // Layout calculation time penalty
    if (layoutTime > 10) score -= Math.min(20, (layoutTime - 10) / 2)

    // FPSpunish
    if (fps < 60) score -= Math.min(25, (60 - fps) / 2)

    // Project quantity penalty
    if (itemCount > 50) score -= Math.min(25, (itemCount - 50) / 10)

    return Math.max(0, Math.floor(score))
  })

  const optimizationSuggestions = computed(() => {
    const suggestions: string[] = []
    const { renderTime, layoutTime, itemCount } = metrics.value

    if (itemCount >= config.value.virtualizationThreshold && !config.value.enableVirtualization) {
      suggestions.push('It is recommended to enable virtualization to improve performance on large data sets')
    }

    if (renderTime > 16) {
      suggestions.push('Rendering takes too long，Consider reducingDOMOperate or enable anti-shake')
    }

    if (layoutTime > 10) {
      suggestions.push('Layout calculation takes a long time，Consider optimizing layout algorithms')
    }

    if (metrics.value.fps < 45) {
      suggestions.push('lower frame rate，It is recommended to reduce animation effects or optimize rendering')
    }

    if (!config.value.enableLazyLoading && itemCount > 30) {
      suggestions.push('Consider enabling lazy loading to improve initial load performance')
    }

    return suggestions
  })

  // Performance measurement tools
  const measureRenderTime = async (renderFn: () => Promise<void> | void) => {
    const startTime = performance.now()

    try {
      await renderFn()
      await nextTick() // waitDOMUpdate completed
    } catch (error) {
      console.error('[GridPerformance] Render function error:', error)
    }

    const endTime = performance.now()
    const renderTime = endTime - startTime

    metrics.value.renderTime = renderTime
    metrics.value.lastUpdated = Date.now()

    return renderTime
  }

  const measureLayoutTime = (layoutFn: () => void) => {
    const startTime = performance.now()

    try {
      layoutFn()
    } catch (error) {
      console.error('[GridPerformance] Layout function error:', error)
    }

    const endTime = performance.now()
    const layoutTime = endTime - startTime

    metrics.value.layoutTime = layoutTime
    metrics.value.lastUpdated = Date.now()

    return layoutTime
  }

  // Memory usage estimate
  const estimateMemoryUsage = (layout: GridLayoutPlusItem[]) => {
    try {
      // Simplified memory usage estimates
      const itemSize = 200 // Each grid item is approx.200byte
      const layoutSize = JSON.stringify(layout).length * 2 // String size2times
      const totalSize = (layout.length * itemSize + layoutSize) / 1024 // Convert toKB

      metrics.value.memoryUsage = totalSize
      return totalSize
    } catch (error) {
      console.error('[GridPerformance] Failed to estimate memory usage:', error)
      return 0
    }
  }

  // FPSmonitor
  const measureFPS = () => {
    const now = performance.now()

    if (fpsStartTime === 0) {
      fpsStartTime = now
      fpsFrameCount = 0
    }

    fpsFrameCount++

    if (now - fpsStartTime >= 1000) {
      metrics.value.fps = Math.round((fpsFrameCount * 1000) / (now - fpsStartTime))
      fpsStartTime = now
      fpsFrameCount = 0
    }

    if (isMonitoring.value) {
      animationFrameId = requestAnimationFrame(measureFPS)
    }
  }

  // Performance monitoring control
  const startMonitoring = () => {
    if (isMonitoring.value || !enableMonitoring) return

    isMonitoring.value = true
    fpsStartTime = 0
    fpsFrameCount = 0

    // startFPSmonitor
    measureFPS()

    // Collect performance data regularly
    monitoringTimer = setInterval(() => {
      const currentMetrics = { ...metrics.value }
      performanceHistory.value.push(currentMetrics)

      // Limit history length
      if (performanceHistory.value.length > maxHistoryLength) {
        performanceHistory.value.shift()
      }

      // Automatic optimization
      if (autoOptimize && performanceScore.value < 60) {
        applyAutoOptimizations()
      }
    }, monitoringInterval)

    console.debug('[GridPerformance] Monitoring started')
  }

  const stopMonitoring = () => {
    if (!isMonitoring.value) return

    isMonitoring.value = false

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = 0
    }

    if (monitoringTimer) {
      clearInterval(monitoringTimer)
      monitoringTimer = null
    }

    console.debug('[GridPerformance] Monitoring stopped')
  }

  // Automatic optimization
  const applyAutoOptimizations = () => {
    const { itemCount } = metrics.value
    let optimized = false

    // Automatically adjust anti-shake delay
    if (metrics.value.renderTime > 20 && config.value.debounceDelay < 200) {
      config.value.debounceDelay = Math.min(200, config.value.debounceDelay + 50)
      optimized = true
      console.debug(`[GridPerformance] Increased debounce delay to ${config.value.debounceDelay}ms`)
    }

    // Automatically enable lazy loading
    if (itemCount > 30 && !config.value.enableLazyLoading) {
      config.value.enableLazyLoading = true
      optimized = true
      console.debug('[GridPerformance] Auto-enabled lazy loading')
    }

    return optimized
  }

  // Create debounce and throttling functions
  const createDebouncedFunction = <T extends (...args: any[]) => any>(fn: T, customDelay?: number) => {
    return debounce(fn, customDelay || config.value.debounceDelay)
  }

  const createThrottledFunction = <T extends (...args: any[]) => any>(fn: T, customDelay?: number) => {
    return throttle(fn, customDelay || config.value.throttleDelay)
  }

  // performance report
  const getPerformanceReport = () => {
    const avgMetrics = performanceHistory.value.reduce(
      (acc, metric) => ({
        renderTime: acc.renderTime + metric.renderTime,
        layoutTime: acc.layoutTime + metric.layoutTime,
        fps: acc.fps + metric.fps,
        memoryUsage: acc.memoryUsage + metric.memoryUsage
      }),
      { renderTime: 0, layoutTime: 0, fps: 0, memoryUsage: 0 }
    )

    const count = performanceHistory.value.length
    if (count === 0) return null

    return {
      current: metrics.value,
      average: {
        renderTime: avgMetrics.renderTime / count,
        layoutTime: avgMetrics.layoutTime / count,
        fps: avgMetrics.fps / count,
        memoryUsage: avgMetrics.memoryUsage / count
      },
      score: performanceScore.value,
      suggestions: optimizationSuggestions.value,
      historyLength: count
    }
  }

  // life cycle management
  onMounted(() => {
    if (enableMonitoring) {
      startMonitoring()
    }
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    // Configuration
    config,

    // index
    metrics,
    performanceScore,
    needsVirtualization,
    optimizationSuggestions,

    // Monitoring and control
    isMonitoring,
    startMonitoring,
    stopMonitoring,

    // measuring tools
    measureRenderTime,
    measureLayoutTime,
    estimateMemoryUsage,

    // Optimization tools
    createDebouncedFunction,
    createThrottledFunction,
    applyAutoOptimizations,

    // Report
    getPerformanceReport,
    performanceHistory
  }
}
