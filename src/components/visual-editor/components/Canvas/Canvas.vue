<template>
  <div
    class="canvas"
    @click="handleCanvasClick"
    @drop="handleDrop"
    @dragover.prevent
    @contextmenu.prevent="handleCanvasContextMenu"
  >
    <div
      v-for="node in nodes"
      :key="node.id"
      class="canvas-node"
      :class="{ selected: selectedIds.includes(node.id) }"
      :style="getNodeStyle(node)"
      @click.stop="handleNodeClick(node.id, $event)"
      @mousedown="handleNodeMouseDown(node.id, $event)"
      @contextmenu.stop.prevent="handleNodeContextMenu(node.id, $event)"
    >
      <component :is="getWidgetComponent(node.type)" v-bind="node.properties" />

      <!-- Show resize control points when selected -->
      <div v-if="selectedIds.includes(node.id)" class="resize-handles">
        <div
          v-for="handle in resizeHandles"
          :key="handle.position"
          :class="`resize-handle resize-handle-${handle.position}`"
          @mousedown.stop="handleResizeStart(node.id, handle.position, $event)"
        />
      </div>
    </div>

    <!-- right click menu -->
    <ContextMenu
      :show="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :selected-ids="selectedIds"
      @select="handleContextMenuAction"
      @close="closeContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useVisualEditor } from '@/store/modules/visual-editor'
import TextWidget from '@/components/visual-editor/widgets/custom/TextWidget/TextWidget.vue'
import ImageWidget from '@/components/visual-editor/widgets/custom/ImageWidget/ImageWidget.vue'
import BarChartWidget from '@/components/visual-editor/widgets/custom/BarChartWidget/BarChartWidget.vue'
import DigitIndicatorWidget from '@/components/visual-editor/widgets/custom/DigitIndicatorWidget/DigitIndicatorWidget.vue'
import DigitIndicatorChartWidget from '@/components/visual-editor/widgets/chart/DigitIndicatorChartWidget/DigitIndicatorChartWidget.vue'
import BarChartChartWidget from '@/components/visual-editor/widgets/chart/BarChartChartWidget/BarChartChartWidget.vue'
import ContextMenu from '@/components/visual-editor/components/Canvas/ContextMenu.vue'
import type { GraphData } from '@/components/visual-editor/types'

// 🔥 Use the new unified architecture
const unifiedEditor = useVisualEditor()

// Adapt to old interface
const nodes = computed(() => unifiedEditor.store.nodes)
const selectedIds = computed(() => unifiedEditor.store.selectedIds)

// Adaptation method
const selectNode = (nodeId: string) => {
  if (nodeId) {
    unifiedEditor.store.selectNodes([nodeId])
  } else {
    unifiedEditor.store.selectNodes([])
  }
}

const updateNode = async (nodeId: string, updates: any) => {
  await unifiedEditor.updateNode(nodeId, updates)
}

const addWidget = async (type: string, position?: { x: number; y: number }) => {
  const newNode = {
    id: `${type}_${Date.now()}`,
    type,
    position: position || { x: 100, y: 100 },
    data: { componentType: type, title: type }
  }
  await unifiedEditor.addNode(newNode)
}

const widgetComponents = {
  text: TextWidget,
  image: ImageWidget,
  'bar-chart': BarChartWidget,
  'line-chart': BarChartWidget, // Temporarily reuse histogram
  'pie-chart': BarChartWidget, // Temporarily reuse histogram
  'digit-indicator': DigitIndicatorWidget,
  // realchart-cardcomponents
  'chart-digit-indicator': DigitIndicatorChartWidget,
  'chart-bar': BarChartChartWidget
}

// drag state
const isDragging = ref(false)
const isResizing = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const dragNodeId = ref<string | null>(null)
const resizeNodeId = ref<string | null>(null)
const resizeDirection = ref<string>('')

// Grid settings
const GRID_SIZE = 10

