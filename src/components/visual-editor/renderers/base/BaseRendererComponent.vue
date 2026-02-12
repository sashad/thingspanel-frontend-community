<!--
  Basic renderer Vue components
  for Vue Component-based renderers provide a unified infrastructure
-->
<script setup lang="ts" generic="TConfig extends Record<string, any> = Record<string, any>">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import { useVisualEditor } from '@/store/modules/visual-editor' // 1. Import unified architecture

// Base Props interface
interface BaseRendererProps {
  readonly?: boolean
  config?: TConfig
}

// Base Emits interface
interface BaseRendererEmits {
  (e: 'ready'): void
  (e: 'error', error: Error): void
  (e: 'node-select', nodeId: string): void
  (e: 'node-update', nodeId: string, updates: any): void
  (e: 'canvas-click', event?: MouseEvent): void
  (e: 'state-change', state: string): void
}

// Props definition
const props = withDefaults(defineProps<BaseRendererProps>(), {
  readonly: false,
  config: () => ({}) as TConfig
})

// Emits definition
const emit = defineEmits<BaseRendererEmits>()

// 2. 🔥 Use the new unified architecture
const unifiedEditor = useVisualEditor()

const addWidget = async (componentType: string, position?: { x: number; y: number }) => {
  try {
    // 🔥 Make sure the system is initialized
    await unifiedEditor.initialize()

    // Create new node
    const newNode = {
      id: `${componentType}_${Date.now()}`,
      type: componentType,
      position: position || { x: 100, y: 100 },
      data: {
        componentType,
        title: componentType
      }
    }

    await unifiedEditor.addNode(newNode)
  } catch (error) {
    // Rethrow the error and let the upper layer handle it
    throw error
  }
}

// Renderer status
const rendererState = ref<'idle' | 'initializing' | 'ready' | 'rendering' | 'error' | 'destroyed'>('idle')
const rendererError = ref<Error | null>(null)
const isInitialized = ref(false)

// Theme support
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.darkMode)

// renderer container
const containerRef = ref<HTMLElement>()

// Computed properties
const isReady = computed(() => rendererState.value === 'ready')
const hasError = computed(() => rendererState.value === 'error')
const isReadonly = computed(() => props.readonly)

// Status management
const setState = (newState: typeof rendererState.value) => {
  if (rendererState.value !== newState) {
    const oldState = rendererState.value
    rendererState.value = newState
    emit('state-change', newState)
  }
}

// Error handling
const handleError = (error: Error) => {
  rendererError.value = error
  setState('error')
  emit('error', error)
}

// 3. achieve unified handleDrop logic
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  if (isReadonly.value) return

  const jsonData = event.dataTransfer?.getData('application/json')
  if (jsonData && containerRef.value) {
    try {
      const data = JSON.parse(jsonData)
      const { type, source } = data

      if (!type) {
        throw new Error('Dropped data is missing "type" property.')
      }

      const rect = containerRef.value.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // call addWidget Add new component
      addWidget(type, { x, y }).catch(handleError)
    } catch (e) {
      handleError(new Error('Failed to parse dropped data.'))
    }
    return
  }

  // Fallback for plain text data
  const widgetType = event.dataTransfer?.getData('text/plain')
  if (widgetType && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    addWidget(widgetType, { x, y }).catch(handleError)
  }
}

// Initialization method
const initialize = async () => {
  if (isInitialized.value) return

  try {
    setState('initializing')

    if (!containerRef.value) {
      throw new Error('Renderer container not found')
    }

    await onRendererInit()

    setState('ready')
    isInitialized.value = true
    emit('ready')
  } catch (error) {
    handleError(error as Error)
  }
}

// Rendering method
const render = async () => {
  if (!isReady.value) return

  try {
    setState('rendering')
    await onRendererRender()
    setState('ready')
  } catch (error) {
    handleError(error as Error)
  }
}

// Update method
const update = async (changes: Partial<TConfig>) => {
  try {
    await onRendererUpdate(changes)
  } catch (error) {
    handleError(error as Error)
  }
}

