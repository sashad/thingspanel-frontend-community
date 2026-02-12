# ThingsPanel Visual Editor Detailed guide for developers

**Version**: v2.0.0  
**Update time**: 2025-08-31  
**target audience**: front-end developer、system architect、maintenance personnel

---

## 📖 Table of contents

- [1. In-depth analysis of system architecture](#1-In-depth analysis of system architecture)
- [2. coreAPIrefer to](#2-coreapirefer to)
- [3. Development workflow](#3-Development workflow)
- [4. Component Development Guide](#4-Component Development Guide)
- [5. Renderer development](#5-Renderer development)
- [6. Data flow and state management](#6-Data flow and state management)
- [7. Configuration system in depth](#7-Configuration system in depth)
- [8. Performance optimization strategies](#8-Performance optimization strategies)
- [9. Troubleshooting Guide](#9-Troubleshooting Guide)
- [10. best practices](#10-best practices)

---

## 1. In-depth analysis of system architecture

### 1.1 Overall architecture diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PanelEditor.vue                          │
│                 (Main entrance component - unified coordination layer)                     │
└─────┬──────────────┬─────────────────┬─────────────────────┘
      │              │                 │
      ▼              ▼                 ▼
┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐
│  toolbar system  │ │   drawer front    │ │   Polling control system       │
│ Toolbar     │ │ WidgetLibrary│ │ PollingController   │
│             │ │ PropertyPanel│ │ GlobalPollingManager│
└─────────────┘ └──────────────┘ └─────────────────────┘
      │              │                 │
      ▼              ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   core rendering layer                                 │
│ ┌─────────────────┐    ┌─────────────────┐                │
│ │  CanvasRenderer    │    │ GridstackRenderer  │                │
│ │  Free layout        │    │  grid layout        │                │
│ └─────────────────┘    └─────────────────┘                │
└─────┬─────────────────────────────────────┬─────────────────┘
      │                                     │
      ▼                                     ▼
┌─────────────────────┐              ┌─────────────────────┐
│   status management system       │◄────────────►│   Component Ecosystem       │
│ • EditorStore      │              │ • Card2.1integrated        │
│ • WidgetStore      │              │ • WidgetRegistry       │
│ • Responsive state        │              │ • Component definition           │
└─────────────────────┘              └─────────────────────┘
      │                                     │
      ▼                                     ▼
┌─────────────────────┐              ┌─────────────────────┐
│   configuration management system       │              │   Data source management system     │
│ • ConfigManager    │              │ • EditorDataSource  │
│ • Hierarchical configuration architecture      │◄────────────►│ • Multiple data sources support       │
│ • Persistent storage        │              │ • Real-time polling scheduling       │
│ • Configuration verification migration      │              │ • WebSocketsupport     │
└─────────────────────┘              └─────────────────────┘
      │                                     │
      ▼                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 underlying infrastructure                                 │
│ • event bus (ConfigEventBus)                                │
│ • caching system (SimpleDataBridge)                              │
│ • theme system (ThemeStore)                                    │
│ • International system (I18n)                                        │
│ • Tool function library (Utils)                                       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Detailed explanation of core modules

#### A. state management (`store/`)

**EditorStore** (`editor.ts`)
```typescript
interface EditorState {
  nodes: GraphData[]          // All component nodes on the canvas
  viewport: Viewport          // viewport state（Zoom、Pan）
  mode: EditorMode           // edit mode（design/preview）
}

// core methods
- addNode(...nodes: GraphData[])      // Add node
- removeNode(id: string)              // Delete node  
- updateNode(id, updates)             // Update node
- setMode(mode: EditorMode)           // Setup mode
- reset()                             // reset state
```

**WidgetStore** (`store/widget.ts`)
- Manage component definition registry
- Handle component selection state
- Provide component query interface

#### B. configuration management system (`configuration/`)

**ConfigurationManager** - core configuration manager
```typescript
class ConfigurationManager {
  // Configure storage structure
  private configurations: Map<string, WidgetConfiguration>
  
  // core methods
  getConfiguration(widgetId: string): WidgetConfiguration | null
  setConfiguration(widgetId: string, config: WidgetConfiguration): void
  updateConfiguration<K>(widgetId: string, section: K, config: any): void
  
  // Advanced features
  validateConfiguration(config: WidgetConfiguration): ValidationResult
  exportConfiguration(widgetId: string): string
  importConfiguration(widgetId: string, configData: string): boolean
  
  // event system
  onConfigurationChange(widgetId: string, callback: Function): () => void
}
```

**Configuration structure design**
```typescript
interface WidgetConfiguration {
  base: BaseConfiguration        // Basic configuration（title、style etc.）
  component: ComponentConfiguration  // Component specific configuration
  dataSource: DataSourceConfiguration  // Data source configuration
  interaction: InteractionConfiguration  // Interactive configuration
  metadata: ConfigurationMetadata     // metadata
}
```

#### C. renderer system (`renderers/`)

**Renderer architectural patterns**
```typescript
// Basic renderer interface
interface IRenderer {
  render(data: GraphData[]): void
  destroy(): void
  updateNode(id: string, updates: Partial<GraphData>): void
  selectNode(id: string): void
}

// Renderer registration mode
export const RendererManager = {
  register(type: string, renderer: IRenderer): void
  get(type: string): IRenderer | undefined
  unregister(type: string): void
}
```

### 1.3 data flow analysis

```
User action
    ↓
Toolbar event handling
    ↓
EditorStore status update
    ↓
Configuration manager synchronization
    ↓
Renderer re-renders
    ↓
Component update display
```

### 1.4 Card 2.1 integrated architecture

```typescript
// Card 2.1 Integrated bridging
useVisualEditorIntegration({
  autoInit: true,        // automatic initialization
  enableI18n: true      // enable internationalization
})

// Component definition conversion process
Card2ComponentDefinition → WidgetDefinition → GraphData
```

---

## 2. coreAPIrefer to

### 2.1 mainComposables

#### `useEditor()` - Editor coreHook

```typescript
interface EditorContext {
  editorStore: EditorStore
  widgetStore: WidgetStore
  stateManager: EditorStore    // Alias
  
  // Core operating methods
  addWidget(type: string, position?: {x: number, y: number}): Promise<void>
  selectNode(id: string): void
  updateNode(id: string, updates: Partial<GraphData>): void
  removeNode(id: string): void
  getNodeById(id: string): GraphData | undefined
  
  // Card 2.1 integrated
  card2Integration: Card2Integration
  isCard2Component(type: string): boolean
}

// Usage example
const editor = createEditor()
await editor.addWidget('comprehensive-data-test', { x: 100, y: 100 })
editor.selectNode('comprehensive-data-test_1234567890')
```

#### `useVisualEditorIntegration()` - Card 2.1 integrated

```typescript
interface Card2Integration {
  isLoading: Ref<boolean>
  availableComponents: ComputedRef<ComponentInfo[]>
  availableWidgets: ComputedRef<Card2Widget[]>
  
  initialize(): Promise<void>
  getComponentDefinition(type: string): Card2Widget | undefined
  isCard2Component(type: string): boolean
}
```

### 2.2 Configuration managementAPI

#### ConfigurationManager core methods

```typescript
// Basic operations
const config = configurationManager.getConfiguration(widgetId)
configurationManager.setConfiguration(widgetId, newConfig)
configurationManager.updateConfiguration(widgetId, 'component', componentConfig)

// Listen for configuration changes
const unsubscribe = configurationManager.onConfigurationChange(widgetId, (config) => {
  console.log('Configuration has been updated:', config)
})

// Configuration verification
const result = configurationManager.validateConfiguration(config)
if (!result.valid) {
  console.error('Configuration verification failed:', result.errors)
}

// Batch operations
configurationManager.batchUpdateConfigurations([
  { widgetId: 'widget-1', config: { component: { title: 'new title' } } },
  { widgetId: 'widget-2', config: { dataSource: { type: 'api' } } }
])
```

### 2.3 Data source managementAPI

#### EditorDataSourceManager

```typescript
// Register component data source
editorDataSourceManager.registerComponentDataSource(
  componentId,
  componentType,
  config,
  trigger
)

// start up/Stop data source
editorDataSourceManager.startComponentDataSource(componentId)
editorDataSourceManager.stopComponentDataSource(componentId)

// event listening
editorDataSourceManager.on('data-updated', (eventData) => {
  const { componentId, result } = eventData
  // Handle data updates
})
```

### 2.4 Global polling managementAPI

#### GlobalPollingManager

```typescript
// Add polling task
const taskId = pollingManager.addTask({
  componentId: 'widget-123',
  componentName: 'temperature sensor',
  interval: 30000,
  callback: async () => {
    // Polling callback logic
  }
})

// Control polling
pollingManager.startTask(taskId)
pollingManager.stopTask(taskId)
pollingManager.enableGlobalPolling()
pollingManager.disableGlobalPolling()

// Get statistics
const stats = pollingManager.getStatistics()
// { totalTasks: 5, activeTasks: 3, errors: 0 }

// Component-level polling control
pollingManager.isComponentPollingActive(componentId)
pollingManager.startComponentTasks(componentId)
pollingManager.stopComponentTasks(componentId)
```

### 2.5 Polling controller componentAPI

#### PollingController components

```typescript
interface PollingControllerProps {
  /** control mode：global-global control, card-card control */
  mode?: 'global' | 'card'
  /** Components in card modeID */
  componentId?: string
  /** Controller location */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Whether to display statistics */
  showStats?: boolean
  /** low profile mode：Show only small icons，Show full button on hover */
  lowProfile?: boolean
}

// Usage example - Global polling control
<PollingController
  mode="global"
  position="bottom-right"
  :show-stats="true"
  :low-profile="true"
  @polling-toggle="handlePollingToggle"
  @polling-enabled="handlePollingEnabled"
  @polling-disabled="handlePollingDisabled"
/>

// Usage example - Single component polling control
<PollingController
  mode="card"
  :component-id="widgetId"
  position="top-right"
  :show-stats="false"
  :low-profile="false"
  @polling-toggle="handleCardPollingToggle"
/>
```

---

## 3. Development workflow

### 3.1 Project start process

```bash
# 1. Install dependencies
pnpm install

# 2. Start the development server
pnpm dev

# 3. Visit the test page
# http://localhost:5002/test/editor-integration

# 4. Quality check
pnpm quality-check
```

### 3.2 Development environment configuration

#### Necessary development tools

```json
{
  "devtools": [
    "Vue.js devtools",
    "Vite DevTools",
    "TypeScript",
    "ESLint",
    "Prettier"
  ],
  "vscode_extensions": [
    "Vue.volar",
    "TypeScript Vue Plugin",
    "ESLint",
    "Prettier"
  ]
}
```

#### Key configuration files

- `vite.config.ts` - Build configuration，Memory optimization settings
- `eslint.config.js` - Code quality rules
- `tsconfig.json` - TypeScript Configuration
- `package.json` - Dependencies and script definitions

### 3.3 Debug configuration

#### Console debug identifier

```typescript
// Find these identifiers in the console for debugging
console.log('🎯 [Editor]')        // Editor core
console.log('🔍 [DEBUG-Configure warehouse]')  // Configure system debugging
console.log('🔄 [PanelEditor]')   // Panel editor
console.log('📊 [poll manager]')      // polling system
console.log('🚀 [Data source manager]')    // Data source system
```

#### Developer tools integration

```typescript
// Debugging methods available in browser console
window.__VISUAL_EDITOR_DEBUG__ = {
  getEditorState: () => editorStore.$state,
  getConfigurations: () => configurationManager.getAllConfigurations(),
  getPollingStats: () => pollingManager.getStatistics(),
  clearCache: () => simpleDataBridge.clearAllCache(),
  
  // Added actually available debugging methods
  getComponentTree: () => stateManager.nodes,
  getCurrentRenderer: () => currentRenderer.value,
  getPollingManager: () => pollingManager,
  testPollingTask: (componentId) => pollingManager.isComponentPollingActive(componentId)
}
```

---

## 4. Component Development Guide

### 4.1 create newWidgetcomponents

#### Step 1: Define component interface

```typescript
// types/my-widget.ts
export interface MyWidgetConfig {
  title: string
  backgroundColor: string
  dataSource?: DataSourceConfig
}

export interface MyWidgetProps {
  config: MyWidgetConfig
  data?: any
  readonly?: boolean
}
```

#### Step 2: Implement components

```vue
<!-- MyWidget.vue -->
<script setup lang="ts">
import type { MyWidgetProps } from './types'
import { useThemeStore } from '@/store/modules/theme'
import { useI18n } from 'vue-i18n'

// Props and basic settings
const props = withDefaults(defineProps<MyWidgetProps>(), {
  readonly: false
})

// Themes and internationalization integration（Mandatory requirements）
const themeStore = useThemeStore()
const { t } = useI18n()

// Component logic
const handleClick = () => {
  if (!props.readonly) {
    // Handle click logic
  }
}
</script>

<template>
  <n-card class="my-widget" :bordered="false">
    <template #header>
      <span class="widget-title">{{ config.title || t('widgets.myWidget.defaultTitle') }}</span>
    </template>
    
    <div class="widget-content" :style="{ backgroundColor: config.backgroundColor }">
      <!-- Component content -->
      <span>{{ t('widgets.myWidget.dataValue') }}: {{ data?.value || 'N/A' }}</span>
    </div>
  </n-card>
</template>

<style scoped>
.my-widget {
  width: 100%;
  height: 100%;
}

.widget-content {
  /* Use theme variables，Automatically adapt to light and dark themes */
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 12px;
}
</style>
```

#### Step 3: Create a property editor

```vue
<!-- MyWidgetPropertyEditor.vue -->
<script setup lang="ts">
import type { MyWidgetConfig } from './types'

const props = defineProps<{
  config: MyWidgetConfig
}>()

const emit = defineEmits<{
  'update:config': [config: MyWidgetConfig]
}>()

const handleConfigChange = (key: keyof MyWidgetConfig, value: any) => {
  emit('update:config', { ...props.config, [key]: value })
}
</script>

<template>
  <n-form label-placement="top">
    <n-form-item :label="$t('widgets.myWidget.titleLabel')">
      <n-input 
        :value="config.title"
        @update:value="(val) => handleConfigChange('title', val)"
        :placeholder="$t('widgets.myWidget.titlePlaceholder')"
      />
    </n-form-item>
    
    <n-form-item :label="$t('widgets.myWidget.backgroundColorLabel')">
      <n-color-picker 
        :value="config.backgroundColor"
        @update:value="(val) => handleConfigChange('backgroundColor', val)"
      />
    </n-form-item>
  </n-form>
</template>
```

#### Step 4: Register component

```typescript
// widgets/my-widget/index.ts
import MyWidget from './MyWidget.vue'
import MyWidgetPropertyEditor from './MyWidgetPropertyEditor.vue'
import type { WidgetDefinition } from '../types'

export const myWidgetDefinition: WidgetDefinition = {
  type: 'my-widget',
  name: 'My Widget',
  description: 'Custom widget example',
  icon: 'mdi:cube-outline',
  category: 'custom',
  version: '1.0.0',
  component: MyWidget,
  propertyEditor: MyWidgetPropertyEditor,
  defaultProperties: {
    title: 'My Widget',
    backgroundColor: '#ffffff'
  },
  defaultLayout: {
    canvas: { width: 300, height: 200 },
    gridstack: { w: 4, h: 3 }
  },
  metadata: {
    isCard2Component: false,
    author: 'Developer Name',
    tags: ['custom', 'example']
  }
}

// Register to widget store
import { useWidgetStore } from '@/components/visual-editor/store/widget'
const widgetStore = useWidgetStore()
widgetStore.register(myWidgetDefinition)
```

### 4.2 Card 2.1 Component integration

#### Component definition structure

```typescript
// Card 2.1 Component definition
export const card2ComponentDefinition: ComponentDefinition = {
  type: 'dual-data-display',
  name: 'Dual data display component',
  description: 'Display data from two data sources',
  icon: 'i-mdi:chart-line',
  category: 'data-display',
  version: '2.1.0',
  
  // Data Requirements Statement
  dataRequirements: {
    dataSource1: {
      type: 'object',
      required: true,
      properties: {
        temperature: { type: 'number' },
        unit: { type: 'string' }
      }
    },
    dataSource2: {
      type: 'object',
      required: false,
      properties: {
        humidity: { type: 'number' }
      }
    }
  },
  
  // Property definition
  properties: {
    title: {
      type: 'string',
      default: 'Data display',
      description: 'Component title'
    },
    showBorder: {
      type: 'boolean',
      default: true,
      description: 'Show borders'
    }
  },
  
  // render component
  component: DualDataDisplayWidget,
  
  // Configure components
  configComponent: DualDataDisplayConfig
}
```

### 4.3 Data binding best practices

#### Responsive data processing

```vue
<script setup lang="ts">
import { computed, watch } from 'vue'

const props = defineProps<{
  data: Record<string, any>
  config: WidgetConfig
}>()

// Computed properties handle data transformations
const displayValue = computed(() => {
  if (!props.data) return 'N/A'
  
  const value = props.data.temperature || props.data.value
  const unit = props.data.unit || '°C'
  
  return `${value}${unit}`
})

// Monitor data changes，Perform side effects
watch(() => props.data, (newData) => {
  if (newData?.alert && props.config.enableAlerts) {
    // Alarm processing logic
  }
}, { deep: true })
</script>
```

---

## 5. Renderer development

### 5.1 Renderer architecture

#### Basic renderer class

```typescript
// BaseRenderer.ts
export abstract class BaseRenderer implements IRenderer {
  protected container: HTMLElement
  protected nodes: GraphData[] = []
  
  constructor(container: HTMLElement) {
    this.container = container
    this.initialize()
  }
  
  abstract initialize(): void
  abstract render(data: GraphData[]): void
  abstract updateNode(id: string, updates: Partial<GraphData>): void
  abstract destroy(): void
  
  // general method
  protected findNode(id: string): GraphData | undefined {
    return this.nodes.find(node => node.id === id)
  }
  
  protected emitEvent(eventName: string, data: any): void {
    this.container.dispatchEvent(new CustomEvent(eventName, { detail: data }))
  }
}
```

### 5.2 Create a custom renderer

#### Step 1: Implement renderer class

```typescript
// CustomRenderer.ts
export class CustomRenderer extends BaseRenderer {
  private renderContext: CanvasRenderingContext2D | null = null
  
  initialize(): void {
    const canvas = document.createElement('canvas')
    canvas.width = this.container.clientWidth
    canvas.height = this.container.clientHeight
    
    this.renderContext = canvas.getContext('2d')
    this.container.appendChild(canvas)
    
    // Monitor container size changes
    this.setupResizeObserver()
  }
  
  render(data: GraphData[]): void {
    this.nodes = data
    this.clearCanvas()
    
    data.forEach(node => {
      this.renderNode(node)
    })
  }
  
  updateNode(id: string, updates: Partial<GraphData>): void {
    const node = this.findNode(id)
    if (node) {
      Object.assign(node, updates)
      this.render(this.nodes) // Re-render
    }
  }
  
  private renderNode(node: GraphData): void {
    if (!this.renderContext) return
    
    const { x, y, width, height } = node.layout?.canvas || node
    
    // Draw node background
    this.renderContext.fillStyle = '#ffffff'
    this.renderContext.fillRect(x, y, width, height)
    
    // draw border
    this.renderContext.strokeStyle = '#cccccc'
    this.renderContext.strokeRect(x, y, width, height)
    
    // draw labels
    if (node.showLabel && node.label) {
      this.renderContext.fillStyle = '#333333'
      this.renderContext.font = '14px Arial'
      this.renderContext.fillText(node.label, x + 10, y + 25)
    }
  }
  
  private clearCanvas(): void {
    if (this.renderContext) {
      this.renderContext.clearRect(0, 0, this.container.clientWidth, this.container.clientHeight)
    }
  }
  
  destroy(): void {
    // Clean up resources
    this.container.innerHTML = ''
  }
}
```

#### Step 2: Register renderer

```typescript
// renderers/index.ts
import { CustomRenderer } from './CustomRenderer'

export const rendererRegistry = new Map<string, typeof BaseRenderer>()

// Register renderer
rendererRegistry.set('custom', CustomRenderer)

// factory method
export function createRenderer(type: string, container: HTMLElement): BaseRenderer | null {
  const RendererClass = rendererRegistry.get(type)
  if (RendererClass) {
    return new RendererClass(container)
  }
  return null
}
```

### 5.3 RendererVueComponent packaging

```vue
<!-- CustomRenderer.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { CustomRenderer } from './CustomRenderer'

const props = defineProps<{
  nodes: GraphData[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'node-select': [id: string]
  'node-update': [id: string, updates: Partial<GraphData>]
}>()

const containerRef = ref<HTMLElement>()
let renderer: CustomRenderer | null = null

onMounted(() => {
  if (containerRef.value) {
    renderer = new CustomRenderer(containerRef.value)
    
    // Listening to renderer events
    containerRef.value.addEventListener('node-select', (event: CustomEvent) => {
      emit('node-select', event.detail.nodeId)
    })
    
    // initial rendering
    renderer.render(props.nodes)
  }
})

onUnmounted(() => {
  renderer?.destroy()
})

// monitorpropschange
watch(() => props.nodes, (newNodes) => {
  renderer?.render(newNodes)
}, { deep: true })
</script>

<template>
  <div ref="containerRef" class="custom-renderer">
    <!-- renderer container -->
  </div>
</template>

<style scoped>
.custom-renderer {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
```

---

## 6. Data flow and state management

### 6.1 State management architecture

#### Pinia Store design pattern

```typescript
// state definition pattern
interface StoreState {
  // Basic data
  entities: Entity[]
  
  // UIstate
  loading: boolean
  error: string | null
  
  // Select status
  selectedIds: string[]
  
  // configuration status
  preferences: UserPreferences
}

// Actions model
interface StoreActions {
  // Asynchronous operations
  fetchData(): Promise<void>
  saveData(data: Entity): Promise<void>
  
  // Synchronous operation
  setLoading(loading: boolean): void
  setError(error: string | null): void
  
  // Batch operations
  batchUpdate(updates: EntityUpdate[]): void
}
```

#### Responsive data synchronization

```typescript
// Auto sync mode
export const useDataSync = (storeKey: string) => {
  const store = useStore(storeKey)
  
  // Monitor local changes，Sync to remote
  watchEffect(() => {
    const localData = store.$state
    syncToRemote(storeKey, localData)
  })
  
  // Listen for remote changes，Sync to local
  onRemoteChange(storeKey, (remoteData) => {
    store.$patch(remoteData)
  })
}
```

### 6.2 Configure data flow

#### Configure update process

```
user input
    ↓
Property Editor
    ↓
ConfigurationManager.updateConfiguration()
    ↓
Configuration verification
    ↓
Persistent storage（localStorage）
    ↓
event notification system
    ↓
Component re-render
```

#### Configure listening mode

```typescript
// Component-level configuration monitoring
const useWidgetConfig = (widgetId: string) => {
  const config = ref<WidgetConfiguration>()
  
  const unsubscribe = configurationManager.onConfigurationChange(widgetId, (newConfig) => {
    config.value = newConfig
  })
  
  onUnmounted(() => {
    unsubscribe()
  })
  
  return {
    config: readonly(config),
    updateConfig: (updates: Partial<WidgetConfiguration>) => {
      configurationManager.updateConfiguration(widgetId, updates)
    }
  }
}
```

### 6.3 Data source management

#### Data source registration and management

```typescript
// Data source configuration type
interface DataSourceConfig {
  type: 'static' | 'api' | 'websocket' | 'multi-source'
  config: Record<string, any>
  enabled: boolean
  triggers: DataSourceTrigger[]
}

// Data source manager
class DataSourceManager {
  private sources = new Map<string, DataSource>()
  private eventBus = new EventEmitter()
  
  registerDataSource(componentId: string, config: DataSourceConfig): void {
    const dataSource = this.createDataSource(config)
    this.sources.set(componentId, dataSource)
    
    // Set up data update listening
    dataSource.on('data-updated', (data) => {
      this.eventBus.emit('component-data-updated', {
        componentId,
        data,
        timestamp: Date.now()
      })
    })
  }
  
  private createDataSource(config: DataSourceConfig): DataSource {
    switch (config.type) {
      case 'api':
        return new ApiDataSource(config.config)
      case 'websocket':
        return new WebSocketDataSource(config.config)
      case 'static':
        return new StaticDataSource(config.config)
      default:
        throw new Error(`Unsupported data source type: ${config.type}`)
    }
  }
}
```

---

## 7. Configuration system in depth

### 7.1 Configuration hierarchy

```typescript
interface WidgetConfiguration {
  // base layer - Common properties（title、style、Visibility etc.）
  base: {
    title?: string
    showTitle?: boolean
    opacity?: number
    zIndex?: number
    borderRadius?: number
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
  }
  
  // component layer - Component specific configuration
  component: {
    properties: Record<string, any>  // Component properties
    validation?: {                   // Validation rules
      required: string[]
      constraints: Record<string, any>
    }
    polling?: {                      // Polling configuration
      enabled: boolean
      interval: number
      retryCount: number
    }
  }
  
  // data source layer - Data binding configuration
  dataSource: {
    type: 'static' | 'api' | 'websocket' | 'multi-source' | 'data-mapping'
    enabled: boolean
    config: Record<string, any>
    metadata?: {
      lastUpdated: number
      version: string
    }
  }
  
  // interaction layer - User interaction configuration
  interaction: {
    onClick?: InteractionConfig
    onHover?: InteractionConfig
    onDoubleClick?: InteractionConfig
    [key: string]: InteractionConfig | undefined
  }
  
  // metadata - Configuration version and audit information
  metadata: {
    version: string
    createdAt: number
    updatedAt: number
    description?: string
    author?: string
    tags?: string[]
  }
}
```

### 7.2 Configure verification system

#### Validation rule definition

```typescript
interface ValidationRule {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array'
  min?: number
  max?: number
  pattern?: RegExp
  enum?: any[]
  customValidator?: (value: any) => boolean | string
}

// Configure validator
class ConfigurationValidator {
  private rules: Map<string, ValidationRule[]> = new Map()
  
  registerRules(componentType: string, rules: ValidationRule[]): void {
    this.rules.set(componentType, rules)
  }
  
  validate(componentType: string, config: WidgetConfiguration): ValidationResult {
    const rules = this.rules.get(componentType) || []
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    for (const rule of rules) {
      const result = this.validateField(config, rule)
      if (result.type === 'error') {
        errors.push(result)
      } else if (result.type === 'warning') {
        warnings.push(result)
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }
  
  private validateField(config: any, rule: ValidationRule): ValidationError | ValidationWarning | null {
    const value = this.getNestedValue(config, rule.field)
    
    // Required examine
    if (rule.required && (value === undefined || value === null)) {
      return {
        type: 'error',
        field: rule.field,
        message: `Field ${rule.field} is required`,
        value
      }
    }
    
    // Type examine
    if (value !== undefined && rule.type && typeof value !== rule.type) {
      return {
        type: 'error',
        field: rule.field,
        message: `Field ${rule.field} Type should be ${rule.type}，Actually ${typeof value}`,
        value
      }
    }
    
    // Custom validator
    if (rule.customValidator && value !== undefined) {
      const result = rule.customValidator(value)
      if (typeof result === 'string') {
        return {
          type: 'error',
          field: rule.field,
          message: result,
          value
        }
      } else if (result === false) {
        return {
          type: 'error',
          field: rule.field,
          message: `Field ${rule.field} Authentication failed`,
          value
        }
      }
    }
    
    return null
  }
  
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
}
```

### 7.3 Configure migration system

```typescript
interface ConfigurationMigrator {
  fromVersion: string
  toVersion: string
  migrate(config: WidgetConfiguration): WidgetConfiguration
  description?: string
}

// Configuration migration example
const migrationV1ToV2: ConfigurationMigrator = {
  fromVersion: '1.0.0',
  toVersion: '2.0.0',
  description: 'Migrate to new data source configuration format',
  
  migrate(config: WidgetConfiguration): WidgetConfiguration {
    const newConfig = { ...config }
    
    // Migrate olddataSourceformat to new format
    if (newConfig.dataSource && typeof newConfig.dataSource.sources === 'object') {
      // conversion logic
      newConfig.dataSource = {
        type: 'multi-source',
        enabled: true,
        config: {
          sources: Object.entries(newConfig.dataSource.sources).map(([key, source]) => ({
            id: key,
            ...source as any
          }))
        }
      }
    }
    
    // Update version information
    newConfig.metadata.version = '2.0.0'
    newConfig.metadata.migratedAt = Date.now()
    
    return newConfig
  }
}
```

---

## 8. Performance optimization strategies

### 8.1 Rendering performance optimization

#### Virtual scrolling implementation

```typescript
class VirtualRenderer {
  private visibleNodes: GraphData[] = []
  private viewport: Viewport = { x: 0, y: 0, width: 0, height: 0 }
  
  updateVisibleNodes(allNodes: GraphData[], viewport: Viewport): void {
    this.viewport = viewport
    
    // Only render nodes within the visible area
    this.visibleNodes = allNodes.filter(node => 
      this.isNodeVisible(node, viewport)
    )
    
    // add buffer，Render nodes that are about to enter the viewport in advance
    const buffer = 100
    const extendedViewport = {
      x: viewport.x - buffer,
      y: viewport.y - buffer,
      width: viewport.width + buffer * 2,
      height: viewport.height + buffer * 2
    }
    
    this.visibleNodes = allNodes.filter(node => 
      this.isNodeVisible(node, extendedViewport)
    )
  }
  
  private isNodeVisible(node: GraphData, viewport: Viewport): boolean {
    const nodeRight = node.x + node.width
    const nodeBottom = node.y + node.height
    const viewportRight = viewport.x + viewport.width
    const viewportBottom = viewport.y + viewport.height
    
    return !(
      node.x > viewportRight ||
      nodeRight < viewport.x ||
      node.y > viewportBottom ||
      nodeBottom < viewport.y
    )
  }
}
```

#### Batch update optimization

```typescript
class BatchUpdateManager {
  private updateQueue: UpdateTask[] = []
  private updateTimer: number | null = null
  
  scheduleUpdate(task: UpdateTask): void {
    this.updateQueue.push(task)
    
    if (!this.updateTimer) {
      this.updateTimer = requestAnimationFrame(() => {
        this.flushUpdates()
      })
    }
  }
  
  private flushUpdates(): void {
    // Merge updates from the same node
    const mergedUpdates = new Map<string, Partial<GraphData>>()
    
    for (const task of this.updateQueue) {
      if (mergedUpdates.has(task.nodeId)) {
        Object.assign(mergedUpdates.get(task.nodeId)!, task.updates)
      } else {
        mergedUpdates.set(task.nodeId, task.updates)
      }
    }
    
    // Apply updates in batches
    for (const [nodeId, updates] of mergedUpdates) {
      this.applyUpdate(nodeId, updates)
    }
    
    // clean up
    this.updateQueue = []
    this.updateTimer = null
  }
}
```

### 8.2 Memory management

#### Component cleanup mode

```typescript
export const useComponentCleanup = (componentId: string) => {
  const cleanupTasks: (() => void)[] = []
  
  const addCleanupTask = (task: () => void) => {
    cleanupTasks.push(task)
  }
  
  const cleanup = () => {
    cleanupTasks.forEach(task => {
      try {
        task()
      } catch (error) {
        console.error(`Cleanup task failed:`, error)
      }
    })
    cleanupTasks.length = 0
  }
  
  onUnmounted(cleanup)
  
  return { addCleanupTask, cleanup }
}
```

#### Data caching strategy

```typescript
class DataCache {
  private cache = new Map<string, CacheItem>()
  private maxSize = 100
  private ttl = 5 * 60 * 1000 // 5minute
  
  set(key: string, value: any): void {
    // LRU Cache implementation
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0
    })
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    // examineTTL
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    // Update access statistics
    item.hits++
    
    // move to end（LRU）
    this.cache.delete(key)
    this.cache.set(key, item)
    
    return item.value
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  getStats(): CacheStats {
    let totalHits = 0
    let oldestTimestamp = Date.now()
    
    for (const item of this.cache.values()) {
      totalHits += item.hits
      oldestTimestamp = Math.min(oldestTimestamp, item.timestamp)
    }
    
    return {
      size: this.cache.size,
      totalHits,
      oldestAge: Date.now() - oldestTimestamp
    }
  }
}
```

### 8.3 Asynchronous loading optimization

#### Lazy loading of components

```typescript
// Dynamic component loader
const ComponentLoader = {
  cache: new Map<string, Promise<Component>>(),
  
  async loadComponent(type: string): Promise<Component> {
    if (this.cache.has(type)) {
      return this.cache.get(type)!
    }
    
    const componentPromise = this.createComponentPromise(type)
    this.cache.set(type, componentPromise)
    
    return componentPromise
  },
  
  private createComponentPromise(type: string): Promise<Component> {
    return new Promise(async (resolve, reject) => {
      try {
        let component: Component
        
        // Dynamically import components based on type
        switch (type) {
          case 'chart-widget':
            component = (await import('@/components/visual-editor/widgets/chart/ChartWidget.vue')).default
            break
          case 'text-widget':
            component = (await import('@/components/visual-editor/widgets/text/TextWidget.vue')).default
            break
          default:
            // Card 2.1 Lazy loading of components
            const card2Integration = useCard2Integration()
            component = await card2Integration.loadComponent(type)
        }
        
        resolve(component)
      } catch (error) {
        reject(error)
      }
    })
  }
}
```

---

## 9. Troubleshooting Guide

### 9.1 Diagnosis of common problems

#### Component not showing problem

**symptom**: The component does not appear or appears blank after being added to the canvas

**Diagnostic steps**:
```javascript
// 1. Check whether the component is registered correctly
const widgetStore = useWidgetStore()
console.log('Registered components:', widgetStore.getAllWidgets().map(w => w.type))

// 2. Check node data
const editorStore = useEditorStore()
console.log('canvas node:', editorStore.nodes)

// 3. Check component definition
const widget = widgetStore.getWidget('your-widget-type')
console.log('Component definition:', widget)

// 4. examineCard2.1Integration status
const card2Integration = useCard2Integration()
console.log('Card2.1state:', {
  isLoading: card2Integration.isLoading.value,
  availableComponents: card2Integration.availableComponents.value.length
})

// 5. Check renderer status
console.log('Current renderer:', currentRenderer.value)
console.log('Renderer data source status:', multiDataSourceStore.value)

// 6. Check if the component is in the visible area
const node = editorStore.nodes.find(n => n.type === 'your-widget-type')
console.log('Component location and size:', node && {
  x: node.x, y: node.y, width: node.width, height: node.height
})
```

**solution**:
- Make sure the component is properly registered to WidgetStore
- examine Card2.1 Whether the component is initialized correctly  
- Verify the component defaultLayout Configuration
- Check the component's property definitions and default values
- Confirm that the component is visible within the current viewport
- Verify whether the data source the component depends on is normal

#### Configuration not saving problem

**symptom**: Component configuration is not saved after modification or lost after page refresh

**Diagnostic steps**:
```javascript
// 1. Check configuration manager status
console.log('configuration manager:', configurationManager.getAllConfigurations())

// 2. examinelocalStorage
console.log('local storage:', localStorage.getItem('visual-editor-configurations'))

// 3. Check panel save status
console.log('panel data:', panelData.value)
console.log('Editor configuration:', editorConfig.value)
```

**solution**:
- make sure ConfigurationManager Correct initialization
- examine localStorage permissions and space
- Verify panel save interface call
- Check whether the configuration verification passes
- confirm `configurationIntegrationBridge` Correct settings
- verify `getState()` and `setState()` method works fine

#### Polling system issues

**symptom**: Component data is not updated or polling is not started

**Diagnostic steps**:
```javascript
// 1. Check global polling status
console.log('Global polling status:', pollingManager.isGlobalPollingEnabled())
console.log('Polling statistics:', pollingManager.getStatistics())

// 2. Check component polling configuration
const componentConfig = configurationManager.getConfiguration(componentId)
console.log('Component polling configuration:', componentConfig?.component?.polling)

// 3. Check polling tasks
console.log('All tasks:', pollingManager.getAllTasks())
console.log('Component tasks:', pollingManager.getComponentTasks(componentId))

// 4. Check the data source manager
console.log('Data source manager status:', editorDataSourceManager.getStatistics())
```

**solution**:
- Make sure global polling is enabled in preview mode
- Check if the component is configured with the correct data source
- verify `initializePollingTasksAndEnable()` is called correctly
- Check whether the polling callback function is executed correctly
- confirm PollingController Component event binding is correct

#### Diagnosing performance issues

**symptom**: Interface stuck、Slow response

**diagnostic tools**:
```javascript
// Performance monitoring
const performanceMonitor = {
  startTime: 0,
  
  start(operation: string) {
    this.startTime = performance.now()
    console.time(operation)
  },
  
  end(operation: string) {
    const duration = performance.now() - this.startTime
    console.timeEnd(operation)
    console.log(`${operation} time consuming: ${duration.toFixed(2)}ms`)
  },
  
  memory() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      console.log('memory usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      })
    }
  }
}

// Usage example
performanceMonitor.start('Component rendering')
// ... perform operations
performanceMonitor.end('Component rendering')
performanceMonitor.memory()
```

### 9.2 Debugging toolset

#### Developer console extension

```typescript
// Debugging tools available in development environment
if (process.env.NODE_ENV === 'development') {
  (window as any).__VISUAL_EDITOR_DEBUG__ = {
    // status check
    getEditorState: () => ({
      nodes: editorStore.nodes,
      selectedIds: widgetStore.selectedNodeIds,
      configurations: Object.fromEntries(configurationManager.getAllConfigurations())
    }),
    
    // Performance analysis
    getPerformanceStats: () => ({
      nodeCount: editorStore.nodes.length,
      configurationCount: configurationManager.getAllConfigurations().size,
      memoryUsage: (performance as any).memory
    }),
    
    // Debugging operations
    clearAllConfigurations: () => {
      configurationManager.getAllConfigurations().clear()
    },
    
    forceRerender: () => {
      // force rerender
      const nodes = [...editorStore.nodes]
      editorStore.setNodes([])
      nextTick(() => {
        editorStore.setNodes(nodes)
      })
    },
    
    // Export debugging data
    exportDebugData: () => {
      const debugData = {
        timestamp: Date.now(),
        version: '2.0.0',
        editorState: editorStore.$state,
        configurations: Object.fromEntries(configurationManager.getAllConfigurations()),
        performance: {
          memory: (performance as any).memory,
          timing: performance.timing
        }
      }
      
      const blob = new Blob([JSON.stringify(debugData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `visual-editor-debug-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }
}
```

#### Logging system

```typescript
// hierarchical logging system
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel = LogLevel.INFO
  private prefix = '[Visual Editor]'
  
  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`${this.prefix} 🔍`, message, ...args)
    }
  }
  
  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`${this.prefix} ℹ️`, message, ...args)
    }
  }
  
  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`${this.prefix} ⚠️`, message, ...args)
    }
  }
  
  error(message: string, error?: Error, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`${this.prefix} ❌`, message, error, ...args)
    }
  }
  
  setLevel(level: LogLevel): void {
    this.level = level
  }
}

