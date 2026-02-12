<template>
  <div class="real-world-example">
    <n-card title="real scene WebSocket Data flow example" size="small">
      <n-space vertical>
        <!-- Scene description -->
        <n-alert type="success" title="Production environment usage scenarios">
          <template #default>
            <p>
              <strong>scene</strong>
              ：Factory temperature monitoring system
            </p>
            <p>
              <strong>equipment</strong>
              ：temperature sensor (device_001)
            </p>
            <p>
              <strong>data</strong>
              ：Real-time temperature data，Every5Update once every second
            </p>
            <p>
              <strong>show</strong>
              ：digit-indicator Components display temperature in real time
            </p>
          </template>
        </n-alert>

        <!-- Device status -->
        <n-divider title-placement="left">Device status</n-divider>

        <n-space>
          <n-tag :type="deviceStatus.type" size="large">
            {{ deviceStatus.text }}
          </n-tag>
          <n-text>equipmentID: device_001</n-text>
          <n-text>index: temperature</n-text>
        </n-space>

        <!-- Real-time data display -->
        <n-divider title-placement="left">Real-time data display</n-divider>

        <div class="dashboard">
          <div class="component-container">
            <component :is="digitIndicatorComponent" ref="digitIndicatorRef" :card="cardData" />
          </div>

          <div class="data-panel">
            <n-card title="Data details" size="small">
              <n-space vertical>
                <div class="data-item">
                  <n-text strong>current temperature:</n-text>
                  {{ currentTemperature }}°C
                </div>
                <div class="data-item">
                  <n-text strong>Update time:</n-text>
                  {{ lastUpdateTime }}
                </div>
                <div class="data-item">
                  <n-text strong>Data quality:</n-text>
                  <n-tag :type="dataQuality.type" size="small">
                    {{ dataQuality.text }}
                  </n-tag>
                </div>
              </n-space>
            </n-card>
          </div>
        </div>

        <!-- Analog control -->
        <n-divider title-placement="left">Analog control</n-divider>

        <n-space>
          <n-button type="primary" :disabled="isSimulating" @click="startSimulation">Start simulation</n-button>
          <n-button type="error" :disabled="!isSimulating" @click="stopSimulation">Stop simulation</n-button>
          <n-button type="warning" :disabled="!isSimulating" @click="sendAlert">Send alert</n-button>
        </n-space>

        <!-- Data history -->
        <n-divider title-placement="left">Data history</n-divider>

        <n-card size="small" class="history-card">
          <div class="history-header">
            <n-text strong>recent10data updates</n-text>
            <n-button size="small" @click="clearHistory">Clear history</n-button>
          </div>
          <div class="history-content">
            <div v-for="(record, index) in dataHistory" :key="index" class="history-item">
              <span class="history-time">{{ formatTime(record.timestamp) }}</span>
              <span class="history-value">{{ record.value }}°C</span>
              <span class="history-type">{{ record.type }}</span>
            </div>
            <n-empty v-if="dataHistory.length === 0" description="No data yet" size="small" />
          </div>
        </n-card>

        <!-- System log -->
        <n-divider title-placement="left">System log</n-divider>

        <n-card size="small" class="log-card">
          <div class="log-header">
            <n-text strong>WebSocket connection log</n-text>
            <n-button size="small" @click="clearLogs">Clear log</n-button>
          </div>
          <div class="log-content">
            <div v-for="(log, index) in logs" :key="index" class="log-item" :class="log.type">
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
import { ref, onMounted, onUnmounted } from 'vue'
import { NCard, NSpace, NDivider, NButton, NAlert, NText, NTag, NEmpty } from 'naive-ui'
import digitIndicatorComponent from './component.vue'

// card data
const cardData = ref({
  config: {
    color: '#ff4d4f',
    iconName: 'Thermometer',
    unit: '°C'
  },
  dataSource: {
    deviceSource: [
      {
        deviceId: 'device_001',
        metricsId: 'temperature',
        metricsName: 'temperature',
        metricsType: 'telemetry'
      }
    ]
  }
})

// component reference
const digitIndicatorRef = ref<any>(null)

// Status management
const isSimulating = ref(false)
const deviceStatus = ref({ type: 'success', text: 'online' })
const currentTemperature = ref(25.0)
const lastUpdateTime = ref('--')
const dataQuality = ref({ type: 'success', text: 'good' })

