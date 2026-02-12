<template>
  <n-space vertical :size="16">
    <!-- Basic configuration -->
    <n-card title="Basic configuration" size="small">
      <n-space vertical :size="12">
        <n-form-item label="Chart title">
          <n-input
            v-model:value="localConfig.title"
            placeholder="Data trends"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="Show legend">
          <n-switch
            v-model:value="localConfig.showLegend"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="smooth curve">
          <n-switch
            v-model:value="localConfig.smooth"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="display area">
          <n-switch
            v-model:value="localConfig.showArea"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="show grid">
          <n-switch
            v-model:value="localConfig.showGrid"
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
            placeholder="time"
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
        <n-form-item label="line color">
          <n-color-picker
            v-model:value="localConfig.lineColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="area color">
          <n-color-picker
            v-model:value="localConfig.areaColor"
            :show-alpha="true"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="Show data points">
          <n-switch
            v-model:value="localConfig.showDataPoints"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item v-if="localConfig.showDataPoints" label="data point size">
          <n-input-number
            v-model:value="localConfig.dataPointSize"
            :min="2"
            :max="20"
            :step="1"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-space>
    </n-card>

    <!-- Animation configuration -->
    <n-card title="Animation configuration" size="small">
      <n-form-item label="Animation duration (ms)">
        <n-input-number
          v-model:value="localConfig.animationDuration"
          :min="0"
          :max="5000"
          :step="100"
          @update:value="handleConfigChange"
        />
      </n-form-item>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
/**
 * Line chart component configuration panel
 */

import { ref, watch } from 'vue'
import { NSpace, NCard, NFormItem, NInput, NInputNumber, NSwitch, NColorPicker } from 'naive-ui'
import type { LineChartCustomize } from './settingConfig'

// Props and emits
const props = defineProps<{
  config: LineChartCustomize
}>()

const emit = defineEmits<{
  (e: 'update:config', config: LineChartCustomize): void
}>()

// local configuration
const localConfig = ref<LineChartCustomize>({ ...props.config })

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
