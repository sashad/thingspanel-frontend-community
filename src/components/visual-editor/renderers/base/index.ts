/**
 * Renderer basic module entry file
 * Export all base renderer related types and tools
 */

// Basic renderer classes and interfaces
export {
  BaseRenderer,
  BaseRendererFactory,
  RendererState,
  type RendererConfig,
  type RendererEvents,
  type NodeData,
  type RendererContext,
  type RendererFactory
} from './BaseRenderer'

// Vue Component base renderer
export { default as BaseRendererComponent } from '@/components/visual-editor/renderers/base/BaseRendererComponent.vue'

// Base UI components
export { default as NodeWrapper } from '@/components/visual-editor/renderers/base/NodeWrapper.vue'
export { default as ContextMenu } from '@/components/visual-editor/renderers/base/ContextMenu.vue'
export { default as Card2Wrapper } from '@/components/visual-editor/renderers/base/Card2Wrapper.vue'

// Renderer Manager
export {
  RendererManager,
  rendererManager,
  registerRenderer,
  createRenderer,
  getRendererOptions
} from './RendererManager'

// Tool type
export interface RendererOption {
  value: string
  label: string
  description?: string
  icon?: string
  supported?: boolean
}

export interface RendererSwitchContext {
  fromType: string
  toType: string
  preserveState?: boolean
  config?: RendererConfig
}

// Renderer lifecycle hook types
export interface RendererLifecycleHooks {
  onBeforeInit?: () => Promise<void> | void
  onAfterInit?: () => Promise<void> | void
  onBeforeRender?: () => Promise<void> | void
  onAfterRender?: () => Promise<void> | void
  onBeforeDestroy?: () => Promise<void> | void
  onAfterDestroy?: () => Promise<void> | void
}

// Renderer performance monitoring interface
export interface RendererPerformanceMetrics {
  initTime: number
  renderTime: number
  memoryUsage: number
  nodeCount: number
  lastUpdateTime: number
}

// Renderer error type
export class RendererError extends Error {
  constructor(
    message: string,
    public rendererType: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'RendererError'
  }
}

// Renderer initialization error
export class RendererInitError extends RendererError {
  constructor(rendererType: string, cause?: Error) {
    super(`Failed to initialize renderer: ${rendererType}`, rendererType, cause)
    this.name = 'RendererInitError'
  }
}

// Renderer rendering error
export class RendererRenderError extends RendererError {
  constructor(rendererType: string, cause?: Error) {
    super(`Failed to render with renderer: ${rendererType}`, rendererType, cause)
    this.name = 'RendererRenderError'
  }
}

// Utility function

/**
 * Create renderer context
 */
export function createRendererContext(
  nodes: any,
  selectedIds: any,
  config: any,
  container?: HTMLElement
): RendererContext {
  return {
    nodes,
    selectedIds,
    config,
    container
  }
}

/**
 * Verify renderer configuration
 */
export function validateRendererConfig(config: RendererConfig): boolean {
  // Basic verification logic
  if (typeof config !== 'object' || config === null) {
    return false
  }

  // Check required fields
  if (config.readonly !== undefined && typeof config.readonly !== 'boolean') {
    return false
  }

  if (config.theme !== undefined && !['light', 'dark'].includes(config.theme)) {
    return false
  }

  return true
}

/**
 * Merge renderer configuration
 */
export function mergeRendererConfig(
  baseConfig: RendererConfig,
  overrideConfig: Partial<RendererConfig>
): RendererConfig {
  return {
    ...baseConfig,
    ...overrideConfig
  }
}

/**
 * Check renderer compatibility
 */
export function checkRendererCompatibility(type: string): boolean {
  // Check browser feature support
  switch (type) {
    case 'canvas':
      return !!document.createElement('canvas').getContext
    case 'webgl':
      try {
        const canvas = document.createElement('canvas')
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      } catch {
        return false
      }
    case 'svg':
      return !!document.createElementNS
    default:
      return true
  }
}

/**
 * Create a renderer performance monitor
 */
export function createPerformanceMonitor(): {
  startTiming: (operation: string) => void
  endTiming: (operation: string) => number
  getMetrics: () => Record<string, number>
  reset: () => void
} {
  const timings: Record<string, number> = {}
  const startTimes: Record<string, number> = {}

  return {
    startTiming(operation: string) {
      startTimes[operation] = performance.now()
    },

    endTiming(operation: string) {
      const startTime = startTimes[operation]
      if (startTime) {
        const duration = performance.now() - startTime
        timings[operation] = duration
        delete startTimes[operation]
        return duration
      }
      return 0
    },

    getMetrics() {
      return { ...timings }
    },

    reset() {
      Object.keys(timings).forEach(key => delete timings[key])
      Object.keys(startTimes).forEach(key => delete startTimes[key])
    }
  }
}
