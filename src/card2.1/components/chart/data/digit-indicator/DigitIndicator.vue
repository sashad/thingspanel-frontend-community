<template>
  <div
    ref="containerRef"
    class="digit-indicator-container"
    :class="{
      'gradient-bg': config.showGradient,
      'hover-enabled': config.enableHover
    }"
    :style="containerStyle"
  >
    <!-- icon area -->
    <div class="icon-section" :style="iconSectionStyle">
      <n-icon
        class="main-icon"
        :size="config.iconSize"
        :color="config.iconColor"
      >
        <component :is="iconComponent" />
      </n-icon>
    </div>

    <!-- Numeric area -->
    <div class="value-section" :style="valueSectionStyle">
      <span class="value-text" :style="valueTextStyle">
        {{ displayValue }}
      </span>
      <span class="unit-text" :style="unitTextStyle">
        {{ displayUnit }}
      </span>
    </div>

    <!-- title area -->
    <div
      v-if="displayTitle"
      class="title-section"
      :style="titleSectionStyle"
    >
      <span class="title-text" :style="titleTextStyle">
        {{ displayTitle }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * digital indicator component - Clear version of responsibilities
 * The data source is responsible for business data，Component configuration is responsible for styling
 */

import { computed, ref } from 'vue'
import { NIcon } from 'naive-ui'
import { icons as iconOptions } from '@/components/common/icons'
import { useCard2Props } from '@/card2.1/hooks/useCard2Props'
import type { DigitIndicatorCustomize } from './settingConfig'

// Props interface
interface Props {
  config: any                    // Configuration data
  data?: Record<string, unknown> // Data source execution results
  componentId?: string           // Component uniqueID
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

// Use unified configuration management
const { unifiedConfig } = useCard2Props({
  config: props.config,
  data: props.data,
  componentId: props.componentId
})

// Reactive variables
const containerRef = ref<HTMLElement>()

// Development environment identification
const isDev = computed(() => import.meta.env.DEV)

// Get style configuration（pure style，Does not contain business data）
const config = computed((): DigitIndicatorCustomize => {
  return {
    // Icon style configuration
    iconName: 'Water',
    iconColor: '#1890ff',
    iconSize: 48,
    // Numeric style configuration
    valueColor: 'var(--text-color)',
    valueSize: 32,
    valueFontWeight: 700,
    // Unit style configuration
    unitColor: 'var(--text-color-2)',
    unitSize: 16,
    // Title style configuration
    titleColor: 'var(--text-color-2)',
    titleSize: 14,
    // Layout style configuration
    padding: 16,
    backgroundColor: '',
    showGradient: true,
    enableHover: true,
    // Merge user style configuration
    ...unifiedConfig.value.component
  }
})

// Business data acquisition - Correct default value logic：Data source first，Display default value when no data is available
const displayValue = computed(() => {
  // Add debugging information
  return props.data?.main?.data?.value || '45'  // Data source first，Display default value when no data is available
})

const displayUnit = computed(() => {
  return props.data?.main?.data?.unit || '%'    // Data source first，Display default value when no data is available
})

const displayTitle = computed(() => {
  return props.data?.main?.data?.metricsName || 'humidity'  // Data source first，Display default value when no data is available
})

// Calculation icon component
const iconComponent = computed(() => {
  const iconName = config.value.iconName || 'Water'
  return iconOptions[iconName] || iconOptions.Water
})

// style calculation
const containerStyle = computed(() => {
  return {
    padding: `${config.value.padding}px`,
    backgroundColor: config.value.backgroundColor || 'transparent'
  }
})

const iconSectionStyle = computed(() => {
  return {
    marginBottom: `${config.value.padding / 2}px`
  }
})

const valueSectionStyle = computed(() => {
  return {
    marginBottom: `${config.value.padding / 3}px`
  }
})

const valueTextStyle = computed(() => {
  return {
    fontSize: `${config.value.valueSize}px`,
    fontWeight: config.value.valueFontWeight,
    color: config.value.valueColor
  }
})

const unitTextStyle = computed(() => {
  return {
    fontSize: `${config.value.unitSize}px`,
    color: config.value.unitColor,
    marginLeft: '4px'
  }
})

const titleSectionStyle = computed(() => {
  return {
    marginTop: `${config.value.padding / 2}px`
  }
})

const titleTextStyle = computed(() => {
  return {
    fontSize: `${config.value.titleSize}px`,
    color: config.value.titleColor
  }
})
</script>

<style scoped>
/* Debug panel style */
.debug-panel {
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  background: rgba(255, 0, 0, 0.9);
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 10px;
  z-index: 1000;
  max-height: 150px;
  overflow-y: auto;
}

.debug-title {
  font-weight: bold;
  margin-bottom: 4px;
  color: #ffff00;
}

.debug-item {
  margin-bottom: 2px;
  word-break: break-all;
  line-height: 1.3;
}

.digit-indicator-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* Professional gradient background effects */
.digit-indicator-container.gradient-bg {
  background: linear-gradient(145deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(248, 250, 252, 0.8) 100%
  );
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* majorHoverEffect */
.digit-indicator-container.hover-enabled:hover {
  transform: translateY(-3px);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.08),
    0 4px 15px rgba(0, 0, 0, 0.04);
}

.digit-indicator-container.hover-enabled.gradient-bg:hover {
  background: linear-gradient(145deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.7) 50%,
    rgba(248, 250, 252, 0.85) 100%
  );
  border-color: rgba(255, 255, 255, 0.3);
}

/* icon area */
.icon-section {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.main-icon {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.hover-enabled:hover .main-icon {
  transform: scale(1.05);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

/* Numeric area */
.value-section {
  display: flex;
  justify-content: center;
  align-items: baseline;
  text-align: center;
  position: relative;
}

.value-text {
  line-height: 1;
  transition: all 0.3s ease;
  font-feature-settings: 'tnum' 1;
  letter-spacing: -0.02em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.unit-text {
  line-height: 1;
  transition: all 0.3s ease;
  opacity: 0.8;
}

/* title area */
.title-section {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.title-text {
  text-align: center;
  line-height: 1.3;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.3s ease;
  opacity: 0.75;
  letter-spacing: 0.01em;
}

/* Responsive design */
@media (max-width: 480px) {
  .digit-indicator-container {
    padding: 8px !important;
    border-radius: 8px;
  }

  .value-text {
    font-size: 24px !important;
  }

  .unit-text {
    font-size: 12px !important;
  }

  .title-text {
    font-size: 11px !important;
  }

  .main-icon {
    transform: scale(0.85);
  }
}

/* Tablet adaptation */
@media (max-width: 768px) and (min-width: 481px) {
  .digit-indicator-container {
    border-radius: 10px;
  }

  .value-text {
    font-size: calc(var(--value-size, 32px) * 0.9);
  }
}

/* Dark theme adaptation */
[data-theme="dark"] .digit-indicator-container {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .digit-indicator-container.gradient-bg {
  background: linear-gradient(145deg,
    rgba(30, 35, 42, 0.9) 0%,
    rgba(45, 52, 62, 0.7) 50%,
    rgba(25, 30, 36, 0.8) 100%
  );
  border-color: rgba(255, 255, 255, 0.08);
}

[data-theme="dark"] .digit-indicator-container.hover-enabled.gradient-bg:hover {
  background: linear-gradient(145deg,
    rgba(35, 40, 47, 0.95) 0%,
    rgba(50, 57, 67, 0.75) 50%,
    rgba(30, 35, 41, 0.85) 100%
  );
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.3),
    0 4px 15px rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] .main-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

[data-theme="dark"] .hover-enabled:hover .main-icon {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
}

[data-theme="dark"] .value-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Value change animation */
@keyframes valueChange {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.02);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.value-text.changing {
  animation: valueChange 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Loading status */
.digit-indicator-container.loading {
  opacity: 0.6;
}

.digit-indicator-container.loading .value-text {
  color: var(--text-color-3);
}

/* Advanced glassy effect（Optional） */
.digit-indicator-container.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

[data-theme="dark"] .digit-indicator-container.glass-effect {
  background: rgba(0, 0, 0, 0.1);
  border-color: rgba(255, 255, 255, 0.1);
}
</style>
