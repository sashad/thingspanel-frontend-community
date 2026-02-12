/**
 * Grid General utility functions
 * IncludeIDgenerate、deep clone、General functions such as statistical calculations
 */

import type { GridLayoutPlusItem } from '../gridLayoutPlusTypes'

/**
 * generate uniqueID
 */
export function generateId(prefix = 'item'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Deep clone layout
 */
export function cloneLayout(layout: GridLayoutPlusItem[]): GridLayoutPlusItem[] {
  try {
    return JSON.parse(JSON.stringify(layout))
  } catch (error) {
    console.error('Failed to clone layout:', error)
    return layout.map(item => ({ ...item }))
  }
}

/**
 * Deep clone grid items
 */
export function cloneGridItem(item: GridLayoutPlusItem): GridLayoutPlusItem {
  try {
    return JSON.parse(JSON.stringify(item))
  } catch (error) {
    console.error('Failed to clone grid item:', error)
    return { ...item }
  }
}

/**
 * Calculate layout statistics
 */
export function getLayoutStats(
  layout: GridLayoutPlusItem[],
  cols: number
): {
  totalItems: number
  totalRows: number
  utilization: number
  density: number
  averageSize: number
  largestItem: { id: string; area: number } | null
  smallestItem: { id: string; area: number } | null
} {
  try {
    if (layout.length === 0) {
      return {
        totalItems: 0,
        totalRows: 0,
        utilization: 0,
        density: 0,
        averageSize: 0,
        largestItem: null,
        smallestItem: null
      }
    }

    const totalItems = layout.length
    const totalRows = Math.max(...layout.map(item => item.y + item.h), 1)
    const totalCells = cols * totalRows

    // Calculate the total number of grid cells occupied by all projects
    const occupiedCells = layout.reduce((sum, item) => sum + item.w * item.h, 0)

    const utilization = totalCells > 0 ? (occupiedCells / totalCells) * 100 : 0
    const density = totalItems > 0 ? occupiedCells / totalItems : 0
    const averageSize = totalItems > 0 ? occupiedCells / totalItems : 0

    // Find the largest and smallest item
    let largestItem = null
    let smallestItem = null
    let maxArea = 0
    let minArea = Infinity

    for (const item of layout) {
      const area = item.w * item.h

      if (area > maxArea) {
        maxArea = area
        largestItem = { id: item.i, area }
      }

      if (area < minArea) {
        minArea = area
        smallestItem = { id: item.i, area }
      }
    }

    return {
      totalItems,
      totalRows,
      utilization,
      density,
      averageSize,
      largestItem,
      smallestItem
    }
  } catch (error) {
    console.error('Failed to get layout stats:', error)
    return {
      totalItems: layout.length,
      totalRows: 0,
      utilization: 0,
      density: 0,
      averageSize: 0,
      largestItem: null,
      smallestItem: null
    }
  }
}

/**
 * Filter layout items
 */
export function filterLayout(
  layout: GridLayoutPlusItem[],
  predicate: (item: GridLayoutPlusItem, index: number) => boolean
): GridLayoutPlusItem[] {
  try {
    return layout.filter(predicate)
  } catch (error) {
    console.error('Failed to filter layout:', error)
    return layout
  }
}

/**
 * Search layout items
 */
export function searchLayout(
  layout: GridLayoutPlusItem[],
  query: string,
  searchFields: Array<keyof GridLayoutPlusItem> = ['i', 'type', 'title']
): GridLayoutPlusItem[] {
  try {
    if (!query.trim()) return layout

    const lowerQuery = query.toLowerCase()

    return layout.filter(item => {
      return searchFields.some(field => {
        const value = item[field]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerQuery)
        }
        if (typeof value === 'number') {
          return value.toString().includes(query)
        }
        return false
      })
    })
  } catch (error) {
    console.error('Failed to search layout:', error)
    return layout
  }
}

/**
 * Project converted toCSS GridArea definition
 */
