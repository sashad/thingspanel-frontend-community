<!--
Professional grade script editor component - based on CodeMirror 6 Refactor
Provides complete code editing functions and excellent user experience
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import { useI18n } from 'vue-i18n'

// import CodeMirror 6 Vue components
import CodeMirror from 'vue-codemirror6'
import { javascript } from '@codemirror/lang-javascript'

interface Props {
  /** Script content */
  modelValue?: string
  /** Editor placeholder */
  placeholder?: string
  /** Whether to display template selection */
  showTemplates?: boolean
  /** Template category filtering */
  templateCategory?: string
  /** Editor height */
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Please enterJavaScriptscript...',
  showTemplates: true,
  height: '200px'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// International integration
const { t } = useI18n()

// Theme system integration
const themeStore = useThemeStore()

// code example - Use hardcoded text to avoid internationalization circular dependencies
const codeExamples = {
  'data-generation': [
    {
      name: 'Generate random data',
      code: `return {
  value: Math.floor(Math.random() * 100),
  timestamp: Date.now(),
  id: Math.random().toString(36).substr(2, 9)
}`
    },
    {
      name: 'Generate time series',
      code: `return Array.from({ length: 10 }, (_, i) => ({
  time: Date.now() + i * 1000,
  value: Math.random() * 100
}))`
    }
  ],
  'data-processing': [
    {
      name: 'Data filtering',
      code: `return data.filter(item => item.value > 50)`
    },
    {
      name: 'data conversion',
      code: `return data.map(item => ({
  ...item,
  value: item.value * 2,
  processed: true
}))`
    }
  ],
  'data-merger': [
    {
      name: 'merge into objects',
      code: `return items.reduce((acc, item, index) => {
  acc[\`data_\${index}\`] = item
  return acc
}, {})`
    },
    {
      name: 'merge into array',
      code: `return items.flat()`
    }
  ]
}

// Get examples of the current category
const availableExamples = computed(() => {
  if (props.templateCategory && codeExamples[props.templateCategory]) {
    return codeExamples[props.templateCategory]
  }
  return Object.values(codeExamples).flat()
})

// Example selector options
const exampleOptions = computed(() =>
  availableExamples.value.map((example, index) => ({
    label: example.name,
    value: example.code
  }))
)

/**
 * Apply selected template
 */
const applyTemplate = (templateCode: string) => {
  if (templateCode) {
    emit('update:modelValue', templateCode)
  }
}

// CodeMirror 6 Configuration
const editorValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})
</script>

<template>
  <div class="simple-script-editor">
    <!-- template selector -->
    <div v-if="showTemplates && exampleOptions.length > 0" class="template-selector">
      <span class="mr-4">JavaScript deal with:</span>

      <n-select
        :options="exampleOptions"
        :placeholder="t('script.selectTemplate')"
        size="small"
        style="width: 240px"
        clearable
        @update:value="applyTemplate"
      />
      <n-popover trigger="hover" placement="top">
        <template #trigger>
          <span class="help-icon">❓</span>
        </template>
        <div>
          <p>Perform custom transformations on data</p>
          <p>
            Available variables:
            <code>data</code>
            (Enter data)
          </p>
          <p>
            must:
            <code>return</code>
            Return processed data
          </p>
          <p>Leave blank to not process</p>
        </div>
      </n-popover>
    </div>

    <!-- CodeMirror 6 Editor -->
    <div class="editor-container">
      <CodeMirror
        v-model="editorValue"
        basic
        :dark="themeStore.darkMode"
        :lang="javascript()"
        :placeholder="props.placeholder"
        :style="{ height: props.height }"
      />
    </div>
  </div>
</template>

<style scoped>
.simple-script-editor {
  width: 100%;
  display: flex;
  flex-direction: column;

  gap: 8px;
}

.template-selector {
  display: flex;
  align-items: center;
}

.editor-container {
  flex: 1;
  border: 1px solid var(--n-border-color);
  border-radius: var(--n-border-radius);
  overflow: hidden;
  transition: all 0.3s var(--n-bezier);
}

.editor-container:focus-within {
  border-color: var(--n-color-primary);
  box-shadow: 0 0 0 2px var(--n-color-primary-hover-opacity);
}

.editor-hint {
  font-size: 12px;
  color: var(--n-text-color-disabled);
  text-align: center;
}

/* CodeMirror 6 Style customization */
.simple-script-editor :deep(.cm-editor) {
  border: none;
  border-radius: var(--n-border-radius);
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  background: transparent;
  height: 100%;
}

.simple-script-editor :deep(.cm-focused) {
  outline: none;
}

.simple-script-editor :deep(.cm-content) {
  min-height: v-bind(height);
  line-height: 1.6;
  caret-color: var(--n-color-primary);
  padding: 12px;
}

.simple-script-editor :deep(.cm-gutters) {
  background: var(--n-color-base);
  border-right: 1px solid var(--n-border-color);
  color: var(--n-text-color-disabled);
}

.simple-script-editor :deep(.cm-lineNumbers .cm-gutterElement) {
  color: var(--n-text-color-disabled);
  padding: 0 8px;
  font-size: 12px;
}

.simple-script-editor :deep(.cm-selectionBackground) {
  background: rgba(24, 160, 88, 0.2) !important;
}

.simple-script-editor :deep(.cm-activeLine) {
  background: var(--n-color-hover);
}

.simple-script-editor :deep(.cm-activeLineGutter) {
  background: var(--n-color-hover);
}

/* Scroll bar style */
.simple-script-editor :deep(.cm-scroller::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

.simple-script-editor :deep(.cm-scroller::-webkit-scrollbar-track) {
  background: var(--n-color-base);
}

.simple-script-editor :deep(.cm-scroller::-webkit-scrollbar-thumb) {
  background: var(--n-scrollbar-color);
  border-radius: 3px;
}

.simple-script-editor :deep(.cm-scroller::-webkit-scrollbar-thumb:hover) {
  background: var(--n-scrollbar-color-hover);
}

/* placeholder style */
.simple-script-editor :deep(.cm-placeholder) {
  color: var(--n-text-color-disabled);
  font-style: italic;
}

/* Syntax highlighting customization */
.simple-script-editor :deep(.cm-editor.cm-focused .cm-selectionBackground) {
  background: rgba(24, 160, 88, 0.2) !important;
}

/* Respond to theme changes */
[data-theme='dark'] .simple-script-editor .editor-container {
  box-shadow: var(--n-box-shadow-1);
}

[data-theme='light'] .simple-script-editor .editor-container {
  background: var(--n-card-color);
}
</style>
