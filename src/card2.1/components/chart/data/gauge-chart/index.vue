<template>
  <div class="gauge-chart-container" ref="chartContainerRef">
    <div ref="chartRef" class="gauge-chart"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * Dashboard chart component
 * use ECharts Implement circular dashboard visualization
 */

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useCard2Props, type UnifiedCard2Configuration } from '@/card2.1/hooks'
import type { GaugeChartCustomize } from './settingConfig'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

// Component property interface
interface Props {
  config: GaugeChartCustomize
  data?: Record<string, unknown>
  componentId?: string
}

// Component events
interface Emits {
  (e: 'update:config', config: GaugeChartCustomize): void
  (e: 'update:unified-config', config: UnifiedCard2Configuration): void
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

const emit = defineEmits<Emits>()

// use Card2 Unified configuration hook
// 🔥 critical fix：dataMust be passed incomputedto respondprops.datachange
const { unifiedConfig, displayData } = useCard2Props({
  config: props.config,
  data: computed(() => props.data),
  componentId: props.componentId
})

// ECharts Instance and container references
const chartRef = ref<HTMLElement>()
const chartContainerRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// Calculate display value（Data source first）
const displayValue = computed(() => {
  // 🔥 repair：The data source structure is { main: { data: { value, unit, ... } } }
  // Prefer data source values，Otherwise use configuration value
  const dataSourceValue = displayData.value?.main?.data?.value
  return Number(dataSourceValue ?? unifiedConfig.value.component?.value ?? 75)
})

const displayMin = computed(() => {
  const dataSourceMin = displayData.value?.main?.data?.min
  return Number(dataSourceMin ?? unifiedConfig.value.component?.min ?? 0)
})

const displayMax = computed(() => {
  const dataSourceMax = displayData.value?.main?.data?.max
  return Number(dataSourceMax ?? unifiedConfig.value.component?.max ?? 100)
})

const displayTitle = computed(() => {
  const dataSourceTitle = displayData.value?.main?.data?.metricsName
  return String(dataSourceTitle ?? unifiedConfig.value.component?.title ?? 'Data indicators')
})

// Calculate percentage
const percentage = computed(() => {
  const range = displayMax.value - displayMin.value
  if (range === 0) return 0
  return ((displayValue.value - displayMin.value) / range) * 100
})

/**
 * initialization ECharts Example
 */
const initChart = () => {
  if (!chartRef.value) return

  // If an instance already exists，Destroy first
  if (chartInstance) {
    chartInstance.dispose()
  }

  // Create new instance
  chartInstance = echarts.init(chartRef.value)

  // Update chart
  updateChart()
}

/**
 * Update chart configuration
 */
const updateChart = () => {
  if (!chartInstance) return

  const config = unifiedConfig.value.component || {}

  const option: EChartsOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: displayMin.value,
        max: displayMax.value,
        radius: config.radius || '75%',
        center: ['50%', '70%'],
        splitNumber: 8,
        axisLine: {
          lineStyle: {
            width: config.thickness || 10,
            color: [
              [0.25, '#5470c6'],
              [0.5, '#91cc75'],
              [0.75, '#fac858'],
              [1, '#ee6666']
            ]
          }
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '60%',
          width: 8,
          offsetCenter: [0, '-60%'],
          itemStyle: {
            color: 'auto'
          }
        },
        axisTick: {
          length: 8,
          lineStyle: {
            color: 'auto',
            width: 1
          }
        },
        splitLine: {
          length: 12,
          lineStyle: {
            color: 'auto',
            width: 2
          }
        },
        axisLabel: {
          color: '#464646',
          fontSize: 12,
          distance: -40,
          formatter: function (value: number) {
            return value.toFixed(0)
          }
        },
        title: {
          offsetCenter: [0, '-20%'],
          fontSize: 16,
          color: config.titleColor || '#333333',
          fontWeight: 'bold'
        },
        detail: {
          fontSize: 24,
          offsetCenter: [0, '0%'],
          valueAnimation: true,
          formatter: function (value: number) {
            return value.toFixed(1) + (config.unit || '')
          },
          color: config.valueColor || '#1890ff',
          fontWeight: 'bold'
        },
        data: [
          {
            value: displayValue.value,
            name: displayTitle.value
          }
        ]
      }
    ],
    animationDuration: config.animationDuration || 1000,
    animationEasing: 'cubicInOut'
  }

  chartInstance.setOption(option, true)
}

/**
 * Handling window size changes
 */
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// Listen for configuration changes
watch(
  () => unifiedConfig.value.component,
  () => {
    nextTick(() => {
      updateChart()
    })
  },
  { deep: true }
)

// Monitor data changes
watch(
  () => props.data,
  () => {
    nextTick(() => {
      updateChart()
    })
  },
  { deep: true }
)

// Monitor display value changes
watch(
  [displayValue, displayMin, displayMax, displayTitle],
  () => {
    nextTick(() => {
      updateChart()
    })
  }
)

// Component mounting
onMounted(() => {
  nextTick(() => {
    initChart()
  })

  // Listen for window size changes
  window.addEventListener('resize', handleResize)

  // use ResizeObserver Monitor container size changes
  if (chartContainerRef.value) {
    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(chartContainerRef.value)
  }
})

// Component uninstallation
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)

  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.gauge-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: var(--card-color, #ffffff);
  border-radius: 4px;
  overflow: hidden;
}

.gauge-chart {
  flex: 1;
  width: 100%;
  min-height: 200px;
}
</style>
