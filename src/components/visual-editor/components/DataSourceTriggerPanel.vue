<template>
  <div class="data-source-trigger-panel">
    <!-- 📊 Data source trigger control panel -->
    <n-card :bordered="false" size="small" class="trigger-control-card">
      <!-- 🎮 Panel head control area -->
      <template #header>
        <n-space justify="space-between" align="center">
          <n-space align="center" :size="8">
            <n-icon size="18" :color="themeStore.colors.primary">
              <TimerOutline />
            </n-icon>
            <n-text strong>{{ $t('dataSource.trigger.title') }}</n-text>
            <n-badge
              v-if="componentsWithDataSources.length > 0"
              :value="activeDataSourcesCount"
              type="success"
              :max="99"
            >
              <n-tag type="info" size="small" round>
                {{ componentsWithDataSources.length }} {{ $t('dataSource.trigger.components') }}
              </n-tag>
            </n-badge>
          </n-space>

          <!-- global control button -->
          <n-space :size="8">
            <!-- start all -->
            <n-button
              size="small"
              type="success"
              :disabled="componentsWithDataSources.length === 0 || allDataSourcesActive"
              :loading="bulkOperationLoading"
              @click="startAllDataSources"
            >
              <template #icon>
                <n-icon><PlayOutline /></n-icon>
              </template>
              {{ $t('dataSource.trigger.startAll') }}
            </n-button>

            <!-- stop all -->
            <n-button
              size="small"
              type="error"
              :disabled="activeDataSourcesCount === 0"
              :loading="bulkOperationLoading"
              @click="stopAllDataSources"
            >
              <template #icon>
                <n-icon><StopOutline /></n-icon>
              </template>
              {{ $t('dataSource.trigger.stopAll') }}
            </n-button>

            <!-- refresh status -->
            <n-button size="small" type="default" :loading="refreshLoading" @click="refreshComponentStatus">
              <template #icon>
                <n-icon><RefreshOutline /></n-icon>
              </template>
            </n-button>
          </n-space>
        </n-space>
      </template>

      <!-- 📋 List of data source components -->
      <div class="components-list">
        <!-- Empty status prompt -->
        <n-empty
          v-if="componentsWithDataSources.length === 0"
          :description="$t('dataSource.trigger.noComponents')"
          size="small"
        >
          <template #icon>
            <n-icon size="32" :color="themeStore.colors.textColor3">
              <ServerOutline />
            </n-icon>
          </template>
          <template #extra>
            <n-text depth="3" style="font-size: 12px">
              {{ $t('dataSource.trigger.configureHint') }}
            </n-text>
          </template>
        </n-empty>

        <!-- Component data source control list -->
        <n-space v-else vertical :size="8">
          <div v-for="component in componentsWithDataSources" :key="component.id" class="component-trigger-item">
            <n-card
              size="small"
              :bordered="true"
              class="component-card"
              :class="{
                'active-component': component.status === DataSourceStatus.RUNNING,
                'error-component': component.status === DataSourceStatus.ERROR
              }"
            >
              <!-- Component information area -->
              <n-space justify="space-between" align="center">
                <n-space align="center" :size="8">
                  <!-- status indicator -->
                  <n-tag :type="getStatusTagType(component.status)" size="small" round>
                    <template #icon>
                      <n-icon>
                        <component :is="getStatusIcon(component.status)" />
                      </n-icon>
                    </template>
                    {{ getStatusText(component.status) }}
                  </n-tag>

                  <!-- Component basic information -->
                  <div class="component-info">
                    <n-text strong style="font-size: 13px">
                      {{ component.name || component.type }}
                    </n-text>
                    <br />
                    <n-text depth="3" style="font-size: 11px">ID: {{ component.id.slice(0, 8) }}...</n-text>
                  </div>
                </n-space>

                <!-- control area -->
                <n-space align="center" :size="8">
                  <!-- Polling interval settings -->
                  <n-input-number
                    v-model:value="component.trigger.interval"
                    size="small"
                    :min="1000"
                    :max="3600000"
                    :step="1000"
                    style="width: 90px"
                    :placeholder="$t('dataSource.trigger.interval')"
                    @update:value="updatePollingInterval(component.id, $event)"
                  >
                    <template #suffix>
                      <n-text depth="3" style="font-size: 10px">ms</n-text>
                    </template>
                  </n-input-number>

                  <!-- manual trigger -->
                  <n-button
                    size="small"
                    type="info"
                    :disabled="component.status === DataSourceStatus.RUNNING"
                    :loading="component.manualTriggerLoading"
                    @click="manualTrigger(component.id)"
                  >
                    <template #icon>
                      <n-icon><FlashOutline /></n-icon>
                    </template>
                  </n-button>

                  <!-- start up/Stop switching -->
                  <n-button
                    size="small"
                    :type="component.status === DataSourceStatus.RUNNING ? 'error' : 'success'"
                    :loading="component.operationLoading"
                    @click="toggleDataSource(component.id)"
                  >
                    <template #icon>
                      <n-icon>
                        <component :is="component.status === DataSourceStatus.RUNNING ? StopOutline : PlayOutline" />
                      </n-icon>
                    </template>
                    {{ component.status === DataSourceStatus.RUNNING ? $t('common.stop') : $t('common.start') }}
                  </n-button>

                  <!-- More actions -->
                  <n-dropdown :options="getComponentActions(component)" @select="handleComponentAction">
                    <n-button size="small" quaternary>
                      <template #icon>
                        <n-icon><EllipsisHorizontalOutline /></n-icon>
                      </template>
                    </n-button>
                  </n-dropdown>
                </n-space>
              </n-space>

              <!-- Data source details expansion area -->
              <n-collapse-transition :show="component.showDetails">
                <div
                  class="component-details"
                  style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color)"
                >
                  <n-space vertical :size="8">
                    <!-- Data source configuration information -->
                    <div class="data-source-info">
                      <n-text depth="2" style="font-size: 12px">
                        {{ $t('dataSource.trigger.lastExecution') }}:
                        <n-time v-if="component.lastExecution" :time="component.lastExecution" format="HH:mm:ss" />
                        <n-text v-else depth="3">{{ $t('common.never') }}</n-text>
                      </n-text>
                      <br />
                      <n-text depth="2" style="font-size: 12px">
                        {{ $t('dataSource.trigger.executionCount') }}: {{ component.executionCount || 0 }}
                      </n-text>
                      <br />
                      <n-text depth="2" style="font-size: 12px">
                        {{ $t('dataSource.trigger.dataSourceType') }}: {{ component.dataSourceType || 'Unknown' }}
                      </n-text>
                    </div>

                    <!-- Recent error messages -->
                    <div v-if="component.lastError" class="error-info">
                      <n-alert type="error" size="small">
                        <template #header>
                          {{ $t('dataSource.trigger.lastError') }}
                        </template>
                        {{ component.lastError }}
                      </n-alert>
                    </div>

                    <!-- Data preview -->
                    <div v-if="component.lastData" class="data-preview">
                      <n-text depth="2" style="font-size: 12px; margin-bottom: 4px">
                        {{ $t('dataSource.trigger.lastData') }}:
                      </n-text>
                      <n-code
                        :code="JSON.stringify(component.lastData, null, 2)"
                        language="json"
                        style="font-size: 10px; max-height: 100px; overflow-y: auto"
                      />
                    </div>
                  </n-space>
                </div>
              </n-collapse-transition>
            </n-card>
          </div>
        </n-space>
      </div>

      <!-- 📈 execution statistics -->
      <template #footer>
        <n-space justify="space-between" align="center" style="font-size: 11px">
          <n-space align="center" :size="16">
            <n-text depth="3">
              {{ $t('dataSource.trigger.stats.total') }}: {{ componentsWithDataSources.length }}
            </n-text>
            <n-text depth="3">{{ $t('dataSource.trigger.stats.active') }}: {{ activeDataSourcesCount }}</n-text>
            <n-text depth="3">{{ $t('dataSource.trigger.stats.errors') }}: {{ errorDataSourcesCount }}</n-text>
            <n-divider vertical />
            <n-text depth="3">global polling: {{ pollingStatistics.totalTasks }} Task</n-text>
            <n-text depth="3">General execution: {{ pollingStatistics.totalExecutions }} Second-rate</n-text>
          </n-space>
          <n-space align="center" :size="8">
            <n-tag :type="pollingStatistics.globalTimerActive ? 'success' : 'default'" size="small" round>
              <template #icon>
                <n-icon>
                  <component :is="pollingStatistics.globalTimerActive ? CheckmarkCircleOutline : TimeOutline" />
                </n-icon>
              </template>
              {{ pollingStatistics.globalTimerActive ? 'Global timer is running' : 'global timer stopped' }}
            </n-tag>
            <n-text depth="3">
              {{ $t('dataSource.trigger.stats.lastUpdate') }}:
              <n-time :time="lastUpdateTime" format="HH:mm:ss" />
            </n-text>
          </n-space>
        </n-space>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * Data source trigger control panel
 * Provide a unified data source trigger management interface，Support batch operations and real-time status monitoring
 */

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import {
  TimerOutline,
  PlayOutline,
  StopOutline,
  RefreshOutline,
  ServerOutline,
  FlashOutline,
  EllipsisHorizontalOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  WarningOutline,
  TimeOutline
} from '@vicons/ionicons5'

