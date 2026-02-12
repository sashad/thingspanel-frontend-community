/**
 * Script Engine Component library entry
 * Export all available Script Editor components
 */

export { default as ScriptEditor } from '@/core/script-engine/components/ScriptEditor.vue'
export { default as ScriptExecutionResultPanel } from '@/core/script-engine/components/ScriptExecutionResultPanel.vue'
export { default as SimpleScriptEditor } from '@/core/script-engine/components/SimpleScriptEditor.vue'

// Component type export
export type { ScriptEditorProps, ScriptEditorEmits } from '@/core/script-engine/components/ScriptEditor.vue'

// Re-export script-engine type
export type {
  ScriptExecutionResult,
  ScriptTemplate,
  ScriptConfig,
  ScriptExecutionContext,
  TemplateCategory,
  ScriptLog
} from '../types'
