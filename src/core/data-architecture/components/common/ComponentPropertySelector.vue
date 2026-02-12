<template>
  <div class="component-property-selector">
    <!-- first level：Component selection -->
    <div class="selector-level">
      <n-form-item label="Select components">
        <n-select
          v-model:value="selectedComponentId"
          :options="componentOptions"
          placeholder="Please select the component to bind"
          clearable
          filterable
          @update:value="onComponentChange"
        />
      </n-form-item>
    </div>

    <!-- Level 2：Attribute selection -->
    <div v-if="selectedComponentId" class="selector-level">
      <n-form-item label="Select properties">
        <n-select
          v-model:value="selectedPropertyPath"
          :options="propertyOptions"
          placeholder="Please select the attribute to bind"
          clearable
          filterable
          @update:value="onPropertyChange"
        />
      </n-form-item>
    </div>

    <!-- debugging information -->
    <div v-if="isDevelopment" class="debug-info">
      <div style="font-size: 12px; color: #999; margin-top: 8px;">
        <div>DEBUG - Number of components: {{ componentOptions.length }}</div>
        <div>DEBUG - Number of attributes: {{ propertyOptions.length }}</div>
        <div>DEBUG - Select path: {{ selectedPropertyPath }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Component attribute selector（Secondary linkage）
 * 🔒 Based on whitelist security mechanism，Expose only verified bindable properties
 */

import { ref, computed, watch, nextTick } from 'vue'
import { NFormItem, NSelect } from 'naive-ui'
import { useEditorStore } from '@/store/modules/editor'
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import type { WidgetConfiguration } from '@/components/visual-editor/configuration/types'
// 🔒 Import whitelist attribute exposure manager（switch to Core2 system）
import { propertyExposureManager } from '@/card2.1/core2/property'
import type { PropertyAccessContext } from '@/card2.1/core2'

// Props and Emits
interface Props {
  modelValue?: string
  placeholder?: string
  currentComponentId?: string // 🔥 current componentID，for display"current component"logo
  autoDetectComponentId?: boolean // 🔥 New：Whether to automatically detect the currently active componentID
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', bindingPath: string, propertyInfo?: PropertyInfo): void
}

interface PropertyInfo {
  componentId: string
  componentName: string
  layer: 'base' | 'component'
  propertyName: string
  propertyLabel: string
  type: string
  description?: string
  currentValue?: any
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Blacklist configuration - Exclude sensitive and internal properties
const PROPERTY_BLACKLIST = [
  'metadata',
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'credential',
  '_internal',
  '__'
]

// internal state
const selectedComponentId = ref<string>('')
const selectedPropertyPath = ref<string>('')

// Editor Store
const editorStore = useEditorStore()

// Development mode check
const isDevelopment = process.env.NODE_ENV === 'development'

// Listen to external modelValue change
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue !== selectedPropertyPath.value) {
      parseBindingPath(newValue)
    } else if (!newValue) {
      selectedComponentId.value = ''
      selectedPropertyPath.value = ''
    }
  },
  { immediate: true }
)

/**
 * Parse binding path，Set corresponding component and attribute selections
 */
const parseBindingPath = (bindingPath: string) => {
  if (!bindingPath || !bindingPath.includes('.')) return

  const parts = bindingPath.split('.')
  if (parts.length >= 3) {
    const componentId = parts[0]
    selectedComponentId.value = componentId
    selectedPropertyPath.value = bindingPath
  }
}

/**
 * Get all component options on canvas
 */
const componentOptions = computed(() => {
  const components = editorStore.nodes || []

  return components.map(comp => {
    // 🔥 critical fix：Intelligently determine the current component
    // 1. Prefer using explicitly passed currentComponentId
    // 2. If automatic detection is turned on，Use selected nodeIDor first node
    let effectiveCurrentComponentId = props.currentComponentId

    if (!effectiveCurrentComponentId && props.autoDetectComponentId) {
      // Automatic detection：Prioritize using selected nodes，Otherwise use the first node
      effectiveCurrentComponentId = editorStore.selectedNodeId || components[0]?.id
    }

    const isCurrentComponent = comp.id === effectiveCurrentComponentId
    const componentLabel = isCurrentComponent
      ? `${comp.type || 'unknown'} (current component)`
      : `${comp.type || 'unknown'} (${comp.id.slice(0, 8)}...)`

    return {
      label: componentLabel,
      value: comp.id,
      componentType: comp.type
    }
  })
})

/**
 * 🔒 Get the whitelist properties of a component（security mechanism）
 */
