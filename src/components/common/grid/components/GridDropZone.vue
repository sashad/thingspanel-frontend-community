<!--
  Grid Drag area component
  Handle the logic of dragging external elements to the grid
-->
<template>
  <div
    v-if="!readonly && showDropZone"
    class="drop-zone"
    :class="{ dragging: isDragging }"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="drop-hint">
      <n-icon :size="24">
        <AddOutline />
      </n-icon>
      <span>{{ $t('grid.dropHint', 'Drag and drop components here to add') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Grid Drag area component
 * Specifically handles drag and drop operations and external element additions
 */

import { ref } from 'vue'
import { NIcon } from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'

interface Props {
  /** Whether to read-only mode */
  readonly?: boolean
  /** Whether to display the drag area */
  showDropZone?: boolean
}

interface Emits {
  /** Drag and drop event */
  'drag-enter': [event: DragEvent]
  /** drag hover event */
  'drag-over': [event: DragEvent]
  /** Drag and drop event */
  'drag-leave': [event: DragEvent]
  /** drag release event */
  drop: [event: DragEvent]
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  showDropZone: false
})

const emit = defineEmits<Emits>()

// Drag and drop state management
const isDragging = ref(false)
const dragCounter = ref(0)

/**
 * Handling drag-and-drop entry
 * Use counter to prevent spurious leave events triggered by child elements
 */
const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  dragCounter.value++
  if (dragCounter.value === 1) {
    isDragging.value = true
  }
  emit('drag-enter', event)
}

/**
 * Handling drag-hover
 * Default behavior must be blocked to allow drag and drop
 */
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  emit('drag-over', event)
}

/**
 * Handle drag and leave
 * Use a counter to ensure you actually leave the drag area
 */
const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  dragCounter.value--
  if (dragCounter.value === 0) {
    isDragging.value = false
  }
  emit('drag-leave', event)
}

/**
 * Handling drag and release
 * Reset state and trigger release event
 */
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  dragCounter.value = 0
  emit('drop', event)
}

// Methods exposed to the parent component
defineExpose({
  isDragging: isDragging.value
})
</script>

<style scoped>
.drop-zone {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--primary-color-rgb), 0.1);
  border: 2px dashed var(--primary-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
  z-index: 1000;
}

.drop-zone.dragging {
  opacity: 1;
  pointer-events: all;
}

.drop-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--primary-color);
  font-size: 16px;
  font-weight: 500;
  text-align: center;
}

.drop-hint span {
  white-space: nowrap;
}

/* Respond to theme changes */
[data-theme='dark'] .drop-zone {
  background: rgba(var(--primary-color-rgb), 0.15);
}

/* Responsive design */
@media (max-width: 768px) {
  .drop-hint {
    font-size: 14px;
  }

  .drop-hint span {
    font-size: 12px;
  }
}
</style>
