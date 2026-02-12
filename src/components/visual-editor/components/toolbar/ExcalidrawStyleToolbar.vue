<template>
  <div class="excalidraw-toolbar-container">
    <!-- Main toolbar - floating design -->
    <div class="floating-toolbar" :class="{ 'is-dragging': isDragging }">
      <!-- Basic drawing tool set -->
      <div class="tool-group">
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'select' }"
              @click="setTool('select')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
              </svg>
            </button>
          </template>
          Select tool
        </n-tooltip>

        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'hand' }"
              @click="setTool('hand')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 11V6a2 2 0 0 0-4 0v5"/>
                <path d="M14 10V4a2 2 0 0 0-4 0v2"/>
                <path d="M10 10.5V6a2 2 0 0 0-4 0v11a2 2 0 0 0 2 2h2"/>
                <path d="m7 15-1.76-1.76a2 2 0 0 0-2.83 2.83l3.6 3.6a7.5 7.5 0 0 0 10.6 0L19 18"/>
              </svg>
            </button>
          </template>
          Hand tools（Pan）
        </n-tooltip>
      </div>

      <div class="tool-separator"></div>

      <!-- Shape tool set -->
      <div class="tool-group">
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'rectangle' }"
              @click="setTool('rectangle')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              </svg>
            </button>
          </template>
          rectangle
        </n-tooltip>

        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'diamond' }"
              @click="setTool('diamond')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12,2 22,12 12,22 2,12"/>
              </svg>
            </button>
          </template>
          diamond
        </n-tooltip>

        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'ellipse' }"
              @click="setTool('ellipse')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </button>
          </template>
          oval
        </n-tooltip>
      </div>

      <div class="tool-separator"></div>

      <!-- Line tool set -->
      <div class="tool-group">
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'arrow' }"
              @click="setTool('arrow')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12,5 19,12 12,19"/>
              </svg>
            </button>
          </template>
          arrow
        </n-tooltip>

        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'line' }"
              @click="setTool('line')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </template>
          straight line
        </n-tooltip>
      </div>

      <div class="tool-separator"></div>

      <!-- Drawing tool set -->
      <div class="tool-group">
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'pencil' }"
              @click="setTool('pencil')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m18 2 4 4-14 14H4v-4L18 2z"/>
                <path d="m13.5 6.5 4 4"/>
              </svg>
            </button>
          </template>
          brush
        </n-tooltip>

        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'text' }"
              @click="setTool('text')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="4,7 4,4 20,4 20,7"/>
                <line x1="9" y1="20" x2="15" y2="20"/>
                <line x1="12" y1="4" x2="12" y2="20"/>
              </svg>
            </button>
          </template>
          text
        </n-tooltip>
      </div>

      <div class="tool-separator"></div>

      <!-- Other tool sets -->
      <div class="tool-group">
        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'image' }"
              @click="setTool('image')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </button>
          </template>
          picture
        </n-tooltip>

        <n-tooltip trigger="hover" placement="bottom">
          <template #trigger>
            <button
              class="tool-button"
              :class="{ active: currentTool === 'eraser' }"
              @click="setTool('eraser')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
                <path d="M22 21H7"/>
                <path d="m5 11 9 9"/>
              </svg>
            </button>
          </template>
          Eraser
        </n-tooltip>
      </div>
    </div>

    <!-- Properties toolbar - Floats below the main toolbar -->
    <div class="property-toolbar" v-if="showPropertyToolbar">
      <!-- stroke style -->
      <div class="property-group">
        <span class="property-label">Stroke</span>
        <div class="stroke-style-buttons">
          <button
            class="property-button"
            :class="{ active: strokeStyle === 'solid' }"
            @click="setStrokeStyle('solid')"
          >
            <svg width="20" height="4" viewBox="0 0 20 4">
              <line x1="0" y1="2" x2="20" y2="2" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button
            class="property-button"
            :class="{ active: strokeStyle === 'dashed' }"
            @click="setStrokeStyle('dashed')"
          >
            <svg width="20" height="4" viewBox="0 0 20 4">
              <line x1="0" y1="2" x2="20" y2="2" stroke="currentColor" stroke-width="2" stroke-dasharray="4,2"/>
            </svg>
          </button>
          <button
            class="property-button"
            :class="{ active: strokeStyle === 'dotted' }"
            @click="setStrokeStyle('dotted')"
          >
            <svg width="20" height="4" viewBox="0 0 20 4">
              <line x1="0" y1="2" x2="20" y2="2" stroke="currentColor" stroke-width="2" stroke-dasharray="1,2"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="property-separator"></div>

      <!-- Fill style -->
      <div class="property-group">
        <span class="property-label">filling</span>
        <div class="fill-style-buttons">
          <button
            class="property-button fill-none"
            :class="{ active: fillStyle === 'none' }"
            @click="setFillStyle('none')"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1"/>
            </svg>
          </button>
          <button
            class="property-button fill-solid"
            :class="{ active: fillStyle === 'solid' }"
            @click="setFillStyle('solid')"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <rect x="2" y="2" width="12" height="12" fill="currentColor"/>
            </svg>
          </button>
          <button
            class="property-button fill-hachure"
            :class="{ active: fillStyle === 'hachure' }"
            @click="setFillStyle('hachure')"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1"/>
              <g stroke="currentColor" stroke-width="0.5">
                <line x1="3" y1="3" x2="13" y2="13"/>
                <line x1="3" y1="6" x2="13" y2="16"/>
                <line x1="3" y1="9" x2="10" y2="16"/>
                <line x1="6" y1="3" x2="13" y2="10"/>
                <line x1="9" y1="3" x2="13" y2="7"/>
              </g>
            </svg>
          </button>
        </div>
      </div>

      <div class="property-separator"></div>

      <!-- line thickness -->
      <div class="property-group">
        <span class="property-label">Thickness</span>
        <div class="stroke-width-buttons">
          <button
            class="property-button"
            :class="{ active: strokeWidth === 'thin' }"
            @click="setStrokeWidth('thin')"
          >
            <svg width="20" height="4" viewBox="0 0 20 4">
              <line x1="0" y1="2" x2="20" y2="2" stroke="currentColor" stroke-width="1"/>
            </svg>
          </button>
          <button
            class="property-button"
            :class="{ active: strokeWidth === 'bold' }"
            @click="setStrokeWidth('bold')"
          >
            <svg width="20" height="4" viewBox="0 0 20 4">
              <line x1="0" y1="2" x2="20" y2="2" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button
            class="property-button"
            :class="{ active: strokeWidth === 'extra-bold' }"
            @click="setStrokeWidth('extra-bold')"
          >
            <svg width="20" height="4" viewBox="0 0 20 4">
              <line x1="0" y1="2" x2="20" y2="2" stroke="currentColor" stroke-width="3"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="property-separator"></div>

      <!-- transparency -->
      <div class="property-group">
        <span class="property-label">transparency</span>
        <n-slider
          v-model:value="opacity"
          :min="0"
          :max="100"
          :step="10"
          style="width: 80px;"
          size="small"
          @update:value="setOpacity"
        />
        <span class="opacity-value">{{ opacity }}%</span>
      </div>
    </div>

    <!-- Action toolbar - Float right -->
    <div class="action-toolbar">
      <n-tooltip trigger="hover" placement="left">
        <template #trigger>
          <button class="action-button" @click="undo" :disabled="!canUndo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7v6h6"/>
              <path d="m21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
            </svg>
          </button>
        </template>
        Cancel
      </n-tooltip>

      <n-tooltip trigger="hover" placement="left">
        <template #trigger>
          <button class="action-button" @click="redo" :disabled="!canRedo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21 7-6-6v6h-6a9 9 0 0 0 0 18h3"/>
            </svg>
          </button>
        </template>
        Redo
      </n-tooltip>

      <div class="action-separator"></div>

      <n-tooltip trigger="hover" placement="left">
        <template #trigger>
          <button class="action-button" @click="zoomIn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
        </template>
        enlarge
      </n-tooltip>

      <n-tooltip trigger="hover" placement="left">
        <template #trigger>
          <button class="action-button" @click="zoomOut">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
        </template>
        zoom out
      </n-tooltip>

      <n-tooltip trigger="hover" placement="left">
        <template #trigger>
          <button class="action-button" @click="resetZoom">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <rect x="8" y="8" width="6" height="6" rx="1"/>
            </svg>
          </button>
        </template>
        Reset zoom
      </n-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Excalidraw styled floating toolbar
 *
 * Features：
 * - minimalist design，floating onCanvasabove
 * - Borderless button，Rounded corner design
 * - Group layout，clear visual hierarchy
 * - Real-time attribute adjustment
 * - Hand drawn style icon
 */

