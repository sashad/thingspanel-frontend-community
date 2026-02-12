/**
 * Unified export of type definitions
 */

// base type
export type { GraphData, Position, Size, CanvasState, TransformOperation } from '@/components/visual-editor/types/base-types'

// Editor type
export type { EditorConfig, KanbanConfig, DashboardConfig } from '@/components/visual-editor/types/editor'

// Renderer type
export type { RendererType, IRenderer, RendererConfig } from '@/components/visual-editor/types/renderer'

// Component type
export type { WidgetType, WidgetConfig } from '@/components/visual-editor/types/widget'

// Plug-in type
export type { IPlugin, PluginConfig } from '@/components/visual-editor/types/plugin'
