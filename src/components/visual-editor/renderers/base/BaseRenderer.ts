/**
 * Basic renderer class
 * Define a unified interface and life cycle for all renderers
 */

import type { Ref } from 'vue'

// Renderer status enum
export enum RendererState {
  IDLE = 'idle', // idle state
  INITIALIZING = 'initializing', // Initializing
  READY = 'ready', // Ready state
  RENDERING = 'rendering', // Rendering
  ERROR = 'error', // error status
  DESTROYED = 'destroyed' // Destroyed
}

// Renderer configuration interface
export interface RendererConfig {
  readonly?: boolean
  theme?: 'light' | 'dark'
  [key: string]: any
}

// Renderer event interface
export interface RendererEvents {
  ready: []
  error: [Error]
  'node-select': [string]
  'node-update': [string, any]
  'canvas-click': [MouseEvent?]
  'state-change': [RendererState]
}

// Node data interface
export interface NodeData {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  properties: Record<string, any>
  renderer?: string[]
}

// Renderer context interface
export interface RendererContext {
  nodes: Ref<NodeData[]>
  selectedIds: Ref<string[]>
  config: Ref<RendererConfig>
  container?: HTMLElement
}

// Basic renderer abstract class
export abstract class BaseRenderer {
  protected state: RendererState = RendererState.IDLE
  protected context: RendererContext
  protected eventListeners: Map<keyof RendererEvents, Array<(...args: any[]) => void>> = new Map()
  protected config: RendererConfig

  constructor(context: RendererContext, config: RendererConfig = {}) {
    this.context = context
    this.config = { readonly: false, theme: 'light', ...config }
    this.initializeEventMap()
  }

  // Initialize event mapping
  private initializeEventMap() {
    const events: (keyof RendererEvents)[] = [
      'ready',
      'error',
      'node-select',
      'node-update',
      'canvas-click',
      'state-change'
    ]
    events.forEach(event => {
      this.eventListeners.set(event, [])
    })
  }

  // Get current status
  getState(): RendererState {
    return this.state
  }

  // Set status
  protected setState(newState: RendererState) {
    if (this.state !== newState) {
      const oldState = this.state
      this.state = newState
      this.emit('state-change', newState)
      this.onStateChange(oldState, newState)
    }
  }

  // state change hook
  protected onStateChange(oldState: RendererState, newState: RendererState) {}

  // event listening
  on<K extends keyof RendererEvents>(event: K, listener: (...args: RendererEvents[K]) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.push(listener)
    }
  }

  // Remove event listener
  off<K extends keyof RendererEvents>(event: K, listener: (...args: RendererEvents[K]) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // trigger event
  protected emit<K extends keyof RendererEvents>(event: K, ...args: RendererEvents[K]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args)
        } catch (error) {
          console.error(`[${this.constructor.name}] Event listener error:`, error)
        }
      })
    }
  }

  // life cycle methods - initialization
  async init(): Promise<void> {
    if (this.state !== RendererState.IDLE) {
      throw new Error(`Cannot initialize renderer in state: ${this.state}`)
    }

    try {
      this.setState(RendererState.INITIALIZING)
      await this.onInit()
      this.setState(RendererState.READY)
      this.emit('ready')
    } catch (error) {
      this.setState(RendererState.ERROR)
      this.emit('error', error as Error)
      throw error
    }
  }

  // life cycle methods - rendering
  async render(): Promise<void> {
    if (this.state !== RendererState.READY) {
      console.error(`[${this.constructor.name}] Render called in state: ${this.state}`)
      return
    }

    try {
      this.setState(RendererState.RENDERING)
      await this.onRender()
      this.setState(RendererState.READY)
    } catch (error) {
      this.setState(RendererState.ERROR)
      this.emit('error', error as Error)
      throw error
    }
  }

  // life cycle methods - renew
  async update(changes: Partial<RendererConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...changes }
      await this.onUpdate(changes)
    } catch (error) {
      this.setState(RendererState.ERROR)
      this.emit('error', error as Error)
      throw error
    }
  }

  // life cycle methods - destroy
  async destroy(): Promise<void> {
    try {
      await this.onDestroy()
      this.setState(RendererState.DESTROYED)
      this.eventListeners.clear()
    } catch (error) {
      console.error(`[${this.constructor.name}] Destroy error:`, error)
      throw error
    }
  }

  // Node operation method
  selectNode(nodeId: string): void {
    this.emit('node-select', nodeId)
    this.onNodeSelect(nodeId)
  }

  updateNode(nodeId: string, updates: Partial<NodeData>): void {
    this.emit('node-update', nodeId, updates)
    this.onNodeUpdate(nodeId, updates)
  }

  handleCanvasClick(event?: MouseEvent): void {
    this.emit('canvas-click', event)
    this.onCanvasClick(event)
  }

  // Get configuration
  getConfig(): RendererConfig {
    return { ...this.config }
  }

  // abstract method - Subclasses must implement
  protected abstract onInit(): Promise<void>
  protected abstract onRender(): Promise<void>
  protected abstract onUpdate(changes: Partial<RendererConfig>): Promise<void>
  protected abstract onDestroy(): Promise<void>

  // Optional hook method - Subclasses can override
  protected onNodeSelect(nodeId: string): void {
    // Default implementation，Subclasses can override
  }

  protected onNodeUpdate(nodeId: string, updates: Partial<NodeData>): void {
    // Default implementation，Subclasses can override
  }

  protected onCanvasClick(event?: MouseEvent): void {
    // Default implementation，Subclasses can override
  }

  // Tool method
  protected isReady(): boolean {
    return this.state === RendererState.READY
  }

  protected isDestroyed(): boolean {
    return this.state === RendererState.DESTROYED
  }

  protected validateState(expectedStates: RendererState[]): void {
    if (!expectedStates.includes(this.state)) {
      throw new Error(`Invalid state: expected ${expectedStates.join(' or ')}, got ${this.state}`)
    }
  }
}

// Renderer factory interface
export interface RendererFactory {
  create(context: RendererContext, config?: RendererConfig): BaseRenderer
  getType(): string
  isSupported(): boolean
}

// Abstract renderer factory class
export abstract class BaseRendererFactory implements RendererFactory {
  abstract create(context: RendererContext, config?: RendererConfig): BaseRenderer
  abstract getType(): string

  isSupported(): boolean {
    // Default implementation，Subclasses can override to check for specific support conditions
    return true
  }
}
