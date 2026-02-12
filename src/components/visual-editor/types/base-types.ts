/**
 * Basic type definition - Unified Data Node Protocol
 */

// location information
export interface Position {
  x: number
  y: number
}

// size information
export interface Size {
  width: number
  height: number
}

// Unified Data Node Protocol
export interface GraphData<TConfig = any, TItem = any> {
  id: string
  type: string
  x: number
  y: number
  width: number // CanvasPixel width
  height: number // CanvasPixel height
  properties: TConfig
  renderer: string[] // Adapted renderer

  // Layout properties for different renderers
  layout?: {
    canvas?: {
      width: number // Pixel
      height: number // Pixel
    }
    gridstack?: {
      w: number // grid width unit
      h: number // grid height unit
    }
    kanban?: {
      // Kanban-specific layout properties
    }
  }

  dataBinding?: {
    sourceId: string
    transform: TransformOperation[]
  }
  metadata: {
    createdAt: number
    updatedAt: number
    version: string
  }
}

// Data conversion operations
export interface TransformOperation {
  type: 'filter' | 'aggregate' | 'sort' | 'map'
  [key: string]: any
}

// Canvas state
export interface CanvasState {
  nodes: GraphData[]
  selectedIds: string[]
  viewport: {
    zoom: number
    offsetX: number
    offsetY: number
  }
  mode: 'edit' | 'preview'
}