export const logger = new Logger()
```

---

## 10. best practices

### 10.1 Code organization specifications

#### Directory structure specification

```
components/visual-editor/
├── components/           # UIcomponents
│   ├── common/          # Common components
│   ├── toolbar/         # Toolbar related
│   ├── PropertyPanel/   # Properties panel
│   └── WidgetLibrary/   # Component library panel
├── renderers/           # Renderer implementation
│   ├── base/           # Basic classes and interfaces
│   ├── canvas/         # CanvasRenderer
│   └── gridstack/      # GridstackRenderer
├── widgets/             # Component implementation
│   ├── base/           # Basic components
│   ├── chart/          # chart component
│   └── custom/         # Custom component
├── configuration/       # Configuration management
│   ├── components/     # ConfigurationUIcomponents
│   └── types.ts        # Configuration type definition
├── core/               # core logic
├── hooks/              # Combined functions
├── store/              # Status management
├── types/              # TypeScripttype
└── utils/              # Utility function
```

#### Naming convention

```typescript
// File naming：kebab-case
// my-widget-component.vue
// configuration-manager.ts

// Component naming：PascalCase
export default defineComponent({
  name: 'MyWidgetComponent'
})

// Interface naming：PascalCase，Iprefix
interface IWidgetRenderer {
  render(): void
}

