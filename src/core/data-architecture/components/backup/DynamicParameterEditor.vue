<!--
  Dynamic parameter editor component v3.0
  Take main row-Detailed design，OptimizedUILayout and interactive experience
-->
<script setup lang="ts">
/**
 * DynamicParameterEditor - Smart parameter editor v3.0
 *
 * design concept：
 * - Main row/Separation of details：Keep the master list simple，Show only core information，Click“Configuration”Expand details panel。
 * - Modal editing：pass“template”Switch between different value input modes（Manual、drop down、property、components）。
 * - Interactive optimization：For complex component templates，Use drawers（Drawer）Make edits，Avoid breaking the layout。
 */

import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NCheckbox,
  NInput,
  NSelect,
  NSpace,
  NTag,
  NText,
  NDrawer,
  NDrawerContent,
  NIcon,
  NDropdown,
  NAlert
} from 'naive-ui'
import { type EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'
import { generateVariableName } from '@/core/data-architecture/types/http-config'
import { getRecommendedTemplates, getTemplateById, ParameterTemplateType } from '@/core/data-architecture/components/common/templates/index'

// Import components used by component templates（Simplified version）
import DeviceMetricsSelector from '@/components/device-selectors/DeviceMetricsSelector.vue'
import DeviceDispatchSelector from '@/components/device-selectors/DeviceDispatchSelector.vue'
import ComponentPropertySelector from '@/core/data-architecture/components/common/ComponentPropertySelector.vue'
import AddParameterFromDevice from '@/core/data-architecture/components/common/AddParameterFromDevice.vue'
// Import new unified device configuration selector
import UnifiedDeviceConfigSelector from '@/core/data-architecture/components/device-selectors/UnifiedDeviceConfigSelector.vue'
// Import device parameter selector
import DeviceParameterSelector from '@/core/data-architecture/components/device-selectors/DeviceParameterSelector.vue'
// Import parameter group management tool
import { globalParameterGroupManager } from '@/core/data-architecture/utils/device-parameter-generator'
import {
  Sparkles as SparkleIcon,
  AddCircleOutline as AddIcon,
  PhonePortraitOutline,
  PhonePortraitOutline as DeviceIcon,
  CreateOutline as EditOutline,
  TrashOutline
} from '@vicons/ionicons5'

// component mapping table（Simplified version）
const componentMap = {
  DeviceMetricsSelector,
  DeviceDispatchSelector,
  ComponentPropertySelector
}

// Propsinterface
interface Props {
  modelValue: EnhancedParameter[]
  parameterType: 'header' | 'query' | 'path'
  title?: string
  addButtonText?: string
  keyPlaceholder?: string
  valuePlaceholder?: string
  showDataType?: boolean
  showEnabled?: boolean
  customClass?: string
  maxParameters?: number // Maximum number of parameters
  currentApiInfo?: any // Currently selected internal interface information，Used for interface template functions
  currentComponentId?: string // 🔥 New：current componentID，for property binding
}

// Emitsinterface
interface Emits {
  (e: 'update:modelValue', value: EnhancedParameter[]): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Parameter configuration',
  addButtonText: 'Add parameters',
  keyPlaceholder: 'Parameter name',
  valuePlaceholder: 'Parameter value',
  showDataType: true,
  showEnabled: true,
  customClass: ''
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// Index of the parameter currently being edited，-1Indicates that no parameters are in editing state
const editingIndex = ref(-1)
// Controlling the display of the component template editing drawer
const isDrawerVisible = ref(false)
// Control the display of the add parameters drawer from the device
const isAddFromDeviceDrawerVisible = ref(false)
// Controlling unified device configuration selector display
const isUnifiedDeviceConfigVisible = ref(false)
const isEditingDeviceConfig = ref(false)

// Control new device parameter selector display（Keep compatible）
const isDeviceParameterSelectorVisible = ref(false)
// Temporary state of parameters currently being edited in the drawer
const drawerParam = ref<EnhancedParameter | null>(null)
// Parameter group information being edited
const editingGroupInfo = ref<{
  groupId: string
  preSelectedDevice?: any
  preSelectedMetric?: any
  preSelectedMode?: any
} | null>(null)

/**
 * 🔥 Revise：Parameter addition options - Support interface template import
 */
const addParameterOptions = computed(() => {
  console.log('🔍 [addParameterOptions] computed be executed')
  console.log('🔍 [addParameterOptions] props.currentApiInfo:', props.currentApiInfo)

  const baseOptions = [
    {
      label: 'Manual entry',
      key: 'manual',
      description: 'Directly enter fixed parameter values'
    },
    {
      label: 'Component property binding',
      key: 'property',
      description: 'Bind to component properties（Get value at runtime）'
    },
    {
      label: 'Device configuration',
      key: 'device',
      description: 'Select equipment and corresponding indicator data'
    }
  ]

  // If there is internal interface information and prefabricated parameters，Add to"Application interface template"Options
  if (props.currentApiInfo && props.currentApiInfo.commonParams && props.currentApiInfo.commonParams.length > 0) {
    console.log('✨ [addParameterOptions] detected commonParams，Add interface template option')
    console.log('✨ [addParameterOptions] commonParams quantity:', props.currentApiInfo.commonParams.length)
    baseOptions.unshift({
      label: `✨ Application interface template (${props.currentApiInfo.commonParams.length}parameters)`,
      key: 'api-template',
      description: 'Automatically import prefabricated parameters of internal interfaces'
    })
  } else {
    console.log('⚠️ [addParameterOptions] not detected commonParams，Do not add interface template option')
  }

  console.log('🔍 [addParameterOptions] final option:', baseOptions)
  return baseOptions
})

/**
 * Data type options
 */
const dataTypeOptions = [
  { label: 'string', value: 'string' },
  { label: 'number', value: 'number' },
  { label: 'Boolean value', value: 'boolean' },
  { label: 'JSON', value: 'json' }
]

/**
 * Get a list of recommended templates
 */
const recommendedTemplates = computed(() => {
  return getRecommendedTemplates(props.parameterType)
})

/**
 * Is it possible to add more parameters
 */
const canAddMoreParameters = computed(() => {
  if (props.maxParameters === undefined) return true
  return props.modelValue.length < props.maxParameters
})

/**
 * 🔥 New：Make sure all parameters are stableIDComputed properties of
 * Used to fix compatibility issues with history parameters and prevent focus loss
 */
const parametersWithStableIds = computed(() => {
  return props.modelValue.map((param, index) => ensureParameterHasId(param, index))
})

/**
 * Create default parameters - add uniqueIDmake sureVuetrack
 */
const createDefaultParameter = (): EnhancedParameter => ({
  key: '',
  value: '',
  enabled: true,
  isDynamic: false, // 🔥 New：Defaults to static parameters
  valueMode: ParameterTemplateType.MANUAL,
  selectedTemplate: 'manual',
  dataType: 'string',
  variableName: '',
  description: '',
  // 🔥 add uniqueIDmake sureVueCorrect tracking
  _id: `param_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
})

/**
 * Add new parameters - Force responsive updates
 */
const addParameter = () => {
  const newParam = createDefaultParameter()
  const updatedParams = [...props.modelValue, newParam]

  // Immediately fire an update event
  emit('update:modelValue', updatedParams)

  // Force refresh of component state
  nextTick(() => {
    // Automatically expand newly added parameters for editing
    editingIndex.value = updatedParams.length - 1
  })
}

/**
 * Handling drop-down options for adding parameters - Support interface template import
 */
const handleSelectAddOption = (key: string) => {
  console.log('🔍 [DynamicParameterEditor] handleSelectAddOption called，key:', key)
  console.log('🔍 [DynamicParameterEditor] currentApiInfo:', props.currentApiInfo)

  // 🔥 New：Handle interface template import
  if (key === 'api-template') {
    console.log('✨ [DynamicParameterEditor] Trigger interface template import')
    handleTemplateImport()
    return
  }

  // Check parameter limit
  if (!canAddMoreParameters.value) {
    return
  }

  const newParam = createDefaultParameter()

  switch (key) {
    case 'manual':
      // Manual entry：Use default manual entry template
      newParam.selectedTemplate = 'manual'
      newParam.valueMode = ParameterTemplateType.MANUAL
      break

    case 'property':
      // 🔥 repair：Property binding - Show panel now
      newParam.selectedTemplate = 'component-property-binding'
      newParam.valueMode = ParameterTemplateType.COMPONENT
      newParam.isDynamic = true // 🔥 critical fix：Set as dynamic parameter

      // Add parameters
      const updatedParams = [...props.modelValue, newParam]
      emit('update:modelValue', updatedParams)

      // Set editing status and open drawer now
      const newParamIndex = updatedParams.length - 1
      editingIndex.value = newParamIndex

      nextTick(() => {
        // Directly open the component property selection drawer
        openComponentDrawer(newParam)
      })
      return // Return early，Avoid duplication of processing

    case 'device':
      // 🔥 repair：Device configuration - Open the unified device configuration selector
      isUnifiedDeviceConfigVisible.value = true
      isEditingDeviceConfig.value = false // New mode
      return // Return early，Avoid duplication of processing

    default:
      // Use manual input by default
      newParam.selectedTemplate = 'manual'
      newParam.valueMode = ParameterTemplateType.MANUAL
  }

  // Add parameters and automatically expand editing
  const updatedParams = [...props.modelValue, newParam]
  emit('update:modelValue', updatedParams)

  // use nextTick make sureDOMSet editing status after updating
  nextTick(() => {
    editingIndex.value = updatedParams.length - 1
  })
}

/**
 * Handle interface template import - Generate parameters based on the currently selected interface - Force responsive updates
 */
const handleTemplateImport = () => {
  console.log('📥 [handleTemplateImport] Start execution')
  console.log('📥 [handleTemplateImport] currentApiInfo:', props.currentApiInfo)
  console.log('📥 [handleTemplateImport] modelValue:', props.modelValue)

  if (!props.currentApiInfo) {
    console.warn('⚠️ [handleTemplateImport] currentApiInfo is empty，Use default parameters')
    // provide defaultdeviceIdParameters as placeholders
    const defaultParam = createDefaultParameter()
    defaultParam.key = 'deviceId'
    defaultParam.description = 'equipmentID（Common parameters）'
    defaultParam.selectedTemplate = 'manual'
    defaultParam.valueMode = ParameterTemplateType.MANUAL

    const updatedParams = [...props.modelValue, defaultParam]

    // 🔥 Immediately fire an update event
    emit('update:modelValue', updatedParams)

    // 🔥 Force refresh of component state
    nextTick(() => {
      editingIndex.value = updatedParams.length - 1
    })

    return
  }

  // Generate parameters based on interface information
  const apiInfo = props.currentApiInfo
  let templateParams: EnhancedParameter[] = []

  console.log('📥 [handleTemplateImport] apiInfo.commonParams:', apiInfo.commonParams)
  console.log('📥 [handleTemplateImport] apiInfo.pathParamNames:', apiInfo.pathParamNames)

  // fromcommonParamsGenerate parameters
  if (apiInfo.commonParams && apiInfo.commonParams.length > 0) {
    const pathParamNames = apiInfo.pathParamNames || []
    let filteredParams = apiInfo.commonParams

    // 🔥 critical fix：according to parameterType Decide on filtering rules
    if (props.parameterType === 'query') {
      // query parameters：Filter out path parameters
      filteredParams = apiInfo.commonParams.filter(param => !pathParamNames.includes(param.name))
      console.log('📥 [handleTemplateImport] Query parameter mode，Filter out path parameters')
    } else if (props.parameterType === 'path') {
      // path parameters：Only keep path parameters
      filteredParams = apiInfo.commonParams.filter(param => pathParamNames.includes(param.name))
      console.log('📥 [handleTemplateImport] path parameter mode，Only keep path parameters')
    } else {
      // header and other types：keep all parameters
      console.log('📥 [handleTemplateImport] Other parameter modes，keep all parameters')
    }

    console.log('📥 [handleTemplateImport] filteredParams（After filtering）:', filteredParams)

    templateParams = filteredParams.map(param => {
      const enhancedParam = createDefaultParameter()
      enhancedParam.key = param.name
      enhancedParam.description = param.description || `${param.name}parameter`
      enhancedParam.dataType =
        param.type === 'string'
          ? 'string'
          : param.type === 'number'
            ? 'number'
            : param.type === 'boolean'
              ? 'boolean'
              : param.type === 'object'
                ? 'string' // objectType conversion tostring
                : 'string'
      enhancedParam.selectedTemplate = 'manual'
      enhancedParam.valueMode = ParameterTemplateType.MANUAL
      // 🔥 New：useexampleas initial value
      enhancedParam.value = param.example || ''
      enhancedParam.defaultValue = param.example
      return enhancedParam
    })
  } else {
    console.log('📥 [handleTemplateImport] none commonParams，Use default parameters')
    // Provide reasonable default parameters based on the interface type
    const defaultParam = createDefaultParameter()

    if (apiInfo.url.includes('device')) {
      defaultParam.key = 'deviceId'
      defaultParam.description = 'equipmentID'
    } else if (apiInfo.url.includes('group')) {
      defaultParam.key = 'groupId'
      defaultParam.description = 'GroupID'
    } else if (apiInfo.url.includes('user')) {
      defaultParam.key = 'userId'
      defaultParam.description = 'userID'
    } else {
      defaultParam.key = 'id'
      defaultParam.description = 'identifier'
    }

    defaultParam.selectedTemplate = 'manual'
    defaultParam.valueMode = ParameterTemplateType.MANUAL
    templateParams = [defaultParam]
  }

  console.log('📥 [handleTemplateImport] generated templateParams:', templateParams)

  // Merge into existing parameter list
  const updatedParams = [...props.modelValue, ...templateParams]

  console.log('📥 [handleTemplateImport] After the merger updatedParams:', updatedParams)

  // 🔥 Immediately fire an update event
  emit('update:modelValue', updatedParams)

  // 🔥 Force refresh of component state
  nextTick(() => {
    // Automatically expand the latest added parameters for editing
    if (templateParams.length > 0) {
      editingIndex.value = updatedParams.length - templateParams.length
    }
    console.log('✅ [handleTemplateImport] Finish，editingIndex set to:', editingIndex.value)
  })
}

/**
 * Delete parameters - Force responsive updates
 */
const removeParameter = (index: number) => {
  const updatedParams = props.modelValue.filter((_, i) => i !== index)

  // 🔥 Immediately fire an update event
  emit('update:modelValue', updatedParams)

  // 🔥 Force refresh of component state
  nextTick(() => {
    // If you are deleting an item you are editing，then close the editing state
    if (editingIndex.value === index) {
      editingIndex.value = -1
    }
  })
}

/**
 * Handling parameters added from the device
 */
const handleAddFromDevice = (params: any[]) => {
  if (params && params.length > 0) {
    // Check parameter limit
    const currentCount = props.modelValue.length
    const availableSlots = props.maxParameters ? props.maxParameters - currentCount : Infinity

    if (availableSlots <= 0) {
      return
    }

    // Convert device parameters to standard parameter format
    const newParams = params.slice(0, availableSlots).map(param => ({
      key: param.key || param.metricsId || '',
      value: param.source ? `${param.source.deviceName}.${param.source.metricsName}` : param.value || '',
      enabled: true,
      valueMode: ParameterTemplateType.COMPONENT,
      selectedTemplate: 'device-dispatch-selector',
      dataType: 'string',
      variableName: param.source ? generateVariableName(param.key || param.metricsId || '') : '',
      description: param.source ? `equipment: ${param.source.deviceName}, index: ${param.source.metricsName}` : ''
    }))

    // Merge into existing parameter list
    const updatedParams = [...props.modelValue, ...newParams]
    emit('update:modelValue', updatedParams)

    // Automatically expand the latest added parameters for editing
    if (newParams.length > 0) {
      nextTick(() => {
        editingIndex.value = updatedParams.length - 1
      })
    }
  }

  isAddFromDeviceDrawerVisible.value = false
}

/**
 * 🔥 New：Handle new device parameter selector completion event
 */
const handleDeviceParametersSelected = (parameters: EnhancedParameter[]) => {
  // Merge into existing parameter list
  const updatedParams = [...props.modelValue, ...parameters]
  emit('update:modelValue', updatedParams)

  // Automatically expand the first newly added parameter for editing
  if (parameters.length > 0) {
    nextTick(() => {
      editingIndex.value = updatedParams.length - parameters.length
    })
  }

  // Close selector
  isDeviceParameterSelectorVisible.value = false
}

/**
 * 🔥 New：Processing parameters generated by unified device configuration - Force responsive updates
 */
const handleUnifiedDeviceConfigGenerated = (parameters: EnhancedParameter[]) => {
  let finalParams: EnhancedParameter[]

  if (isEditingDeviceConfig.value) {
    // edit mode：First remove existing device related parameters，Add new parameters
    const updatedParams = removeDeviceRelatedParameters()
    finalParams = [...updatedParams, ...parameters]
  } else {
    // New mode：Merge parameters，Automatically remove duplicates
    finalParams = mergeParametersWithDeduplication(parameters)
  }

  // 🔥 Immediately fire an update event
  emit('update:modelValue', finalParams)

  // 🔥 Force refresh of component state
  nextTick(() => {
    // Automatically expand the first newly added parameter for editing
    if (parameters.length > 0) {
      editingIndex.value = finalParams.length - parameters.length
    }
  })

  // Close selector
  isUnifiedDeviceConfigVisible.value = false
  isEditingDeviceConfig.value = false
}

/**
 * 🔥 Remove existing device related parameters
 */
const removeDeviceRelatedParameters = () => {
  const deviceRelatedKeys = ['deviceId', 'metric', 'deviceLocation', 'deviceStatus']
  return props.modelValue.filter(param => !deviceRelatedKeys.includes(param.key))
}

/**
 * 🔥 Merge parameters and remove duplicates（Only new parameters with the same key are retained） - Force responsive updates
 */
const mergeParametersWithDeduplication = (newParameters: EnhancedParameter[]) => {
  const newParamKeys = new Set(newParameters.map(p => p.key))

  // Remove existing parameters with the same key as the new parameter
  const filteredExisting = props.modelValue.filter(param => !newParamKeys.has(param.key))

  // merge
  const mergedParams = [...filteredExisting, ...newParameters]

  return mergedParams
}

/**
 * 🔥 Check whether device related parameters already exist
 */
const getExistingDeviceParameters = () => {
  const deviceRelatedKeys = ['deviceId', 'metric', 'deviceLocation', 'deviceStatus']
  return props.modelValue.filter(param => deviceRelatedKeys.includes(param.key))
}

/**
 * 🔥 Handle device configuration editing/New
 */
const editDeviceConfig = () => {
  const existingParams = getExistingDeviceParameters()
  if (existingParams.length > 0) {
    isEditingDeviceConfig.value = true
  } else {
    isEditingDeviceConfig.value = false
  }
  isUnifiedDeviceConfigVisible.value = true
}

/**
 * 🔥 New：Handling parameter group update events（edit mode）
 */
const handleParametersUpdated = (data: { groupId: string; parameters: EnhancedParameter[] }) => {
  // Find the parameters of the original parameter group and replace them
  const groupParams = globalParameterGroupManager.getGroupParameters(data.groupId, props.modelValue)
  const groupParamIds = groupParams.map(p => p._id)

  // Remove parameters from the original parameter group
  let updatedParams = props.modelValue.filter(param => !groupParamIds.includes(param._id))

  // Add new parameters
  updatedParams = [...updatedParams, ...data.parameters]

  emit('update:modelValue', updatedParams)

  // Close selector
  isDeviceParameterSelectorVisible.value = false
  editingGroupInfo.value = null
}

/**
 * 🔥 New：Check if the parameter belongs to the device parameter group
 */
const isDeviceParameterGroup = (param: EnhancedParameter): boolean => {
  return param.parameterGroup?.groupId !== undefined && param.deviceContext?.sourceType === 'device-selection'
}

/**
 * 🔥 New：Get the display label of a parameter（With parameter group information）
 */
const getParameterDisplayLabel = (param: EnhancedParameter): string => {
  if (!isDeviceParameterGroup(param)) {
    return param.key || 'unnamed parameter'
  }

  const role = param.parameterGroup?.role
  const groupInfo = globalParameterGroupManager.getGroup(param.parameterGroup!.groupId)
  const sourceType = groupInfo?.sourceType

  let prefix = ''
  switch (sourceType) {
    case 'device-id':
      prefix = '📱 equipment'
      break
    case 'device-metric':
      prefix = '📊 index'
      break
    case 'telemetry':
      prefix = '📡 telemetry'
      break
    default:
      prefix = '🔧 parameter'
  }

  let suffix = ''
  if (role === 'primary') suffix = ' (host)'
  else if (role === 'secondary') suffix = ' (Second-rate)'

  return `${prefix}: ${param.key}${suffix}`
}

/**
 * 🔥 New：Process parameter group editing
 */
const editParameterGroup = (param: EnhancedParameter) => {
  if (!isDeviceParameterGroup(param)) return

  const groupId = param.parameterGroup!.groupId
  const groupInfo = globalParameterGroupManager.getGroup(groupId)

  if (!groupInfo) {
    return
  }

  // Prepare to edit information
  editingGroupInfo.value = {
    groupId,
    preSelectedDevice: groupInfo.sourceConfig.selectedDevice,
    preSelectedMetric: groupInfo.sourceConfig.selectedMetric,
    preSelectedMode: groupInfo.sourceType
  }

  // Open the device parameter selector
  isDeviceParameterSelectorVisible.value = true
}

/**
 * 🔥 New：Delete entire parameter group
 */
const deleteParameterGroup = (param: EnhancedParameter) => {
  if (!isDeviceParameterGroup(param)) return

  const groupId = param.parameterGroup!.groupId
  const groupParams = globalParameterGroupManager.getGroupParameters(groupId, props.modelValue)
  const groupParamIds = groupParams.map(p => p._id)

  // Remove all relevant parameters
  const updatedParams = props.modelValue.filter(param => !groupParamIds.includes(param._id))
  emit('update:modelValue', updatedParams)

  // Clean up parameter group manager
  globalParameterGroupManager.removeGroup(groupId)
}

/**
 * Switch the editing status of parameters
 */
const toggleEditMode = (index: number) => {
  editingIndex.value = editingIndex.value === index ? -1 : index
}

// 🔥 New：Anti-shake timer is used to delay updating parameterskey
const updateKeyTimers = new Map<string, NodeJS.Timeout>()

/**
 * Update the parameters of the specified index
 */
const updateParameter = (param: EnhancedParameter, index: number) => {
  const updatedParams = [...props.modelValue]
  updatedParams[index] = { ...param }


  emit('update:modelValue', updatedParams)
}

/**
 * 🔥 New：Update parameterskeyanti-shake processing
 * Avoid triggering re-rendering every time input causes focus loss
 */
const updateParameterKey = (param: EnhancedParameter, index: number, newKey: string) => {
  // Update local display now，Avoid input lag
  const updatedParams = [...props.modelValue]
  updatedParams[index] = { ...param, key: newKey }
  emit('update:modelValue', updatedParams)

  // Clear previous timer
  const timerId = param._id || `param-${index}`
  if (updateKeyTimers.has(timerId)) {
    clearTimeout(updateKeyTimers.get(timerId)!)
    updateKeyTimers.delete(timerId)
  }
}

/**
 * 🔥 New：Make sure parameterskeyNot empty，Check when focus is lost
 * If empty reverts to sensible defaults，Instead of overwriting user input
 */
const ensureParameterKeyNotEmpty = (param: EnhancedParameter, index: number) => {
  // only ifkeySet default value only when it is completely empty，Avoid overwriting user input
  if (!param.key || param.key.trim() === '') {
    const defaultKey = `param${index + 1}`
    updateParameter({ ...param, key: defaultKey }, index)
  }
}

/**
 * 🔥 New：Update parametersvalueanti-shake processing
 * Update display now，Avoid input lag
 */
const updateParameterValue = (param: EnhancedParameter, index: number, newValue: string) => {
  // Update display now，Keep input flowing
  const updatedParams = [...props.modelValue]
  updatedParams[index] = { ...param, value: newValue }
  emit('update:modelValue', updatedParams)
}

/**
 * 🔥 New：Ensure that all parameters have stable_id
 * For compatibility with no_idhistorical parameters
 */
const ensureParameterHasId = (param: EnhancedParameter, index: number): EnhancedParameter => {
  if (!param._id) {
    return {
      ...param,
      // 🔥 critical fix：make sureisDynamicField has correct value
      isDynamic: param.isDynamic !== undefined
        ? param.isDynamic
        : (param.valueMode === 'component' ||
           param.selectedTemplate === 'component-property-binding' ||
           // Detect binding path format
           (typeof param.value === 'string' &&
            param.value.includes('.') &&
            param.value.split('.').length >= 3 &&
            param.value.length > 10)),
      _id: `param_legacy_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 6)}`
    }
  }
  return param
}

/**
 * Handle template changes
 */
const onTemplateChange = (param: EnhancedParameter, index: number, templateId: string) => {
  const template = getTemplateById(templateId)
  if (!template) return

  // 🔥 repair：If you select a device configuration template，Open the unified device configuration selector
  if (templateId === 'device-metrics-selector') {
    // Close current parameter editing
    editingIndex.value = -1

    // Open the unified device configuration selector，Set to edit mode
    isUnifiedDeviceConfigVisible.value = true
    isEditingDeviceConfig.value = true

    return // Do not continue with ordinary template switching logic
  }

  const updatedParam = { ...param }
  updatedParam.selectedTemplate = templateId
  updatedParam.valueMode = template.type

  // 🔥 repair：distinguishvalueanddefaultValue，Avoid string splicing problems caused by incorrect assignments
  if (template.type === ParameterTemplateType.COMPONENT) {
    // Component property binding：Do not modify existingvalue（Binding path entered by user）
    // only invalueUse the template default value as the initial value when it is empty.
    if (!updatedParam.value && template.defaultValue !== undefined) {
      updatedParam.value = template.defaultValue
    }
    // make suredefaultValueFields set correctly
    if (template.defaultValue !== undefined && !updatedParam.defaultValue) {
      updatedParam.defaultValue = template.defaultValue
    }
  } else {
    // Other template types：Use template defaults directly
    if (template.defaultValue !== undefined) {
      updatedParam.value = template.defaultValue
    }
  }

  if (template.type === ParameterTemplateType.PROPERTY) {
    if (param.key) {
      updatedParam.variableName = generateVariableName(param.key)
      updatedParam.description = updatedParam.description || `${getTypeDisplayName()}parameter：${param.key}`
    }
    updatedParam.isDynamic = true // 🔥 critical fix：Set as dynamic parameter
  } else if (template.type === ParameterTemplateType.COMPONENT) {
    // 🔥 repair：Property binding template - Make sure editing status and drawers show up immediately
    updatedParam.isDynamic = true // 🔥 critical fix：Set as dynamic parameter
    editingIndex.value = index

    // Update parameters first
    updateParameter(updatedParam, index)

    // Open drawer now，not dependent on nextTick
    nextTick(() => {
      openComponentDrawer(updatedParam)
    })
    return // Return early，Avoid repeated calls updateParameter
  } else {
    updatedParam.variableName = ''
    updatedParam.description = ''
    updatedParam.isDynamic = false // 🔥 critical fix：Other templates are static parameters
  }

  updateParameter(updatedParam, index)
}

/**
 * Open the component edit drawer
 */
const openComponentDrawer = (param: EnhancedParameter) => {
  drawerParam.value = { ...param }
  isDrawerVisible.value = true
}

/**
 * Handle component property selection changes
 * Called when the user selects a property in the component property selector
 */
const handleComponentPropertyChange = (bindingPath: string, propertyInfo?: any) => {

  if (!drawerParam.value) {
    console.warn(`⚠️ [DynamicParameterEditor] drawerParam is empty，Ignore property changes`)
    return
  }

  // 🔥 Enhanced binding path validation：Stricter format checking
  const isValidBindingPath = bindingPath === '' || (
    typeof bindingPath === 'string' &&
    bindingPath.includes('.') &&
    bindingPath.split('.').length >= 3 && // Contains at least componentsID.layer.property
    bindingPath.length > 10 && // Binding paths are usually longer
    !/^\d{1,4}$/.test(bindingPath) && // Reject short numeric strings（like"12"、"789"）
    !bindingPath.includes('undefined') && // refuse to includeundefinedpath
    !bindingPath.includes('null') && // refuse to includenullpath
    /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_.-]+$/.test(bindingPath) // Basic format validation
  )

  if (!isValidBindingPath && bindingPath !== '') {
    console.error(`❌ [DynamicParameterEditor] Invalid detectedbindingPathFormat，Perform automatic recovery:`, {
      enterValue: bindingPath,
      valueType: typeof bindingPath,
      valueLength: typeof bindingPath === 'string' ? bindingPath.length : 'non-string',
      expectedFormat: 'componentId.layer.propertyName',
      currentParameters: {
        key: drawerParam.value.key,
        currentValue: drawerParam.value.value,
        variableName: drawerParam.value.variableName
      }
    })

    // 🔥 automatic recovery mechanism：try to start fromvariableNameRebuild the correct binding path
    if (drawerParam.value.variableName && drawerParam.value.variableName.includes('_')) {
      const lastUnderscoreIndex = drawerParam.value.variableName.lastIndexOf('_')
      if (lastUnderscoreIndex > 0) {
        const componentId = drawerParam.value.variableName.substring(0, lastUnderscoreIndex)
        const propertyName = drawerParam.value.variableName.substring(lastUnderscoreIndex + 1)
        const recoveredPath = `${componentId}.base.${propertyName}`


        // Replace incorrect input with recovered path
        bindingPath = recoveredPath
      } else {
        console.error(`❌ [DynamicParameterEditor] Unable to access fromvariableNamerestore binding path，Reject updates`)
        return
      }
    } else {
      // Unable to recover，Keep current value unchanged
      console.error(`❌ [DynamicParameterEditor] No variable name available for recovery，Refuse to set invalid binding path`)
      return
    }
  }

  // Record value change history，Easy to debug
  const oldValue = drawerParam.value.value

  // Update the bound value of a parameter in the drawer
  drawerParam.value.value = bindingPath

  // Update parameter descriptions and variable names
  if (propertyInfo && bindingPath) {
    drawerParam.value.description = `Bind to component properties: ${propertyInfo.componentName} -> ${propertyInfo.propertyLabel}`
    drawerParam.value.variableName = `${propertyInfo.componentId}_${propertyInfo.propertyName}`

  } else if (bindingPath === '') {
    // When clearing bindings，Also clean related fields
    drawerParam.value.description = ''
    drawerParam.value.variableName = ''
  }

}

/**
 * Save changes made from drawer
 */
const saveDrawerChanges = () => {
  if (drawerParam.value && editingIndex.value !== -1) {

    updateParameter(drawerParam.value, editingIndex.value)
  }
  isDrawerVisible.value = false
  drawerParam.value = null
}

/**
 * Get parameter type display name
 */
const getTypeDisplayName = () => {
  const names = { header: 'Request header', query: 'Query', path: 'path' }
  return names[props.parameterType]
}

/**
 * Get the drop-down options of the current template
 */
const getCurrentTemplateOptions = (param: EnhancedParameter) => {
  if (param.valueMode !== ParameterTemplateType.DROPDOWN || !param.selectedTemplate) return []
  const template = getTemplateById(param.selectedTemplate)
  return template?.options || []
}

/**
 * Check if the template allows custom input
 */
const isCustomInputAllowed = (param: EnhancedParameter) => {
  if (param.valueMode !== ParameterTemplateType.DROPDOWN || !param.selectedTemplate) return false
  const template = getTemplateById(param.selectedTemplate)
  return template?.allowCustom || false
}

/**
 * Get component template configuration
 * 🔥 repair：dynamic injectioncurrentComponentIdarriveComponentPropertySelector
 */
const getComponentTemplate = (param: EnhancedParameter | null) => {
  if (!param || !param.selectedTemplate) return null
  const template = getTemplateById(param.selectedTemplate)
  const config = template?.componentConfig
  if (!config) return null

  const component =
    typeof config.component === 'string'
      ? componentMap[config.component as keyof typeof componentMap]
      : config.component

  // 🔥 critical fix：forComponentPropertySelectordynamic injectioncurrentComponentId
  let enhancedProps = { ...config.props }

  if (config.component === 'ComponentPropertySelector' ||
      (typeof config.component === 'string' && config.component === 'ComponentPropertySelector')) {
    enhancedProps = {
      ...enhancedProps,
      currentComponentId: props.currentComponentId, // 🔥 Pass the current componentID
      autoDetectComponentId: true // 🔥 Keep auto-detection function
    }

  }

  return {
    ...config,
    component,
    props: enhancedProps // 🔥 Use the enhancedprops
  }
}

// 🔥 Remove recurring updateswatchlistener，Avoid values ​​being overwritten by errors
// reason：thiswatchWill listendrawerParam.value.valuechanges，then reset yourself，May cause data corruption
// ComponentPropertySelectorpassv-model:valueand@changeEvents have correctly handled data updates
</script>

<template>
  <div :class="['dynamic-parameter-editor-v3', customClass]">
    <!-- Title and add button -->
    <div class="editor-header">
      <span v-if="title" class="editor-title">{{ title }}</span>
      <n-space>
        <!-- Device configuration button（Main operations） -->
        <n-button
          size="small"
          :type="getExistingDeviceParameters().length > 0 ? 'warning' : 'info'"
          @click="editDeviceConfig"
        >
          <template #icon>
            <n-icon><DeviceIcon /></n-icon>
          </template>
          {{
            getExistingDeviceParameters().length > 0 ? `Device configuration (${getExistingDeviceParameters().length})` : 'Device configuration'
          }}
        </n-button>

        <!-- Add parameter button -->
        <n-dropdown
          trigger="click"
          :options="addParameterOptions"
          :disabled="!canAddMoreParameters"
          @select="handleSelectAddOption"
        >
          <n-button size="small" type="primary" :disabled="!canAddMoreParameters">
            <template #icon>
              <n-icon><add-icon /></n-icon>
            </template>
            {{ addButtonText }}
            <span v-if="maxParameters && !canAddMoreParameters" class="limit-text">
              ({{ modelValue.length }}/{{ maxParameters }})
            </span>
          </n-button>
        </n-dropdown>
      </n-space>
    </div>

    <!-- Equipment parameter prompts（If there are device related parameters） -->
    <div v-if="getExistingDeviceParameters().length > 0" class="device-config-info">
      <n-alert type="info" size="small" :show-icon="false">
        <template #header>
          <n-space align="center">
            <n-icon size="16"><DeviceIcon /></n-icon>
            <span>Current device configuration</span>
          </n-space>
        </template>
        <n-space>
          <n-tag v-for="param in getExistingDeviceParameters()" :key="param.key" size="small" type="info">
            {{ param.key }}: {{ param.value }}
          </n-tag>
        </n-space>
        <template #action>
          <n-button size="small" text type="primary" @click="editDeviceConfig">Reconfigure</n-button>
        </template>
      </n-alert>
    </div>

    <!-- Parameter list -->
    <div v-if="parametersWithStableIds.length > 0" class="parameter-list">
      <div
        v-for="(param, index) in parametersWithStableIds"
        :key="param._id"
        class="parameter-item"
        :class="{
          'is-editing': editingIndex === index,
          'is-device-param-group': isDeviceParameterGroup(param),
          'is-primary-param': isDeviceParameterGroup(param) && param.parameterGroup!.role === 'primary',
          'is-secondary-param': isDeviceParameterGroup(param) && param.parameterGroup!.role !== 'primary'
        }"
      >
        <!-- Main row -->
        <div class="parameter-row">
          <!-- Parameter group identifier（If it is a parameter of the parameter group） -->
          <div v-if="isDeviceParameterGroup(param)" class="param-group-indicator">
            <n-icon size="14" color="#2080f0">
              <PhonePortraitOutline />
            </n-icon>
          </div>

          <n-checkbox
            v-if="showEnabled"
            :checked="param.enabled"
            @update:checked="value => updateParameter({ ...param, enabled: value }, index)"
          />

          <n-input
            :value="param.key"
            :placeholder="keyPlaceholder"
            size="small"
            class="param-key-input"
            @input="value => updateParameterKey(param, index, value)"
            @blur="() => ensureParameterKeyNotEmpty(param, index)"
          />

          <!-- Parameter value display（Enhanced version，Contains parameter group information） -->
          <div class="param-value-display">
            <n-text class="param-value-summary" depth="3">
              {{ getParameterDisplayLabel(param) }}
            </n-text>
            <!-- Parameter group role ID -->
            <n-tag
              v-if="isDeviceParameterGroup(param)"
              size="small"
              :type="param.parameterGroup!.role === 'primary' ? 'primary' : 'info'"
              class="param-role-tag"
            >
              {{ param.parameterGroup!.role === 'primary' ? 'Main parameters' : 'Subparameters' }}
            </n-tag>
          </div>

          <!-- Action button（Distinguish between parameter groups and ordinary parameters） -->
          <n-space class="param-actions">
            <!-- Common parameter operations -->
            <template v-if="!isDeviceParameterGroup(param)">
              <n-button size="small" @click="toggleEditMode(index)">
                {{ editingIndex === index ? 'close' : 'Configuration' }}
              </n-button>
              <n-button size="small" type="error" ghost @click="removeParameter(index)">delete</n-button>
            </template>

            <!-- Parameter group operations（Only displayed on main parameters） -->
            <template v-else-if="param.parameterGroup!.role === 'primary'">
              <n-button size="small" type="info" ghost @click="editParameterGroup(param)">
                <template #icon>
                  <n-icon><EditOutline /></n-icon>
                </template>
                Editing group
              </n-button>
              <n-button size="small" type="error" ghost @click="deleteParameterGroup(param)">
                <template #icon>
                  <n-icon><TrashOutline /></n-icon>
                </template>
                Delete group
              </n-button>
            </template>

            <!-- Subparameter operation（Simplified version） -->
            <template v-else>
              <n-text depth="3" style="font-size: 12px; font-style: italic">Belongs to the device parameter group</n-text>
            </template>
          </n-space>
        </div>

        <!-- Detailed configuration panel (Foldable) -->
        <div v-if="editingIndex === index" class="details-panel">
          <!-- Template selection（Simplified version：Show only the most commonly used options） -->
          <div class="detail-row">
            <n-text class="detail-label">type</n-text>
            <n-select
              :value="param.selectedTemplate"
              :options="
                recommendedTemplates.map(t => ({
                  label: t.name,
                  value: t.id,
                  description: t.description
                }))
              "
              size="small"
              @update:value="templateId => onTemplateChange(param, index, templateId)"
            />
          </div>

          <!-- Value input（Simplified version） -->
          <div class="detail-row">
            <n-text class="detail-label">value</n-text>
            <!-- Manual entry -->
            <n-input
              v-if="param.valueMode === 'manual'"
              :value="param.value"
              :placeholder="valuePlaceholder"
              size="small"
              @input="value => updateParameterValue(param, index, value)"
            />
            <!-- drop down selection -->
            <n-select
              v-else-if="param.valueMode === 'dropdown'"
              :value="param.value"
              :options="getCurrentTemplateOptions(param)"
              :filterable="isCustomInputAllowed(param)"
              :tag="isCustomInputAllowed(param)"
              size="small"
              placeholder="Select or enter a value"
              @update:value="value => updateParameter({ ...param, value: value }, index)"
            />
            <!-- Property binding（Simplified display） -->
            <div v-else-if="param.valueMode === 'property'" class="property-input-simple">
              <n-input
                :value="param.value"
                placeholder="Example value (Runtime replacement)"
                size="small"
                @input="value => updateParameterValue(param, index, value)"
              />
            </div>
            <!-- Component property binding（Simplified display） -->
            <div v-else-if="param.valueMode === 'component'" class="component-simple">
              <n-space>
                <n-tag size="small" type="success">
                  {{ param.selectedTemplate === 'component-property-binding' ? 'Property binding' : 'Equipment parameters' }}
                </n-tag>
                <n-text depth="3">{{ param.value || 'not set' }}</n-text>
                <!-- 🔥 Add reconfiguration button -->
                <n-button size="tiny" type="primary" text @click="openComponentDrawer(param)">Reconfigure</n-button>
              </n-space>
            </div>
          </div>

          <!-- Property binding simplified tips -->
          <div v-if="param.valueMode === 'property'" class="property-binding-tip">
            <n-alert size="small" type="info" :show-icon="false">
              <template #header>
                <n-icon style="margin-right: 4px"><SparkleIcon /></n-icon>
                Property binding
              </template>
              The runtime will get the actual value from the component property
            </n-alert>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <n-text depth="3">No parameters yet，Click"{{ addButtonText }}"Add to</n-text>
    </div>

    <!-- Add parameter drawer from device -->
    <n-drawer v-model:show="isAddFromDeviceDrawerVisible" :width="500">
      <n-drawer-content title="Add parameters from device" closable>
        <AddParameterFromDevice @add="handleAddFromDevice" @cancel="isAddFromDeviceDrawerVisible = false" />
      </n-drawer-content>
    </n-drawer>

    <!-- Component edit drawer -->
    <n-drawer v-model:show="isDrawerVisible" :width="500" :on-after-leave="() => (drawerParam = null)">
      <n-drawer-content :title="`edit ${getComponentTemplate(drawerParam)?.name || 'parameter'}`" closable>
        <template v-if="drawerParam">
          <!-- Component attribute selector -->
          <component
            :is="getComponentTemplate(drawerParam)?.component"
            v-if="getComponentTemplate(drawerParam)?.component"
            :value="drawerParam.value"
            v-bind="getComponentTemplate(drawerParam)?.props || {}"
            @change="handleComponentPropertyChange"
          />
          <div v-else>Component loading failed</div>

          <!-- Default value input box -->
          <div v-if="drawerParam.selectedTemplate === 'component-property-binding'" style="margin-top: 16px">
            <n-divider />
            <div style="margin-bottom: 8px">
              <n-text strong>Default value settings</n-text>
              <n-text depth="3" style="font-size: 12px; margin-left: 8px">Used when the bound component property is empty</n-text>
            </div>
            <n-input v-model:value="drawerParam.defaultValue" placeholder="Please enter default value（Optional）" clearable />
            <n-text depth="3" style="font-size: 12px; margin-top: 4px; display: block">
              💡 hint：If the component property value is empty（null、undefinedor empty string），This default value will be used
            </n-text>
          </div>
        </template>
        <template #footer>
          <n-button @click="isDrawerVisible = false">Cancel</n-button>
          <n-button type="primary" @click="saveDrawerChanges">Sure</n-button>
        </template>
      </n-drawer-content>
    </n-drawer>

    <!-- 🔥 Unified device configuration selector -->
    <n-drawer v-model:show="isUnifiedDeviceConfigVisible" width="650" placement="right">
      <n-drawer-content title="Device configuration" closable>
        <UnifiedDeviceConfigSelector
          :existing-parameters="getExistingDeviceParameters()"
          :edit-mode="isEditingDeviceConfig"
          @parameters-generated="handleUnifiedDeviceConfigGenerated"
          @cancel="
            () => {
              isUnifiedDeviceConfigVisible = false
              isEditingDeviceConfig = false
            }
          "
        />
      </n-drawer-content>
    </n-drawer>

    <!-- 🔥 New device parameter selector（Keep compatible） -->
    <DeviceParameterSelector
      :visible="isDeviceParameterSelectorVisible"
      :editing-group-id="editingGroupInfo?.groupId"
      :pre-selected-device="editingGroupInfo?.preSelectedDevice"
      :pre-selected-metric="editingGroupInfo?.preSelectedMetric"
      :pre-selected-mode="editingGroupInfo?.preSelectedMode"
      @update:visible="isDeviceParameterSelectorVisible = $event"
      @parameters-selected="handleDeviceParametersSelected"
      @parameters-updated="handleParametersUpdated"
    />
  </div>
</template>

<style scoped>
.dynamic-parameter-editor-v3 {
  width: 100%;
  font-size: 12px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.editor-title {
  font-size: 14px;
  font-weight: 500;
}

/* 🔥 Device configuration information area */
.device-config-info {
  margin-bottom: 16px;
}

.parameter-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.parameter-item {
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.parameter-item.is-editing {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color-suppl);
}

/* 🔥 Parameter group style enhancement */
.parameter-item.is-device-param-group {
  border-left: 3px solid var(--primary-color);
  background: linear-gradient(90deg, var(--primary-color-suppl) 0%, var(--card-color) 30%);
}

.parameter-item.is-primary-param {
  border-left-color: var(--primary-color);
  box-shadow: 0 2px 4px rgba(32, 128, 240, 0.1);
}

.parameter-item.is-secondary-param {
  border-left-color: var(--info-color);
  margin-left: 16px;
  position: relative;
}

.parameter-item.is-secondary-param::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 50%;
  width: 12px;
  height: 1px;
  background: var(--border-color);
  transform: translateY(-50%);
}

.parameter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.param-key-input {
  width: 150px;
}

/* 🔥 Parameter group indicator style */
.param-group-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--primary-color-suppl);
  border-radius: 4px;
  flex-shrink: 0;
}

/* Enhanced parameter value display area */
.param-value-display {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.param-value-summary {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-color-3);
}

/* Parameter role identifier */
.param-role-tag {
  flex-shrink: 0;
  font-size: 10px;
  padding: 2px 6px;
}

.param-actions {
  margin-left: auto;
  flex-shrink: 0;
}

.details-panel {
  padding: 12px;
  border-top: 1px solid var(--border-color);
  background: var(--body-color);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: grid;
  grid-template-columns: 80px 1fr;
  align-items: center;
  gap: 8px;
}

.detail-label {
  font-weight: 500;
  color: var(--text-color-2);
}

.component-placeholder {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: var(--action-color);
  border-radius: 4px;
  width: 100%;
}

/* Simplified version of property binding prompt style */
.property-binding-tip {
  margin-top: 8px;
}

.property-binding-tip :deep(.n-alert) {
  --n-padding: 8px 12px;
  --n-font-size: 12px;
}

.property-binding-tip :deep(.n-alert__header) {
  display: flex;
  align-items: center;
  font-weight: 500;
}

/* Simplified style */
.property-input-simple {
  width: 100%;
}

.component-simple {
  display: flex;
  align-items: center;
  padding: 4px;
  background: var(--success-color-suppl);
  border-radius: 4px;
}

.empty-state {
  padding: 24px;
  text-align: center;
  background: var(--body-color);
  border: 1px dashed var(--border-color);
  border-radius: 6px;
}
</style>
