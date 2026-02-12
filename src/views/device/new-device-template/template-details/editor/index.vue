<script setup lang="ts">
/**
 * Template editor page
 * 5step process：Template information → Model definition → Webchart → Appchart → Finish
 */

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NSteps, NStep, NButton } from 'naive-ui'
import { $t } from '@/locales'
import SvgIcon from '@/components/custom/svg-icon.vue'
import StepTemplateInfo from './step-template-info.vue'
import StepModelDefinition from './step-model-definition.vue'
import StepWebChart from './step-web-chart.vue'
import StepAppChart from './step-app-chart.vue'
import StepPublish from './step-publish.vue'

const route = useRoute()
const router = useRouter()

// current step (1-5)
const stepCurrent = ref<number>(1)

// Get template from routeID（edit mode）
const templateId = computed(() => {
  const id = route.query.id
  return typeof id === 'string' ? id : ''
})

// Edit type
const editorType = computed<'add' | 'edit'>(() => {
  return templateId.value ? 'edit' : 'add'
})

// Device templateID（step1Get after saving）
const deviceTemplateId = ref<string>(templateId.value)

// Step component mapping（According to new/Edit mode dynamically generated）
const componentsList = computed(() => {
  if (editorType.value === 'add') {
    // New mode：only3step（Template information → Model definition → Finish）
    return [
      { id: 1, components: StepTemplateInfo },
      { id: 2, components: StepModelDefinition },
      { id: 3, components: StepPublish }
    ]
  } else {
    // edit mode：whole5step
    return [
      { id: 1, components: StepTemplateInfo },
      { id: 2, components: StepModelDefinition },
      { id: 3, components: StepWebChart },
      { id: 4, components: StepAppChart },
      { id: 5, components: StepPublish }
    ]
  }
})

const CurrentStepComponent = computed(() => {
  return componentsList.value.find(item => item.id === stepCurrent.value)?.components
})

const title = computed(() => {
  const titles: Record<'add' | 'edit', string> = {
    add: $t('device_template.addThingModel'),
    edit: $t('device_template.editThingModel')
  }
  return titles[editorType.value]
})

// Return to list
const handleBack = () => {
  router.push({ name: 'device_new-device-template_template-list' })
}

// Modal box visibility control（Cancel button for step component）
const modalVisible = computed({
  get() {
    return true
  },
  set(value) {
    if (!value) {
      handleBack()
    }
  }
})

onMounted(() => {
  // If it is in edit mode during initialization，set updeviceTemplateId
  if (templateId.value) {
    deviceTemplateId.value = templateId.value
  }
})
</script>

<template>
  <div class="template-editor-page">
    <NCard :bordered="false">
      <template #header>
        <div class="page-header">
          <div class="header-left">
            <NButton text @click="handleBack">
              <template #icon>
                <SvgIcon local-icon="arrow-left" />
              </template>
            </NButton>
            <span class="page-title">{{ title }}</span>
          </div>
        </div>
      </template>

      <!-- step indicator -->
      <NSteps :current="stepCurrent" status="process" class="steps-container">
        <!-- New mode：3step -->
        <template v-if="editorType === 'add'">
          <NStep :title="$t('device_template.templateInfo')" :description="$t('device_template.addDeviceInfo')" />
          <NStep
            :title="$t('device_template.modelDefinition')"
            :description="$t('device_template.deviceParameterDescribe')"
          />
          <NStep :title="$t('device_template.release')" :description="$t('device_template.releaseAppStore')" />
        </template>

        <!-- edit mode：5step -->
        <template v-else>
          <NStep :title="$t('device_template.templateInfo')" :description="$t('device_template.addDeviceInfo')" />
          <NStep
            :title="$t('device_template.modelDefinition')"
            :description="$t('device_template.deviceParameterDescribe')"
          />
          <NStep
            :title="$t('device_template.webChartConfiguration')"
            :description="$t('device_template.bindTheCorrespondingChart')"
          />
          <NStep
            :title="$t('device_template.appChartConfiguration')"
            :description="$t('device_template.editAppDetailsPage')"
          />
          <NStep :title="$t('device_template.release')" :description="$t('device_template.releaseAppStore')" />
        </template>
      </NSteps>

      <!-- Step content -->
      <div class="step-content">
        <component
          :is="CurrentStepComponent"
          v-model:stepCurrent="stepCurrent"
          v-model:modalVisible="modalVisible"
          v-model:deviceTemplateId="deviceTemplateId"
        />
      </div>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.template-editor-page {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.steps-container {
  margin: 24px 0;
}

.step-content {
  margin-top: 32px;
}
</style>
