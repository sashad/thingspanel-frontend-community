/**
 * SimpleDataBridge Usage example
 * Show how to use a simplified data bridge instead of a complexComponentExecutorManager
 */

import { simpleDataBridge, convertToSimpleDataRequirement } from '@/core/data-architecture/interfaces'

/**
 * Example1：Basic usage
 */
export function basicUsageExample() {
  // 1. Register data update callback
  const cleanup = simpleDataBridge.onDataUpdate((componentId, data) => {})

  // 2. Execution component data acquisition
  simpleDataBridge
    .executeComponent({
      componentId: 'test-component-1',
      dataSources: [
        {
          id: 'dataSource1',
          type: 'static',
          config: {
            data: { value: 123, label: 'test data' }
          }
        },
        {
          id: 'dataSource2',
          type: 'http',
          config: {
            url: 'https://api.example.com/data',
            method: 'GET',
            timeout: 5000
          }
        }
      ]
    })
    .then(result => {
      if (process.env.NODE_ENV === 'development') {
      }
    })
    .catch(error => {
      console.error('❌ Execution failed:', error)
    })

  // 3. Clean up resources
  setTimeout(() => {
    cleanup()
    if (process.env.NODE_ENV === 'development') {
    }
  }, 10000)
}

/**
 * Example2：Configuration transformation
 */
export function configConversionExample() {
  // The simulation comes fromConfigurationPanelcomplex configuration
  const complexConfig = {
    type: 'data-source-bindings',
    enabled: true,
    dataSourceBindings: {
      dataSource1: {
        rawData: '{"temperature": 25.5, "humidity": 60}'
      },
      dataSource2: {
        rawData: '[{"id": 1, "name": "equipmentA"}, {"id": 2, "name": "equipmentB"}]'
      }
    },
    metadata: {
      componentType: 'dual-data-display',
      updatedAt: Date.now()
    }
  }

  // Convert toSimpleDataBridgeFormat
  const requirement = convertToSimpleDataRequirement('test-component-2', complexConfig)

  if (requirement) {
    if (process.env.NODE_ENV === 'development') {
    }

    // Perform data acquisition using the transformed configuration
    simpleDataBridge.executeComponent(requirement).then(result => {
    })
  } else {
    if (process.env.NODE_ENV === 'development') {
    }
  }
}

/**
 * Example3：contrastSimpleDataBridge vs ComponentExecutorManager
 */
export function comparisonExample() {
  // Statistics comparison
  const stats = simpleDataBridge.getStats()
}

/**
 * Example4：actual replacementComponentExecutorManagersteps
 */
export function migrationExample() {
  // Simulate the migration process
  const legacyConfig = {
    config: {
      dataSourceBindings: {
        sensor1: { rawData: '{"temp": 23}' },
        sensor2: { rawData: '{"humidity": 45}' }
      }
    },
    metadata: { componentType: 'sensor-display' }
  }

  // Convert and execute
  const requirement = convertToSimpleDataRequirement('migrated-component', legacyConfig)
  if (requirement) {
    simpleDataBridge.executeComponent(requirement).then(result => {})
  }
}
