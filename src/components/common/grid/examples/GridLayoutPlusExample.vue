<!--
  Grid Layout Plus Usage example
  Show how to use the new Grid Layout Plus components
-->
<template>
  <div class="grid-layout-plus-example">
    <div class="example-header">
      <h2>Grid Layout Plus Example</h2>
      <div class="example-controls">
        <n-space>
          <n-button @click="addRandomItem">Add item</n-button>
          <n-button @click="compactLayout">Compact layout</n-button>
          <n-button type="error" @click="clearAll">Clear</n-button>
          <n-button @click="toggleReadonly">
            {{ readonly ? 'Enable editing' : 'read-only mode' }}
          </n-button>
          <n-button @click="toggleGrid">
            {{ showGrid ? 'Hide grid' : 'show grid' }}
          </n-button>
        </n-space>
      </div>
    </div>

    <div class="example-stats">
      <n-card size="small">
        <n-space>
          <n-statistic label="Number of items" :value="layoutStats.totalItems" />
          <n-statistic label="Total number of rows" :value="layoutStats.totalRows" />
          <n-statistic label="Utilization" :value="layoutStats.utilization" suffix="%" />
          <n-statistic label="Selected" :value="selectedItems.length" />
        </n-space>
      </n-card>
    </div>

    <div class="example-content">
      <GridLayoutPlus
        v-model:layout="layout"
        :readonly="readonly"
        :show-grid="showGrid"
        :show-drop-zone="!readonly"
        :config="gridConfig"
        @layout-change="handleLayoutChange"
        @item-add="handleItemAdd"
        @item-delete="handleItemDelete"
        @item-edit="handleItemEdit"
        @item-move="handleItemMove"
        @item-resize="handleItemResize"
        @breakpoint-changed="handleBreakpointChange"
      >
        <template #default="{ item, readonly }">
          <div class="custom-item-content">
            <div v-if="!readonly" class="item-drag-handle">
              <n-icon :size="16">
                <Menu />
              </n-icon>
            </div>

            <div class="item-main-content">
              <div class="item-title">{{ item.title || item.type }}</div>
              <div class="item-info">
                <div>Location: {{ item.x }}, {{ item.y }}</div>
                <div>size: {{ item.w }} × {{ item.h }}</div>
              </div>

              <!-- Render different content based on type -->
              <div class="item-body">
                <div v-if="item.type === 'chart'" class="chart-placeholder">📊 chart component</div>
                <div v-else-if="item.type === 'text'" class="text-placeholder">📝 text component</div>
                <div v-else-if="item.type === 'image'" class="image-placeholder">🖼️ Picture component</div>
                <div v-else class="default-placeholder">📦 {{ item.type || 'Default component' }}</div>
              </div>
            </div>
          </div>
        </template>
      </GridLayoutPlus>
    </div>

    <div class="example-actions">
      <n-card title="Operation panel" size="small">
        <n-space vertical>
          <n-space>
            <n-button :disabled="!canUndo" @click="undo">Cancel</n-button>
            <n-button :disabled="!canRedo" @click="redo">Redo</n-button>
          </n-space>

          <n-space>
            <n-button @click="selectAll">Select all</n-button>
            <n-button @click="clearSelection">Clear selection</n-button>
            <n-button :disabled="!hasSelectedItems" type="error" @click="deleteSelected">Remove selected</n-button>
          </n-space>

          <n-space>
            <n-button @click="exportLayout">Export layout</n-button>
            <n-upload :show-file-list="false" accept=".json" @before-upload="importLayout">
              <n-button>Import layout</n-button>
            </n-upload>
          </n-space>
        </n-space>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NSpace, NCard, NStatistic, NIcon, NUpload, useMessage } from 'naive-ui'
import { Menu } from '@vicons/ionicons5'
import {
  GridLayoutPlus,
  useGridLayoutPlus,
  type GridLayoutPlusItem,
  type GridLayoutPlusConfig
} from '../gridLayoutPlusIndex'

const message = useMessage()

// Initial layout data
const initialLayout: GridLayoutPlusItem[] = [
  {
    i: 'item-1',
    x: 0,
    y: 0,
    w: 3,
    h: 2,
    type: 'chart',
    title: 'sales chart'
  },
  {
    i: 'item-2',
    x: 3,
    y: 0,
    w: 2,
    h: 1,
    type: 'text',
    title: 'text module'
  },
  {
    i: 'item-3',
    x: 5,
    y: 0,
    w: 4,
    h: 2,
    type: 'image',
    title: 'Picture display'
  }
]

