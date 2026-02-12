/**
 * Renderer type definition
 */

// Renderer type
export type RendererType = 'canvas' | 'gridstack' | 'kanban' | 'dashboard' | 'report' | 'three-d'

// Renderer interface
export interface IRenderer {
  init(): void
  render(): void
  destroy(): void
  sleep?(): void
  wakeup?(): void
}

// Renderer configuration
export interface RendererConfig {
  type: RendererType
  name: string
  description: string
  supportedComponents: string[]
}
