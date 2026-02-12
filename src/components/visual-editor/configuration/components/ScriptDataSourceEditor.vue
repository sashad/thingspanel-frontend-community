<template>
  <div class="script-data-source-editor">
    <n-space vertical size="medium">
      <!-- Script editor -->
      <n-form-item label="JavaScript script" size="small">
        <template #label>
          <n-space align="center" size="small">
            <span>JavaScript script</span>
            <n-tooltip>
              <template #trigger>
                <n-icon size="14" style="cursor: help">
                  <InformationCircleOutline />
                </n-icon>
              </template>
              <div style="max-width: 300px; font-size: 12px">
                <div><strong>Script description:</strong></div>
                <div>• use return Statement returns data</div>
                <div>• Available _utils Built-in utility functions</div>
                <div>• support async/await Asynchronous operations</div>
                <div>• Automatically provide a secure sandbox environment</div>
              </div>
            </n-tooltip>
          </n-space>
        </template>
        <n-input
          v-model:value="scriptCode"
          type="textarea"
          :rows="12"
          placeholder="Please enterJavaScriptscript code..."
          @update:value="onScriptChange"
        />
      </n-form-item>

      <!-- quick template -->
      <n-form-item label="quick template" size="small">
        <n-space>
          <n-button size="small" @click="loadTemplate('basic')">Basic data</n-button>
          <n-button size="small" @click="loadTemplate('random')">random data</n-button>
          <n-button size="small" @click="loadTemplate('time-series')">time series</n-button>
          <n-button size="small" @click="loadTemplate('api-mock')">APIsimulation</n-button>
        </n-space>
      </n-form-item>

      <!-- Execute configuration -->
      <n-form-item label="Execute configuration" size="small">
        <n-space align="center">
          <n-form-item label="timeout" size="small" style="margin: 0">
            <n-input-number
              v-model:value="timeout"
              :min="1000"
              :max="30000"
              :step="1000"
              placeholder="millisecond"
              style="width: 100px"
              @update:value="onConfigChange"
            />
          </n-form-item>
          <n-form-item label="refresh interval" size="small" style="margin: 0">
            <n-input-number
              v-model:value="refreshInterval"
              :min="0"
              :max="300000"
              :step="5000"
              placeholder="millisecond(0=No automatic refresh)"
              style="width: 150px"
              @update:value="onConfigChange"
            />
          </n-form-item>
        </n-space>
      </n-form-item>

      <!-- Script verification -->
      <n-card v-if="validationResult" size="small" embedded>
        <template #header>
          <n-space align="center">
            <span>Script verification</span>
            <n-tag :type="validationResult.valid ? 'success' : 'error'" size="small">
              {{ validationResult.valid ? 'pass' : 'fail' }}
            </n-tag>
          </n-space>
        </template>

        <div v-if="!validationResult.valid && validationResult.error">
          <n-alert type="error" size="small">
            {{ validationResult.error }}
          </n-alert>
        </div>

        <div v-if="validationResult.valid">
          <n-text type="success" size="small">✅ The script syntax is correct，can be performed safely</n-text>
        </div>
      </n-card>

      <!-- test execution -->
      <n-space>
        <n-button :disabled="!scriptCode.trim()" @click="validateScript">
          <template #icon>
            <n-icon><CheckmarkCircleOutline /></n-icon>
          </template>
          Validation script
        </n-button>
        <n-button type="primary" :loading="testing" :disabled="!scriptCode.trim()" @click="testScript">
          <template #icon>
            <n-icon><PlayOutline /></n-icon>
          </template>
          test execution
        </n-button>
        <n-button @click="clearScript">Clear</n-button>
      </n-space>

      <!-- Test results -->
      <n-card v-if="testResult" size="small" title="Test results" embedded>
        <template #header-extra>
          <n-tag :type="testResult.success ? 'success' : 'error'" size="small">
            {{ testResult.success ? 'success' : 'fail' }}
          </n-tag>
        </template>

        <n-space vertical size="small">
          <n-descriptions :column="2" size="small">
            <n-descriptions-item label="Execution time">{{ testResult.executionTime }}ms</n-descriptions-item>
            <n-descriptions-item label="Number of logs">
              {{ testResult.logs.length }}
            </n-descriptions-item>
          </n-descriptions>

          <div v-if="testResult.success && testResult.data !== undefined">
            <n-text strong>Execution result:</n-text>
            <n-code
              :code="formatResult(testResult.data)"
              language="json"
              show-line-numbers
              style="margin-top: 8px; max-height: 200px; overflow-y: auto"
            />
          </div>

          <div v-if="!testResult.success && testResult.error">
            <n-text strong type="error">error message:</n-text>
            <n-alert type="error" style="margin-top: 8px">
              {{ testResult.error.message }}
            </n-alert>
          </div>
        </n-space>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * Script data source editor component
 * dedicated toVisual EditorScript data source configuration
 */