import { ref, computed, watch } from 'vue'

// tool status
const currentTool = ref('select')
const strokeStyle = ref('solid')
const fillStyle = ref('none')
const strokeWidth = ref('bold')
const opacity = ref(100)
const isDragging = ref(false)

// Edit status
const canUndo = ref(false)
const canRedo = ref(false)

// Show status
const showPropertyToolbar = computed(() => {
  return ['rectangle', 'diamond', 'ellipse', 'arrow', 'line', 'pencil'].includes(currentTool.value)
})

// event definition
const emit = defineEmits<{
  'tool-change': [tool: string]
  'stroke-style-change': [style: string]
  'fill-style-change': [style: string]
  'stroke-width-change': [width: string]
  'opacity-change': [opacity: number]
  'undo': []
  'redo': []
  'zoom-in': []
  'zoom-out': []
  'reset-zoom': []
}>()

/**
 * Set current tool
 */
function setTool(tool: string) {
  currentTool.value = tool
  emit('tool-change', tool)
}

/**
 * Set stroke style
 */
function setStrokeStyle(style: string) {
  strokeStyle.value = style
  emit('stroke-style-change', style)
}

/**
 * Set fill style
 */
function setFillStyle(style: string) {
  fillStyle.value = style
  emit('fill-style-change', style)
}

