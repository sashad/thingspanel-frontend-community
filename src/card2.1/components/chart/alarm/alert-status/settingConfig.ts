/**
 * Alarm status component configuration - Simplified version，Keep only the basics3configuration items
 */

import type { SettingConfig } from '@/card2.1/types/setting-config'

/**
 * Alarm status custom configuration interface - Simplified version
 */
export interface AlertStatusCustomize {
  title: string     // title
  amount: number    // Amount
  description: string // Introduction
}

/**
 * Alarm status complete configuration interface
 */
export interface AlertStatusConfig {
  type: 'alert-status'
  root: {
    transform: {
      rotate: number
      scale: number
    }
  }
  customize: AlertStatusCustomize
}

/**
 * Default custom configuration
 */
export const customConfig: AlertStatusCustomize = {
  title: 'Alarm status',
  amount: 0,
  description: 'The system is running normally'
}

/**
 * Alarm status setting configuration - Simplified version
 */
export const alertStatusSettingConfig: SettingConfig<AlertStatusCustomize> = [
  {
    group: 'Basic configuration',
    items: [
      {
        key: 'title',
        label: 'title',
        type: 'input',
        defaultValue: 'Alarm status',
        placeholder: 'Please enter a title'
      },
      {
        key: 'amount',
        label: 'Amount',
        type: 'number',
        defaultValue: 0,
        placeholder: 'Please enter the amount'
      },
      {
        key: 'description',
        label: 'Introduction',
        type: 'textarea',
        defaultValue: 'The system is running normally',
        placeholder: 'Please enter profile information'
      }
    ]
  }
]