/**
 * Grid Layout Plus Hook
 * Provides state management and tool methods for grid layout
 */

import { ref, computed, watch, nextTick, type Ref } from 'vue'
import type {
  GridLayoutPlusItem,
  GridLayoutPlusConfig,
  ResponsiveLayout,
  LayoutOperationResult,
  PerformanceConfig
} from '../gridLayoutPlusTypes'
import {
  validateLayout,
  validateGridItem,
  findAvailablePosition,
  generateId,
  cloneLayout,
  getLayoutBounds,
  compactLayout,
  sortLayout,
  filterLayout,
  searchLayout,
  getLayoutStats,
  createResponsiveLayout,
  transformLayoutForBreakpoint,
  optimizeLayoutPerformance,
  debounce,
  throttle
} from '../gridLayoutPlusUtils'
import { DEFAULT_GRID_LAYOUT_PLUS_CONFIG } from '../gridLayoutPlusTypes'

export interface UseGridLayoutPlusOptions {
  /** initial layout */
  initialLayout?: GridLayoutPlusItem[]
  /** Grid configuration */
  config?: Partial<GridLayoutPlusConfig>
  /** Performance configuration */
  performance?: Partial<PerformanceConfig>
  /** Whether to enable auto-save */
  autoSave?: boolean
  /** Autosave delay */
  autoSaveDelay?: number
  /** save callback */
  onSave?: (layout: GridLayoutPlusItem[]) => void
  /** Whether to enable history */
  enableHistory?: boolean
  /** Maximum length of history */
  maxHistoryLength?: number
}

