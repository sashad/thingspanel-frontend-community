<template>
  <div class="digit-indicator-setting">
    <n-form :model="config" label-placement="left" label-width="auto" size="small">

      <!-- icon style -->
      <n-divider title-placement="left">
        <span class="section-title">📱 icon style</span>
      </n-divider>

      <n-form-item label="">
        <IconSelector
          :default-icon="config.iconName"
          @icon-selected="handleIconSelect"
        />
      </n-form-item>

      <!-- Style suit options -->
      <n-divider title-placement="left">
        <span class="section-title">🎨 visual style</span>
      </n-divider>

      <n-form-item label="">
        <n-space vertical style="width: 100%;">
          <n-grid :cols="2" :x-gap="8" :y-gap="8">
            <n-grid-item v-for="preset in stylePresets" :key="preset.name">
              <n-card
                size="small"
                hoverable
                class="preset-card"
                @click="applyPreset(preset)"
              >
                <div class="preset-content">
                  <div class="preset-name">{{ preset.name }}</div>
                  <div class="preset-description">{{ preset.description }}</div>
                  <div class="preset-preview">
                    <div
                      class="color-dot icon-color"
                      :style="{ backgroundColor: preset.value.iconColor }"
                    ></div>
                    <div
                      class="color-dot value-color"
                      :style="{ backgroundColor: preset.value.valueColor }"
                    ></div>
                    <div
                      class="color-dot unit-color"
                      :style="{ backgroundColor: preset.value.unitColor }"
                    ></div>
                  </div>
                </div>
              </n-card>
            </n-grid-item>
          </n-grid>

          <n-button
            size="small"
            type="tertiary"
            @click="openJsonEditor"
            style="align-self: flex-start; margin-top: 8px;"
          >
            🔧 Advanced customization (JSON)
          </n-button>
        </n-space>
      </n-form-item>

      <!-- Performance options -->
      <n-divider title-placement="left">
        <span class="section-title">⚡ Performance options</span>
      </n-divider>

      <n-form-item label="hover effect">
        <n-switch v-model:value="config.enableHover" />
        <template #feedback>
          <span class="help-text">Enabling it will look better but may affect performance，Turn off to improve rendering performance</span>
        </template>
      </n-form-item>

      <!-- JSONEditor modal box -->
      <n-modal
        v-model:show="showJsonEditor"
        preset="card"
        title="Advanced configuration - JSONedit"
        style="width: 600px;"
      >
        <n-space vertical>
          <n-input
            v-model:value="jsonConfigText"
            type="textarea"
            :rows="15"
            placeholder="Edit configurationJSON..."
            style="font-family: monospace; font-size: 12px;"
          />
          <n-space justify="end">
            <n-button @click="showJsonEditor = false">Cancel</n-button>
            <n-button type="primary" @click="applyJsonConfig">Application configuration</n-button>
          </n-space>
        </n-space>
      </n-modal>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * Digital indicator component configuration form - Simplified version
 * Focus on style configuration，Remove redundant functionality
 */

import { ref, watch, nextTick } from 'vue'
import {
  NForm,
  NFormItem,
  NDivider,
  NSpace,
  NButton,
  NModal,
  NInput,
  NCard,
  NGrid,
  NGridItem,
  NSwitch
} from 'naive-ui'
import IconSelector from '@/components/common/icon-selector.vue'
import type { DigitIndicatorCustomize } from './settingConfig'
import { customConfig } from './settingConfig'

// Props
interface Props {
  modelValue?: DigitIndicatorCustomize
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({ ...customConfig }),
  readonly: false
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: DigitIndicatorCustomize): void
  (e: 'change', value: DigitIndicatorCustomize): void
}

const emit = defineEmits<Emits>()

// Configuration data
const config = ref<DigitIndicatorCustomize>({ ...props.modelValue })

// Tags that prevent cyclic updates
const isUpdatingFromProps = ref(false)

// Icon selection handler
const handleIconSelect = (iconName: string) => {
  config.value.iconName = iconName
}

