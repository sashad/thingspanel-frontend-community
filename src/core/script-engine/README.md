# ThingsPanel Script engine system

## Overview

ThingsPanel The script engine is a powerful JavaScript script execution system，Specifically designed for IoT data processing scenarios。It provides a secure sandbox environment、Rich template library、Flexible context management and comprehensive execution monitoring capabilities。

### 🎯 Core features

- **🔒 security sandbox**：Isolated execution environment，Prevent malicious code attacks
- **📋 template system**：Pre-made script templates，Support parameterized configuration
- **🎛️ context management**：Multiple execution contexts，Supports variable and function management
- **📊 Performance monitoring**：Real-time execution statistics、Memory usage monitoring
- **🔧 Tool integration**：Built-in data processing、time processing、Tools such as network requests
- **🚀 Asynchronous support**：Supports asynchronous script execution and streaming results

## 🏗️ System architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ScriptEngine (main engine)                      │
├─────────────────┬─────────────────┬─────────────────┬──────────────┤
│  ScriptExecutor │ ScriptSandbox   │ TemplateManager │ ContextMgr   │
│  (script executor)    │ (security sandbox)       │ (Template management)       │ (context management)  │
├─────────────────┼─────────────────┼─────────────────┼──────────────┤
│ • executive control      │ • security check       │ • templateCRUD      │ • contextCRUD │
│ • Statistics collection      │ • sandbox isolation       │ • code generation      │ • Variable management   │
│ • Error handling      │ • Timeout control       │ • Parameter validation      │ • Function management   │
│ • Log collection      │ • Built-in tools       │ • Classification management      │ • clone merge   │
└─────────────────┴─────────────────┴─────────────────┴──────────────┘
```

## 📁 File structure

```
src/core/script-engine/
├── index.ts                    # Main entry file
├── types.ts                    # TypeScript type definition
├── script-engine.ts            # Main engine implementation
├── executor.ts                 # script executor
├── sandbox.ts                  # security sandbox
├── template-manager.ts         # Template manager
├── context-manager.ts          # context manager
├── components/                 # Vue components
│   └── index.ts               # Component export
└── templates/                  # Template library
    └── built-in-templates.ts  # Built-in template definition
```

## 🚀 quick start

### Basic usage

```typescript
import { defaultScriptEngine } from '@/core/script-engine'

// 1. Simple script execution
const result = await defaultScriptEngine.execute('return Math.random() * 100')
console.log(result.data) // random number result

// 2. Execute with context
const contextResult = await defaultScriptEngine.execute(
  'return temperature * 1.8 + 32', // Celsius to Fahrenheit
  { temperature: 25 }
)
console.log(contextResult.data) // 77

// 3. Execute using template
const templateResult = await defaultScriptEngine.executeTemplate(
  'random-data-generator', 
  { count: 5, fields: [{ name: 'temp', type: 'number' }] }
)
```

### Advanced features

```typescript
// Batch execution
const batchResults = await defaultScriptEngine.executeBatch([
  { code: 'return new Date().getTime()', context: {} },
  { code: 'return Math.PI * radius * radius', context: { radius: 5 } }
])

// Streaming execution（real time feedback）
await defaultScriptEngine.executeStream(
  'return "Processing..." + Date.now()',
  {},
  (partialResult) => {
    console.log('progress update:', partialResult)
  }
)

