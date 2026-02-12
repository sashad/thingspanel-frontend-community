<script setup lang="ts">
/**
 * AppChart configuration display block
 * Support configuration during previewAppend chart
 */

import { inject } from 'vue'
import type { Ref } from 'vue'
import { NCard, NButton, NEmpty, NAlert } from 'naive-ui'
import { $t } from '@/locales'

const templateData = inject<Ref<any>>('templateData')!

const handleConfigAppChart = () => {
  window.$message?.info($t('device_template.appChartConfigPending'))
}
</script>

<template>
  <div class="app-chart-section">
    <NAlert type="info" :show-icon="false" style="margin-bottom: 24px">
      <template #header>
        <div class="alert-title">💡 {{ $t('device_template.appChartTip') }}</div>
      </template>
      {{ $t('device_template.appChartTipContent') }}
    </NAlert>

    <NCard :bordered="false">
      <div class="chart-content">
        <NEmpty :description="$t('device_template.noAppChartConfigured')">
          <template #extra>
            <NButton type="primary" @click="handleConfigAppChart">
              {{ $t('device_template.configAppChart') }}
            </NButton>
          </template>
        </NEmpty>
      </div>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.app-chart-section {
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
