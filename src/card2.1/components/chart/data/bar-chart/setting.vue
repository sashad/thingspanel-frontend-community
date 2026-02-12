<template>
  <n-space vertical :size="16">
    <!-- Basic configuration -->
    <n-card title="Basic configuration" size="small">
      <n-space vertical :size="12">
        <n-form-item label="Chart title">
          <n-input
            v-model:value="localConfig.title"
            placeholder="Data comparison"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="Show legend">
          <n-switch
            v-model:value="localConfig.showLegend"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="show label">
          <n-switch
            v-model:value="localConfig.showLabel"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="show grid">
          <n-switch
            v-model:value="localConfig.showGrid"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="column width">
          <n-input
            v-model:value="localConfig.barWidth"
            placeholder="60% or 20"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-space>
    </n-card>

    <!-- Axis configuration -->
    <n-card title="Axis configuration" size="small">
      <n-space vertical :size="12">
        <n-form-item label="Xaxis labels">
          <n-input
            v-model:value="localConfig.xAxisLabel"
            placeholder="category"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="Yaxis labels">
          <n-input
            v-model:value="localConfig.yAxisLabel"
            placeholder="numerical value"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-space>
    </n-card>

    <!-- Style configuration -->
    <n-card title="Style configuration" size="small">
      <n-space vertical :size="12">
        <n-form-item label="Bar color">
          <n-color-picker
            v-model:value="localConfig.barColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="Use gradient colors">
          <n-switch
            v-model:value="localConfig.barGradient"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item v-if="localConfig.barGradient" label="gradient end color">
          <n-color-picker
            v-model:value="localConfig.barGradientColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-space>
    </n-card>

    <!-- Animation configuration -->
    <n-card title="Animation configuration" size="small">
      <n-space vertical :size="12">
        <n-form-item label="Animation duration (ms)">
          <n-input-number
            v-model:value="localConfig.animationDuration"
            :min="0"
            :max="5000"
            :step="100"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="animation delay (ms)">
          <n-input-number
            v-model:value="localConfig.animationDelay"
            :min="0"
            :max="500"
            :step="10"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-space>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
/**
 * Bar chart component configuration panel
 */

import { ref, watch } from 'vue'
import { NSpace, NCard, NFormItem, NInput, NInputNumber, NSwitch, NColorPicker } from 'naive-ui'
import type { BarChartCustomize } from './settingConfig'

// Props and emits
const props = defineProps<{
  config: BarChartCustomize
}>()

const emit = defineEmits<{
  (e: 'update:config', config: BarChartCustomize): void
}>()

// local configuration
const localConfig = ref<BarChartCustomize>({ ...props.config })

// Configuration change handling
const handleConfigChange = () => {
  emit('update:config', { ...localConfig.value })
}

// Monitor external configuration changes
watch(
  () => props.config,
  (newConfig) => {
    localConfig.value = { ...newConfig }
  },
  { deep: true }
)
</script>
