/**
 * Grid Layout Plus Utility function
 */

import type {
  GridLayoutPlusItem,
  GridLayoutPlusConfig,
  LayoutOperationResult,
  ResponsiveLayout,
  PerformanceConfig
} from './gridLayoutPlusTypes'

/**
 * Validate grid items
 */
export function validateGridItem(item: GridLayoutPlusItem): LayoutOperationResult<boolean> {
  try {
    // Check required fields
    if (!item.i || typeof item.i !== 'string') {
      return {
        success: false,
        error: new Error('Grid item must have a valid string id'),
        message: 'Grid item must have a valid stringID'
      }
    }

    // Check position and size
    if (item.x < 0 || item.y < 0) {
      return {
        success: false,
        error: new Error('Grid position must be >= 0'),
        message: 'Grid position must be greater than or equal to0'
      }
    }

    if (item.w <= 0 || item.h <= 0) {
      return {
        success: false,
        error: new Error('Grid size must be > 0'),
        message: 'Grid size must be greater than0'
      }
    }

    // Check constraints
    if (item.minW && item.w < item.minW) {
      return {
        success: false,
        error: new Error('Width is less than minimum'),
        message: 'width less than minimum'
      }
    }

    if (item.maxW && item.w > item.maxW) {
      return {
        success: false,
        error: new Error('Width exceeds maximum'),
        message: 'Width exceeds maximum'
      }
    }

    if (item.minH && item.h < item.minH) {
      return {
        success: false,
        error: new Error('Height is less than minimum'),
        message: 'height less than minimum'
      }
    }

    if (item.maxH && item.h > item.maxH) {
      return {
        success: false,
        error: new Error('Height exceeds maximum'),
        message: 'Height exceeds maximum'
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: 'Grid item validation failed'
    }
  }
}

/**
 * Verify layout
 */
export function validateLayout(layout: GridLayoutPlusItem[]): LayoutOperationResult<boolean> {
  try {
    // examineIDuniqueness
    const ids = layout.map(item => item.i)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      return {
        success: false,
        error: new Error('Duplicate item IDs found'),
        message: 'Duplicate foundID'
      }
    }

    // Check each item
    for (const item of layout) {
      const itemValidation = validateGridItem(item)
      if (!itemValidation.success) {
        return itemValidation
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: 'Layout validation failed'
    }
  }
}

/**
 * Check if two items overlap
 */
export function isItemsOverlapping(item1: GridLayoutPlusItem, item2: GridLayoutPlusItem): boolean {
  return !(
    item1.x + item1.w <= item2.x ||
    item1.x >= item2.x + item2.w ||
    item1.y + item1.h <= item2.y ||
    item1.y >= item2.y + item2.h
  )
}

/**
 * Find available locations
 */
export function findAvailablePosition(
  w: number,
  h: number,
  layout: GridLayoutPlusItem[],
  colNum: number = 12
): { x: number; y: number } {
  // Simple location finding algorithm
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x <= colNum - w; x++) {
      const proposed = { x, y, w, h, i: 'temp' }

      // Check for conflicts with existing projects
      const hasCollision = layout.some(item => isItemsOverlapping(proposed, item))

      if (!hasCollision) {
        return { x, y }
      }
    }
  }

  return { x: 0, y: 0 }
}

/**
 * generate uniqueID
 */
export function generateId(prefix: string = 'item'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Deep clone grid items
 */
export function cloneGridItem(item: GridLayoutPlusItem): GridLayoutPlusItem {
  return {
    ...item,
    props: item.props ? JSON.parse(JSON.stringify(item.props)) : undefined,
    data: item.data ? JSON.parse(JSON.stringify(item.data)) : undefined,
    style: item.style ? { ...item.style } : undefined,
    metadata: item.metadata ? JSON.parse(JSON.stringify(item.metadata)) : undefined
  }
}

/**
 * Batch clone grid items
 */
export function cloneLayout(layout: GridLayoutPlusItem[]): GridLayoutPlusItem[] {
  return layout.map(cloneGridItem)
}

/**
 * Calculate layout bounds
 */
export function getLayoutBounds(layout: GridLayoutPlusItem[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
} {
  if (layout.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  const minX = Math.min(...layout.map(item => item.x))
  const minY = Math.min(...layout.map(item => item.y))
  const maxX = Math.max(...layout.map(item => item.x + item.w))
  const maxY = Math.max(...layout.map(item => item.y + item.h))

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Compact layout
 */
export function compactLayout(layout: GridLayoutPlusItem[]): GridLayoutPlusItem[] {
  const sortedLayout = [...layout].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y
    return a.x - b.x
  })

  const compacted: GridLayoutPlusItem[] = []

  for (const item of sortedLayout) {
    let newY = 0

    // Find the highest place you can place it
    while (newY <= item.y) {
      const tempItem = { ...item, y: newY }
      const hasCollision = compacted.some(placedItem => isItemsOverlapping(tempItem, placedItem))

      if (!hasCollision) {
        break
      }

      newY++
    }

    compacted.push({ ...item, y: newY })
  }

  return compacted
}

/**
 * Layout sorting
 */
export function sortLayout(
  layout: GridLayoutPlusItem[],
  sortBy: 'position' | 'size' | 'id' = 'position'
): GridLayoutPlusItem[] {
  return [...layout].sort((a, b) => {
    switch (sortBy) {
      case 'position':
        if (a.y !== b.y) return a.y - b.y
        return a.x - b.x
      case 'size': {
        const sizeA = a.w * a.h
        const sizeB = b.w * b.h
        return sizeB - sizeA // Big one first
      }
      case 'id':
        return a.i.localeCompare(b.i)
      default:
        return 0
    }
  })
}

/**
 * Filter layout
 */
export function filterLayout(
  layout: GridLayoutPlusItem[],
  predicate: (item: GridLayoutPlusItem) => boolean
): GridLayoutPlusItem[] {
  return layout.filter(predicate)
}

/**
 * Search layout items
 */
export function searchLayout(
  layout: GridLayoutPlusItem[],
  query: string,
  searchFields: (keyof GridLayoutPlusItem)[] = ['i', 'type', 'title']
): GridLayoutPlusItem[] {
  const lowercaseQuery = query.toLowerCase()

  return layout.filter(item => {
    return searchFields.some(field => {
      const value = item[field]
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowercaseQuery)
      }
      return false
    })
  })
}