// Import Data Source Manager and Global Poll Manager
import { editorDataSourceManager, DataSourceStatus } from '@/components/visual-editor/core/EditorDataSourceManager'
import type { ComponentDataSourceConfig } from '@/components/visual-editor/core/EditorDataSourceManager'
import { useGlobalPollingManager } from '@/components/visual-editor/core/GlobalPollingManager'

// Internationalization and themes
const { t } = useI18n()
const themeStore = useThemeStore()

// Global Poll Manager
const globalPollingManager = useGlobalPollingManager()

// Responsive state
const componentsWithDataSources = ref<ComponentDataSourceConfig[]>([])
const bulkOperationLoading = ref(false)
const refreshLoading = ref(false)
const lastUpdateTime = ref(Date.now())

// Polling task statistics
const pollingStatistics = computed(() => globalPollingManager.getStatistics())

// Scheduled refresher
let refreshTimer: NodeJS.Timeout | null = null

// Computed properties
const activeDataSourcesCount = computed(() => {
  return componentsWithDataSources.value.filter(c => c.status === DataSourceStatus.RUNNING).length
})

const errorDataSourcesCount = computed(() => {
  return componentsWithDataSources.value.filter(c => c.status === DataSourceStatus.ERROR).length
})

const allDataSourcesActive = computed(() => {
  return (
    componentsWithDataSources.value.length > 0 &&
    componentsWithDataSources.value.every(c => c.status === DataSourceStatus.RUNNING)
  )
})

