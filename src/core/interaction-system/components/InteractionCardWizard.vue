<template>
  <div class="interaction-simple">
    <!-- concise list + Add button -->
    <div class="interaction-header">
      <h4 class="section-title">{{ t('interaction.wizard.title') }}</h4>
      <n-button size="small" type="primary" @click="showAddModal = true">
        <template #icon>
          <n-icon><FlashOutline /></n-icon>
        </template>
        {{ t('interaction.wizard.addInteraction') }}
      </n-button>
    </div>

    <!-- interactive list -->
    <div class="interactions-list">
      <div v-if="interactions.length === 0" class="empty-state">
        <div class="empty-icon">🎯</div>
        <div class="empty-text">{{ t('interaction.wizard.noInteractions') }}</div>
        <div class="empty-desc">{{ t('interaction.wizard.noInteractionsDesc') }}</div>
      </div>

      <div v-else>
        <div v-for="(interaction, index) in interactions" :key="index" class="interaction-item">
          <div class="interaction-summary">
            <div class="summary-badge" :class="getEventType(interaction.event)">
              {{ getEventLabel(interaction.event) }}
            </div>
            <div class="summary-text">
              <div class="summary-title">{{ getSummaryTitle(interaction) }}</div>
              <div class="summary-desc">{{ getSummaryDesc(interaction) }}</div>
            </div>
            <div class="summary-actions">
              <n-switch v-model:value="interaction.enabled" size="small" />
              <n-button size="tiny" quaternary @click="editInteraction(index)">{{ t('interaction.edit') }}</n-button>
              <n-button size="tiny" quaternary @click="deleteInteraction(index)">
                <template #icon>
                  <n-icon><TrashOutline /></n-icon>
                </template>
              </n-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add to/Edit pop-up window -->
    <n-modal
      v-model:show="showAddModal"
      :title="editingIndex >= 0 ? t('interaction.wizard.editInteraction') : t('interaction.wizard.addInteraction')"
    >
      <n-card style="width: 600px" :bordered="false">
        <n-form :model="currentInteraction" label-placement="left" label-width="auto">
          <!-- Trigger condition -->
          <n-form-item :label="t('interaction.events.title')">
            <n-select
              v-model:value="currentInteraction.event"
              :options="eventOptions"
              :placeholder="t('interaction.placeholders.selectTriggerCondition')"
            />
          </n-form-item>

          <!-- action type -->
          <n-form-item :label="t('interaction.actions.title')">
            <n-select
              v-model:value="currentActionType"
              :options="actionTypeOptions"
              :placeholder="t('interaction.placeholders.selectAction')"
              @update:value="handleActionTypeChange"
            />
          </n-form-item>

          <!-- URLJump configuration -->
          <template v-if="currentActionType === 'jump'">
            <n-form-item :label="t('interaction.properties.linkType')">
              <n-radio-group v-model:value="urlType" @update:value="handleUrlTypeChange">
                <n-space>
                  <n-radio value="external">{{ t('interaction.linkTypes.external') }}</n-radio>
                  <n-radio value="internal">{{ t('interaction.linkTypes.internal') }}</n-radio>
                </n-space>
              </n-radio-group>
            </n-form-item>

            <n-form-item v-if="urlType === 'external'" :label="t('interaction.properties.jumpAddress')">
              <n-input v-model:value="currentInteraction.url" :placeholder="t('interaction.placeholders.enterUrl')" />
            </n-form-item>

            <n-form-item v-if="urlType === 'internal'" :label="t('interaction.properties.selectMenu')">
              <n-select
                v-model:value="selectedMenuPath"
                :options="menuOptions"
                :placeholder="t('interaction.placeholders.selectMenuToJump')"
                :loading="menuLoading"
                filterable
                @update:value="handleMenuPathChange"
              />
            </n-form-item>

            <n-form-item :label="t('interaction.properties.openMethod')">
              <n-radio-group v-model:value="currentInteraction.target">
                <n-radio value="_self">{{ t('interaction.openMethods.currentWindow') }}</n-radio>
                <n-radio value="_blank">{{ t('interaction.openMethods.newWindow') }}</n-radio>
              </n-radio-group>
            </n-form-item>
          </template>

          <!-- 🔥 Attribute selection and condition configuration when data changes -->
          <template v-if="currentInteraction.event === 'dataChange'">
            <n-form-item :label="t('interaction.properties.watchedProperty')">
              <n-select
                v-model:value="currentWatchedProperty"
                :options="availablePropertyOptions"
                :placeholder="t('interaction.placeholders.selectWatchedProperty')"
                @update:value="handleWatchedPropertyChange"
              />
            </n-form-item>

            <n-form-item :label="t('interaction.properties.executionCondition')">
              <n-space>
                <n-select
                  v-model:value="currentConditionType"
                  :options="conditionTypeOptions"
                  :placeholder="t('interaction.placeholders.conditionType')"
                  style="width: 120px"
                  @update:value="handleConditionTypeChange"
                />
                <template v-if="currentConditionType === 'comparison'">
                  <n-select
                    v-model:value="currentConditionOperator"
                    :options="comparisonOperatorOptions"
                    :placeholder="t('interaction.placeholders.comparison')"
                    style="width: 100px"
                  />
                  <n-input
                    v-model:value="currentConditionValue"
                    :placeholder="t('interaction.placeholders.value')"
                    style="width: 120px"
                  />
                </template>
                <template v-else-if="currentConditionType === 'range'">
                  <n-input
                    v-model:value="currentConditionValue"
                    :placeholder="t('interaction.placeholders.rangeValue')"
                    style="width: 120px"
                  />
                </template>
                <template v-else-if="currentConditionType === 'expression'">
                  <n-input
                    v-model:value="currentConditionValue"
                    :placeholder="t('interaction.placeholders.expressionValue')"
                    style="width: 200px"
                  />
                </template>
              </n-space>
            </n-form-item>
          </template>

          <!-- Property modification configuration -->
          <template v-if="currentActionType === 'modify'">
            <!-- 🔥 Replaced with the new secondary linkage component attribute selector -->
            <n-form-item :label="t('interaction.properties.modifyProperty')">
              <ComponentPropertySelector
                v-model:value="currentTargetPropertyBinding"
                :placeholder="t('interaction.placeholders.selectPropertyToModify')"
                :current-component-id="props.componentId"
                @change="handleTargetPropertyChange"
              />
            </n-form-item>
            <n-form-item :label="t('interaction.properties.newValue')">
              <n-input
                v-model:value="currentInteraction.updateValue"
                :placeholder="t('interaction.placeholders.enterNewPropertyValue')"
              />
            </n-form-item>
          </template>
        </n-form>

        <template #footer>
          <n-space justify="end">
            <n-button @click="showAddModal = false">{{ t('interaction.cancel') }}</n-button>
            <n-button type="primary" @click="saveInteraction">{{ t('interaction.confirm') }}</n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * Interactive configuration components - Simple pop-up version
 * Features：list + Pop-up window，Simple and direct
 */

