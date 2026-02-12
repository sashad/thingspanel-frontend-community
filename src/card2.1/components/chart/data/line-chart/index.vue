<template>
  <div class="line-chart-container" ref="chartContainerRef">
    <div ref="chartRef" class="line-chart"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * Line chart component
 * use ECharts Implement line chart visualization
 */

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useCard2Props, type UnifiedCard2Configuration } from '@/card2.1/hooks'
import type { LineChartCustomize } from './settingConfig'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

// Component property interface
interface Props {
  config: LineChartCustomize
  data?: Record<string, unknown>
  componentId?: string
}

// Component events
interface Emits {
  (e: 'update:config', config: LineChartCustomize): void
  (e: 'update:unified-config', config: UnifiedCard2Configuration): void
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

const emit = defineEmits<Emits>()

// 🔥 key：use computed Package props.data
const { unifiedConfig, displayData } = useCard2Props({
  config: props.config,
  data: computed(() => props.data),
  componentId: props.componentId
})

// ECharts Instance and container references
const chartRef = ref<HTMLElement>()
const chartContainerRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// Calculate display data（Data source first）
const displayXData = computed(() => {
  const dataSourceXData = displayData.value?.main?.data?.xData
  return Array.isArray(dataSourceXData) ? dataSourceXData : ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']
})

const displayYData = computed(() => {
  const dataSourceYData = displayData.value?.main?.data?.yData
  return Array.isArray(dataSourceYData) ? dataSourceYData : [120, 200, 150, 80, 70, 110]
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
    title: {
      text: config.title || 'Data trends',
      left: 'center',
      textStyle: {
        color: 'var(--text-color-1, #333)',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      show: config.showLegend ?? true,
      bottom: 10,
      textStyle: {
        color: 'var(--text-color-2, #666)'
      }
    },
    grid: {
      show: config.showGrid ?? true,
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: displayXData.value,
      name: config.xAxisLabel || 'time',
      nameTextStyle: {
        color: 'var(--text-color-2, #666)'
      },
      axisLabel: {
        color: 'var(--text-color-2, #666)'
      }
    },
    yAxis: {
      type: 'value',
      name: config.yAxisLabel || 'numerical value',
      nameTextStyle: {
        color: 'var(--text-color-2, #666)'
      },
      axisLabel: {
        color: 'var(--text-color-2, #666)'
      },
      splitLine: {
        lineStyle: {
          color: 'var(--divider-color, #e0e0e0)'
        }
      }
    },
    series: [
      {
        name: config.title || 'data',
        type: 'line',
        smooth: config.smooth ?? true,
        data: displayYData.value,
        symbol: config.showDataPoints ? 'circle' : 'none',
        symbolSize: config.dataPointSize || 6,
        itemStyle: {
          color: config.lineColor || '#5470c6'
        },
        lineStyle: {
          color: config.lineColor || '#5470c6',
          width: 2
        },
        areaStyle: config.showArea
          ? {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: config.areaColor || 'rgba(84, 112, 198, 0.3)' },
                { offset: 1, color: 'rgba(84, 112, 198, 0.05)' }
              ])
            }
          : undefined
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

// Monitor display data changes
watch([displayXData, displayYData], () => {
  nextTick(() => {
    updateChart()
  })
})

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
.line-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--card-color, #ffffff);
  border-radius: 4px;
  overflow: hidden;
}

.line-chart {
  flex: 1;
  width: 100%;
  min-height: 300px;
}
</style>
