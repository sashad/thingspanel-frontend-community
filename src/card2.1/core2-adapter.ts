/**
 * Core2 system adapter
 * Provided from old core system to new core2 Smooth switching of the system
 * Maintain backward compatibility，Do not delete the original core system
 */

import { ComponentRegistry, AutoRegistry, componentRegistry } from './core2'
import { LegacyAdapter } from './core2/compatibility'

// ========== Core2 System initialization ==========

// Create a new automatic registration system
const core2AutoRegistry = new AutoRegistry(componentRegistry)

// initialization state
let core2Initialized = false
let core2InitializationPromise: Promise<void> | null = null

/**
 * initialization Core2 system
 */
export async function initializeCore2System() {
  if (core2Initialized) return

  if (core2InitializationPromise) {
    return core2InitializationPromise
  }

  core2InitializationPromise = (async () => {
    try {

      // Scan components
      const allComponentModules = import.meta.glob('@/card2.1/components/**/index.ts', { eager: true })

      // exclude components/index.ts Avoid conflict itself
      const componentModules = Object.fromEntries(
        Object.entries(allComponentModules).filter(([path]) => path !== '@/card2.1/components/index.ts')
      )

      // call Core2 Automatic registration system
      await core2AutoRegistry.autoRegister(componentModules)

      // Initialize backwards compatibility
      LegacyAdapter.initialize()

      core2Initialized = true
    } catch (err) {
      throw err
    } finally {
      core2InitializationPromise = null
    }
  })()

  return core2InitializationPromise
}

/**
 * Get Core2 component registry
 */
export function getCore2ComponentRegistry() {
  return componentRegistry
}

/**
 * Get Core2 Component tree structure
 */
export function getCore2ComponentTree() {
  if (!core2Initialized) {
    return { components: [], categories: [], totalCount: 0 }
  }
  const tree = core2AutoRegistry.getComponentTree()

  console.log('🔥 [Core2] Component tree results:')
  console.log('Total number of components:', tree.totalCount)
  console.log('Number of categories:', tree.categories.length)
  console.log('Number of components:', tree.components.length)

  return tree
}

/**
 * Get by category Core2 components
 */
export async function getCore2ComponentsByCategory(mainCategory?: string, subCategory?: string) {
  if (!core2Initialized) {
    return []
  }
  return core2AutoRegistry.getComponentsByCategory(mainCategory, subCategory)
}

/**
 * Get Core2 All categories
 */
export function getCore2Categories() {
  if (!core2Initialized) {
    return []
  }
  return core2AutoRegistry.getCategories()
}

/**
 * Get Core2 System initialization state
 */
export function getCore2InitializationState() {
  return {
    isInitialized: core2Initialized,
    componentCount: core2Initialized ? core2AutoRegistry.getAllComponents().length : 0,
    categories: core2Initialized ? core2AutoRegistry.getCategories() : [],
    migrationStatus: LegacyAdapter.getMigrationStatus()
  }
}

/**
 * examine Core2 Is the system available?
 */
export function isCore2Available() {
  return core2Initialized
}

/**
 * Get Core2 System statistics
 */
export function getCore2Stats() {
  if (!core2Initialized) {
    return { totalComponents: 0, componentTypes: [], multiDataSourceComponents: 0 }
  }
  return componentRegistry.getStats()
}

// ========== backward compatibility bridging ==========

/**
 * backward compatibility bridging - Provides the same interface as the old system
 */
export const core2Bridge = {
  // Component registration related
  getComponentRegistry: getCore2ComponentRegistry,
  getComponentTree: getCore2ComponentTree,
  getComponentsByCategory: getCore2ComponentsByCategory,
  getCategories: getCore2Categories,

  // System status related
  getInitializationState: getCore2InitializationState,
  isInitialized: () => core2Initialized,

  // Tool method
  initialize: initializeCore2System,
  clearCache: () => {
    core2Initialized = false
    core2InitializationPromise = null
  },

  // Migration status
  getMigrationStatus: LegacyAdapter.getMigrationStatus,
  getCompatibilityWarnings: LegacyAdapter.getCompatibilityWarnings,
  performMigrationCheck: LegacyAdapter.performMigrationCheck
}

/**
 * global export Core2 system（Only in development environment）
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const win = window as any
  win.__CORE2_SYSTEM__ = {
    ...core2Bridge,
    ComponentRegistry: componentRegistry,
    AutoRegistry: core2AutoRegistry,
    LegacyAdapter
  }
}

// Bridge objects are exported by default
export default core2Bridge