/**
 * Get status label type
 */
const getStatusTagType = (status: DataSourceStatus): string => {
  switch (status) {
    case DataSourceStatus.RUNNING:
      return 'success'
    case DataSourceStatus.ERROR:
      return 'error'
    case DataSourceStatus.STOPPED:
      return 'default'
    default:
      return 'info'
  }
}

/**
 * Get status icon
 */
const getStatusIcon = (status: DataSourceStatus) => {
  switch (status) {
    case DataSourceStatus.RUNNING:
      return CheckmarkCircleOutline
    case DataSourceStatus.ERROR:
      return CloseCircleOutline
    case DataSourceStatus.STOPPED:
      return TimeOutline
    default:
      return WarningOutline
  }
}

/**
 * Get status text
 */
const getStatusText = (status: DataSourceStatus): string => {
  switch (status) {
    case DataSourceStatus.RUNNING:
      return t('dataSource.status.running')
    case DataSourceStatus.ERROR:
      return t('dataSource.status.error')
    case DataSourceStatus.STOPPED:
      return t('dataSource.status.stopped')
    default:
      return t('dataSource.status.unknown')
  }
}

/**
 * Update polling interval
 */
const updatePollingInterval = async (componentId: string, interval: number | null) => {
  if (!interval || interval < 1000) return

  try {
    await editorDataSourceManager.setPollingInterval(componentId, interval)
    // Update local status in real time
    const component = componentsWithDataSources.value.find(c => c.id === componentId)
    if (component && component.trigger) {
      component.trigger.interval = interval
    }
  } catch (error) {
    window.$message?.error(t('dataSource.trigger.updateIntervalError'))
  }
}

/**
 * Manually trigger data sources
 */
const manualTrigger = async (componentId: string) => {
  const component = componentsWithDataSources.value.find(c => c.id === componentId)
  if (!component) return

  component.manualTriggerLoading = true
  try {
    await editorDataSourceManager.triggerDataUpdate(componentId)
    window.$message?.success(t('dataSource.trigger.manualTriggerSuccess'))

    // Refresh component status
    await refreshComponentStatus()
  } catch (error) {
    window.$message?.error(t('dataSource.trigger.manualTriggerError'))
  } finally {
    component.manualTriggerLoading = false
  }
}

/**
 * Start switching data sources/stop state
 */
const toggleDataSource = async (componentId: string) => {
  const component = componentsWithDataSources.value.find(c => c.id === componentId)
  if (!component) return

  component.operationLoading = true
  try {
    if (component.status === DataSourceStatus.RUNNING) {
      await editorDataSourceManager.stopComponentDataSource(componentId)
      window.$message?.success(t('dataSource.trigger.stopSuccess'))
    } else {
      await editorDataSourceManager.startComponentDataSource(componentId)
      window.$message?.success(t('dataSource.trigger.startSuccess'))
    }

    // refresh status
    await refreshComponentStatus()
  } catch (error) {
    window.$message?.error(t('dataSource.trigger.toggleError'))
  } finally {
    component.operationLoading = false
  }
}