// Type naming：PascalCase
type WidgetConfiguration = {
  // ...
}

// Constant naming：SCREAMING_SNAKE_CASE
const DEFAULT_WIDGET_SIZE = { width: 300, height: 200 }

// Function naming：camelCase
function createWidgetInstance(): Widget {
  // ...
}
```

### 10.2 Development workflow

#### GitWorkflow

```bash
# 1. Create feature branch
git checkout -b feature/new-widget-type

# 2. Develop and submit
git add .
git commit -m "feat: Add new data display component

- Implement basic data binding functions
- Add configuration panel support
- Integrated theme system
- Add unit tests

🤝 Co-authored-by: Claude <noreply@anthropic.com>"

# 3. Code quality check
pnpm quality-check
pnpm typecheck
pnpm lint

# 4. Merge into master branch
git checkout master
git merge feature/new-widget-type
```

#### code review checklist

```markdown
## code review checklist

### 🎯 Functional
- [ ] Functionality works as required
- [ ] Error situations are handled appropriately
- [ ] Boundary conditions are fully considered

### 🏗️ Architectural
- [ ] Comply with existing architectural patterns
- [ ] Component responsibilities are single and clear
- [ ] Dependencies are reasonable

### 🎨 Code quality
- [ ] Code is clear and easy to read
- [ ] Consistent naming conventions
- [ ] Comments are fully valid
- [ ] No duplicate code

