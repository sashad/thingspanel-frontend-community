<script setup lang="ts">
/**
 * Template viewer main component
 * top：Template basic information
 * bottom：Tabswitch（telemetry、property、event、Order、Webchart、Appchart）
 */

import { ref, onMounted, provide, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NSpin, NTabs, NTabPane, NDivider, NModal, NCard } from 'naive-ui'
import { $t } from '@/locales'
import { getTemplat } from '@/service/api/system-data'
import TemplateOverviewSection from './template-overview-section.vue'
import TemplateEditForm from './template-edit-form.vue'
import TelemetryTabContent from './tab-telemetry.vue'
import AttributesTabContent from './tab-attributes.vue'
import EventsTabContent from './tab-events.vue'
import CommandsTabContent from './tab-commands.vue'
import WebChartTab from './tab-web-chart.vue'
import AppChartTab from './tab-app-chart.vue'

const router = useRouter()
const route = useRoute()

// Get template from route parametersID
const templateId = computed(() => {
  const id = route.query.id
  return typeof id === 'string' ? id : ''
})

// currently activetab
const activeTab = ref('telemetry')

// Loading status
const loading = ref(false)

// Edit pop-up window
const showEditModal = ref(false)

// template data
const templateData = ref<any>(null)

// wholeJSONdata（for copying）
const fullTemplateJson = ref<string>('')

// Provide access to child components
provide('templateData', templateData)
provide('fullTemplateJson', fullTemplateJson)

/**
 * Load template data
 */
const loadTemplateData = async () => {
  if (!templateId.value) {
    window.$message?.warning('templateIDcannot be empty')
    return
  }

  loading.value = true
  try {
    const res = await getTemplat(templateId.value)
    if (!res.error && res.data) {
      templateData.value = res.data

      // Generate completeJSON（and editor section5Step by step processing）
      const jsonData = { ...res.data }
      try {
        jsonData.app_chart_config = JSON.parse(jsonData.app_chart_config)
      } catch (e) {
        // stay as is
      }
      try {
        jsonData.web_chart_config = JSON.parse(jsonData.web_chart_config)
      } catch (e) {
        // stay as is
      }
      fullTemplateJson.value = JSON.stringify(jsonData, null, 2)
    } else {
      window.$message?.error($t('common.fetchDataFailed'))
    }
  } catch (error) {
    console.error('Failed to load template data:', error)
    window.$message?.error($t('common.fetchDataFailed'))
  } finally {
    loading.value = false
  }
}

/**
 * Open the edit popup window
 */
const handleEdit = () => {
  showEditModal.value = true
}

/**
 * Edit success callback
 */
const handleEditSuccess = () => {
  showEditModal.value = false
  loadTemplateData() // Reload data
}

onMounted(() => {
  loadTemplateData()
})
</script>

<template>
  <div class="template-viewer">
    <!-- content area -->
    <NCard>
      <NSpin :show="loading">
        <!-- top：Template basic information -->
        <TemplateOverviewSection @edit="handleEdit" />

        <!-- divider -->
        <n-divider />

        <!-- bottom：Tab switch -->
        <NTabs v-model:value="activeTab" type="line" animated>
          <!-- telemetry -->
          <NTabPane name="telemetry" :tab="$t('device_template.telemetry')">
            <TelemetryTabContent />
          </NTabPane>

          <!-- property -->
          <NTabPane name="attributes" :tab="$t('device_template.attributes')">
            <AttributesTabContent />
          </NTabPane>

          <!-- event -->
          <NTabPane name="events" :tab="$t('device_template.events')">
            <EventsTabContent />
          </NTabPane>

          <!-- Order -->
          <NTabPane name="commands" :tab="$t('device_template.commands')">
            <CommandsTabContent />
          </NTabPane>

          <!-- Webchart -->
          <NTabPane name="web-chart" :tab="$t('device_template.webChartConfiguration')">
            <WebChartTab />
          </NTabPane>

          <!-- Appchart -->
          <NTabPane name="app-chart" :tab="$t('device_template.appChartConfiguration')">
            <AppChartTab />
          </NTabPane>
        </NTabs>
      </NSpin>
    </NCard>

    <!-- Edit pop-up window -->
    <NModal v-model:show="showEditModal" :title="$t('device_template.editTemplateInfo')" preset="card" class="edit-modal">
      <TemplateEditForm :template-id="templateId" @success="handleEditSuccess" @cancel="showEditModal = false" />
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.template-viewer {
  height: 100%;
}

.edit-modal {
  width: 600px;
  max-width: 90vw;
}
</style>