const getWhitelistedProperties = async (componentId: string) => {
  if (!componentId) return []

  try {
    // 🔒 Get component type
    const componentType = getComponentType(componentId)
    if (!componentType) {
      console.warn(`⚠️ [ComponentPropertySelector] Unable to determine component ${componentId} type`)
      return []
    }

    // 🔒 Get security attributes from whitelist manager
    const whitelistedProperties = propertyExposureManager.getWhitelistedProperties(
      componentType,
      'public', // Get only public level properties
      { source: 'property-selector' }
    )

    if (Object.keys(whitelistedProperties).length === 0) {
      return []
    }

    // 🔒 Get the current configuration value of the component
    const config = configurationIntegrationBridge.getConfiguration(componentId)
    const options: any[] = []

    // 🔒 Traverse whitelist properties，Generate a safe list of options
    for (const [propertyName, propConfig] of Object.entries(whitelistedProperties)) {
      const exposedName = propConfig.alias || propertyName

      // 🔒 Verify attribute access
      const accessContext: PropertyAccessContext = {
        accessType: 'read',
        timestamp: Date.now(),
        source: 'property-selector'
      }

      // 🔒 Get current value from multiple levels，Ensure whitelist attributes are correctly associated with the configuration system
      let currentValue = undefined

      // 🔥 repair：Global basic attributes take priority from base layer acquisition
      const isGlobalBaseProperty = propertyName === 'deviceId' || propertyName === 'metricsList'

      if (isGlobalBaseProperty) {
        // Global basic properties：Prioritize from base layer acquisition
        if (config?.base?.[propertyName] !== undefined) {
          currentValue = config.base[propertyName]
        }
        // compatibility：if base layer no，Get from other layers
        else if (config?.component?.[propertyName] !== undefined) {
          currentValue = config.component[propertyName]
        }
        else if (config?.customize?.[propertyName] !== undefined) {
          currentValue = config.customize[propertyName]
        }
        else if (config?.[propertyName] !== undefined) {
          currentValue = config[propertyName]
        }
      } else {
        // Common component properties：Get in original order
        // 1. First get it from the component level
        if (config?.component?.[propertyName] !== undefined) {
          currentValue = config.component[propertyName]
        }
        // 2. fromcustomizeLevel acquisition（For alarm status components, etc.）
        else if (config?.customize?.[propertyName] !== undefined) {
          currentValue = config.customize[propertyName]
        }
        // 3. Get from root level
        else if (config?.[propertyName] !== undefined) {
          currentValue = config[propertyName]
        }
      }


      const accessResult = propertyExposureManager.getExposedProperty(
        componentType,
        componentId,
        propertyName,
        currentValue, // Use the correctly obtained current value
        accessContext
      )

      if (accessResult.allowed) {
        // 🔥 repair：Distinguish between global base properties and component-specific properties
        const isGlobalBaseProperty = exposedName === 'deviceId' || exposedName === 'metricsList'
        const propertyLayer = isGlobalBaseProperty ? 'base' : 'component'
        const propertyPath = `${componentId}.${propertyLayer}.${exposedName}`


        options.push({
          label: `🔒 [Safety] ${propConfig.description || exposedName} (${propConfig.type})${isGlobalBaseProperty ? ' - Global basic properties' : ''}`,
          value: propertyPath,
          propertyInfo: {
            componentId: componentId,
            componentName: getComponentName(componentId),
            layer: propertyLayer,
            propertyName: exposedName,
            propertyLabel: propConfig.description || exposedName,
            type: propConfig.type,
            description: propConfig.description,
            currentValue: accessResult.value,
            isWhitelisted: true,
            accessLevel: propConfig.level,
            isGlobalBaseProperty
          }
        })
      }
    }


    return options
  } catch (error) {
    console.error(`❌ [ComponentPropertySelector] Failed to obtain whitelist attributes:`, error)
    return []
  }
}

/**
 * 🔍 Get component type
 */
const getComponentType = (componentId: string): string | null => {
  const components = editorStore.nodes || []
  const component = components.find(comp => comp.id === componentId)
  return component?.type || null
}

/**
 * 🔒 Property option list（userefSupport asynchronous updates）
 */
const propertyOptions = ref<any[]>([])

/**
 * 🔒 Function to update attribute options asynchronously
 */
