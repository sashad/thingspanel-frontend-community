/**
 * @file types.ts
 * @description Visual Editor type definition
 */

import type { GraphData } from '@antv/x6'
import type { DataSource } from '@/components/visual-editor/types/data-source'

// 1. Define our own renderer type
export type RendererType = 'canvas' | 'gridstack' | 'vue' | 'react' | 'angular' | 'svelte' | 'webgl'

// 2. Define component type
export type WidgetType = string

// 3. definition VisualEditorWidget type，Expand GraphData
export interface VisualEditorWidget extends Omit<GraphData, 'dataSource'> {
  dataSource?: DataSource | null // Add data source support
}

// Component meta information
export interface WidgetMeta {
  type: WidgetType
  name: string
  description: string
  icon: string
  category: string
  version: string
  source: 'builtin' | 'card2' | 'plugin'
}

// Component definition
export interface WidgetDefinition extends WidgetMeta {
  defaultLayout: {
    canvas: {
      width: number
      height: number
    }
    gridstack: {
      w: number
      h: number
    }
  }
  defaultProperties: Record<string, any>
  metadata?: {
    isCard2Component?: boolean
    card2ComponentId?: string
    card2Definition?: any
  }
}
