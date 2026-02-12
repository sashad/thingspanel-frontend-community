/**
 * Grid Verification tool function
 * Validation logic that specifically handles grid items and layouts
 */

import type { GridLayoutPlusItem, LayoutOperationResult } from '../gridLayoutPlusTypes'

/**
 * Verify grid item base properties
 * 🔥 extended version：support0-99column range
 */
export function validateGridItem(item: GridLayoutPlusItem, maxCols = 99): LayoutOperationResult<boolean> {
  try {
    // Check required fields
    if (!item.i || typeof item.i !== 'string') {
      return {
        success: false,
        error: new Error('Grid item must have a valid string id'),
        message: 'Grid item must have a valid stringID'
      }
    }

    // 🔥 Expand：Check position and size - Support wider range
    if (item.x < 0 || item.x >= maxCols) {
      return {
        success: false,
        error: new Error(`Grid X position must be between 0 and ${maxCols - 1}`),
        message: `gridXLocation must be in0arrive${maxCols - 1}between`
      }
    }

    if (item.y < 0) {
      return {
        success: false,
        error: new Error('Grid Y position must be >= 0'),
        message: 'gridYPosition must be greater than or equal to0'
      }
    }

    if (item.w <= 0 || item.w > maxCols) {
      return {
        success: false,
        error: new Error(`Grid width must be between 1 and ${maxCols}`),
        message: `Grid width must be within1arrive${maxCols}between`
      }
    }

    if (item.h <= 0) {
      return {
        success: false,
        error: new Error('Grid height must be > 0'),
        message: 'Grid height must be greater than0'
      }
    }

    // 🔥 New：Check if bounds are exceeded
    if (item.x + item.w > maxCols) {
      return {
        success: false,
        error: new Error(`Grid item extends beyond boundary (x:${item.x} + w:${item.w} > maxCols:${maxCols})`),
        message: `Grid item exceeds bounds（x:${item.x} + w:${item.w} > Maximum number of columns:${maxCols}）`
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
 * Verify layout integrity
 */
export function validateLayout(layout: GridLayoutPlusItem[]): LayoutOperationResult<boolean> {
  try {
    // Check if layout is empty
    if (!Array.isArray(layout)) {
      return {
        success: false,
        error: new Error('Layout must be an array'),
        message: 'Layout must be of array type'
      }
    }

    if (layout.length === 0) {
      return { success: true, data: true } // Empty layout is valid
    }

    // examineIDuniqueness
    const ids = layout.map(item => item.i)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
      return {
        success: false,
        error: new Error(`Duplicate item IDs found: ${duplicates.join(', ')}`),
        message: `Duplicate foundID: ${duplicates.join(', ')}`
      }
    }

    // Validate grid items one by one
    for (let i = 0; i < layout.length; i++) {
      const itemValidation = validateGridItem(layout[i])
      if (!itemValidation.success) {
        return {
          success: false,
          error: itemValidation.error,
          message: `No. ${i + 1} Grid item validation failed: ${itemValidation.message}`
        }
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
 * Verify that the grid position is valid
 */
export function validateGridPosition(
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number
): LayoutOperationResult<boolean> {
  try {
    // Check base range
    if (x < 0 || y < 0 || w <= 0 || h <= 0) {
      return {
        success: false,
        error: new Error('Invalid position or size'),
        message: 'Invalid position or size'
      }
    }

    // Check if the number of columns is exceeded
    if (x + w > cols) {
      return {
        success: false,
        error: new Error(`Item width exceeds column limit: ${x + w} > ${cols}`),
        message: `Item width exceeds column limit: ${x + w} > ${cols}`
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: 'Grid location verification failed'
    }
  }
}

/**
 * Check if two grid items overlap
 */
export function checkItemsOverlap(item1: GridLayoutPlusItem, item2: GridLayoutPlusItem): boolean {
  try {
    return !(
      item1.x + item1.w <= item2.x ||
      item1.x >= item2.x + item2.w ||
      item1.y + item1.h <= item2.y ||
      item1.y >= item2.y + item2.h
    )
  } catch (error) {
    console.error('Failed to check items overlap:', error)
    return false
  }
}

/**
 * Check if there are overlapping items in the layout
 */
export function validateNoOverlaps(layout: GridLayoutPlusItem[]): LayoutOperationResult<boolean> {
  try {
    for (let i = 0; i < layout.length; i++) {
      for (let j = i + 1; j < layout.length; j++) {
        if (checkItemsOverlap(layout[i], layout[j])) {
          return {
            success: false,
            error: new Error(`Items overlap: ${layout[i].i} and ${layout[j].i}`),
            message: `Project overlap: ${layout[i].i} and ${layout[j].i}`
          }
        }
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: 'Overlap check failed'
    }
  }
}

/**
 * Verify reactive configuration
 */
export function validateResponsiveConfig(
  breakpoints: Record<string, number>,
  cols: Record<string, number>
): LayoutOperationResult<boolean> {
  try {
    const breakpointNames = Object.keys(breakpoints)
    const colNames = Object.keys(cols)

    // Check if breakpoints and column configuration match
    for (const bp of breakpointNames) {
      if (!(bp in cols)) {
        return {
          success: false,
          error: new Error(`Missing column config for breakpoint: ${bp}`),
          message: `breakpoint ${bp} Missing column configuration`
        }
      }
    }

    // Check if breakpoint value is valid
    for (const [bp, width] of Object.entries(breakpoints)) {
      if (width < 0) {
        return {
          success: false,
          error: new Error(`Invalid breakpoint width: ${bp} = ${width}`),
          message: `Invalid breakpoint width: ${bp} = ${width}`
        }
      }
    }

    // Check if the number of columns is valid
    for (const [bp, colCount] of Object.entries(cols)) {
      if (colCount <= 0) {
        return {
          success: false,
          error: new Error(`Invalid column count: ${bp} = ${colCount}`),
          message: `Invalid number of columns: ${bp} = ${colCount}`
        }
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: 'Reactive configuration validation failed'
    }
  }
}

// 🔥 New：Extended grid tool functions

/**
 * Verify extended grid configuration（support0-99List）
 */
export function validateExtendedGridConfig(colNum: number): LayoutOperationResult<boolean> {
  try {
    if (colNum < 1 || colNum > 99) {
      return {
        success: false,
        error: new Error(`Column count must be between 1 and 99, got ${colNum}`),
        message: `The number of columns must be within1arrive99between，Currently${colNum}`
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: 'Extended grid configuration verification failed'
    }
  }
}

/**
 * Verify large grid layout performance
 */
export function validateLargeGridPerformance(
  layout: GridLayoutPlusItem[],
  colNum: number
): LayoutOperationResult<{ warning?: string; recommendation?: string }> {
  try {
    const itemCount = layout.length
    const gridSize = colNum * Math.max(...layout.map(item => item.y + item.h), 10) // Estimate number of rows

    // Performance warning threshold
    const warnings = []
    const recommendations = []

    if (colNum > 50 && itemCount > 50) {
      warnings.push('large grid（>50List）Works with a large number of components（>50indivual）May affect performance')
      recommendations.push('Consider using virtual scrolling or paged loading')
    }

    if (gridSize > 5000) {
      warnings.push('The total number of grid cells is too large，May cause slow rendering')
      recommendations.push('Optimize mesh density or reduce component count')
    }

    if (colNum > 80) {
      warnings.push('Exceed80Grid of columns can be difficult to operate on small screens')
      recommendations.push('Enable responsive configuration，Reduce the number of columns on small screens')
    }

    return {
      success: true,
      data: {
        warning: warnings.length > 0 ? warnings.join('; ') : undefined,
        recommendation: recommendations.length > 0 ? recommendations.join('; ') : undefined
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: 'Large grid performance verification failed'
    }
  }
}

/**
 * Automatically optimize grid item sizes（Adapt to large grids）
 */
export function optimizeItemForLargeGrid(
  item: GridLayoutPlusItem,
  targetCols: number,
  sourceCols = 12
): GridLayoutPlusItem {
  try {
    if (targetCols === sourceCols) return { ...item }

    const ratio = targetCols / sourceCols

    // Adjust position and size proportionally
    const optimized = {
      ...item,
      x: Math.floor(item.x * ratio),
      w: Math.max(1, Math.floor(item.w * ratio))
    }

    // Make sure to stay within the boundaries
    if (optimized.x + optimized.w > targetCols) {
      optimized.x = Math.max(0, targetCols - optimized.w)
    }

    return optimized
  } catch (error) {
    console.error('Failed to optimize item for large grid:', error)
    return { ...item }
  }
}
