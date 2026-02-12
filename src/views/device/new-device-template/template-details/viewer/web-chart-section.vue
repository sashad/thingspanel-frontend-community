<script setup lang="ts">
/**
 * WebChart configuration display block
 * Support configuration during previewWebend chart
 */

import { inject } from 'vue'
import type { Ref } from 'vue'
import { NCard, NButton, NEmpty, NAlert } from 'naive-ui'
import { $t } from '@/locales'

const templateData = inject<Ref<any>>('templateData')!

const handleConfigWebChart = () => {
  window.$message?.info($t('device_template.webChartConfigPending'))
}
</script>

<template>
  <div class="web-chart-section">
    <NAlert type="info" :show-icon="false" style="margin-bottom: 24px">
      <template #header>
        <div class="alert-title">💡 {{ $t('device_template.webChartTip') }}</div>
      </template>
      {{ $t('device_template.webChartTipContent') }}
    </NAlert>

    <NCard :bordered="false">
      <div class="chart-content">
        <NEmpty :description="$t('device_template.noWebChartConfigured')">
          <template #extra>
            <NButton type="primary" @click="handleConfigWebChart">
              {{ $t('device_template.configWebChart') }}
            </NButton>
          </template>
        </NEmpty>
      </div>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.web-chart-section {
  padding: 20px;
}

.alert-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.chart-content {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