import { ref, computed, inject, watch } from 'vue'
import { useI18n } from 'vue-i18n'
// 🔒 Import property exposure manager for secure property access
import { propertyExposureManager, type PropertyAccessContext } from '@/card2.1/core2/property'
import {
  NSpace,
  NButton,
  NIcon,
  NInput,
  NSelect,
  NSwitch,
  NRadioGroup,
  NRadio,
  NModal,
  NCard,
  NForm,
  NFormItem,
  useMessage
} from 'naive-ui'
import { FlashOutline, TrashOutline } from '@vicons/ionicons5'
import { fetchGetUserRoutes } from '@/service/api/route'
// 🔥 simplify：Remove complex property exposure system，Use simple property access
import { useEditorStore } from '@/store/modules/editor'
// 🔥 New：interactive execution engine
import { createInteractionEngine } from '../interaction-engine'
// 🔥 New：Import the secondary linkage component attribute selector
import ComponentPropertySelector from '@/core/data-architecture/components/common/ComponentPropertySelector.vue'
// 🔥 New：Import configuration manager，Used to listen for attribute selectors
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'

interface Props {
  modelValue?: any[]
  componentId?: string
  componentType?: string
}

interface Emits {
  (e: 'update:modelValue', value: any[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 🔥 Use directly useEditorStore Get the current canvas component（Fix empty array issue）
const editorStore = useEditorStore()

// Stay backwards compatible
const visualEditorState = {
  getAvailableComponents: () => {
    return editorStore.nodes || []
  }
}

// state
const interactions = ref(props.modelValue || [])
const showAddModal = ref(false)
const editingIndex = ref(-1)

// 🔥 critical fix：Listen for external incomingmodelValuechange，Ensure data synchronization within components
watch(
  () => props.modelValue,
  (newValue) => {
    
    if (newValue) {
      interactions.value = [...newValue] // 🔥 Use expand syntax to ensure responsive updates
    }
  },
  { immediate: true, deep: true }
)
const currentInteraction = ref({
  event: 'click',
  enabled: true,
  priority: 1,
  url: '',
  target: '_blank',
  targetComponentId: '',
  targetProperty: '',
  updateValue: ''
})
const currentActionType = ref('')

// 🔥 Restore internal menu selection functionality
const urlType = ref<'external' | 'internal'>('external')
const selectedMenuPath = ref('')
const menuOptions = ref<{ label: string; value: string }[]>([])
const menuLoading = ref(false)
const message = useMessage()
const { t } = useI18n()

// 🔥 Restore data change configuration status
const currentWatchedProperty = ref('')
const currentConditionType = ref('')
const currentConditionOperator = ref('')
const currentConditionValue = ref('')

// 🔥 New：Target attribute binding status（Replace the original detached selection）
const currentTargetPropertyBinding = ref('')
const currentTargetPropertyInfo = ref<any>(null)

// ✅ correct3event options
const eventOptions = computed(() => [
  { label: t('interaction.events.click'), value: 'click' },
  { label: t('interaction.events.hover'), value: 'hover' },
  { label: t('interaction.events.dataChange'), value: 'dataChange' }
])

// 🔥 Attribute selection and condition configuration when restoring data changes
// Condition type options
const conditionTypeOptions = computed(() => [
  { label: t('interaction.conditions.comparison'), value: 'comparison' },
  { label: t('interaction.conditions.range'), value: 'range' },
  { label: t('interaction.conditions.expression'), value: 'expression' }
])

// Comparison operator options
const comparisonOperatorOptions = computed(() => [
  { label: t('interaction.operators.equals'), value: 'equals' },
  { label: t('interaction.operators.notEquals'), value: 'notEquals' },
  { label: t('interaction.operators.greaterThan'), value: 'greaterThan' },
  { label: t('interaction.operators.greaterThanOrEqual'), value: 'greaterThanOrEqual' },
  { label: t('interaction.operators.lessThan'), value: 'lessThan' },
  { label: t('interaction.operators.lessThanOrEqual'), value: 'lessThanOrEqual' },
  { label: t('interaction.operators.contains'), value: 'contains' },
  { label: t('interaction.operators.startsWith'), value: 'startsWith' },
  { label: t('interaction.operators.endsWith'), value: 'endsWith' }
])

// ✅ correct2action options
const actionTypeOptions = computed(() => [
  { label: t('interaction.summary.pageJump'), value: 'jump' },
  { label: t('interaction.summary.modifyProperty'), value: 'modify' }
])

// ✅ Dynamically obtain components on the current canvas（for target component selection）
const componentOptions = computed(() => {
  try {
    const components = visualEditorState.getAvailableComponents() || []

    const options = components.map(comp => {
      // 🔥 Use components directlyID，Identify the current component in the display
      const isCurrentComponent = comp.id === props.componentId
      const displayName = isCurrentComponent
        ? `📍 ${comp.type || 'unknown'} (${comp.id.slice(0, 8)}...) - current component`
        : `🔧 ${comp.type || 'unknown'} (${comp.id.slice(0, 8)}...)`

      return {
        label: displayName,
        value: comp.id,  // 🔥 Use actual components directlyID，Remove "self" concept
        componentType: comp.type,
        isCurrentComponent
      }
    })


    return options
  } catch (error) {
    console.error(`🔥 [InteractionCardWizard] componentOptions Build failed:`, error)
    // Return at least the current component on failure
    return [{
      label: `📍 ${props.componentType || 'unknown'} (current component)`,
      value: props.componentId || 'unknown',
      componentType: props.componentType || 'unknown',
      isCurrentComponent: true
    }]
  }
})

// 🔒 Safe target attribute options（userefSupport asynchronous updates）
const targetPropertyOptions = ref<any[]>([])

// 🔒 Function to update target attribute options asynchronously
const updateTargetPropertyOptions = async () => {
  if (!currentInteraction.value.targetComponentId) {
    targetPropertyOptions.value = []
    return
  }

  // 🔥 Remove "self" concept，directly based on the componentIDFind
  const components = visualEditorState.getAvailableComponents()
  const targetComponent = components.find(comp => comp.id === currentInteraction.value.targetComponentId)

  if (!targetComponent) {
    targetPropertyOptions.value = []
    return
  }

  // Convert to selector options format，Organized by groups
  const groupedOptions: any[] = []
  const groups: Record<string, any[]> = {}

  // 🔒 first step：Safely get whitelist attributes（Replace unsafeexposedPropertiesaccess）
  await getWhitelistedProperties(targetComponent, groups)

  // 🔥 Step 2：Get modifiable property declaration from component definition
  if (targetComponent.metadata?.card2Definition?.interactionCapabilities?.watchableProperties) {
    const watchableProps = targetComponent.metadata.card2Definition.interactionCapabilities.watchableProperties
    const definitionGroup = 'Component properties (definition)'

    if (!groups[definitionGroup]) {
      groups[definitionGroup] = []
    }

    Object.entries(watchableProps).forEach(([propName, propInfo]: [string, any]) => {
      groups[definitionGroup].push({
        label: `${propInfo.label || propName} (${propInfo.description || propInfo.type})`,
        value: propName,
        property: {
          name: propName,
          label: propInfo.label || propName,
          type: propInfo.type,
          description: propInfo.description,
          defaultValue: propInfo.defaultValue,
          isComponentProperty: true
        }
      })
    })
  }

  // 🔥 Step 3：Add base configuration level properties（only exposed deviceId and metricsList）
  const baseGroup = 'Basic configuration'
  if (!groups[baseGroup]) {
    groups[baseGroup] = []
  }

  groups[baseGroup].push(
    {
      label: 'equipmentID (关联的equipmentID，For data source automatic configuration)',
      value: 'base.deviceId',
      property: {
        name: 'deviceId',
        label: 'equipmentID',
        type: 'string',
        description: 'Associated devicesID，Used for data source auto-configuration and device templates',
        isCore: true,
        group: 'Device configuration'
      }
    },
    {
      label: 'Indicator list (选择的设备Indicator list)',
      value: 'base.metricsList',
      property: {
        name: 'metricsList',
        label: 'Indicator list',
        type: 'array',
        description: 'List of selected device metrics，For data acquisition and display',
        isCore: true,
        group: 'Device configuration'
      }
    }
  )

  // 🔥 Step 4：if not defined，Provide common propertiesfallback
  if (Object.keys(groups).length === 1 && groups[baseGroup]) {
    const fallbackGroup = 'Common properties (fallback)'
    if (!groups[fallbackGroup]) {
      groups[fallbackGroup] = []
    }

    const universalProperties = [
      { name: 'title', label: 'title', type: 'string', description: 'Component title' },
      { name: 'visible', label: 'visibility', type: 'boolean', description: 'Is the component visible?' },
      { name: 'opacity', label: 'transparency', type: 'number', description: '组件transparency' },
      { name: 'backgroundColor', label: 'background color', type: 'string', description: 'Component background color' }
    ]

    universalProperties.forEach(prop => {
      groups[fallbackGroup].push({
        label: `${prop.label} (${prop.description})`,
        value: prop.name,
        property: {
          name: prop.name,
          label: prop.label,
          type: prop.type,
          description: prop.description,
          isFallback: true
        }
      })
    })
  }

  // 🔒 Convert to group options format，Make sure the basic configuration comes first
  const safeGroupOrder = ['🔒 Whitelist attributes (Safety)', 'Component properties (definition)', 'Basic configuration', 'Common properties (fallback)']
  safeGroupOrder.forEach(groupName => {
    if (groups[groupName] && groups[groupName].length > 0) {
      groupedOptions.push({
        type: 'group',
        label: groupName,
        key: groupName,
        children: groups[groupName]
      })
    }
  })

  const options = groupedOptions.length > 0 ? groupedOptions : []

  targetPropertyOptions.value = options
}

// 🔒 Listen to the target componentIDchange，Automatically update properties options
watch(
  () => currentInteraction.value.targetComponentId,
  () => {
    updateTargetPropertyOptions()
  },
  { immediate: true }
)

// 🔥 Available property options - Based directly on the current componentIDGet configuration properties（andComponentPropertySelectorlogically consistent）
const availablePropertyOptions = computed(() => {

  if (!props.componentId) {
    console.error(`🚨 [InteractionCardWizard] Listening attribute selector：LackcomponentId!`, {
      props: props,
      componentId: props.componentId,
      componentType: props.componentType
    })
    return []
  }


  // 🔥 Get the current component configuration directly from the configuration manager
  const config = configurationIntegrationBridge.getConfiguration(props.componentId)

  if (!config) {
    console.error(`🚨 [InteractionCardWizard] Unable to get component ${props.componentId} configuration，Generate standard properties!`)
    // 🔥 Even without configuration，Also generate standard properties
  } else {
  }

  const options: any[] = []

  // 🔥 Base layer standard attribute definition - andComponentPropertySelectorBe consistent
  const standardBaseProperties = [
    // show configuration
    { path: 'showTitle', displayPath: 'show title', type: 'boolean' },
    { path: 'title', displayPath: 'title', type: 'string' },
    { path: 'visible', displayPath: 'visibility', type: 'boolean' },
    { path: 'opacity', displayPath: 'transparency', type: 'number' },

    // Style configuration
    { path: 'backgroundColor', displayPath: 'background color', type: 'string' },
    { path: 'borderWidth', displayPath: 'border width', type: 'number' },
    { path: 'borderColor', displayPath: 'border color', type: 'string' },
    { path: 'borderStyle', displayPath: 'border style', type: 'string' },
    { path: 'borderRadius', displayPath: 'Fillet size', type: 'number' },
    { path: 'boxShadow', displayPath: 'shadow effect', type: 'string' },

    // layout configuration
    { path: 'padding', displayPath: 'padding', type: 'object' },
    { path: 'margin', displayPath: 'margins', type: 'object' },

    // Device association configuration (core required)
    { path: 'deviceId', displayPath: 'equipmentID', type: 'string' },
    { path: 'metricsList', displayPath: 'Indicator list', type: 'array' }
  ]


  // Add all standard base properties
  standardBaseProperties.forEach(prop => {
    const currentValue = config?.base?.[prop.path] // 🔥 Use optional chaining，even thoughconfigNo error will be reported if it is empty
    const option = {
      label: `[Base] ${prop.displayPath} (${prop.type})`,
      value: `base.${prop.path}`, // 🔥 repair：Listening properties use simple paths，No components requiredID
      property: {
        name: prop.path,
        label: prop.displayPath,
        type: prop.type,
        currentValue: currentValue
      }
    }
    options.push(option)
  })

  // ComponentLayer standard properties
  const standardComponentProperties = [
    { path: 'properties', displayPath: 'Component properties', type: 'object' },
    { path: 'styles', displayPath: 'Component style', type: 'object' },
    { path: 'behavior', displayPath: 'Component behavior', type: 'object' }
  ]


  standardComponentProperties.forEach(prop => {
    const currentValue = config?.component?.[prop.path] // 🔥 Use optional chaining，even thoughconfigNo error will be reported if it is empty
    const option = {
      label: `[components] ${prop.displayPath} (${prop.type})`,
      value: `component.${prop.path}`, // 🔥 repair：Listening properties use simple paths，No components requiredID
      property: {
        name: prop.path,
        label: prop.displayPath,
        type: prop.type,
        currentValue: currentValue
      }
    }
    options.push(option)
  })


  return options
})

// ✅ Correct event type styling (3kind)
const getEventType = (event: string) => {
  const typeMap = {
    click: 'click',
    hover: 'hover',
    dataChange: 'condition'
  }
  return typeMap[event] || 'default'
}

// ✅ Correct event label (3kind)
const getEventLabel = (event: string) => {
  const labelMap = {
    click: t('interaction.events.click'),
    hover: t('interaction.events.hover'),
    dataChange: t('interaction.events.dataChange')
  }
  return labelMap[event] || event
}

// Get summary title
const getSummaryTitle = (interaction: any) => {
  const actionType = getActionType(interaction)
  if (actionType === 'jump') {
    return t('interaction.summary.pageJump')
  } else if (actionType === 'modify') {
    return t('interaction.summary.modifyProperty')
  }
  return t('interaction.summary.customAction')
}

// Get summary description
const getSummaryDesc = (interaction: any) => {
  const event = getEventLabel(interaction.event)
  const actionType = getActionType(interaction)

  // 🔥 Data change events need to display listening attributes and conditions
  if (interaction.event === 'dataChange') {
    const watchedProperty = interaction.watchedProperty || t('interaction.empty.notSpecified')
    let conditionDesc = t('interaction.empty.noCondition')

    if (interaction.condition) {
      const conditionType = interaction.condition.type
      const value = interaction.condition.value

      if (conditionType === 'comparison') {
        const operator = interaction.condition.operator
        const operatorMap = {
          equals: t('interaction.operators.equals'),
          notEquals: t('interaction.operators.notEquals'),
          greaterThan: t('interaction.operators.greaterThan'),
          greaterThanOrEqual: t('interaction.operators.greaterThanOrEqual'),
          lessThan: t('interaction.operators.lessThan'),
          lessThanOrEqual: t('interaction.operators.lessThanOrEqual'),
          contains: t('interaction.operators.contains'),
          startsWith: t('interaction.operators.startsWith'),
          endsWith: t('interaction.operators.endsWith')
        }
        conditionDesc = `${operatorMap[operator] || operator} ${value}`
      } else if (conditionType === 'range') {
        conditionDesc = `${t('interaction.summary.range')} ${value}`
      } else if (conditionType === 'expression') {
        conditionDesc = `${t('interaction.summary.expression')} ${value}`
      }
    }

    let baseDesc = `${t('interaction.summary.listening')} ${watchedProperty} (${conditionDesc})`

    // Add action description
    if (actionType === 'jump') {
      const url = interaction.responses?.[0]?.value || ''
      if (url.startsWith('http') || url.startsWith('https')) {
        baseDesc += ` → ${t('interaction.summary.jumpToExternal')}`
      } else if (url.startsWith('/')) {
        baseDesc += ` → ${t('interaction.summary.jumpToInternal')}`
      } else {
        baseDesc += ` → ${t('interaction.summary.jumpTo')} ${url}`
      }
    } else if (actionType === 'modify') {
      const target = interaction.responses?.[0]?.targetComponentId || t('interaction.empty.component')
      const property = interaction.responses?.[0]?.targetProperty || t('interaction.empty.property')
      baseDesc += ` → ${t('interaction.summary.modify')}${target}of${property}`
    }

    return baseDesc
  }

  if (actionType === 'jump') {
    const url = interaction.responses?.[0]?.value || ''
    // 🔥 Differentiate between internal menus and external links
    if (url.startsWith('http') || url.startsWith('https')) {
      return `${event}${t('interaction.summary.whenClick')}: ${url}`
    } else if (url.startsWith('/')) {
      return `${event}${t('interaction.summary.whenHover')}: ${url}`
    }
    return `${event}${t('interaction.summary.whenEvent')} ${url}`
  } else if (actionType === 'modify') {
    const target = interaction.responses?.[0]?.targetComponentId || t('interaction.empty.component')
    const property = interaction.responses?.[0]?.targetProperty || t('interaction.empty.property')
    return `${event}${t('interaction.summary.whenEventModify')}${target}of${property}`
  }

  return `${event}${t('interaction.summary.whenEventCustom')}`
}

// Get action type
const getActionType = (interaction: any) => {
  const firstResponse = interaction.responses?.[0]
  if (!firstResponse) return 'none'

  // Support new action types
  if (firstResponse.action === 'jump') return 'jump'
  if (firstResponse.action === 'modify') return 'modify'

  // Backward compatibility with older action types
  if (firstResponse.action === 'navigateToUrl') return 'jump'
  if (firstResponse.action === 'updateComponentData') return 'modify'

  return 'custom'
}

// 🔒 Safe attribute getter function - Access component properties based on whitelist
const getWhitelistedProperties = async (targetComponent: any, groups: Record<string, any[]>) => {
  if (!targetComponent?.type) return

  try {
    // Get the component's whitelist property configuration
    const whitelistedProperties = propertyExposureManager.getWhitelistedProperties(
      targetComponent.type,
      'public',
      { source: 'interaction' }
    )

    if (Object.keys(whitelistedProperties).length === 0) {
      return
    }

    const whitelistGroup = '🔒 Whitelist attributes (Safety)'

    if (!groups[whitelistGroup]) {
      groups[whitelistGroup] = []
    }

    // Get the current value from the component's exposed property
    const exposedProps = targetComponent.metadata?.exposedProperties || {}

    for (const [propertyName, config] of Object.entries(whitelistedProperties)) {
      const exposedName = config.alias || propertyName
      const currentValue = exposedProps[exposedName]

      // Verify access using attribute exposure manager
      const accessContext: PropertyAccessContext = {
        accessType: 'read',
        timestamp: Date.now(),
        source: 'interaction'
      }

      const accessResult = propertyExposureManager.getExposedProperty(
        targetComponent.type,
        targetComponent.id,
        propertyName,
        currentValue,
        accessContext
      )

      if (accessResult.allowed) {
        groups[whitelistGroup].push({
          label: `${exposedName} (${config.description})${currentValue !== undefined ? ` - current: ${String(currentValue)}` : ''}`,
          value: exposedName,
          property: {
            name: exposedName,
            label: exposedName,
            type: config.type,
            description: config.description,
            source: 'whitelist',
            readonly: config.readonly,
            level: config.level
          }
        })
      }
    }

  } catch (error) {
    console.error(`❌ [InteractionCardWizard] Failed to get whitelist attributes: ${targetComponent.type}`, error)
  }
}

// Edit interaction
const editInteraction = (index: number) => {
  editingIndex.value = index
  const interaction = interactions.value[index]

  // Populate current form
  currentInteraction.value = {
    event: interaction.event,
    enabled: interaction.enabled,
    priority: interaction.priority,
    url: '',
    target: '_blank',
    targetComponentId: '',
    targetProperty: '',
    updateValue: ''
  }

  // 🔥 Reset status related to data changes
  currentWatchedProperty.value = ''
  currentConditionType.value = ''
  currentConditionOperator.value = ''
  currentConditionValue.value = ''

  // 🔥 Reset target property binding state
  currentTargetPropertyBinding.value = ''
  currentTargetPropertyInfo.value = null

  // 🔥 If it is a data change event，Load listening properties and condition configuration
  if (interaction.event === 'dataChange') {
    currentWatchedProperty.value = interaction.watchedProperty || ''

    if (interaction.condition) {
      currentConditionType.value = interaction.condition.type || ''

      if (interaction.condition.type === 'comparison') {
        currentConditionOperator.value = interaction.condition.operator || ''
        currentConditionValue.value = interaction.condition.value || ''
      } else if (interaction.condition.type === 'range' || interaction.condition.type === 'expression') {
        currentConditionValue.value = interaction.condition.value || ''
      }
    }
  }

  // Populate form based on response type
  const firstResponse = interaction.responses?.[0]
  if (firstResponse) {
    // Handling new jump formats
    if (firstResponse.action === 'jump') {
      currentActionType.value = 'jump'

      if (firstResponse.jumpConfig) {
        // new format：use jumpConfig
        const jumpConfig = firstResponse.jumpConfig
        urlType.value = jumpConfig.jumpType
        currentInteraction.value.target = jumpConfig.target || '_self'

        if (jumpConfig.jumpType === 'external') {
          currentInteraction.value.url = jumpConfig.url || ''
        } else {
          selectedMenuPath.value = jumpConfig.internalPath || ''
          currentInteraction.value.url = jumpConfig.internalPath || ''
          loadMenuOptions()
        }
      } else {
        // Backwards compatible with older formats
        const url = firstResponse.value || ''
        currentInteraction.value.url = url
        currentInteraction.value.target = firstResponse.target || '_blank'

        if (url && (url.startsWith('http') || url.startsWith('https'))) {
          urlType.value = 'external'
        } else if (url) {
          urlType.value = 'internal'
          selectedMenuPath.value = url
          loadMenuOptions()
        }
      }
    }
    // Handle old jump format
    else if (firstResponse.action === 'navigateToUrl') {
      currentActionType.value = 'jump'
      const url = firstResponse.value || ''
      currentInteraction.value.url = url
      currentInteraction.value.target = firstResponse.target || '_blank'

      if (url && (url.startsWith('http') || url.startsWith('https'))) {
        urlType.value = 'external'
      } else if (url) {
        urlType.value = 'internal'
        selectedMenuPath.value = url
        loadMenuOptions()
      }
    }
    // Handle new modified formats
    else if (firstResponse.action === 'modify') {
      currentActionType.value = 'modify'

      if (firstResponse.modifyConfig) {
        // new format：use modifyConfig
        const modifyConfig = firstResponse.modifyConfig
        currentInteraction.value.targetComponentId = modifyConfig.targetComponentId || ''
        currentInteraction.value.targetProperty = modifyConfig.targetProperty || ''
        currentInteraction.value.updateValue = modifyConfig.updateValue || ''

        // 🔥 Build target attribute binding path
        if (modifyConfig.targetComponentId && modifyConfig.targetProperty) {
          currentTargetPropertyBinding.value = `${modifyConfig.targetComponentId}.${modifyConfig.targetProperty}`
        }
      } else {
        // Backwards compatible with older formats
        currentInteraction.value.targetComponentId = firstResponse.targetComponentId || ''
        currentInteraction.value.targetProperty = firstResponse.targetProperty || ''
        currentInteraction.value.updateValue = firstResponse.updateValue || ''

        // 🔥 Build target attribute binding path
        if (firstResponse.targetComponentId && firstResponse.targetProperty) {
          currentTargetPropertyBinding.value = `${firstResponse.targetComponentId}.${firstResponse.targetProperty}`
        }
      }
    }
    // Handling old modified formats
    else if (firstResponse.action === 'updateComponentData') {
      currentActionType.value = 'modify'
      currentInteraction.value.targetComponentId = firstResponse.targetComponentId || ''
      currentInteraction.value.targetProperty = firstResponse.targetProperty || ''
      currentInteraction.value.updateValue = firstResponse.updateValue || ''

      // 🔥 Build target attribute binding path
      if (firstResponse.targetComponentId && firstResponse.targetProperty) {
        currentTargetPropertyBinding.value = `${firstResponse.targetComponentId}.${firstResponse.targetProperty}`
      }
    }
  }

  showAddModal.value = true
}

// Delete interaction
const deleteInteraction = (index: number) => {
  interactions.value.splice(index, 1)
  emit('update:modelValue', interactions.value)
}

// 🔥 Data change related processing functions
const handleWatchedPropertyChange = (bindingPath: string, propertyInfo?: any) => {
  currentWatchedProperty.value = bindingPath

  // 🔥 Optional：If additional processing using attribute information is required
  if (propertyInfo) {
  }
}

// 🔥 New：Target attribute binding change processing
const handleTargetPropertyChange = (bindingPath: string, propertyInfo?: any) => {
  currentTargetPropertyBinding.value = bindingPath
  currentTargetPropertyInfo.value = propertyInfo


  // Parse the binding path and update the original fields（backwards compatible）
  if (bindingPath && propertyInfo) {
    currentInteraction.value.targetComponentId = propertyInfo.componentId
    currentInteraction.value.targetProperty = `${propertyInfo.layer}.${propertyInfo.propertyName}`
  } else {
    currentInteraction.value.targetComponentId = ''
    currentInteraction.value.targetProperty = ''
  }
}

const handleConditionTypeChange = (value: string) => {
  currentConditionType.value = value
  // reset condition value
  currentConditionOperator.value = ''
  currentConditionValue.value = ''
}

// 🔥 Internal menu related processing functions
const handleUrlTypeChange = () => {
  if (urlType.value === 'internal') {
    // When switching to internal menu，Load menu options
    // Force menu reload（Do not check cache）
    menuOptions.value = [] // Clear cache
    loadMenuOptions()
    // Clear external links
    currentInteraction.value.url = ''
  } else {
    // When switching to external link，Clear menu selections
    selectedMenuPath.value = ''
  }
}

const handleMenuPathChange = () => {
  currentInteraction.value.url = selectedMenuPath.value
}

const loadMenuOptions = async () => {
  menuLoading.value = true
  try {
    const result = await fetchGetUserRoutes()
    if (result && result.data && result.data.list) {
      // Convert routing data to options format
      const flattened = flattenRoutes(result.data.list)
      menuOptions.value = flattened

      // If there is no menu item，Explain that there is a problem with the flattening function
      if (flattened.length === 0) {
        message.error(t('interaction.messages.menuDataProcessFailed'))
      }
    } else {
      message.error(t('interaction.messages.menuDataAbnormal'))
    }
  } catch (error) {
    message.error(t('interaction.messages.menuLoadFailed') + ': ' + error.message)
  } finally {
    menuLoading.value = false
  }
}

// Flatten routing data，Adapt to new data structures（path + meta.title）
const flattenRoutes = (routes: any[]): { label: string; value: string }[] => {
  const options: { label: string; value: string }[] = []

  // recursive processing function
  const processRoute = (route: any, parentTitle = '') => {
    // new data structure：path as path，meta.title as title
    const path = route.path
    const title = route.meta?.title || route.meta?.i18nKey || route.name

    // Generate display labels（if there is a parent，use / separate）
    const displayLabel = parentTitle ? `${parentTitle} / ${title}` : title
    // If there is a path and title，and not hiding menu items，Just add it to the options
    if (path && title && !route.meta?.hideInMenu) {
      const option = { label: displayLabel, value: path }
      options.push(option)
    }
    // Process all child routes recursively
    if (route.children && Array.isArray(route.children) && route.children.length > 0) {
      route.children.forEach(child => processRoute(child, displayLabel))
    }
  }

  // Handles all top-level routes
  routes.forEach(route => processRoute(route))
  return options
}

// Handling action type changes
const handleActionTypeChange = (value: string) => {
  currentActionType.value = value
  // Reset related fields
  if (value === 'jump') {
    urlType.value = 'external'
    currentInteraction.value.url = 'https://example.com'
    currentInteraction.value.target = '_blank'
    selectedMenuPath.value = ''
  } else if (value === 'modify') {
    currentInteraction.value.targetComponentId = ''
    currentInteraction.value.targetProperty = 'backgroundColor'
    currentInteraction.value.updateValue = '#ff0000'
  }
}

// Save interaction
const saveInteraction = () => {
  const interaction: any = {
    event: currentInteraction.value.event,
    enabled: currentInteraction.value.enabled,
    priority: currentInteraction.value.priority,
    responses: []
  }

  // 🔥 If it is a data change event，Save listening properties and condition configurations
  if (currentInteraction.value.event === 'dataChange') {
    interaction.watchedProperty = currentWatchedProperty.value

    // Build conditional configuration
    if (currentConditionType.value) {
      interaction.condition = {
        type: currentConditionType.value
      }

      if (currentConditionType.value === 'comparison') {
        interaction.condition.operator = currentConditionOperator.value
        interaction.condition.value = currentConditionValue.value
      } else if (currentConditionType.value === 'range' || currentConditionType.value === 'expression') {
        interaction.condition.value = currentConditionValue.value
      }
    }
  }

  // Build responses based on action type
  if (currentActionType.value === 'jump') {
    // Generate new jump configuration format
    const jumpConfig = {
      jumpType: urlType.value === 'external' ? 'external' : 'internal',
      target: currentInteraction.value.target || '_self'
    }

    if (urlType.value === 'external') {
      jumpConfig.url = currentInteraction.value.url
    } else {
      jumpConfig.internalPath = selectedMenuPath.value || currentInteraction.value.url
    }

    interaction.responses = [
      {
        action: 'jump',
        jumpConfig: jumpConfig,
        // Backwards compatible with older formats
        value: currentInteraction.value.url,
        target: currentInteraction.value.target
      }
    ]
  } else if (currentActionType.value === 'modify') {
    // 🔥 Give priority to new binding paths，Parse out componentsIDand attribute path
    let targetComponentId = currentInteraction.value.targetComponentId
    let targetProperty = currentInteraction.value.targetProperty

    if (currentTargetPropertyBinding.value && currentTargetPropertyInfo.value) {
      // Use new binding path information
      targetComponentId = currentTargetPropertyInfo.value.componentId
      targetProperty = `${currentTargetPropertyInfo.value.layer}.${currentTargetPropertyInfo.value.propertyName}`

    }

    // Generate new modified configuration format
    const modifyConfig = {
      targetComponentId: targetComponentId,
      targetProperty: targetProperty,
      updateValue: currentInteraction.value.updateValue,
      updateMode: 'replace',
      // 🔥 New：Save complete binding path information
      bindingPath: currentTargetPropertyBinding.value
    }

    interaction.responses = [
      {
        action: 'modify',
        modifyConfig: modifyConfig,
        // Backwards compatible with older formats
        targetComponentId: targetComponentId,
        targetProperty: targetProperty,
        updateValue: currentInteraction.value.updateValue
      }
    ]
  }

  if (editingIndex.value >= 0) {
    // edit mode
    interactions.value[editingIndex.value] = interaction
    editingIndex.value = -1
  } else {
    // Add mode
    interactions.value.push(interaction)
  }

  emit('update:modelValue', interactions.value)
  showAddModal.value = false

  // Reset form
  currentInteraction.value = {
    event: 'click',
    enabled: true,
    priority: 1,
    url: '',
    target: '_blank',
    targetComponentId: '',
    targetProperty: '',
    updateValue: ''
  }
  currentActionType.value = ''
  urlType.value = 'external'
  selectedMenuPath.value = ''

  // 🔥 Reset status related to data changes
  currentWatchedProperty.value = ''
  currentConditionType.value = ''
  currentConditionOperator.value = ''
  currentConditionValue.value = ''

  // 🔥 Reset target property binding state
  currentTargetPropertyBinding.value = ''
  currentTargetPropertyInfo.value = null
}
</script>

<style scoped>
.interaction-simple {
  padding: 16px;
  height: 100%;
}

.interaction-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-color-3);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-color-2);
}

.empty-desc {
  font-size: 12px;
}

/* interactive list */
.interactions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.interaction-item {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-color);
}

.interaction-summary {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.summary-badge.click {
  background: var(--success-color-suppl);
  color: var(--success-color);
}

.summary-badge.hover {
  background: var(--info-color-suppl);
  color: var(--info-color);
}

.summary-badge.condition {
  background: var(--warning-color-suppl);
  color: var(--warning-color);
}

.summary-text {
  flex: 1;
}

.summary-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 2px;
}

.summary-desc {
  font-size: 12px;
  color: var(--text-color-3);
}

.summary-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
