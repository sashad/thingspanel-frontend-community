<template>
  <div class="gauge-chart-setting">
    <n-space vertical :size="16">
      <!-- Data configuration -->
      <n-card title="📊 Data configuration" size="small" embedded>
        <n-space vertical :size="12">
          <n-form-item label="current value">
            <n-input-number
              v-model:value="localConfig.value"
              :min="0"
              :max="1000"
              @update:value="handleUpdate"
              placeholder="Please enter current value"
            />
          </n-form-item>
          <n-form-item label="minimum value">
            <n-input-number
              v-model:value="localConfig.min"
              @update:value="handleUpdate"
              placeholder="Please enter minimum value"
            />
          </n-form-item>
          <n-form-item label="maximum value">
            <n-input-number
              v-model:value="localConfig.max"
              @update:value="handleUpdate"
              placeholder="Please enter the maximum value"
            />
          </n-form-item>
          <n-form-item label="unit">
            <n-input
              v-model:value="localConfig.unit"
              @update:value="handleUpdate"
              placeholder="like：℃、%、RPM"
            />
          </n-form-item>
        </n-space>
      </n-card>

      <!-- Style configuration -->
      <n-card title="🎨 Style configuration" size="small" embedded>
        <n-space vertical :size="12">
          <n-form-item label="title">
            <n-input
              v-model:value="localConfig.title"
              @update:value="handleUpdate"
              placeholder="Please enter a title"
            />
          </n-form-item>
          <n-form-item label="title color">
            <n-color-picker
              v-model:value="localConfig.titleColor"
              @update:value="handleUpdate"
              :show-alpha="false"
            />
          </n-form-item>
          <n-form-item label="numerical color">
            <n-color-picker
              v-model:value="localConfig.valueColor"
              @update:value="handleUpdate"
              :show-alpha="false"
            />
          </n-form-item>
          <n-form-item label="Dashboard size">
            <n-input
              v-model:value="localConfig.radius"
              @update:value="handleUpdate"
              placeholder="like：75%"
            />
          </n-form-item>
          <n-form-item label="Pointer thickness">
            <n-input-number
              v-model:value="localConfig.thickness"
              :min="1"
              :max="50"
              @update:value="handleUpdate"
            />
          </n-form-item>
        </n-space>
      </n-card>

      <!-- Animation configuration -->
      <n-card title="⚡ Animation configuration" size="small" embedded>
        <n-form-item label="Animation duration（millisecond）">
          <n-input-number
            v-model:value="localConfig.animationDuration"
            :min="0"
            :max="5000"
            :step="100"
            @update:value="handleUpdate"
          />
        </n-form-item>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * Dashboard chart configuration panel
 * Parameters used to configure dashboard components
 */

import { ref, watch } from 'vue'
import {
  NSpace,
  NCard,
  NFormItem,
  NInput,
  NInputNumber,
  NColorPicker
} from 'naive-ui'
import type { GaugeChartCustomize } from './settingConfig'
import { customConfig } from './settingConfig'

interface Props {
  config?: GaugeChartCustomize
}

interface Emits {
  (e: 'update:config', config: GaugeChartCustomize): void
  (e: 'change', config: GaugeChartCustomize): void
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({ ...customConfig })
})

const emit = defineEmits<Emits>()

// local configuration copy
const localConfig = ref<GaugeChartCustomize>({ ...customConfig, ...props.config })

/**
 * Handle configuration updates
 */
const handleUpdate = () => {
  emit('update:config', { ...localConfig.value })
  emit('change', { ...localConfig.value })
}

/**
 * Monitor external configuration changes
 */
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig) {
      localConfig.value = { ...customConfig, ...newConfig }
    }
  },
  { deep: true }
)
</script>

<style scoped>
.gauge-chart-setting {
  padding: 12px;
}

:deep(.n-form-item) {
  margin-bottom: 0;
}

:deep(.n-form-item-label) {
  font-size: 13px;
  color: var(--text-color-2);
}
</style>
