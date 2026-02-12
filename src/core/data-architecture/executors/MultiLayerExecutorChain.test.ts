/**
 * Multi-level executor chain test cases
 */

import { MultiLayerExecutorChain, DataSourceConfiguration } from '@/core/data-architecture/executors/MultiLayerExecutorChain'

/**
 * JSONData item example configuration
 */
const createJsonExampleConfig = (): DataSourceConfiguration => {
  return {
    componentId: 'test-component-001',
    dataSources: [
      {
        sourceId: 'json-source-1',
        dataItems: [
          {
            item: {
              type: 'json',
              config: {
                jsonString: JSON.stringify({
                  user: { name: 'Zhang San', age: 25, hobbies: ['read', 'swim'] },
                  stats: { score: 95, level: 'A' }
                })
              }
            },
            processing: {
              filterPath: '$.user',
              defaultValue: {}
            }
          },
          {
            item: {
              type: 'json',
              config: {
                jsonString: JSON.stringify({
                  product: { name: 'commodityA', price: 199 },
                  categories: ['electronic', 'digital']
                })
              }
            },
            processing: {
              filterPath: '$.product',
              defaultValue: {}
            }
          }
        ],
        mergeStrategy: {
          type: 'object'
        }
      },
      {
        sourceId: 'json-source-2',
        dataItems: [
          {
            item: {
              type: 'json',
              config: {
                jsonString: JSON.stringify([
                  { id: 1, name: 'project1' },
                  { id: 2, name: 'project2' },
                  { id: 3, name: 'project3' }
                ])
              }
            },
            processing: {
              filterPath: '$[0]', // Get the first element
              defaultValue: {}
            }
          }
        ],
        mergeStrategy: {
          type: 'array'
        }
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

/**
 * HTTPData item example configuration
 */
const createHttpExampleConfig = (): DataSourceConfiguration => {
  return {
    componentId: 'test-component-002',
    dataSources: [
      {
        sourceId: 'http-source-1',
        dataItems: [
          {
            item: {
              type: 'http',
              config: {
                url: 'https://jsonplaceholder.typicode.com/posts/1',
                method: 'GET',
                timeout: 5000
              }
            },
            processing: {
              filterPath: '$.title',
              defaultValue: 'default title'
            }
          }
        ],
        mergeStrategy: {
          type: 'object'
        }
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

/**
 * Custom script merge example configuration
 */
const createScriptMergeExampleConfig = (): DataSourceConfiguration => {
  return {
    componentId: 'test-component-003',
    dataSources: [
      {
        sourceId: 'script-merge-source',
        dataItems: [
          {
            item: {
              type: 'json',
              config: {
                jsonString: JSON.stringify({ count: 10, name: 'test data' })
              }
            },
            processing: {
              filterPath: '$',
              customScript: `
                // Custom processing of data
                return {
                  ...data,
                  processedAt: new Date().toISOString(),
                  doubled: data.count * 2
                };
              `,
              defaultValue: {}
            }
          },
          {
            item: {
              type: 'json',
              config: {
                jsonString: JSON.stringify({ value: 20, status: 'active' })
              }
            },
            processing: {
              filterPath: '$',
              defaultValue: {}
            }
          }
        ],
        mergeStrategy: {
          type: 'script',
          script: `
            // Custom merge logic
            const result = {
              merged: true,
              totalValue: 0,
              items: []
            };
            
            for (const item of items) {
              result.items.push(item);
              if (item.count) result.totalValue += item.count;
              if (item.value) result.totalValue += item.value;
            }
            
            return result;
          `
        }
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

/**
 * Test actuator chain functionality
 */
async function testExecutorChain() {
  const executorChain = new MultiLayerExecutorChain()

  // test1: JSONData processing
  try {
    const config1 = createJsonExampleConfig()
    const result1 = await executorChain.executeDataProcessingChain(config1, true)
  } catch (error) {}

  // test2: HTTPData processing (Possible network failure)
  try {
    const config2 = createHttpExampleConfig()
    const result2 = await executorChain.executeDataProcessingChain(config2, true)
  } catch (error) {}

  // test3: Custom script processing
  try {
    const config3 = createScriptMergeExampleConfig()
    const result3 = await executorChain.executeDataProcessingChain(config3, true)
  } catch (error) {}

  // test4: Executor chain statistics
  const statistics = executorChain.getChainStatistics()
}

// If you run this file directly，Execute tests
if (require.main === module) {
  testExecutorChain().catch(console.error)
}

export { testExecutorChain }
