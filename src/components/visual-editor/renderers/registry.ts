/**
 * Renderer registry
 * Responsible for registering all available renderers to RendererManager
 */

import { rendererManager } from '@/components/visual-editor/renderers/base/RendererManager'
// TODO: reimplement CanvasRendererFactory
// import { canvasRendererFactory } from '@/components/visual-editor/renderers/canvas/CanvasRendererFactory'

/**
 * Register all renderers
 * This function should be called when the application starts
 */
export function registerAllRenderers(): void {

  try {
    // TODO: Comment out for now Canvas Renderer registration，Until the factory is reimplemented
    // register Canvas Renderer
    // rendererManager.register('canvas', canvasRendererFactory, {
    //   name: 'Canvas Renderer',
    //   description: 'based on Fabric.js free canvas renderer，Support drag and drop、Zoom、Advanced interactions such as rotation',
    //   icon: 'i-material-symbols-grid-view-outline'
    // })

    // 

    // TODO: Register additional renderers
    // register GridStack Renderer
    // rendererManager.register('gridstack', gridstackRendererFactory, {
    //   name: 'GridStack Renderer',
    //   description: 'Grid-based responsive layout renderer',
    //   icon: 'i-material-symbols-grid-on-outline'
    // })

    const stats = rendererManager.getPerformanceStats()

  } catch (error) {
    console.error('❌ [RendererRegistry] Renderer registration failed:', error)
    throw error
  }
}

/**
 * Get a list of available renderers
 */
export function getAvailableRenderers() {
  return rendererManager.getSupportedRendererOptions()
}

/**
 * Check if a specific renderer is available
 */
export function isRendererAvailable(type: string): boolean {
  return rendererManager.isSupported(type)
}

/**
 * Get renderer registration statistics
 */
export function getRegistryStats() {
  return rendererManager.getPerformanceStats()
}

/**
 * Clean up all renderer instances
 */
export async function cleanupAllRenderers(): Promise<void> {
  try {
    await rendererManager.destroyAllRenderers()
  } catch (error) {
    console.error('❌ [RendererRegistry] Cleaning up renderer instance failed:', error)
    throw error
  }
}

// Export renderer manager instance（for advanced usage）
export { rendererManager }

export default {
  registerAllRenderers,
  getAvailableRenderers,
  isRendererAvailable,
  getRegistryStats,
  cleanupAllRenderers,
  rendererManager
}