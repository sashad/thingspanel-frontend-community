# System Monitoring Component Unified Migration Guide

## 📋 Overview

This document provides a unified migration plan for the three components related to system monitoring.：
- `cpu-usage` - CPUUsage rate
- `memory-usage` - memory usage  
- `disk-usage` - Disk usage

These three component structures**exactly the same**，There are only differences in data fields and display colors，yes**Best candidate for merge refactoring**。

## 🔍 component analysis

### common characteristics
```vue
<!-- exactly the same structural pattern -->
<template>
  <GradientBg :start-color="color1" :end-color="color2">
    <h3>{{ $t('card.xxxUsage') }}</h3>
    <div class="flex justify-between items-center pt-30px">
      <SvgIcon :icon="iconName" />
      <CountTo 
        :end-value="value" 
        :suffix="unit" 
        :loading="loading"
      />
    </div>
  </GradientBg>
</template>
```

### commonAPI
All three components call the sameAPIinterface：
```typescript
getSystemMetricsCurrent(): Promise<{
  data: {
    cpu_usage: number     // CPUUtilization percentage
    memory_usage: number  // Memory usage percentage  
    disk_usage: number    // Disk usage percentage
  }
}>
```

### common logic
1. **30Refresh every second**
2. **Percent display** (unit: %)
3. **Loading state management**
4. **Error handling and logging**
5. **lifecycle cleanup**

### only difference
| components | data fields | icon | gradient color | internationalizationkey |
|------|----------|------|--------|-----------|
| CPU | `cpu_usage` | `fa-microchip` | `#4ade80` → `#22c55e` | `card.cpuUsage` |
| Memory | `memory_usage` | `fa-memory` | `#f59e0b` → `#d97706` | `card.memoryUsage` |
| Disk | `disk_usage` | `fa-hdd` | `#6366f1` → `#4f46e5` | `card.diskUsage` |

## 🎯 merge strategy

### Solution selection：Common system indicator components
Create a `SystemMetricCard` components，Support different system indicator display through configuration。

### Consolidated earnings
- **Reduce code size**: 3components → 1components + 3configuration
- **Unified maintenance**: Modifying one place affects all indicators
- **Strong scalability**: Easily add new system metrics
- **consistency**: Ensure that all indicators display in a unified style

## 🚀 Specific implementation plan

### Phase 1: Create a common system indicator component

#### 1.1 Component definition
```typescript
// src/card2.1/components/system-metric-card/component-definition.ts
import type { ComponentDefinition } from '@/card2.1/core/types'

export const systemMetricCardDefinition: ComponentDefinition = {
  type: 'SystemMetricCard',
  name: 'System indicator card',
  description: 'Statistics card showing system resource usage',
  category: 'system-monitoring',
  
  // data requirements
  dataRequirement: {
    fields: {
      systemMetrics: {
        type: 'object',
        required: true,
        description: 'System indicator data',
        properties: {
          cpu_usage: { type: 'number', description: 'CPUUsage rate' },
          memory_usage: { type: 'number', description: 'memory usage' },
          disk_usage: { type: 'number', description: 'Disk usage' }
        }
      }
    }
  },
  
  // Configuration options
  config: {
    metricType: {
      type: 'select',
      options: [
        { label: 'CPUUsage rate', value: 'cpu' },
        { label: 'memory usage', value: 'memory' },
        { label: 'Disk usage', value: 'disk' }
      ],
      default: 'cpu',
      label: 'Indicator type'
    },
    title: {
      type: 'string',
      default: '',
      label: 'Custom title'
    },
    icon: {
      type: 'icon-picker',
      default: '',
      label: 'Custom icon'
    },
    gradientColors: {
      type: 'color-pair',
      default: ['#3b82f6', '#1d4ed8'],
      label: 'gradient color'
    },
    refreshInterval: {
      type: 'number',
      default: 30,
      label: 'refresh interval(Second)'
    },
    warningThreshold: {
      type: 'number',
      default: 80,
      label: 'warning threshold(%)'
    },
    criticalThreshold: {
      type: 'number',
      default: 90,
      label: 'severe threshold(%)'
    }
  }
}
```

