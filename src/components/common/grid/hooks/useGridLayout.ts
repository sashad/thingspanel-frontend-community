/**
 * grid layoutHook - Manage grid layout logic
 */

import { computed, reactive, ref, watch, type Ref } from 'vue'
import type {
  GridConfig,
  GridItem,
  GridCalculation,
  UseGridLayoutReturn,
  GridPosition,
  GridSize,
  PixelPosition,
  PixelSize
} from '../types'
import { DEFAULT_GRID_CONFIG } from '../types'
import {
  calculateColWidth,
  calculateTotalRows,
  calculateContainerHeight,
  getGridArea,
  validateGridPosition,
  getItemPixelPosition,
  getItemPixelSize,
  gridToPixel,
  pixelToGrid,
  generateGridBackgroundStyle
} from '../utils'

/**
 * grid layoutHook
 * @param items Grid item responsive quotes
 * @param config Grid configuration
 * @param containerElement Container element reference
 * @returns Layout-related calculation functions and responsive data
 */
export function useGridLayout(
  items: Ref<GridItem[]>,
  config: Partial<GridConfig> = {},
  containerElement?: Ref<HTMLElement | undefined>
): UseGridLayoutReturn {
  // Merge default configuration，Listen for configuration changes
  const gridConfig = reactive<GridConfig>({
    ...DEFAULT_GRID_CONFIG,
    ...config
  })

  // Monitor external configuration changes
  watch(
    () => config,
    newConfig => {
      Object.assign(gridConfig, { ...DEFAULT_GRID_CONFIG, ...newConfig })
    },
    { deep: true, immediate: true }
  )

  // Container width
  const containerWidth = ref(1200)

  // Monitor container size changes
  if (containerElement) {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
      }
    })

    watch(
      containerElement,
      (newEl, oldEl) => {
        if (oldEl) {
          resizeObserver.unobserve(oldEl)
        }
        if (newEl) {
          resizeObserver.observe(newEl)
          containerWidth.value = newEl.offsetWidth || 1200
        }
      },
      { immediate: true }
    )
  }

  // Calculate column width
  const colWidth = computed(() => calculateColWidth(gridConfig, containerWidth.value))

  // Calculate the total number of rows
  const totalRows = computed(() => calculateTotalRows(items.value, gridConfig.minRows))

  // Calculate container height
  const containerHeight = computed(() =>
    Math.max(calculateContainerHeight(totalRows.value, gridConfig.rowHeight, gridConfig.gap), gridConfig.minHeight || 0)
  )

  // Grid style calculation
  const gridCalculation = computed<GridCalculation>(() => {
    const gridTemplateColumns = `repeat(${gridConfig.columns}, ${colWidth.value}px)`
    const gridTemplateRows = `repeat(${totalRows.value}, ${gridConfig.rowHeight}px)`

    const gridStyle: Record<string, any> = {
      display: 'grid',
      gridTemplateColumns,
      gridTemplateRows,
      gap: `${gridConfig.gap}px`,
      width: '100%',
      height: `${containerHeight.value}px`,
      minHeight: `${gridConfig.minHeight || 0}px`,
      position: 'relative'
    }

    // Add grid background
    if (gridConfig.showGrid) {
      Object.assign(gridStyle, generateGridBackgroundStyle(gridConfig, containerWidth.value))
    }

    const itemStyle: Record<string, any> = {
      position: 'relative',
      overflow: 'hidden'
    }

    return {
      gridStyle,
      itemStyle,
      totalRows: totalRows.value,
      containerHeight: containerHeight.value
    }
  })

  // Raster coordinates to pixels
  const gridToPixelFunc = (gridPos: number, isCol: boolean = true): number => {
    const cellSize = isCol ? colWidth.value : gridConfig.rowHeight
    return gridToPixel(gridPos, cellSize, gridConfig.gap)
  }

  // Pixel to raster coordinate
  const pixelToGridFunc = (pixel: number, isCol: boolean = true): number => {
    const cellSize = isCol ? colWidth.value : gridConfig.rowHeight
    return pixelToGrid(pixel, cellSize, gridConfig.gap)
  }

  // Get grid areaCSS
  const getGridAreaFunc = (item: GridItem): string => {
    return getGridArea(item)
  }

  // Verify location validity
  const validatePositionFunc = (position: GridPosition, size: GridSize): boolean => {
    return validateGridPosition(position, size, gridConfig)
  }

  // Calculate item pixel position
  const getItemPixelPositionFunc = (item: GridItem): PixelPosition => {
    return getItemPixelPosition(item, gridConfig, containerWidth.value)
  }

  // Calculate project pixel dimensions
  const getItemPixelSizeFunc = (item: GridItem): PixelSize => {
    return getItemPixelSize(item, gridConfig, containerWidth.value)
  }

  return {
    gridConfig: readonly(gridConfig),
    gridCalculation: readonly(gridCalculation),
    gridToPixel: gridToPixelFunc,
    pixelToGrid: pixelToGridFunc,
    getGridArea: getGridAreaFunc,
    validatePosition: validatePositionFunc,
    getItemPixelPosition: getItemPixelPositionFunc,
    getItemPixelSize: getItemPixelSizeFunc
  }
}

/**
 * Create a read-only reactive object
 */
function readonly<T>(obj: T): Readonly<T> {
  return obj as Readonly<T>
}