const updatePropertyOptions = async () => {
  if (!selectedComponentId.value) {
    propertyOptions.value = []
    return
  }


  try {
    // 🔒 Get whitelist attributes
    const whitelistOptions = await getWhitelistedProperties(selectedComponentId.value)

    // 🔒 Get component configuration，for extraction equipmentIDand indicators
    const config = configurationIntegrationBridge.getConfiguration(selectedComponentId.value)

    // 🚨 Force the addition of user-required exposed attributes：equipmentIDand device indicators
    // 🔥 repair：regardless config Does it exist in，All are mandatory to add，Because this is a global basic attribute
    const mandatoryOptions: any[] = []

    // Check if it is already in the whitelist deviceId
    const hasDeviceIdInWhitelist = whitelistOptions.some(opt =>
      opt.propertyInfo?.propertyName === 'deviceId'
    )

    // Check if it is already in the whitelist metricsList
    const hasMetricsListInWhitelist = whitelistOptions.some(opt =>
      opt.propertyInfo?.propertyName === 'metricsList'
    )

    // 🔥 repair：As long as it does not exist in the whitelist，Just add it forcefully，Don't check config Is there a value in
    if (!hasDeviceIdInWhitelist) {
      const currentDeviceId = config?.base?.deviceId || config?.deviceId || ''
      mandatoryOptions.push({
        label: `🚨 [required] equipmentID (string) - Global basic properties`,
        value: `${selectedComponentId.value}.base.deviceId`,
        propertyInfo: {
          componentId: selectedComponentId.value,
          componentName: getComponentName(selectedComponentId.value),
          layer: 'base',
          propertyName: 'deviceId',
          propertyLabel: 'equipmentID',
          type: 'string',
          description: 'Associated device unique identifier（Global basic properties）',
          currentValue: currentDeviceId,
          isWhitelisted: false,
          isMandatory: true,
          userRequired: true
        }
      })
    }

    if (!hasMetricsListInWhitelist) {
      const currentMetricsList = config?.base?.metricsList || config?.metricsList || []
      mandatoryOptions.push({
        label: `🚨 [required] Device indicator list (array) - Global basic properties`,
        value: `${selectedComponentId.value}.base.metricsList`,
        propertyInfo: {
          componentId: selectedComponentId.value,
          componentName: getComponentName(selectedComponentId.value),
          layer: 'base',
          propertyName: 'metricsList',
          propertyLabel: 'Device indicator list',
          type: 'array',
          description: 'List of monitored device indicators（Global basic properties）',
          currentValue: currentMetricsList,
          isWhitelisted: false,
          isMandatory: true,
          userRequired: true
        }
      })
    }

    // 🔒 Combine all options：Whitelist attributes + Required attributes（Duplicates have been removed）
    const allOptions = [...whitelistOptions, ...mandatoryOptions]

    if (allOptions.length > 0) {
      propertyOptions.value = allOptions
      return
    }

    // 🔒 If there is no configuration，Provide basic security attributes
    console.warn(`⚠️ [ComponentPropertySelector] components ${selectedComponentId.value} No configuration，Only basic security attributes are provided`)

    const basicSafeOptions = [
      {
        label: `🔒 [Safety] componentsID (string)`,
        value: `${selectedComponentId.value}.system.componentId`,
        propertyInfo: {
          componentId: selectedComponentId.value,
          componentName: getComponentName(selectedComponentId.value),
          layer: 'system',
          propertyName: 'componentId',
          propertyLabel: 'componentsID',
          type: 'string',
          description: 'The unique identifier of the component',
          currentValue: selectedComponentId.value,
          isWhitelisted: false,
          isSafeDefault: true
        }
      }
    ]

    propertyOptions.value = basicSafeOptions

  } catch (error) {
    console.error(`❌ [ComponentPropertySelector] Attribute acquisition failed:`, error)
    propertyOptions.value = []
  }
}

// 🔒 Listening componentIDchange，Automatically update properties options
watch(
  () => selectedComponentId.value,
  () => {
    updatePropertyOptions()
  },
  { immediate: true }
)

// 🔒 Implementation of new whitelist security mechanism completed

/**
 * Get component name
 */
const getComponentName = (componentId: string): string => {
  const components = editorStore.nodes || []
  const component = components.find(comp => comp.id === componentId)
  return component?.name || component?.type || 'Unknown'
}

// event handling
const onComponentChange = (componentId: string | null) => {
  selectedComponentId.value = componentId || ''
  selectedPropertyPath.value = ''

  if (componentId) {
    // When component selection changes，Attribute options will pass watch Automatic updates
    nextTick(() => {
      emit('change', '', null)
    })
  } else {
    emit('change', '', null)
  }
}

const onPropertyChange = (propertyPath: string | null) => {
  // 🔥 critical fix：Strictly verify the binding path format，Prevent incorrect values ​​from being passed
  if (propertyPath) {
    // 验证绑定路径Format：must be componentId.layer.propertyName Format
    const isValidBindingPath = typeof propertyPath === 'string' &&
      propertyPath.includes('.') &&
      propertyPath.split('.').length >= 3 &&
      propertyPath.length > 10 && // Binding paths are usually longer
      !/^\d+$/.test(propertyPath) && // Cannot be a pure number
      !propertyPath.includes('undefined') && // cannot containundefined
      !propertyPath.includes('null') // cannot containnull

    if (!isValidBindingPath) {
      console.error(`❌ [ComponentPropertySelector] Invalid bind path format detected:`, {
        enterValue: propertyPath,
        valueType: typeof propertyPath,
        expectedFormat: 'componentId.layer.propertyName',
        actualLength: typeof propertyPath === 'string' ? propertyPath.length : 'non-string'
      })
      // Refuse to set invalid binding path，Keep current selection unchanged
      return
    }
  }

  selectedPropertyPath.value = propertyPath || ''

  if (propertyPath) {
    // Find the corresponding attribute information from the options
    const selectedOption = propertyOptions.value.find(opt => opt.value === propertyPath)
    const propertyInfo = selectedOption?.propertyInfo || null


    emit('change', propertyPath, propertyInfo)
  } else {
    emit('change', '', null)
  }
}
</script>

<style scoped>
.component-property-selector {
  width: 100%;
}

.selector-level {
  margin-bottom: 16px;
}

.selector-level:last-child {
  margin-bottom: 0;
}

.selector-level .n-form-item {
  margin-bottom: 0;
}

.selector-level .n-select {
  width: 100%;
}

.debug-info {
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}
</style>
