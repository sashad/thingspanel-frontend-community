<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'

interface Props {
  /** Card main title */
  title: string
  /** card subtitle，Optional，Support two lines of display */
  subtitle?: string
  /** Is the status point activated?，undefinedStatus points are not displayed when */
  statusActive?: boolean
  isStatus?: boolean
  /** Status point type，Affects the color when activated */
  statusType?: 'success' | 'warning' | 'error' | 'info' | 'default'
  /** The text shown on the bottom right，Can be a timestamp or other text */
  footerText?: string
  /** Whether to display borders */
  bordered?: boolean
  /** Whether to support hover effect */
  hoverable?: boolean
  /** Alarm status，Used for upper right corner icon */
  warnStatus?: string
  /** equipmentID，used to jump */
  deviceId?: string
  /** Device configurationID，Used for subtitle jump */
  deviceConfigId?: string
  hideFooterLeft?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  statusType: 'default',
  bordered: true,
  hoverable: false,
  isStatus: true
})

// Define component events
const emit = defineEmits<{
  /** Fires when the entire card is clicked */
  'click-card': []
  /** Fires when the title area is clicked */
  'click-title': []
  /** Triggered when the subtitle area is clicked */
  'click-subtitle': []
  /** Triggered when the alert icon is clicked */
  'click-warning': []
  /** Triggered when the icon in the upper right corner is clicked */
  'click-top-right-icon': []
}>()

// Calculate status point color
const statusColor = computed(() => {
  if (props.statusActive === undefined) return undefined

  // Return the corresponding color according to the state type and activation state
  const colorMap = {
    success: props.statusActive ? '#52c41a' : '#d9d9d9',
    warning: props.statusActive ? '#faad14' : '#d9d9d9',
    error: props.statusActive ? '#ff4d4f' : '#d9d9d9',
    info: props.statusActive ? '#1890ff' : '#d9d9d9',
    default: props.statusActive ? '#52c41a' : '#d9d9d9'
  }

  return colorMap[props.statusType]
})

// Utility function to check if there is a listener
const hasListener = (eventName: string) => {
  const listeners = getCurrentInstance()?.vnode.props
  return listeners && `on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}` in listeners
}

// Check if title clicks should be handled
const shouldHandleTitleClick = computed(() => {
  return hasListener('click-title') || props.deviceId
})

// Check if subtitle clicks should be handled
const shouldHandleSubtitleClick = computed(() => {
  return hasListener('click-subtitle') || props.deviceConfigId
})

// Check if top right icon click should be handled
const shouldHandleTopRightIconClick = computed(() => {
  return hasListener('click-top-right-icon') || props.warnStatus
})

// Click event handler function
const handleCardClick = () => {
  emit('click-card')
}

const handleTitleClick = () => {
  // Only prevent bubbling if clicks need to be processed
  if (shouldHandleTitleClick.value) {
    emit('click-title')
  }
}

const handleSubtitleClick = () => {
  // Only prevent bubbling if clicks need to be processed
  if (shouldHandleSubtitleClick.value) {
    emit('click-subtitle')
  }
}

const handleTopRightIconClick = () => {
  // Only prevent bubbling if clicks need to be processed
  if (shouldHandleTopRightIconClick.value) {
    emit('click-top-right-icon')
  }
}
</script>

