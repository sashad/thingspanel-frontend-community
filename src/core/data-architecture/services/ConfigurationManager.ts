/**
 * ConfigurationManager - Simple configuration management service
 * Provide configuration verification、Template management、Storage function
 */

import type { DataSourceConfiguration, ValidationResult } from '@/core/data-architecture/types'
import { smartDeepClone } from '@/utils/deep-clone'

export interface ConfigurationTemplate {
  id: string
  name: string
  description: string
  configuration: DataSourceConfiguration
  category: 'basic' | 'advanced' | 'example'
  tags: string[]
}

/**
 * Configuration manager class
 */
export class ConfigurationManager {
  private templates: ConfigurationTemplate[] = []

  constructor() {
    this.initializeBuiltinTemplates()
  }

  /**
   * Initialize built-in templates
   */
  private initializeBuiltinTemplates() {
    this.templates = [
      {
        id: 'json-basic',
        name: 'JSONBasic example',
        description: 'simpleJSONData configuration example',
        category: 'basic',
        tags: ['json', 'static', 'basic'],
        configuration: {
          componentId: 'example-component',
          dataSources: [
            {
              sourceId: 'basic_json',
              dataItems: [
                {
                  item: {
                    type: 'json',
                    config: {
                      jsonString: JSON.stringify(
                        {
                          temperature: 25,
                          humidity: 60,
                          status: 'normal',
                          timestamp: new Date().toISOString()
                        },
                        null,
                        2
                      )
                    }
                  },
                  processing: {
                    filterPath: '$',
                    defaultValue: {}
                  }
                }
              ],
              mergeStrategy: { type: 'object' }
            }
          ],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      },
      {
        id: 'http-api',
        name: 'HTTP APIExample',
        description: 'RESTful APIData acquisition configuration',
        category: 'basic',
        tags: ['http', 'api', 'dynamic'],
        configuration: {
          componentId: 'api-component',
          dataSources: [
            {
              sourceId: 'api_data',
              dataItems: [
                {
                  item: {
                    type: 'http',
                    config: {
                      url: '/api/sensors/current',
                      method: 'GET'
                    }
                  },
                  processing: {
                    filterPath: '$.data',
                    defaultValue: []
                  }
                }
              ],
              mergeStrategy: { type: 'object' }
            }
          ],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      },
      {
        id: 'script-generated',
        name: 'Script generation example',
        description: 'passJavaScriptDynamically generate data',
        category: 'advanced',
        tags: ['script', 'dynamic', 'computed'],
        configuration: {
          componentId: 'script-component',
          dataSources: [
            {
              sourceId: 'script_gen',
              dataItems: [
                {
                  item: {
                    type: 'script',
                    config: {
                      script: `
// Generate simulated sensor data
const sensorData = {
  timestamp: Date.now(),
  temperature: Math.round(20 + Math.random() * 20),
  humidity: Math.round(40 + Math.random() * 40),
  pressure: Math.round(1000 + Math.random() * 50),
  status: Math.random() > 0.8 ? 'warning' : 'normal'
}
return sensorData
                  `.trim()
                    }
                  },
                  processing: {
                    filterPath: '$',
                    defaultValue: {}
                  }
                }
              ],
              mergeStrategy: { type: 'object' }
            }
          ],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      },
      {
        id: 'multi-source',
        name: 'Multi-source integration example',
        description: 'Complete example of merging multiple data sources',
        category: 'example',
        tags: ['multi-source', 'merge', 'complex'],
        configuration: {
          componentId: 'multi-source-component',
          dataSources: [
            {
              sourceId: 'sensor_data',
              dataItems: [
                {
                  item: {
                    type: 'json',
                    config: {
                      jsonString: JSON.stringify(
                        {
                          sensors: [
                            { id: 1, type: 'temperature', value: 25 },
                            { id: 2, type: 'humidity', value: 60 }
                          ]
                        },
                        null,
                        2
                      )
                    }
                  },
                  processing: {
                    filterPath: '$.sensors',
                    defaultValue: []
                  }
                }
              ],
              mergeStrategy: { type: 'array' }
            },
            {
              sourceId: 'metadata',
              dataItems: [
                {
                  item: {
                    type: 'script',
                    config: {
                      script: `
return {
  timestamp: Date.now(),
  location: "test area",
  deviceId: "DEVICE_" + Math.random().toString(36).substring(7),
  version: "1.0.0"
}
                    `.trim()
                    }
                  },
                  processing: {
                    filterPath: '$',
                    defaultValue: {}
                  }
                }
              ],
              mergeStrategy: { type: 'object' }
            }
          ],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      }
    ]
  }

  /**
   * Get all built-in templates
   */
  getBuiltinTemplates(): ConfigurationTemplate[] {
    return this.templates
  }

  /**
   * according toIDGet template
   */
  getTemplate(id: string): ConfigurationTemplate | undefined {
    return this.templates.find(t => t.id === id)
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): ConfigurationTemplate[] {
    return this.templates.filter(t => t.category === category)
  }

  /**
   * Verify configuration
   */
  validateConfiguration(config: DataSourceConfiguration): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Infrastructure verification
    if (!config.componentId) {
      errors.push('componentsIDcannot be empty')
    }

    if (!config.dataSources || config.dataSources.length === 0) {
      errors.push('At least one data source needs to be configured')
    }

    // Data source validation
    config.dataSources?.forEach((dataSource, dsIndex) => {
      if (!dataSource.sourceId) {
        errors.push(`data source ${dsIndex + 1}: sourceIdcannot be empty`)
      }

      if (!dataSource.dataItems || dataSource.dataItems.length === 0) {
        errors.push(`data source ${dsIndex + 1}: At least one data item is required`)
      }

      // Data item validation
      dataSource.dataItems?.forEach((dataItem, diIndex) => {
        if (!dataItem.item.type) {
          errors.push(`data source ${dsIndex + 1}, data item ${diIndex + 1}: Data type cannot be empty`)
        }

        // type specific validation
        switch (dataItem.item.type) {
          case 'json':
            if (!dataItem.item.config.jsonString) {
              errors.push(`data source ${dsIndex + 1}, data item ${diIndex + 1}: JSONContent cannot be empty`)
            } else {
              try {
                JSON.parse(dataItem.item.config.jsonString)
              } catch (e) {
                errors.push(`data source ${dsIndex + 1}, data item ${diIndex + 1}: JSONFormat error`)
              }
            }
            break
          case 'http':
            if (!dataItem.item.config.url) {
              errors.push(`data source ${dsIndex + 1}, data item ${diIndex + 1}: HTTP URLcannot be empty`)
            }
            if (!dataItem.item.config.method) {
              warnings.push(`data source ${dsIndex + 1}, data item ${diIndex + 1}: Recommended to specifyHTTPmethod`)
            }
            break
          case 'script':
            if (!dataItem.item.config.script) {
              errors.push(`data source ${dsIndex + 1}, data item ${diIndex + 1}: Script content cannot be empty`)
            }
            break
        }

        // Handle configuration validation
        if (!dataItem.processing.filterPath) {
          warnings.push(`data source ${dsIndex + 1}, data item ${diIndex + 1}: It is recommended to set the filter path`)
        }
      })

      // Merge strategy verification
      if (!dataSource.mergeStrategy.type) {
        warnings.push(`data source ${dsIndex + 1}: It is recommended to specify a merge strategy`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * The export configuration isJSONstring
   */
  exportConfiguration(config: DataSourceConfiguration): string {
    return JSON.stringify(config, null, 2)
  }

  /**
   * fromJSONString import configuration
   */
  importConfiguration(jsonString: string): DataSourceConfiguration {
    try {
      const config = JSON.parse(jsonString) as DataSourceConfiguration

      // Basic verification
      if (!config.dataSources || !Array.isArray(config.dataSources)) {
        throw new Error('Configuration format error: dataSourcesMust be an array')
      }

      // Add timestamp
      config.updatedAt = Date.now()
      if (!config.createdAt) {
        config.createdAt = Date.now()
      }

      return config
    } catch (error) {
      throw new Error('Configuration import failed: ' + (error.message || 'Format error'))
    }
  }

  /**
   * Export configuration as file
   */
  exportConfigurationAsFile(config: DataSourceConfiguration, filename?: string) {
    const dataStr = this.exportConfiguration(config)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename || `${config.componentId}-config-${Date.now()}.json`
    link.click()

    URL.revokeObjectURL(url)
  }

  /**
   * Import configuration from file
   */
  async importConfigurationFromFile(file: File): Promise<DataSourceConfiguration> {
    const text = await file.text()
    return this.importConfiguration(text)
  }

  /**
   * Generate sample configuration
   */
  generateExampleConfiguration(componentId: string): DataSourceConfiguration {
    const template = this.getTemplate('json-basic')
    if (template) {
      return {
        ...template.configuration,
        componentId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    }

    // Falling back to the simple example
    return {
      componentId,
      dataSources: [
        {
          sourceId: 'example_data',
          dataItems: [
            {
              item: {
                type: 'json',
                config: {
                  jsonString: '{"message": "Hello World", "timestamp": "' + new Date().toISOString() + '"}'
                }
              },
              processing: { filterPath: '$', defaultValue: {} }
            }
          ],
          mergeStrategy: { type: 'object' }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  /**
   * Clone configuration
   */
  cloneConfiguration(config: DataSourceConfiguration, newComponentId?: string): DataSourceConfiguration {
    const cloned = smartDeepClone(config) as DataSourceConfiguration

    if (newComponentId) {
      cloned.componentId = newComponentId
    }

    cloned.createdAt = Date.now()
    cloned.updatedAt = Date.now()

    return cloned
  }

  /**
   * Merge configuration
   */
  mergeConfigurations(
    baseConfig: DataSourceConfiguration,
    ...otherConfigs: DataSourceConfiguration[]
  ): DataSourceConfiguration {
    const merged = this.cloneConfiguration(baseConfig)

    otherConfigs.forEach(config => {
      // Merge data sources
      merged.dataSources.push(...config.dataSources)
    })

    merged.updatedAt = Date.now()
    return merged
  }
}

// Create a singleton instance
export const configurationManager = new ConfigurationManager()

// Default export
export default configurationManager