### 🚀 performance
- [ ] No obvious performance issues
- [ ] Use caching appropriately
- [ ] Avoid unnecessary re-rendering

### 🧪 test
- [ ] Adequate unit test coverage
- [ ] Integration test passed
- [ ] Manual test verification

### 📱 compatibility
- [ ] Support light and dark themes
- [ ] Responsive design adaptation
- [ ] Browser compatibility

### 🌐 internationalization
- [ ] All user-visible text usesi18n
- [ ] Complete Chinese annotations
- [ ] Documents are updated in a timely manner
```

### 10.3 Performance best practices

#### Component performance optimization

```vue
<script setup lang="ts">
// ✅ use defineProps and defineEmits
const props = defineProps<{
  data: WidgetData
  config: WidgetConfig
}>()

const emit = defineEmits<{
  update: [data: WidgetData]
}>()

// ✅ use computed Perform data conversion
const displayValue = computed(() => {
  return props.data?.value?.toString() || 'N/A'
})

// ✅ use watch Listen for specific properties
watch(() => props.config.refreshRate, (newRate) => {
  setupRefreshInterval(newRate)
})

// ❌ Avoid complex calculations in templates
// <span>{{ formatComplexData(props.data) }}</span>

// ✅ Use computed properties
const formattedData = computed(() => formatComplexData(props.data))
</script>