// grid adsorption function
const snapToGrid = (value: number) => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

// Right-click menu status
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0
})

// Resize control points
const resizeHandles = [
  { position: 'nw' },
  { position: 'n' },
  { position: 'ne' },
  { position: 'w' },
  { position: 'e' },
  { position: 'sw' },
  { position: 's' },
  { position: 'se' }
]

const getWidgetComponent = (type: string) => {
  return widgetComponents[type as keyof typeof widgetComponents]
}

const getNodeStyle = (node: GraphData) => ({
  position: 'absolute' as const,
  left: node.x + 'px',
  top: node.y + 'px',
  width: node.width + 'px',
  height: node.height + 'px'
})

const handleCanvasClick = () => {
  unifiedEditor.store.selectNodes([])
}

const handleNodeClick = (id: string, event?: MouseEvent) => {
  if (event?.ctrlKey || event?.metaKey) {
    // Ctrl/Cmd + Click：Multiple choice
    const currentSelected = selectedIds.value
    if (currentSelected.includes(id)) {
      // Deselect
      const newSelected = currentSelected.filter(nodeId => nodeId !== id)
      unifiedEditor.store.selectNodes(newSelected)
    } else {
      // add to selection
      unifiedEditor.store.selectNodes([...currentSelected, id])
    }
  } else {
    // Normal click：Single choice
    selectNode(id)
  }
}

