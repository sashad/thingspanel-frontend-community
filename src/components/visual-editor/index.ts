/**
 * Visual Editor - foreignAPIEntrance
 * New unified architecture portal
 */

// Main component export
export { default as PanelEditor } from '@/components/visual-editor/PanelEditor.vue'

// new architectureHookExport - replace olduseEditorandcreateEditor
export { useVisualEditor } from '@/store/modules/visual-editor'

// Type export
export type {
  EditorConfig,
  RendererType,
  KanbanConfig,
  DashboardConfig,
  GraphData,
  WidgetType,
  // Card 2.0 Related types
  IComponentDefinition,
  IComponentInstance,
  IComponentMeta
} from './types'