/**
 * Start all data sources
 */
const startAllDataSources = async () => {
  bulkOperationLoading.value = true
  try {
    const componentIds = componentsWithDataSources.value
      .filter(c => c.status !== DataSourceStatus.RUNNING)
      .map(c => c.id)

    await editorDataSourceManager.batchStartComponents(componentIds)
    window.$message?.success(t('dataSource.trigger.startAllSuccess'))

    await refreshComponentStatus()
  } catch (error) {
    window.$message?.error(t('dataSource.trigger.startAllError'))
  } finally {
    bulkOperationLoading.value = false
  }
}

/**
 * Stop all data sources
 */
const stopAllDataSources = async () => {
  bulkOperationLoading.value = true
  try {
    const componentIds = componentsWithDataSources.value
      .filter(c => c.status === DataSourceStatus.RUNNING)
      .map(c => c.id)

    await editorDataSourceManager.batchStopComponents(componentIds)
    window.$message?.success(t('dataSource.trigger.stopAllSuccess'))

    await refreshComponentStatus()
  } catch (error) {
    window.$message?.error(t('dataSource.trigger.stopAllError'))
  } finally {
    bulkOperationLoading.value = false
  }
}

/**
 * Refresh component status
 */
const refreshComponentStatus = async () => {
  refreshLoading.value = true
  try {
    // Get the latest component configuration and status
    const allConfigs = editorDataSourceManager.getAllComponentConfigs()
    const stats = editorDataSourceManager.getStatistics()

    // Update component list，and add additionalUIstate
    componentsWithDataSources.value = Array.from(allConfigs.values()).map(config => ({
      ...config,
      showDetails: false,
      manualTriggerLoading: false,
      operationLoading: false
    }))

    lastUpdateTime.value = Date.now()
  } catch (error) {
    window.$message?.error(t('dataSource.trigger.refreshError'))
  } finally {
    refreshLoading.value = false
  }
}

/**
 * Get component operation menu
 */
const getComponentActions = (component: ComponentDataSourceConfig) => {
  return [
    {
      label: component.showDetails ? t('common.hideDetails') : t('common.showDetails'),
      key: 'toggleDetails',
      props: {
        onClick: () => {
          component.showDetails = !component.showDetails
        }
      }
    },
    {
      label: t('dataSource.trigger.viewLogs'),
      key: 'viewLogs',
      props: {
        onClick: () => {
          // TODO: Implement log viewing function
          window.$message?.info(t('dataSource.trigger.logsNotImplemented'))
        }
      }
    },
    {
      label: t('dataSource.trigger.resetConfig'),
      key: 'resetConfig',
      props: {
        onClick: () => {
          // TODO: Implement configuration reset function
          window.$message?.info(t('dataSource.trigger.resetNotImplemented'))
        }
      }
    }
  ]
}

/**
 * Handle component operations
 */
const handleComponentAction = (key: string, option: any) => {
  // The operation is already in the menu item onClick medium processing
}

/**
 * Set scheduled refresh
 */
const setupRefreshTimer = () => {
  // Every5Refresh status once every second
  refreshTimer = setInterval(() => {
    refreshComponentStatus()
  }, 5000)
}

// life cycle hooks
onMounted(async () => {
  await refreshComponentStatus()
  setupRefreshTimer()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped>
.data-source-trigger-panel {
  width: 100%;
  height: 100%;
}

.trigger-control-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.components-list {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
  max-height: 500px;
}

.component-trigger-item {
  width: 100%;
}

.component-card {
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
}

.component-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.component-card.active-component {
  border-color: var(--success-color);
  background-color: rgba(82, 196, 26, 0.02);
}

.component-card.error-component {
  border-color: var(--error-color);
  background-color: rgba(255, 77, 79, 0.02);
}

.component-info {
  line-height: 1.2;
}

.component-details {
  background-color: var(--body-color);
  border-radius: var(--border-radius);
  padding: 8px;
}

.data-source-info {
  line-height: 1.4;
}

.error-info,
.data-preview {
  margin-top: 8px;
}

/* Responsive adaptation */
@media (max-width: 768px) {
  .component-card .n-space {
    flex-direction: column;
    align-items: flex-start !important;
  }

  .component-card .n-space > .n-space {
    width: 100%;
    justify-content: space-between;
  }
}

/* Theme adaptation */
[data-theme='dark'] .component-card.active-component {
  background-color: rgba(82, 196, 26, 0.05);
}

[data-theme='dark'] .component-card.error-component {
  background-color: rgba(255, 77, 79, 0.05);
}

[data-theme='dark'] .component-details {
  background-color: rgba(255, 255, 255, 0.02);
}
</style>
