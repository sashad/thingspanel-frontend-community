<!--
  Device parameter selector master controller
  Integrate all device selection modes，Provide a unified entrance
-->
<script setup lang="ts">
/**
 * DeviceParameterSelector - Device parameter selector master controller
 * Unified management3Switching of device selection modes and parameter generation
 */

import { ref, computed, nextTick } from 'vue'
import { NDrawer, NDrawerContent } from 'naive-ui'
import DeviceSelectionModeChooser from '@/core/data-architecture/components/device-selectors/DeviceSelectionModeChooser.vue'
import DeviceIdSelector from '@/core/data-architecture/components/device-selectors/DeviceIdSelector.vue'
import DeviceMetricSelector from '@/core/data-architecture/components/device-selectors/DeviceMetricSelector.vue'

import {
  generateDeviceIdParameters,
  generateDeviceMetricParameters,
  convertToEnhancedParameters,
  globalParameterGroupManager
} from '../../utils/device-parameter-generator'

import type {
  DeviceParameterSourceType,
  DeviceInfo,
  DeviceMetric,
  DeviceSelectionConfig
} from '../../types/device-parameter-group'
import type { EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'

interface Props {
  /** Whether to show the selector */
  visible: boolean
  /** edit mode：Edit mode if an existing parameter group is provided */
  editingGroupId?: string
  /** Pre-selected devices（edit mode） */
  preSelectedDevice?: DeviceInfo
  /** Pre-selected indicators（edit mode） */
  preSelectedMetric?: DeviceMetric
  /** Pre-selected mode（edit mode） */
  preSelectedMode?: DeviceParameterSourceType
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'parametersSelected', parameters: EnhancedParameter[]): void
  (e: 'parametersUpdated', data: { groupId: string; parameters: EnhancedParameter[] }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Current selection step：'mode' | 'selector' | 'completed'
const currentStep = ref<'mode' | 'selector' | 'completed'>('mode')

// Selected mode
const selectedMode = ref<DeviceParameterSourceType>('device-id')

// Is it in edit mode?
const isEditMode = computed(() => !!props.editingGroupId)

// Drawer title
const drawerTitle = computed(() => {
  if (isEditMode.value) {
    return 'Edit device parameter group'
  }

  switch (currentStep.value) {
    case 'mode':
      return 'Select parameter generation method'
    case 'selector':
      return getStepTitle()
    default:
      return 'Equipment parameter selection'
  }
})

/**
 * Get the current step title
 */
const getStepTitle = (): string => {
  switch (selectedMode.value) {
    case 'device-id':
      return 'equipmentIDselector'
    case 'device-metric':
      return 'Device Metrics Selector'
    case 'telemetry':
      return 'Telemetry data selector'
    default:
      return 'Device parameter selector'
  }
}

/**
 * Initialize edit mode
 */
const initEditMode = () => {
  if (isEditMode.value && props.preSelectedMode) {
    selectedMode.value = props.preSelectedMode
    currentStep.value = 'selector'
  } else {
    currentStep.value = 'mode'
  }
}

/**
 * Processing mode selection
 */
const handleModeSelected = (mode: DeviceParameterSourceType) => {
  selectedMode.value = mode
  currentStep.value = 'selector'
}

/**
 * processing equipmentIDSelect Done
 */
const handleDeviceIdSelected = (device: DeviceInfo) => {
  // Generate parameters
  const result = generateDeviceIdParameters(device)
  const parameters = convertToEnhancedParameters(result)

  // Register parameter group
  globalParameterGroupManager.addGroup(result.groupInfo)

  if (isEditMode.value) {
    // edit mode：emit update event
    emit('parametersUpdated', {
      groupId: props.editingGroupId!,
      parameters
    })
  } else {
    // New mode：emit selection event
    emit('parametersSelected', parameters)
  }

  closeDrawer()
}

/**
 * Processing device indicator selection completed
 */
const handleDeviceMetricSelected = (data: { device: DeviceInfo; metric: DeviceMetric }) => {
  // Generate parameters
  const result = generateDeviceMetricParameters(data.device, data.metric)
  const parameters = convertToEnhancedParameters(result)

  // Register parameter group
  globalParameterGroupManager.addGroup(result.groupInfo)

  if (isEditMode.value) {
    // edit mode：emit update event
    emit('parametersUpdated', {
      groupId: props.editingGroupId!,
      parameters
    })
  } else {
    // New mode：emit selection event
    emit('parametersSelected', parameters)
  }

  closeDrawer()
}

/**
 * Handle deselection
 */
const handleCancel = () => {
  if (currentStep.value === 'selector' && !isEditMode.value) {
    // Return to mode selection
    currentStep.value = 'mode'
  } else {
    // close drawer
    closeDrawer()
  }
}

/**
 * close drawer
 */
const closeDrawer = () => {
  emit('update:visible', false)
  // Delayed reset state，Avoid seeing state changes when animation is turned off
  nextTick(() => {
    currentStep.value = 'mode'
    selectedMode.value = 'device-id'
  })
}

/**
 * Monitor drawer display status
 */
const handleDrawerVisibilityChange = (visible: boolean) => {
  if (visible) {
    initEditMode()
  } else {
    emit('update:visible', false)
  }
}
</script>

<template>
  <n-drawer :show="visible" width="600" placement="right" @update:show="handleDrawerVisibilityChange">
    <n-drawer-content :title="drawerTitle" closable>
      <!-- Mode selection steps -->
      <DeviceSelectionModeChooser
        v-if="currentStep === 'mode'"
        :pre-selected-mode="selectedMode"
        @mode-selected="handleModeSelected"
        @cancel="handleCancel"
      />

      <!-- equipmentIDselector -->
      <DeviceIdSelector
        v-else-if="currentStep === 'selector' && selectedMode === 'device-id'"
        :pre-selected-device="preSelectedDevice"
        :edit-mode="isEditMode"
        @device-selected="handleDeviceIdSelected"
        @cancel="handleCancel"
      />

      <!-- Device Metrics Selector -->
      <DeviceMetricSelector
        v-else-if="currentStep === 'selector' && selectedMode === 'device-metric'"
        :pre-selected-device="preSelectedDevice"
        :pre-selected-metric="preSelectedMetric"
        :edit-mode="isEditMode"
        @selection-completed="handleDeviceMetricSelected"
        @cancel="handleCancel"
      />

      <!-- telemetry selector（reserved） -->
      <div
        v-else-if="currentStep === 'selector' && selectedMode === 'telemetry'"
        style="padding: 40px; text-align: center"
      >
        <n-text depth="3">Telemetry mode selector is under development，Stay tuned...</n-text>
        <div style="margin-top: 20px">
          <n-button @click="handleCancel">return</n-button>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<style scoped>
/* The drawer content style is handled by each sub-component. */
</style>
