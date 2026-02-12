/**
 * Grid Unified export of tool functions
 * A collection of tool functions after modular reconstruction
 */

// ==================== Verification related tools ====================
export {
  validateGridItem,
  validateLayout,
  validateGridPosition,
  checkItemsOverlap,
  validateNoOverlaps,
  validateResponsiveConfig,
  // 🔥 New：Extended Grid Validation Tool
  validateExtendedGridConfig,
  validateLargeGridPerformance,
  optimizeItemForLargeGrid
} from './validation'

// ==================== Layout algorithm related tools ====================
export {
  findAvailablePosition,
  findOptimalPosition,
  isPositionAvailable,
  compactLayout,
  sortLayout,
  getLayoutBounds,
  getOverlapArea,
  moveItemWithCollisionHandling
} from './layout-algorithm'

// ==================== Performance related tools ====================
export {
  debounce,
  throttle,
  optimizeLayoutPerformance,
  PerformanceMonitor,
  performanceMonitor,
  getMemoryUsage,
  CacheManager,
  AsyncQueue
} from './performance'

// ==================== Responsive related tools ====================
export {
  createResponsiveLayout,
  transformLayoutForBreakpoint,
  mergeResponsiveLayouts,
  validateResponsiveLayout,
  getBreakpointInfo,
  calculateBreakpointTransition,
  adaptItemSizeForBreakpoint,
  ResponsiveMediaQuery
} from './responsive'

// ==================== general tools ====================
export {
  generateId,
  cloneLayout,
  cloneGridItem,
  getLayoutStats,
  filterLayout,
  searchLayout,
  itemToGridArea,
  calculateGridUtilization,
  calculateTotalRows,
  getGridStatistics,
  uniqueArray,
  parseNumber,
  clamp,
  formatFileSize,
  formatDuration
} from './common'

// ==================== Tool function version information ====================
export const GRID_UTILS_VERSION = '2.1.0' // 🔥 Upgraded version：support0-99grid
export const GRID_UTILS_INFO = {
  version: GRID_UTILS_VERSION,
  description: 'Modular grid tool library',
  modules: {
    validation: 'Grid verification related tools',
    'layout-algorithm': 'Layout algorithms and position calculations',
    performance: 'Performance monitoring and optimization tools',
    responsive: 'Responsive layout processing',
    common: 'Universal auxiliary tools'
  },
  migration: {
    from: 'gridLayoutPlusUtils.ts',
    to: 'utils/* module',
    breaking_changes: false,
    benefits: [
      'Better code organization and maintainability',
      'Modular by function，Easy to use independently',
      'Better error handling and type safety',
      'Enhanced performance monitoring capabilities',
      'New caching and asynchronous processing tools'
    ]
  },
  usage_examples: {
    validation: "import { validateGridItem, validateLayout } from './utils'",
    algorithm: "import { findAvailablePosition, compactLayout } from './utils'",
    performance: "import { debounce, PerformanceMonitor } from './utils'",
    responsive: "import { createResponsiveLayout, ResponsiveMediaQuery } from './utils'",
    common: "import { generateId, getLayoutStats } from './utils'"
  }
}

// ==================== Backward compatibility export ====================
// To maintain backward compatibility，Re-export the original function name
export { validateGridItem as validateItem } from './validation'
export { findAvailablePosition as findPosition } from './layout-algorithm'
export { getLayoutStats as getStats } from './common'