export function itemToGridArea(item: GridLayoutPlusItem): string {
  try {
    // CSS Grid rows and columns from1Start counting
    const rowStart = item.y + 1
    const rowEnd = item.y + item.h + 1
    const colStart = item.x + 1
    const colEnd = item.x + item.w + 1

    return `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}`
  } catch (error) {
    console.error('Failed to convert item to grid area:', error)
    return 'auto'
  }
}

/**
 * Calculate grid utilization
 */
export function calculateGridUtilization(layout: GridLayoutPlusItem[], cols: number, rows?: number): number {
  try {
    if (layout.length === 0) return 0

    const actualRows = rows || Math.max(...layout.map(item => item.y + item.h), 1)
    const totalCells = cols * actualRows
    const occupiedCells = layout.reduce((sum, item) => sum + item.w * item.h, 0)

    return totalCells > 0 ? (occupiedCells / totalCells) * 100 : 0
  } catch (error) {
    console.error('Failed to calculate grid utilization:', error)
    return 0
  }
}

/**
 * Calculate the total number of rows
 */
export function calculateTotalRows(layout: GridLayoutPlusItem[]): number {
  try {
    if (layout.length === 0) return 0
    return Math.max(...layout.map(item => item.y + item.h))
  } catch (error) {
    console.error('Failed to calculate total rows:', error)
    return 0
  }
}

/**
 * Get grid statistics（detailed version）
 */
export function getGridStatistics(
  layout: GridLayoutPlusItem[],
  cols: number
): {
  basic: ReturnType<typeof getLayoutStats>
  distribution: {
    bySize: Record<string, number>
    byPosition: { topHalf: number; bottomHalf: number }
    byWidth: Record<number, number>
    byHeight: Record<number, number>
  }
  performance: {
    fragmentation: number
    compactness: number
    balance: number
  }
} {
  try {
    const basic = getLayoutStats(layout, cols)

    // size distribution
    const sizeDistribution: Record<string, number> = {}
    const widthDistribution: Record<number, number> = {}
    const heightDistribution: Record<number, number> = {}

    for (const item of layout) {
      const area = item.w * item.h
      const sizeCategory = area <= 2 ? 'small' : area <= 6 ? 'medium' : 'large'

      sizeDistribution[sizeCategory] = (sizeDistribution[sizeCategory] || 0) + 1
      widthDistribution[item.w] = (widthDistribution[item.w] || 0) + 1
      heightDistribution[item.h] = (heightDistribution[item.h] || 0) + 1
    }

    // Location distribution
    const totalRows = basic.totalRows
    const halfRows = totalRows / 2
    const topHalf = layout.filter(item => item.y < halfRows).length
    const bottomHalf = layout.length - topHalf

    // Performance indicators
    const fragmentation = calculateFragmentation(layout, cols)
    const compactness = calculateCompactness(layout, cols)
    const balance = calculateBalance(layout, cols)

    return {
      basic,
      distribution: {
        bySize: sizeDistribution,
        byPosition: { topHalf, bottomHalf },
        byWidth: widthDistribution,
        byHeight: heightDistribution
      },
      performance: {
        fragmentation,
        compactness,
        balance
      }
    }
  } catch (error) {
    console.error('Failed to get grid statistics:', error)
    return {
      basic: getLayoutStats(layout, cols),
      distribution: {
        bySize: {},
        byPosition: { topHalf: 0, bottomHalf: 0 },
        byWidth: {},
        byHeight: {}
      },
      performance: {
        fragmentation: 0,
        compactness: 0,
        balance: 0
      }
    }
  }
}

/**
 * Calculate layout fragmentation
 */
