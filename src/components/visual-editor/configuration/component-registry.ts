/**
 * Component configuration display logic - final accurate version
 * onlytestunder the directory3The configuration panel is displayed only after testing the component
 */

import type { Component } from 'vue'

// Import configuration components at each level - Use dynamic imports to avoid circular dependencies
import { defineAsyncComponent } from 'vue'

// Import Configuration Manager to check component data source requirements
import { configurationIntegrationBridge as configurationManager } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
// 🔥 Migrated：Component data requirements using Core Data architecture
import type { ComponentDataRequirement } from '@/core/data-architecture/types/simple-types'

// Dynamically import components to avoid circular dependency issues
const BaseConfigForm = defineAsyncComponent(() => import('@/components/visual-editor/renderers/base/BaseConfigForm.vue'))
const ComponentConfigForm = defineAsyncComponent(() => import('@/components/visual-editor/renderers/base/ComponentConfigForm.vue'))
const InteractionConfigWrapper = defineAsyncComponent(
  () => import('@/components/visual-editor/configuration/InteractionConfigWrapper.vue')
)
const SimpleConfigurationEditor = defineAsyncComponent(
  () => import('@/core/data-architecture/components/SimpleConfigurationEditor.vue')
)

export interface ConfigLayerDefinition {
  name: string
  label: string
  component: Component
  visible: boolean
  order: number
  description?: string
}

/**
 * Precise control over component configuration display logic
 * only4Everyone hassettingConfig.tsThe configuration panel is displayed only for the component
 */
const shouldShowComponentConfig = (componentId: string, widget?: any): boolean => {
  try {
    if (process.env.NODE_ENV === 'development') {
    }

    // examineCard2.1Does the component haveconfigComponent
    if (widget?.metadata?.card2Definition) {
      const hasConfigComponent = !!widget.metadata.card2Definition.configComponent
      

      return hasConfigComponent
    }

    // For traditional components，Return temporarilyfalse（Can be expanded as needed）
    if (process.env.NODE_ENV === 'development') {
    }
    return false
  } catch (error) {
    console.error(`❌ [ComponentRegistry] Configuration check error`, { componentId, error })
    return false
  }
}

/**
 * 🎯 Interactive configuration display check function
 * Only components that declare interactive capabilities display interaction configurations
 */
const shouldShowInteractionConfig = (componentId: string, widget?: any): boolean => {
  try {

    // examineCard2.1Component’s interactivity declaration
    if (widget?.metadata?.card2Definition) {
      const card2Definition = widget.metadata.card2Definition
      const hasInteractionCapabilities = !!(
        card2Definition.interactionCapabilities &&
        (card2Definition.interactionCapabilities.supportedEvents?.length > 0 ||
         card2Definition.interactionCapabilities.availableActions?.length > 0)
      )


      return hasInteractionCapabilities
    }

    // For traditional components，Return temporarilyfalse
    return false
  } catch (error) {
    console.error(`❌ [ComponentRegistry] Error in interactive configuration check`, { componentId, error })
    return false
  }
}

/**
 * The final accurate data source configuration shows the check function
 * 🔥 repair：Priority checkCard2.1Component definition，Avoid being filtered by hard-coded lists
 */
const shouldShowDataSourceConfig = (componentId: string, widget?: any): boolean => {
  try {
    
    if (process.env.NODE_ENV === 'development') {
    }

    // 🔥 first priority：examineCard2.1Component data source definition
    if (widget?.metadata?.card2Definition) {
      const card2Definition = widget.metadata.card2Definition
      const hasDataNeeds = !!(
        card2Definition.dataRequirements?.dataFields?.length > 0 ||
        card2Definition.dataRequirements?.primaryData ||
        card2Definition.dataSources?.length > 0
      )


      if (hasDataNeeds) {
        return true // Card2.1The component has a data source definition，Show now
      }
    }

    // second priority：Hard-coded judgments on traditional components
    if (widget?.type) {
      // Traditional components that explicitly require data sources
      const dataSourceComponents = [
        'dual-data-display', // need2data sources
        'triple-data-display' // need3data sources
      ]

      if (dataSourceComponents.includes(widget.type)) {
        return true
      }

      // Explicitly specify components that do not require a data source
      const noDataSourceComponents = [
        'simple-display', // Static display component
        'access-num', // Statistics component
        'alarm-info', // Statistics component
        'alarm-count' // Statistics component
      ]

      if (noDataSourceComponents.includes(widget.type)) {
        return false
      }
    }

    // Data source configuration is not displayed by default
    return false
  } catch (error) {
    console.error(`❌ [ComponentRegistry] Data source configuration check error`, { componentId, error })
    return false
  }
}

