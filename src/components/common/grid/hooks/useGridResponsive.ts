/**
 * Grid Responsive layout management Hook
 * Handle breakpoint changes and responsive layout transitions
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { GridLayoutPlusItem, ResponsiveLayout, GridLayoutPlusConfig } from '../gridLayoutPlusTypes'
import { createResponsiveLayout, transformLayoutForBreakpoint } from '../gridLayoutPlusUtils'

export interface UseGridResponsiveOptions {
  /** Whether to enable responsiveness */
  responsive?: boolean
  /** Breakpoint configuration */
  breakpoints?: Record<string, number>
  /** Column number configuration */
  cols?: Record<string, number>
  /** Initial responsive layout */
  initialResponsiveLayouts?: ResponsiveLayout
  /** Breakpoint change callback */
  onBreakpointChange?: (breakpoint: string, layout: GridLayoutPlusItem[]) => void
}

/**
 * Responsive grid layout managementHook
 * Provides breakpoint monitoring and responsive layout conversion functions
 */
export function useGridResponsive(options: UseGridResponsiveOptions = {}) {
  const {
    responsive = false,
    breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    initialResponsiveLayouts = {},
    onBreakpointChange
  } = options

  // Responsive state
  const currentBreakpoint = ref<string>('lg')
  const containerWidth = ref(0)
  const responsiveLayouts = ref<ResponsiveLayout>(initialResponsiveLayouts)
  const isResponsive = ref(responsive)

  // Breakpoint monitoring
  let resizeObserver: ResizeObserver | null = null
  let containerElement: HTMLElement | null = null

  // Computed properties
  const currentCols = computed(() => {
    return cols[currentBreakpoint.value] || cols.lg || 12
  })

  const sortedBreakpoints = computed(() => {
    return Object.entries(breakpoints).sort(([, a], [, b]) => b - a) // Sort from large to small
  })

  const breakpointInfo = computed(() => {
    const bp = currentBreakpoint.value
    return {
      name: bp,
      width: breakpoints[bp] || 0,
      cols: cols[bp] || 12,
      isXs: bp === 'xxs' || bp === 'xs',
      isSm: bp === 'sm',
      isMd: bp === 'md',
      isLg: bp === 'lg',
      isXl: bp === 'xl'
    }
  })

  // Breakpoint calculation
  const calculateBreakpoint = (width: number): string => {
    for (const [bp, minWidth] of sortedBreakpoints.value) {
      if (width >= minWidth) {
        return bp
      }
    }
    return sortedBreakpoints.value[sortedBreakpoints.value.length - 1][0] || 'xs'
  }

  // Layout transformation
  const transformLayoutForCurrentBreakpoint = (
    sourceLayout: GridLayoutPlusItem[],
    fromBreakpoint: string = 'lg'
  ): GridLayoutPlusItem[] => {
    if (!isResponsive.value) return sourceLayout

    try {
      const targetCols = currentCols.value
      const sourceCols = cols[fromBreakpoint] || 12

      return transformLayoutForBreakpoint(sourceLayout, sourceCols, targetCols, currentBreakpoint.value)
    } catch (error) {
      console.error('[GridResponsive] Failed to transform layout:', error)
      return sourceLayout
    }
  }

  // Responsive layout management
  const setResponsiveLayout = (breakpoint: string, layout: GridLayoutPlusItem[]) => {
    if (!isResponsive.value) return

    try {
      responsiveLayouts.value[breakpoint] = [...layout]
      console.debug(`[GridResponsive] Set layout for breakpoint: ${breakpoint}`)
    } catch (error) {
      console.error('[GridResponsive] Failed to set responsive layout:', error)
    }
  }

  const getResponsiveLayout = (breakpoint: string): GridLayoutPlusItem[] | null => {
    return responsiveLayouts.value[breakpoint] || null
  }

  const getCurrentResponsiveLayout = (): GridLayoutPlusItem[] | null => {
    return getResponsiveLayout(currentBreakpoint.value)
  }

  const hasResponsiveLayout = (breakpoint: string): boolean => {
    return !!responsiveLayouts.value[breakpoint]
  }

  // Create a complete responsive layout configuration
  const createFullResponsiveLayout = (baseLayout: GridLayoutPlusItem[]): ResponsiveLayout => {
    if (!isResponsive.value) return {}

    try {
      return createResponsiveLayout(baseLayout, breakpoints, cols)
    } catch (error) {
      console.error('[GridResponsive] Failed to create responsive layout:', error)
      return {}
    }
  }

  // Breakpoint switching processing
  const handleBreakpointChange = (newBreakpoint: string, currentLayout: GridLayoutPlusItem[]) => {
    const previousBreakpoint = currentBreakpoint.value

    console.debug(`[GridResponsive] Breakpoint changed: ${previousBreakpoint} -> ${newBreakpoint}`)

    // Save the current layout to the previous breakpoint
    if (currentLayout.length > 0) {
      setResponsiveLayout(previousBreakpoint, currentLayout)
    }

    // Update current breakpoint
    currentBreakpoint.value = newBreakpoint

    // Get the layout of the new breakpoint
    let newLayout = getResponsiveLayout(newBreakpoint)

    if (!newLayout) {
      // If there is no layout corresponding to the breakpoint，Convert from current layout
      newLayout = transformLayoutForCurrentBreakpoint(currentLayout, previousBreakpoint)
      setResponsiveLayout(newBreakpoint, newLayout)
    }

    // trigger callback
    if (onBreakpointChange) {
      onBreakpointChange(newBreakpoint, newLayout)
    }

    return newLayout
  }

  // Monitor container size changes
  const observeContainer = (element: HTMLElement) => {
    containerElement = element

    if (!isResponsive.value) return

    // initial size
    const rect = element.getBoundingClientRect()
    containerWidth.value = rect.width

    // createResizeObserver
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const newWidth = entry.contentRect.width
          if (Math.abs(newWidth - containerWidth.value) > 10) {
            // Avoid frequent triggering
            containerWidth.value = newWidth
          }
        }
      })

      resizeObserver.observe(element)
    } else {
      // Fallback towindow resizeevent
      const handleResize = () => {
        const rect = element.getBoundingClientRect()
        containerWidth.value = rect.width
      }

      window.addEventListener('resize', handleResize)

      // Cleanup function
      return () => window.removeEventListener('resize', handleResize)
    }
  }

  const unobserveContainer = () => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    containerElement = null
  }

  // Monitor container width changes，Calculate breakpoints
  watch(containerWidth, newWidth => {
    if (!isResponsive.value || newWidth <= 0) return

    const newBreakpoint = calculateBreakpoint(newWidth)
    if (newBreakpoint !== currentBreakpoint.value) {
      // Breakpoint changes require external layout data，Only breakpoint status is updated here
      // The actual layout transformation is called externally handleBreakpointChange deal with
      console.debug(`[GridResponsive] Container width changed: ${newWidth}px, new breakpoint: ${newBreakpoint}`)
    }
  })

  // Tool method
  const getBreakpointConfig = () => ({
    breakpoints,
    cols,
    current: currentBreakpoint.value,
    containerWidth: containerWidth.value
  })

  const isBreakpoint = (bp: string) => currentBreakpoint.value === bp

  const isBreakpointOrSmaller = (bp: string) => {
    const currentIndex = sortedBreakpoints.value.findIndex(([name]) => name === currentBreakpoint.value)
    const targetIndex = sortedBreakpoints.value.findIndex(([name]) => name === bp)
    return currentIndex >= targetIndex
  }

  const isBreakpointOrLarger = (bp: string) => {
    const currentIndex = sortedBreakpoints.value.findIndex(([name]) => name === currentBreakpoint.value)
    const targetIndex = sortedBreakpoints.value.findIndex(([name]) => name === bp)
    return currentIndex <= targetIndex
  }

  // lifecycle cleanup
  onUnmounted(() => {
    unobserveContainer()
  })

  return {
    // state
    currentBreakpoint,
    containerWidth,
    responsiveLayouts,
    isResponsive,

    // Computed properties
    currentCols,
    breakpointInfo,
    sortedBreakpoints,

    // method
    observeContainer,
    unobserveContainer,
    handleBreakpointChange,
    transformLayoutForCurrentBreakpoint,

    // layout management
    setResponsiveLayout,
    getResponsiveLayout,
    getCurrentResponsiveLayout,
    hasResponsiveLayout,
    createFullResponsiveLayout,

    // Tool method
    getBreakpointConfig,
    isBreakpoint,
    isBreakpointOrSmaller,
    isBreakpointOrLarger,
    calculateBreakpoint
  }
}
