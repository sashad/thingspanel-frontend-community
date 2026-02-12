/**
 * Card2.1 component registry
 * Simplified component registration and management system
 */

import type { ComponentDefinition, IComponentRegistry } from '../types'
import { propertyExposureManager } from '../property'

/**
 * Component registry class
 */
export class ComponentRegistry implements IComponentRegistry {
  private components = new Map<string, ComponentDefinition>()

  /**
   * Register component
   */
  register(definition: ComponentDefinition): void {
    if (!definition.type) {
      console.warn('❌ [ComponentRegistry] Component registration failed：Lack type Field')
      return
    }

    if (this.components.has(definition.type)) {
      console.warn(`⚠️ [ComponentRegistry] components ${definition.type} Already exists，will be overwritten`)
    }

    this.components.set(definition.type, definition)

    // Automatically register component attribute whitelist
    if (definition.propertyWhitelist) {
      propertyExposureManager.registerPropertyWhitelist(definition.type, definition.propertyWhitelist)
    }
  }

  /**
   * Get component definition
   */
  get(type: string): ComponentDefinition | undefined {
    return this.components.get(type)
  }

  /**
   * Get all components
   */
  getAll(): ComponentDefinition[] {
    return Array.from(this.components.values())
  }

  /**
   * Check if the component exists
   */
  has(type: string): boolean {
    return this.components.has(type)
  }

  /**
   * Clear registry
   */
  clear(): void {
    this.components.clear()
  }

  /**
   * Get a list of data source keys for a component
   */
  getDataSourceKeys(type: string): string[] {
    const definition = this.get(type)
    if (!definition?.dataSources) {
      return []
    }
    return definition.dataSources.map(ds => ds.key)
  }

  /**
   * Get the static parameter key list of the component
   */
  getStaticParamKeys(type: string): string[] {
    const definition = this.get(type)
    if (!definition?.staticParams) {
      return []
    }
    return Object.keys(definition.staticParams)
  }

  /**
   * Get registration statistics
   */
  getStats() {
    const components = this.getAll()
    const multiDataSourceComponents = components.filter(
      comp => comp.dataSources && comp.dataSources.length > 1
    ).length

    return {
      totalComponents: components.length,
      componentTypes: components.map(c => c.type),
      multiDataSourceComponents,
      categories: Array.from(new Set(components.map(c => c.mainCategory).filter(Boolean)))
    }
  }

  /**
   * Get component tree structure
   */
  getComponentTree() {
    const components = this.getAll()

    // Build classification tree
    const categories: any[] = []
    const categoryMap = new Map<string, any>()

    components.forEach(component => {
      const mainCategory = component.mainCategory || 'categories.chart'
      const subCategory = component.subCategory

      if (!categoryMap.has(mainCategory)) {
        const mainCat = { id: mainCategory, name: mainCategory, children: [] }
        categoryMap.set(mainCategory, mainCat)
        categories.push(mainCat)
      }

      if (subCategory) {
        const mainCat = categoryMap.get(mainCategory)!
        if (!mainCat.children.find((child: any) => child.id === subCategory)) {
          mainCat.children.push({ id: subCategory, name: subCategory })
        }
      }
    })

    return {
      categories,
      components,
      totalCount: components.length
    }
  }
}

/**
 * Global component registry instance
 */
export const componentRegistry = new ComponentRegistry()

/**
 * Default export
 */
export default componentRegistry