/**
 * Set line thickness
 */
function setStrokeWidth(width: string) {
  strokeWidth.value = width
  emit('stroke-width-change', width)
}

/**
 * Set transparency
 */
function setOpacity(value: number) {
  opacity.value = value
  emit('opacity-change', value)
}

/**
 * Undo operation
 */
function undo() {
  emit('undo')
}

/**
 * redo operation
 */
function redo() {
  emit('redo')
}

/**
 * enlarge
 */
function zoomIn() {
  emit('zoom-in')
}

/**
 * zoom out
 */
function zoomOut() {
  emit('zoom-out')
}

/**
 * Reset zoom
 */
function resetZoom() {
  emit('reset-zoom')
}

// Monitor tool changes，Automatically adjust property panel display
watch(currentTool, (newTool) => {
  // Different tools may have different default properties
  if (newTool === 'text') {
    fillStyle.value = 'none'
    strokeStyle.value = 'solid'
  }
})
</script>

<style scoped>
.excalidraw-toolbar-container {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

/* Main toolbar */
.floating-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  pointer-events: auto;
  transition: all 0.2s ease;
}

.floating-toolbar:hover {
  background: rgba(255, 255, 255, 0.98);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.08);
}

.floating-toolbar.is-dragging {
  cursor: grabbing;
}

/* tool set */
.tool-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Tool button */
.tool-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #495057;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.tool-button:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #212529;
}

.tool-button.active {
  background: #5f6368;
  color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.tool-button.active:hover {
  background: #4a4f53;
}

/* Tool separator */
.tool-separator {
  width: 1px;
  height: 24px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 4px;
}

/* Properties toolbar */
.property-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  pointer-events: auto;
  font-size: 13px;
}

/* attribute group */
.property-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.property-label {
  color: #6c757d;
  font-size: 12px;
  font-weight: 500;
  min-width: 40px;
}

/* Properties button */
.property-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #495057;
  cursor: pointer;
  transition: all 0.15s ease;
}

.property-button:hover {
  background: rgba(0, 0, 0, 0.05);
}

.property-button.active {
  background: #e9ecef;
  color: #212529;
}

/* Style button group */
.stroke-style-buttons,
.fill-style-buttons,
.stroke-width-buttons {
  display: flex;
  gap: 2px;
}

/* attribute separator */
.property-separator {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
}

/* Transparency display */
.opacity-value {
  font-size: 11px;
  color: #6c757d;
  min-width: 30px;
  text-align: center;
}

/* Action toolbar */
.action-toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  pointer-events: auto;
}

/* Action button */
.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #495057;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-button:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
  color: #212529;
}

.action-button:disabled {
  color: #adb5bd;
  cursor: not-allowed;
}

/* Operation separator */
.action-separator {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 4px 0;
}

/* Dark theme adaptation */
.dark .floating-toolbar,
.dark .property-toolbar,
.dark .action-toolbar {
  background: rgba(33, 37, 41, 0.95);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

.dark .tool-button,
.dark .property-button,
.dark .action-button {
  color: #adb5bd;
}

.dark .tool-button:hover,
.dark .property-button:hover,
.dark .action-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #f8f9fa;
}

.dark .tool-button.active {
  background: #6c757d;
  color: white;
}

.dark .property-button.active {
  background: #495057;
  color: #f8f9fa;
}

.dark .tool-separator,
.dark .property-separator,
.dark .action-separator {
  background: rgba(255, 255, 255, 0.2);
}

.dark .property-label,
.dark .opacity-value {
  color: #adb5bd;
}

/* Responsive design */
@media (max-width: 768px) {
  .excalidraw-toolbar-container {
    top: 10px;
    left: 10px;
    right: 10px;
    transform: none;
  }

  .floating-toolbar {
    flex-wrap: wrap;
    justify-content: center;
  }

  .property-toolbar {
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .action-toolbar {
    position: relative;
    top: auto;
    right: auto;
    flex-direction: row;
    align-self: stretch;
  }
}

/* Animation effects */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.floating-toolbar,
.property-toolbar {
  animation: fadeInUp 0.3s ease;
}
</style>