/**
 * layout statistics
 */
export function getLayoutStats(layout: GridLayoutPlusItem[], colNum: number = 12) {
  const bounds = getLayoutBounds(layout)
  const totalCells = bounds.width * bounds.height
  const usedCells = layout.reduce((sum, item) => sum + item.w * item.h, 0)

  return {
    totalItems: layout.length,
    totalRows: bounds.height,
    totalCells,
    usedCells,
    utilization: totalCells > 0 ? (usedCells / totalCells) * 100 : 0,
    bounds,
    largestItem: layout.reduce(
      (largest, item) => {
        const size = item.w * item.h
        const largestSize = largest ? largest.w * largest.h : 0
        return size > largestSize ? item : largest
      },
      null as GridLayoutPlusItem | null
    ),
    smallestItem: layout.reduce(
      (smallest, item) => {
        const size = item.w * item.h
        const smallestSize = smallest ? smallest.w * smallest.h : Infinity
        return size < smallestSize ? item : smallest
      },
      null as GridLayoutPlusItem | null
    ),
    averageSize: layout.length > 0 ? layout.reduce((sum, item) => sum + item.w * item.h, 0) / layout.length : 0
  }
}

/**
 * Responsive layout conversion
 */
export function transformLayoutForBreakpoint(
  layout: GridLayoutPlusItem[],
  fromCols: number,
  toCols: number
): GridLayoutPlusItem[] {
  if (fromCols === toCols) return cloneLayout(layout)

  const scale = toCols / fromCols

  return layout.map(item => ({
    ...item,
    x: Math.round(item.x * scale),
    w: Math.max(1, Math.round(item.w * scale))
    // yandhremain unchanged，Zoom horizontally only
  }))
}

/**
 * Create a responsive layout
 */
export function createResponsiveLayout(
  baseLayout: GridLayoutPlusItem[],
  breakpoints: Record<string, number>,
  cols: Record<string, number>
): ResponsiveLayout {
  const responsive: ResponsiveLayout = {}
  const baseCols = cols.lg || 12

  Object.keys(breakpoints).forEach(breakpoint => {
    const targetCols = cols[breakpoint] || baseCols
    responsive[breakpoint as keyof ResponsiveLayout] = transformLayoutForBreakpoint(baseLayout, baseCols, targetCols)
  })

  return responsive
}

/**
 * Optimize layout performance
 */
export function optimizeLayoutPerformance(
  layout: GridLayoutPlusItem[],
  config: PerformanceConfig
): GridLayoutPlusItem[] {
  let optimizedLayout = [...layout]

  // If lazy loading is enabled，Mark invisible items
  if (config.enableLazyLoading) {
    // Here you can mark items based on the visible area
    // The actual implementation requires a combination of scroll position and container size
  }

  // If the number of projects exceeds the virtualization threshold，Enable virtualization optimization
  if (config.enableVirtualization && layout.length > config.virtualizationThreshold) {
    // virtualization logic
  }

  return optimizedLayout
}

/**
 * Anti-shake function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func.apply(this, args)
    }
  }
}

/**
 * Layout export
 */
export function exportLayout(layout: GridLayoutPlusItem[], format: 'json' | 'csv' = 'json'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(layout, null, 2)
    case 'csv': {
      const headers = ['i', 'x', 'y', 'w', 'h', 'type', 'title']
      const csvRows = [
        headers.join(','),
        ...layout.map(item => headers.map(header => item[header as keyof GridLayoutPlusItem] || '').join(','))
      ]
      return csvRows.join('\n')
    }
    default:
      return JSON.stringify(layout)
  }
}

/**
 * Layout import
 */
export function importLayout(data: string, format: 'json' | 'csv' = 'json'): GridLayoutPlusItem[] {
  try {
    switch (format) {
      case 'json':
        return JSON.parse(data)
      case 'csv': {
        const lines = data.split('\n')
        const headers = lines[0].split(',')
        return lines.slice(1).map(line => {
          const values = line.split(',')
          const item: any = {}
          headers.forEach((header, index) => {
            const value = values[index]
            if (['x', 'y', 'w', 'h'].includes(header)) {
              item[header] = parseInt(value) || 0
            } else {
              item[header] = value
            }
          })
          return item as GridLayoutPlusItem
        })
      }
      default:
        return JSON.parse(data)
    }
  } catch (error) {
    return []
  }
}

/**
 * Get the project's configuration at the specified breakpoint
 */
export function getItemAtBreakpoint(
  item: GridLayoutPlusItem,
  breakpoint: string,
  responsiveLayout?: ResponsiveLayout
): GridLayoutPlusItem {
  if (responsiveLayout && responsiveLayout[breakpoint as keyof ResponsiveLayout]) {
    const breakpointLayout = responsiveLayout[breakpoint as keyof ResponsiveLayout]!
    const found = breakpointLayout.find(i => i.i === item.i)
    if (found) return found
  }
  return item
}
