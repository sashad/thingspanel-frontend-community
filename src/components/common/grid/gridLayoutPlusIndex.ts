/**
 * Grid Layout Plus Component export
 * based on grid-layout-plus Enterprise-level grid layout solutions
 */

// Export main components
export { default as GridLayoutPlus } from './GridLayoutPlus.vue'

// Export type definition
export type * from './gridLayoutPlusTypes'

// Export utility functions
export * from './gridLayoutPlusUtils'

// ExportHook
export { useGridLayoutPlus } from './hooks/useGridLayoutPlus'

// Export default configuration and themes
export { DEFAULT_GRID_LAYOUT_PLUS_CONFIG, LIGHT_THEME, DARK_THEME } from './gridLayoutPlusTypes'

// Export common type aliases
export type {
  GridLayoutPlusItem as GridItem,
  GridLayoutPlusConfig as GridConfig,
  GridLayoutPlusProps as GridProps,
  GridLayoutPlusEmits as GridEmits
} from './gridLayoutPlusTypes'

// Version information
export const GRID_LAYOUT_PLUS_VERSION = '1.0.0'

/**
 * Get component information
 */
export function getGridLayoutPlusInfo() {
  return {
    name: 'Grid Layout Plus',
    version: GRID_LAYOUT_PLUS_VERSION,
    description: 'based on grid-layout-plus Enterprise Grid Layout Component',
    features: [
      'based on Grid Layout Plus Library',
      'complete TypeScript support',
      'Responsive layout',
      'Drag and resize',
      'Theme support',
      'Performance optimization',
      'rich API',
      'event handling',
      'History',
      'Import and export'
    ],
    dependencies: {
      'grid-layout-plus': '^1.0.0',
      vue: '^3.0.0'
    }
  }
}
