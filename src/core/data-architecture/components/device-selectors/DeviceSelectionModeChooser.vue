<!--
  Device selection mode selector
  Let the user choose which device selection mode to use
-->
<script setup lang="ts">
/**
 * DeviceSelectionModeChooser - Device selection mode selector
 * Let users3Choose from device selection modes of varying complexity
 */

import { ref } from 'vue'
import { NCard, NSpace, NText, NIcon, NButton, NRadioGroup, NRadio } from 'naive-ui'
import {
  PhonePortraitOutline as DeviceIcon,
  BarChartOutline as MetricIcon,
  RadioOutline as TelemetryIcon
} from '@vicons/ionicons5'
import type { DeviceParameterSourceType, DeviceSelectionMode } from '@/core/data-architecture/types/device-parameter-group'

interface Props {
  /** Pre-selected mode（Used when editing） */
  preSelectedMode?: DeviceParameterSourceType
}

interface Emits {
  (e: 'modeSelected', mode: DeviceParameterSourceType): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Currently selected mode
const selectedMode = ref<DeviceParameterSourceType>(props.preSelectedMode || 'device-id')

/**
 * Available selection mode configurations
 */
const availableModes: DeviceSelectionMode[] = [
  {
    mode: 'device-id',
    title: 'Simple mode：equipmentID',
    description: 'Select only devices，generatedeviceIdparameter',
    icon: 'device',
    enabled: true,
    expectedParams: 1
  },
  {
    mode: 'device-metric',
    title: 'indicator mode：equipment+index',
    description: 'Select device and indicator，generatedeviceId + metricparameter',
    icon: 'metric',
    enabled: true,
    expectedParams: 2
  },
  {
    mode: 'telemetry',
    title: 'telemetry mode：Flexible choice',
    description: 'Flexible selection of multiple parameters（Not open yet，Stay tuned）',
    icon: 'telemetry',
    enabled: false,
    expectedParams: 3
  }
]

/**
 * Get the modal icon component
 */
const getModeIcon = (iconType: string) => {
  const iconMap = {
    device: DeviceIcon,
    metric: MetricIcon,
    telemetry: TelemetryIcon
  }
  return iconMap[iconType as keyof typeof iconMap] || DeviceIcon
}

/**
 * Get mode color
 */
const getModeColor = (mode: DeviceParameterSourceType) => {
  const colorMap = {
    'device-id': '#2080f0',
    'device-metric': '#18a058',
    telemetry: '#f0a020'
  }
  return colorMap[mode]
}

/**
 * Confirm selection mode
 */
const confirmMode = () => {
  emit('modeSelected', selectedMode.value)
}

/**
 * Deselect
 */
const cancelSelection = () => {
  emit('cancel')
}
</script>

<template>
  <div class="mode-chooser">
    <!-- title -->
    <div class="chooser-header">
      <n-text strong style="font-size: 16px">Select parameter generation method</n-text>
      <n-text depth="3" style="font-size: 12px; margin-top: 4px">
        Different modes generate different numbers and types of parameters，Please select according to your needs
      </n-text>
    </div>

    <!-- Mode selection -->
    <div class="mode-selection">
      <n-radio-group v-model:value="selectedMode">
        <n-space vertical size="large">
          <div
            v-for="modeConfig in availableModes"
            :key="modeConfig.mode"
            class="mode-option"
            :class="{
              'mode-selected': selectedMode === modeConfig.mode,
              'mode-disabled': !modeConfig.enabled
            }"
          >
            <n-card :bordered="false" class="mode-card" :class="{ selected: selectedMode === modeConfig.mode }">
              <n-space align="center">
                <!-- radio button -->
                <n-radio :value="modeConfig.mode" :disabled="!modeConfig.enabled" />

                <!-- mode icon -->
                <n-icon size="24" :color="modeConfig.enabled ? getModeColor(modeConfig.mode) : '#ccc'">
                  <component :is="getModeIcon(modeConfig.icon)" />
                </n-icon>

                <!-- Mode information -->
                <div class="mode-info">
                  <n-text strong :class="{ 'text-disabled': !modeConfig.enabled }" style="font-size: 14px">
                    {{ modeConfig.title }}
                  </n-text>
                  <n-text
                    depth="3"
                    :class="{ 'text-disabled': !modeConfig.enabled }"
                    style="font-size: 12px; display: block; margin-top: 4px"
                  >
                    {{ modeConfig.description }}
                  </n-text>

                  <!-- Tips on the number of parameters -->
                  <div class="param-hint">
                    <n-text
                      :class="{ 'text-disabled': !modeConfig.enabled }"
                      style="font-size: 11px; color: var(--success-color)"
                    >
                      expected build {{ modeConfig.expectedParams }} parameters
                    </n-text>
                  </div>
                </div>

                <!-- disable flag -->
                <div v-if="!modeConfig.enabled" class="disabled-badge">
                  <n-text depth="3" style="font-size: 11px">Stay tuned</n-text>
                </div>
              </n-space>
            </n-card>
          </div>
        </n-space>
      </n-radio-group>
    </div>

    <!-- Select Preview -->
    <div class="selection-preview">
      <div v-if="selectedMode" class="preview-content">
        <n-text depth="3" style="font-size: 12px">
          Current selection：
          <strong>{{ availableModes.find(m => m.mode === selectedMode)?.title }}</strong>
        </n-text>
      </div>
    </div>

    <!-- Action button -->
    <div class="chooser-actions">
      <n-space justify="end">
        <n-button @click="cancelSelection">Cancel</n-button>
        <n-button
          type="primary"
          :disabled="!availableModes.find(m => m.mode === selectedMode)?.enabled"
          @click="confirmMode"
        >
          Next step
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<style scoped>
.mode-chooser {
  padding: 20px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chooser-header {
  margin-bottom: 8px;
}

.mode-selection {
  flex: 1;
}

.mode-option {
  position: relative;
  transition: all 0.3s ease;
}

.mode-card {
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.mode-card:hover:not(.mode-disabled .mode-card) {
  background-color: var(--hover-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.mode-card.selected {
  border-color: var(--primary-color);
  background-color: var(--primary-color-suppl);
}

.mode-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mode-disabled .mode-card {
  cursor: not-allowed;
}

.mode-info {
  flex: 1;
  margin-left: 12px;
}

.text-disabled {
  opacity: 0.5;
}

.param-hint {
  margin-top: 6px;
}

.disabled-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--warning-color);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
}

.selection-preview {
  margin: 16px 0;
  padding: 12px;
  background: var(--code-color);
  border-radius: 6px;
}

.chooser-actions {
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
</style>