<template>
  <NCard
    content-style="padding: 0px;margin: 0px;"
    :bordered="bordered"
    :hoverable="hoverable"
    class="item-card"
    @click="handleCardClick"
  >
    <!-- card content container -->
    <div class="card-container">
      <!-- card header：Contains title、Subtitle and right indicator -->
      <div class="card-header">
        <!-- Left title area -->
        <div class="title-section">
          <!-- Main title line：title text + status point -->
          <div class="title-row" :class="{ clickable: shouldHandleTitleClick }" @click="handleTitleClick">
            <div class="title-content">
              <!-- main title，Support single line omission -->
              <NEllipsis :tooltip="true">
                <template #tooltip>{{ title }}</template>
                <span class="card-title">{{ title }}</span>
              </NEllipsis>

              <!-- status point，Follow title display -->

              <div v-if="isStatus" class="status-dot" :style="{ backgroundColor: statusColor }" />
            </div>
          </div>

          <!-- subtitle line：icon + subtitle text -->
          <div
            v-if="subtitle || $slots['subtitle-icon']"
            class="subtitle-row"
            :class="{ clickable: shouldHandleSubtitleClick }"
            @click="handleSubtitleClick"
          >
            <!-- Subtitle Icon Slot，top aligned -->
            <div v-if="$slots['subtitle-icon']" class="subtitle-icon-container">
              <slot name="subtitle-icon" />
            </div>
            <!-- subtitle text，Supports two-line omission -->
            <div v-if="subtitle" class="subtitle-text-container">
              {{ subtitle }}
            </div>
          </div>
        </div>

        <!-- Icon area in the upper right corner - Support slot customization -->
        <div class="indicator-section">
          <div
            class="top-right-icon-container"
            :class="{ clickable: shouldHandleTopRightIconClick }"
            @click="handleTopRightIconClick"
          >
            <!-- Icon slot in the upper right corner -->
            <slot name="top-right-icon"></slot>
          </div>
        </div>
      </div>

      <!-- Card content area：Custom content slot - This area will automatically fill the remaining space -->
      <div class="card-content">
        <NEllipsis v-if="$slots.default" :line-clamp="2" :tooltip="true">
          <slot />
        </NEllipsis>
      </div>

      <!-- card bottom - fixed at bottom -->
      <div v-if="footerText || $slots['footer-icon'] || $slots.footer" class="card-footer">
        <!-- bottom left：icon + Custom content -->
        <div v-if="!props.hideFooterLeft" class="footer-left">
          <div class="footer-icon-container">
            <!-- if not providedfooter-iconslot，Show default device icon -->
            <slot name="footer-icon">
              <!-- Default device icon SVG -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#666" class="default-device-icon">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
              </svg>
            </slot>
          </div>
        </div>
        <div class="footer-right"><slot name="footer" /></div>
        <!-- bottom right：text content（Can be a timestamp or other text） -->
        <div v-if="footerText" class="footer-right">
          <NEllipsis class="footer-text" :tooltip="false">
            {{ footerText }}
          </NEllipsis>
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped lang="scss">
.item-card {
  width: 100%;
  height: 160px;
  border-radius: 12px;
  border: 1px solid #e1e5e9;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

/* hover effect - adjusted to match the user-suppliedHTMLExample consistent (No specifictransform, box-shadow, border-colorchange) */
.item-card:hover {
  border-color: #646cff;
}

/* Animation on click - kept subtle, can be removed if not desired */
.item-card:active {
  transform: translateY(2px) translateX(2px);
  transition: all 0.1s ease;
}

/* card content container，useflexboxlayout */
.card-container {
  padding: 20px 20px 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  /* margin-bottom: 16px; */
  flex-shrink: 0;
}

.title-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title-row {
  margin-bottom: 8px;
  transition: transform 0.2s ease;
}

/* Only clickable titles show pointer and hover effects */
.title-row.clickable {
  cursor: pointer;
}

.title-row.clickable:hover {
  transform: translateX(2px);
}

.title-row.clickable:hover .card-title {
  color: #1890ff;
  transition: color 0.2s ease;
}

.title-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  min-width: 0;
  transition: color 0.2s ease;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background-color 0.3s ease;
}

.subtitle-row {
  display: flex;
  align-items: center;
  gap: 4px;
  /* margin-bottom: 8px; */
  transition: transform 0.2s ease;
}

/* Only clickable subtitles show pointer and hover effects */
.subtitle-row.clickable {
  cursor: pointer;
}

.subtitle-row.clickable:hover {
  transform: translateX(2px);
}

.subtitle-row.clickable:hover .subtitle-text {
  color: #1890ff;
  transition: color 0.2s ease;
}

.subtitle-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 14px;
  flex-shrink: 0;

  /** device icon */
  .device-icon {
    width: 28px;
    height: 28px;
  }
}

.subtitle-text-container {
  flex: 1;
  min-width: 0;
}

.subtitle-text {
  font-size: 12px;
  color: #888;
  transition: color 0.2s ease;
}

.indicator-section {
  flex-shrink: 0;
  margin-left: 16px;
}

.top-right-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease;
}

/* Only clickable top right icons show pointer and hover effects */
.top-right-icon-container.clickable {
  cursor: pointer;
}

.top-right-icon-container.clickable:hover {
  transform: scale(1.2);
}

.card-content {
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.footer-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 35.5px;
  border-radius: 8px;
  flex-shrink: 0;
}

.default-device-icon {
  width: 18px;
  height: 18px;
  fill: #666;
  opacity: 0.8;
}

.footer-right {
  flex-shrink: 0;

  flex: 1;
  box-sizing: border-box;
}

.footer-text {
  font-size: 14px;
  color: #888;
  max-width: 150px;
}
</style>
