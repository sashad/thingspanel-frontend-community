/**
 * Global preview mode status management
 * Used to control the preview state of the visual editor，Affects the interactive behavior of all renderers
 */
import { ref, computed, readonly } from 'vue'

// Global preview mode status
const isPreviewMode = ref(false)

/**
 * Visual editor preview mode management hook
 */
export function usePreviewMode() {
  // Set preview mode
  const setPreviewMode = (preview: boolean) => {
    const oldValue = isPreviewMode.value
    isPreviewMode.value = preview
    // 🔥 If you switch from preview mode to edit mode，May need to reinitialize the system
    if (oldValue === true && preview === false) {
    }
  }

  // Switch preview mode
  const togglePreviewMode = () => {
    setPreviewMode(!isPreviewMode.value)
    return isPreviewMode.value
  }

  // Edit mode status（Preview mode reverse）
  const isEditMode = computed(() => !isPreviewMode.value)

  // Renderer configuration computed properties
  const rendererConfig = computed(() => ({
    // Whether to read-only mode
    readonly: isPreviewMode.value,
    // Whether to display the grid
    showGrid: !isPreviewMode.value,
    // Whether it can be dragged
    draggable: !isPreviewMode.value,
    // Is it resizable?
    resizable: !isPreviewMode.value,
    // Whether to display the selection box
    showSelection: !isPreviewMode.value,
    // Whether to show the control handle
    showHandles: !isPreviewMode.value,
    // Whether static mesh（GridStack）
    staticGrid: isPreviewMode.value
  }))

  return {
    // state
    isPreviewMode: readonly(isPreviewMode),
    isEditMode,

    // method
    setPreviewMode,
    togglePreviewMode,

    // Configuration
    rendererConfig
  }
}

// Export global instance，Ensure status is synchronized
export const globalPreviewMode = usePreviewMode()
