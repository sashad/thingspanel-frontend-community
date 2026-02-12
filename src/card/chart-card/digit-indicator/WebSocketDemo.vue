<template>
  <div class="websocket-demo">
    <n-card title="Digit Indicator WebSocket Demo" size="small">
      <n-space vertical>
        <!-- illustrate -->
        <n-alert type="info" title="WebSocket Data flow demonstration">
          <template #default>
            <p>
              <strong>Target</strong>
              ：Device data source support WebSocket method to request data，Component responds to data updates
            </p>
            <p>
              <strong>process</strong>
              ：Configure data source → Establish WebSocket connect → receive data → Mapping display → real time updates
            </p>
          </template>
        </n-alert>

        <!-- simulation WebSocket Data sending -->
        <n-divider title-placement="left">simulation WebSocket data</n-divider>

        <n-space>
          <n-button type="primary" @click="sendMockData">Send simulated data</n-button>
          <n-button type="success" @click="sendArrayData">Send array data</n-button>
          <n-button type="warning" @click="sendObjectData">Send object data</n-button>
        </n-space>

        <!-- Digit Indicator components -->
        <n-divider title-placement="left">Digit Indicator components</n-divider>

        <div class="component-container">
          <component :is="digitIndicatorComponent" ref="digitIndicatorRef" :card="cardData" />
        </div>

        <!-- Data log -->
        <n-divider title-placement="left">Data update log</n-divider>

        <n-card size="small" class="log-card">
          <div class="log-header">
            <n-text strong>WebSocket Data update log</n-text>
            <n-button size="small" @click="clearLogs">Clear</n-button>
          </div>
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
import { ref, onMounted } from 'vue'
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
        deviceId: 'demo_device_001',
        metricsId: 'humidity',
        metricsName: 'humidity',
        metricsType: 'telemetry'
      }
    ]
  }
})

// component reference
const digitIndicatorRef = ref<any>(null)

// log
const logs = ref<Array<{ timestamp: string; message: string }>>([])

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

// simulation WebSocket Data sending
const sendMockData = () => {
  if (!digitIndicatorRef.value) {
    addLog('Component not loaded')
    return
  }

  const mockData = {
    humidity: 65.5
  }

  digitIndicatorRef.value.updateData('demo_device_001', 'humidity', mockData)
  addLog(`Send data: ${JSON.stringify(mockData)}`)
}

const sendArrayData = () => {
  if (!digitIndicatorRef.value) {
    addLog('Component not loaded')
    return
  }

  const arrayData = {
    humidity: [
      { value: 72.3, unit: '%' },
      { value: 68.9, unit: '%' }
    ]
  }

  digitIndicatorRef.value.updateData('demo_device_001', 'humidity', arrayData)
  addLog(`Send array data: ${JSON.stringify(arrayData)}`)
}

const sendObjectData = () => {
  if (!digitIndicatorRef.value) {
    addLog('Component not loaded')
    return
  }

  const objectData = {
    humidity: {
      value: 58.7,
      unit: '%',
      timestamp: new Date().toISOString()
    }
  }

  digitIndicatorRef.value.updateData('demo_device_001', 'humidity', objectData)
  addLog(`Send object data: ${JSON.stringify(objectData)}`)
}

onMounted(() => {
  addLog('Component loaded，You can start sending simulated data')
})
</script>

<style scoped>
.websocket-demo {
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
