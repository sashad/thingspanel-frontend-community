/**
 * Renderer unified export
 * All renderers should follow the same interface specification
 */

// CanvasRenderer (Current primary renderer)
export { CanvasRenderer } from '@/components/visual-editor/renderers/canvas'
// TODO: FabricCanvasRenderer has been deleted，Need to reimplement or remove relevant references
// export { FabricCanvasRenderer } from '@/components/visual-editor/renderers/canvas'

// GridStackRenderer
export { GridstackRenderer } from '@/components/visual-editor/renderers/gridstack'

// Renderer to be implemented
// export { KanbanRenderer } from '@/components/visual-editor/renderers/kanban'  // Kanban renderer (Second phase function)
// export { DashboardRenderer } from '@/components/visual-editor/renderers/dashboard'
// export { ReportRenderer } from '@/components/visual-editor/renderers/report'
// export { ThreeDRenderer } from '@/components/visual-editor/renderers/three-d'

/**
 * Renderer interface specification
 * All renderers must follow the following interface：
 *
 * Props:
 * - readonly?: boolean
 * - config?: object (Renderer specific configuration)
 *
 * Emits:
 * - ready: () => void
 * - error: (error: Error) => void
 * - node-select: (id: string) => void
 */
