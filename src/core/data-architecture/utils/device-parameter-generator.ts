/**
 * Device parameter generator
 * Generate corresponding parameter groups according to different selection modes
 */

import type {
  DeviceParameterSourceType,
  DeviceSelectionConfig,
  DeviceParameterGroup,
  DeviceSelectionResult,
  ParameterRole,
  DeviceInfo,
  DeviceMetric
} from '../types/device-parameter-group'
import type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'

/**
 * Generate unique parameter groupID
 */
export function generateGroupId(sourceType: DeviceParameterSourceType): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${sourceType}_${timestamp}_${random}`
}

/**
 * Generate unique parametersID
 */
export function generateParameterId(): string {
  return `param_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * According to deviceIDSelector generation parameters
 */
export function generateDeviceIdParameters(device: DeviceInfo): DeviceSelectionResult {
  const groupId = generateGroupId('device-id')
  const now = Date.now()

  // Generate deviceIDparameter
  const parameters = [
    {
      key: 'deviceId',
      value: device.deviceId,
      dataType: 'string' as const,
      description: `equipmentID - ${device.deviceName}`,
      role: 'primary' as ParameterRole
    }
  ]

  // Create parameter group information
  const groupInfo: DeviceParameterGroup = {
    groupId,
    sourceType: 'device-id',
    sourceConfig: {
      sourceType: 'device-id',
      selectedDevice: device,
      timestamp: now
    },
    relatedParams: ['deviceId'],
    dependencies: {
      deviceId: {
        dependsOn: [],
        affects: [],
        role: 'primary'
      }
    },
    createdAt: now,
    updatedAt: now
  }

  return {
    parameters,
    groupInfo,
    selectionConfig: groupInfo.sourceConfig
  }
}

/**
 * Generate parameters based on device metric selector
 */
export function generateDeviceMetricParameters(device: DeviceInfo, metric: DeviceMetric): DeviceSelectionResult {
  const groupId = generateGroupId('device-metric')
  const now = Date.now()

  // Generate deviceID + Indicator parameters
  const parameters = [
    {
      key: 'deviceId',
      value: device.deviceId,
      dataType: 'string' as const,
      description: `equipmentID - ${device.deviceName}`,
      role: 'primary' as ParameterRole
    },
    {
      key: 'metric',
      value: metric.metricKey,
      dataType: metric.metricType,
      description: `index - ${metric.metricLabel}${metric.unit ? ` (${metric.unit})` : ''}`,
      role: 'secondary' as ParameterRole
    }
  ]

  // Create parameter group information
  const groupInfo: DeviceParameterGroup = {
    groupId,
    sourceType: 'device-metric',
    sourceConfig: {
      sourceType: 'device-metric',
      selectedDevice: device,
      selectedMetric: metric,
      timestamp: now
    },
    relatedParams: ['deviceId', 'metric'],
    dependencies: {
      deviceId: {
        dependsOn: [],
        affects: ['metric'],
        role: 'primary'
      },
      metric: {
        dependsOn: ['deviceId'],
        affects: [],
        role: 'secondary'
      }
    },
    createdAt: now,
    updatedAt: now
  }

  return {
    parameters,
    groupInfo,
    selectionConfig: groupInfo.sourceConfig
  }
}

/**
 * Convert the generated parameters toEnhancedParameterFormat
 */
export function convertToEnhancedParameters(result: DeviceSelectionResult): EnhancedParameter[] {
  return result.parameters.map(param => ({
    key: param.key,
    value: param.value,
    enabled: true,
    valueMode: 'manual' as const,
    selectedTemplate: 'device-selection',
    dataType: param.dataType as any,
    variableName: '',
    description: param.description,
    _id: generateParameterId(),

    // Device parameter group information
    deviceContext: {
      sourceType: 'device-selection',
      selectionConfig: result.selectionConfig,
      timestamp: result.groupInfo.createdAt
    },

    // Parameter group ownership information
    parameterGroup: {
      groupId: result.groupInfo.groupId,
      role: param.role,
      isDerived: false
    }
  }))
}

/**
 * Parameter group manager class
 */
export class DeviceParameterGroupManager {
  private groups: Map<string, DeviceParameterGroup> = new Map()

  /**
   * Add parameter group
   */
  addGroup(group: DeviceParameterGroup): void {
    this.groups.set(group.groupId, group)
  }

  /**
   * Get parameter group
   */
  getGroup(groupId: string): DeviceParameterGroup | undefined {
    return this.groups.get(groupId)
  }

  /**
   * Remove parameter group
   */
  removeGroup(groupId: string): boolean {
    return this.groups.delete(groupId)
  }

  /**
   * According to parameterskeyFind the parameter group it belongs to
   */
  findGroupByParameterKey(paramKey: string): DeviceParameterGroup | undefined {
    for (const group of this.groups.values()) {
      if (group.relatedParams.includes(paramKey)) {
        return group
      }
    }
    return undefined
  }

  /**
   * Get all relevant parameters of the parameter group
   */
  getGroupParameters(groupId: string, allParams: EnhancedParameter[]): EnhancedParameter[] {
    const group = this.getGroup(groupId)
    if (!group) return []

    return allParams.filter(param => param.parameterGroup?.groupId === groupId)
  }

  /**
   * Update parameter group
   */
  updateGroup(groupId: string, updates: Partial<DeviceParameterGroup>): boolean {
    const group = this.groups.get(groupId)
    if (!group) return false

    Object.assign(group, updates, { updatedAt: Date.now() })
    return true
  }

  /**
   * Get all parameter groups
   */
  getAllGroups(): DeviceParameterGroup[] {
    return Array.from(this.groups.values())
  }

  /**
   * Clear all parameter groups
   */
  clear(): void {
    this.groups.clear()
  }
}

// Global parameter group manager instance
export const globalParameterGroupManager = new DeviceParameterGroupManager()
