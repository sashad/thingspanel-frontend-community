import { defineStore } from 'pinia'
import { useEditorStore } from './editor'

// from old StateManager Migrated status
interface WidgetState {
  selectedIds: string[]
}

export const useWidgetStore = defineStore('widget', {
  state: (): WidgetState => ({
    selectedIds: []
  }),
  getters: {
    selectedNodes: state => {
      const editorStore = useEditorStore()
      return editorStore.nodes.filter(node => state.selectedIds.includes(node.id))
    }
  },
  actions: {
    // Select action
    selectNodes(ids: string[]) {
      this.selectedIds = [...ids]
    },
    clearSelection() {
      this.selectedIds = []
    },
    // when node is deleted，It is also necessary to update the selected status
    removeNodeFromSelection(id: string) {
      this.selectedIds = this.selectedIds.filter(selectedId => selectedId !== id)
    },
    reset() {
      this.selectedIds = []
    }
  }
})
