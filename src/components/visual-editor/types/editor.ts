/**
 * Editor related type definitions
 */

import type { RendererType } from '@/components/visual-editor/types/renderer'

// Editor configuration
export interface EditorConfig {
  width: number
  height: number
  rendererType: RendererType
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
}

// Kanban configuration
export interface KanbanConfig extends EditorConfig {
  rendererType: 'kanban'
  columns: KanbanColumn[]
}

export interface KanbanColumn {
  id: string
  title: string
  cards: KanbanCard[]
}

export interface KanbanCard {
  id: string
  title: string
  content: string
}

// Large screen configuration
export interface DashboardConfig extends EditorConfig {
  rendererType: 'dashboard'
  backgroundColor: string
  backgroundImage?: string
}
