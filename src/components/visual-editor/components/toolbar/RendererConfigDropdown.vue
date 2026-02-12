<!--
  Renderer configuration drop-down panel
  Alternative pop-ups，Provide a smoother interactive experience
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NForm,
  NFormItem,
  NInputNumber,
  NSwitch,
  NColorPicker,
  NSlider,
  NSelect,
  NDivider,
  NSpace,
  NCard,
  useThemeVars
} from 'naive-ui'
import { $t } from '@/locales'

/**
 * Component property interface
 */
interface Props {
  // Show status
  show: boolean
  // Current renderer type
  currentRenderer: string
  // Configuration data
  canvasConfig?: Record<string, any>
  gridstackConfig?: Record<string, any>
  visualizationConfig?: Record<string, any>
}

/**
 * Component event interface
 */
interface Emits {
  // Configuration change event
  (e: 'canvas-config-change', config: Record<string, any>): void
  (e: 'gridstack-config-change', config: Record<string, any>): void
  (e: 'visualization-config-change', config: Record<string, any>): void
}

const props = withDefaults(defineProps<Props>(), {
  canvasConfig: () => ({}),
  gridstackConfig: () => ({}),
  visualizationConfig: () => ({})
})

const emit = defineEmits<Emits>()

// Topic variables
const themeVars = useThemeVars()

// Renderer type judgment
const isCanvasRenderer = computed(() => props.currentRenderer === 'canvas')
const isGridstackRenderer = computed(() => props.currentRenderer === 'gridstack')
const isVisualizationRenderer = computed(() => props.currentRenderer === 'visualization')

// Compute configuration object
const canvasConfig = computed(() => ({
  width: 1200,
  height: 800,
  showGrid: true,
  backgroundColor: '#f5f5f5',
  gridSize: 20,
  ...props.canvasConfig
}))

const gridstackConfig = computed(() => ({
  colNum: 24, // 🔥 repair：The unified default is24List
  rowHeight: 80,
  // 🔥 Remove spacing configuration，Hardcoded inside the renderer
  isDraggable: true,
  isResizable: true,
  staticGrid: false,
  ...props.gridstackConfig
}))

const visualizationConfig = computed(() => ({
  theme: 'default',
  animation: true,
  responsive: true,
  ...props.visualizationConfig
}))

// Configuration options
// 12Multiple column options
const columnOptions = [
  { label: '12List', value: 12 },
  { label: '24List', value: 24 },
  { label: '36List', value: 36 },
  { label: '48List', value: 48 },
  { label: '60List', value: 60 },
  { label: '72List', value: 72 },
  { label: '84List', value: 84 },
  { label: '96List', value: 96 }
]

// Row height has been changed to slider control，Options array no longer needed

const themeOptions = [
  { label: $t('visualEditor.defaultTheme'), value: 'default' },
  { label: $t('visualEditor.darkTheme'), value: 'dark' },
  { label: $t('visualEditor.lightTheme'), value: 'light' }
]

// Configuration change handling
const handleCanvasConfigChange = (config: Record<string, any>) => {
  emit('canvas-config-change', config)
}

const handleGridstackConfigChange = (config: Record<string, any>) => {
  emit('gridstack-config-change', config)
}

const handleVisualizationConfigChange = (config: Record<string, any>) => {
  emit('visualization-config-change', config)
}
</script>