function calculateFragmentation(layout: GridLayoutPlusItem[], cols: number): number {
  try {
    if (layout.length === 0) return 0

    const totalRows = Math.max(...layout.map(item => item.y + item.h))
    const grid = Array(totalRows)
      .fill(null)
      .map(() => Array(cols).fill(false))

    // Mark occupied grid cells
    for (const item of layout) {
      for (let y = item.y; y < item.y + item.h; y++) {
        for (let x = item.x; x < item.x + item.w; x++) {
          if (y < totalRows && x < cols) {
            grid[y][x] = true
          }
        }
      }
    }

    // Calculate the number of gaps
    let gaps = 0
    let totalCells = 0

    for (let y = 0; y < totalRows; y++) {
      for (let x = 0; x < cols; x++) {
        totalCells++
        if (!grid[y][x]) {
          gaps++
        }
      }
    }

    return totalCells > 0 ? (gaps / totalCells) * 100 : 0
  } catch (error) {
    console.error('Failed to calculate fragmentation:', error)
    return 0
  }
}

/**
 * Calculate layout compactness
 */
function calculateCompactness(layout: GridLayoutPlusItem[], cols: number): number {
  try {
    if (layout.length === 0) return 100

    const totalArea = layout.reduce((sum, item) => sum + item.w * item.h, 0)
    const boundingHeight = Math.max(...layout.map(item => item.y + item.h))
    const boundingArea = cols * boundingHeight

    return boundingArea > 0 ? (totalArea / boundingArea) * 100 : 0
  } catch (error) {
    console.error('Failed to calculate compactness:', error)
    return 0
  }
}

/**
 * Calculate layout balance
 */
function calculateBalance(layout: GridLayoutPlusItem[], cols: number): number {
  try {
    if (layout.length === 0) return 100

    const centerX = cols / 2
    const totalRows = Math.max(...layout.map(item => item.y + item.h))
    const centerY = totalRows / 2

    // Calculate center of gravity
    let weightedX = 0
    let weightedY = 0
    let totalWeight = 0

    for (const item of layout) {
      const weight = item.w * item.h
      const itemCenterX = item.x + item.w / 2
      const itemCenterY = item.y + item.h / 2

      weightedX += itemCenterX * weight
      weightedY += itemCenterY * weight
      totalWeight += weight
    }

    if (totalWeight === 0) return 100

    const gravityX = weightedX / totalWeight
    const gravityY = weightedY / totalWeight

    // Calculate deviation from center
    const deviationX = Math.abs(gravityX - centerX) / centerX
    const deviationY = Math.abs(gravityY - centerY) / centerY
    const totalDeviation = (deviationX + deviationY) / 2

    return Math.max(0, (1 - totalDeviation) * 100)
  } catch (error) {
    console.error('Failed to calculate balance:', error)
    return 0
  }
}

/**
 * Array deduplication
 */
export function uniqueArray<T>(array: T[], keyFn?: (item: T) => string | number): T[] {
  try {
    if (!keyFn) {
      return [...new Set(array)]
    }

    const seen = new Set<string | number>()
    return array.filter(item => {
      const key = keyFn(item)
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  } catch (error) {
    console.error('Failed to get unique array:', error)
    return array
  }
}

/**
 * Safe numerical parsing
 */
export function parseNumber(value: any, defaultValue = 0): number {
  try {
    if (typeof value === 'number' && !isNaN(value)) {
      return value
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? defaultValue : parsed
    }

    return defaultValue
  } catch (error) {
    return defaultValue
  }
}

/**
 * Limit the value to a specified range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  try {
    if (bytes === 0) return '0 B'

    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const size = bytes / Math.pow(1024, i)

    return `${size.toFixed(1)} ${sizes[i]}`
  } catch (error) {
    return '0 B'
  }
}

/**
 * Format duration
 */
export function formatDuration(milliseconds: number): string {
  try {
    if (milliseconds < 1000) {
      return `${milliseconds.toFixed(1)}ms`
    }

    const seconds = milliseconds / 1000
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`
    }

    const minutes = seconds / 60
    return `${minutes.toFixed(1)}m`
  } catch (error) {
    return '0ms'
  }
}
