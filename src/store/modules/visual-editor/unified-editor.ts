/**
 * unified Visual Editor Status management
 * Solve the dual state storage problem，Provide a single source of data
 */

import { defineStore } from 'pinia'
import type {
  GraphData,
  EditorMode,
  WidgetDefinition,
  WidgetConfiguration,
  ComponentDefinition,
  ReactiveDataBinding
} from '@/components/visual-editor/types'

export interface UnifiedEditorState {
  // Editor core status
  nodes: GraphData[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
  mode: EditorMode
  selectedIds: string[]

  // Component registration status
  widgets: Map<string, WidgetDefinition>

  // Configuration management status - Tiered storage
  baseConfigs: Map<string, BaseConfiguration>
  componentConfigs: Map<string, ComponentConfiguration>
  dataSourceConfigs: Map<string, DataSourceConfiguration>
  interactionConfigs: Map<string, InteractionConfiguration>

  // Card 2.1 Integration status
  card2Components: Map<string, ComponentDefinition>
  dataBindings: Map<string, ReactiveDataBinding>

  // runtime data
  runtimeData: Map<string, any>

  // System status
  isLoading: boolean
  isDirty: boolean
  lastSaved: Date | null
}

// Basic configuration interface
export interface BaseConfiguration {
  title?: string
  opacity?: number
  visible?: boolean
  locked?: boolean
  zIndex?: number
}

// Component configuration interface
export interface ComponentConfiguration {
  properties: Record<string, any>
  style?: Record<string, any>
  events?: Record<string, any>
}

// Data source configuration interface
export interface DataSourceConfiguration {
  type: 'static' | 'api' | 'websocket' | 'device' | 'script'
  config: Record<string, any>
  bindings: Record<string, any>
  metadata?: Record<string, any>
}

// Interactive configuration interface
export interface InteractionConfiguration {
  click?: any
  hover?: any
  focus?: any
  custom?: Record<string, any>
}

/**
 * unified Visual Editor Store
 * 🔥 This is the only status management center，Replace all decentralized state storage
 */
export const useUnifiedEditorStore = defineStore('unified-visual-editor', {
  state: (): UnifiedEditorState => ({
    // Editor status
    nodes: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    mode: 'design',
    selectedIds: [],

    // Component status
    widgets: new Map(),

    // configuration status - Hierarchical management
    baseConfigs: new Map(),
    componentConfigs: new Map(),
    dataSourceConfigs: new Map(),
    interactionConfigs: new Map(),

    // Card 2.1 state
    card2Components: new Map(),
    dataBindings: new Map(),

    // runtime status
    runtimeData: new Map(),

    // System status
    isLoading: false,
    isDirty: false,
    lastSaved: null
  }),

  getters: {
    /**
     * Get selected node
     */
    selectedNodes(state): GraphData[] {
      return state.nodes.filter(node => state.selectedIds.includes(node.id))
    },

    /**
     * Get complete component configuration
     * 🔥 key：Unified configuration access point
     */
    getFullConfiguration:
      state =>
      (widgetId: string): WidgetConfiguration => {
        return {
          base: state.baseConfigs.get(widgetId) || createDefaultBaseConfig(),
          component: state.componentConfigs.get(widgetId) || createDefaultComponentConfig(),
          dataSource: state.dataSourceConfigs.get(widgetId) || null,
          interaction: state.interactionConfigs.get(widgetId) || createDefaultInteractionConfig(),
          metadata: generateConfigurationMetadata(widgetId, state)
        }
      },

    /**
     * Get the runtime data of a component
     */
    getRuntimeData: state => (widgetId: string) => {
      return state.runtimeData.get(widgetId)
    },

    /**
     * Check components for unsaved changes
     */
    hasUnsavedChanges(state): boolean {
      return state.isDirty
    },

    /**
     * Get all registered components
     */
    allWidgets(state): WidgetDefinition[] {
      return Array.from(state.widgets.values())
    },

    /**
     * GetCard2.1Number of components
     */
    card2ComponentCount(state): number {
      return state.card2Components.size
    }
  },

  actions: {
    // ==================== Node operations ====================

    /**
     * Add node to canvas
     */
    addNode(node: GraphData): void {
      this.nodes.push(node)
      this.markDirty()

      // Initialize the basic configuration of the node
      if (!this.baseConfigs.has(node.id)) {
        this.baseConfigs.set(node.id, createDefaultBaseConfig())
      }
    },

    /**
     * Update node information
     */
    updateNode(id: string, updates: Partial<GraphData>): void {
      const nodeIndex = this.nodes.findIndex(node => node.id === id)
      if (nodeIndex !== -1) {
        this.nodes[nodeIndex] = { ...this.nodes[nodeIndex], ...updates }
        this.markDirty()
      }
    },

    /**
     * Delete the node and all its configuration
     */
    removeNode(id: string): void {
      // Remove node
      this.nodes = this.nodes.filter(node => node.id !== id)

      // Clean all relevant configurations
      this.baseConfigs.delete(id)
      this.componentConfigs.delete(id)
      this.dataSourceConfigs.delete(id)
      this.interactionConfigs.delete(id)
      this.runtimeData.delete(id)

      // Clear selected state
      this.selectedIds = this.selectedIds.filter(selectedId => selectedId !== id)

      this.markDirty()
    },

    /**
     * Select node
     */
    selectNodes(ids: string[]): void {
      this.selectedIds = [...ids]
    },

    // ==================== Configuration operations ====================

    /**
     * Set up basic configuration
     */
    setBaseConfiguration(widgetId: string, config: BaseConfiguration): void {
      this.baseConfigs.set(widgetId, { ...config })
      this.markDirty()
    },

    /**
     * Set component configuration
     */
    setComponentConfiguration(widgetId: string, config: ComponentConfiguration): void {
      this.componentConfigs.set(widgetId, { ...config })
      this.markDirty()
    },

    /**
     * Set data source configuration
     * 🔥 key：Unified data source configuration management
     */
    setDataSourceConfiguration(widgetId: string, config: DataSourceConfiguration): void {
      this.dataSourceConfigs.set(widgetId, { ...config })
      this.markDirty()

      // Trigger data binding updates
      this.updateDataBinding(widgetId)
    },

    /**
     * Set interaction configuration
     */
    setInteractionConfiguration(widgetId: string, config: InteractionConfiguration): void {
      this.interactionConfigs.set(widgetId, { ...config })
      this.markDirty()
    },

    /**
     * Update runtime data
     */
    setRuntimeData(widgetId: string, data: any): void {
      this.runtimeData.set(widgetId, data)
    },

    // ==================== Component registration ====================

    /**
     * Register component definition
     */
    registerWidget(definition: WidgetDefinition): void {
      this.widgets.set(definition.type, definition)
    },

    /**
     * Register components in batches
     */
    registerWidgets(definitions: WidgetDefinition[]): void {
      definitions.forEach(def => this.registerWidget(def))
    },

    // ==================== Card 2.1 integrated ====================

    /**
     * registerCard2.1components
     */
    registerCard2Component(definition: ComponentDefinition): void {
      this.card2Components.set(definition.type, definition)
    },

    /**
     * Create data binding
     */
    createDataBinding(widgetId: string, binding: ReactiveDataBinding): void {
      this.dataBindings.set(widgetId, binding)
    },

    /**
     * Update data binding
     */
    updateDataBinding(widgetId: string): void {
      const dataSourceConfig = this.dataSourceConfigs.get(widgetId)
      if (!dataSourceConfig) return
      // TODO: integratedCard2.1data binding system
      // Here will be the same asCard2.1Data binding system integration
    },

    // ==================== System operation ====================

    /**
     * Mark as dirty
     */
    markDirty(): void {
      this.isDirty = true
    },

    /**
     * Mark as saved
     */
    markSaved(): void {
      this.isDirty = false
      this.lastSaved = new Date()
    },

    /**
     * Set loading status
     */
    setLoading(loading: boolean): void {
      this.isLoading = loading
    },

    // ==================== View operations ====================

    /**
     * Update view port
     */
    updateViewport(viewport: { x?: number; y?: number; zoom?: number }): void {
      this.viewport = { ...this.viewport, ...viewport }
    },

    /**
     * Set editor mode
     */
    setMode(mode: EditorMode): void {
      this.mode = mode
    },

    /**
     * reset view port
     */
    resetViewport(): void {
      this.viewport = { x: 0, y: 0, zoom: 1 }
    },

    /**
     * clear all status
     */
    clearAll(): void {
      this.nodes = []
      this.selectedIds = []
      this.viewport = { x: 0, y: 0, zoom: 1 }
      this.mode = 'design'
      this.widgets.clear()
      this.baseConfigs.clear()
      this.componentConfigs.clear()
      this.dataSourceConfigs.clear()
      this.interactionConfigs.clear()
      this.card2Components.clear()
      this.dataBindings.clear()
      this.runtimeData.clear()
      this.isDirty = false
      this.lastSaved = null
    }
  }
})

// ==================== Helper function ====================

/**
 * Create a default base configuration
 */
function createDefaultBaseConfig(): BaseConfiguration {
  return {
    title: '',
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 1
  }
}

/**
 * Create default component configuration
 */
function createDefaultComponentConfig(): ComponentConfiguration {
  return {
    properties: {},
    style: {},
    events: {}
  }
}

/**
 * Create a default interaction configuration
 */
function createDefaultInteractionConfig(): InteractionConfiguration {
  return {
    click: null,
    hover: null,
    focus: null,
    custom: {}
  }
}

/**
 * Generate configuration metadata
 */
function generateConfigurationMetadata(widgetId: string, state: UnifiedEditorState): Record<string, any> {
  return {
    id: widgetId,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0.0',
    hasDataBinding: state.dataBindings.has(widgetId),
    hasRuntimeData: state.runtimeData.has(widgetId),
    configurationSections: {
      base: state.baseConfigs.has(widgetId),
      component: state.componentConfigs.has(widgetId),
      dataSource: state.dataSourceConfigs.has(widgetId),
      interaction: state.interactionConfigs.has(widgetId)
    }
  }
}
