/**
 * Component dynamic loader
 * Implement lazy loading and cache management of components
 */

import type { IComponentLoader, IComponentDefinition } from '../types/component'
import { componentRegistry } from './index'

/**
 * Loading status type
 */
type LoadingState = 'loading' | 'loaded' | 'error' | 'not-found'

/**
 * Component loader implementation class
 */
export class ComponentLoader implements IComponentLoader {
  /** Load state cache */
  private loadingStates = new Map<string, LoadingState>()
  /** loadPromisecache */
  private loadingPromises = new Map<string, Promise<IComponentDefinition>>()
  /** Error message cache */
  private errors = new Map<string, Error>()
  /** Component path mapping */
  private componentPaths = new Map<string, string>()

  constructor() {
    this.initializeComponentPaths()
  }

  /**
   * Dynamically load components
   * @param componentId componentsID
   * @returns Component definitionPromise
   */
  async load(componentId: string): Promise<IComponentDefinition> {
    // Check if it has been loaded
    const existingDefinition = componentRegistry.getDefinition(componentId)
    if (existingDefinition) {
      this.loadingStates.set(componentId, 'loaded')
      return existingDefinition
    }

    // Check if loading
    const existingPromise = this.loadingPromises.get(componentId)
    if (existingPromise) {
      return existingPromise
    }

    // Start loading
    this.loadingStates.set(componentId, 'loading')

    const loadPromise = this.performLoad(componentId)
    this.loadingPromises.set(componentId, loadPromise)

    try {
      const definition = await loadPromise
      this.loadingStates.set(componentId, 'loaded')
      this.loadingPromises.delete(componentId)
      this.errors.delete(componentId)

      // Register to the component registry
      componentRegistry.register(definition)

      if (process.env.NODE_ENV === 'development') {
      }
      return definition
    } catch (error) {
      this.loadingStates.set(componentId, 'error')
      this.loadingPromises.delete(componentId)
      this.errors.set(componentId, error as Error)

      console.error(`[ComponentLoader] components ${componentId} Loading failed:`, error)
      throw error
    }
  }

  /**
   * Preload components
   * @param componentIds componentsIDarray
   */
  async preload(componentIds: string[]): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
    }

    const loadPromises = componentIds.map(async componentId => {
      try {
        await this.load(componentId)
      } catch (error) {
        console.error(`[ComponentLoader] Preload components ${componentId} fail:`, error)
      }
    })

    await Promise.allSettled(loadPromises)
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Uninstall components
   * @param componentId componentsID
   */
  unload(componentId: string): void {
    // Log out of the registry
    componentRegistry.unregister(componentId)

    // Clean loading status
    this.loadingStates.delete(componentId)
    this.loadingPromises.delete(componentId)
    this.errors.delete(componentId)

    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Get loading status
   * @param componentId componentsID
   * @returns Loading status
   */
  getLoadingState(componentId: string): LoadingState {
    return this.loadingStates.get(componentId) || 'not-found'
  }

  /**
   * clear cache
   */
  clearCache(): void {
    this.loadingStates.clear()
    this.loadingPromises.clear()
    this.errors.clear()
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Get error message
   * @param componentId componentsID
   * @returns error message ornull
   */
  getError(componentId: string): Error | null {
    return this.errors.get(componentId) || null
  }

  /**
   * Get loading statistics
   * @returns Statistics
   */
  getStats() {
    const states = Array.from(this.loadingStates.values())
    return {
      total: this.loadingStates.size,
      loading: states.filter(s => s === 'loading').length,
      loaded: states.filter(s => s === 'loaded').length,
      error: states.filter(s => s === 'error').length,
      notFound: states.filter(s => s === 'not-found').length
    }
  }

  /**
   * Perform the actual loading operation
   * @param componentId componentsID
   * @returns Component definitionPromise
   */
  private async performLoad(componentId: string): Promise<IComponentDefinition> {
    const componentPath = this.componentPaths.get(componentId)

    if (!componentPath) {
      throw new Error(`Component not found ${componentId} path configuration`)
    }

    try {
      // Dynamically import component modules
      const module = await import(componentPath)
      const definition = module.default || module

      // Verify component definition
      this.validateLoadedDefinition(definition, componentId)

      return definition
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot resolve module')) {
        this.loadingStates.set(componentId, 'not-found')
        throw new Error(`Component file does not exist: ${componentPath}`)
      }
      throw error
    }
  }

  /**
   * Verify loaded component definition
   * @param definition Component definition
   * @param componentId componentsID
   */
  private validateLoadedDefinition(definition: any, componentId: string): void {
    if (!definition) {
      throw new Error(`components ${componentId} Export is empty`)
    }

    if (!definition.meta || !definition.logic || !definition.views) {
      throw new Error(`components ${componentId} incomplete definition，missing necessary meta、logic or views property`)
    }

    if (definition.meta.id !== componentId) {
      throw new Error(`components ${componentId} of meta.id Does not match file name`)
    }
  }

  /**
   * Initialize component path mapping
   */
  private initializeComponentPaths(): void {
    // ChartComponent path mapping
    const chartComponents = [
      'chart-bar',
      'chart-curve',
      'chart-table',
      'chart-digit',
      'chart-switch',
      'chart-text-info',
      'chart-video-player',
      'chart-instrument-panel',
      'chart-state',
      'chart-enum-control',
      'chart-digit-setter',
      'chart-dispatch',
      'chart-demo'
    ]

    chartComponents.forEach(componentId => {
      const componentName = componentId.replace('chart-', '')
      this.componentPaths.set(componentId, `@/card/components/chart/${componentName}/index.ts`)
    })

    // BuiltinComponent path mapping
    const builtinComponents = [
      'access-num',
      'alarm-count',
      'alarm-info',
      'cpu-usage',
      'memory-usage',
      'disk-usage',
      'online-trend',
      'tenant-count',
      'system-metrics-history',
      'version-info',
      'news-info',
      'recently-visited',
      'reported-data',
      'tenant-chart',
      'operation-guide',
      'app-download',
      'online-status',
      'offline-status'
    ]

    builtinComponents.forEach(componentId => {
      const componentName = componentId.replace(/-/g, '-')
      this.componentPaths.set(componentId, `@/card/components/builtin/${componentName}/index.ts`)
    })

    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Register custom component path
   * @param componentId componentsID
   * @param path component path
   */
  registerComponentPath(componentId: string, path: string): void {
    this.componentPaths.set(componentId, path)
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Batch registration component path
   * @param pathMap path mapping
   */
  registerComponentPaths(pathMap: Record<string, string>): void {
    Object.entries(pathMap).forEach(([componentId, path]) => {
      this.componentPaths.set(componentId, path)
    })
    if (process.env.NODE_ENV === 'development') {
    }
  }
}

// Create a global loader instance
export const componentLoader = new ComponentLoader()

// Export loader type
export type { IComponentLoader }