#### 1.2 Component implementation
```vue
<!-- src/card2.1/components/system-metric-card/SystemMetricCard.vue -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCard2DataBinding } from '@/card2.1/hooks/useCard2DataBinding'
import { GradientBg } from '@/components/common/gradient-bg'

interface Props {
  config: {
    metricType: 'cpu' | 'memory' | 'disk'
    title?: string
    icon?: string
    gradientColors?: [string, string]
    refreshInterval?: number
    warningThreshold?: number
    criticalThreshold?: number
  }
  dataBinding?: any
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    metricType: 'cpu',
    refreshInterval: 30,
    warningThreshold: 80,
    criticalThreshold: 90,
    gradientColors: ['#3b82f6', '#1d4ed8']
  })
})

const { t } = useI18n()

// Card 2.1 data binding
const { data, loading, error } = useCard2DataBinding({
  componentType: 'SystemMetricCard',
  dataBinding: props.dataBinding
})

// Indicator configuration mapping
const metricConfigs = {
  cpu: {
    dataKey: 'cpu_usage',
    defaultTitle: 'card.cpuUsage',
    defaultIcon: 'fa-microchip',
    defaultColors: ['#4ade80', '#22c55e'] as [string, string]
  },
  memory: {
    dataKey: 'memory_usage', 
    defaultTitle: 'card.memoryUsage',
    defaultIcon: 'fa-memory',
    defaultColors: ['#f59e0b', '#d97706'] as [string, string]
  },
  disk: {
    dataKey: 'disk_usage',
    defaultTitle: 'card.diskUsage', 
    defaultIcon: 'fa-hdd',
    defaultColors: ['#6366f1', '#4f46e5'] as [string, string]
  }
}

// Current indicator configuration
const currentConfig = computed(() => metricConfigs[props.config.metricType])

// Display value
const displayValue = computed(() => {
  if (loading.value || error.value) return 0
  const metrics = data.value?.systemMetrics
  if (!metrics) return 0
  
  const value = metrics[currentConfig.value.dataKey]
  return typeof value === 'number' ? Math.round(value * 10) / 10 : 0
})

// show title
const displayTitle = computed(() => {
  return props.config.title || t(currentConfig.value.defaultTitle)
})

// show icon
const displayIcon = computed(() => {
  return props.config.icon || currentConfig.value.defaultIcon
})

// Display color
const displayColors = computed(() => {
  return props.config.gradientColors || currentConfig.value.defaultColors
})

// Status judgment
const status = computed(() => {
  const value = displayValue.value
  const { criticalThreshold = 90, warningThreshold = 80 } = props.config
  
  if (value >= criticalThreshold) return 'critical'
  if (value >= warningThreshold) return 'warning'
  return 'normal'
})

// status color
const statusColors = computed(() => {
  switch (status.value) {
    case 'critical':
      return ['#ef4444', '#dc2626'] as [string, string]
    case 'warning':
      return ['#f59e0b', '#d97706'] as [string, string]
    default:
      return displayColors.value
  }
})

// Dynamic refresh timer
const refreshTimer = ref<number | null>(null)

const setupRefreshTimer = () => {
  if (props.config.refreshInterval && props.config.refreshInterval > 0) {
    refreshTimer.value = window.setInterval(() => {
      // Trigger data refresh
      if (props.dataBinding?.refresh) {
        props.dataBinding.refresh()
      }
    }, props.config.refreshInterval * 1000)
  }
}

const clearRefreshTimer = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

onMounted(() => {
  setupRefreshTimer()
})

onUnmounted(() => {
  clearRefreshTimer()
})
</script>

<template>
  <GradientBg 
    class="system-metric-card"
    :start-color="statusColors[0]"
    :end-color="statusColors[1]"
  >
    <!-- title -->
    <h3 class="title">{{ displayTitle }}</h3>
    
    <!-- content area -->
    <div class="content">
      <!-- icon -->
      <SvgIcon 
        :icon="displayIcon"
        class="metric-icon"
      />
      
      <!-- Numerical display -->
      <div class="value-container">
        <CountTo
          v-if="!loading && !error"
          :start-value="0"
          :end-value="displayValue"
          suffix="%"
          :duration="1500"
          class="metric-value"
        />
        
        <!-- Loading status -->
        <div v-else-if="loading" class="loading-value">
          <n-spin size="small" />
        </div>
        
        <!-- error status -->
        <div v-else class="error-value">
          <span class="error-text">{{ t('card.noData') }}</span>
        </div>
        
        <!-- status indication -->
        <div v-if="!loading && !error" class="status-indicator">
          <n-tag
            :type="status === 'critical' ? 'error' : status === 'warning' ? 'warning' : 'success'"
            size="small"
            round
          >
            {{ status === 'critical' ? t('common.critical') : 
               status === 'warning' ? t('common.warning') : t('common.normal') }}
          </n-tag>
        </div>
      </div>
    </div>
  </GradientBg>
</template>

<style scoped>
.system-metric-card {
  width: 100%;
  height: 100%;
  min-height: 120px;
  position: relative;
}

.title {
  font-size: 16px;
  font-weight: 500;
  color: white;
  margin: 0 0 20px 0;
}

.content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: calc(100% - 40px);
}

.metric-icon {
  font-size: 32px;
  color: rgba(255, 255, 255, 0.8);
}

.value-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.metric-value {
  font-size: 30px;
  font-weight: bold;
  color: white;
  line-height: 1;
}

.loading-value,
.error-value {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.7);
}

.error-text {
  font-size: 14px;
}

.status-indicator {
  opacity: 0.9;
}

/* Responsive adaptation */
@media (max-width: 480px) {
  .content {
    flex-direction: column;
    justify-content: center;
    gap: 16px;
  }
  
  .value-container {
    align-items: center;
  }
}
</style>
```

