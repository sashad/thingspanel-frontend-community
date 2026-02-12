/**
 * Line chart component definition
 */
import type { ComponentDefinition } from '@/card2.1/core2'
import type { LineChartCustomize } from './settingConfig'

export const lineChartDefinition: ComponentDefinition = {
  id: 'line-chart',
  name: 'Line chart',
  description: 'EChartsLine chart，Used to show trends in data over time',
  category: 'chart',
  subCategory: 'data',
  version: '1.0.0',
  author: 'ThingsPanel',

  // Component configuration interface
  component: {} as LineChartCustomize,

  // Default configuration
  defaultConfig: {
    title: 'Data trends',
    showLegend: true,
    smooth: true,
    showArea: false,
    xAxisLabel: 'time',
    yAxisLabel: 'numerical value',
    showGrid: true,
    lineColor: '#5470c6',
    areaColor: 'rgba(84, 112, 198, 0.3)',
    showDataPoints: true,
    dataPointSize: 6,
    animationDuration: 1000
  },

  // Data source definition - Support time series data
  dataSources: [
    {
      key: 'main',
      name: 'data source',
      description: 'Time series data for line chart',
      supportedTypes: ['static', 'api', 'websocket'],
      required: false,
      example: {
        xData: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        yData: [120, 200, 150, 80, 70, 110],
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
  tags: ['chart', 'Line chart', 'ECharts', 'trend'],

  // Preview configuration
  preview: {
    width: 400,
    height: 300
  }
}
