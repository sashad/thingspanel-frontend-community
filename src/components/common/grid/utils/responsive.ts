/**
 * Grid Responsive utility functions
 * Specially handles breakpoint management、Responsive features such as layout transitions
 */

import type { GridLayoutPlusItem, ResponsiveLayout, LayoutOperationResult } from '../gridLayoutPlusTypes'

/**
 * Create a responsive layout
 */
export function createResponsiveLayout(
  baseLayout: GridLayoutPlusItem[],
  breakpoints: Record<string, number>,
  cols: Record<string, number>
): ResponsiveLayout {
  try {
    const responsiveLayout: ResponsiveLayout = {}
    const sortedBreakpoints = Object.entries(breakpoints).sort(([, a], [, b]) => b - a) // Sort from large to small

    // Generate layout for each breakpoint
    for (const [breakpoint] of sortedBreakpoints) {
      const targetCols = cols[breakpoint] || 12
      const baseCols = cols.lg || 12

      responsiveLayout[breakpoint] = transformLayoutForBreakpoint(baseLayout, baseCols, targetCols, breakpoint)
    }

    return responsiveLayout
  } catch (error) {
    console.error('Failed to create responsive layout:', error)
    return {}
  }
}

/**
 * Convert layout for specific breakpoints
 */
export function transformLayoutForBreakpoint(
  sourceLayout: GridLayoutPlusItem[],
  sourceCols: number,
  targetCols: number,
  breakpoint: string
): GridLayoutPlusItem[] {
  try {
    if (sourceCols === targetCols) {
      return sourceLayout.map(item => ({ ...item }))
    }

    const ratio = targetCols / sourceCols

    return sourceLayout.map(item => {
      // Calculate new position and size
      const newX = Math.floor(item.x * ratio)
      const newW = Math.max(1, Math.floor(item.w * ratio))

      // Make sure the project doesn't go out of bounds
      const adjustedX = Math.min(newX, targetCols - newW)

      return {
        ...item,
        x: Math.max(0, adjustedX),
        w: newW,
        // YCoordinates and height remain the same，Let the layout algorithm adjust automatically
        // But it can be adjusted according to the breakpoint characteristics
        h: getResponsiveHeight(item, breakpoint)
      }
    })
  } catch (error) {
    console.error('Failed to transform layout for breakpoint:', error)
    return sourceLayout
  }
}

/**
 * Get responsive height based on breakpoint
 */
function getResponsiveHeight(item: GridLayoutPlusItem, breakpoint: string): number {
  try {
    // Adjust height based on breakpoints
    switch (breakpoint) {
      case 'xs':
      case 'xxs':
        // Smaller screens may require taller items to accommodate content
        return Math.max(item.h, 2)

      case 'sm':
        return Math.max(item.h, 1)

      default:
        return item.h
    }
  } catch (error) {
    console.error('Failed to get responsive height:', error)
    return item.h
  }
}

/**
 * Incorporate responsive layout
 */
export function mergeResponsiveLayouts(layout1: ResponsiveLayout, layout2: ResponsiveLayout): ResponsiveLayout {
  try {
    const merged: ResponsiveLayout = { ...layout1 }

    for (const [breakpoint, layout] of Object.entries(layout2)) {
      merged[breakpoint] = layout
    }

    return merged
  } catch (error) {
    console.error('Failed to merge responsive layouts:', error)
    return layout1
  }
}

/**
 * Validate responsive layout
 */
export function validateResponsiveLayout(
  responsiveLayout: ResponsiveLayout,
  breakpoints: Record<string, number>,
  cols: Record<string, number>
): LayoutOperationResult<boolean> {
  try {
    for (const [breakpoint, layout] of Object.entries(responsiveLayout)) {
      // Check if breakpoint exists
      if (!(breakpoint in breakpoints)) {
        return {
          success: false,
          error: new Error(`Unknown breakpoint: ${breakpoint}`),
          message: `unknown breakpoint: ${breakpoint}`
        }
      }

      // Check column configuration
      const breakpointCols = cols[breakpoint]
      if (!breakpointCols) {
        return {
          success: false,
          error: new Error(`Missing column config for breakpoint: ${breakpoint}`),
          message: `breakpoint ${breakpoint} Missing column configuration`
        }
      }

      // Validate each item in the layout
      for (const item of layout) {
        if (item.x + item.w > breakpointCols) {
          return {
            success: false,
            error: new Error(`Item ${item.i} exceeds column limit in breakpoint ${breakpoint}`),
            message: `project ${item.i} at breakpoint ${breakpoint} Column limit exceeded in`
          }
        }
      }
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      message: 'Responsive layout validation failed'
    }
  }
}

/**
 * Get breakpoint information
 */
