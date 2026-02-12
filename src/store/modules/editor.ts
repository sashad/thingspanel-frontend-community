import { defineStore } from 'pinia'
import type { GraphData, CanvasState } from '@/components/visual-editor/types/base-types'
import { useWidgetStore } from './widget'

// from old StateManager Migrated status
interface EditorState {
  nodes: GraphData[]
  viewport: {
    zoom: number
    offsetX: number
    offsetY: number
  }
  mode: 'edit' | 'preview'
}

export const useEditorStore = defineStore('editor', {
  state: (): EditorState => ({
    nodes: [],
    viewport: {
      zoom: 1,
      offsetX: 0,
      offsetY: 0
    },
    mode: 'edit'
  }),
  actions: {
    // Node operations
    addNode(node: GraphData) {
      const widgetStore = useWidgetStore()
      this.nodes.push(node)
      widgetStore.selectNodes([node.id])
    },
    removeNode(id: string) {
      const widgetStore = useWidgetStore()
      this.nodes = this.nodes.filter(node => node.id !== id)
      widgetStore.removeNodeFromSelection(id)
    },
    updateNode(id: string, updates: Partial<GraphData>) {
      const nodeIndex = this.nodes.findIndex(node => node.id === id)
      if (nodeIndex !== -1) {
        this.nodes[nodeIndex] = {
          ...this.nodes[nodeIndex],
          ...updates,
          metadata: {
            ...this.nodes[nodeIndex].metadata,
            updatedAt: Date.now()
          }
        }
      }
    },

    // Viewport operations
    updateViewport(updates: Partial<EditorState['viewport']>) {
      Object.assign(this.viewport, updates)
    },

    // Mode switching
    setMode(mode: 'edit' | 'preview') {
      this.mode = mode
    },

    // reset state
    reset() {
      this.nodes = []
      this.viewport = { zoom: 1, offsetX: 0, offsetY: 0 }
      this.mode = 'edit'
    }
  }
})
