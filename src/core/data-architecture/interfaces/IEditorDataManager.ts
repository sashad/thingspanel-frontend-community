/**
 * Editor big data management interface
 * Responsible for managing the data of the entire editor：component tree、Canvas configuration、Global settings
 */

import type { VisualEditorWidget } from '@/components/visual-editor/types'

/**
 * Editor data structure
 */
export interface EditorData {
  /** Component tree data */
  widgets: VisualEditorWidget[]
  /** Canvas configuration */
  canvasConfig: {
    width: number
    height: number
    background?: string
    gridSize?: number
    snapToGrid?: boolean
  }
  /** Global settings */
  globalSettings: {
    showWidgetTitles: boolean
    renderer: 'canvas' | 'gridstack' | 'grid-layout-plus'
    [key: string]: any
  }
  /** metadata */
  metadata: {
    version: string
    createdAt: number
    updatedAt: number
    name?: string
    description?: string
  }
}

/**
 * Editor data change event
 */
export interface EditorDataChangeEvent {
  type: 'widget-add' | 'widget-remove' | 'widget-update' | 'canvas-update' | 'settings-update'
  widgetId?: string
  data?: any
  timestamp: number
}

/**
 * Editor big data manager interface
 * Responsibilities：
 * 1. Manage addition, deletion, modification and query of component tree
 * 2. Manage canvas configuration and global settings
 * 3. Provide data persistence（save/load）
 * 4. Issue data change event，but does not directly manipulate component configuration or runtime data
 */
export interface IEditorDataManager {
  /**
   * Get current editor data
   */
  getCurrentData(): EditorData

  /**
   * Load editor data
   */
  loadData(data: EditorData): Promise<void>

  /**
   * Save editor data
   */
  saveData(): Promise<EditorData>

  // --- Component tree management ---

  /**
   * Add component
   */
  addWidget(widget: VisualEditorWidget): void

  /**
   * Remove component
   */
  removeWidget(widgetId: string): void

  /**
   * Update component basic information（Location、size etc.，Does not include configuration）
   */
  updateWidget(widgetId: string, updates: Partial<VisualEditorWidget>): void

  /**
   * Get component
   */
  getWidget(widgetId: string): VisualEditorWidget | null

  /**
   * Get all components
   */
  getAllWidgets(): VisualEditorWidget[]

  // --- Canvas and global settings management ---

  /**
   * Update canvas configuration
   */
  updateCanvasConfig(config: Partial<EditorData['canvasConfig']>): void

  /**
   * Update global settings
   */
  updateGlobalSettings(settings: Partial<EditorData['globalSettings']>): void

  // --- event listening ---

  /**
   * Monitor data changes
   */
  onDataChange(listener: (event: EditorDataChangeEvent) => void): () => void

  /**
   * Clean up resources
   */
  destroy(): void
}
