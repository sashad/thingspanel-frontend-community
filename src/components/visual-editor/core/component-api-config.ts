// src/components/visual-editor/core/component-api-config.ts

/**
 * @file Components and EquipmentAPIautomated configuration system
 * @description According to component type，Automatically select and configure the most appropriate data sourceAPI。
 */

// Defines the components supportedAPIConfiguration
interface ComponentApiConfig {
  apiType: string // mainAPItype
  fallbackApiType?: string // spareAPItype
  dataSourceType: 'device' // Data source type
  requiresPolling: boolean // Whether polling is needed
  isControlComponent: boolean // Whether it is a control component
  description: string // Function description
  supportedMetricsTypes: ('telemetry' | 'attributes' | 'command')[] // Supported indicator types
  defaultParameters?: Record<string, any> // defaultAPIparameter
}

// Stores all componentsAPIConfiguration
const componentApiRegistry: Record<string, ComponentApiConfig> = {
  'digit-indicator': {
    apiType: 'telemetryDataCurrentKeys',
    fallbackApiType: 'getAttributeDatasKey',
    dataSourceType: 'device',
    requiresPolling: true,
    isControlComponent: false,
    description: 'digital indicator，Display the current value of the device（telemetry or properties）',
    supportedMetricsTypes: ['telemetry', 'attributes']
  },
  curve: {
    apiType: 'telemetryDataHistoryList',
    dataSourceType: 'device',
    requiresPolling: false,
    isControlComponent: false,
    description: 'Graph，Display historical telemetry data for a device',
    supportedMetricsTypes: ['telemetry'],
    defaultParameters: {
      time_range: 'last_1h',
      aggregate_function: 'avg',
      aggregate_window: '1m'
    }
  },
  'digit-setter': {
    apiType: 'telemetryDataPub',
    fallbackApiType: 'attributeDataPub',
    dataSourceType: 'device',
    requiresPolling: false,
    isControlComponent: true,
    description: 'digital setter，Used to send telemetry or property data to a device',
    supportedMetricsTypes: ['telemetry', 'attributes']
  }
  // Configuration of more components can be added here
}

/**
 * Get the component based on its typeAPIConfiguration
 * @param componentType The component's unique type identifier
 * @returns componentAPIConfiguration，Return if not foundnull
 */
export function getComponentApiConfig(componentType: string): ComponentApiConfig | null {
  const config = componentApiRegistry[componentType]
  if (!config) {
    return null
  }
  return config
}

/**
 * Based on component type and required metric type，Choose the most suitableAPI
 * @param componentType Component type
 * @param metricsType Indicator type ('telemetry', 'attributes', 'command')
 * @returns suitableAPItype string，Return if not supportednull
 */
export function selectApiForComponent(
  componentType: string,
  metricsType: 'telemetry' | 'attributes' | 'command'
): string | null {
  const config = getComponentApiConfig(componentType)

  if (!config) {
    return null // Component configuration does not exist
  }

  if (!config.supportedMetricsTypes.includes(metricsType)) {
    return null
  }

  // core selection logic
  switch (metricsType) {
    case 'telemetry':
      return config.apiType // Telemetry is usually the primaryAPI
    case 'attributes':
      return config.fallbackApiType || config.apiType // Properties are usually either backup or primaryAPI
    case 'command':
      // Command classAPIThe logic may be more complex，Simplified processing here
      if (config.isControlComponent) {
        return config.apiType
      }
      return null
    default:
      return null
  }
}
