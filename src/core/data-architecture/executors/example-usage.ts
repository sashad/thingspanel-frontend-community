/**
 * Multi-level executor chain usage example
 * Show how to use it in real projects4layer data processing pipeline
 */

import { createExecutorChain, DataSourceConfiguration, ExecutionResult } from '@/core/data-architecture/executors/index'

/**
 * Create a sample configuration data generator
 */
export class ExampleConfigGenerator {
  /**
   * generateJSONData source sample configuration
   */
  generateJsonExample(): DataSourceConfiguration {
    return {
      componentId: 'dashboard-widget-001',
      dataSources: [
        {
          sourceId: 'user-stats',
          dataItems: [
            {
              item: {
                type: 'json',
                config: {
                  jsonString: JSON.stringify({
                    user: {
                      name: 'Zhang San',
                      level: 5,
                      points: 1200,
                      badges: ['newbie', 'active users']
                    },
                    performance: {
                      daily: { visits: 45, duration: 120 },
                      weekly: { visits: 280, duration: 840 }
                    }
                  })
                }
              },
              processing: {
                filterPath: '$.user',
                customScript: `
                  return {
                    ...data,
                    displayName: data.name + ' (Lv.' + data.level + ')',
                    totalBadges: data.badges.length
                  };
                `,
                defaultValue: { name: 'unknown user', level: 0 }
              }
            }
          ],
          mergeStrategy: { type: 'object' }
        },
        {
          sourceId: 'system-metrics',
          dataItems: [
            {
              item: {
                type: 'json',
                config: {
                  jsonString: JSON.stringify([
                    { metric: 'cpu', value: 75, unit: '%' },
                    { metric: 'memory', value: 4.2, unit: 'GB' },
                    { metric: 'disk', value: 850, unit: 'GB' }
                  ])
                }
              },
              processing: {
                filterPath: '$',
                customScript: `
                  return data.map(item => ({
                    name: item.metric.toUpperCase(),
                    value: item.value,
                    unit: item.unit,
                    status: item.value > 80 ? 'warning' : 'normal'
                  }));
                `,
                defaultValue: []
              }
            }
          ],
          mergeStrategy: { type: 'array' }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  /**
   * generateHTTPData source sample configuration
   */
  generateHttpExample(): DataSourceConfiguration {
    return {
      componentId: 'api-widget-002',
      dataSources: [
        {
          sourceId: 'external-api',
          dataItems: [
            {
              item: {
                type: 'http',
                config: {
                  url: 'https://jsonplaceholder.typicode.com/users/1',
                  method: 'GET',
                  timeout: 5000
                }
              },
              processing: {
                filterPath: '$',
                customScript: `
                  return {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    company: data.company?.name || 'none',
                    address: data.address?.city || 'unknown'
                  };
                `,
                defaultValue: { name: 'Data loading failed' }
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

  /**
   * Generate a sample hybrid data source configuration
   */
  generateMixedExample(): DataSourceConfiguration {
    return {
      componentId: 'mixed-widget-003',
      dataSources: [
        // JSONdata source
        {
          sourceId: 'local-config',
          dataItems: [
            {
              item: {
                type: 'json',
                config: {
                  jsonString: JSON.stringify({
                    theme: 'dark',
                    language: 'zh-CN',
                    features: ['charts', 'tables', 'export']
                  })
                }
              },
              processing: {
                filterPath: '$',
                defaultValue: {}
              }
            }
          ],
          mergeStrategy: { type: 'object' }
        },
        // Script to generate data source
        {
          sourceId: 'generated-data',
          dataItems: [
            {
              item: {
                type: 'script',
                config: {
                  script: `
                    const now = new Date();
                    return {
                      timestamp: now.toISOString(),
                      random: Math.floor(Math.random() * 100),
                      dayOfWeek: now.getDay(),
                      isWeekend: now.getDay() === 0 || now.getDay() === 6
                    };
                  `,
                  context: {}
                }
              },
              processing: {
                filterPath: '$',
                customScript: `
                  return {
                    ...data,
                    formatted: {
                      time: new Date(data.timestamp).toLocaleString('zh-CN'),
                      weekStatus: data.isWeekend ? 'weekend' : 'working days'
                    }
                  };
                `,
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
}

/**
 * Executor chain usage example class
 */
export class ExecutorChainUsageExample {
  private executorChain = createExecutorChain()
  private configGenerator = new ExampleConfigGenerator()

  /**
   * runJSONData processing example
   */
  async runJsonExample(): Promise<ExecutionResult> {
    const config = this.configGenerator.generateJsonExample()
    const result = await this.executorChain.executeDataProcessingChain(config, true)
    return result
  }

  /**
   * runHTTPData processing example
   */
  async runHttpExample(): Promise<ExecutionResult> {
    const config = this.configGenerator.generateHttpExample()
    const result = await this.executorChain.executeDataProcessingChain(config, true)
    return result
  }

  /**
   * Run the mixed data source processing example
   */
  async runMixedExample(): Promise<ExecutionResult> {
    const config = this.configGenerator.generateMixedExample()
    const result = await this.executorChain.executeDataProcessingChain(config, true)

    return result
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    try {
      await this.runJsonExample()

      await this.runHttpExample()

      await this.runMixedExample()

      // Show executor chain statistics
      const stats = this.executorChain.getChainStatistics()
    } catch (error) {}
  }
}

// Convenient export
export const exampleRunner = new ExecutorChainUsageExample()
export const configGenerator = new ExampleConfigGenerator()

// Not supported in browser environmentrequire.mainexamine
// To run the example，Please call manually: exampleRunner.runAllExamples()