<template>
  <Transition name="dropdown-fade">
    <div v-if="show" class="config-dropdown" @click.stop>
      <NCard class="config-panel" :bordered="true" size="small">
        <!-- Canvas Configuration -->
        <div v-if="isCanvasRenderer" class="config-section">
          <h4 class="section-title">{{ $t('visualEditor.canvasConfig') }}</h4>
          <NForm label-placement="left" label-width="80px" size="small">
            <NFormItem :label="$t('visualEditor.canvasWidth')">
              <NInputNumber
                :value="canvasConfig.width"
                :min="800"
                :max="4000"
                :step="100"
                size="small"
                style="width: 80px"
                @update:value="value => handleCanvasConfigChange({ ...canvasConfig, width: value })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.canvasHeight')">
              <NInputNumber
                :value="canvasConfig.height"
                :min="600"
                :max="3000"
                :step="100"
                size="small"
                style="width: 80px"
                @update:value="value => handleCanvasConfigChange({ ...canvasConfig, height: value })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.showGrid')">
              <NSwitch
                :value="canvasConfig.showGrid"
                size="small"
                @update:value="value => handleCanvasConfigChange({ ...canvasConfig, showGrid: value })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.backgroundColor')">
              <NColorPicker
                :value="canvasConfig.backgroundColor"
                size="small"
                @update:value="value => handleCanvasConfigChange({ ...canvasConfig, backgroundColor: value })"
              />
            </NFormItem>
          </NForm>
        </div>

        <!-- Gridstack Configuration -->
        <div v-else-if="isGridstackRenderer" class="config-section">
          <h4 class="section-title">{{ $t('visualEditor.gridConfig') }}</h4>
          <NForm label-placement="left" label-width="80px" size="small">
            <NFormItem :label="$t('visualEditor.columns')">
              <NSelect
                :value="gridstackConfig.colNum"
                :options="columnOptions"
                size="small"
                style="width: 80px"
                @update:value="value => handleGridstackConfigChange({ ...gridstackConfig, colNum: value })"
              />
            </NFormItem>

            <NFormItem :label="`${$t('visualEditor.rowHeight')} ${gridstackConfig.rowHeight}px`">
              <NSlider
                :value="gridstackConfig.rowHeight"
                :min="25"
                :max="200"
                :step="5"
                style="width: 120px"
                @update:value="value => handleGridstackConfigChange({ ...gridstackConfig, rowHeight: value })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.draggable')">
              <NSwitch
                :value="gridstackConfig.isDraggable"
                size="small"
                @update:value="value => handleGridstackConfigChange({ ...gridstackConfig, isDraggable: value })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.resizable')">
              <NSwitch
                :value="gridstackConfig.isResizable"
                size="small"
                @update:value="value => handleGridstackConfigChange({ ...gridstackConfig, isResizable: value })"
              />
            </NFormItem>
          </NForm>
        </div>

        <!-- Visual configuration -->
        <div v-else-if="isVisualizationRenderer" class="config-section">
          <h4 class="section-title">{{ $t('visualEditor.visualizationConfig') }}</h4>
          <NForm label-placement="left" label-width="80px" size="small">
            <NFormItem :label="$t('visualEditor.theme')">
              <NSelect
                :value="visualizationConfig.theme"
                :options="themeOptions"
                size="small"
                style="width: 80px"
                @update:value="value => handleVisualizationConfigChange({ ...visualizationConfig, theme: value })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.animation')">
              <NSwitch
                :value="visualizationConfig.animation"
                size="small"
                @update:value="value => handleVisualizationConfigChange({ ...visualizationConfig, animation: value })"
              />
            </NFormItem>
          </NForm>
        </div>
      </NCard>
    </div>
  </Transition>
</template>

<style scoped>
/* 🎯 dropdown panel container */
.config-dropdown {
  position: absolute;
  top: 100%;
  right: 16px;
  z-index: 1000;
  min-width: 240px;
  max-width: 300px;
  margin-top: 8px;
}

/* 🎨 Configure panel style - 78%transparent */
.config-panel {
  /* 78%Transparent background */
  background: rgba(255, 255, 255, 0.78) !important;

  /* shadows and borders */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
}

/* 📝 Configuration block */
.config-section {
  padding: 16px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 8px;
  opacity: 0.9;
}

[data-theme='dark'] .section-title {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* 📋 Form single row layout */
.form-row {
  margin-bottom: 16px;
}

.form-row .n-form-item {
  margin-bottom: 12px;
  width: 100%;
}

/* 🎭 transition animation */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: top right;
}

.dropdown-fade-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

.dropdown-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

/* 📱 Responsive processing */
@media (max-width: 768px) {
  .config-dropdown {
    right: 8px;
    left: 8px;
    min-width: auto;
    max-width: none;
  }

  .form-row {
    flex-direction: column;
    gap: 8px;
  }

  .form-row .n-form-item {
    width: 100%;
  }
}

/* 🌙 Dark theme adaptation - 78%transparent */
[data-theme='dark'] .config-panel {
  background: rgba(42, 42, 45, 0.78) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
}
</style>
