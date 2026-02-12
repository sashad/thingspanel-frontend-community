/**
 * Digital indicator component configuration definition
 * Optimized configuration structure，Support detailed style customization
 */

import type { SettingConfig } from '@/card2.1/types/setting-config'

/**
 * Digital indicator custom configuration interface
 * Focus on style configuration，Business data is provided by data sources
 */
export interface DigitIndicatorCustomize {
  // Icon style configuration
  /** Icon name */
  iconName: string
  /** icon color */
  iconColor: string
  /** icon size */
  iconSize: number

  // Numeric style configuration
  /** numerical color */
  valueColor: string
  /** Numeric font size */
  valueSize: number
  /** Numeric font weight */
  valueFontWeight: number

  // Unit style configuration
  /** unit color */
  unitColor: string
  /** Unit font size */
  unitSize: number

  // Title style configuration
  /** title color */
  titleColor: string
  /** Title font size */
  titleSize: number

  // Layout style configuration
  /** component padding */
  padding: number
  /** background color */
  backgroundColor?: string
  /** Whether to display background gradient */
  showGradient: boolean
  /** Whether to enablehoverEffect */
  enableHover: boolean
}

/**
 * Digital indicator complete configuration interface
 */
export interface DigitIndicatorConfig {
  type: 'digit-indicator'
  root: {
    transform: {
      rotate: number
      scale: number
    }
  }
  customize: DigitIndicatorCustomize
}

/**
 * Default style configuration（Does not contain business data）
 */
export const customConfig: DigitIndicatorCustomize = {
  // Icon style configuration
  iconName: 'Water',
  iconColor: '#1890ff',
  iconSize: 48,

  // Numeric style configuration
  valueColor: 'var(--text-color)',
  valueSize: 32,
  valueFontWeight: 700,

  // Unit style configuration
  unitColor: 'var(--text-color-2)',
  unitSize: 16,

  // Title style configuration
  titleColor: 'var(--text-color-2)',
  titleSize: 14,

  // Layout style configuration
  padding: 16,
  backgroundColor: '',
  showGradient: true,
  enableHover: true
}

/**
 * Digital indicator settings configuration
 */
export const digitIndicatorSettingConfig: SettingConfig<DigitIndicatorCustomize> = [
  {
    group: 'icon style',
    items: [
      {
        key: 'iconName',
        label: 'Icon name',
        type: 'input',
        defaultValue: 'Water',
        placeholder: 'Enter icon name（like：Water、Firewait）',
        help: 'Icon name comes from icon library，Can be selected in the component settings panel'
      },
      {
        key: 'iconColor',
        label: 'icon color',
        type: 'color',
        defaultValue: '#1890ff',
        help: 'Set icon color'
      },
      {
        key: 'iconSize',
        label: 'icon size',
        type: 'number',
        defaultValue: 48,
        min: 24,
        max: 96,
        step: 4,
        help: 'The pixel size of the icon'
      }
    ]
  },
  {
    group: 'Numeric style',
    items: [
      {
        key: 'valueColor',
        label: 'numerical color',
        type: 'color',
        defaultValue: 'var(--text-color)',
        help: 'Set the color of a numerical value'
      },
      {
        key: 'valueSize',
        label: 'Numeric font size',
        type: 'number',
        defaultValue: 32,
        min: 16,
        max: 64,
        step: 2,
        help: 'Pixel size of numeric text'
      },
      {
        key: 'valueFontWeight',
        label: 'Numeric font weight',
        type: 'select',
        defaultValue: 700,
        options: [
          { label: 'fine body', value: 300 },
          { label: 'normal', value: 400 },
          { label: 'medium', value: 500 },
          { label: 'semi-thick', value: 600 },
          { label: 'Bold', value: 700 },
          { label: 'Extra thick', value: 800 }
        ],
        help: 'The thickness of numerical text'
      }
    ]
  },
  {
    group: 'unit style',
    items: [
      {
        key: 'unitColor',
        label: 'unit color',
        type: 'color',
        defaultValue: 'var(--text-color-2)',
        help: 'Set the color of the unit'
      },
      {
        key: 'unitSize',
        label: 'Unit font size',
        type: 'number',
        defaultValue: 16,
        min: 10,
        max: 32,
        step: 1,
        help: 'Pixel size of unit text'
      }
    ]
  },
  {
    group: 'Title style',
    items: [
      {
        key: 'titleColor',
        label: 'title color',
        type: 'color',
        defaultValue: 'var(--text-color-2)',
        help: 'Set title color'
      },
      {
        key: 'titleSize',
        label: 'Title font size',
        type: 'number',
        defaultValue: 14,
        min: 10,
        max: 24,
        step: 1,
        help: 'Title text pixel size'
      }
    ]
  },
  {
    group: 'layout style',
    items: [
      {
        key: 'padding',
        label: 'padding',
        type: 'number',
        defaultValue: 16,
        min: 8,
        max: 32,
        step: 2,
        help: 'Component content margins'
      },
      {
        key: 'backgroundColor',
        label: 'background color',
        type: 'color',
        defaultValue: '',
        help: 'Leave blank to use default background，Fill in to overwrite the default background'
      },
      {
        key: 'showGradient',
        label: 'gradient background',
        type: 'switch',
        defaultValue: true,
        help: 'Whether to display a slight gradient background effect'
      },
      {
        key: 'enableHover',
        label: 'HoverEffect',
        type: 'switch',
        defaultValue: true,
        help: 'Whether to enable interactive effects on mouse hover'
      }
    ]
  }
]