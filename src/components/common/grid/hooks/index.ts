/**
 * Grid Hooks Export - V2 Modular version
 * Contains originalHookand new modularHooksystem
 */

// ==================== originalHookExport ====================
export { useGridLayout } from './useGridLayout'
export { useGridLayoutPlus } from './useGridLayoutPlus' // Stay backwards compatible

// ==================== New modularityHookExport ====================
export { useGridCore } from './useGridCore'
export { useGridHistory } from './useGridHistory'
export { useGridPerformance } from './useGridPerformance'
export { useGridResponsive } from './useGridResponsive'
export { useGridLayoutPlusV2 } from './useGridLayoutPlusV2'

// ==================== Type export ====================
export type { UseGridLayoutReturn } from '../types'
export type { UseGridCoreOptions } from './useGridCore'
export type { UseGridHistoryOptions } from './useGridHistory'
export type { UseGridPerformanceOptions, PerformanceMetrics } from './useGridPerformance'
export type { UseGridResponsiveOptions } from './useGridResponsive'
export type { UseGridLayoutPlusV2Options } from './useGridLayoutPlusV2'

// ==================== HookVersion information ====================
export const GRID_HOOKS_VERSION = '2.0.0'
export const GRID_HOOKS_INFO = {
  version: GRID_HOOKS_VERSION,
  description: 'modular gridHooksystem',
  hooks: {
    legacy: ['useGridLayout', 'useGridLayoutPlus'],
    v2: ['useGridCore', 'useGridHistory', 'useGridPerformance', 'useGridResponsive'],
    integrated: ['useGridLayoutPlusV2']
  },
  migration: {
    from: 'useGridLayoutPlus',
    to: 'useGridLayoutPlusV2',
    breaking_changes: false,
    benefits: [
      'Modular architecture improves maintainability',
      'Independent performance monitoring system',
      'Complete history management',
      'Responsive layout support',
      'Better error handling and type safety'
    ]
  }
}
