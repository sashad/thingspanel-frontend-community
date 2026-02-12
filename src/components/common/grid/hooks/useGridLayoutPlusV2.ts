/**
 * Grid Layout Plus Hook V2 - Refactored version
 * Adopt modular architecture，Integrate all grid functions
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type {
  GridLayoutPlusItem,
  GridLayoutPlusConfig,
  PerformanceConfig,
  ResponsiveLayout
} from '../gridLayoutPlusTypes'
import { useGridCore, type UseGridCoreOptions } from './useGridCore'
import { useGridHistory, type UseGridHistoryOptions } from './useGridHistory'
import { useGridPerformance, type UseGridPerformanceOptions } from './useGridPerformance'
import { useGridResponsive, type UseGridResponsiveOptions } from './useGridResponsive'

export interface UseGridLayoutPlusV2Options {
  /** initial layout */
  initialLayout?: GridLayoutPlusItem[]
  /** Grid configuration */
  config?: Partial<GridLayoutPlusConfig>
  /** Core configuration */
  core?: UseGridCoreOptions
  /** History configuration */
  history?: UseGridHistoryOptions
  /** Performance configuration */
  performance?: UseGridPerformanceOptions
  /** Responsive configuration */
  responsive?: UseGridResponsiveOptions
  /** Whether to enable auto-save */
  autoSave?: boolean
  /** Autosave delay */
  autoSaveDelay?: number
  /** save callback */
  onSave?: (layout: GridLayoutPlusItem[]) => void
  /** Layout change callback */
  onLayoutChange?: (layout: GridLayoutPlusItem[]) => void
}

/**
 * Grid Layout Plus V2 Hook
 * Master that integrates all grid functionsHook
 */
