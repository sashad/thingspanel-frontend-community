<script setup lang="ts">
/**
 * Polling controller component
 * Support global polling control and future single-card polling control
 */

import { computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useGlobalPollingManager } from '@/components/visual-editor/core/GlobalPollingManager'
import { $t } from '@/locales'

interface Props {
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

const props = withDefaults(defineProps<Props>(), {
  mode: 'global',
  position: 'bottom-right',
  showStats: true,
  lowProfile: true
})

const emit = defineEmits<{
  'polling-toggle': [enabled: boolean]
  'polling-enabled': []
  'polling-disabled': []
}>()

const message = useMessage()
const pollingManager = useGlobalPollingManager()

// Global polling status
const globalPollingEnabled = computed(() => pollingManager.isGlobalPollingEnabled())
const pollingStats = computed(() => pollingManager.getStatistics())

// Calculate the current state based on the pattern
const isPollingEnabled = computed(() => {
  if (props.mode === 'global') {
    return globalPollingEnabled.value
  } else if (props.mode === 'card' && props.componentId) {
    return pollingManager.isComponentPollingActive(props.componentId)
  }
  return false
})

// Statistics
const statsText = computed(() => {
  if (props.mode === 'global') {
    return `${pollingStats.value.activeTasks}/${pollingStats.value.totalTasks}`
  } else if (props.mode === 'card' && props.componentId) {
    const componentStats = pollingManager.getComponentStatistics(props.componentId)
    return `${componentStats.activeTasks}/${componentStats.totalTasks}`
  }
  return '0/0'
})

// button text
const buttonText = computed(() => {
  if (props.mode === 'global') {
    return isPollingEnabled.value ? $t('visualEditor.pollingPause') : $t('visualEditor.pollingStart')
  } else {
    return isPollingEnabled.value ? 'pause' : 'start up'
  }
})

// Switch polling status
const togglePolling = () => {
  if (props.mode === 'global') {
    handleGlobalPollingToggle()
  } else if (props.mode === 'card' && props.componentId) {
    handleCardPollingToggle()
  }
}

// Global polling switch
const handleGlobalPollingToggle = () => {
  const wasEnabled = globalPollingEnabled.value

  if (!wasEnabled) {
    pollingManager.enableGlobalPolling()
    message.success($t('visualEditor.pollingEnabled'))
    emit('polling-enabled')
  } else {
    pollingManager.disableGlobalPolling()
    message.info($t('visualEditor.pollingDisabled'))
    emit('polling-disabled')
  }

  emit('polling-toggle', !wasEnabled)
}

// Card polling switch
const handleCardPollingToggle = () => {
  if (!props.componentId) return

  const wasEnabled = pollingManager.isComponentPollingActive(props.componentId)

  if (wasEnabled) {
    // Stop all polling tasks for this component
    const success = pollingManager.stopComponentTasks(props.componentId)
    if (success) {
      message.info(`Component polling is paused`)
      emit('polling-disabled')
      emit('polling-toggle', false)
    }
  } else {
    // Start all polling tasks for this component
    const success = pollingManager.startComponentTasks(props.componentId)
    if (success) {
      message.success(`Component polling started`)
      emit('polling-enabled')
      emit('polling-toggle', true)
    }
  }
}

// Position style class
const positionClass = computed(() => {
  switch (props.position) {
    case 'bottom-right':
      return 'bottom-right'
    case 'bottom-left':
      return 'bottom-left'
    case 'top-right':
      return 'top-right'
    case 'top-left':
      return 'top-left'
    default:
      return 'bottom-right'
  }
})
</script>

<template>
  <div
    class="polling-controller"
    :class="[positionClass, { 'low-profile': lowProfile, 'polling-active': isPollingEnabled }]"
  >
    <!-- low profile mode：Small icon shown before hovering -->
    <div v-if="lowProfile" class="polling-indicator">
      <div class="indicator-dot" :class="{ active: isPollingEnabled }"></div>
    </div>

    <!-- full button：Hover display in low profile mode，Display directly in normal mode -->
    <div class="polling-button-container" :class="{ 'hover-show': lowProfile }">
      <n-button
        :type="isPollingEnabled ? 'success' : 'default'"
        :ghost="!isPollingEnabled"
        size="small"
        class="polling-btn"
        @click="togglePolling"
      >
        <template #icon>
          <span class="polling-icon">{{ isPollingEnabled ? '⏸️' : '▶️' }}</span>
        </template>
        {{ buttonText }}
        <span v-if="showStats" class="polling-stats">({{ statsText }})</span>
      </n-button>
    </div>
  </div>
</template>

<style scoped>
/* main container */
.polling-controller {
  position: fixed;
  z-index: 999;
  transition: all 0.3s ease;
}

/* position style */
.polling-controller.bottom-right {
  bottom: 20px;
  right: 20px;
}

.polling-controller.bottom-left {
  bottom: 20px;
  left: 20px;
}

.polling-controller.top-right {
  top: 20px;
  right: 20px;
}

.polling-controller.top-left {
  top: 20px;
  left: 20px;
}

/* low profile style */
.polling-controller.low-profile {
  width: 16px;
  height: 16px;
  overflow: visible;
}

.polling-controller.low-profile:hover {
  width: auto;
  height: auto;
}

/* small indicator */
.polling-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(107, 114, 128, 0.6);
  transition: all 0.3s ease;
  box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.2);
}

.indicator-dot.active {
  background: rgba(16, 185, 129, 0.8);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
  animation: polling-pulse-dot 2s infinite ease-in-out;
}

/* Pulse animation of dots */
@keyframes polling-pulse-dot {
  0%,
  100% {
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.5);
  }
}

/* Complete button container */
.polling-button-container {
  transition: all 0.3s ease;
}

.polling-button-container.hover-show {
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  pointer-events: none;
}

.polling-controller:hover .polling-button-container.hover-show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: all;
}

.polling-controller:hover .polling-indicator {
  opacity: 0;
  transform: scale(0.8);
}

/* button style */
.polling-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px !important;
  padding: 8px 16px !important;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  white-space: nowrap;
}

.polling-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.polling-icon {
  font-size: 16px;
  line-height: 1;
}

.polling-stats {
  font-size: 11px;
  opacity: 0.8;
  font-weight: 400;
  margin-left: 4px;
  color: inherit;
}

/* Poll button animation for success status */
:deep(.polling-btn.n-button--success-type) {
  animation: polling-pulse 2s infinite ease-in-out;
}

@keyframes polling-pulse {
  0%,
  100% {
    box-shadow: 0 4px 12px rgba(24, 160, 88, 0.3);
  }
  50% {
    box-shadow:
      0 4px 16px rgba(24, 160, 88, 0.5),
      0 0 20px rgba(24, 160, 88, 0.2);
  }
}

/* Dark theme adaptation */
.dark .polling-btn {
  background-color: rgba(42, 42, 42, 0.9) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.dark :deep(.polling-btn.n-button--success-type) {
  background-color: rgba(16, 185, 129, 0.9) !important;
}

.dark .indicator-dot {
  background: rgba(156, 163, 175, 0.6);
  box-shadow: 0 0 0 2px rgba(156, 163, 175, 0.2);
}

.dark .indicator-dot.active {
  background: rgba(16, 185, 129, 0.8);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
}

/* Responsive design */
@media (max-width: 768px) {
  .polling-controller.bottom-right {
    bottom: 10px;
    right: 10px;
  }

  .polling-controller.bottom-left {
    bottom: 10px;
    left: 10px;
  }

  .polling-btn {
    padding: 6px 12px !important;
    font-size: 12px;
  }
}
</style>