// Grid configuration
const gridConfig: Partial<GridLayoutPlusConfig> = {
  colNum: 12,
  rowHeight: 80,
  margin: [10, 10],
  isDraggable: true,
  isResizable: true,
  responsive: false,
  preventCollision: false
}

// useGrid Layout Plus Hook
const {
  layout,
  selectedItems,
  layoutStats,
  canUndo,
  canRedo,
  hasSelectedItems,
  addItem,
  removeItem,
  clearLayout,
  selectAllItems,
  clearSelection,
  deleteSelectedItems,
  compactCurrentLayout,
  undo,
  redo,
  exportCurrentLayout,
  importLayout: importLayoutFromHook
} = useGridLayoutPlus({
  initialLayout,
  config: gridConfig,
  enableHistory: true,
  autoSave: true,
  onSave: layout => {}
})

// Component status
const readonly = ref(false)
const showGrid = ref(true)

// List of project types
const itemTypes = ['chart', 'text', 'image', 'table', 'button']

// method
const addRandomItem = () => {
  const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)]
  const result = addItem(randomType, {
    title: `${randomType} ${Date.now()}`,
    w: Math.floor(Math.random() * 3) + 2,
    h: Math.floor(Math.random() * 2) + 1
  })

  if (result.success) {
    message.success('Project added successfully')
  } else {
    message.error(result.message)
  }
}

const compactLayout = () => {
  compactCurrentLayout()
  message.success('The layout has been compacted')
}

const clearAll = () => {
  const result = clearLayout()
  if (result.success) {
    message.success('The layout has been cleared')
  }
}

const toggleReadonly = () => {
  readonly.value = !readonly.value
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

const selectAll = () => {
  selectAllItems()
  message.info(`Selected ${selectedItems.value.length} items`)
}

const deleteSelected = () => {
  const result = deleteSelectedItems()
  if (result.success) {
    message.success(result.message)
  }
}

const exportLayout = () => {
  const layoutJson = exportCurrentLayout()
  const blob = new Blob([layoutJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `grid-layout-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.success('Layout exported')
}

const importLayout = (options: any) => {
  const file = options.file.file
  const reader = new FileReader()

  reader.onload = e => {
    try {
      const layoutData = e.target?.result as string
      const result = importLayoutFromHook(layoutData)

      if (result.success) {
        message.success('Layout imported successfully')
      } else {
        message.error(result.message)
      }
    } catch (error) {
      message.error('Layout import failed')
    }
  }

  reader.readAsText(file)
  return false // Block default upload
}

// event handling
const handleLayoutChange = (newLayout: GridLayoutPlusItem[]) => {}

const handleItemAdd = (item: GridLayoutPlusItem) => {
  message.success(`Item added: ${item.title || item.i}`)
}

const handleItemDelete = (itemId: string) => {
  message.warning(`Project deleted: ${itemId}`)
}

const handleItemEdit = (item: GridLayoutPlusItem) => {
  message.info(`Edit project: ${item.title || item.i}`)
}

const handleItemMove = (itemId: string, x: number, y: number) => {}

const handleItemResize = (itemId: string, w: number, h: number) => {}

const handleBreakpointChange = (breakpoint: string) => {
  message.info(`Breakpoint switches to: ${breakpoint}`)
}
</script>

<style scoped>
.grid-layout-plus-example {
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f5;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 20px;
}

.example-header h2 {
  margin: 0;
  color: #333;
}

.example-stats {
  margin-bottom: 20px;
}

.example-content {
  height: 500px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.example-actions {
  max-width: 300px;
}

/* Customize project content styles */
.custom-item-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.item-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  background: #f0f0f0;
  cursor: move;
  border-bottom: 1px solid #e0e0e0;
}

.item-main-content {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.item-title {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 8px;
  color: #333;
}

.item-info {
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.item-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder,
.text-placeholder,
.image-placeholder,
.default-placeholder {
  padding: 20px;
  border: 2px dashed #ddd;
  border-radius: 6px;
  text-align: center;
  color: #999;
  font-size: 16px;
  width: 100%;
}

.chart-placeholder {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.text-placeholder {
  border-color: #10b981;
  color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.image-placeholder {
  border-color: #f59e0b;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.05);
}

/* Responsive */
@media (max-width: 768px) {
  .example-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .example-content {
    height: 400px;
  }

  .custom-item-content {
    font-size: 12px;
  }

  .item-main-content {
    padding: 8px;
  }
}
</style>