### Phase 2: Create a preset configuration

#### 2.1 CPUUsage default
```typescript
// src/card2.1/components/system-metric-card/presets/cpu-usage.ts
import type { ComponentPreset } from '@/card2.1/core/types'
import { systemMetricsDataSource } from '../data-sources/system-metrics'

export const cpuUsagePreset: ComponentPreset = {
  id: 'cpu-usage-metric',
  name: 'CPUUsage rate',
  description: 'display systemCPUUsage rate',
  
  config: {
    metricType: 'cpu',
    gradientColors: ['#4ade80', '#22c55e'],
    refreshInterval: 30,
    warningThreshold: 75,
    criticalThreshold: 90
  },
  
  dataBinding: {
    dataSources: [systemMetricsDataSource],
    updateTriggers: ['mount', 'timer'],
    timerConfig: {
      interval: 30000
    }
  },
  
  defaultLayout: {
    canvas: { width: 300, height: 180 },
    gridstack: { w: 3, h: 2, minH: 2, minW: 2 }
  }
}
```

#### 2.2 Memory usage default
```typescript
// src/card2.1/components/system-metric-card/presets/memory-usage.ts
export const memoryUsagePreset: ComponentPreset = {
  id: 'memory-usage-metric',
  name: 'memory usage',
  description: 'Display system memory usage',
  
  config: {
    metricType: 'memory',
    gradientColors: ['#f59e0b', '#d97706'],
    refreshInterval: 30,
    warningThreshold: 80,
    criticalThreshold: 95
  },
  
  dataBinding: {
    dataSources: [systemMetricsDataSource],
    updateTriggers: ['mount', 'timer'],
    timerConfig: {
      interval: 30000
    }
  },
  
  defaultLayout: {
    canvas: { width: 300, height: 180 },
    gridstack: { w: 3, h: 2, minH: 2, minW: 2 }
  }
}
```

