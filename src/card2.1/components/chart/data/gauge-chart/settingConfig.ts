/**
 * Dashboard chart configuration definition
 * Configurable properties used to define dashboard components
 */

import type { TSConfig } from '@/card2.1/types/setting-config'

/**
 * Dashboard component custom configuration interface
 */
export interface GaugeChartCustomize {
  // Data configuration
  value?: number          // current value
  min?: number           // minimum value
  max?: number           // maximum value
  unit?: string          // unit

  // Style configuration
  title?: string         // title
  titleColor?: string    // title color
  valueColor?: string    // numerical color

  // Dashboard color configuration
  gaugeColor?: string[]  // Dashboard color gradient array

  // Size configuration
  radius?: string        // Dashboard radius
  thickness?: number     // Instrument panel thickness

  // Animation configuration
  animationDuration?: number  // animation duration（millisecond）
}

/**
 * Default configuration
 */
export const customConfig: GaugeChartCustomize = {
  value: 75,
  min: 0,
  max: 100,
  unit: '%',
  title: 'Data indicators',
  titleColor: '#333333',
  valueColor: '#1890ff',
  gaugeColor: ['#5470c6', '#91cc75', '#fac858', '#ee6666'],
  radius: '75%',
  thickness: 10,
  animationDuration: 1000
}

/**
 * Dashboard configuration form definition
 */
export const gaugeChartSettingConfig: TSConfig = {
  groups: [
    {
      id: 'data',
      name: 'Data configuration',
      icon: 'i-carbon-data-1',
      fields: [
        {
          id: 'value',
          name: 'current value',
          type: 'number',
          defaultValue: 75,
          required: false,
          description: 'The current value displayed on the dashboard'
        },
        {
          id: 'min',
          name: 'minimum value',
          type: 'number',
          defaultValue: 0,
          required: false,
          description: 'The minimum scale value of the dashboard'
        },
        {
          id: 'max',
          name: 'maximum value',
          type: 'number',
          defaultValue: 100,
          required: false,
          description: 'The maximum scale value of the dashboard'
        },
        {
          id: 'unit',
          name: 'unit',
          type: 'string',
          defaultValue: '%',
          required: false,
          description: 'numerical unit'
        }
      ]
    },
    {
      id: 'style',
      name: 'Style configuration',
      icon: 'i-carbon-paint-brush',
      fields: [
        {
          id: 'title',
          name: 'title',
          type: 'string',
          defaultValue: 'Data indicators',
          required: false,
          description: 'Dashboard title'
        },
        {
          id: 'titleColor',
          name: 'title color',
          type: 'color',
          defaultValue: '#333333',
          required: false,
          description: 'Title text color'
        },
        {
          id: 'valueColor',
          name: 'numerical color',
          type: 'color',
          defaultValue: '#1890ff',
          required: false,
          description: 'Center value color'
        },
        {
          id: 'radius',
          name: 'Dashboard size',
          type: 'string',
          defaultValue: '75%',
          required: false,
          description: 'Dashboard radius size（Support percentage）'
        },
        {
          id: 'thickness',
          name: 'Instrument panel thickness',
          type: 'number',
          defaultValue: 10,
          required: false,
          description: 'Instrument panel pointer thickness'
        }
      ]
    },
    {
      id: 'animation',
      name: 'Animation configuration',
      icon: 'i-carbon-play',
      fields: [
        {
          id: 'animationDuration',
          name: 'Animation duration',
          type: 'number',
          defaultValue: 1000,
          required: false,
          description: 'Value change animation duration（millisecond）'
        }
      ]
    }
  ]
}
