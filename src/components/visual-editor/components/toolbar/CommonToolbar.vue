<!--
  Common toolbar components
  Contains save、Cancel、Redo、Common functions such as view control
-->
<script setup lang="ts">
import { computed } from 'vue'
import { NSpace, NButton, NDivider, NTooltip } from 'naive-ui'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { $t } from '@/locales'

interface Props {
  readonly?: boolean
  isSaving?: boolean
  hasChanges?: boolean
  canUndo?: boolean
  canRedo?: boolean
  currentRenderer?: string
}

interface Emits {
  (e: 'save'): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'reset'): void
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'reset-zoom'): void
  (e: 'fit-content'): void
  (e: 'center-view'): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  isSaving: false,
  hasChanges: false,
  canUndo: false,
  canRedo: false,
  currentRenderer: 'gridstack'
})

const emit = defineEmits<Emits>()

// Computed properties
const saveButtonType = computed(() => (props.hasChanges ? 'primary' : 'default'))
const saveButtonText = computed(() => (props.isSaving ? $t('visualEditor.saving') : $t('common.save')))

// Check if it isCanvasRenderer
const isCanvasRenderer = computed(() => props.currentRenderer === 'canvas')
const isSaveDisabled = computed(
  () => props.readonly || (!props.hasChanges && !props.isSaving) || isCanvasRenderer.value
)

// event handling
const handleSave = () => emit('save')
const handleUndo = () => emit('undo')
const handleRedo = () => emit('redo')
const handleReset = () => emit('reset')
const handleZoomIn = () => emit('zoom-in')
const handleZoomOut = () => emit('zoom-out')
const handleResetZoom = () => emit('reset-zoom')
const handleFitContent = () => emit('fit-content')
const handleCenterView = () => emit('center-view')
</script>

<template>
  <div class="common-toolbar">
    <NSpace align="center" :size="8">
      <!-- Document operations -->
      <NTooltip trigger="hover">
        <template #trigger>
          <NButton
            :type="saveButtonType"
            size="small"
            :loading="isSaving"
            :disabled="isSaveDisabled"
            @click="handleSave"
          >
            <template #icon>
              <SvgIcon icon="material-symbols:save" />
            </template>
            {{ saveButtonText }}
          </NButton>
        </template>
        <span v-if="isCanvasRenderer">{{ $t('visualEditor.canvasNotReady') }}</span>
        <span v-else>{{ $t('common.save') }} (Ctrl+S)</span>
      </NTooltip>

      <NDivider vertical />

      <!-- Cancel/Redo -->
      <NTooltip trigger="hover">
        <template #trigger>
          <NButton size="small" type="tertiary" :disabled="readonly || !canUndo" @click="handleUndo">
            <template #icon>
              <SvgIcon icon="material-symbols:undo" />
            </template>
          </NButton>
        </template>
        <span>{{ $t('common.undo') }} (Ctrl+Z)</span>
      </NTooltip>

      <NTooltip trigger="hover">
        <template #trigger>
          <NButton size="small" type="tertiary" :disabled="readonly || !canRedo" @click="handleRedo">
            <template #icon>
              <SvgIcon icon="material-symbols:redo" />
            </template>
          </NButton>
        </template>
        <span>{{ $t('common.redo') }} (Ctrl+Y)</span>
      </NTooltip>

      <NDivider vertical />

      <!-- View control -->
      <NTooltip trigger="hover">
        <template #trigger>
          <NButton size="small" type="tertiary" @click="handleZoomOut">
            <template #icon>
              <SvgIcon icon="material-symbols:zoom-out" />
            </template>
          </NButton>
        </template>
        <span>{{ $t('visualEditor.zoomOut') }} (Ctrl+-)</span>
      </NTooltip>

      <NTooltip trigger="hover">
        <template #trigger>
          <NButton size="small" type="tertiary" @click="handleResetZoom">
            <template #icon>
              <SvgIcon icon="material-symbols:fit-screen" />
            </template>
          </NButton>
        </template>
        <span>{{ $t('visualEditor.resetZoom') }} (Ctrl+0)</span>
      </NTooltip>

      <NTooltip trigger="hover">
        <template #trigger>
          <NButton size="small" type="tertiary" @click="handleZoomIn">
            <template #icon>
              <SvgIcon icon="material-symbols:zoom-in" />
            </template>
          </NButton>
        </template>
        <span>{{ $t('visualEditor.zoomIn') }} (Ctrl++)</span>
      </NTooltip>

      <NDivider vertical />

      <!-- Canvas control -->
      <NTooltip trigger="hover">
        <template #trigger>
          <NButton size="small" type="tertiary" @click="handleFitContent">
            <template #icon>
              <SvgIcon icon="material-symbols:fit-width" />
            </template>
          </NButton>
        </template>
        <span>{{ $t('visualEditor.fitContent') }}</span>
      </NTooltip>

      <NTooltip trigger="hover">
        <template #trigger>
          <NButton size="small" type="tertiary" @click="handleCenterView">
            <template #icon>
              <SvgIcon icon="material-symbols:center-focus-strong" />
            </template>
          </NButton>
        </template>
        <span>{{ $t('visualEditor.centerDisplay') }}</span>
      </NTooltip>

      <NDivider vertical />

      <!-- reset -->
      <NTooltip trigger="hover">
        <template #trigger>
          <NButton size="small" type="warning" secondary :disabled="readonly" @click="handleReset">
            <template #icon>
              <SvgIcon icon="material-symbols:refresh" />
            </template>
            {{ $t('visualEditor.reset') }}
          </NButton>
        </template>
        <span>{{ $t('visualEditor.resetToInitial') }}</span>
      </NTooltip>
    </NSpace>
  </div>
</template>

<style scoped>
.common-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Button hover effect */
.n-button {
  transition: all 0.2s var(--n-bezier);
}

.n-button:not(:disabled):hover {
  transform: translateY(-1px);
}

/* icon style */
.n-button .svg-icon {
  font-size: 16px;
}

/* Divider style */
.n-divider {
  margin: 0 4px;
}
</style>
