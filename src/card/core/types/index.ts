/**
 * Card 2.0 core type definition
 * Unified data node protocol based on visual editor architecture design
 */

// Unified Data Node Protocol (Unified Data Node Protocol)
export interface IDataNode {
  /** Node unique identifier */
  id: string
  /** Component type */
  type: string
  /** Adapted renderer list */
  renderer: RendererType[]
  /** layout information */
  layout: {
    x: number
    y: number
    width: number
    height: number
    minWidth?: number
    minHeight?: number
  }
  /** Data binding configuration */
  dataBinding: {
    /** data sourceID */
    sourceId: string
    /** Data transformation pipeline */
    transform?: IDataTransform[]
  }
  /** Component property configuration */
  properties: Record<string, any>
  /** Basic settings */
  basicSettings?: {
    showTitle?: boolean
    title?: string
  }
}

// data conversion interface
export interface IDataTransform {
  /** conversion type */
  type: 'filter' | 'aggregate' | 'map' | 'sort' | 'limit'
  /** Conversion parameters */
  params: Record<string, any>
}

// Renderer type
export type RendererType = 'dom' | 'canvas' | 'webgl' | 'svg'

// Component life cycle status
export type ComponentLifecycleState = 'init' | 'mounted' | 'updated' | 'destroyed'

// Data source configuration
export interface IDataSource {
  /** data sourceID */
  id: string
  /** Data source type */
  type: 'api' | 'websocket' | 'mock' | 'static'
  /** Data source configuration */
  config: Record<string, any>
  /** Cache configuration */
  cache?: {
    enabled: boolean
    ttl?: number // Cache time(Second)
  }
}

// Component metadata
export interface IComponentMeta {
  /** componentsID */
  id: string
  /** Component name */
  name: string
  /** Component type */
  type: string
  /** Component version */
  version: string
  /** Supported renderers */
  supportedRenderers: RendererType[]
  /** Component description */
  description?: string
  /** component icon */
  icon?: string
  /** Component preview */
  poster?: string
  /** Default properties */
  defaultProps?: Record<string, any>
  /** Property configuration form */
  configSchema?: any
}

// Component instance interface
export interface IComponentInstance {
  /** componentsID */
  id: string
  /** Component metadata */
  meta: IComponentMeta
  /** data node */
  dataNode: IDataNode
  /** life cycle status */
  state: ComponentLifecycleState
  /** initialization */
  init(): Promise<void>
  /** Update data */
  updateData(data: any): void
  /** Update properties */
  updateProps(props: Record<string, any>): void
  /** destroy */
  destroy(): void
}

// event type
export interface IComponentEvent {
  /** event type */
  type: string
  /** event data */
  data?: any
  /** event source componentID */
  sourceId: string
  /** Timestamp */
  timestamp: number
}

// Component communication interface
export interface IComponentCommunication {
  /** Send event */
  emit(event: IComponentEvent): void
  /** Listen for events */
  on(eventType: string, handler: (event: IComponentEvent) => void): void
  /** Cancel monitoring */
  off(eventType: string, handler?: (event: IComponentEvent) => void): void
}