// Data history
const dataHistory = ref<Array<{ timestamp: string; value: number; type: string }>>([])

// log
const logs = ref<Array<{ timestamp: string; message: string; type: string }>>([])

// Analog timer
let simulationTimer: any = null

const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
  logs.value.push({
    timestamp: new Date().toISOString(),
    message,
    type
  })
}

const clearLogs = () => {
  logs.value = []
}

const clearHistory = () => {
  dataHistory.value = []
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

// Simulation data generation
const generateTemperature = () => {
  // generate20-30Random temperature between degrees
  const baseTemp = 25
  const variation = (Math.random() - 0.5) * 10
  return Math.round((baseTemp + variation) * 10) / 10
}

// Send data to component
const sendDataToComponent = (temperature: number, type: string = 'normal') => {
  if (!digitIndicatorRef.value) return

  const data = {
    temperature: temperature
  }

  digitIndicatorRef.value.updateData('device_001', 'temperature', data)

  // update status
  currentTemperature.value = temperature
  lastUpdateTime.value = new Date().toLocaleTimeString()

  // Add to history
  dataHistory.value.unshift({
    timestamp: new Date().toISOString(),
    value: temperature,
    type: type
  })

  // keep recent10records
  if (dataHistory.value.length > 10) {
    dataHistory.value = dataHistory.value.slice(0, 10)
  }

  addLog(`Temperature data update: ${temperature}°C (${type})`, 'success')
}

// Start simulation
const startSimulation = () => {
  if (isSimulating.value) return

  isSimulating.value = true
  deviceStatus.value = { type: 'success', text: 'online' }
  dataQuality.value = { type: 'success', text: 'good' }

  addLog('Start temperature data simulation', 'info')

  // Send data once immediately
  const initialTemp = generateTemperature()
  sendDataToComponent(initialTemp, 'initial')

  // Every5Send data once every second
  simulationTimer = setInterval(() => {
    const temp = generateTemperature()
    sendDataToComponent(temp, 'normal')
  }, 5000)
}

// Stop simulation
const stopSimulation = () => {
  if (!isSimulating.value) return

  isSimulating.value = false
  deviceStatus.value = { type: 'error', text: 'Offline' }
  dataQuality.value = { type: 'error', text: 'No data' }

  if (simulationTimer) {
    clearInterval(simulationTimer)
    simulationTimer = null
  }

  addLog('Stop temperature data simulation', 'warning')
}

// Send alert
const sendAlert = () => {
  if (!isSimulating.value) return

  const alertTemp = 35.0 // High temperature alarm
  sendDataToComponent(alertTemp, 'alert')

  dataQuality.value = { type: 'error', text: 'Alarm' }
  addLog(`Temperature alarm: ${alertTemp}°C`, 'error')
}

onMounted(() => {
  addLog('Temperature monitoring system is activated', 'success')
})

onUnmounted(() => {
  if (simulationTimer) {
    clearInterval(simulationTimer)
  }
})
</script>

<style scoped>
.real-world-example {
  padding: 16px;
  max-width: 1000px;
  margin: 0 auto;
}

.dashboard {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.component-container {
  width: 300px;
  height: 200px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.data-panel {
  flex: 1;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.history-card,
.log-card {
  max-height: 300px;
}

.history-header,
.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-content,
.log-content {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  margin-bottom: 2px;
  border-radius: 4px;
  background: #f8f9fa;
  font-size: 12px;
}

.history-time {
  color: #666;
  width: 80px;
}

.history-value {
  font-weight: bold;
  color: #ff4d4f;
  width: 60px;
  text-align: center;
}

.history-type {
  color: #666;
  width: 60px;
  text-align: right;
}

.log-item {
  padding: 4px 8px;
  margin-bottom: 2px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.log-item.info {
  background: #e6f7ff;
  color: #1890ff;
}

.log-item.success {
  background: #f6ffed;
  color: #52c41a;
}

.log-item.error {
  background: #fff2f0;
  color: #ff4d4f;
}

.log-item.warning {
  background: #fffbe6;
  color: #faad14;
}

.log-time {
  color: #666;
  margin-right: 8px;
}

.log-message {
  font-weight: 500;
}
</style>
