/**
 * Renderer Manager
 * Achieve unified management and scheduling of multiple renderers
 */

import type {
  IRenderer,
  IRendererManager,
  IRendererConfig,
  IRenderContext,
  IResourcePool,
  RendererType
} from '../types/renderer'
import type { IComponentInstance } from '../types/component'

/**
 * Renderer manager implementation class
 */
export class RendererManager implements IRendererManager {
  /** Registered renderer */
  private renderers = new Map<RendererType, IRenderer>()
  /** Renderer configuration */
  private configs = new Map<RendererType, IRendererConfig>()
  /** active rendering context */
  private contexts = new Map<string, IRenderContext>()
  /** resource pool */
  private resourcePool: IResourcePool
  /** Default renderer type */
  private defaultRendererType: RendererType = 'vue'

  constructor() {
    this.resourcePool = new ResourcePool()
    this.initializeDefaultRenderers()
  }

  /**
   * Register renderer
   * @param type Renderer type
   * @param renderer Renderer instance
   * @param config Renderer configuration
   */
  register(type: RendererType, renderer: IRenderer, config?: IRendererConfig): void {
    this.renderers.set(type, renderer)

    if (config) {
      this.configs.set(type, config)
    }

    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Unregister the renderer
   * @param type Renderer type
   */
  unregister(type: RendererType): void {
    const renderer = this.renderers.get(type)
    if (renderer) {
      // Destroy the associated rendering context
      this.destroyContextsByRenderer(type)

      // Call the renderer's destruction method
      if (renderer.destroy) {
        renderer.destroy()
      }

      this.renderers.delete(type)
      this.configs.delete(type)

      if (process.env.NODE_ENV === 'development') {
      }
    }
  }

  /**
   * Get renderer
   * @param type Renderer type
   * @returns Renderer instance
   */
  getRenderer(type?: RendererType): IRenderer {
    const rendererType = type || this.defaultRendererType
    const renderer = this.renderers.get(rendererType)

    if (!renderer) {
      throw new Error(`Renderer ${rendererType} Not registered`)
    }

    return renderer
  }

  /**
   * Create rendering context
   * @param contextId contextID
   * @param rendererType Renderer type
   * @param container container element
   * @returns rendering context
   */
  createContext(contextId: string, rendererType: RendererType, container: HTMLElement): IRenderContext {
    const renderer = this.getRenderer(rendererType)
    const config = this.configs.get(rendererType)

    const context: IRenderContext = {
      id: contextId,
      rendererType,
      container,
      renderer,
      config,
      instances: new Map(),
      state: 'idle',
      createdAt: Date.now(),
      lastUsedAt: Date.now()
    }

    this.contexts.set(contextId, context)

    if (process.env.NODE_ENV === 'development') {
    }
    return context
  }

  /**
   * Get rendering context
   * @param contextId contextID
   * @returns rendering context
   */
  getContext(contextId: string): IRenderContext | undefined {
    const context = this.contexts.get(contextId)
    if (context) {
      context.lastUsedAt = Date.now()
    }
    return context
  }

  /**
   * Destroy rendering context
   * @param contextId contextID
   */
  destroyContext(contextId: string): void {
    const context = this.contexts.get(contextId)
    if (!context) return

    // Destroy all component instances in the context
    context.instances.forEach((instance, instanceId) => {
      this.destroyInstance(contextId, instanceId)
    })

    // clean container
    if (context.container) {
      context.container.innerHTML = ''
    }

    this.contexts.delete(contextId)
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Render component instance
   * @param contextId contextID
   * @param instance Component instance
   * @returns Rendering resultPromise
   */
  async renderInstance(contextId: string, instance: IComponentInstance): Promise<void> {
    const context = this.getContext(contextId)
    if (!context) {
      throw new Error(`rendering context ${contextId} does not exist`)
    }

    try {
      context.state = 'rendering'

      // Call the renderer's render method
      await context.renderer.render(instance, context)

      // Add instance to context
      context.instances.set(instance.id, instance)

      context.state = 'idle'
      context.lastUsedAt = Date.now()

      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      context.state = 'error'
      console.error(`[RendererManager] Rendering failed:`, error)
      throw error
    }
  }

  /**
   * Update component instance
   * @param contextId contextID
   * @param instanceId ExampleID
   * @param data Update data
   */
  async updateInstance(contextId: string, instanceId: string, data: any): Promise<void> {
    const context = this.getContext(contextId)
    if (!context) {
      throw new Error(`rendering context ${contextId} does not exist`)
    }

    const instance = context.instances.get(instanceId)
    if (!instance) {
      throw new Error(`Component instance ${instanceId} does not exist`)
    }

    try {
      // Call the renderer's update method
      await context.renderer.update(instance, data, context)

      context.lastUsedAt = Date.now()

      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error(`[RendererManager] Update failed:`, error)
      throw error
    }
  }

  /**
   * Destroy component instance
   * @param contextId contextID
   * @param instanceId ExampleID
   */
  async destroyInstance(contextId: string, instanceId: string): Promise<void> {
    const context = this.getContext(contextId)
    if (!context) return

    const instance = context.instances.get(instanceId)
    if (!instance) return

    try {
      // Call the renderer's destruction method
      await context.renderer.destroy(instance, context)

      // Remove instance from context
      context.instances.delete(instanceId)

      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error(`[RendererManager] Failed to destroy instance:`, error)
    }
  }

  /**
   * Get a list of supported renderer types
   * @returns Array of renderer types
   */
  getSupportedRenderers(): RendererType[] {
    return Array.from(this.renderers.keys())
  }

  /**
   * Set default renderer
   * @param type Renderer type
   */
  setDefaultRenderer(type: RendererType): void {
    if (!this.renderers.has(type)) {
      throw new Error(`Renderer ${type} Not registered`)
    }
    this.defaultRendererType = type
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Get renderer statistics
   * @returns Statistics
   */
  getStats() {
    const contextStats = Array.from(this.contexts.values()).reduce(
      (stats, context) => {
        stats.totalInstances += context.instances.size
        stats.contextsByRenderer[context.rendererType] = (stats.contextsByRenderer[context.rendererType] || 0) + 1
        return stats
      },
      {
        totalInstances: 0,
        contextsByRenderer: {} as Record<RendererType, number>
      }
    )

    return {
      registeredRenderers: this.renderers.size,
      activeContexts: this.contexts.size,
      defaultRenderer: this.defaultRendererType,
      ...contextStats,
      resourcePool: this.resourcePool.getStats()
    }
  }

  /**
   * Clean up unused context
   * @param maxIdleTime maximum idle time（millisecond）
   */
  cleanupIdleContexts(maxIdleTime: number = 5 * 60 * 1000): void {
    const now = Date.now()
    const contextsToDestroy: string[] = []

    this.contexts.forEach((context, contextId) => {
      if (now - context.lastUsedAt > maxIdleTime && context.instances.size === 0) {
        contextsToDestroy.push(contextId)
      }
    })

    contextsToDestroy.forEach(contextId => {
      this.destroyContext(contextId)
    })

    if (contextsToDestroy.length > 0) {
      if (process.env.NODE_ENV === 'development') {
      }
    }
  }

  /**
   * Destroys all contexts for the specified renderer
   * @param rendererType Renderer type
   */
  private destroyContextsByRenderer(rendererType: RendererType): void {
    const contextsToDestroy: string[] = []

    this.contexts.forEach((context, contextId) => {
      if (context.rendererType === rendererType) {
        contextsToDestroy.push(contextId)
      }
    })

    contextsToDestroy.forEach(contextId => {
      this.destroyContext(contextId)
    })
  }

  /**
   * Initialize the default renderer
   */
  private initializeDefaultRenderers(): void {
    // Here you can register the default renderer
    // The actual renderer implementation will be defined in the specific renderer file
    if (process.env.NODE_ENV === 'development') {
    }
  }
}

/**
 * Resource pool implementation class
 */
class ResourcePool implements IResourcePool {
  /** Resource cache */
  private resources = new Map<string, any>()
  /** Resource usage count */
  private usageCounts = new Map<string, number>()
  /** Resource creation time */
  private createdTimes = new Map<string, number>()

  /**
   * Get resources
   * @param key resource key
   * @param factory Resource factory function
   * @returns resource
   */
  get<T>(key: string, factory?: () => T): T | undefined {
    let resource = this.resources.get(key)

    if (!resource && factory) {
      resource = factory()
      this.resources.set(key, resource)
      this.createdTimes.set(key, Date.now())
      if (process.env.NODE_ENV === 'development') {
      }
    }

    if (resource) {
      this.usageCounts.set(key, (this.usageCounts.get(key) || 0) + 1)
    }

    return resource
  }

  /**
   * Set up resources
   * @param key resource key
   * @param resource resource
   */
  set(key: string, resource: any): void {
    this.resources.set(key, resource)
    this.createdTimes.set(key, Date.now())
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Delete resources
   * @param key resource key
   */
  delete(key: string): void {
    this.resources.delete(key)
    this.usageCounts.delete(key)
    this.createdTimes.delete(key)
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Clean up the resource pool
   */
  clear(): void {
    this.resources.clear()
    this.usageCounts.clear()
    this.createdTimes.clear()
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Get statistics
   * @returns Statistics
   */
  getStats() {
    return {
      totalResources: this.resources.size,
      totalUsage: Array.from(this.usageCounts.values()).reduce((sum, count) => sum + count, 0),
      averageUsage:
        this.resources.size > 0
          ? Array.from(this.usageCounts.values()).reduce((sum, count) => sum + count, 0) / this.resources.size
          : 0
    }
  }
}

// Create a global renderer manager instance
export const rendererManager = new RendererManager()

// Export type
export type { IRendererManager, IResourcePool }