#### 2.3 Disk usage default
```typescript
// src/card2.1/components/system-metric-card/presets/disk-usage.ts
export const diskUsagePreset: ComponentPreset = {
  id: 'disk-usage-metric',
  name: 'Disk usage',
  description: 'Display system disk usage',
  
  config: {
    metricType: 'disk',
    gradientColors: ['#6366f1', '#4f46e5'],
    refreshInterval: 60,  // Disk changes slowly，Can60Refresh in seconds
    warningThreshold: 85,
    criticalThreshold: 95
  },
  
  dataBinding: {
    dataSources: [systemMetricsDataSource],
    updateTriggers: ['mount', 'timer'],
    timerConfig: {
      interval: 60000
    }
  },
  
  defaultLayout: {
    canvas: { width: 300, height: 180 },
    gridstack: { w: 3, h: 2, minH: 2, minW: 2 }
  }
}
```

#### 2.4 Data source configuration
```typescript
// src/card2.1/components/system-metric-card/data-sources/system-metrics.ts
import { getSystemMetricsCurrent } from '@/service/api/system-data'
import type { DataSourceConfig } from '@/card2.1/core/data-binding/types'

export const systemMetricsDataSource: DataSourceConfig = {
  type: 'api',
  name: 'System indicator data',
  description: 'GetCPU、Memory、Disk usage data',
  
  config: {
    endpoint: getSystemMetricsCurrent,
    
    // data conversion
    transform: (response: any) => ({
      systemMetrics: {
        cpu_usage: response?.data?.cpu_usage || 0,
        memory_usage: response?.data?.memory_usage || 0,
        disk_usage: response?.data?.disk_usage || 0
      }
    }),
    
    // Error handling
    errorHandler: (error: any) => {
      console.error('Failed to obtain system indicators:', error)
      return {
        systemMetrics: {
          cpu_usage: 0,
          memory_usage: 0,
          disk_usage: 0
        }
      }
    },
    
    // Cache configuration
    cache: {
      enabled: true,
      ttl: 15000  // 15second cache，Avoid frequent requests
    }
  }
}
```

## ✅ Migration verification checklist

### Functional equivalence verification
- [ ] **CPUindex**: Values ​​are displayed correctly，30Refresh in seconds is normal
- [ ] **Memory metrics**: Values ​​are displayed correctly，30Refresh in seconds is normal  
- [ ] **Disk metrics**: Values ​​are displayed correctly，60Refresh in seconds is normal
- [ ] **gradient background**: The colors of the three indicators are consistent with the original components
- [ ] **Icon display**: The icon type and size are consistent with the original component
- [ ] **numerical animation**: CountToAnimation effect is normal
- [ ] **Loading status**: Shown when data is loadingloading
- [ ] **Error handling**: APIShow downgraded content on error
- [ ] **timer cleanup**: Correctly clean up timers when components are destroyed

### Enhanced feature verification
- [ ] **threshold warning**: Exceed warning/Color and label changes at critical threshold
- [ ] **status indication**: Display normal/warn/critical status label
- [ ] **Custom configuration**: Support custom title、icon、color
- [ ] **Responsive**: Mobile display adapts well
- [ ] **Theme adaptation**: Displays normally under light and dark themes

## 🎯 expected return

### Code maintenance
- **code reduction**: from285lines of code → about100row component + Configuration
- **Maintain unity**: Unified logic and error handling
- **Easy to extend**: To add a new indicator, you only need to add a new configuration

### Function enhancement  
- **Smart threshold**: Automatically adjust display colors based on usage
- **status label**: Visual display of system health status
- **Flexible configuration**: Support custom refresh intervals and thresholds

### user experience
- **consistency**: All system indicators display in a unified style
- **intuitiveness**: Color coding lets users quickly identify issues
- **real-time**: Optimized refresh mechanism and caching strategy

This merger plan will3highly repetitive components are integrated into1A powerful common component，Significantly improved code quality and maintenance efficiency，while enhancing functionality。