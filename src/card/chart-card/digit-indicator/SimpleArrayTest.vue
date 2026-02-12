<template>
  <div class="simple-array-test">
    <n-card title="Simple array data test" size="small">
      <n-space vertical>
        <!-- Test instructions -->
        <n-alert type="info" title="Simple array test">
          <template #default>
            <p>test digit-indicator Component processing of simple array data</p>
          </template>
        </n-alert>

        <!-- test button -->
        <n-space>
          <n-button type="primary" @click="sendSimpleArray">Send simple array [25.6]</n-button>
          <n-button type="success" @click="sendObjectArray">Send array of objects [{value: 72.3, unit: '%'}]</n-button>
        </n-space>

        <!-- Digit Indicator components -->
        <n-divider title-placement="left">Digit Indicator components</n-divider>

        <div class="component-container">
          <component :is="digitIndicatorComponent" ref="digitIndicatorRef" :card="cardData" />
        </div>

        <!-- Current display value -->
        <n-divider title-placement="left">Current display value</n-divider>

        <n-card size="small">
          <div>detail.value: {{ currentDetailValue }}</div>
          <div>unit.value: {{ currentUnitValue }}</div>
        </n-card>

        <!-- log -->
        <n-divider title-placement="left">Processing logs</n-divider>

        <n-card size="small" class="log-card">
          <div class="log-content">
            <div v-for="(log, index) in logs" :key="index" class="log-item">
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NCard, NSpace, NDivider, NButton, NAlert } from 'naive-ui'
import digitIndicatorComponent from './component.vue'

// card data
const cardData = ref({
  config: {
    color: '#1890ff',
    iconName: 'Water',
    unit: '%'
  },
  dataSource: {
    deviceSource: [
      {
        deviceId: 'test_device_001',
        metricsId: 'test_metric',
        metricsName: 'Test indicators',
        metricsType: 'telemetry'
      }
    ]
  }
})

// component reference
const digitIndicatorRef = ref<any>(null)

// log
const logs = ref<Array<{ timestamp: string; message: string }>>([])

// Current display value（Get via computed property）
const currentDetailValue = computed(() => {
  return digitIndicatorRef.value?.detail || 'not set'
})

const currentUnitValue = computed(() => {
  return digitIndicatorRef.value?.unit || 'not set'
})

const addLog = (message: string) => {
  logs.value.push({
    timestamp: new Date().toISOString(),
    message
  })
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

// Test data sending
const sendSimpleArray = () => {
  if (!digitIndicatorRef.value) {
    addLog('Component not loaded')
    return
  }

  const data = {
    test_metric: [25.6]
  }

  digitIndicatorRef.value.updateData('test_device_001', 'test_metric', data)
  addLog(`Send simple array: ${JSON.stringify(data)}`)
}

const sendObjectArray = () => {
  if (!digitIndicatorRef.value) {
    addLog('Component not loaded')
    return
  }

  const data = {
    test_metric: [{ value: 72.3, unit: '%' }]
  }

  digitIndicatorRef.value.updateData('test_device_001', 'test_metric', data)
  addLog(`Send array of objects: ${JSON.stringify(data)}`)
}
</script>

<style scoped>
.simple-array-test {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.component-container {
  width: 300px;
  height: 200px;
  margin: 0 auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.log-card {
  max-height: 200px;
}

.log-content {
  max-height: 150px;
  overflow-y: auto;
}

.log-item {
  padding: 4px 8px;
  margin-bottom: 2px;
  border-radius: 4px;
  background: #f8f9fa;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.log-time {
  color: #666;
  margin-right: 8px;
}

.log-message {
  font-weight: 500;
}
</style>
