<!--
  Unified Script Editor Component
  Integrated template selection、syntax highlighting、Real-time verification、Security check and other functions
-->
<template>
  <div class="script-editor-container">
    <!-- Editor header toolbar -->
    <div class="script-editor-header">
      <div class="editor-header-left">
        <n-space align="center">
          <n-text :depth="2" style="font-size: 12px">
            {{ t('scriptEditor.title') }}
          </n-text>
          <n-divider vertical />

          <!-- template selector -->
          <n-select
            v-model:value="selectedTemplateId"
            size="small"
            style="min-width: 200px"
            :placeholder="t('scriptEditor.selectTemplate')"
            :options="templateOptions"
            clearable
            @update:value="handleTemplateSelect"
          >
            <template #option="{ node, option }">
              <div class="template-option">
                <div class="template-name">{{ option.label }}</div>
                <div class="template-description">{{ option.description }}</div>
              </div>
            </template>
          </n-select>

          <!-- Validation status indicator -->
          <n-tag v-if="validationResult" :type="validationResult.valid ? 'success' : 'error'" size="small">
            {{ validationResult.valid ? t('scriptEditor.syntaxValid') : t('scriptEditor.syntaxError') }}
          </n-tag>

          <!-- security status indicator -->
          <n-tag v-if="securityResult" :type="securityResult.safe ? 'success' : 'warning'" size="small">
            {{ securityResult.safe ? t('scriptEditor.securitySafe') : t('scriptEditor.securityWarning') }}
          </n-tag>
        </n-space>
      </div>

      <div class="editor-header-right">
        <n-space>
          <!-- run button -->
          <n-button
            v-if="props.allowExecution"
            size="small"
            type="primary"
            :loading="executing"
            :disabled="!canExecute"
            @click="handleExecute"
          >
            <template #icon>
              <n-icon><PlayOutline /></n-icon>
            </template>
            {{ t('scriptEditor.run') }}
          </n-button>

          <!-- Format button -->
          <n-button size="small" quaternary @click="handleFormat">
            <template #icon>
              <n-icon><CodeOutline /></n-icon>
            </template>
            {{ t('scriptEditor.format') }}
          </n-button>

          <!-- Full screen switch -->
          <n-button size="small" quaternary @click="toggleFullscreen">
            <template #icon>
              <n-icon>
                <ExpandOutline v-if="!isFullscreen" />
                <ContractOutline v-else />
              </n-icon>
            </template>
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- Script editor body -->
    <div class="script-editor-body" :class="{ fullscreen: isFullscreen }">
      <n-input
        ref="editorRef"
        v-model:value="localCode"
        type="textarea"
        :rows="editorRows"
        :placeholder="getPlaceholder()"
        :input-props="editorInputProps"
        @update:value="handleCodeChange"
        @blur="handleBlur"
        @focus="handleFocus"
      />
    </div>

    <!-- bottom status bar -->
    <div class="script-editor-footer">
      <n-space justify="space-between" align="center">
        <div class="footer-left">
          <n-space align="center" size="small">
            <!-- Contextual parameter hints -->
            <n-text :depth="3" style="font-size: 11px">{{ t('scriptEditor.availableContext') }}:</n-text>
            <n-tag v-for="param in contextParams" :key="param" size="tiny" type="info">
              {{ param }}
            </n-tag>
          </n-space>
        </div>

        <div class="footer-right">
          <n-space align="center" size="small">
            <!-- Character statistics -->
            <n-text :depth="3" style="font-size: 11px">
              {{ t('scriptEditor.characters') }}: {{ localCode.length }}
            </n-text>

            <!-- Row count -->
            <n-text :depth="3" style="font-size: 11px">{{ t('scriptEditor.lines') }}: {{ lineCount }}</n-text>
          </n-space>
        </div>
      </n-space>
    </div>

    <!-- Execution results panel -->
    <n-collapse v-if="props.showExecutionResult && lastExecutionResult">
      <n-collapse-item title="Execution result" name="execution-result">
        <ScriptExecutionResultPanel :result="lastExecutionResult" />
      </n-collapse-item>
    </n-collapse>

    <!-- Error prompt panel -->
    <div v-if="errorMessages.length > 0" class="error-panel">
      <n-alert
        v-for="(error, index) in errorMessages"
        :key="index"
        :title="error.type === 'syntax' ? t('scriptEditor.syntaxError') : t('scriptEditor.securityError')"
        type="error"
        :show-icon="true"
        style="margin-bottom: 8px"
      >
        {{ error.message }}
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Unified Script Editor Component
 * integrated script-engine All functions of
 */
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import { PlayOutline, CodeOutline, ExpandOutline, ContractOutline } from '@vicons/ionicons5'
import { defaultScriptEngine } from '@/core/script-engine/script-engine'
import type { ScriptExecutionResult, ScriptTemplate, TemplateCategory } from '@/core/script-engine/types'

