/**
 * Bar chart component definition
 */
import BarChart from './index.vue'
import BarChartSetting from './setting.vue'
import type { ComponentDefinition } from '@/card2.1/core2'
import type { BarChartCustomize } from './settingConfig'

const barChartDefinition: ComponentDefinition = {
  type: 'bar-chart',
  name: 'bar chart',
  description: 'EChartsbar chart，Used to display comparisons of categorical data',
  icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z"/></svg>',
  version: '1.0.0',
  author: 'ThingsPanel',
  component: BarChart,
  configComponent: BarChartSetting,

  // Default configuration
  defaultConfig: {
    type: 'bar-chart',
    root: {
      transform: { rotate: 0, scale: 1 }
    },
    customize: {
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
    }
  },

  config: {
    type: 'bar-chart',
    root: {
      transform: { rotate: 0, scale: 1 }
    },
    customize: {
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
    }
  },

  // layout configuration
  defaultLayout: {
    gridstack: {
      w: 4,
      h: 3,
      x: 0,
      y: 0,
      minW: 3,
      minH: 2,
      maxW: 8,
      maxH: 6
    }
  },

  layout: {
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 8, height: 6 },
    resizable: true
  },

  // Permission control
  permission: 'NO_LIMIT',

  // Classified information
  tags: ['chart', 'bar chart', 'ECharts', 'contrast'],

  // Features
  features: {
    realtime: true,
    dataBinding: true,
    configurable: true
  },

  // Data source definition
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
    supportedEvents: ['click', 'dataChange'],
    availableActions: ['navigateToUrl', 'updateComponentData', 'showNotification'],
    watchableProperties: {},
    defaultInteractions: []
  }
}

export default barChartDefinition