export function useGridLayoutPlus(options: UseGridLayoutPlusOptions = {}) {
  // Configuration
  const config = ref<GridLayoutPlusConfig>({
    ...DEFAULT_GRID_LAYOUT_PLUS_CONFIG,
    ...options.config
  })

  const performanceConfig = ref<PerformanceConfig>({
    enableVirtualization: false,
    virtualizationThreshold: 100,
    debounceDelay: 100,
    throttleDelay: 16,
    enableLazyLoading: false,
    lazyLoadingBuffer: 5,
    ...options.performance
  })

  // state
  const layout = ref<GridLayoutPlusItem[]>(options.initialLayout || [])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const selectedItems = ref<string[]>([])
  const currentBreakpoint = ref<string>('lg')

  // History
  const history = ref<GridLayoutPlusItem[][]>([])
  const historyIndex = ref(-1)
  const maxHistoryLength = options.maxHistoryLength || 50

  // Responsive layout
  const responsiveLayouts = ref<ResponsiveLayout>({})

  // Computed properties
  const layoutStats = computed(() => getLayoutStats(layout.value, config.value.colNum))

  const layoutBounds = computed(() => getLayoutBounds(layout.value))

  const hasSelectedItems = computed(() => selectedItems.value.length > 0)

  const canUndo = computed(() => historyIndex.value > 0)

  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  const isValidLayout = computed(() => {
    const validation = validateLayout(layout.value)
    return validation.success
  })

  const optimizedLayout = computed(() => {
    return optimizeLayoutPerformance(layout.value, performanceConfig.value)
  })

  // History management
  const saveToHistory = () => {
    if (!options.enableHistory) return

    const currentLayout = cloneLayout(layout.value)

    // If you are not currently at the end of the history，Delete subsequent records
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    history.value.push(currentLayout)
    historyIndex.value = history.value.length - 1

    // Limit history length
    if (history.value.length > maxHistoryLength) {
      history.value = history.value.slice(-maxHistoryLength)
      historyIndex.value = history.value.length - 1
    }
  }

  // Auto save
  const autoSave = debounce(() => {
    if (options.autoSave && options.onSave) {
      options.onSave(cloneLayout(layout.value))
    }
  }, options.autoSaveDelay || 1000)

  // Layout operations
  const addItem = (
    type: string,
    itemOptions?: Partial<GridLayoutPlusItem>
  ): LayoutOperationResult<GridLayoutPlusItem> => {
    try {
      const w = itemOptions?.w || 2
      const h = itemOptions?.h || 2
      const position = findAvailablePosition(w, h, layout.value, config.value.colNum)

      const newItem: GridLayoutPlusItem = {
        i: generateId(),
        x: position.x,
        y: position.y,
        w,
        h,
        type,
        ...itemOptions
      }

      const validation = validateGridItem(newItem)
      if (!validation.success) {
        return validation
      }

      saveToHistory()
      layout.value.push(newItem)
      autoSave()

      return {
        success: true,
        data: newItem,
        message: 'Project added successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: 'Project addition failed'
      }
    }
  }

  const removeItem = (itemId: string): LayoutOperationResult<GridLayoutPlusItem> => {
    try {
      const index = layout.value.findIndex(item => item.i === itemId)
      if (index === -1) {
        return {
          success: false,
          error: new Error('Item not found'),
          message: 'Project does not exist'
        }
      }

      saveToHistory()
      const removedItem = layout.value.splice(index, 1)[0]

      // Remove from selected items
      selectedItems.value = selectedItems.value.filter(id => id !== itemId)

      autoSave()

      return {
        success: true,
        data: removedItem,
        message: 'Project deleted successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: 'Project deletion failed'
      }
    }
  }

  const updateItem = (
    itemId: string,
    updates: Partial<GridLayoutPlusItem>
  ): LayoutOperationResult<GridLayoutPlusItem> => {
    try {
      const item = layout.value.find(i => i.i === itemId)
      if (!item) {
        return {
          success: false,
          error: new Error('Item not found'),
          message: 'Project does not exist'
        }
      }

      saveToHistory()
      Object.assign(item, updates)

      const validation = validateGridItem(item)
      if (!validation.success) {
        return validation
      }

      autoSave()

      return {
        success: true,
        data: item,
        message: 'Project updated successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: 'Project update failed'
      }
    }
  }

  const duplicateItem = (itemId: string): LayoutOperationResult<GridLayoutPlusItem> => {
    try {
      const sourceItem = layout.value.find(item => item.i === itemId)
      if (!sourceItem) {
        return {
          success: false,
          error: new Error('Source item not found'),
          message: 'Source project does not exist'
        }
      }

      const position = findAvailablePosition(sourceItem.w, sourceItem.h, layout.value, config.value.colNum)

      const duplicatedItem: GridLayoutPlusItem = {
        ...sourceItem,
        i: generateId(),
        x: position.x,
        y: position.y
      }

      saveToHistory()
      layout.value.push(duplicatedItem)
      autoSave()

      return {
        success: true,
        data: duplicatedItem,
        message: 'Project copied successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: 'Project copy failed'
      }
    }
  }

  const clearLayout = (): LayoutOperationResult<boolean> => {
    try {
      saveToHistory()
      layout.value = []
      selectedItems.value = []
      autoSave()

      return {
        success: true,
        data: true,
        message: 'Layout cleared successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: 'Layout clearing failed'
      }
    }
  }

  // Select action
  const selectItem = (itemId: string) => {
    if (!selectedItems.value.includes(itemId)) {
      selectedItems.value.push(itemId)
    }
  }

  const deselectItem = (itemId: string) => {
    selectedItems.value = selectedItems.value.filter(id => id !== itemId)
  }

  const selectMultipleItems = (itemIds: string[]) => {
    selectedItems.value = [...new Set([...selectedItems.value, ...itemIds])]
  }

  const selectAllItems = () => {
    selectedItems.value = layout.value.map(item => item.i)
  }

  const clearSelection = () => {
    selectedItems.value = []
  }

  const toggleItemSelection = (itemId: string) => {
    if (selectedItems.value.includes(itemId)) {
      deselectItem(itemId)
    } else {
      selectItem(itemId)
    }
  }

  // Batch operations
  const deleteSelectedItems = (): LayoutOperationResult<string[]> => {
    try {
      if (selectedItems.value.length === 0) {
        return {
          success: false,
          error: new Error('No items selected'),
          message: 'No items selected'
        }
      }

      saveToHistory()
      const deletedIds = [...selectedItems.value]

      layout.value = layout.value.filter(item => !selectedItems.value.includes(item.i))
      selectedItems.value = []

      autoSave()

      return {
        success: true,
        data: deletedIds,
        message: `deleted ${deletedIds.length} items`
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: 'Batch deletion failed'
      }
    }
  }

  const duplicateSelectedItems = (): LayoutOperationResult<GridLayoutPlusItem[]> => {
    try {
      if (selectedItems.value.length === 0) {
        return {
          success: false,
          error: new Error('No items selected'),
          message: 'No items selected'
        }
      }

      saveToHistory()
      const duplicatedItems: GridLayoutPlusItem[] = []

      for (const itemId of selectedItems.value) {
        const result = duplicateItem(itemId)
        if (result.success && result.data) {
          duplicatedItems.push(result.data)
        }
      }

      return {
        success: true,
        data: duplicatedItems,
        message: `Copied ${duplicatedItems.length} items`
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: 'Batch copy failed'
      }
    }
  }

  // Layout tools
  const compactCurrentLayout = () => {
    saveToHistory()
    layout.value = compactLayout(layout.value)
    autoSave()
  }

  const sortCurrentLayout = (sortBy: 'position' | 'size' | 'id' = 'position') => {
    saveToHistory()
    layout.value = sortLayout(layout.value, sortBy)
    autoSave()
  }

  const searchItems = (query: string) => {
    return searchLayout(layout.value, query)
  }

  const filterItems = (predicate: (item: GridLayoutPlusItem) => boolean) => {
    return filterLayout(layout.value, predicate)
  }

  // History operations
  const undo = (): LayoutOperationResult<boolean> => {
    if (!canUndo.value) {
      return {
        success: false,
        error: new Error('Nothing to undo'),
        message: 'No undoable actions'
      }
    }

    historyIndex.value--
    layout.value = cloneLayout(history.value[historyIndex.value])

    return {
      success: true,
      data: true,
      message: 'Revoked successfully'
    }
  }

  const redo = (): LayoutOperationResult<boolean> => {
    if (!canRedo.value) {
      return {
        success: false,
        error: new Error('Nothing to redo'),
        message: 'No operations to redo'
      }
    }

    historyIndex.value++
    layout.value = cloneLayout(history.value[historyIndex.value])

    return {
      success: true,
      data: true,
      message: 'Redo successfully'
    }
  }

  // Responsive layout
  const setBreakpoint = (breakpoint: string) => {
    currentBreakpoint.value = breakpoint
  }

  const createResponsiveLayoutForAll = () => {
    responsiveLayouts.value = createResponsiveLayout(layout.value, config.value.breakpoints, config.value.cols)
  }

  const getLayoutForBreakpoint = (breakpoint: string): GridLayoutPlusItem[] => {
    const breakpointLayout = responsiveLayouts.value[breakpoint as keyof ResponsiveLayout]
    return breakpointLayout || layout.value
  }

  // Import and export
  const exportCurrentLayout = (format: 'json' | 'csv' = 'json'): string => {
    return JSON.stringify(layout.value, null, 2) // Simplify implementation
  }

  const importLayout = (data: string): LayoutOperationResult<boolean> => {
    try {
      const importedLayout = JSON.parse(data) as GridLayoutPlusItem[]
      const validation = validateLayout(importedLayout)

      if (!validation.success) {
        return validation
      }

      saveToHistory()
      layout.value = importedLayout
      selectedItems.value = []
      autoSave()

      return {
        success: true,
        data: true,
        message: 'Layout imported successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: 'Layout import failed'
      }
    }
  }

  // Tool method
  const getItem = (itemId: string): GridLayoutPlusItem | undefined => {
    return layout.value.find(item => item.i === itemId)
  }

  const hasItem = (itemId: string): boolean => {
    return layout.value.some(item => item.i === itemId)
  }

  const getSelectedItems = (): GridLayoutPlusItem[] => {
    return layout.value.filter(item => selectedItems.value.includes(item.i))
  }

  // Throttled layout update function
  const throttledLayoutUpdate = throttle((newLayout: GridLayoutPlusItem[]) => {
    layout.value = newLayout
    autoSave()
  }, performanceConfig.value.throttleDelay)

  // listener
  watch(
    () => config.value,
    () => {
      // Revalidate layout when configuration changes
      const validation = validateLayout(layout.value)
      if (!validation.success) {
        error.value = validation.error || null
      } else {
        error.value = null
      }
    },
    { deep: true }
  )

  // Initialize history
  if (options.enableHistory && layout.value.length > 0) {
    saveToHistory()
  }

  return {
    // state
    layout,
    config,
    performanceConfig,
    isLoading,
    error,
    selectedItems,
    currentBreakpoint,
    responsiveLayouts,

    // Computed properties
    layoutStats,
    layoutBounds,
    hasSelectedItems,
    canUndo,
    canRedo,
    isValidLayout,
    optimizedLayout,

    // Layout operations
    addItem,
    removeItem,
    updateItem,
    duplicateItem,
    clearLayout,

    // Select action
    selectItem,
    deselectItem,
    selectMultipleItems,
    selectAllItems,
    clearSelection,
    toggleItemSelection,

    // Batch operations
    deleteSelectedItems,
    duplicateSelectedItems,

    // Layout tools
    compactCurrentLayout,
    sortCurrentLayout,
    searchItems,
    filterItems,

    // History
    undo,
    redo,
    saveToHistory,

    // Responsive layout
    setBreakpoint,
    createResponsiveLayoutForAll,
    getLayoutForBreakpoint,

    // Import and export
    exportCurrentLayout,
    importLayout,

    // Tool method
    getItem,
    hasItem,
    getSelectedItems,
    throttledLayoutUpdate
  }
}
