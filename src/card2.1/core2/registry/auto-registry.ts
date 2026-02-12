/**
 * Card 2.1 Automatic registration system
 * Simplified automatic component registration and classification system
 */

import type { ComponentDefinition, ComponentTree } from '../types'
import { ComponentRegistry } from './component-registry'
import { getCategoryFromComponentId } from './category-definition'
import { checkComponentPermission } from '../utils/permission'

/**
 * Automatic registration system class
 */
export class AutoRegistry {
  private registry: ComponentRegistry
  private categoryTree: any[] = []

  constructor(registry: ComponentRegistry) {
    this.registry = registry
  }

  /**
   * Extract components from file pathID
   */
  private extractComponentIdFromPath(path: string): string | null {
    const match = path.match(/\/([^/]+)\/index\.ts$/)
    return match ? match[1] : null
  }

  /**
   * Verify that the component definition is valid
   */
  private isValidComponentDefinition(definition: any): definition is ComponentDefinition {
    const isComponentValid = definition.component &&
      (typeof definition.component === 'object' || typeof definition.component === 'function')

    return (
      definition &&
      typeof definition.type === 'string' &&
      typeof definition.name === 'string' &&
      isComponentValid
    )
  }

  /**
   * Check if the component should be registered
   */
  private shouldRegisterComponent(definition: ComponentDefinition): boolean {
    // 检查register设置，Default istrue（register）
    return definition.isRegistered !== false // Only explicitly set tofalseDon't register
  }

  /**
   * Automatically generate classification trees
   */
  private autoGenerateCategories(definition: ComponentDefinition) {
    const mainName = definition.mainCategory || 'categories.chart'
    const subName = definition.subCategory

    // Top level categories
    let mainCat = this.categoryTree.find(cat => cat.id === mainName)
    if (!mainCat) {
      mainCat = { id: mainName, name: mainName, children: [] }
      this.categoryTree.push(mainCat)
    }

    // subcategory
    if (subName) {
      let subCat = mainCat.children.find((cat: any) => cat.id === subName)
      if (!subCat) {
        subCat = { id: subName, name: subName }
        mainCat.children.push(subCat)
      }
    }
  }

  /**
   * Automatically scan and register components
   */
  async autoRegister(componentModules: Record<string, any>) {
    const registeredComponents: ComponentDefinition[] = []

    for (const [componentPath, module] of Object.entries(componentModules)) {
      try {
        // Get default export（Component definition）
        const definition = module.default || module

        if (this.isValidComponentDefinition(definition)) {
          // Extract components from pathID
          const componentId = this.extractComponentIdFromPath(componentPath)

          if (!componentId) {
            console.warn(`⚠️ [AutoRegistry] Unable to extract component from pathID: ${componentPath}`)
            continue
          }

          // According to componentsIDGet classified information
          const categoryInfo = getCategoryFromComponentId(componentId)


          // Enhance component definition
          const enhancedDefinition = {
            ...definition,
            mainCategory: categoryInfo.mainCategory,
            subCategory: categoryInfo.subCategory,
            category: `${categoryInfo.mainCategory}/${categoryInfo.subCategory}`,
          }

          // Generate classification information
          this.autoGenerateCategories(enhancedDefinition)

          // Check permissions
          const hasPermission = checkComponentPermission(enhancedDefinition)

          if (hasPermission && this.shouldRegisterComponent(enhancedDefinition)) {
            // Register component
            this.registry.register(enhancedDefinition)
            registeredComponents.push(enhancedDefinition)
          }
        }
      } catch (error) {
        console.error(`❌ [AutoRegistry] Component registration failed: ${componentPath}`, error)
        // Ignore errors during component registration，Continue working on other components
      }
    }

    return registeredComponents
  }

  /**
   * Get component tree structure
   */
  getComponentTree(): ComponentTree {
    const components = this.registry.getAll()

    return {
      categories: this.categoryTree,
      components,
      totalCount: components.length
    }
  }

  /**
   * Get all components
   */
  getAllComponents(): ComponentDefinition[] {
    return this.registry.getAll()
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(mainCategory?: string, subCategory?: string): ComponentDefinition[] {
    const components = this.registry.getAll()

    if (!mainCategory) {
      return components
    }

    let filtered = components.filter(comp => comp.mainCategory === mainCategory)

    if (subCategory) {
      filtered = filtered.filter(comp => comp.subCategory === subCategory)
    }

    return filtered
  }

  /**
   * Get all categories
   */
  getCategories(): any[] {
    return this.categoryTree
  }

  /**
   * Reapply permission filtering（Called when user permissions change）
   */
  reapplyPermissionFilter(): void {
    // Clear registry
    this.registry.clear()

    // Re-register components with permissions
    const allComponents = this.getAllComponents()
    for (const component of allComponents) {
      if (checkComponentPermission(component)) {
        this.registry.register(component)
      }
    }
  }
}

/**
 * Default export
 */
export default AutoRegistry