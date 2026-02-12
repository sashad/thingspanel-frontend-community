/**
 * VueRenderer implementation
 * based onVue 3component renderer
 */

import { createApp, App, Component, ref, reactive, onMounted, onUnmounted, h } from 'vue'
import type { IRenderer, IRendererConfig, IRenderContext, IRendererEvent, IRendererHooks } from '../types/renderer'
import type { IComponentInstance } from '../types/component'
import type { IDataNode } from '../types/index'

/**
 * VueRenderer configuration
 */
interface VueRendererConfig extends IRendererConfig {
  /** global components */
  globalComponents?: Record<string, Component>
  /** global directive */
  globalDirectives?: Record<string, any>
  /** plug-in */
  plugins?: Array<{ install: (_app: App) => void }>
  /** development mode */
  devMode?: boolean
}

/**
 * VueRenderer implementation class
 */
export class VueRenderer implements IRenderer {
  /** Renderer type */
  readonly type = 'vue'
  /** Renderer configuration */
  private config: VueRendererConfig
  /** VueApplication instance cache */
  private apps = new Map<string, App>()
  /** Component instance cache */
  private componentInstances = new Map<string, any>()
  /** event listener */
  private eventListeners = new Map<string, Set<(event: IRendererEvent) => void>>()
  /** hook function */
  private hooks: IRendererHooks = {}

  constructor(config: VueRendererConfig = {}) {
    this.config = {
      enableHMR: true,
      enableDevtools: true,
      enableErrorBoundary: true,
      ...config
    }

    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Render component instance
   * @param instance Component instance
   * @param context rendering context
   */
  async render(instance: IComponentInstance, context: IRenderContext): Promise<void> {
    try {
      // Call pre-render hook
      await this.hooks.beforeRender?.(instance, context)

      // createVueapplication
      const app = this.createVueApp(instance, context)

      // Mount to container
      const mountedApp = app.mount(context.container)

      // Caching application and component instances
      this.apps.set(instance.id, app)
      this.componentInstances.set(instance.id, mountedApp)

      // Trigger render completion event
      this.emitEvent('rendered', {
        type: 'rendered',
        instanceId: instance.id,
        contextId: context.id,
        timestamp: Date.now()
      })

      // Calling post-render hooks
      await this.hooks.afterRender?.(instance, context)

      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error(`[VueRenderer] Rendering failed:`, error)

      // trigger error event
      this.emitEvent('error', {
        type: 'error',
        instanceId: instance.id,
        contextId: context.id,
        error: error as Error,
        timestamp: Date.now()
      })

      throw error
    }
  }

  /**
   * Update component instance
   * @param instance Component instance
   * @param data Update data
   * @param context rendering context
   */
  async update(instance: IComponentInstance, data: any, context: IRenderContext): Promise<void> {
    try {
      // Call the pre-update hook
      await this.hooks.beforeUpdate?.(instance, data, context)

      const componentInstance = this.componentInstances.get(instance.id)
      if (!componentInstance) {
        throw new Error(`Component instance ${instance.id} does not exist`)
      }

      // Update component data
      if (componentInstance.updateData && typeof componentInstance.updateData === 'function') {
        await componentInstance.updateData(data)
      } else if (componentInstance.$refs?.component?.updateData) {
        await componentInstance.$refs.component.updateData(data)
      } else {
        // Directly update responsive data
        Object.assign(componentInstance.data || {}, data)
      }

      // Trigger update completion event
      this.emitEvent('updated', {
        type: 'updated',
        instanceId: instance.id,
        contextId: context.id,
        data,
        timestamp: Date.now()
      })

      // Call post-update hook
      await this.hooks.afterUpdate?.(instance, data, context)

      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error(`[VueRenderer] Update failed:`, error)
      throw error
    }
  }

  /**
   * Destroy component instance
   * @param instance Component instance
   * @param context rendering context
   */
  async destroy(instance: IComponentInstance, context: IRenderContext): Promise<void> {
    try {
      // Call the pre-destruction hook
      await this.hooks.beforeDestroy?.(instance, context)

      const app = this.apps.get(instance.id)
      if (app) {
        // uninstallVueapplication
        app.unmount()
        this.apps.delete(instance.id)
      }

      // Clean up component instance
      this.componentInstances.delete(instance.id)

      // Trigger the destruction completion event
      this.emitEvent('destroyed', {
        type: 'destroyed',
        instanceId: instance.id,
        contextId: context.id,
        timestamp: Date.now()
      })

      // Call post-destruction hook
      await this.hooks.afterDestroy?.(instance, context)

      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error(`[VueRenderer] Destruction failed:`, error)
      throw error
    }
  }

  /**
   * Add event listener
   * @param eventType event type
   * @param listener listener function
   */
  addEventListener(eventType: string, listener: (event: IRendererEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set())
    }
    this.eventListeners.get(eventType)!.add(listener)
  }

