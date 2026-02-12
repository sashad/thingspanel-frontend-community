/**
 * Grid Core state management Hook
 * Focus on basic state management of grid layout
 */

import { ref, computed, watch } from 'vue'
import type { GridLayoutPlusItem, GridLayoutPlusConfig, LayoutOperationResult } from '../gridLayoutPlusTypes'
import { validateLayout, validateGridItem, cloneLayout, getLayoutBounds, getLayoutStats } from '../gridLayoutPlusUtils'
import { DEFAULT_GRID_LAYOUT_PLUS_CONFIG } from '../gridLayoutPlusTypes'

export interface UseGridCoreOptions {
  /** Initial layout data */
  initialLayout?: GridLayoutPlusItem[]
  /** Grid configuration */
  config?: Partial<GridLayoutPlusConfig>
  /** Whether to enable deep verification */
  enableValidation?: boolean
}

/**
 * Core grid state managementHook
 * Provide basic layout data management and verification functions
 */
export function useGridCore(options: UseGridCoreOptions = {}) {
  // base state
  const layout = ref<GridLayoutPlusItem[]>(options.initialLayout || [])
  const selectedItems = ref<string[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // configuration status
  const config = ref<GridLayoutPlusConfig>({
    ...DEFAULT_GRID_LAYOUT_PLUS_CONFIG,
    ...options.config
  })

  // Computed properties
  const layoutStats = computed(() => {
    try {
      return getLayoutStats(layout.value, config.value.colNum)
    } catch (err) {
      console.error('Failed to calculate layout stats:', err)
      return {
        totalItems: layout.value.length,
        totalRows: 0,
        utilization: 0,
        density: 0
      }
    }
  })

  const layoutBounds = computed(() => {
    try {
      return getLayoutBounds(layout.value)
    } catch (err) {
      console.error('Failed to calculate layout bounds:', err)
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }
    }
  })

  const isValidLayout = computed(() => {
    if (!options.enableValidation) return true

    try {
      const validation = validateLayout(layout.value)
      return validation.success
    } catch (err) {
      error.value = err as Error
      return false
    }
  })

  const hasSelectedItems = computed(() => selectedItems.value.length > 0)

  // Layout operation method
  const updateLayout = (newLayout: GridLayoutPlusItem[]): LayoutOperationResult<void> => {
    try {
      // Validate new layout
      if (options.enableValidation) {
        const validation = validateLayout(newLayout)
        if (!validation.success) {
          return {
            success: false,
            error: validation.error,
            message: validation.message
          }
        }
      }

      layout.value = cloneLayout(newLayout)
      error.value = null

      return { success: true }
    } catch (err) {
      const errorObj = err as Error
      error.value = errorObj
      return {
        success: false,
        error: errorObj,
        message: `Failed to update layout: ${errorObj.message}`
      }
    }
  }

  const addItem = (item: GridLayoutPlusItem): LayoutOperationResult<GridLayoutPlusItem> => {
    try {
      // Verify new project
      if (options.enableValidation) {
        const validation = validateGridItem(item)
        if (!validation.success) {
          return {
            success: false,
            error: validation.error,
            message: validation.message
          }
        }
      }

      // examineIDDoes it already exist?
      if (layout.value.some(existingItem => existingItem.i === item.i)) {
        return {
          success: false,
          error: new Error('Item ID already exists'),
          message: `projectID '${item.i}' Already exists`
        }
      }

      layout.value.push({ ...item })
      return { success: true, data: item }
    } catch (err) {
      const errorObj = err as Error
      error.value = errorObj
      return {
        success: false,
        error: errorObj,
        message: `Failed to add item: ${errorObj.message}`
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
          message: `project '${itemId}' does not exist`
        }
      }

      const removedItem = layout.value.splice(index, 1)[0]

      // Also remove from selected list
      const selectedIndex = selectedItems.value.indexOf(itemId)
      if (selectedIndex > -1) {
        selectedItems.value.splice(selectedIndex, 1)
      }

      return { success: true, data: removedItem }
    } catch (err) {
      const errorObj = err as Error
      error.value = errorObj
      return {
        success: false,
        error: errorObj,
        message: `Failed to remove item: ${errorObj.message}`
      }
    }
  }

  const updateItem = (
    itemId: string,
    updates: Partial<GridLayoutPlusItem>
  ): LayoutOperationResult<GridLayoutPlusItem> => {
    try {
      const item = layout.value.find(item => item.i === itemId)
      if (!item) {
        return {
          success: false,
          error: new Error('Item not found'),
          message: `project '${itemId}' does not exist`
        }
      }

      // Create updated project for verification
      const updatedItem = { ...item, ...updates }
      if (options.enableValidation) {
        const validation = validateGridItem(updatedItem)
        if (!validation.success) {
          return {
            success: false,
            error: validation.error,
            message: validation.message
          }
        }
      }

      // Apply updates
      Object.assign(item, updates)
      return { success: true, data: item }
    } catch (err) {
      const errorObj = err as Error
      error.value = errorObj
      return {
        success: false,
        error: errorObj,
        message: `Failed to update item: ${errorObj.message}`
      }
    }
  }

  const clearLayout = () => {
    layout.value = []
    selectedItems.value = []
    error.value = null
  }

  // Select management
  const selectItem = (itemId: string) => {
    if (!selectedItems.value.includes(itemId)) {
      selectedItems.value.push(itemId)
    }
  }

  const deselectItem = (itemId: string) => {
    const index = selectedItems.value.indexOf(itemId)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    }
  }

  const toggleItemSelection = (itemId: string) => {
    const index = selectedItems.value.indexOf(itemId)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    } else {
      selectedItems.value.push(itemId)
    }
  }

  const selectAll = () => {
    selectedItems.value = layout.value.map(item => item.i)
  }

  const deselectAll = () => {
    selectedItems.value = []
  }

  // Query method
  const getItem = (itemId: string) => {
    return layout.value.find(item => item.i === itemId) || null
  }

  const getSelectedItems = () => {
    return layout.value.filter(item => selectedItems.value.includes(item.i))
  }

  return {
    // state
    layout,
    selectedItems,
    isLoading,
    error,
    config,

    // Computed properties
    layoutStats,
    layoutBounds,
    isValidLayout,
    hasSelectedItems,

    // Layout operations
    updateLayout,
    addItem,
    removeItem,
    updateItem,
    clearLayout,

    // Select management
    selectItem,
    deselectItem,
    toggleItemSelection,
    selectAll,
    deselectAll,

    // Query method
    getItem,
    getSelectedItems
  }
}
