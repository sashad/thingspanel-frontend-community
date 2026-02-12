/**
 * @file Card 2.1 System entrance（switch to Core2 Version）
 * use new Core2 system，Maintain backward compatibility
 */

import { core2Bridge, initializeCore2System } from '@/card2.1/core2-adapter'

// backwards compatible：保留旧system的导入（Do not delete the original core system）
import { componentRegistry } from '@/card2.1/core2/registry'
import { AutoRegistry } from '@/card2.1/core2/registry'
import { setupStorageListener } from '@/card2.1/core2/utils'

// ========== switch to Core2 System initialization ==========

// initialization state
let isInitialized = false
let initializationPromise: Promise<void> | null = null

/**
 * initialization Card 2.1 system（switch to Core2 Version）
 * use new Core2 system，Maintain backward compatibility
 */
export async function initializeCard2System() {
  if (isInitialized) return

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      await initializeCore2System()

      isInitialized = true
    } catch (err) {
      throw err
    } finally {
      initializationPromise = null
    }
  })()

  return initializationPromise
}

/**
 * Get component registry
 */
export function getComponentRegistry() {
  return core2Bridge.getComponentRegistry()
}

/**
 * Get component tree structure（use Core2 system）
 */
export function getComponentTree() {
  if (!isInitialized) {
    return { components: [], categories: [], totalCount: 0 }
  }
  return core2Bridge.getComponentTree()
}

/**
 * Get components by category（use Core2 system）
 */
export async function getComponentsByCategory(mainCategory?: string, subCategory?: string) {
  if (!isInitialized) {
    return []
  }
  return core2Bridge.getComponentsByCategory(mainCategory, subCategory)
}

/**
 * Get all categories（use Core2 system）
 */
export function getCategories() {
  if (!isInitialized) {
    return []
  }
  return core2Bridge.getCategories()
}

/**
 * Reapply permission filtering（Simplified version）
 * This function is called when user permissions change
 */
export async function reapplyPermissionFilter() {
  // Simplify implementation：Directly reinitialize
  isInitialized = false
  await initializeCard2System()
}

/**
 * Get all components（including unauthorized，for debugging）
 */
export function getAllComponents() {
  if (!isInitialized) {
    return []
  }
  return core2Bridge.getComponentRegistry().getAll()
}

// ========== Core module export ==========

// Traditional module export（backwards compatible）
export { componentRegistry }
export { AutoRegistry }
export type { ComponentTree, ComponentCategory } from '@/card2.1/core2/registry'

// Export permission related tools
export * from '@/card2.1/core2/utils'
export type { ComponentPermission } from '@/card2.1/types'

// Export Hooks
export * from '@/card2.1/hooks'

// ========== Simplified tool method export ==========

/**
 * Get system initialization status
 */
export function getInitializationState() {
  if (!isInitialized) {
    return {
      isInitialized,
      componentCount: 0,
      categories: []
    }
  }
  return core2Bridge.getInitializationState()
}

/**
 * clear cache（force reinitialization）
 */
export function clearInitializationCache() {
  isInitialized = false
  initializationPromise = null
  core2Bridge.clearCache()
}

/**
 * Check for component updates（Simplified version）
 */
export async function checkForComponentUpdates() {
  // Simplify implementation：always returnstrue，Let the caller decide whether to reinitialize
  return !isInitialized
}

// Export registry by default（Stay backwards compatible）
export default core2Bridge.getComponentRegistry()