<template>
  <div class="widget">
    <!-- ✅ Use computed properties -->
    <span>{{ formattedData }}</span>
    
    <!-- ✅ Conditional rendering optimization -->
    <div v-if="props.config.showDetails" class="details">
      <ExpensiveComponent :data="props.data" />
    </div>
  </div>
</template>
```

#### Data processing optimization

```typescript
// ✅ Using object freezing to improve performance
const frozenConfig = Object.freeze({
  defaultOptions: {
    animation: true,
    responsive: true
  }
})

// ✅ use Map instead of Object Make frequent searches
const componentMap = new Map<string, ComponentDefinition>()
componentMap.set('widget-type', definition)

// ✅ Batch data updates
const batchUpdateNodes = (updates: NodeUpdate[]) => {
  // Collect all updates
  const nodeUpdates = new Map<string, Partial<GraphData>>()
  
  updates.forEach(update => {
    const existing = nodeUpdates.get(update.nodeId) || {}
    nodeUpdates.set(update.nodeId, { ...existing, ...update.changes })
  })
  
  // Batch application
  nodeUpdates.forEach((changes, nodeId) => {
    updateNode(nodeId, changes)
  })
}

// ✅ use WeakMap Avoid memory leaks
const componentInstances = new WeakMap<Element, ComponentInstance>()
```

### 10.4 Error handling best practices

#### Error boundary implementation

```vue
<!-- ErrorBoundary.vue -->
<script setup lang="ts">
import { ref, provide, onErrorCaptured } from 'vue'

