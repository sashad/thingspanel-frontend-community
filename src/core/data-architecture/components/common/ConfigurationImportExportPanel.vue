<!--
Configure import and export panel components
independentUIcomponents，Provide configuration import and export functions
-->
<template>
  <n-space align="center">
    <!-- Export button group -->
    <n-dropdown :options="exportOptions" :disabled="isProcessing" @select="handleExportSelect">
      <n-button type="primary" size="small" :loading="isProcessing">
        <template #icon>
          <n-icon><DownloadOutlined /></n-icon>
        </template>
        {{ $t('common.export') }}
        <template #suffix>
          <n-icon size="14"><DownOutlined /></n-icon>
        </template>
      </n-button>
    </n-dropdown>

    <!-- import button -->
    <n-button type="info" size="small" :loading="isProcessing" @click="triggerFileInput">
      <template #icon>
        <n-icon><UploadOutlined /></n-icon>
      </template>
      {{ $t('common.import') }}
    </n-button>

    <!-- Hidden file input -->
    <input ref="fileInputRef" type="file" accept=".json" style="display: none" @change="handleImportFileSelect" />

    <!-- Import preview modal box -->
    <n-modal
      v-model:show="showImportModal"
      preset="card"
      :title="$t('configuration.import.previewTitle')"
      size="large"
      :bordered="false"
      :segmented="false"
      style="width: 90%; max-width: 800px"
    >
      <div v-if="importPreview" class="import-preview">
        <!-- Basic information -->
        <n-card size="small" :title="$t('configuration.import.basicInfo')">
          <n-descriptions :column="2" size="small">
            <n-descriptions-item :label="$t('configuration.import.version')">
              {{ importPreview.basicInfo.version }}
            </n-descriptions-item>
            <n-descriptions-item :label="$t('configuration.import.exportTime')">
              {{ formatDateTime(importPreview.basicInfo.exportTime) }}
            </n-descriptions-item>
            <n-descriptions-item :label="$t('configuration.import.componentType')">
              {{ importPreview.basicInfo.componentType || $t('common.notSpecified') }}
            </n-descriptions-item>
            <n-descriptions-item :label="$t('configuration.import.source')">
              {{ importPreview.basicInfo.exportSource }}
            </n-descriptions-item>
          </n-descriptions>
        </n-card>

        <!-- Configuration statistics -->
        <n-card size="small" :title="$t('configuration.import.statistics')">
          <n-space>
            <n-tag type="info">
              {{ $t('configuration.import.dataSourceCount') }}: {{ importPreview.statistics.dataSourceCount }}
            </n-tag>
            <n-tag type="success">
              {{ $t('configuration.import.interactionCount') }}: {{ importPreview.statistics.interactionCount }}
            </n-tag>
            <n-tag type="warning">
              {{ $t('configuration.import.httpConfigCount') }}: {{ importPreview.statistics.httpConfigCount }}
            </n-tag>
          </n-space>
        </n-card>

        <!-- Dependency analysis -->
        <n-card
          v-if="importPreview.dependencies && importPreview.dependencies.length > 0"
          size="small"
          :title="$t('configuration.import.dependencies')"
        >
          <n-space vertical size="small">
            <n-text depth="3">{{ $t('configuration.import.dependenciesHint') }}</n-text>
            <div class="dependency-list">
              <n-tag v-for="dep in importPreview.dependencies" :key="dep" type="info" size="small">
                {{ dep.substring(0, 8) }}...
              </n-tag>
            </div>
          </n-space>
        </n-card>

        <!-- Clash detection -->
        <n-alert
          v-if="importPreview.conflicts && importPreview.conflicts.length > 0"
          type="warning"
          :title="$t('configuration.import.conflictsFound')"
          style="margin: 16px 0"
        >
          <ul>
            <li v-for="conflict in importPreview.conflicts" :key="conflict">
              {{ conflict }}
            </li>
          </ul>
        </n-alert>

        <n-alert v-else type="success" :title="$t('configuration.import.noConflicts')" style="margin: 16px 0" />
      </div>

      <template #action>
        <n-space>
          <n-button @click="showImportModal = false">
            {{ $t('common.cancel') }}
          </n-button>
          <n-button
            type="primary"
            :loading="isProcessing"
            :disabled="importPreview?.conflicts.length > 0"
            @click="handleConfirmImport"
          >
            {{ $t('common.confirm') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- Single data source export selection modal box -->
    <n-modal
      v-model:show="showSingleDataSourceModal"
      preset="card"
      :title="$t('configuration.export.selectDataSource')"
      size="medium"
      :bordered="false"
      :segmented="false"
      style="width: 90%; max-width: 600px"
    >
      <div v-if="availableDataSources.length > 0" class="datasource-selection">
        <n-text depth="3">{{ $t('configuration.export.selectDataSourceHint') }}</n-text>

        <div class="datasource-list" style="margin-top: 16px">
          <n-card
            v-for="source in availableDataSources"
            :key="source.sourceId"
            size="small"
            hoverable
            :class="['datasource-item', { 'has-data': source.hasData, 'empty-data': !source.hasData }]"
            style="margin-bottom: 8px; cursor: pointer"
            @click="() => handleSingleDataSourceExport(source.sourceId)"
          >
            <div class="datasource-info">
              <div class="datasource-header">
                <n-text strong>{{ source.sourceId }}</n-text>
                <n-tag :type="source.hasData ? 'success' : 'default'" size="small">
                  {{ source.hasData ? t('configuration.export.hasData') : t('configuration.export.noData') }}
                </n-tag>
              </div>
              <div class="datasource-details">
                <n-text depth="3">{{ t('configuration.export.dataItemCount') }}: {{ source.dataItemCount }}</n-text>
                <n-text depth="3">{{ t('configuration.export.position') }}: {{ source.sourceIndex + 1 }}</n-text>
              </div>
            </div>
          </n-card>
        </div>
      </div>

      <template #action>
        <n-space>
          <n-button @click="showSingleDataSourceModal = false">
            {{ $t('common.cancel') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- Single data source import preview modal box -->
    <n-modal
      v-model:show="showSingleDataSourceImportModal"
      preset="dialog"
      :title="t('configuration.import.singleDataSourcePreview')"
      style="width: 600px"
      :show-icon="false"
    >
      <div v-if="singleDataSourceImportPreview">
        <n-space vertical>
          <!-- Source information -->
          <n-card :title="t('configuration.import.sourceInfo')" size="small">
            <n-descriptions :column="2" size="small">
              <n-descriptions-item :label="t('configuration.export.dataSource')">
                {{ singleDataSourceImportPreview.sourceDataSourceId }}
              </n-descriptions-item>
              <n-descriptions-item :label="t('configuration.import.version')">
                {{ singleDataSourceImportPreview.version }}
              </n-descriptions-item>
              <n-descriptions-item :label="t('configuration.import.exportTime')">
                {{ new Date(singleDataSourceImportPreview.exportTime).toLocaleString() }}
              </n-descriptions-item>
              <n-descriptions-item :label="t('configuration.export.dataItems')">
                {{ singleDataSourceImportPreview.configurationCount }}
              </n-descriptions-item>
            </n-descriptions>
          </n-card>

          <!-- target information -->
          <n-card :title="t('configuration.import.targetInfo')" size="small">
            <n-form-item :label="t('configuration.import.selectTargetSlot')">
              <n-select
                v-model:value="selectedTargetSlot"
                :options="targetSlotOptions"
                :placeholder="t('configuration.import.selectTargetSlot')"
              >
                <template #option="{ node, option }">
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <span>{{ option.label }}</span>
                    <n-tag :type="option.occupied ? 'warning' : 'success'" size="small">
                      {{
                        option.occupied ? t('configuration.import.slotOccupied') : t('configuration.import.slotEmpty')
                      }}
                    </n-tag>
                  </div>
                </template>
              </n-select>
            </n-form-item>

            <n-alert
              v-if="selectedTargetSlot && targetSlotOptions.find(slot => slot.value === selectedTargetSlot)?.occupied"
              type="warning"
              :title="t('configuration.import.slotOccupied')"
              style="margin-top: 8px"
            >
              The selected slot already has data，Importing will overwrite existing configuration
            </n-alert>
          </n-card>
        </n-space>
      </div>

      <template #action>
        <n-space>
          <n-button @click="showSingleDataSourceImportModal = false">
            {{ $t('common.cancel') }}
          </n-button>
          <n-button
            type="primary"
            :disabled="!selectedTargetSlot || isProcessing"
            :loading="isProcessing"
            @click="handleSingleDataSourceImport"
          >
            {{ t('configuration.import.importToSlot') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
/**
 * Configure import and export panel components
 * Provide independent configuration import and exportUIFunction
 */

import { ref, computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import {
  NSpace,
  NButton,
  NIcon,
  NModal,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NText,
  NAlert,
  NDropdown,
  NSelect,
  NForm,
  NFormItem
} from 'naive-ui'
import { DownloadOutlined, UploadOutlined, DownOutlined } from '@vicons/antd'

import {
  configurationExporter,
  configurationImporter,
  singleDataSourceExporter,
  singleDataSourceImporter
} from '../../utils/ConfigurationImportExport'
import type { ImportPreview, SingleDataSourceImportPreview } from '@/core/data-architecture/utils/ConfigurationImportExport'

// Propsdefinition
interface Props {
  /** Current configuration data */
  configuration: Record<string, any>
  /** componentsID */
  componentId: string
  /** Component type（Optional） */
  componentType?: string
  /** Configuration manager instance */
  configurationManager?: any
}

const props = withDefaults(defineProps<Props>(), {
  componentType: '',
  configurationManager: undefined
})

// Emitsdefinition
const emit = defineEmits<{
  /** Export success event */
  exportSuccess: [data: any]
  /** Import success event */
  importSuccess: [data: any]
  /** Operation failure event */
  operationError: [error: Error]
}>()

const { t } = useI18n()
const message = useMessage()

// Responsive data
const isProcessing = ref(false)
const showImportModal = ref(false)
const showSingleDataSourceModal = ref(false)
const showSingleDataSourceImportModal = ref(false)
const importFile = ref<File | null>(null)
const importPreview = ref<ImportPreview | null>(null)
const singleDataSourceImportPreview = ref<SingleDataSourceImportPreview | null>(null)
const fileInputRef = ref<HTMLInputElement>()
const availableDataSources = ref<
  Array<{
    sourceId: string
    sourceIndex: number
    hasData: boolean
    dataItemCount: number
  }>
>([])
const targetSlotOptions = ref<
  Array<{
    label: string
    value: string
    disabled: boolean
    occupied: boolean
  }>
>([])
const selectedTargetSlot = ref<string>('')

// Export options
const exportOptions = computed(() => [
  {
    label: t('configuration.export.fullConfiguration'),
    key: 'full',
    icon: () => h(NIcon, null, { default: () => h(DownloadOutlined) })
  },
  {
    label: t('configuration.export.singleDataSource'),
    key: 'single',
    icon: () => h(NIcon, null, { default: () => h(DownloadOutlined) })
  }
])

/**
 * Handle configuration export
 */
const handleExportConfiguration = async (): Promise<void> => {
  if (isProcessing.value) return

  try {
    isProcessing.value = true

    if (!props.configurationManager) {
      throw new Error(t('configuration.export.noManagerError'))
    }

    if (process.env.NODE_ENV === 'development') {
    }

    // Execute export
    const exportResult = await configurationExporter.exportConfiguration(
      props.componentId,
      props.configurationManager,
      props.componentType
    )

    // Generate file name
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '')
    const fileName = `config_${props.componentId.substring(0, 8)}_${timestamp}.json`

    // Download file
    const blob = new Blob([JSON.stringify(exportResult, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)

    message.success(t('configuration.export.success'))
    emit('exportSuccess', exportResult)

    if (process.env.NODE_ENV === 'development') {
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [ConfigurationExportPanel] Configuration export failed:', error)
    message.error(`${t('configuration.export.error')}: ${errorMessage}`)
    emit('operationError', error instanceof Error ? error : new Error(errorMessage))
  } finally {
    isProcessing.value = false
  }
}

/**
 * Handle export selections
 */
const handleExportSelect = (key: string): void => {
  if (key === 'full') {
    handleExportConfiguration()
  } else if (key === 'single') {
    handleShowSingleDataSourceExport()
  }
}

/**
 * Show single data source export selection
 */
const handleShowSingleDataSourceExport = async (): Promise<void> => {
  if (!props.configurationManager) {
    message.error(t('configuration.export.noManagerError'))
    return
  }

  try {
    // Get a list of available data sources
    availableDataSources.value = singleDataSourceExporter.getAvailableDataSources(
      props.componentId,
      props.configurationManager
    )

    if (availableDataSources.value.length === 0) {
      message.warning(t('configuration.export.noDataSources'))
      return
    }

    showSingleDataSourceModal.value = true
  } catch (error) {
    console.error('❌ [ConfigurationExportPanel] Failed to get data source list:', error)
    message.error(t('configuration.export.getDataSourcesError'))
  }
}

/**
 * Process single data source export
 */
const handleSingleDataSourceExport = async (sourceId: string): Promise<void> => {
  if (isProcessing.value) return

  try {
    isProcessing.value = true

    if (!props.configurationManager) {
      throw new Error(t('configuration.export.noManagerError'))
    }

    if (process.env.NODE_ENV === 'development') {
    }

    // Perform a single data source export
    const exportResult = await singleDataSourceExporter.exportSingleDataSource(
      props.componentId,
      sourceId,
      props.configurationManager,
      props.componentType
    )

    // Generate file name
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '')
    const fileName = `datasource_${sourceId}_${timestamp}.json`

    // Download file
    const blob = new Blob([JSON.stringify(exportResult, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)

    message.success(t('configuration.export.success'))
    emit('exportSuccess', exportResult)

    if (process.env.NODE_ENV === 'development') {
    }

    // Close modal box
    showSingleDataSourceModal.value = false
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [ConfigurationExportPanel] Single data source export failed:', error)
    message.error(`${t('configuration.export.error')}: ${errorMessage}`)
    emit('operationError', error instanceof Error ? error : new Error(errorMessage))
  } finally {
    isProcessing.value = false
  }
}

/**
 * Trigger file selection
 */
const triggerFileInput = (): void => {
  fileInputRef.value?.click()
}

/**
 * Handle import file selection
 */
const handleImportFileSelect = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  if (!file.name.endsWith('.json')) {
    message.error(t('configuration.import.invalidFileType'))
    return
  }

  importFile.value = file
  handlePreviewImport()
}

/**
 * Handle import preview
 */
const handlePreviewImport = async (): Promise<void> => {
  if (!importFile.value) return

  try {
    isProcessing.value = true

    const fileContent = await readFileAsText(importFile.value)
    const importData = JSON.parse(fileContent)

    if (process.env.NODE_ENV === 'development') {
    }

    // Determine whether it is a single data source file
    if (importData.type === 'singleDataSource') {
      // Process single data source import
      await handleSingleDataSourceImportPreview(importData)
    } else {
      // Handle full configuration import
      await handleFullConfigurationImportPreview(importData)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [ConfigurationExportPanel] Import preview failed:', error)
    message.error(`${t('configuration.import.previewError')}: ${errorMessage}`)
    emit('operationError', error instanceof Error ? error : new Error(errorMessage))
  } finally {
    isProcessing.value = false
  }
}

/**
 * Handle full configuration import preview
 */
const handleFullConfigurationImportPreview = async (importData: any): Promise<void> => {
  // Generate preview
  importPreview.value = configurationImporter.generateImportPreview(
    importData,
    props.componentId,
    props.configurationManager || {},
    props.configuration
  )

  showImportModal.value = true
}

/**
 * Processing order data source import preview
 */
const handleSingleDataSourceImportPreview = async (importData: any): Promise<void> => {
  if (!props.configurationManager) {
    throw new Error(t('configuration.export.noManagerError'))
  }

  // Generate single data source import preview
  singleDataSourceImportPreview.value = singleDataSourceImporter.generateImportPreview(
    importData,
    props.componentId,
    props.configurationManager
  )

  // Get the available slots of the target component
  await loadTargetSlotOptions()

  showSingleDataSourceImportModal.value = true
}

/**
 * Load target slot options
 */
const loadTargetSlotOptions = async (): Promise<void> => {
  if (!props.configurationManager) {
    return
  }

  try {
    // Get the available data source slots of the current component
    const availableSources = singleDataSourceExporter.getAvailableDataSources(
      props.componentId,
      props.configurationManager
    )

    targetSlotOptions.value = availableSources.map(source => ({
      label: `${t('configuration.export.dataSource')} ${source.sourceIndex + 1} (${source.sourceId})`,
      value: source.sourceId,
      disabled: false,
      occupied: source.hasData
    }))
  } catch (error) {
    console.error('❌ [ConfigurationExportPanel] Loading slot options failed:', error)
  }
}

/**
 * Perform a single data source import
 */
const handleSingleDataSourceImport = async (): Promise<void> => {
  if (!importFile.value || !singleDataSourceImportPreview.value || !selectedTargetSlot.value) {
    return
  }

  try {
    isProcessing.value = true

    const fileContent = await readFileAsText(importFile.value)
    const importData = JSON.parse(fileContent)

    if (process.env.NODE_ENV === 'development') {
    }

    // Execute import
    await singleDataSourceImporter.importSingleDataSource(
      importData,
      props.componentId,
      selectedTargetSlot.value,
      props.configurationManager
    )

    message.success(t('configuration.import.success'))
    emit('importSuccess', importData)

    if (process.env.NODE_ENV === 'development') {
    }

    // Close modal box
    showSingleDataSourceImportModal.value = false
    resetImportState()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [ConfigurationExportPanel] Single data source import failed:', error)
    message.error(`${t('configuration.import.error')}: ${errorMessage}`)
    emit('operationError', error instanceof Error ? error : new Error(errorMessage))
  } finally {
    isProcessing.value = false
  }
}

/**
 * Reset import status
 */
const resetImportState = (): void => {
  importFile.value = null
  importPreview.value = null
  singleDataSourceImportPreview.value = null
  selectedTargetSlot.value = ''
  targetSlotOptions.value = []
}

/**
 * Confirm import configuration
 */
const handleConfirmImport = async (): Promise<void> => {
  if (!importFile.value || !importPreview.value) return

  try {
    isProcessing.value = true

    const fileContent = await readFileAsText(importFile.value)
    const importData = JSON.parse(fileContent)

    if (process.env.NODE_ENV === 'development') {
    }

    // Execute import
    const importResult = configurationImporter.importConfiguration(
      importData,
      props.componentId,
      props.configurationManager
    )

    message.success(t('configuration.import.success'))
    emit('importSuccess', importResult)

    // Close the modal and clean it
    showImportModal.value = false
    importFile.value = null
    importPreview.value = null

    if (process.env.NODE_ENV === 'development') {
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [ConfigurationExportPanel] Configuration import failed:', error)
    message.error(`${t('configuration.import.error')}: ${errorMessage}`)
    emit('operationError', error instanceof Error ? error : new Error(errorMessage))
  } finally {
    isProcessing.value = false
  }
}

/**
 * Read file contents
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(t('configuration.import.fileReadError')))
    reader.readAsText(file)
  })
}

/**
 * Format date time
 */
const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}
</script>

<style scoped>
.import-preview {
  max-height: 500px;
  overflow-y: auto;
}

.import-preview > .n-card {
  margin-bottom: 16px;
}

.import-preview > .n-card:last-child {
  margin-bottom: 0;
}

.dependency-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Responsive design */
@media (max-width: 768px) {
  .import-preview {
    max-height: 400px;
  }
}
</style>
