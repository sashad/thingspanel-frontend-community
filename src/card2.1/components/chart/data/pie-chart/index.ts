/**
 * Pie chart component definition
 */
import PieChart from './index.vue'
import PieChartSetting from './setting.vue'
import type { ComponentDefinition } from '@/card2.1/core2'
import type { PieChartCustomize } from './settingConfig'

const pieChartDefinition: ComponentDefinition = {
  type: 'pie-chart',
  name: 'pie chart',
  description: 'EChartspie chart，Used to display data proportion distribution',
  icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11,2V22C5.9,21.5 2,17.2 2,12C2,6.8 5.9,2.5 11,2M13,2V11H22C21.5,6.2 17.8,2.5 13,2M13,13V22C17.7,21.5 21.5,17.8 22,13H13Z"/></svg>',
  version: '1.0.0',
  author: 'ThingsPanel',
  component: PieChart,
  configComponent: PieChartSetting,

  defaultConfig: {
    type: 'pie-chart',
    root: {
      transform: { rotate: 0, scale: 1 }
    },
    customize: {
      title: 'Data distribution',
      showLegend: true,
      radius: '70%',
      innerRadius: '40%',
      isDonut: false,
      showLabel: true,
      labelPosition: 'outside',
      animationDuration: 1000
    }
  },

  config: {
    type: 'pie-chart',
    root: {
      transform: { rotate: 0, scale: 1 }
    },
    customize: {
      title: 'Data distribution',
      showLegend: true,
      radius: '70%',
      innerRadius: '40%',
      isDonut: false,
      showLabel: true,
      labelPosition: 'outside',
      animationDuration: 1000
    }
  },

  defaultLayout: {
    gridstack: {
      w: 4,
      h: 3,
      x: 0,
      y: 0,
      minW: 3,
      minH: 2,
      maxW: 6,
      maxH: 6
    }
  },

  layout: {
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 6, height: 6 },
    resizable: true
  },

  permission: 'NO_LIMIT',
  tags: ['chart', 'pie chart', 'ECharts', 'Proportion'],

  features: {
    realtime: true,
    dataBinding: true,
    configurable: true
  },

  dataSources: [
    {
      key: 'main',
      name: 'data source',
      description: 'Pie chart data distribution',
      supportedTypes: ['static', 'api', 'websocket'],
      required: false,
      example: {
        data: [
          { name: 'categoryA', value: 335 },
          { name: 'categoryB', value: 234 },
          { name: 'categoryC', value: 154 },
          { name: 'categoryD', value: 135 },
          { name: 'categoryE', value: 105 }
        ],
        timestamp: '2025-10-15T10:30:00.000Z'
      }
    }
  ],

  interactionCapabilities: {
    supportedEvents: ['click', 'dataChange'],
    availableActions: ['navigateToUrl', 'updateComponentData', 'showNotification'],
    watchableProperties: {},
    defaultInteractions: []
  }
}

export default pieChartDefinition