// Destruction method
const destroy = async () => {
  try {
    await onRendererDestroy()
    setState('destroyed')
    isInitialized.value = false
  } catch (error) {}
}

// event handling method
const handleNodeSelect = (nodeId: string) => {
  emit('node-select', nodeId)
  onNodeSelected(nodeId)
}

const handleNodeUpdate = (nodeId: string, updates: any) => {
  emit('node-update', nodeId, updates)
  onNodeUpdated(nodeId, updates)
}

const handleCanvasClick = (event?: MouseEvent) => {
  emit('canvas-click', event)
  onCanvasClicked(event)
}

// life cycle hooks - Subclasses need to implement these methods
const onRendererInit = async (): Promise<void> => {}
const onRendererRender = async (): Promise<void> => {}
const onRendererUpdate = async (changes: Partial<TConfig>): Promise<void> => {}
const onRendererDestroy = async (): Promise<void> => {}

// event hook - Subclasses can override
const onNodeSelected = (nodeId: string): void => {}
const onNodeUpdated = (nodeId: string, updates: any): void => {}
const onCanvasClicked = (event?: MouseEvent): void => {}

// Listen for configuration changes
watch(
  () => props.config,
  async (newConfig, oldConfig) => {
    if (isReady.value && JSON.stringify(newConfig) !== JSON.stringify(oldConfig)) {
      await update(newConfig)
    }
  },
  { deep: true }
)

// Monitor theme changes
watch(isDark, async () => {
  if (isReady.value) {
    await onThemeChange(isDark.value)
  }
})

// theme change hook
const onThemeChange = async (isDark: boolean): Promise<void> => {}

// Component life cycle
onMounted(async () => {
  await initialize()
})

onUnmounted(async () => {
  await destroy()
})

// Methods and properties exposed to the parent component
defineExpose({
  isReady,
  hasError,
  rendererState,
  rendererError,
  initialize,
  render,
  update,
  destroy,
  handleNodeSelect,
  handleNodeUpdate,
  handleCanvasClick,
  containerRef
})
</script>

<template>
  <div
    ref="containerRef"
    class="base-renderer"
    :class="{
      'renderer-ready': isReady,
      'renderer-error': hasError,
      'renderer-readonly': isReadonly,
      'renderer-dark': isDark
    }"
    @click="handleCanvasClick"
    @drop="handleDrop"
    @dragover.prevent
  >
    <!-- Loading status -->
    <div v-if="rendererState === 'initializing'" class="renderer-loading">
      <n-spin size="large">
        <template #description>Initialize renderer...</template>
      </n-spin>
    </div>

    <!-- error status -->
    <div v-else-if="hasError" class="renderer-error-state">
      <n-result status="error" title="renderer error" :description="rendererError?.message">
        <template #footer>
          <n-button @click="initialize">Try again</n-button>
        </template>
      </n-result>
    </div>

    <!-- Renderer content slot -->
    <slot v-else-if="isReady" />

    <!-- Default state -->
    <div v-else class="renderer-idle">
      <n-empty description="Renderer not ready" />
    </div>
  </div>
</template>

<style scoped>
.base-renderer {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--n-body-color);
  transition: background-color 0.3s var(--n-bezier);
}

.base-renderer.renderer-readonly {
  cursor: default;
  user-select: none;
}

.renderer-loading,
.renderer-error-state,
.renderer-idle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.renderer-error-state {
  background-color: var(--n-error-color-suppl);
  border-radius: var(--n-border-radius);
  margin: 16px;
}

/* Theme adaptation */
.renderer-dark {
  --renderer-bg: #1a1a1a;
  --renderer-border: #404040;
  --renderer-text: #ffffff;
}

.base-renderer:not(.renderer-dark) {
  --renderer-bg: #ffffff;
  --renderer-border: #e0e0e0;
  --renderer-text: #000000;
}

/* Responsive design */
@media (max-width: 768px) {
  .base-renderer {
    min-height: 300px;
  }

  .renderer-loading,
  .renderer-error-state,
  .renderer-idle {
    min-height: 150px;
  }
}
</style>
