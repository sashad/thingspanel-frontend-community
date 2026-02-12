<template>
  <div class="array-data-test">
    <n-card title="Digit Indicator Array data test" size="small">
      <n-space vertical>
        <!-- Test instructions -->
        <n-alert type="info" title="Array data processing test">
          <template #default>
            <p>test digit-indicator Component's ability to handle various array data formats</p>
            <p>include：simple array、object array、Nested arrays etc.</p>
          </template>
        </n-alert>

        <!-- Test data selection -->
        <n-divider title-placement="left">test data</n-divider>

        <n-space>
          <n-button type="primary" @click="sendSimpleArray">simple array [25.6, 30.2]</n-button>
          <n-button type="success" @click="sendObjectArray">object array [{value: 72.3, unit: '%'}]</n-button>
          <n-button type="warning" @click="sendNestedArray">Nested array [{data: {value: 58.7}}]</n-button>
          <n-button type="error" @click="sendComplexArray">complex array [{temp: 25.6}, {humidity: 60.2}]</n-button>
        </n-space>

        <!-- Digit Indicator components -->
        <n-divider title-placement="left">Digit Indicator components</n-divider>

        <div class="component-container">
          <component :is="digitIndicatorComponent" ref="digitIndicatorRef" :card="cardData" />
        </div>

        <!-- Data log -->
        <n-divider title-placement="left">Data processing log</n-divider>

        <n-card size="small" class="log-card">
          <div class="log-header">
            <n-text strong>Array data processing log</n-text>
            <n-button size="small" @click="clearLogs">Clear</n-button>
          </div>
          <div class="log-content">
            <div v-for="(log, index) in logs" :key="index" class="log-item">
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </n-card>

        <!-- Raw data preview -->
        <n-divider title-placement="left">Raw data preview</n-divider>

        <n-card size="small">
          <pre>{{ JSON.stringify(lastSentData, null, 2) }}</pre>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NSpace, NDivider, NButton, NAlert, NText } from 'naive-ui'
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
const lastSentData = ref<any>(null)

const addLog = (message: string) => {
  logs.value.push({
    timestamp: new Date().toISOString(),
    message
  })
}

const clearLogs = () => {
  logs.value = []
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
    test_metric: [25.6, 30.2, 28.9]
  }

  lastSentData.value = data
  digitIndicatorRef.value.updateData('test_device_001', 'test_metric', data)
  addLog(`Send simple array: ${JSON.stringify(data)}`)
}

const sendObjectArray = () => {
  if (!digitIndicatorRef.value) {
    addLog('Component not loaded')
    return
  }

  const data = {
    test_metric: [
      { value: 72.3, unit: '%' },
      { value: 68.9, unit: '%' },
      { value: 75.1, unit: '%' }
    ]
  }

  lastSentData.value = data
  digitIndicatorRef.value.updateData('test_device_001', 'test_metric', data)
  addLog(`Send array of objects: ${JSON.stringify(data)}`)
}

const sendNestedArray = () => {
  if (!digitIndicatorRef.value) {
    addLog('Component not loaded')
    return
  }

  const data = {
    test_metric: [{ data: { value: 58.7, unit: '°C' } }, { data: { value: 62.3, unit: '°C' } }]
  }

  lastSentData.value = data
  digitIndicatorRef.value.updateData('test_device_001', 'test_metric', data)
  addLog(`Send nested array: ${JSON.stringify(data)}`)
}

const sendComplexArray = () => {
  if (!digitIndicatorRef.value) {
    addLog('Component not loaded')
    return
  }

  const data = {
    test_metric: [
      { temp: 25.6, humidity: 60.2 },
      { temp: 26.8, humidity: 58.5 },
      { temp: 24.9, humidity: 62.1 }
    ]
  }

  lastSentData.value = data
  digitIndicatorRef.value.updateData('test_device_001', 'test_metric', data)
  addLog(`Send complex array: ${JSON.stringify(data)}`)
}
</script>

<style scoped>
.array-data-test {
  padding: 16px;
  max-width: 800px;
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
  max-height: 300px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-content {
  max-height: 200px;
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