import { ref, watch, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { InformationCircleOutline, CheckmarkCircleOutline, PlayOutline } from '@vicons/ionicons5'
import { defaultScriptEngine } from '@/core/script-engine'
import type { ScriptExecutionResult } from '@/core/script-engine/types'

interface Props {
  modelValue: {
    script: string
    timeout: number
    refreshInterval: number
    context?: Record<string, any>
  }
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const message = useMessage()

// form data
const scriptCode = ref('')
const timeout = ref(5000)
const refreshInterval = ref(0)

// state
const testing = ref(false)
const validationResult = ref<{ valid: boolean; error?: string } | null>(null)
const testResult = ref<ScriptExecutionResult | null>(null)

/**
 * script template
 */
const templates = {
  basic: `// Basic data generation example
const data = {
  timestamp: new Date().toISOString(),
  value: _utils.mockData.randomNumber(0, 100),
  status: _utils.mockData.randomBoolean() ? 'active' : 'inactive',
  message: 'Data updated successfully'
};
return data;`,

  random: `// Random data set generation
const count = 10;
const items = [];

for (let i = 0; i < count; i++) {
  items.push({
    id: i + 1,
    name: \`project\${i + 1}\`,
    value: _utils.mockData.randomNumber(10, 100),
    category: ['A', 'B', 'C'][i % 3],
    enabled: _utils.mockData.randomBoolean(),
    createdAt: _utils.mockData.randomDate()
  });
}
return {
  total: count,
  items: items,
  summary: {
    avgValue: items.reduce((sum, item) => sum + item.value, 0) / count,
    activeCount: items.filter(item => item.enabled).length
  }
};`,

  'time-series': `// Time series data generation
const now = Date.now();
const interval = 5 * 60 * 1000; // 5minute interval
const count = 12; // recent1hourly data

const series = [];
for (let i = count - 1; i >= 0; i--) {
  const timestamp = now - (i * interval);
  const baseValue = 50;
  const variance = 20;
  
  series.push({
    timestamp: new Date(timestamp).toISOString(),
    value: baseValue + _utils.mockData.randomNumber(-variance, variance),
    formatted: _utils.timeUtils.format(new Date(timestamp))
  });
}
return {
  type: 'time-series',
  interval: '5min',
  data: series,
  latest: series[series.length - 1]
};`,

  'api-mock': `// APIData simulation
// Simulate device status data
const devices = [
  { id: 'temp-001', name: 'temperature sensor1', type: 'sensor' },
  { id: 'hum-001', name: 'humidity sensor1', type: 'sensor' },
  { id: 'gate-001', name: 'Smart gateway1', type: 'gateway' }
];

const deviceData = devices.map(device => ({
  ...device,
  online: _utils.mockData.randomBoolean(),
  lastSeen: _utils.mockData.randomDate(),
  metrics: {
    temperature: device.type === 'sensor' ? _utils.mockData.randomNumber(15, 35) : null,
    humidity: device.type === 'sensor' ? _utils.mockData.randomNumber(30, 80) : null,
    uptime: _utils.mockData.randomNumber(0, 86400)
  }
}));
return {
  success: true,
  timestamp: new Date().toISOString(),
  data: deviceData,
  summary: {
    total: devices.length,
    online: deviceData.filter(d => d.online).length,
    offline: deviceData.filter(d => !d.online).length
  }
};`
}

/**
 * Load template
 */
const loadTemplate = (templateName: keyof typeof templates) => {
  scriptCode.value = templates[templateName]
  validationResult.value = null
  testResult.value = null
  onScriptChange()
  message.success(`Loaded${templateName}template`)
}

/**
 * Script content changes
 */
const onScriptChange = () => {
  emitUpdate()
  // Clear previous verification results
  validationResult.value = null
  testResult.value = null
}

/**
 * Configuration changes
 */
const onConfigChange = () => {
  emitUpdate()
}

/**
 * Send update event
 */
const emitUpdate = () => {
  emit('update:modelValue', {
    script: scriptCode.value,
    timeout: timeout.value,
    refreshInterval: refreshInterval.value,
    context: {}
  })
}

/**
 * Validation script
 */
const validateScript = () => {
  if (!scriptCode.value.trim()) {
    message.error('Please enter script code')
    return
  }

  try {
    const result = defaultScriptEngine.validateScript(scriptCode.value)
    validationResult.value = result

    if (result.valid) {
      message.success('Script syntax verification passed')
    } else {
      message.error(`Script syntax error: ${result.error}`)
    }
  } catch (error) {
    validationResult.value = { valid: false, error: (error as Error).message }
    message.error(`Authentication failed: ${(error as Error).message}`)
  }
}

/**
 * Test script execution
 */
const testScript = async () => {
  if (!scriptCode.value.trim()) {
    message.error('Please enter script code')
    return
  }

  testing.value = true

  try {
    const result = await defaultScriptEngine.execute(scriptCode.value)
    testResult.value = result

    if (result.success) {
      message.success(`Script executed successfully (${result.executionTime}ms)`)
    } else {
      message.error(`Script execution failed: ${result.error?.message}`)
    }
  } catch (error) {
    message.error(`Script test failed: ${(error as Error).message}`)
  } finally {
    testing.value = false
  }
}

/**
 * clear script
 */
const clearScript = () => {
  scriptCode.value = ''
  validationResult.value = null
  testResult.value = null
  onScriptChange()
  message.info('Script content cleared')
}

/**
 * Format results
 */
const formatResult = (data: any): string => {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

/**
 * initialization data
 */
const initializeData = () => {
  if (props.modelValue) {
    scriptCode.value = props.modelValue.script || ''
    timeout.value = props.modelValue.timeout || 5000
    refreshInterval.value = props.modelValue.refreshInterval || 0
  }
}

// monitorpropschange
watch(
  () => props.modelValue,
  () => {
    initializeData()
  },
  { immediate: true }
)

// Initialized when component is mounted
onMounted(() => {
  initializeData()
})
</script>

<style scoped>
.script-data-source-editor {
  padding: 4px;
}

:deep(.n-input__textarea-el) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
}

:deep(.n-form-item-label) {
  font-size: 13px;
}
</style>
