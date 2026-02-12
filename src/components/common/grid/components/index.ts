/**
 * Grid Component module export
 * Export all split grid components uniformly
 */

export { default as GridCore } from './GridCore.vue'
export { default as GridItemContent } from './GridItemContent.vue'
export { default as GridDropZone } from './GridDropZone.vue'

// Component information
export const GRID_COMPONENTS_VERSION = '1.0.0'
export const GRID_COMPONENTS_INFO = {
  version: GRID_COMPONENTS_VERSION,
  description: 'Modular grid layout component system',
  components: ['GridCore - Grid Core Logic Components', 'GridItemContent - Grid item content rendering component', 'GridDropZone - Drag area processing component']
}
