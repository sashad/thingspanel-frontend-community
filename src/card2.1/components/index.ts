/**
 * Card 2.1 Unified export of components
 * Use an automatic registration system，No need to manually maintain component lists
 * Supports dynamic discovery and registration of all specification-compliant components
 */

import type { ComponentDefinition } from '@/card2.1/types'
import { AutoRegistry } from '@/card2.1/core2/registry'
import { ComponentRegistry, componentRegistry } from '@/card2.1/core2/registry'

// Create an automatic registration system instance
const autoRegistry = new AutoRegistry(componentRegistry)

// ============ Automation component registry ============

// Component initialization state
let isInitialized = false

/**
 * Make sure the auto-registration system has been initialized
 */
async function ensureInitialized(): Promise<void> {
  if (isInitialized) {
    return
  }

  try {
    // use **/* model，Dynamically scan all components index.ts document
    const allModules = import.meta.glob('./**/index.ts', { eager: true });

    // Handle loaded modules
    const loadedModules: Record<string, any> = {}
    for (const [path, module] of Object.entries(allModules)) {
      if (path && module) {
        loadedModules[path] = module
      }
    }

    // use autoRegistry.autoRegister Register all components
    await autoRegistry.autoRegister(loadedModules)

    isInitialized = true

  } catch (error) {
    console.error('❌ [ensureInitialized] Component initialization failed:', error)
    throw error
  }
}

/**
 * Get all component definitions（by category）
 */
export async function getCard2Components(): Promise<Record<string, ComponentDefinition[]>> {
  await ensureInitialized()
  const categories = autoRegistry.getCategories()
  const result: Record<string, ComponentDefinition[]> = {}

  for (const category of categories) {
    result[category.name] = autoRegistry.getComponentsByCategory(category.name)
  }

  return result
}

/**
 * Get component mapping table
 */
export async function getCard2ComponentMap(): Promise<Record<string, ComponentDefinition>> {
  await ensureInitialized()
  const components = autoRegistry.getAllComponents()
  const result: Record<string, ComponentDefinition> = {}

  for (const component of components) {
    result[component.type] = component
  }

  return result
}

/**
 * Get all component types
 */
export async function getCard2ComponentTypes(): Promise<string[]> {
  await ensureInitialized()
  return autoRegistry.getAllComponents().map(comp => comp.type)
}

// ============ Editor integrated tool functions ============

/**
 * Get component tree structure
 */
export async function getComponentTree() {
  await ensureInitialized()
  return autoRegistry.getComponentTree()
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<string[]> {
  await ensureInitialized()
  return autoRegistry.getCategories().map(cat => cat.name)
}

/**
 * Get component definition based on type
 */
export async function getComponentDefinition(type: string): Promise<ComponentDefinition | undefined> {
  await ensureInitialized()
  return autoRegistry.getAllComponents().find(comp => comp.type === type)
}

/**
 * Get all components under the specified category
 */
export async function getComponentsByCategory(category: string): Promise<ComponentDefinition[]> {
  await ensureInitialized()
  return autoRegistry.getComponentsByCategory(category)
}

/**
 * Get all component definitions
 */
export async function getAllComponents(): Promise<ComponentDefinition[]> {
  await ensureInitialized()
  return autoRegistry.getAllComponents()
}

/**
 * Reload component registry
 */
export async function reloadComponents(): Promise<void> {
  await ensureInitialized()
}

// ============ Component metadata statistics ============

/**
 * Get component statistics
 */
export async function getComponentStats() {
  await ensureInitialized()
  const components = autoRegistry.getAllComponents()
  const categories = autoRegistry.getCategories()

  return {
    total: components.length,
    categories: categories.map(cat => cat.name),
    byCategory: Object.fromEntries(
      categories.map(category => [category.name, autoRegistry.getComponentsByCategory(category.name).length])
    ),
    supportedDataSources: Array.from(new Set(components.flatMap(c => c.supportedDataSources || []))),
    versions: Array.from(
      new Set(
        components
          .map(c => c.version)
          .filter(Boolean)
      )
    )
  }
}

// ============ Development tool functions ============

/**
 * Debugging functions in development mode
 */
export function debugComponents(): void {
  if (!import.meta.env.DEV) return

  console.group('[Card2.1 Component debugging information]')
  const components = autoRegistry.getAllComponents()
  console.table(
    components.map(c => ({
      type: c.type,
      name: c.name,
      Classification: c.category || 'other',
      Version: c.version || 'not specified',
      dataSource: c.supportedDataSources?.join(', ') || 'none',
      Label: c.tags?.join(', ') || 'none'
    }))
  )
  console.groupEnd()
}

// The main interface is exported by default
export default {
  // Function function
  getCard2Components,
  getCard2ComponentMap,
  getCard2ComponentTypes,
  getComponentTree,
  getCategories,
  getComponentDefinition,
  getComponentsByCategory,
  getAllComponents,
  getComponentStats,
  reloadComponents,

  // development tools
  debugComponents
}