/**
 * Configure hierarchical registry
 */
export const configLayerRegistry: Record<string, ConfigLayerDefinition> = {
  base: {
    name: 'base',
    label: 'config.tabs.base',
    component: BaseConfigForm,
    visible: true,
    order: 1,
    description: 'Node basic attribute configuration（title、style、Layout etc.）'
  },
  component: {
    name: 'component',
    label: 'config.tabs.component',
    component: ComponentConfigForm,
    visible: true,
    order: 2,
    description: 'Component specific configuration（onlytestComponent display）'
  },
  dataSource: {
    name: 'dataSource',
    label: 'config.tabs.dataSource',
    component: SimpleConfigurationEditor,
    visible: true,
    order: 3,
    description: 'Data source configuration（Only multiple data sourcestestComponent display）'
  },
  interaction: {
    name: 'interaction',
    label: 'config.tabs.interaction',
    component: InteractionConfigWrapper,
    visible: true,
    order: 4,
    description: 'Component interaction configuration（Card-style simple interface，Click、Hover and other interactive effects）'
  }
}

/**
 * The final accurate configuration level acquisition function
 */
export const getVisibleConfigLayers = (componentId?: string, widget?: any): ConfigLayerDefinition[] => {
  let layers = Object.values(configLayerRegistry).filter(layer => layer.visible)

  if (process.env.NODE_ENV === 'development') {
  }

  if (componentId) {
    layers = layers.filter(layer => {
      if (layer.name === 'dataSource') {
        const shouldShow = shouldShowDataSourceConfig(componentId, widget)
        if (process.env.NODE_ENV === 'development') {
        }
        return shouldShow
      }
      if (layer.name === 'component') {
        const shouldShow = shouldShowComponentConfig(componentId, widget)
        if (process.env.NODE_ENV === 'development') {
        }
        return shouldShow
      }
      if (layer.name === 'interaction') {
        const shouldShow = shouldShowInteractionConfig(componentId, widget)
        return shouldShow
      }
      return true
    })
  }

  if (process.env.NODE_ENV === 'development') {
  }

  return layers.sort((a, b) => a.order - b.order)
}

export const getConfigLayer = (layerName: string): ConfigLayerDefinition | undefined => {
  return configLayerRegistry[layerName]
}

/**
 * 🔥 Manually refresh component definitions
 * This function is called when the configuration panel is opened to ensure that the component definition is up to date
 */
export const refreshComponentDefinitions = async (widget?: any): Promise<boolean> => {
  try {
    if (!widget?.metadata?.card2Definition?.configComponent && widget?.type) {
      
      // Try to get component definition from global
      const getComponentDefinition = async (type: string) => {
        try {
          // Dynamic imports to avoid circular dependencies
          const { getComponentDefinition: getDef } = await import('@/card2.1/components/index')
          return await getDef(type)
        } catch (error) {
          console.error(`❌ [refreshComponentDefinitions] Failed to import component definition function:`, error)
          return undefined
        }
      }
      
      const definition = await getComponentDefinition(widget.type)
      if (definition?.configComponent) {
        // renewwidgetofmetadata（This requiresPanelEditorV2integrated）
        return true
      }
    }
    return false
  } catch (error) {
    console.error('❌ [refreshComponentDefinitions] Refresh failed:', error)
    return false
  }
}
