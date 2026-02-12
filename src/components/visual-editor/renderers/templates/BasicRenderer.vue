<!--
  Basic renderer template
  Suitable for simple custom layout needs
  Copy this file and modify it as needed
-->
<template>
  <BaseRendererComponent
    :readonly="readonly"
    @ready="onRendererReady"
    @error="onRendererError"
    @node-select="onNodeSelect"
    @canvas-click="onCanvasClick"
  >
    <div
      class="basic-renderer grid-background-base"
      :class="{
        'show-grid': config.showGrid && !readonly,
        'preview-mode': isPreviewMode.value,
        readonly: readonly
      }"
      @click="handleCanvasClick"
    >
      <!-- Render all nodes -->
      <div
        v-for="node in nodes"
        :key="node.id"
        class="renderer-node"
        :class="{
          selected: selectedIds.includes(node.id) && !isPreviewMode.value,
          readonly: readonly || isPreviewMode.value
        }"
        :style="getNodeStyle(node)"
        @click.stop="handleNodeClick(node.id)"
      >
        <!-- Node title -->
        <div v-if="showWidgetTitles && !readonly" class="node-title">
          {{ node.label || node.type }}
        </div>

        <!-- Node content -->
        <div class="node-content">
          <Card2Wrapper
            v-if="isCard2Component(node.type)"
            :component-type="node.type"
            :config="node.properties"
            :data="node.metadata?.card2Data"
            :node-id="node.id"
            @error="handleComponentError"
          />
          <component :is="getWidgetComponent(node.type)" v-else v-bind="node.properties" />
        </div>
      </div>
    </div>
  </BaseRendererComponent>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/store/modules/editor'
import { useWidgetStore } from '@/store/modules/widget'
import { globalPreviewMode } from '@/components/visual-editor/hooks/usePreviewMode'
import BaseRendererComponent from '@/components/visual-editor/renderers/base/BaseRendererComponent.vue'
import { Card2Wrapper } from '@/components/visual-editor/renderers/base'

// components Props
interface Props {
  readonly?: boolean
  config?: {
    showGrid?: boolean
    backgroundColor?: string
    // Add your configuration options here
  }
  showWidgetTitles?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  config: () => ({
    showGrid: true,
    backgroundColor: '#f5f5f5'
  }),
  showWidgetTitles: false
})

// components Emits
interface Emits {
  (e: 'ready'): void
  (e: 'error', error: Error): void
  (e: 'node-select', nodeId: string): void
  (e: 'canvas-click', event?: MouseEvent): void
}

const emit = defineEmits<Emits>()

// Use original store
const editorStore = useEditorStore()
const widgetStore = useWidgetStore()
const { isPreviewMode } = globalPreviewMode

// Adapt to old interface
const nodes = computed(() => editorStore.nodes || [])
const selectedIds = computed(() => widgetStore.selectedNodeIds || [])

const selectNode = (nodeId: string) => {
  if (nodeId) {
    widgetStore.selectNodes([nodeId])
  } else {
    widgetStore.selectNodes([])
  }
}

const isCard2Component = (type: string) => {
  // simpleCard2Component detection
  return type.includes('card2') || type.includes('Card2')
}

// event handler
const onRendererReady = () => {
  emit('ready')
}

const onRendererError = (error: Error) => {
  emit('error', error)
}

const onNodeSelect = (nodeId: string) => {
  emit('node-select', nodeId)
}

const onCanvasClick = (event?: MouseEvent) => {
  emit('canvas-click', event)
}

const handleCanvasClick = () => {
  if (!isPreviewMode.value) {
    // Clear selection
    stateManager.clearSelection()
  }
}

const handleNodeClick = (nodeId: string) => {
  if (!isPreviewMode.value && !props.readonly) {
    selectNode(nodeId)
    emit('node-select', nodeId)
  }
}

const handleComponentError = (error: Error) => {
  console.error('[BasicRenderer] Component error:', error)
  emit('error', error)
}

// style calculation
const getNodeStyle = (node: any) => {
  // Basic absolute positioning layout
  return {
    position: 'absolute' as const,
    left: `${node.x}px`,
    top: `${node.y}px`,
    width: `${node.width}px`,
    height: `${node.height}px`,
    zIndex: selectedIds.value.includes(node.id) ? 10 : 1
  }
}

// Component acquisition - Expand as needed
const getWidgetComponent = (type: string) => {
  // Add your custom component mapping here
  const components: Record<string, any> = {
    // 'text': TextWidget,
    // 'image': ImageWidget,
    // Add more components
  }
  return components[type]
}
</script>

<style scoped>
.basic-renderer {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  user-select: none;
  overflow: hidden;
}

.renderer-node {
  border: 2px solid transparent;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.renderer-node:hover:not(.readonly) {
  border-color: rgba(24, 160, 88, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.renderer-node.selected {
  border-color: var(--n-primary-color);
  box-shadow: 0 4px 12px rgba(24, 160, 88, 0.2);
}

.renderer-node.readonly {
  cursor: default;
}

.renderer-node.readonly:hover {
  border-color: transparent;
  box-shadow: none;
}

.node-title {
  background: var(--n-color-embedded);
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  border-bottom: 1px solid var(--n-border-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.node-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Preview mode style */
.basic-renderer.preview-mode .renderer-node {
  cursor: default;
}

.basic-renderer.preview-mode .renderer-node:hover {
  border-color: transparent;
  box-shadow: none;
}

/* Responsive adaptation */
@media (max-width: 768px) {
  .basic-renderer {
    min-height: 400px;
  }

  .node-title {
    font-size: 11px;
    padding: 2px 6px;
  }
}
</style>
