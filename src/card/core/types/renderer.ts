/**
 * Renderer interface definition
 * Define unified specifications and life cycle of renderers
 */

import type { IDataNode, RendererType, IComponentInstance } from './index'

// Renderer interface
export interface IRenderer {
  /** Renderer type */
  type: RendererType
  /** Renderer name */
  name: string
  /** Renderer version */
  version: string
  /** Has it been initialized? */
  initialized: boolean
  /** Is it in sleep state? */
  sleeping: boolean

  /** Initialize renderer */
  init(container: HTMLElement): Promise<void>
  /** render component */
  render(component: IComponentInstance): Promise<void>
  /** Update component */
  update(component: IComponentInstance): Promise<void>
  /** Remove component */
  remove(componentId: string): Promise<void>
  /** Sleep renderer */
  sleep(): Promise<void>
  /** Wake up the renderer */
  wakeup(): Promise<void>
  /** Destroy renderer */
  destroy(): Promise<void>
  /** Get rendering context */
  getContext(): any
}

// Renderer configuration
export interface IRendererConfig {
  /** Renderer type */
  type: RendererType
  /** Configuration parameters */
  options?: Record<string, any>
  /** Performance configuration */
  performance?: {
    /** Whether to enable hardware acceleration */
    hardwareAcceleration?: boolean
    /** maximumFPS */
    maxFPS?: number
    /** Whether to enable batch rendering */
    batchRendering?: boolean
  }
}

// rendering context
export interface IRenderContext {
  /** Renderer type */
  rendererType: RendererType
  /** container element */
  container: HTMLElement
  /** Canvaselement (if applicable) */
  canvas?: HTMLCanvasElement
  /** rendering context (2D/WebGL) */
  context?: CanvasRenderingContext2D | WebGLRenderingContext | WebGL2RenderingContext
  /** Viewport information */
  viewport: {
    width: number
    height: number
    devicePixelRatio: number
  }
  /** Rendering status */
  state: {
    /** Is rendering */
    rendering: boolean
    /** Rendering frames */
    frameCount: number
    /** Last render time */
    lastRenderTime: number
  }
}

// Renderer events
export interface IRendererEvent {
  /** event type */
  type: 'init' | 'render' | 'update' | 'sleep' | 'wakeup' | 'destroy' | 'error'
  /** Renderer type */
  rendererType: RendererType
  /** event data */
  data?: any
  /** error message (If it is an error event) */
  error?: Error
  /** Timestamp */
  timestamp: number
}

// Renderer manager interface
export interface IRendererManager {
  /** Register renderer */
  register(renderer: IRenderer): void
  /** Get renderer */
  getRenderer(type: RendererType): IRenderer | null
  /** Switch renderer */
  switchRenderer(fromType: RendererType, toType: RendererType): Promise<void>
  /** Get all renderers */
  getAllRenderers(): IRenderer[]
  /** Destroy all renderers */
  destroyAll(): Promise<void>
}

// Resource pool interface (For renderer resource management)
export interface IResourcePool {
  /** Get resources */
  acquire<T>(key: string, factory: () => T): T
  /** Release resources */
  release(key: string): void
  /** Clean up unused resources */
  cleanup(): void
  /** Get resource usage statistics */
  getStats(): {
    total: number
    active: number
    idle: number
  }
}

// Renderer hook function
export interface IRendererHooks {
  /** Pre-render hook */
  beforeRender?: (context: IRenderContext) => void | Promise<void>
  /** Post-render hook */
  afterRender?: (context: IRenderContext) => void | Promise<void>
  /** Error handling hook */
  onError?: (error: Error, context: IRenderContext) => void
  /** Performance monitoring hooks */
  onPerformance?: (metrics: { renderTime: number; fps: number; memoryUsage?: number }) => void
}