export function getBreakpointInfo(
  currentWidth: number,
  breakpoints: Record<string, number>
): {
  current: string
  next?: string
  previous?: string
  width: number
} {
  try {
    const sortedBreakpoints = Object.entries(breakpoints).sort(([, a], [, b]) => b - a) // Sort from large to small

    let current = sortedBreakpoints[sortedBreakpoints.length - 1][0] // Default minimum breakpoint
    let currentIndex = sortedBreakpoints.length - 1

    // Find current breakpoint
    for (let i = 0; i < sortedBreakpoints.length; i++) {
      const [breakpoint, minWidth] = sortedBreakpoints[i]
      if (currentWidth >= minWidth) {
        current = breakpoint
        currentIndex = i
        break
      }
    }

    return {
      current,
      next: currentIndex > 0 ? sortedBreakpoints[currentIndex - 1][0] : undefined,
      previous: currentIndex < sortedBreakpoints.length - 1 ? sortedBreakpoints[currentIndex + 1][0] : undefined,
      width: currentWidth
    }
  } catch (error) {
    console.error('Failed to get breakpoint info:', error)
    return {
      current: 'lg',
      width: currentWidth
    }
  }
}

/**
 * Calculate breakpoint transition
 */
export function calculateBreakpointTransition(
  fromBreakpoint: string,
  toBreakpoint: string,
  breakpoints: Record<string, number>,
  cols: Record<string, number>
): {
  direction: 'up' | 'down'
  ratio: number
  significant: boolean
} {
  try {
    const fromWidth = breakpoints[fromBreakpoint] || 0
    const toWidth = breakpoints[toBreakpoint] || 0
    const fromCols = cols[fromBreakpoint] || 12
    const toCols = cols[toBreakpoint] || 12

    const direction = toWidth > fromWidth ? 'up' : 'down'
    const ratio = toCols / fromCols
    const significant = Math.abs(ratio - 1) > 0.2 // Exceed20%Changes in the number of columns are considered significant

    return { direction, ratio, significant }
  } catch (error) {
    console.error('Failed to calculate breakpoint transition:', error)
    return { direction: 'up', ratio: 1, significant: false }
  }
}

/**
 * Adaptively adjust project size
 */
export function adaptItemSizeForBreakpoint(
  item: GridLayoutPlusItem,
  breakpoint: string,
  cols: number,
  containerWidth: number
): GridLayoutPlusItem {
  try {
    const adapted = { ...item }

    // Adjust project properties based on breakpoints
    switch (breakpoint) {
      case 'xxs':
      case 'xs':
        // extremely small screen：Item fills the width，increase height
        adapted.x = 0
        adapted.w = cols
        adapted.h = Math.max(adapted.h, 3)
        break

      case 'sm':
        // small screen：Maximum occupies half the width
        adapted.w = Math.min(adapted.w, Math.floor(cols / 2))
        adapted.h = Math.max(adapted.h, 2)
        break

      case 'md':
        // medium screen：Limit maximum width
        adapted.w = Math.min(adapted.w, Math.floor(cols * 0.75))
        break

      default:
        // The big screen remains the same
        break
    }

    // Ensure that projects do not exceed boundaries
    adapted.w = Math.max(1, adapted.w)
    adapted.x = Math.min(adapted.x, cols - adapted.w)

    return adapted
  } catch (error) {
    console.error('Failed to adapt item size for breakpoint:', error)
    return item
  }
}

/**
 * Responsive media query tool
 */
export class ResponsiveMediaQuery {
  private breakpoints: Record<string, number>
  private callbacks: Map<string, Set<(matches: boolean) => void>> = new Map()
  private mediaQueries: Map<string, MediaQueryList> = new Map()

  constructor(breakpoints: Record<string, number>) {
    this.breakpoints = breakpoints
    this.initMediaQueries()
  }

  /**
   * Initialize media queries
   */
  private initMediaQueries(): void {
    if (typeof window === 'undefined') return

    for (const [breakpoint, minWidth] of Object.entries(this.breakpoints)) {
      const mediaQuery = window.matchMedia(`(min-width: ${minWidth}px)`)
      this.mediaQueries.set(breakpoint, mediaQuery)

      // Listen for changes
      mediaQuery.addListener(e => {
        const callbacks = this.callbacks.get(breakpoint)
        if (callbacks) {
          callbacks.forEach(callback => callback(e.matches))
        }
      })
    }
  }

  /**
   * Monitor breakpoint changes
   */
  onBreakpoint(breakpoint: string, callback: (matches: boolean) => void): () => void {
    if (!this.callbacks.has(breakpoint)) {
      this.callbacks.set(breakpoint, new Set())
    }

    const callbacks = this.callbacks.get(breakpoint)!
    callbacks.add(callback)

    // Call once immediately
    const mediaQuery = this.mediaQueries.get(breakpoint)
    if (mediaQuery) {
      callback(mediaQuery.matches)
    }

    // Returns the function to cancel listening
    return () => {
      callbacks.delete(callback)
    }
  }

  /**
   * Check if current breakpoint is matched
   */
  matches(breakpoint: string): boolean {
    const mediaQuery = this.mediaQueries.get(breakpoint)
    return mediaQuery ? mediaQuery.matches : false
  }

  /**
   * Get the currently matching breakpoint
   */
  getCurrentBreakpoint(): string {
    const sortedBreakpoints = Object.entries(this.breakpoints).sort(([, a], [, b]) => b - a)

    for (const [breakpoint] of sortedBreakpoints) {
      if (this.matches(breakpoint)) {
        return breakpoint
      }
    }

    return sortedBreakpoints[sortedBreakpoints.length - 1][0] || 'xs'
  }

  /**
   * Destroy listener
   */
  destroy(): void {
    this.callbacks.clear()
    this.mediaQueries.clear()
  }
}