// Complete visual style package - Contains all style attributes（Remove hover effect）
const stylePresets = [
  {
    name: 'Simple business',
    description: 'major、clean、modern',
    value: {
      // Color matching
      iconColor: '#595959',
      valueColor: '#262626',
      unitColor: '#8c8c8c',
      titleColor: '#bfbfbf',
      backgroundColor: '',
      // Dimensional design
      iconSize: 40,
      valueSize: 28,
      unitSize: 14,
      titleSize: 12,
      padding: 12,
      // visual effects
      valueFontWeight: 500,
      showGradient: false
      // enableHover Individually controlled by the user
    }
  },
  {
    name: 'Technology future',
    description: 'Dynamic、science and technology、Cool',
    value: {
      iconColor: '#1890ff',
      valueColor: '#1890ff',
      unitColor: '#52c41a',
      titleColor: '#666666',
      backgroundColor: 'rgba(24, 144, 255, 0.05)',
      iconSize: 52,
      valueSize: 36,
      unitSize: 16,
      titleSize: 14,
      padding: 18,
      valueFontWeight: 700,
      showGradient: true
    }
  },
  {
    name: 'Warm home',
    description: 'warmth、Comfortable、Affinity',
    value: {
      iconColor: '#ff7a45',
      valueColor: '#fa541c',
      unitColor: '#ff9c6e',
      titleColor: '#ad6800',
      backgroundColor: 'rgba(255, 122, 69, 0.08)',
      iconSize: 44,
      valueSize: 30,
      unitSize: 15,
      titleSize: 13,
      padding: 16,
      valueFontWeight: 600,
      showGradient: true
    }
  },
  {
    name: 'Natural and fresh',
    description: 'fresh、Environmental friendly、vitality',
    value: {
      iconColor: '#52c41a',
      valueColor: '#389e0d',
      unitColor: '#73d13d',
      titleColor: '#135200',
      backgroundColor: 'rgba(82, 196, 26, 0.06)',
      iconSize: 46,
      valueSize: 32,
      unitSize: 16,
      titleSize: 14,
      padding: 16,
      valueFontWeight: 600,
      showGradient: true
    }
  },
  {
    name: 'Eye-catching warning',
    description: 'Eye-catching、warning、important',
    value: {
      iconColor: '#ff4d4f',
      valueColor: '#cf1322',
      unitColor: '#ff7875',
      titleColor: '#820014',
      backgroundColor: 'rgba(255, 77, 79, 0.08)',
      iconSize: 50,
      valueSize: 34,
      unitSize: 17,
      titleSize: 15,
      padding: 18,
      valueFontWeight: 700,
      showGradient: true
    }
  },
  {
    name: 'Elegant purple tone',
    description: 'grace、mystery、noble',
    value: {
      iconColor: '#722ed1',
      valueColor: '#531dab',
      unitColor: '#9254de',
      titleColor: '#391085',
      backgroundColor: 'rgba(114, 46, 209, 0.06)',
      iconSize: 48,
      valueSize: 32,
      unitSize: 16,
      titleSize: 14,
      padding: 16,
      valueFontWeight: 600,
      showGradient: true
    }
  },
  {
    name: 'minimalist black and white',
    description: 'minimalist、modern、classic',
    value: {
      iconColor: '#000000',
      valueColor: '#000000',
      unitColor: '#666666',
      titleColor: '#999999',
      backgroundColor: '',
      iconSize: 42,
      valueSize: 30,
      unitSize: 14,
      titleSize: 12,
      padding: 14,
      valueFontWeight: 400,
      showGradient: false
    }
  },
  {
    name: 'Night mode',
    description: 'Dark、Eye protection、Cool',
    value: {
      iconColor: '#177ddc',
      valueColor: '#91d5ff',
      unitColor: '#69c0ff',
      titleColor: '#40a9ff',
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      iconSize: 48,
      valueSize: 32,
      unitSize: 16,
      titleSize: 14,
      padding: 16,
      valueFontWeight: 500,
      showGradient: true
    }
  }
]

// Apply a premade style - Preserve user's hover effect settings
const applyPreset = (preset: typeof stylePresets[0]) => {
  const currentHoverSetting = config.value.enableHover // Save current hover settings
  Object.assign(config.value, preset.value)
  config.value.enableHover = currentHoverSetting // Restore hover settings
  emit('update:modelValue', { ...config.value })
  emit('change', { ...config.value })
}

// JSONConfiguration editor
const showJsonEditor = ref(false)
const jsonConfigText = ref('')

const openJsonEditor = () => {
  jsonConfigText.value = JSON.stringify(config.value, null, 2)
  showJsonEditor.value = true
}

const applyJsonConfig = () => {
  try {
    const newConfig = JSON.parse(jsonConfigText.value)
    Object.assign(config.value, newConfig)
    emit('update:modelValue', { ...config.value })
    emit('change', { ...config.value })
    showJsonEditor.value = false
  } catch (error) {
    // Simple error message
    alert('JSONFormat error，Please check the syntax')
  }
}

// Listen for configuration changes and pass them up
watch(
  config,
  (newConfig) => {
    if (!props.readonly && !isUpdatingFromProps.value) {
      emit('update:modelValue', { ...newConfig })
      emit('change', { ...newConfig })
    }
  },
  { deep: true, immediate: true }
)

// Monitor external configuration changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && !isUpdatingFromProps.value) {
      isUpdatingFromProps.value = true
      try {
        config.value = { ...newValue }
      } finally {
        nextTick(() => {
          isUpdatingFromProps.value = false
        })
      }
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.digit-indicator-setting {
  padding: 16px;
}

/* Style optimization */
.n-form-item {
  margin-bottom: 20px;
}

.n-divider {
  margin: 24px 0 20px 0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

.help-text {
  font-size: 11px;
  color: var(--text-color-3);
  line-height: 1.4;
}

/* Style preset card styles */
.preset-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.preset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: var(--primary-color);
}

.preset-content {
  text-align: center;
  padding: 4px;
}

.preset-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
}

.preset-description {
  font-size: 11px;
  color: var(--text-color-2);
  margin-bottom: 8px;
  line-height: 1.3;
}

.preset-preview {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>