const error = ref<Error | null>(null)
const errorInfo = ref<string>('')

// Error catching
onErrorCaptured((err, instance, info) => {
  error.value = err
  errorInfo.value = info
  
  // Record error log
  logger.error('Component error catching', err, {
    componentName: instance?.$options.name,
    errorInfo: info,
    timestamp: Date.now()
  })
  
  // Stop errors from spreading
  return false
})

// Retry mechanism
const retry = () => {
  error.value = null
  errorInfo.value = ''
}

// Provide error status to child components
provide('error-boundary', {
  hasError: computed(() => !!error.value),
  retry
})
</script>

<template>
  <div class="error-boundary">
    <!-- Error status display -->
    <div v-if="error" class="error-display">
      <n-result status="error" :title="$t('common.componentError')">
        <template #extra>
          <n-space>
            <n-button @click="retry">{{ $t('common.retry') }}</n-button>
            <n-button type="primary" @click="$emit('report-error', { error, errorInfo })">
              {{ $t('common.reportError') }}
            </n-button>
          </n-space>
        </template>
      </n-result>
    </div>
    
    <!-- normal content -->
    <slot v-else />
  </div>
</template>
```

#### Asynchronous error handling

```typescript
// Unified asynchronous error handling
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: Error) => void
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      
      // Log errors
      logger.error('Asynchronous operation failed', err, { args })
      
      // Custom error handling
      if (errorHandler) {
        errorHandler(err)
      } else {
        // Default error handling
        message.error(err.message || 'Operation failed')
      }
      
      // rethrow error，Let the caller decide what to do with
      throw err
    }
  }) as T
}

