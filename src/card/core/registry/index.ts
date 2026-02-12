/**
 * Component registry implementation
 * Provides component registration、Find and manage features
 */

import type { IComponentRegistry, IComponentDefinition, RendererType } from '../types/component'
import type { IComponentMeta } from '../types/index'

/**
 * Component registry implementation class
 */
export class ComponentRegistry implements IComponentRegistry {
  /** Component definition storage */
  private definitions = new Map<string, IComponentDefinition>()
  /** type index */
  private typeIndex = new Map<string, Set<string>>()
  /** renderer index */
  private rendererIndex = new Map<RendererType, Set<string>>()

  /**
   * Register component
   * @param definition Component definition
   */
  register(definition: IComponentDefinition): void {
    const { meta } = definition

    // Verify component definition
    this.validateDefinition(definition)

    // Storage component definition
    this.definitions.set(meta.id, definition)

    // Update type index
    if (!this.typeIndex.has(meta.type)) {
      this.typeIndex.set(meta.type, new Set())
    }
    this.typeIndex.get(meta.type)!.add(meta.id)

    // Update renderer index
    meta.supportedRenderers.forEach(rendererType => {
      if (!this.rendererIndex.has(rendererType)) {
        this.rendererIndex.set(rendererType, new Set())
      }
      this.rendererIndex.get(rendererType)!.add(meta.id)
    })

    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Unregister component
   * @param componentId componentsID
   */
  unregister(componentId: string): void {
    const definition = this.definitions.get(componentId)
    if (!definition) {
      console.error(`[ComponentRegistry] components ${componentId} does not exist，Unable to log out`)
      return
    }

    const { meta } = definition

    // Remove from main storage
    this.definitions.delete(componentId)

    // Remove from type index
    const typeSet = this.typeIndex.get(meta.type)
    if (typeSet) {
      typeSet.delete(componentId)
      if (typeSet.size === 0) {
        this.typeIndex.delete(meta.type)
      }
    }

    // Remove from renderer index
    meta.supportedRenderers.forEach(rendererType => {
      const rendererSet = this.rendererIndex.get(rendererType)
      if (rendererSet) {
        rendererSet.delete(componentId)
        if (rendererSet.size === 0) {
          this.rendererIndex.delete(rendererType)
        }
      }
    })

    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Get component definition
   * @param componentId componentsID
   * @returns component definition ornull
   */
  getDefinition(componentId: string): IComponentDefinition | null {
    return this.definitions.get(componentId) || null
  }

  /**
   * Get all component definitions
   * @returns Array of all component definitions
   */
  getAllDefinitions(): IComponentDefinition[] {
    return Array.from(this.definitions.values())
  }

  /**
   * Get components by type
   * @param type Component type
   * @returns All component definitions of this type
   */
  getByType(type: string): IComponentDefinition[] {
    const componentIds = this.typeIndex.get(type)
    if (!componentIds) {
      return []
    }

    return Array.from(componentIds)
      .map(id => this.definitions.get(id)!)
      .filter(Boolean)
  }

  /**
   * Get components by renderer
   * @param rendererType Renderer type
   * @returns All component definitions supported by this renderer
   */
  getByRenderer(rendererType: RendererType): IComponentDefinition[] {
    const componentIds = this.rendererIndex.get(rendererType)
    if (!componentIds) {
      return []
    }

    return Array.from(componentIds)
      .map(id => this.definitions.get(id)!)
      .filter(Boolean)
  }

  /**
   * Check if the component exists
   * @param componentId componentsID
   * @returns exists
   */
  has(componentId: string): boolean {
    return this.definitions.has(componentId)
  }

  /**
   * Clear registry
   */
  clear(): void {
    this.definitions.clear()
    this.typeIndex.clear()
    this.rendererIndex.clear()
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Get registry statistics
   * @returns Statistics
   */
  getStats() {
    return {
      totalComponents: this.definitions.size,
      typeCount: this.typeIndex.size,
      rendererCount: this.rendererIndex.size,
      types: Array.from(this.typeIndex.keys()),
      renderers: Array.from(this.rendererIndex.keys())
    }
  }

  /**
   * Search component
   * @param query Search criteria
   * @returns matching component definition
   */
  search(query: { name?: string; type?: string; renderer?: RendererType; keyword?: string }): IComponentDefinition[] {
    let results = this.getAllDefinitions()

    // Filter by name
    if (query.name) {
      results = results.filter(def => def.meta.name.toLowerCase().includes(query.name!.toLowerCase()))
    }

    // Filter by type
    if (query.type) {
      results = results.filter(def => def.meta.type === query.type)
    }

    // Filter by renderer
    if (query.renderer) {
      results = results.filter(def => def.meta.supportedRenderers.includes(query.renderer!))
    }

    // Filter by keyword
    if (query.keyword) {
      const keyword = query.keyword.toLowerCase()
      results = results.filter(
        def =>
          def.meta.name.toLowerCase().includes(keyword) ||
          def.meta.description?.toLowerCase().includes(keyword) ||
          def.meta.type.toLowerCase().includes(keyword)
      )
    }

    return results
  }

  /**
   * Verify component definition
   * @param definition Component definition
   */
  private validateDefinition(definition: IComponentDefinition): void {
    const { meta, logic, views } = definition

    // Verify metadata
    if (!meta.id || !meta.name || !meta.type) {
      throw new Error('Component metadata is incomplete：Lackid、nameortype')
    }

    // verifyIDuniqueness
    if (this.definitions.has(meta.id)) {
      throw new Error(`componentsID ${meta.id} Already exists`)
    }

    // Validation logicHook
    if (typeof logic !== 'function') {
      throw new Error('Component logicHookMust be a function')
    }

    // Verify view mapping
    if (!views || Object.keys(views).length === 0) {
      throw new Error('The component must provide at least one view implementation')
    }

    // Verify that supported renderers are consistent with the view mapping
    meta.supportedRenderers.forEach(renderer => {
      if (!views[renderer]) {
        throw new Error(`Component declaration supports renderer ${renderer}，But no corresponding view implementation is provided`)
      }
    })
  }
}

// Create a global registry instance
export const componentRegistry = new ComponentRegistry()

// Export registry type
export type { IComponentRegistry }
