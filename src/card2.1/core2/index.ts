/**
 * Card2.1 Core2 Core function export
 * Simplify the architecture，focus on5core functions
 */

// ============ Type export ============
export * from './types'

// ============ Registration system export ============
export * from './registry'

// ============ Data source system export ============
export * from './data-source'

// ============ Attribute system export ============
export * from './property'

// ============ Form system export ============
export * from './form'

// ============ Interactive system export ============
export * from './interaction'

// ============ Tool function export ============
export * from './utils'

// ============ Backwards compatible system export ============
export * from './compatibility'

// ============ System status and verification ============

import { componentRegistry } from './registry'

/**
 * Get system status
 */
export function getCard2CoreStatus(): {
  isInitialized: boolean
  componentCount: number
  registeredComponents: string[]
} {
  const stats = componentRegistry.getStats()

  return {
    isInitialized: stats.totalComponents > 0,
    componentCount: stats.totalComponents,
    registeredComponents: stats.componentTypes
  }
}

/**
 * Verify system integrity
 */
export function validateCard2Core(): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check component registration status
  const stats = componentRegistry.getStats()
  if (stats.totalComponents === 0) {
    errors.push('No components are registered')
  }

  // Check necessary components
  const requiredComponents = ['dual-data-display', 'triple-data-display']
  requiredComponents.forEach(componentType => {
    if (!componentRegistry.has(componentType)) {
      errors.push(`Missing required components: ${componentType}`)
    }
  })

  // Check out the multiple data source components
  if (stats.multiDataSourceComponents === 0) {
    warnings.push('No multiple data source component')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// ============ Debug interface（Only enabled in development environment） ============

import { LegacyAdapter } from './compatibility'

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.__CARD2_DEBUG__ = {
    ComponentRegistry: componentRegistry,
    getCard2CoreStatus,
    validateCard2Core,
    triggerDataUpdate: () => {
      // Here you can add actual data update logic
    }
  }

  // Export main functions globally
  window.card2System = {
    getComponentTree: () => componentRegistry.getComponentTree(),
    getComponentRegistry: () => componentRegistry,
    isInitialized: () => componentRegistry.getStats().totalComponents > 0
  }

  // Initialize backwards compatibility
  LegacyAdapter.initialize()
}