interface Props {
  /** script code */
  code: string
  /** Script type，For choosing the right template and context */
  scriptType?: 'data-fetcher' | 'data-processor' | 'data-merger' | 'general'
  /** List of context parameter names */
  contextParams?: string[]
  /** Number of editor lines */
  rows?: number
  /** Whether to allow script execution */
  allowExecution?: boolean
  /** Whether to display the execution results panel */
  showExecutionResult?: boolean
  /** Execution context data（for test execution） */
  executionContext?: Record<string, any>
  /** Is it read-only? */
  readonly?: boolean
  /** Template classification filtering */
  templateCategories?: TemplateCategory[]
}

interface Emits {
  (e: 'update:code', value: string): void
  (e: 'execute', result: ScriptExecutionResult): void
  (e: 'syntax-change', valid: boolean, error?: string): void
  (e: 'security-change', safe: boolean, issues?: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  scriptType: 'general',
  contextParams: () => [],
  rows: 8,
  allowExecution: false,
  showExecutionResult: false,
  readonly: false,
  templateCategories: () => []
})

const emit = defineEmits<Emits>()

// Internationalization and themes
const { t } = useI18n()
const themeStore = useThemeStore()

// Editor status
const editorRef = ref()
const localCode = ref(props.code)
const selectedTemplateId = ref<string>()
const isFullscreen = ref(false)
const executing = ref(false)
const focused = ref(false)

// Verification results
const validationResult = ref<{ valid: boolean; error?: string }>()
const securityResult = ref<{ safe: boolean; issues: string[] }>()
const lastExecutionResult = ref<ScriptExecutionResult>()

// error message
const errorMessages = ref<Array<{ type: 'syntax' | 'security'; message: string }>>([])

// Computed properties
const editorRows = computed(() => {
  if (isFullscreen.value) return 20
  return props.rows
})

const lineCount = computed(() => {
  return localCode.value.split('\n').length
})

const canExecute = computed(() => {
  return (
    props.allowExecution &&
    validationResult.value?.valid &&
    securityResult.value?.safe &&
    localCode.value.trim().length > 0
  )
})

const editorInputProps = computed(() => ({
  style: 'font-family: "JetBrains Mono", "Fira Code", Monaco, Consolas, monospace; font-size: 13px; line-height: 1.5;',
  spellcheck: 'false'
}))

// Template options
const templateOptions = computed(() => {
  const templates = defaultScriptEngine.templateManager.getAllTemplates()

  let filteredTemplates = templates

  // Filter by script type
  if (props.scriptType !== 'general') {
    filteredTemplates = templates.filter(
      template => template.category === props.scriptType || template.category === 'utility'
    )
  }

  // Filter by category
  if (props.templateCategories.length > 0) {
    filteredTemplates = filteredTemplates.filter(template =>
      props.templateCategories.includes(template.category as TemplateCategory)
    )
  }

  return filteredTemplates.map(template => ({
    label: template.name,
    value: template.id,
    description: template.description,
    category: template.category
  }))
})

// Context parameter handling
const contextParams = computed(() => {
  const baseParams = ['JSON', 'Math', 'Date', 'console']
  const typeParams = getContextParamsByType(props.scriptType)
  const customParams = props.contextParams || []

  return [...new Set([...baseParams, ...typeParams, ...customParams])]
})

/**
 * Get context parameters based on script type
 */
function getContextParamsByType(scriptType: string): string[] {
  switch (scriptType) {
    case 'data-fetcher':
      return ['context']
    case 'data-processor':
      return ['data']
    case 'data-merger':
      return ['items', 'Array', 'Object']
    default:
      return []
  }
}

/**
 * Get placeholder text
 */
function getPlaceholder(): string {
  switch (props.scriptType) {
    case 'data-fetcher':
      return t('scriptEditor.placeholder.dataFetcher')
    case 'data-processor':
      return t('scriptEditor.placeholder.dataProcessor')
    case 'data-merger':
      return t('scriptEditor.placeholder.dataMerger')
    default:
      return t('scriptEditor.placeholder.general')
  }
}

/**
 * Handle code changes
 */
function handleCodeChange(value: string) {
  localCode.value = value
  emit('update:code', value)

  // Delayed verification，Avoid frequent triggering
  debounceValidation()
}

/**
 * Anti-shake verification
 */
let validationTimer: NodeJS.Timeout
function debounceValidation() {
  clearTimeout(validationTimer)
  validationTimer = setTimeout(() => {
    performValidation()
  }, 500)
}