// Usage example
const saveConfiguration = withErrorHandling(
  async (config: WidgetConfiguration) => {
    await configurationManager.setConfiguration(widgetId, config)
    message.success('Configuration saved successfully')
  },
  (error) => {
    // Custom error handling
    message.error(`Configuration save failed: ${error.message}`)
  }
)
```

---

## 🚀 Quick start guide

### Getting Started 5 minute

#### 1. Start the development environment
```bash
# Clone the project and install dependencies
pnpm install
# Start the development server
pnpm dev
# Visit the test page
# http://localhost:5002/test/editor-integration
```

#### 2. Create the first component
```vue
<!-- MyFirstWidget.vue -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  data?: { temperature: number }
  config?: { title: string, unit: string }
}>()

const { t } = useI18n()
</script>

<template>
  <n-card>
    <template #header>{{ config?.title || t('widgets.temperature') }}</template>
    <n-statistic 
      :value="data?.temperature || 0" 
      :suffix="config?.unit || '°C'"
    />
  </n-card>
</template>
```

#### 3. Register and test components
```typescript
// exist Card 2.1 Register in the system
const temperatureWidget: ComponentDefinition = {
  type: 'temperature-sensor',
  name: 'temperature sensor',
  component: MyFirstWidget,
  properties: {
    title: { type: 'string', default: 'temperature' },
    unit: { type: 'string', default: '°C' }
  }
}

