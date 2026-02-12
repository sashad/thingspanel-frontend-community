/**
 * Panel editor configuration management combined functions
 * Responsible for configuration analysis、verify、Migration and default configuration generation
 */

import type { RendererType } from '@/components/visual-editor/types'

/**
 * Configuration management related function collection
 */
export function usePanelConfigManager() {
  /**
   * Parse configuration string
   * Supports compatibility processing of old and new formats
   */
  const parseConfig = (configString: string) => {
    try {
      const config = JSON.parse(configString)

      // Check if it is the new format
      if (typeof config === 'object' && config.visualEditor) {
        // Verify configuration format
        const validatedConfig = validateConfig(config)
        return validatedConfig
      }

      // 🔥 repair：Direct format compatible {widgets: [...], config: {...}}
      if (config.widgets !== undefined || config.config !== undefined) {
        // direct format，Return directly
        return {
          legacyComponents: [],
          visualEditor: config // Use directly，No packaging
        }
      }

      // 🔥 Compatible with older array formats
      if (Array.isArray(config)) {
        return {
          legacyComponents: [],
          visualEditor: {
            widgets: config,
            config: { gridConfig: {}, canvasConfig: {} }
          }
        }
      }

      // unknown format，Use default configuration
      return {
        legacyComponents: [],
        visualEditor: getDefaultConfig()
      }
    } catch (error: any) {
      return {
        legacyComponents: [],
        visualEditor: getDefaultConfig()
      }
    }
  }

  /**
   * Verify configuration format
   * Ensure the completeness of configuration items and fill in missing items
   */
  const validateConfig = (config: any) => {
    const defaultConfig = getDefaultConfig()

    // make sure visualEditor exist
    if (!config.visualEditor) {
      config.visualEditor = defaultConfig
      return config
    }

    // Verify and add missing configuration items
    const visualEditor = config.visualEditor

    // Make sure basic configuration items exist
    if (!visualEditor.nodes) visualEditor.nodes = defaultConfig.nodes
    if (!visualEditor.canvasConfig) visualEditor.canvasConfig = defaultConfig.canvasConfig
    if (!visualEditor.gridConfig) visualEditor.gridConfig = defaultConfig.gridConfig
    if (!visualEditor.viewport) visualEditor.viewport = defaultConfig.viewport
    if (!visualEditor.currentRenderer) visualEditor.currentRenderer = defaultConfig.currentRenderer
    if (!visualEditor.showWidgetTitles) visualEditor.showWidgetTitles = defaultConfig.showWidgetTitles
    if (!visualEditor.showLeftDrawer) visualEditor.showLeftDrawer = defaultConfig.showLeftDrawer
    if (!visualEditor.showRightDrawer) visualEditor.showRightDrawer = defaultConfig.showRightDrawer

    // make sure legacyComponents exist
    if (!config.legacyComponents) {
      config.legacyComponents = []
    }

    // Perform configuration migration
    const migratedConfig = migrateConfig(config)

    return migratedConfig
  }

  /**
   * Configure migration function
   * Handle configuration format upgrades between different versions
   */
  const migrateConfig = (config: any) => {
    const visualEditor = config.visualEditor

    // Check version and perform migration
    const version = visualEditor.metadata?.version || '0.0.0'

    // from v0.x Migrate to v1.0
    if (version.startsWith('0.')) {
      // Add missing configuration items
      if (!visualEditor.currentRenderer) {
        visualEditor.currentRenderer = 'gridstack'
      }
      if (!visualEditor.showWidgetTitles) {
        visualEditor.showWidgetTitles = true
      }
      if (!visualEditor.showLeftDrawer) {
        visualEditor.showLeftDrawer = false
      }
      if (!visualEditor.showRightDrawer) {
        visualEditor.showRightDrawer = false
      }

      // Update version information
      if (!visualEditor.metadata) {
        visualEditor.metadata = {}
      }
      visualEditor.metadata.version = '1.0.0'
      visualEditor.metadata.migratedAt = Date.now()
    }

    return config
  }

  /**
   * Get default configuration
   * Generate the default configuration object of the editor
   */
  const getDefaultConfig = () => {
    const config = {
      nodes: [],
      canvasConfig: {
        width: 1200,
        height: 800,
        showGrid: true,
        backgroundColor: '#f5f5f5'
      },
      gridConfig: {
        colNum: 24,
        rowHeight: 80,
        // Default no spacing：from [10, 10] Adjust to [0, 0]
        margin: [0, 0],
        isDraggable: true,
        isResizable: true,
        staticGrid: false
      },
      viewport: {},
      // Default renderer type and editor state
      currentRenderer: 'gridstack' as RendererType,
      showWidgetTitles: true,
      showLeftDrawer: false,
      showRightDrawer: false,
      // New：Default editing state
      isEditing: false,
      selectedNodeId: '',
      isDragging: false,
      draggedComponent: null
    }

    // 🔥 debug：Analyze the clonability of configuration objects
    const cloneabilityIssues = analyzeCloneability(config)
    if (cloneabilityIssues.length > 0) {
    }

    return config
  }

  /**
   * 🔥 debug：analyzestructuredCloneSpecific reasons for failure
   * Check the clonability of an object，Identify attributes that cannot be structurally cloned
   */
  const analyzeCloneability = (obj: any, path = 'root'): string[] => {
    const issues: string[] = []

    if (obj === null || obj === undefined) return issues

    if (typeof obj === 'function') {
      issues.push(`${path}: function`)
      return issues
    }

    if (obj instanceof Error) {
      issues.push(`${path}: Error object`)
      return issues
    }

    if (typeof obj === 'object') {
      // Check if it isVueReactive objects
      if (obj.__v_isReactive || obj.__v_isReadonly || obj.__v_isRef) {
        issues.push(`${path}: Vue reactive object`)
        return issues
      }

      // Check the prototype chain
      if (obj.constructor !== Object && obj.constructor !== Array) {
        issues.push(`${path}: Custom class instance (${obj.constructor.name})`)
      }

      // Check properties recursively
      for (const [key, value] of Object.entries(obj)) {
        issues.push(...analyzeCloneability(value, `${path}.${key}`))
      }
    }

    return issues
  }

  return {
    // Configuration parsing and verification
    parseConfig,
    validateConfig,
    migrateConfig,
    getDefaultConfig,
    analyzeCloneability
  }
}