/**
 * Perform verification
 */
function performValidation() {
  errorMessages.value = []

  if (!localCode.value.trim()) {
    validationResult.value = undefined
    securityResult.value = undefined
    return
  }

  // Grammar verification
  const syntaxResult = defaultScriptEngine.validateScript(localCode.value)
  validationResult.value = syntaxResult

  if (!syntaxResult.valid && syntaxResult.error) {
    errorMessages.value.push({
      type: 'syntax',
      message: syntaxResult.error
    })
  }

  emit('syntax-change', syntaxResult.valid, syntaxResult.error)

  // Security check
  const safetyResult = defaultScriptEngine.checkScriptSecurity(localCode.value)
  securityResult.value = safetyResult

  if (!safetyResult.safe && safetyResult.issues.length > 0) {
    safetyResult.issues.forEach(issue => {
      errorMessages.value.push({
        type: 'security',
        message: issue
      })
    })
  }

  emit('security-change', safetyResult.safe, safetyResult.issues)
}

/**
 * Template selection process
 */
async function handleTemplateSelect(templateId: string | null) {
  if (!templateId) {
    selectedTemplateId.value = undefined
    return
  }

  const template = defaultScriptEngine.templateManager.getTemplate(templateId)
  if (template) {
    // Generate default parameters
    const defaultParams: Record<string, any> = {}
    template.parameters.forEach(param => {
      defaultParams[param.name] = param.defaultValue ?? getDefaultValueByType(param.type)
    })

    try {
      const code = defaultScriptEngine.templateManager.generateCode(templateId, defaultParams)
      localCode.value = code
      emit('update:code', code)

      await nextTick()
      performValidation()
    } catch (error) {}
  }
}

/**
 * Get default value based on type
 */
function getDefaultValueByType(type: string): any {
  switch (type) {
    case 'string':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'array':
      return []
    case 'object':
      return {}
    default:
      return undefined
  }
}

/**
 * Execute script
 */
async function handleExecute() {
  if (!canExecute.value) return

  executing.value = true

  try {
    const result = await defaultScriptEngine.execute(localCode.value, props.executionContext || {})

    lastExecutionResult.value = result
    emit('execute', result)
  } catch (error) {
    lastExecutionResult.value = {
      success: false,
      error: error as Error,
      executionTime: 0,
      logs: []
    }
  } finally {
    executing.value = false
  }
}

/**
 * Format code
 */
function handleFormat() {
  // Simple formatting logic
  try {
    const formatted = localCode.value
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .replace(/;\s*\n/g, ';\n')
      .replace(/\{\s*\n/g, '{\n  ')
      .replace(/\}\s*\n/g, '\n}\n')

    localCode.value = formatted
    emit('update:code', formatted)
  } catch (error) {}
}

/**
 * Toggle full screen
 */
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

/**
 * focus event
 */
function handleFocus() {
  focused.value = true
}

function handleBlur() {
  focused.value = false
  performValidation()
}

// Monitor external code changes
watch(
  () => props.code,
  newCode => {
    if (newCode !== localCode.value) {
      localCode.value = newCode
      performValidation()
    }
  }
)

// Perform initial verification when component is mounted
onMounted(() => {
  if (localCode.value) {
    performValidation()
  }
})
</script>

<style scoped>
.script-editor-container {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-color);
  overflow: hidden;
}

.script-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--body-color);
}

.editor-header-left {
  flex: 1;
}

.editor-header-right {
  flex-shrink: 0;
}

.template-option {
  padding: 4px 0;
}

.template-name {
  font-weight: 500;
  font-size: 13px;
  color: var(--text-color);
}

.template-description {
  font-size: 11px;
  color: var(--text-color-3);
  margin-top: 2px;
}

.script-editor-body {
  position: relative;
}

.script-editor-body.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: var(--card-color);
  padding: 20px;
}

.script-editor-body.fullscreen :deep(.n-input) {
  height: calc(100vh - 100px) !important;
}

.script-editor-footer {
  padding: 8px 16px;
  border-top: 1px solid var(--border-color);
  background: var(--body-color);
}

.footer-left {
  flex: 1;
}

.footer-right {
  flex-shrink: 0;
}

.error-panel {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  background: var(--error-color-hover);
}

/* Dark theme adaptation */
[data-theme='dark'] .script-editor-container {
  background: var(--card-color);
  border-color: var(--border-color);
}

[data-theme='dark'] .script-editor-header,
[data-theme='dark'] .script-editor-footer {
  background: var(--body-color);
  border-color: var(--border-color);
}

/* Responsive design */
@media (max-width: 768px) {
  .script-editor-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .editor-header-right {
    align-self: flex-end;
  }
}
</style>
