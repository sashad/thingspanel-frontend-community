/**
 * Visual Editor Configure system entry file
 * Export all configuration related components、Types and tools
 */

// 🔄 core manager - Unified use of bridging systems to ensure data consistency
import { configurationIntegrationBridge as configurationManager } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import { ConfigurationManager } from '@/components/visual-editor/configuration/ConfigurationManager'
export { configurationManager, ConfigurationManager }

// type definition
export type {
  BaseConfiguration,
  ComponentConfiguration,
  InteractionConfiguration,
  WidgetConfiguration,
  InteractionConfig,
  ConfigFormProps,
  ConfigFormEmits,
  ValidationResult,
  IConfigurationManager,
  ConfigFormRegistration,
  ConfigurationPreset,
  ConfigurationGenerator,
  ConfigurationMigrator
} from './types'

// Configure panel components
export { default as ConfigurationPanel } from '@/components/visual-editor/configuration/ConfigurationPanel.vue'

// Configure form components - now fromrenderers/base目录导入
export { default as BaseConfigForm } from '@/components/visual-editor/renderers/base/BaseConfigForm.vue'
export { default as ComponentConfigForm } from '@/components/visual-editor/renderers/base/ComponentConfigForm.vue'

// Notice：InteractionConfigForm Temporarily remove，Focus on basic testing

// Hooks
export { useConfiguration, type UseConfigurationOptions } from '@/components/visual-editor/configuration/hooks/useConfiguration'

// Utility function
// 🔄 Utility function - Export via bridge system，ensure consistency
const createDefaultConfiguration = () => configurationManager.createDefaultConfiguration()
export { createDefaultConfiguration }

/**
 * Initialize configuration system
 * Register default presets and migrators
 */
export const initializeConfigurationSystem = () => {
  // Register default preset
  configurationManager.addPreset({
    name: 'default',
    description: 'Default configuration preset',
    config: {
      base: {
        showTitle: true,
        title: 'default title',
        opacity: 1,
        visible: true,
        customClassName: '',
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 }
      },
      component: {
        properties: {},
        styles: {},
        behavior: {},
        validation: { required: [], rules: {} }
      },
      dataSource: null,
      interaction: {}
    },
    category: 'system',
    isSystem: true
  })

  configurationManager.addPreset({
    name: 'minimal',
    description: 'Minimalist style preset',
    config: {
      base: {
        showTitle: false,
        title: 'Minimalist components',
        opacity: 1,
        visible: true,
        customClassName: 'minimal',
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        padding: { top: 8, right: 8, bottom: 8, left: 8 }
      },
      component: {
        properties: {},
        styles: { custom: 'border: none; box-shadow: none;' },
        behavior: {},
        validation: { required: [], rules: {} }
      },
      dataSource: null,
      interaction: {}
    },
    category: 'style',
    isSystem: true
  })

  configurationManager.addPreset({
    name: 'dashboard',
    description: 'Dashboard style presets',
    config: {
      base: {
        showTitle: true,
        title: 'Dashboard components',
        opacity: 1,
        visible: true,
        customClassName: 'dashboard-widget',
        margin: { top: 4, right: 4, bottom: 4, left: 4 },
        padding: { top: 12, right: 12, bottom: 12, left: 12 }
      },
      component: {
        properties: {},
        styles: {
          custom: 'background: var(--card-color); border-radius: 8px; box-shadow: var(--box-shadow);'
        },
        behavior: {},
        validation: { required: [], rules: {} }
      },
      dataSource: null,
      interaction: {}
    },
    category: 'dashboard',
    isSystem: true
  })

  // Register configuration migrator（For version upgrade）
  configurationManager.registerMigrator({
    fromVersion: '0.9.0',
    toVersion: '1.0.0',
    migrate: (oldConfig: any) => {
      // Example：Migrate from old version to new version
      return {
        base: {
          showTitle: oldConfig.showLabel || false,
          title: oldConfig.label || '',
          opacity: 1,
          visible: true,
          customClassName: '',
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        component: {
          properties: oldConfig.properties || {},
          styles: {},
          behavior: {},
          validation: { required: [], rules: {} }
        },
        dataSource: oldConfig.dataSource || null,
        interaction: oldConfig.interaction || {},
        metadata: {
          version: '1.0.0',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          description: 'Migrated from v0.9.0'
        }
      }
    }
  })
}

/**
 * Verify that the configuration system is working properly
 */
export const validateConfigurationSystem = (): boolean => {
  try {
    // Create test configuration
    const testConfig = createDefaultConfiguration()

    // Verify configuration
    const validationResult = configurationManager.validateConfiguration(testConfig)

    if (!validationResult.valid) {
      return false
    }

    // Test export and import
    const testId = 'test-widget-config'
    configurationManager.setConfiguration(testId, testConfig)

    const exported = configurationManager.exportConfiguration(testId)
    const imported = configurationManager.importConfiguration(testId + '-copy', exported)

    // Clean test data
    configurationManager.removeConfiguration(testId)
    configurationManager.removeConfiguration(testId + '-copy')

    if (!imported) {
      return false
    }
    return true
  } catch (error) {
    return false
  }
}

/**
 * Get configuration system statistics
 */
export const getConfigurationSystemStats = () => {
  const allConfigs = configurationManager.getAllConfigurations()
  const presets = configurationManager.getPresets()

  return {
    totalConfigurations: allConfigs.size,
    totalPresets: presets.length,
    systemPresets: presets.filter(p => p.isSystem).length,
    userPresets: presets.filter(p => !p.isSystem).length,
    configurationIds: Array.from(allConfigs.keys()),
    presetNames: presets.map(p => p.name)
  }
}

// Default export configuration manager instance
export default configurationManager
