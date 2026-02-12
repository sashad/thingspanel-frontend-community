/**
 * Renderer Manager
 * Unified management of registration of all renderers、Create and switch
 */

import type { BaseRenderer, RendererFactory, RendererContext, RendererConfig } from '@/components/visual-editor/renderers/base/BaseRenderer'

// Renderer registration information
interface RendererRegistration {
  factory: RendererFactory
  type: string
  name: string
  description?: string
  icon?: string
  supported: boolean
}

// Renderer manager class
export class RendererManager {
  private static instance: RendererManager
  private registrations = new Map<string, RendererRegistration>()
  private activeRenderers = new Map<string, BaseRenderer>()

  private constructor() {}

  // Singleton pattern
  static getInstance(): RendererManager {
    if (!RendererManager.instance) {
      RendererManager.instance = new RendererManager()
    }
    return RendererManager.instance
  }

  // Register renderer
  register(
    type: string,
    factory: RendererFactory,
    options: {
      name: string
      description?: string
      icon?: string
    }
  ): void {
    if (this.registrations.has(type)) {
    }

    const registration: RendererRegistration = {
      factory,
      type,
      name: options.name,
      description: options.description,
      icon: options.icon,
      supported: factory.isSupported()
    }

    this.registrations.set(type, registration)
  }

  // Unregister a renderer
  unregister(type: string): boolean {
    const removed = this.registrations.delete(type)
    return removed
  }

  // Get a list of registered renderers
  getRegistrations(): RendererRegistration[] {
    return Array.from(this.registrations.values())
  }

  // Get a list of supported renderers
  getSupportedRenderers(): RendererRegistration[] {
    return this.getRegistrations().filter(reg => reg.supported)
  }

  // Check if the renderer is registered
  isRegistered(type: string): boolean {
    return this.registrations.has(type)
  }

  // Check if the renderer supports
  isSupported(type: string): boolean {
    const registration = this.registrations.get(type)
    return registration ? registration.supported : false
  }

  // Create renderer instance
  async createRenderer(type: string, context: RendererContext, config: RendererConfig = {}): Promise<BaseRenderer> {
    const registration = this.registrations.get(type)
    if (!registration) {
      throw new Error(`Renderer type '${type}' is not registered`)
    }

    if (!registration.supported) {
      throw new Error(`Renderer type '${type}' is not supported in current environment`)
    }

    try {
      const renderer = registration.factory.create(context, config)
      await renderer.init()

      // Caching active renderers
      const instanceKey = `${type}_${Date.now()}`
      this.activeRenderers.set(instanceKey, renderer)

      // Listen for renderer destruction events，clear cache
      renderer.on('state-change', state => {
        if (state === 'destroyed') {
          this.activeRenderers.delete(instanceKey)
        }
      })

      if (process.env.NODE_ENV === 'development') {
      }
      return renderer
    } catch (error) {
      console.error(`[RendererManager] Failed to create renderer '${type}':`, error)
      throw error
    }
  }

  // Get the number of active renderers
  getActiveRendererCount(): number {
    return this.activeRenderers.size
  }

  // Get the active renderer of a specific type
  getActiveRenderers(type?: string): BaseRenderer[] {
    if (!type) {
      return Array.from(this.activeRenderers.values())
    }

    return Array.from(this.activeRenderers.values()).filter(renderer => {
      const registration = Array.from(this.registrations.values()).find(reg => reg.factory === renderer.constructor)
      return registration?.type === type
    })
  }

  // Destroy all active renderers
  async destroyAllRenderers(): Promise<void> {
    const renderers = Array.from(this.activeRenderers.values())
    const destroyPromises = renderers.map(renderer => renderer.destroy())

    try {
      await Promise.all(destroyPromises)
      this.activeRenderers.clear()
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error('[RendererManager] Error destroying renderers:', error)
      throw error
    }
  }

  // Get renderer options（used for UI selector）
  getRendererOptions(): Array<{
    value: string
    label: string
    description?: string
    icon?: string
    supported: boolean
  }> {
    return this.getRegistrations().map(reg => ({
      value: reg.type,
      label: reg.name,
      description: reg.description,
      icon: reg.icon,
      supported: reg.supported
    }))
  }

  // Get supported renderer options
  getSupportedRendererOptions(): Array<{
    value: string
    label: string
    description?: string
    icon?: string
  }> {
    return this.getSupportedRenderers().map(reg => ({
      value: reg.type,
      label: reg.name,
      description: reg.description,
      icon: reg.icon
    }))
  }

  // Verify renderer switching
  canSwitchTo(fromType: string, toType: string): boolean {
    // Check if the target renderer supports
    if (!this.isSupported(toType)) {
      return false
    }

    // More complex switching rules can be added here
    // For example：Some renderers cannot be switched directly between

    return true
  }

  // Preload renderer（for performance optimization）
  async preloadRenderer(type: string): Promise<void> {
    const registration = this.registrations.get(type)
    if (!registration || !registration.supported) {
      console.error(`[RendererManager] Cannot preload unsupported renderer: ${type}`)
      return
    }

    try {
      // Preloading logic can be implemented here
      // For example：Preload renderer dependent resources
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error(`[RendererManager] Failed to preload renderer '${type}':`, error)
    }
  }

  // Get renderer performance statistics
  getPerformanceStats(): {
    totalRegistered: number
    totalSupported: number
    totalActive: number
    registrations: Array<{
      type: string
      name: string
      supported: boolean
      activeInstances: number
    }>
  } {
    const registrations = this.getRegistrations()

    return {
      totalRegistered: registrations.length,
      totalSupported: registrations.filter(reg => reg.supported).length,
      totalActive: this.activeRenderers.size,
      registrations: registrations.map(reg => ({
        type: reg.type,
        name: reg.name,
        supported: reg.supported,
        activeInstances: this.getActiveRenderers(reg.type).length
      }))
    }
  }

  // Clean up resources
  dispose(): void {
    this.destroyAllRenderers().catch(console.error)
    this.registrations.clear()
    if (process.env.NODE_ENV === 'development') {
    }
  }
}

// Export singleton instance
export const rendererManager = RendererManager.getInstance()

// Export convenience method
export const registerRenderer = (
  type: string,
  factory: RendererFactory,
  options: { name: string; description?: string; icon?: string }
) => {
  rendererManager.register(type, factory, options)
}

export const createRenderer = (type: string, context: RendererContext, config?: RendererConfig) => {
  return rendererManager.createRenderer(type, context, config)
}

export const getRendererOptions = () => {
  return rendererManager.getSupportedRendererOptions()
}
