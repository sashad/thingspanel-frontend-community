<template>
  <div class="configuration-panel">
    <!-- Display the configuration interface when selecting a component -->
    <div v-if="selectedWidget" class="config-container">
      <div class="widget-header">
        <h3 class="widget-title">{{ selectedWidget.type }}</h3>
        <span class="widget-id">{{ selectedWidget.id }}</span>
      </div>

      <!-- Configure tab page -->
      <n-tabs v-model:value="activeTab" type="line" class="config-tabs">
        <n-tab-pane
          v-for="layer in visibleConfigLayers"
          :key="layer.name"
          :name="layer.name"
          :tab="$t(layer.label)"
        >
          <div class="config-scrollbar">
            <component
              :is="layer.component"
              :node-id="selectedWidget.id"
              :widget="selectedWidget"
              :readonly="readonly"
              :component-id="selectedWidget.id"
              :component-type="selectedWidget.type"
              class="config-form"
            />
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- Prompt when component is not selected -->
    <div v-else class="no-selection">
      <n-empty description="Please select a component to configure" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 🔥 ConfigurationPanel - Unified configuration architecture version
 * Based on the new unified configuration architecture，As a configuration display and editing interface
 */

import { ref, computed, watch } from 'vue'
import { NTabs, NTabPane, NEmpty, NScrollbar } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { getVisibleConfigLayers } from '@/components/visual-editor/configuration/component-registry'
import type { VisualEditorWidget } from '@/components/visual-editor/types'

interface Props {
  selectedWidget: VisualEditorWidget | null
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedWidget: null,
  readonly: false
})

// Combined functions
const { t } = useI18n()

// Currently active tabs
const activeTab = ref('base')

// Get the visible configuration layer based on the selected component
const visibleConfigLayers = computed(() => {
  if (!props.selectedWidget) return []

  // Get the configuration layer supported by this component type
  return getVisibleConfigLayers(props.selectedWidget.id, props.selectedWidget)
})


// Monitor component selection changes，Reset to base tab
watch(() => props.selectedWidget, async (newWidget) => {
  if (newWidget) {
    // Make sure the default selected tab exists
    const firstAvailableTab = visibleConfigLayers.value[0]?.name || 'base'
    activeTab.value = firstAvailableTab

    // 🔥 Try refreshing the component definition（if missingconfigComponent）
    if (!newWidget.metadata?.card2Definition?.configComponent) {
      try {
        const { refreshComponentDefinitions } = await import('./component-registry')
        await refreshComponentDefinitions(newWidget)
      } catch (error) {
        console.warn('⚠️ [ConfigurationPanel] Component definition refresh failed:', error)
      }
    }
  }
})
</script>

<style scoped>
.configuration-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.config-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.widget-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--card-color);
}

.widget-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.widget-id {
  font-size: 12px;
  color: var(--text-color-3);
  font-family: monospace;
}

.config-tabs {
  overflow: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.n-tabs-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.n-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.config-scrollbar {
  flex: 1;

}

.config-form {
  /* content container，No special styling required */
}

.no-selection {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-3);
}
</style>
