<template>
  <n-space vertical :size="16">
    <n-card title="Basic configuration" size="small">
      <n-space vertical :size="12">
        <n-form-item label="Chart title">
          <n-input
            v-model:value="localConfig.title"
            placeholder="Data distribution"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="Show legend">
          <n-switch
            v-model:value="localConfig.showLegend"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-space>
    </n-card>

    <n-card title="Pie chart configuration" size="small">
      <n-space vertical :size="12">
        <n-form-item label="donut chart pattern">
          <n-switch
            v-model:value="localConfig.isDonut"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="outer radius">
          <n-input
            v-model:value="localConfig.radius"
            placeholder="70%"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item v-if="localConfig.isDonut" label="inner radius">
          <n-input
            v-model:value="localConfig.innerRadius"
            placeholder="40%"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-space>
    </n-card>

    <n-card title="Label configuration" size="small">
      <n-space vertical :size="12">
        <n-form-item label="show label">
          <n-switch
            v-model:value="localConfig.showLabel"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item v-if="localConfig.showLabel" label="label position">
          <n-radio-group
            v-model:value="localConfig.labelPosition"
            @update:value="handleConfigChange"
          >
            <n-radio value="outside">external</n-radio>
            <n-radio value="inside">internal</n-radio>
            <n-radio value="center">center</n-radio>
          </n-radio-group>
        </n-form-item>
      </n-space>
    </n-card>

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
import { ref, watch } from 'vue'
import { NSpace, NCard, NFormItem, NInput, NInputNumber, NSwitch, NRadioGroup, NRadio } from 'naive-ui'
import type { PieChartCustomize } from './settingConfig'

const props = defineProps<{
  config: PieChartCustomize
}>()

const emit = defineEmits<{
  (e: 'update:config', config: PieChartCustomize): void
}>()

const localConfig = ref<PieChartCustomize>({ ...props.config })

const handleConfigChange = () => {
  emit('update:config', { ...localConfig.value })
}

watch(
  () => props.config,
  (newConfig) => {
    localConfig.value = { ...newConfig }
  },
  { deep: true }
)
</script>