export function useGridLayoutPlusV2(options: UseGridLayoutPlusV2Options = {}) {
  // Initialize submodule
  const gridCore = useGridCore({
    initialLayout: options.initialLayout,
    config: options.config,
    enableValidation: true,
    ...options.core
  })

  const gridHistory = useGridHistory({
    enabled: true,
    maxLength: 50,
    autoSaveInterval: options.autoSave ? options.autoSaveDelay || 3000 : 0,
    ...options.history
  })

  const gridPerformance = useGridPerformance({
    enableMonitoring: true,
    autoOptimize: true,
    ...options.performance
  })

  const gridResponsive = useGridResponsive({
    responsive: options.config?.responsive || false,
    breakpoints: options.config?.breakpoints,
    cols: options.config?.cols,
    onBreakpointChange: (breakpoint, layout) => {
      console.debug(`[GridLayoutPlusV2] Breakpoint changed: ${breakpoint}`)
      gridCore.updateLayout(layout)
    },
    ...options.responsive
  })

  // Auto save timer
  let autoSaveTimer: NodeJS.Timeout | null = null

  // Comprehensive computed properties
  const layoutInfo = computed(() => ({
    items: gridCore.layout.value,
    stats: gridCore.layoutStats.value,
    bounds: gridCore.layoutBounds.value,
    selectedCount: gridCore.selectedItems.value.length,
    isValid: gridCore.isValidLayout.value,
    breakpoint: gridResponsive.currentBreakpoint.value,
    cols: gridResponsive.currentCols.value
  }))

  const systemStatus = computed(() => ({
    performance: {
      score: gridPerformance.performanceScore.value,
      metrics: gridPerformance.metrics.value,
      needsVirtualization: gridPerformance.needsVirtualization.value
    },
    history: {
      canUndo: gridHistory.canUndo.value,
      canRedo: gridHistory.canRedo.value,
      length: gridHistory.historyLength.value
    },
    responsive: {
      isResponsive: gridResponsive.isResponsive.value,
      breakpoint: gridResponsive.currentBreakpoint.value,
      containerWidth: gridResponsive.containerWidth.value
    }
  }))

  // Layout operations（Integration history）
  const updateLayoutWithHistory = (newLayout: GridLayoutPlusItem[]) => {
    const result = gridCore.updateLayout(newLayout)
    if (result.success) {
      gridHistory.saveToHistory(newLayout)

      // Estimate performance impact
      gridPerformance.estimateMemoryUsage(newLayout)

      // trigger callback
      if (options.onLayoutChange) {
        options.onLayoutChange(newLayout)
      }
    }
    return result
  }

  const addItemWithHistory = (item: GridLayoutPlusItem) => {
    const result = gridCore.addItem(item)
    if (result.success) {
      gridHistory.saveToHistory(gridCore.layout.value)
      gridPerformance.estimateMemoryUsage(gridCore.layout.value)
    }
    return result
  }

  const removeItemWithHistory = (itemId: string) => {
    const result = gridCore.removeItem(itemId)
    if (result.success) {
      gridHistory.saveToHistory(gridCore.layout.value)
      gridPerformance.estimateMemoryUsage(gridCore.layout.value)
    }
    return result
  }

  const updateItemWithHistory = (itemId: string, updates: Partial<GridLayoutPlusItem>) => {
    const result = gridCore.updateItem(itemId, updates)
    if (result.success) {
      gridHistory.saveToHistory(gridCore.layout.value)
    }
    return result
  }

  // Historical operations（Integrated performance monitoring）
  const undoWithPerformanceMonitoring = async () => {
    const previousLayout = gridHistory.undo()
    if (previousLayout) {
      await gridPerformance.measureRenderTime(async () => {
        gridCore.updateLayout(previousLayout)
      })
      return previousLayout
    }
    return null
  }

  const redoWithPerformanceMonitoring = async () => {
    const nextLayout = gridHistory.redo()
    if (nextLayout) {
      await gridPerformance.measureRenderTime(async () => {
        gridCore.updateLayout(nextLayout)
      })
      return nextLayout
    }
    return null
  }

  // Responsive operations
  const handleContainerResize = (element: HTMLElement) => {
    gridResponsive.observeContainer(element)
  }

  const switchBreakpoint = (breakpoint: string) => {
    const newLayout = gridResponsive.handleBreakpointChange(breakpoint, gridCore.layout.value)
    if (newLayout) {
      updateLayoutWithHistory(newLayout)
    }
    return newLayout
  }

  // Performance optimization operations
  const optimizePerformance = () => {
    const wasOptimized = gridPerformance.applyAutoOptimizations()
    if (wasOptimized) {
      if (process.env.NODE_ENV === 'development') {
      }
    }
    return wasOptimized
  }

  const measureLayoutPerformance = async (operation: () => Promise<void> | void) => {
    return await gridPerformance.measureRenderTime(operation)
  }

  // Batch operations（Optimize performance）
  const batchUpdate = async (operations: (() => void)[]) => {
    // Pause history and performance monitoring
    gridHistory.pauseRecording()
    gridPerformance.stopMonitoring()

    try {
      // perform all operations
      for (const operation of operations) {
        operation()
      }

      // Save to history
      gridHistory.resumeRecording()
      gridHistory.saveToHistory(gridCore.layout.value)

      // Restart performance monitoring
      gridPerformance.startMonitoring()
      gridPerformance.estimateMemoryUsage(gridCore.layout.value)
    } catch (error) {
      console.error('[GridLayoutPlusV2] Batch update failed:', error)

      // Resume monitoring
      gridHistory.resumeRecording()
      gridPerformance.startMonitoring()
    }
  }

  // Auto save function
  const startAutoSave = () => {
    if (!options.autoSave || autoSaveTimer) return

    const delay = options.autoSaveDelay || 3000
    autoSaveTimer = setInterval(() => {
      if (options.onSave && gridCore.layout.value.length > 0) {
        options.onSave(gridCore.layout.value)
      }
    }, delay)

    console.debug(`[GridLayoutPlusV2] Auto save started with ${delay}ms interval`)
  }

  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
      console.debug('[GridLayoutPlusV2] Auto save stopped')
    }
  }

  // Full reset functionality
  const resetAll = () => {
    gridCore.clearLayout()
    gridHistory.clearHistory()
    gridPerformance.metrics.value = {
      renderTime: 0,
      layoutTime: 0,
      itemCount: 0,
      memoryUsage: 0,
      fps: 60,
      lastUpdated: Date.now()
    }
    if (process.env.NODE_ENV === 'development') {
    }
  }

  // Listen for layout changes to update performance metrics
  watch(
    () => gridCore.layout.value,
    newLayout => {
      gridPerformance.metrics.value.itemCount = newLayout.length
      gridPerformance.metrics.value.lastUpdated = Date.now()
    },
    { immediate: true }
  )

  // initialization
  onMounted(() => {
    // Initialize history
    if (gridCore.layout.value.length > 0) {
      gridHistory.initHistory(gridCore.layout.value)
    }

    // Start autosave
    if (options.autoSave) {
      startAutoSave()
    }

    if (process.env.NODE_ENV === 'development') {
    }
  })

  // clean up
  onUnmounted(() => {
    stopAutoSave()
    gridPerformance.stopMonitoring()
    gridResponsive.unobserveContainer()
    if (process.env.NODE_ENV === 'development') {
    }
  })

  return {
    // submodule reference
    core: gridCore,
    history: gridHistory,
    performance: gridPerformance,
    responsive: gridResponsive,

    // Comprehensive status
    layoutInfo,
    systemStatus,

    // Main methods of operation
    updateLayout: updateLayoutWithHistory,
    addItem: addItemWithHistory,
    removeItem: removeItemWithHistory,
    updateItem: updateItemWithHistory,

    // Historical operations
    undo: undoWithPerformanceMonitoring,
    redo: redoWithPerformanceMonitoring,

    // Responsive operations
    handleContainerResize,
    switchBreakpoint,

    // Performance operations
    optimizePerformance,
    measureLayoutPerformance,

    // Batch operations
    batchUpdate,

    // System control
    startAutoSave,
    stopAutoSave,
    resetAll,

    // Easy access（backwards compatible）
    layout: gridCore.layout,
    selectedItems: gridCore.selectedItems,
    config: gridCore.config,
    isLoading: gridCore.isLoading,
    error: gridCore.error
  }
}
