/**
 * Bar chart component definition
 */
import type { ComponentDefinition } from '@/card2.1/core2'
import type { BarChartCustomize } from './settingConfig'

export const barChartDefinition: ComponentDefinition = {
  id: 'bar-chart',
  name: 'bar chart',
  description: 'EChartsbar chart，Used to display comparisons of categorical data',
  category: 'chart',
  subCategory: 'data',
  version: '1.0.0',
  author: 'ThingsPanel',

  // Component configuration interface
  component: {} as BarChartCustomize,

  // Default configuration
  defaultConfig: {
    title: 'Data comparison',
    showLegend: true,
    barWidth: '60%',
    showLabel: false,
    xAxisLabel: 'category',
    yAxisLabel: 'numerical value',
    showGrid: true,
    barColor: '#5470c6',
    barGradient: true,
    barGradientColor: '#91cc75',
    animationDuration: 1000,
    animationDelay: 50
  },

  // Data source definition - Support categorical data
  dataSources: [
    {
      key: 'main',
      name: 'data source',
      description: 'Categorical data for bar charts',
      supportedTypes: ['static', 'api', 'websocket'],
      required: false,
      example: {
        xData: ['on Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        yData: [120, 200, 150, 80, 70, 110, 130],
        timestamp: '2025-10-15T10:30:00.000Z'
      }
    }
  ],

  // Interactive capabilities
  interactionCapabilities: {
    canTrigger: false,
    canReceive: false,
    exposedProperties: []
  },

  // component label
  tags: ['chart', 'bar chart', 'ECharts', 'contrast'],

  // Preview configuration
  preview: {
    width: 400,
    height: 300
  }
}