// Add in editor
const editor = createEditor()
await editor.addWidget('temperature-sensor')
```

#### 4. Configure data source
```typescript
// Set in the component configuration panel
{
  dataSource: {
    type: 'api',
    config: {
      url: '/api/sensors/temperature',
      method: 'GET',
      interval: 30000 // 30Second polling
    }
  }
}
```

### 🎯 Common development scenarios

#### scene1：Add new data visualization component
1. Create component Vue document
2. definition Card 2.1 组件definition
3. Create a property editor（Optional）
4. Configuration data requirement statement
5. Register to the component registry
6. Verify functionality on test page

#### scene2：Extend existing component functionality
1. Modify components properties definition
2. Update component rendering logic
3. Add or modify property editor
4. Run QA to ensure compatibility
5. Test whether new features work properly

#### scene3：Custom renderer development
1. inherit `BaseRenderer` kind
2. Implement the necessary rendering methods
3. create Vue component wrapper
4. Register to the renderer registry
5. Add toggle option to toolbar

#### scene4：Polling data source integration
1. Declare polling requirements in component configuration
2. Configure data source（API/WebSocket/static）
3. use PollingController Control polling
4. Handle data updates and error conditions
5. Test polling functionality in preview mode

### 🔧 Development skills

#### real-time debugging
```javascript
// Console quick debugging
window.__VISUAL_EDITOR_DEBUG__.getEditorState()
window.__VISUAL_EDITOR_DEBUG__.getPollingStats()

// Manually trigger polling
pollingManager.enableGlobalPolling()

// Check component status
const config = configurationManager.getConfiguration(componentId)
console.log('Component configuration:', config)
```

#### Performance monitoring
```javascript
// Monitor rendering performance
performance.mark('render-start')
// ... Perform rendering operations
performance.mark('render-end')
performance.measure('render-duration', 'render-start', 'render-end')
```

#### error recovery
```typescript
// Component-level error recovery
const safeRenderComponent = (component: Component) => {
  try {
    return renderComponent(component)
  } catch (error) {
    console.error('Component rendering failed:', error)
    return renderErrorFallback(error)
  }
}
```

---

## 📄 Summarize

Visual EditorThe system is a complex visual editing platform，This document details：

1. **System architecture** - In-depth analysis of multi-layer architecture design and data flow
2. **APIrefer to** - Complete interface documentation and usage examples
3. **Development Guide** - Best practices for component and renderer development
4. **Configure the system** - Hierarchical configuration management and verification mechanism
5. **Performance optimization** - Rendering optimization、Memory management and asynchronous loading strategies
6. **troubleshooting** - FAQ Diagnostic and Debugging Tools
7. **best practices** - Code specifications、Workflow and error handling

Follow the guidelines of this document，Developers can：
- 🚀 Get started quickly with system development
- 🎯 Create high-quality components and renderers
- 🔧 Diagnose and resolve problems effectively
- 📈 Optimize system performance and user experience
- 🤝 Maintain code quality and team collaboration efficiency

---

**Document maintenance**: Please update this document promptly when there are major system updates  
**feedback channel**: If you have any questions or suggestions，Please submit it in the project repositoryIssue  
**Version history**: CheckGitSubmit records for detailed change history