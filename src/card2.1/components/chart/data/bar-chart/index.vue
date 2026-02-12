<template>
  <div class="bar-chart-container" ref="chartContainerRef">
    <div ref="chartRef" class="bar-chart"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * Bar chart component
 * use ECharts Implement histogram visualization
 */

import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useCard2Props, type UnifiedCard2Configuration } from '@/card2.1/hooks'
import type { BarChartCustomize } from './settingConfig'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

// Component property interface
interface Props {
  config: BarChartCustomize
  data?: Record<string, unknown>
  componentId?: string
}

// Component events
interface Emits {
  (e: 'update:config', config: BarChartCustomize): void
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
  return Array.isArray(dataSourceXData) ? dataSourceXData : ['on Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
})

const displayYData = computed(() => {
  const dataSourceYData = displayData.value?.main?.data?.yData
  return Array.isArray(dataSourceYData) ? dataSourceYData : [120, 200, 150, 80, 70, 110, 130]
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
      text: config.title || 'Data comparison',
      left: 'center',
      textStyle: {
        color: 'var(--text-color-1, #333)',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
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
      name: config.xAxisLabel || 'category',
      nameTextStyle: {
        color: 'var(--text-color-2, #666)'
      },
      axisLabel: {
        color: 'var(--text-color-2, #666)'
      },
      axisTick: {
        alignWithLabel: true
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
        type: 'bar',
        barWidth: config.barWidth || '60%',
        data: displayYData.value,
        label: {
          show: config.showLabel ?? false,
          position: 'top',
          color: 'var(--text-color-1, #333)',
          fontSize: 12
        },
        itemStyle: {
          color: config.barGradient
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: config.barColor || '#5470c6' },
                { offset: 1, color: config.barGradientColor || '#91cc75' }
              ])
            : (config.barColor || '#5470c6'),
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      }
    ],
    animationDuration: config.animationDuration || 1000,
    animationDelay: (idx: number) => {
      return (config.animationDelay || 50) * idx
    },
    animationEasing: 'elasticOut'
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
.bar-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--card-color, #ffffff);
  border-radius: 4px;
  overflow: hidden;
}

.bar-chart {
  flex: 1;
  width: 100%;
  min-height: 300px;
}
</style>