  /**
   * Remove event listener
   * @param eventType event type
   * @param listener listener function
   */
  removeEventListener(eventType: string, listener: (event: IRendererEvent) => void): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * Set hook function
   * @param hooks hook function object
   */
  setHooks(hooks: Partial<IRendererHooks>): void {
    this.hooks = { ...this.hooks, ...hooks }
  }

  /**
   * Get renderer configuration
   * @returns Configuration object
   */
  getConfig(): VueRendererConfig {
    return { ...this.config }
  }

  /**
   * Update renderer configuration
   * @param config New configuration
   */
  updateConfig(config: Partial<VueRendererConfig>): void {
    this.config = { ...this.config, ...config }
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Destroy renderer
   */
  cleanup(): void {
    // Destroy allVueapplication
    this.apps.forEach((app, instanceId) => {
      try {
        app.unmount()
      } catch (error) {
        console.error(`[VueRenderer] Destroy application ${instanceId} fail:`, error)
      }
    })

    // clear cache
    this.apps.clear()
    this.componentInstances.clear()
    this.eventListeners.clear()

    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * createVueapplication
   * @param instance Component instance
   * @param context rendering context
   * @returns VueApplication examples
   */
  private createVueApp(instance: IComponentInstance, context: IRenderContext): App {
    // Create root component
    const RootComponent = this.createRootComponent(instance)

    // createVueapplication
    const app = createApp(RootComponent)

    // Configure global components
    if (this.config.globalComponents) {
      Object.entries(this.config.globalComponents).forEach(([name, component]) => {
        app.component(name, component)
      })
    }

    // Configure global directives
    if (this.config.globalDirectives) {
      Object.entries(this.config.globalDirectives).forEach(([name, directive]) => {
        app.directive(name, directive)
      })
    }

    // Install plugin
    if (this.config.plugins) {
      this.config.plugins.forEach(plugin => {
        app.use(plugin)
      })
    }

    // Configure error handling
    if (this.config.enableErrorBoundary) {
      app.config.errorHandler = (error, _vm, info) => {
        console.error('[VueRenderer] Vuemistake:', error, info)
        this.emitEvent('error', {
          type: 'error',
          instanceId: instance.id,
          contextId: context.id,
          error: error as Error,
          timestamp: Date.now()
        })
      }
    }

    // Development mode configuration
    if (this.config.devMode) {
      app.config.devtools = this.config.enableDevtools
    }

    return app
  }

  /**
   * Create root component
   * @param instance Component instance
   * @returns Vuecomponents
   */
  private createRootComponent(instance: IComponentInstance): Component {
    const { definition, config, data } = instance

    return {
      name: `Card_${definition.meta.id}`,
      setup() {
        // Create responsive data
        const cardData = ref(data)
        const cardConfig = reactive(config)
        const isLoading = ref(false)
        const error = ref<Error | null>(null)

        // Data update method
        const updateData = async (newData: IDataNode | IDataNode[]) => {
          try {
            isLoading.value = true
            error.value = null

            // Call the data processing method of the component logic
            if (definition.logic.processData) {
              const processedData = await definition.logic.processData(newData, cardConfig)
              cardData.value = processedData
            } else {
              cardData.value = newData
            }
          } catch (err) {
            error.value = err as Error
            console.error('[VueRenderer] Data update failed:', err)
          } finally {
            isLoading.value = false
          }
        }

        // Configuration update method
        const updateConfig = (newConfig: any) => {
          Object.assign(cardConfig, newConfig)
        }

        // life cycle hooks
        onMounted(async () => {
          try {
            await definition.logic.onMounted?.({
              data: cardData.value,
              config: cardConfig,
              updateData,
              updateConfig
            })
          } catch (err) {
            console.error('[VueRenderer] Component mounting failed:', err)
          }
        })

        onUnmounted(async () => {
          try {
            await definition.logic.onUnmounted?.({
              data: cardData.value,
              config: cardConfig,
              updateData,
              updateConfig
            })
          } catch (err) {
            console.error('[VueRenderer] Component uninstallation failed:', err)
          }
        })

        // Expose methods to external calls
        return {
          cardData,
          cardConfig,
          isLoading,
          error,
          updateData,
          updateConfig
        }
      },
      render() {
        // Get the correspondingVueview component
        const VueView = definition.views.vue
        if (!VueView) {
          throw new Error(`components ${definition.meta.id} NoVueView implementation`)
        }

        // renderingVuecomponents
        return h(VueView, {
          data: this.cardData,
          config: this.cardConfig,
          loading: this.isLoading,
          error: this.error,
          onUpdateData: this.updateData,
          onUpdateConfig: this.updateConfig
        })
      }
    }
  }

  /**
   * trigger event
   * @param eventType event type
   * @param event event object
   */
  private emitEvent(eventType: string, event: IRendererEvent): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error(`[VueRenderer] Event listener execution failed:`, error)
        }
      })
    }
  }
}

// create defaultVueRenderer instance
export const vueRenderer = new VueRenderer()

// Export type
export type { VueRendererConfig }
