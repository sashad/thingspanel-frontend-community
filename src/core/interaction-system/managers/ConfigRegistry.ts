/**
 * Configure component registry
 * for management Card 2.1 Custom configuration panel for components
 */

import type { IConfigComponent } from '@/card2.1/core'

interface ConfigComponentRegistration {
  componentId: string
  configComponent: IConfigComponent
}

class ConfigRegistry {
  private registry = new Map<string, IConfigComponent>()

  /**
   * Register configuration component
   */
  register(componentId: string, configComponent: IConfigComponent) {
    this.registry.set(componentId, configComponent)
  }

  /**
   * Get configuration components
   */
  get(componentId: string): IConfigComponent | undefined {
    return this.registry.get(componentId)
  }

  /**
   * Check if there is a custom configuration component
   */
  has(componentId: string): boolean {
    return this.registry.has(componentId)
  }

  /**
   * Get all registered configuration components
   */
  getAll(): ConfigComponentRegistration[] {
    return Array.from(this.registry.entries()).map(([componentId, configComponent]) => ({
      componentId,
      configComponent
    }))
  }

  /**
   * clear all registrations
   */
  clear() {
    this.registry.clear()
  }

  /**
   * Remove the configuration of the specified component
   */
  unregister(componentId: string) {
    return this.registry.delete(componentId)
  }
}

// Export singleton
export const configRegistry = new ConfigRegistry()

export default configRegistry
