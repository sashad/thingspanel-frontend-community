/**
 * Card 2.1 - Global classification definition
 * @description
 * This file defines the global classification system of components，Includes top categories（system、chart）and all its subcategories。
 * it is"Convention over configuration"core，The automated registration system will supplement and correct the component classification information based on this document。
 */

import type { CategoryConfig } from '../types'

/**
 * Top level category definition
 */
export const TOP_LEVEL_CATEGORIES: Record<'system' | 'chart', CategoryConfig> = {
  system: {
    id: 'system',
    displayName: 'categories.system', // Corresponds to Chinese：system
    order: 1,
    icon: 'settings',
    description: 'system level components，Used to monitor and manage platform status',
    enabled: true,
  },
  chart: {
    id: 'chart',
    displayName: 'categories.chart', // Corresponds to Chinese：chart
    order: 2,
    icon: 'chart',
    description: 'chart-level components，for data visualization and interaction',
    enabled: true,
  },
};

/**
 * Subcategory definition：system
 */
export const SYSTEM_SUB_CATEGORIES: Record<string, CategoryConfig> = {
  'system-monitoring': {
    id: 'system-monitoring',
    displayName: 'subCategories.systemMonitoring', // Corresponds to Chinese：System monitoring
    order: 10,
    icon: 'dashboard',
    description: 'Display system-level hardware resource usage',
    enabled: true,
    parentId: 'system',
  },
  'device-status': {
    id: 'device-status',
    displayName: 'subCategories.deviceStatus', // Corresponds to Chinese：Device status
    order: 20,
    icon: 'laptop',
    description: 'Monitor and display the online status of your device',
    enabled: true,
    parentId: 'system',
  },
  'alarm-management': {
    id: 'alarm-management',
    displayName: 'subCategories.alarmManagement', // Corresponds to Chinese：Alarm management
    order: 30,
    icon: 'alert',
    description: 'Display information related to alarms',
    enabled: true,
    parentId: 'system',
  },
  'tenant-app': {
    id: 'tenant-app',
    displayName: 'subCategories.tenantApp', // Corresponds to Chinese：Tenants and applications
    order: 40,
    icon: 'appstore',
    description: 'Provides data and functionality related to tenants and applications',
    enabled: true,
    parentId: 'system',
  },
  'data-information': {
    id: 'data-information',
    displayName: 'subCategories.dataInformation', // Corresponds to Chinese：Data and information
    order: 50,
    icon: 'info-circle',
    description: 'Used to display general data and information',
    enabled: true,
    parentId: 'system',
  },
  'user-behavior': {
    id: 'user-behavior',
    displayName: 'subCategories.userBehavior', // Corresponds to Chinese：user behavior
    order: 60,
    icon: 'user',
    description: 'Track and display user activity',
    enabled: true,
    parentId: 'system',
  },
  'operation-guide': {
    id: 'operation-guide',
    displayName: 'subCategories.operationGuide', // Corresponds to Chinese：Operating Instructions
    order: 70,
    icon: 'book',
    description: 'Provide users with operational guidance',
    enabled: true,
    parentId: 'system',
  },
};

/**
 * Subcategory definition：chart
 */
export const CHART_SUB_CATEGORIES: Record<string, CategoryConfig> = {
  dashboard: {
    id: 'dashboard',
    displayName: 'subCategories.dashboard', // Corresponds to Chinese：Dashboard
    order: 10,
    icon: 'dashboard',
    enabled: true,
    parentId: 'chart',
  },
  information: {
    id: 'information',
    displayName: 'subCategories.information', // Corresponds to Chinese：information
    order: 20,
    icon: 'info-circle',
    enabled: true,
    parentId: 'chart',
  },
  control: {
    id: 'control',
    displayName: 'subCategories.control', // Corresponds to Chinese：control
    order: 30,
    icon: 'control',
    enabled: true,
    parentId: 'chart',
  },
  device: {
    id: 'device',
    displayName: 'subCategories.device', // Corresponds to Chinese：equipment
    order: 40,
    icon: 'device',
    enabled: true,
    parentId: 'chart',
  },
  data: {
    id: 'data',
    displayName: 'subCategories.data', // Corresponds to Chinese：data
    order: 50,
    icon: 'chart-bar',
    enabled: true,
    parentId: 'chart',
  },
  statistics: {
    id: 'statistics',
    displayName: 'subCategories.statistics', // Corresponds to Chinese：statistics
    order: 60,
    icon: 'statistics',
    enabled: true,
    parentId: 'chart',
  },
  location: {
    id: 'location',
    displayName: 'subCategories.location', // Corresponds to Chinese：Location
    order: 70,
    icon: 'location',
    enabled: true,
    parentId: 'chart',
  },
  media: {
    id: 'media',
    displayName: 'subCategories.media', // Corresponds to Chinese：Audio and video
    order: 80,
    icon: 'play-circle',
    enabled: true,
    parentId: 'chart',
  },
  alarm: {
    id: 'alarm',
    displayName: 'subCategories.alarm', // Corresponds to Chinese：Alarm
    order: 90,
    icon: 'warning',
    enabled: true,
    parentId: 'chart',
  },
};

/**
 * Merge all subcategories
 */
export const SUB_CATEGORIES: Record<string, CategoryConfig> = {
  ...SYSTEM_SUB_CATEGORIES,
  ...CHART_SUB_CATEGORIES,
};

/**
 * Component to subcategory mapping table
 * key: componentsID (通常是components目录名)
 * value: subcategoryID
 */
export const COMPONENT_TO_CATEGORY_MAP: Record<string, string> = {
  // --- system components ---
  'cpu-usage': 'system-monitoring',
  'disk-usage': 'system-monitoring',
  'memory-usage': 'system-monitoring',
  'system-metrics-history': 'system-monitoring',
  'on-line': 'device-status',
  'off-line': 'device-status',
  'online-trend': 'device-status',
  'alarm-count': 'alarm-management',
  'alarm-info': 'alarm-management',
  'tenant-count': 'tenant-app',
  'tenant-chart': 'tenant-app',
  'app-download': 'tenant-app',
  'reported-data': 'data-information',
  'news': 'data-information',
  'version': 'data-information',
  'access': 'device-status', // Correction：The total number of devices should belong to the device status category
  'recently-visited': 'user-behavior',
  'operation-guide-card': 'operation-guide',

  // --- chart component (Can be inferred from the component name，You can also specify it explicitly here) ---
  'alert-status': 'alarm',
  'alert-status-v2': 'alarm',
  'switch-controller': 'control',
  'digit-indicator': 'data',
  'gauge-chart': 'data', // Dashboard chart component
  'line-chart': 'data', // Line chart component
  'bar-chart': 'data', // Bar chart component
  'pie-chart': 'data', // Pie chart component
};

/**
 * Get component classification information
 */
export function getCategoryFromComponentId(componentId: string): { mainCategory: string; subCategory: string } {
  // Find the subcategory corresponding to the component from the mapping tableID
  const subCategoryId = COMPONENT_TO_CATEGORY_MAP[componentId]

  if (subCategoryId) {
    // According to subcategoryIDDetermine main category
    const subCategoryConfig = SUB_CATEGORIES[subCategoryId]
    if (subCategoryConfig) {
      const mainCategory = subCategoryConfig.parentId === 'system'
        ? 'categories.system'
        : 'categories.chart'

      return {
        mainCategory,
        subCategory: subCategoryConfig.displayName
      }
    }
  }

  // Default classification
  return {
    mainCategory: 'categories.chart',
    subCategory: 'subCategories.other'
  }
}