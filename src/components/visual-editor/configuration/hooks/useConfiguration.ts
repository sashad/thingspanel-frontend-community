/**
 * Configure the system Hook
 * Provide convenient configuration management functions
 */

import { ref, computed, watch, onUnmounted } from 'vue'
import { configurationIntegrationBridge as configurationManager } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import type { WidgetConfiguration, ValidationResult } from '@/components/visual-editor/configuration/types'

export interface UseConfigurationOptions {
  /** componentsID */
  widgetId?: string
  /** Whether to automatically initialize */
  autoInit?: boolean
  /** Whether to enable auto-save */
  autoSave?: boolean
  /** Autosave delay(ms) */
  autoSaveDelay?: number
}

export function useConfiguration(options: UseConfigurationOptions = {}) {
  const { widgetId, autoInit = true, autoSave = true, autoSaveDelay = 300 } = options

  // state
  const currentWidgetId = ref<string | null>(widgetId || null)
  const configuration = ref<WidgetConfiguration | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const validationResult = ref<ValidationResult | null>(null)

  // Configure change listener cleanup function
  let configChangeCleanup: (() => void) | null = null

  // Auto save timer
  let autoSaveTimer: NodeJS.Timeout | null = null

  // Computed properties
  const hasConfiguration = computed(() => {
    return configuration.value !== null
  })

  const isValid = computed(() => {
    return validationResult.value?.valid !== false
  })

  // Initial configuration
  const initialize = async (targetWidgetId?: string) => {
    const id = targetWidgetId || currentWidgetId.value
    if (!id) return

    try {
      isLoading.value = true
      error.value = null

      // Clean up old listeners
      if (configChangeCleanup) {
        configChangeCleanup()
        configChangeCleanup = null
      }

      // Get or create configuration
      let config = configurationManager.getConfiguration(id)
      if (!config) {
        configurationManager.initializeConfiguration(id)
        config = configurationManager.getConfiguration(id)
      }

      configuration.value = config
      currentWidgetId.value = id

      // Set up configuration change monitoring
      configChangeCleanup = configurationManager.onConfigurationChange(id, newConfig => {
        configuration.value = newConfig
        validateConfiguration()
      })

      // Initial verification
      validateConfiguration()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Initialization failed'
    } finally {
      isLoading.value = false
    }
  }

  // Update configuration
  const updateConfiguration = <K extends keyof WidgetConfiguration>(section: K, config: WidgetConfiguration[K]) => {
    if (!currentWidgetId.value) {
      return
    }

    try {
      configurationManager.updateConfiguration(currentWidgetId.value, section, config)

      if (autoSave) {
        scheduleAutoSave()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Update failed'
    }
  }

  // Set up complete configuration
  const setConfiguration = (config: WidgetConfiguration) => {
    if (!currentWidgetId.value) {
      return
    }

    try {
      configurationManager.setConfiguration(currentWidgetId.value, config)

      if (autoSave) {
        scheduleAutoSave()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Setup failed'
    }
  }

  // Reset configuration
  const resetConfiguration = () => {
    if (!currentWidgetId.value) return

    try {
      configurationManager.resetConfiguration(currentWidgetId.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Reset failed'
    }
  }

  // Verify configuration
  const validateConfiguration = () => {
    if (!configuration.value) return

    try {
      const result = configurationManager.validateConfiguration(configuration.value)
      validationResult.value = result
      return result
    } catch (err) {
      return { valid: false, errors: [{ field: 'global', message: 'Authentication failed' }] }
    }
  }

  // Export configuration
  const exportConfiguration = (): string | null => {
    if (!currentWidgetId.value) return null

    try {
      return configurationManager.exportConfiguration(currentWidgetId.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Export failed'
      return null
    }
  }

  // Import configuration
  const importConfiguration = (configData: string): boolean => {
    if (!currentWidgetId.value) return false

    try {
      const success = configurationManager.importConfiguration(currentWidgetId.value, configData)
      if (!success) {
        error.value = 'Invalid configuration format'
      }
      return success
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Import failed'
      return false
    }
  }

  // Apply preset
  const applyPreset = (presetName: string): boolean => {
    if (!currentWidgetId.value) return false

    try {
      const success = configurationManager.applyPreset(currentWidgetId.value, presetName)
      if (!success) {
        error.value = `Default ${presetName} does not exist`
      }
      return success
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Applying preset failed'
      return false
    }
  }

  // Get available presets
  const getAvailablePresets = (componentType?: string) => {
    return configurationManager.getPresets(componentType)
  }

  // Plan auto-save
  const scheduleAutoSave = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }

    autoSaveTimer = setTimeout(() => {
      if (currentWidgetId.value && configuration.value) {
        // Here you can add the actual saving logic，For example, save to the server
      }
    }, autoSaveDelay)
  }

  // Switch components
  const switchWidget = (newWidgetId: string) => {
    if (newWidgetId !== currentWidgetId.value) {
      initialize(newWidgetId)
    }
  }

  // Clean up resources
  const cleanup = () => {
    if (configChangeCleanup) {
      configChangeCleanup()
      configChangeCleanup = null
    }

    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  // monitor widgetId change
  watch(
    () => currentWidgetId.value,
    (newId, oldId) => {
      if (newId && newId !== oldId) {
        initialize(newId)
      }
    },
    { immediate: autoInit }
  )

  // clean up
  onUnmounted(() => {
    cleanup()
  })

  return {
    // state
    currentWidgetId,
    configuration,
    isLoading,
    error,
    validationResult,

    // Computed properties
    hasConfiguration,
    isValid,

    // method
    initialize,
    updateConfiguration,
    setConfiguration,
    resetConfiguration,
    validateConfiguration,
    exportConfiguration,
    importConfiguration,
    applyPreset,
    getAvailablePresets,
    switchWidget,
    cleanup
  }
}

export default useConfiguration