// security check
const securityCheck = defaultScriptEngine.checkScriptSecurity(
  'eval("malicious code")'
)
console.log(securityCheck) // { safe: false, issues: [...] }
```

## 🔧 Detailed explanation of core components

### 1. ScriptExecutor (script executor)

Responsible for actual script execution、Results processing and performance statistics。

```typescript
interface IScriptExecutor {
  execute<T>(config: ScriptConfig, context?: ScriptExecutionContext): Promise<ScriptExecutionResult<T>>
  validateSyntax(code: string): { valid: boolean; error?: string }
  getExecutionStats(): ExecutionStats
}
```

**Main functions：**
- ✅ Script syntax verification
- ✅ Security execution controls
- ✅ Execution time statistics
- ✅ Error handling and log collection
- ✅ Concurrent execution management

### 2. ScriptSandbox (security sandbox)

Provide an isolated execution environment，Prevent malicious code attacks。

```typescript
interface IScriptSandbox {
  createSandbox(config: SandboxConfig): any
  executeInSandbox(code: string, sandbox: any, timeout?: number): Promise<any>
  destroySandbox(sandbox: any): void
  checkCodeSecurity(code: string): { safe: boolean; issues: string[] }
}
```

**security features：**
- 🔒 Disable dangerous functions (`eval`, `Function`, `require` wait)
- 🔒 Global object access control
- 🔒 Prototype contamination protection
- 🔒 Execution timeout control
- 🔒 Custom security policy

**Allowed security global objects：**
```typescript
allowedGlobals: [
  'Math', 'Date', 'JSON', 'Promise',
  'setTimeout', 'clearTimeout', 
  'setInterval', 'clearInterval',
  'console', 'parseInt', 'parseFloat',
  'isNaN', 'isFinite'
]
```

### 3. ScriptTemplateManager (Template manager)

Manage reusable script templates，Support parameterization and classification management。

```typescript
interface IScriptTemplateManager {
  getAllTemplates(): ScriptTemplate[]
  getTemplatesByCategory(category: string): ScriptTemplate[]
  createTemplate(template: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt'>): ScriptTemplate
  generateCode(templateId: string, parameters: Record<string, any>): string
}
```

**Built-in template classification：**
- 📊 **Data generation** (`data-generation`)
  - Analog device data
  - Random time series data
  - Numeric range generation
- 🔄 **Data processing** (`data-processing`)
  - Numerical calculation processing
  - Array filter sorting
  - Smart object merge
- 🌐 **APIintegrated** (`api-integration`)
  - HTTP APIcall
  - response handling
  - Retry on error
- ⏱️ **Time series data** (`time-series`)
  - Time series generation
  - Time series data merging
  - time formatting
- 🛠️ **Utility function** (`utility`)
  - Data validation
  - Performance monitoring
  - format conversion

### 4. ScriptContextManager (context manager)

Manage the context in which scripts are executed，Includes variables and functions。

```typescript
interface IScriptContextManager {
  createContext(name: string, variables?: Record<string, any>): ScriptExecutionContext
  updateContext(id: string, updates: Partial<ScriptExecutionContext>): boolean
  cloneContext(id: string, newName: string): ScriptExecutionContext | null
  mergeContexts(sourceId: string, targetId: string): boolean
}
```

**default context：**
- 🏠 **default context**：Apply basic information and common tools
- 📊 **data processing context**：Data validation and conversion functions
- 🏭 **IoTdevice context**：Device message parsing and data generation

## 🛠️ Built-in utility functions

### Data generation tools (`_utils.mockData`)

```javascript
// Use in script
const randomNum = _utils.mockData.randomNumber(1, 100)
const randomStr = _utils.mockData.randomString(10)
const randomBool = _utils.mockData.randomBoolean()
const randomDate = _utils.mockData.randomDate()
const randomArr = _utils.mockData.randomArray(['A', 'B', 'C'], 2)
```

### data processing tools (`_utils.dataUtils`)

```javascript
// deep copy object
const cloned = _utils.dataUtils.deepClone(originalObj)

// Object attribute selection/exclude
const picked = _utils.dataUtils.pick(obj, ['name', 'age'])
const omitted = _utils.dataUtils.omit(obj, ['password'])

// Array grouping and sorting
const grouped = _utils.dataUtils.groupBy(array, 'category')
const sorted = _utils.dataUtils.sortBy(array, 'timestamp')
```

### Time management tools (`_utils.timeUtils`)

```javascript
// time formatting
const formatted = _utils.timeUtils.format(Date.now(), 'YYYY-MM-DD HH:mm:ss')

// date calculation
const nextWeek = _utils.timeUtils.addDays(new Date(), 7)
const daysDiff = _utils.timeUtils.diffDays(date1, date2)
```

## 📊 Performance monitoring

### Execution statistics

```typescript
const stats = defaultScriptEngine.getExecutionStats()
console.log({
  totalExecutions: stats.executor.totalExecutions,
  successRate: stats.executor.successfulExecutions / stats.executor.totalExecutions,
  averageTime: stats.executor.averageExecutionTime,
  templates: stats.templates.total,
  contexts: stats.contexts.total
})
```

### Memory usage monitoring

```javascript
// Using performance monitoring in templates
const startTime = performance.now()
const memoryBefore = performance.memory?.usedJSHeapSize || 0

// ... Data processing logic ...

const endTime = performance.now()
const memoryAfter = performance.memory?.usedJSHeapSize || 0

return {
  result: processedData,
  performance: {
    duration: endTime - startTime,
    memoryUsed: memoryAfter - memoryBefore
  }
}
```

## 🔒 Security Best Practices

### 1. Code security check

```typescript
// Check code security before execution
const securityCheck = defaultScriptEngine.checkScriptSecurity(userCode)
if (!securityCheck.safe) {
  console.error('Security check failed:', securityCheck.issues)
  return
}
```

### 2. Execution timeout settings

```typescript
const config: ScriptConfig = {
  code: userScript,
  timeout: 10000,        // 10seconds timeout
  maxMemory: 50 * 1024 * 1024,  // 50MBmemory limit
  strictMode: true,      // strict mode
  allowNetworkAccess: false     // Disable network access
}
```

### 3. Sandbox configuration

```typescript
const sandboxConfig: SandboxConfig = {
  enabled: true,
  allowedGlobals: ['Math', 'Date', 'JSON'],  // Allow only safe global objects
  blockedGlobals: ['eval', 'Function', 'window'],
  allowEval: false,
  allowFunction: false,
  allowPrototypePollution: false,
  customSecurityPolicy: (code: string) => {
    // Custom security check logic
    return !code.includes('dangerous_pattern')
  }
}
```

## 🎯 Usage scenarios

### 1. IoT Data processing

```typescript
// Sensor data processing template
const sensorDataScript = `
const { temperature, humidity, timestamp } = data
return {
  processed: true,
  temperature: Math.round(temperature * 100) / 100,
  humidity: Math.round(humidity * 100) / 100,
  heatIndex: calculateHeatIndex(temperature, humidity),
  timestamp: timestamp,
  alert: temperature > 35 || humidity > 90
}

function calculateHeatIndex(t, h) {
  return -42.379 + 2.04901523*t + 10.14333127*h - 0.22475541*t*h
}
`
```

### 2. Data visualization preprocessing

```typescript
// Chart data formatting
const chartDataScript = `
const chartData = data.map((item, index) => ({
  x: index,
  y: item.value,
  label: item.name,
  color: item.value > 50 ? '#ff4757' : '#2ed573'
}))

return {
  type: 'line',
  data: chartData,
  options: {
    responsive: true,
    scales: {
      y: { min: 0, max: 100 }
    }
  }
}
`
```

### 3. rules engine

```typescript
// Device alarm rules
const alertRuleScript = `
const rules = [
  { field: 'temperature', operator: '>', threshold: 30, level: 'warning' },
  { field: 'temperature', operator: '>', threshold: 40, level: 'critical' },
  { field: 'humidity', operator: '<', threshold: 20, level: 'warning' }
]

const alerts = []
rules.forEach(rule => {
  const value = data[rule.field]
  if (value !== undefined) {
    let triggered = false
    switch (rule.operator) {
      case '>': triggered = value > rule.threshold; break
      case '<': triggered = value < rule.threshold; break
      case '>=': triggered = value >= rule.threshold; break
      case '<=': triggered = value <= rule.threshold; break
      case '==': triggered = value == rule.threshold; break
    }
    
    if (triggered) {
      alerts.push({
        field: rule.field,
        value: value,
        threshold: rule.threshold,
        level: rule.level,
        message: \`\${rule.field} value \${value} \${rule.operator} \${rule.threshold}\`
      })
    }
  }
})

return { alerts, hasAlerts: alerts.length > 0 }
`
```

## 🔧 Configuration options

### Engine configuration

```typescript
const engineConfig: ScriptEngineConfig = {
  // Default script configuration
  defaultScriptConfig: {
    timeout: 5000,
    strictMode: true,
    asyncSupport: true,
    maxMemory: 50 * 1024 * 1024,
    allowNetworkAccess: false,
    allowFileSystemAccess: false
  },
  
  // Sandbox configuration
  sandboxConfig: {
    enabled: true,
    allowedGlobals: ['Math', 'Date', 'JSON', 'Promise'],
    blockedGlobals: ['eval', 'Function', 'window', 'document']
  },
  
  // Cache configuration
  enableCache: true,
  cacheTTL: 5 * 60 * 1000,  // 5minute
  
  // Concurrency control
  maxConcurrentExecutions: 10,
  
  // Performance monitoring
  enablePerformanceMonitoring: true
}

const customEngine = new ScriptEngine(engineConfig)
```

## 📝 Development Guide

### Create a custom template

```typescript
import { defaultScriptEngine } from '@/core/script-engine'

// Create a custom template
const customTemplate = defaultScriptEngine.templateManager.createTemplate({
  name: 'Custom data processing',
  description: 'Process data according to business needs',
  category: 'custom',
  code: `
    const threshold = {{threshold}}
    const field = {{field}}
    
    if (Array.isArray(data)) {
      return data.filter(item => item[field] > threshold)
    }
    
    return data[field] > threshold ? data : null
  `,
  parameters: [
    {
      name: 'threshold',
      type: 'number',
      description: 'filter threshold',
      required: true,
      defaultValue: 0
    },
    {
      name: 'field',
      type: 'string', 
      description: 'Compare fields',
      required: true,
      defaultValue: 'value'
    }
  ],
  example: '// context = { threshold: 50, field: "temperature" }'
})
```

### Extended context capabilities

```typescript
// Create a dedicated context
const deviceContext = defaultScriptEngine.contextManager.createContext(
  'device-specific context',
  {
    deviceType: 'sensor',
    location: 'building_a',
    protocol: 'mqtt'
  }
)

// Add custom function
defaultScriptEngine.contextManager.addFunction(
  deviceContext.id,
  'parseDeviceMessage',
  (rawMessage: string) => {
    try {
      return JSON.parse(rawMessage)
    } catch {
      return { error: 'Invalid message format', raw: rawMessage }
    }
  }
)
```

### Error handling and debugging

```typescript
try {
  const result = await defaultScriptEngine.execute(userScript, context)
  
  if (!result.success) {
    console.error('Script execution failed:', result.error?.message)
    console.log('execution log:', result.logs)
    console.log('context snapshot:', result.contextSnapshot)
  } else {
    console.log('Executed successfully:', result.data)
    console.log('Execution time:', result.executionTime + 'ms')
  }
} catch (error) {
  console.error('Engine abnormality:', error)
}
```

## 🧪 Testing and Debugging

### Unit test example

```typescript
import { ScriptEngine } from '@/core/script-engine'

describe('ScriptEngine', () => {
  let engine: ScriptEngine

  beforeEach(() => {
    engine = new ScriptEngine()
  })

  test('Basic script execution', async () => {
    const result = await engine.execute('return 1 + 1')
    expect(result.success).toBe(true)
    expect(result.data).toBe(2)
  })

  test('Template execution', async () => {
    const result = await engine.executeTemplate('random-data-generator', {
      count: 3,
      fields: [{ name: 'test', type: 'number' }]
    })
    expect(result.success).toBe(true)
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBe(3)
  })

  test('security check', () => {
    const check = engine.checkScriptSecurity('eval("malicious")')
    expect(check.safe).toBe(false)
    expect(check.issues.length).toBeGreaterThan(0)
  })
})
```

## 🚀 Performance optimization

### 1. Warm up engine

```typescript
// Warm up engine when application starts
await defaultScriptEngine.warmup()
```

### 2. Cache frequently used scripts

```typescript
// Use templates instead of repeated inline scripts
const templateId = 'data-processor'
const result = await defaultScriptEngine.executeTemplate(templateId, params)
```

### 3. Batch processing

```typescript
// Execute in batches instead of a single loop
const scripts = dataItems.map(item => ({
  code: 'return processItem(data)',
  context: { data: item }
}))
const results = await defaultScriptEngine.executeBatch(scripts)
```

## 📈 Monitoring and operation

### Engine status export

```typescript
// Export engine status for backup
const engineState = defaultScriptEngine.exportState()
localStorage.setItem('script-engine-backup', JSON.stringify(engineState))

// Restore engine status
const savedState = JSON.parse(localStorage.getItem('script-engine-backup'))
defaultScriptEngine.importState(savedState)
```

### Performance indicator monitoring

```typescript
// Collect performance metrics regularly
setInterval(() => {
  const stats = defaultScriptEngine.getExecutionStats()
  
  // Send to monitoring system
  sendMetrics({
    totalExecutions: stats.executor.totalExecutions,
    successRate: stats.executor.successfulExecutions / stats.executor.totalExecutions,
    avgExecutionTime: stats.executor.averageExecutionTime,
    currentConcurrency: stats.executor.currentConcurrentExecutions
  })
}, 60000) // once per minute
```

## 🤝 Contribution Guide

1. **Add new template**：exist `templates/built-in-templates.ts` Add in
2. **Extended utility functions**：exist `sandbox.ts` of `createBuiltinUtils` Add in method
3. **Enhanced security checks**：exist `sandbox.ts` of `checkCodeSecurity` Add rules to method
4. **Optimize performance**：Pay attention to execution time and memory usage

## 📄 license

This project is based on MIT License open source。

---

## 📞 Technical support

If you have any questions or suggestions，Please submit Issue Or contact the development team。

**🌟 Enjoy using ThingsPanel The power of scripting engines！**