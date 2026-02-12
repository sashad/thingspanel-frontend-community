/**
 * Generic raster component export
 *
 * @description
 * This file serves as a unified export for the Raster Component module。
 * at present，The project has been fully shifted to be based on `grid-layout-plus` of `GridLayoutPlus` components，
 * previous `DraggableResizableGrid` Implementation has been removed。
 *
 * `gridLayoutPlusIndex.ts` The file contains all `GridLayoutPlus` Related exports，
 * include components、type、Hooks and utility functions。
 */

// ==================== Grid Layout Plus (recommend) ====================
// based on grid-layout-plus modern solutions for
export * from './gridLayoutPlusIndex'

// ==================== Component information ====================

// Version information
export const GRID_VERSION = '3.0.0' // Version upgrade，Because the old component has been removed
export const GRID_BUILD_DATE = new Date().toISOString()

/**
 * Get component information
 */
export function getGridInfo() {
  return {
    version: GRID_VERSION,
    buildDate: GRID_BUILD_DATE,
    currentComponent: 'GridLayoutPlus',
    description: 'The project has fully adopted the grid-layout-plus A modern grid layout component。',
    features: [
      'based on Grid Layout Plus Library',
      'Responsive layout',
      'Drag and resize',
      'Theme support',
      'complete TypeScript support',
      'Performance optimization',
      'rich API and event system',
      'History（Cancel/Redo）',
      'Layout import/Export'
    ],
    migration_notes:
      'all old DraggableResizableGrid related components and API has been removed，Please ensure all citations are updated to GridLayoutPlus。'
  }
}