// Drag and drop function
const handleNodeMouseDown = (nodeId: string, event: MouseEvent) => {
  event.preventDefault()
  isDragging.value = true
  dragNodeId.value = nodeId
  dragStartPos.value = {
    x: event.clientX,
    y: event.clientY
  }

  // Select node
  selectNode(nodeId)

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// resize function
const handleResizeStart = (nodeId: string, direction: string, event: MouseEvent) => {
  event.preventDefault()
  isResizing.value = true
  resizeNodeId.value = nodeId
  resizeDirection.value = direction
  dragStartPos.value = {
    x: event.clientX,
    y: event.clientY
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = async (event: MouseEvent) => {
  if (!isDragging.value && !isResizing.value) return

  const deltaX = event.clientX - dragStartPos.value.x
  const deltaY = event.clientY - dragStartPos.value.y

  if (isDragging.value && dragNodeId.value) {
    // Drag and move
    const node = nodes.value.find(n => n.id === dragNodeId.value)
    if (node) {
      const newX = Math.max(0, node.x + deltaX)
      const newY = Math.max(0, node.y + deltaY)

      await updateNode(dragNodeId.value, {
        x: snapToGrid(newX),
        y: snapToGrid(newY)
      })
      dragStartPos.value = { x: event.clientX, y: event.clientY }
    }
  } else if (isResizing.value && resizeNodeId.value) {
    // resize
    const node = nodes.value.find(n => n.id === resizeNodeId.value)
    if (node) {
      const updates: Partial<GraphData> = {}

      // Calculate new position and size based on resize direction
      if (resizeDirection.value.includes('n')) {
        const newY = Math.max(0, node.y + deltaY)
        const newHeight = Math.max(20, node.height - deltaY)
        updates.y = snapToGrid(newY)
        updates.height = snapToGrid(newHeight)
      }
      if (resizeDirection.value.includes('s')) {
        const newHeight = Math.max(20, node.height + deltaY)
        updates.height = snapToGrid(newHeight)
      }
      if (resizeDirection.value.includes('w')) {
        const newX = Math.max(0, node.x + deltaX)
        const newWidth = Math.max(20, node.width - deltaX)
        updates.x = snapToGrid(newX)
        updates.width = snapToGrid(newWidth)
      }
      if (resizeDirection.value.includes('e')) {
        const newWidth = Math.max(20, node.width + deltaX)
        updates.width = snapToGrid(newWidth)
      }

      await updateNode(resizeNodeId.value, updates)
      dragStartPos.value = { x: event.clientX, y: event.clientY }
    }
  }
}

const handleMouseUp = () => {
  isDragging.value = false
  isResizing.value = false
  dragNodeId.value = null
  resizeNodeId.value = null
  resizeDirection.value = ''

  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// Drag and drop to create components
const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  const widgetType = event.dataTransfer?.getData('text/plain')
  if (widgetType) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Create new component
    await addWidget(widgetType, { x, y })
  }
}

// Clean up event listening
onMounted(() => {
  // Prevent event conflicts when scrolling the page
  document.addEventListener('selectstart', e => {
    if (isDragging.value || isResizing.value) {
      e.preventDefault()
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

// Right-click menu processing
const handleCanvasContextMenu = (event: MouseEvent) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY
  }
}

const handleNodeContextMenu = (nodeId: string, event: MouseEvent) => {
  // If the node is not selected，Select it first
  if (!selectedIds.value.includes(nodeId)) {
    selectNode(nodeId)
  }

  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY
  }
}

const closeContextMenu = () => {
  contextMenu.value.show = false
}

const handleContextMenuAction = (action: string) => {
  switch (action) {
    case 'copy':
      // TODO: Implement copy function
      break
    case 'delete':
      // Delete selected components
      selectedIds.value.forEach(id => {
        stateManager.removeNode(id)
      })
      break
    case 'layer':
      // TODO: Implement layer management
      break
    case 'lock':
      // Lock selected components
      if (selectedIds.value.length > 0) {
        const nodeId = selectedIds.value[0]
        const node = stateManager.getNode(nodeId)
        if (node) {
          // Set lock flag
          node._isLocked = true
          // Update node，Trigger responsive updates
          stateManager.updateNode(nodeId, { ...node })
        }
      }
      closeContextMenu()
      break
    case 'unlock':
      // Unlock selected components
      if (selectedIds.value.length > 0) {
        const nodeId = selectedIds.value[0]
        const node = stateManager.getNode(nodeId)
        if (node) {
          // Remove lock mark
          node._isLocked = false
          // Update node，Trigger responsive updates
          stateManager.updateNode(nodeId, { ...node })
        }
      }
      closeContextMenu()
      break
  }
}
</script>

<style scoped>
.canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background:
    linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  user-select: none;
}

.canvas-node {
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
  cursor: move;
  position: relative;
}

.canvas-node:hover {
  border-color: rgba(24, 160, 88, 0.3);
}

.canvas-node.selected {
  border-color: var(--n-primary-color);
}

/* Resize control point container */
.resize-handles {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  pointer-events: none;
}

/* Resize control points */
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--n-primary-color);
  border: 1px solid #fff;
  border-radius: 50%;
  pointer-events: all;
  z-index: 10;
}

/* control point location */
.resize-handle-nw {
  top: 0;
  left: 0;
  cursor: nw-resize;
  transform: translate(-50%, -50%);
}

.resize-handle-n {
  top: 0;
  left: 50%;
  cursor: n-resize;
  transform: translate(-50%, -50%);
}

.resize-handle-ne {
  top: 0;
  right: 0;
  cursor: ne-resize;
  transform: translate(50%, -50%);
}

.resize-handle-w {
  top: 50%;
  left: 0;
  cursor: w-resize;
  transform: translate(-50%, -50%);
}

.resize-handle-e {
  top: 50%;
  right: 0;
  cursor: e-resize;
  transform: translate(50%, -50%);
}

.resize-handle-sw {
  bottom: 0;
  left: 0;
  cursor: sw-resize;
  transform: translate(-50%, 50%);
}

.resize-handle-s {
  bottom: 0;
  left: 50%;
  cursor: s-resize;
  transform: translate(-50%, 50%);
}

.resize-handle-se {
  bottom: 0;
  right: 0;
  cursor: se-resize;
  transform: translate(50%, 50%);
}

/* Style when dragging */
.canvas-node.dragging {
  transition: none;
  z-index: 1000;
}
</style>
