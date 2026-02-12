/**
 * Chart Bar components - Card 2.0 Demo
 * Implementation of histogram component based on new architecture
 */

import type { IComponentDefinition } from '../../../core/types/component'
import type { IDataNode } from '../../../core/types/index'
import { dataTransform } from '../../../core/data/transform'

// importVueview component
import BarChartView from './BarChartView.vue'

/**
 * Bar chart component logicHook
 */
const useBarChartLogic = () => {
  /**
   * Process data
   * @param rawData raw data
   * @param config Component configuration
   * @returns processed data
   */
  const processData = async (rawData: IDataNode | IDataNode[], config: any) => {
    try {
      // Unified data format
      const dataNodes = Array.isArray(rawData) ? rawData : [rawData]

      // Data transformation and aggregation
      const chartData = dataNodes.map(node => {
        // Extract numerical data
        let value = node.value
        if (typeof value === 'object' && value !== null) {
          // if it is an object，Try to extract a numeric field
          const numericFields = Object.keys(value).filter(key => typeof value[key] === 'number')
          if (numericFields.length > 0) {
            value = value[numericFields[0]] // Get the first numeric field
          }
        }

        return {
          name: node.metadata?.deviceName || node.metadata?.metric || node.id,
          value: typeof value === 'number' ? value : 0,
          timestamp: node.timestamp,
          unit: node.metadata?.unit || '',
          category: node.metadata?.category || 'default'
        }
      })

      // Data processing according to configuration
      if (config.aggregation?.enabled) {
        return aggregateData(chartData, config.aggregation)
      }

      // Data sorting
      if (config.sort?.enabled) {
        chartData.sort((a, b) => {
          const field = config.sort.field || 'value'
          const order = config.sort.order || 'desc'
          const aVal = a[field as keyof typeof a]
          const bVal = b[field as keyof typeof b]

          if (order === 'asc') {
            return aVal > bVal ? 1 : -1
          } else {
            return aVal < bVal ? 1 : -1
          }
        })
      }

      // Data limits
      if (config.limit && config.limit > 0) {
        return chartData.slice(0, config.limit)
      }

      return chartData
    } catch (error) {
      console.error('[BarChart] Data processing failed:', error)
      return []
    }
  }

  /**
   * Aggregate data
   * @param data raw data
   * @param aggregationConfig Aggregation configuration
   * @returns Aggregated data
   */
  const aggregateData = (data: any[], aggregationConfig: any) => {
    const { groupBy, method } = aggregationConfig

    if (!groupBy) return data

    const groups = data.reduce(
      (acc, item) => {
        const key = item[groupBy] || 'unknown'
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(item)
        return acc
      },
      {} as Record<string, any[]>
    )

    return Object.entries(groups).map(([key, items]) => {
      let value = 0

      switch (method) {
        case 'sum':
          value = items.reduce((sum, item) => sum + item.value, 0)
          break
        case 'avg':
          value = items.reduce((sum, item) => sum + item.value, 0) / items.length
          break
        case 'max':
          value = Math.max(...items.map(item => item.value))
          break
        case 'min':
          value = Math.min(...items.map(item => item.value))
          break
        case 'count':
          value = items.length
          break
        default:
          value = items[0]?.value || 0
      }

      return {
        name: key,
        value,
        count: items.length,
        unit: items[0]?.unit || '',
        category: groupBy
      }
    })
  }

  /**
   * Processing when mounting components
   * @param context component context
   */
  const onMounted = async (context: any) => {
    if (process.env.NODE_ENV === 'development') {
    }

    // Initialize chart configuration
    if (!context.config.chart) {
      context.updateConfig({
        ...context.config,
        chart: {
          type: 'bar',
          theme: 'default',
          animation: true,
          responsive: true
        }
      })
    }
  }

  /**
   * Processing when components are uninstalled
   * @param context component context
   */
  const onUnmounted = async (context: any) => {
    if (process.env.NODE_ENV === 'development') {
    }
    // Clean up resources
  }

  /**
   * Configuration change handling
   * @param newConfig New configuration
   * @param oldConfig old configuration
   */
  const onConfigChanged = async (newConfig: any, oldConfig: any) => {
    if (process.env.NODE_ENV === 'development') {
    }
    // Handle configuration change logic
  }

  return {
    processData,
    onMounted,
    onUnmounted,
    onConfigChanged
  }
}

/**
 * Bar chart component definition
 */
export const barChartDefinition: IComponentDefinition = {
  meta: {
    id: 'chart-bar',
    name: 'bar chart',
    description: 'Histogram component for displaying categorical data',
    version: '2.0.0',
    author: 'Card 2.0',
    tags: ['chart', 'bar', 'visualization'],
    category: 'chart',
    icon: 'bar-chart',
    thumbnail: '/assets/thumbnails/bar-chart.png'
  },

  logic: useBarChartLogic(),

  views: {
    vue: BarChartView
  },

  config: {
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          title: 'Chart title',
          default: 'bar chart'
        },
        chart: {
          type: 'object',
          title: 'Chart configuration',
          properties: {
            type: {
              type: 'string',
              title: 'chart type',
              enum: ['bar', 'column'],
              default: 'bar'
            },
            theme: {
              type: 'string',
              title: 'theme',
              enum: ['default', 'dark', 'light'],
              default: 'default'
            },
            animation: {
              type: 'boolean',
              title: 'Enable animation',
              default: true
            },
            responsive: {
              type: 'boolean',
              title: 'Responsive',
              default: true
            }
          }
        },
        colors: {
          type: 'array',
          title: 'Color configuration',
          items: {
            type: 'string'
          },
          default: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']
        },
        aggregation: {
          type: 'object',
          title: 'Data aggregation',
          properties: {
            enabled: {
              type: 'boolean',
              title: 'Enable aggregation',
              default: false
            },
            groupBy: {
              type: 'string',
              title: 'grouping field',
              enum: ['category', 'name', 'unit'],
              default: 'category'
            },
            method: {
              type: 'string',
              title: 'aggregation method',
              enum: ['sum', 'avg', 'max', 'min', 'count'],
              default: 'sum'
            }
          }
        },
        sort: {
          type: 'object',
          title: 'Sorting configuration',
          properties: {
            enabled: {
              type: 'boolean',
              title: 'Enable sorting',
              default: true
            },
            field: {
              type: 'string',
              title: 'sort field',
              enum: ['name', 'value', 'timestamp'],
              default: 'value'
            },
            order: {
              type: 'string',
              title: 'sort order',
              enum: ['asc', 'desc'],
              default: 'desc'
            }
          }
        },
        limit: {
          type: 'number',
          title: 'Data limits',
          minimum: 0,
          maximum: 100,
          default: 10
        }
      }
    },

    defaultConfig: {
      title: 'bar chart',
      chart: {
        type: 'bar',
        theme: 'default',
        animation: true,
        responsive: true
      },
      colors: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'],
      aggregation: {
        enabled: false,
        groupBy: 'category',
        method: 'sum'
      },
      sort: {
        enabled: true,
        field: 'value',
        order: 'desc'
      },
      limit: 10
    }
  },

  dataSource: {
    supportedTypes: ['device', 'system', 'api', 'mock'],
    requiredFields: ['value'],
    optionalFields: ['name', 'category', 'unit', 'timestamp'],
    aggregationSupport: true,
    realTimeSupport: true
  },

  layout: {
    defaultSize: {
      width: 6,
      height: 4
    },
    minSize: {
      width: 3,
      height: 2
    },
    maxSize: {
      width: 12,
      height: 8
    },
    resizable: true
  }
}

// Default export
export default barChartDefinition
