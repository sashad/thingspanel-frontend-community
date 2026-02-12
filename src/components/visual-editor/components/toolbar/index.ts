// Visual editor toolbar component entry file

export { default as VisualEditorToolbar } from '@/components/visual-editor/components/toolbar/VisualEditorToolbar.vue'
export { default as CommonToolbar } from '@/components/visual-editor/components/toolbar/CommonToolbar.vue'

// Toolbar related type definitions
export interface RendererOption {
  value: string
  label: string
  icon?: string
}

export interface ToolbarConfig {
  showModeSwitch?: boolean
  showRendererSelect?: boolean
  showViewControls?: boolean
  showPanelControls?: boolean
  readonly?: boolean
}

export interface ToolbarEmits {
  'mode-change': [mode: 'edit' | 'preview']
  'renderer-change': [rendererId: string]
  save: []
  undo: []
  redo: []
  reset: []
  'clear-all': []
  'zoom-in': []
  'zoom-out': []
  'reset-zoom': []
  'fit-content': []
  'center-view': []
  'toggle-left-panel': []
  'toggle-right-panel': []
}
