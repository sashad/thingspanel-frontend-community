/**
 * New configuration management system test script
 * verifyConfigurationStateManagerandConfigurationIntegrationBridgework effect
 *
 * test scenario：
 * 1. Simulate the scenario of adding a second data item（Would have resulted in an infinite loop）
 * 2. Verify content hash deduplication mechanism
 * 3. Verification loop detection mechanism
 * 4. Verify configuration version control
 */

import { configurationStateManager } from '@/components/visual-editor/configuration/ConfigurationStateManager'
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import type { WidgetConfiguration } from '@/components/visual-editor/configuration/types'

/**
 * Test configuration content hash deduplication mechanism
 */
async function testContentHashDeduplication() {
  const testComponentId = 'test-component-hash'

  // Initialize component configuration
  configurationStateManager.initializeConfiguration(testComponentId)

  const testConfig: WidgetConfiguration = {
    base: { showTitle: true, title: 'Test Component' },
    component: { type: 'test' },
    dataSource: {
      componentId: testComponentId,
      dataSources: [
        {
          sourceId: 'dataSource1',
          dataItems: [
            {
              item: { type: 'json', config: { jsonString: '{"test": "data1"}' } },
              processing: { filterPath: '$' }
            }
          ],
          mergeStrategy: { type: 'object' }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    interaction: {},
    metadata: {
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  // Setting up configuration for the first time
  const result1 = configurationStateManager.setConfiguration(testComponentId, testConfig, 'user')

  // Set the same configuration for the second time（should be deduplicated）
  const result2 = configurationStateManager.setConfiguration(testComponentId, testConfig, 'user')

  // Set up a slightly different configuration the third time
  const modifiedConfig = {
    ...testConfig,
    base: { ...testConfig.base, title: 'Modified Test Component' }
  }
  const result3 = configurationStateManager.setConfiguration(testComponentId, modifiedConfig, 'user')

  // Get configuration version information
  const version = configurationStateManager.getConfigurationVersion(testComponentId)
}

/**
 * Test loop detection for section-by-section update of configuration
 */
async function testSectionUpdateCircularDetection() {
  const testComponentId = 'test-component-circular'

  // Initialize component configuration
  configurationStateManager.initializeConfiguration(testComponentId)

  const dataSourceConfig = {
    componentId: testComponentId,
    dataSources: [
      {
        sourceId: 'dataSource1',
        dataItems: [
          {
            item: { type: 'json', config: { jsonString: '{"test": "data1"}' } },
            processing: { filterPath: '$' }
          }
        ],
        mergeStrategy: { type: 'object' }
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  const result1 = configurationStateManager.updateConfigurationSection(
    testComponentId,
    'dataSource',
    dataSourceConfig,
    'user'
  )
  const result2 = configurationStateManager.updateConfigurationSection(
    testComponentId,
    'dataSource',
    dataSourceConfig,
    'user'
  )

  // Simulate rapid continuous updates（Test loop detection）
  setTimeout(() => {
    const result3 = configurationStateManager.updateConfigurationSection(
      testComponentId,
      'dataSource',
      dataSourceConfig,
      'user'
    )
  }, 0)

  setTimeout(() => {
    const result4 = configurationStateManager.updateConfigurationSection(
      testComponentId,
      'dataSource',
      dataSourceConfig,
      'user'
    )
  }, 0)
}

/**
 * Test the scenario of adding a second data item（Original problem scenario）
 */
async function testAddSecondDataItemScenario() {
  const testComponentId = 'test-component-second-item'

  // Initialize component configuration
  configurationStateManager.initializeConfiguration(testComponentId)

  // Simulate the first data item
  const firstItemConfig = {
    componentId: testComponentId,
    dataSources: [
      {
        sourceId: 'dataSource1',
        dataItems: [
          {
            item: { type: 'json', config: { jsonString: '{"test": "data1"}' } },
            processing: { filterPath: '$' }
          }
        ],
        mergeStrategy: { type: 'object' }
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  if (process.env.NODE_ENV === 'development') {
  }
  const result1 = configurationStateManager.updateConfigurationSection(
    testComponentId,
    'dataSource',
    firstItemConfig,
    'user'
  )
  if (process.env.NODE_ENV === 'development') {
  }

  // Waiting for anti-shake processing
  await new Promise(resolve => setTimeout(resolve, 100))

  // Simulate the second data item（This is the scenario that originally resulted in an infinite loop）
  const secondItemConfig = {
    componentId: testComponentId,
    dataSources: [
      {
        sourceId: 'dataSource1',
        dataItems: [
          {
            item: { type: 'json', config: { jsonString: '{"test": "data1"}' } },
            processing: { filterPath: '$' }
          },
          {
            item: { type: 'json', config: { jsonString: '{"test": "data2"}' } },
            processing: { filterPath: '$' }
          }
        ],
        mergeStrategy: { type: 'object' } // This will trigger the display of the merge strategy selector
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  if (process.env.NODE_ENV === 'development') {
  }
  const result2 = configurationStateManager.updateConfigurationSection(
    testComponentId,
    'dataSource',
    secondItemConfig,
    'user'
  )
  if (process.env.NODE_ENV === 'development') {
  }

  // Waiting for anti-shake processing
  await new Promise(resolve => setTimeout(resolve, 100))

  // Simulate merge strategy updates
  const strategyUpdateConfig = {
    ...secondItemConfig,
    dataSources: [
      {
        ...secondItemConfig.dataSources[0],
        mergeStrategy: { type: 'select', selectedIndex: 0 }
      }
    ]
  }

  if (process.env.NODE_ENV === 'development') {
  }
  const result3 = configurationStateManager.updateConfigurationSection(
    testComponentId,
    'dataSource',
    strategyUpdateConfig,
    'user'
  )
  if (process.env.NODE_ENV === 'development') {
  }

  // Get final status
  const finalConfig = configurationStateManager.getConfiguration(testComponentId)
  const finalVersion = configurationStateManager.getConfigurationVersion(testComponentId)

  if (process.env.NODE_ENV === 'development') {
  }
}

/**
 * Test Configuring Integrated Bridge Compatibility
 */
async function testIntegrationBridgeCompatibility() {
  if (process.env.NODE_ENV === 'development') {
  }

  // Initialize the bridge
  await configurationIntegrationBridge.initialize()

  const testComponentId = 'test-component-bridge'

  // Test initialization configuration
  if (process.env.NODE_ENV === 'development') {
  }
  configurationIntegrationBridge.initializeConfiguration(testComponentId)

  // Test to get configuration
  const config = configurationIntegrationBridge.getConfiguration(testComponentId)
  if (process.env.NODE_ENV === 'development') {
  }

  // Test updated configuration
  const updateConfig = {
    componentId: testComponentId,
    dataSources: [
      {
        sourceId: 'dataSource1',
        dataItems: [
          {
            item: { type: 'json', config: { jsonString: '{"bridge": "test"}' } },
            processing: { filterPath: '$' }
          }
        ],
        mergeStrategy: { type: 'object' }
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  if (process.env.NODE_ENV === 'development') {
  }
  configurationIntegrationBridge.updateConfiguration(testComponentId, 'dataSource', updateConfig)

  // Waiting for processing
  await new Promise(resolve => setTimeout(resolve, 100))

  const updatedConfig = configurationIntegrationBridge.getConfiguration(testComponentId)
  if (process.env.NODE_ENV === 'development') {
  }
}

/**
 * Main test function
 */
export async function runNewConfigSystemTests() {

  try {
    await testContentHashDeduplication()
    await testSectionUpdateCircularDetection()
    await testAddSecondDataItemScenario()
    await testIntegrationBridgeCompatibility()

    if (process.env.NODE_ENV === 'development') {
    }
    if (process.env.NODE_ENV === 'development') {
    }
  } catch (error) {
    console.error('❌ An error occurred during testing:', error)
  }
}

// Expose test functions in a browser environment
if (typeof window !== 'undefined') {
  ;(window as any).testNewConfigSystem = runNewConfigSystemTests
  if (process.env.NODE_ENV === 'development') {
  }
}
