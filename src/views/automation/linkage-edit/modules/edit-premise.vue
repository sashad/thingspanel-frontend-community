<script setup lang="ts">
import { onMounted, ref, watch, onBeforeUpdate, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NFlex, useMessage } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import { IosAlert, IosRefresh } from '@vicons/ionicons4'
import { repeat } from 'seemly'
import { deviceGroupTree } from '@/service/api'
import {
  configMetricsConditionMenu,
  deviceConfigAll,
  deviceListAll,
  deviceMetricsConditionMenu
} from '@/service/api/automation'
import { $t } from '@/locales'
import { useI18n } from 'vue-i18n'

interface Emits {
  (e: 'conditionChose', data: any): void
}

const route = useRoute()
const emit = defineEmits<Emits>()
const { locale } = useI18n()

const premiseFormRef = ref<FormInst | null>(null)
const premiseForm = ref({
  ifGroups: [] as any
})
// Scenario form rules
const premiseFormRules = ref({
  ifType: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  trigger_conditions_type: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  trigger_source: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  trigger_param: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  trigger_operator: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  trigger_value: {
    required: true,
    message: $t('common.input'),
    trigger: 'blur'
  },
  minValue: {
    required: true,
    message: $t('common.input'),
    trigger: 'blur'
  },
  maxValue: {
    required: true,
    message: $t('common.input'),
    trigger: 'blur'
  },
  onceTimeValue: {
    required: true,
    message: $t('common.select')
  },
  expiration_time: {
    required: true,
    message: $t('common.select')
  },
  task_type: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  hourTimeValue: {
    required: true,
    message: $t('common.select')
  },
  dayTimeValue: {
    required: true,
    message: $t('common.select')
  },
  weekChoseValue: {
    required: true,
    message: $t('common.select')
  },
  weekTimeValue: {
    required: true,
    message: $t('common.select')
  },
  monthChoseValue: {
    required: true,
    message: $t('common.select')
  },
  monthTimeValue: {
    required: true,
    message: $t('common.select')
  },
  startTimeValue: {
    required: true,
    message: $t('common.select')
  },
  endTimeValue: {
    required: true,
    message: $t('common.select')
  },
  weatherValue: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  }
})

/** ifgrouped data type */
// Option one condition type drop-down
// const ifTypeOptions = ref([
//   {
//     label: $t('common.deviceConditions'),
//     value: '1'
//   },
//   {
//     label: $t('common.timeConditions'),
//     value: '2'
//   }
//   // {
//   //   label: 'Conditions of service',
//   //   value: '3'
//   // }
// ]);

const getIfTypeOptions = (ifGroup, ifIndex) => {
  return [
    {
      label: $t('common.deviceConditions'),
      value: '1',
      disabled: ifGroup.some(item => {
        return (item.trigger_conditions_type === '20' || item.trigger_conditions_type === '21') && ifIndex > 0
      })
    },
    {
      label: $t('common.timeConditions'),
      value: '2'
    }
  ]
}
const ifTypeChange = (ifItem: any, data: any) => {
  ifItem.trigger_conditions_type = null
  ifItem = judgeItem.value
  ifItem.ifType = data
}

// Options under device condition type2Use the dropdown
const deviceConditionOptions = computed(() => [
  {
    label: $t('common.singleDevice'),
    value: '10'
  },
  {
    label: $t('common.singleClassDevice'),
    value: '11'
  }
])
const deviceConfigDisabled = ref(false)
const triggerConditionsTypeChange = (ifItem: any, data: any) => {
  ifItem.trigger_source = null
  ifItem.trigger_param_type = null
  ifItem.trigger_param = null
  ifItem.trigger_param_key = null
  ifItem.trigger_operator = null
  ifItem.trigger_value = null
  ifItem.minValue = null
  ifItem.maxValue = null
  deviceConfigDisabled.value = false

  if (data === '11') {
    deviceConfigDisabled.value = true
  }
  emit('conditionChose', data)
}

// Device group list
const deviceGroupOptions = ref([] as any)
// Get device group
const getGroup = async () => {
  deviceGroupOptions.value = []
  const res = await deviceGroupTree({})
  // eslint-disable-next-line array-callback-return
  res.data.map((item: any) => {
    deviceGroupOptions.value.push(item.group)
  })
}

// Device list
const deviceOptions = ref([] as any)
const queryDevice = ref({
  group_id: null as any,
  device_name: null as any,
  bind_config: 0
})
const btnloading = ref(false)

const selectInstRef = ref({})
const onKeydownEnter = e => {
  // selectInstRef.value = true;
  e.preventDefault()

  return false
}
const onDeviceKeydownEnter = (e: any, ifIndex: number) => {
  selectInstRef.value[ifIndex] = true
  e.preventDefault()
  return false
}
// Get device list
const getDevice = async (groupId: any, name: any) => {
  queryDevice.value.group_id = groupId || null
  queryDevice.value.device_name = name || null
  btnloading.value = false
  deviceOptions.value = []
  const res = await deviceListAll(queryDevice.value)
  btnloading.value = true
  deviceOptions.value = res.data || []
  // if (!deviceOptions.value.length) {
  //   selectInstRef.value = false;
  // }
}
// Select device
const triggerSourceChange = (ifItem: any, ifIndex: number) => {
  ifItem.trigger_param_type = null
  ifItem.trigger_param = null
  ifItem.trigger_param_key = null
  ifItem.trigger_operator = null
  ifItem.trigger_value = null
  ifItem.minValue = null
  ifItem.maxValue = null
  selectInstRef.value[ifIndex] = false
  // ifItem.action_param_type = null;
  // ifItem.action_param = null;
  // ifItem.action_value = null;
}

// const testFocus = () => {
//   setTimeout(() => {
//     queryDeviceName.value[0].focus();
//   }, 100);
// };

const queryDeviceName = ref<Record<number, any>>({})

// clean up refs function
onBeforeUpdate(() => {
  queryDeviceName.value = {}
})

// set up ref function
const setQueryDeviceNameRef = (el: any, index: number) => {
  if (el) {
    queryDeviceName.value[index] = el
  }
}

const handleFocus = (ifIndex: any) => {
  if (queryDeviceName.value[ifIndex]) {
    queryDeviceName.value[ifIndex].focus()
  } else {
    console.error(`Ref for queryDeviceName at index ${ifIndex} not found.`)
  }
}

// Device configuration list
const deviceConfigOption = ref([])
// Device configuration list query conditions
const queryDeviceConfig = ref({
  device_config_name: ''
})
// Get device configuration list
const getDeviceConfig = async (name: string) => {
  queryDeviceConfig.value.device_config_name = name || ''
  const res = await deviceConfigAll(queryDeviceConfig.value)
  deviceConfigOption.value = res.data || []
}

// New：Function to actively load options
const loadTriggerParamOptions = async (ifItem: any) => {
  // Avoid repeated loading，Do not reload if option already exists
  if (ifItem.triggerParamOptions && ifItem.triggerParamOptions.length > 0) {
    return
  }

  if (ifItem.trigger_source && (ifItem.trigger_conditions_type === '10' || ifItem.trigger_conditions_type === '11')) {
    ifItem.triggerParamOptions = [] // Initialized to an empty array
    let res = null as any
    try {
      if (ifItem.trigger_conditions_type === '10') {
        res = await deviceMetricsConditionMenu({
          device_id: ifItem.trigger_source
        })
      } else if (ifItem.trigger_conditions_type === '11') {
        res = await configMetricsConditionMenu({
          device_config_id: ifItem.trigger_source
        })
      }

      if (res && res.data) {
        // (Processing logic copied from actionParamShow)
        res.data.map((item: any) => {
          item.value = item.data_source_type
          item.label = `${item.data_source_type}${item.label ? `(${item.label})` : ''}`
          item.options.map((subItem: any) => {
            subItem.value = `${item.value}/${subItem.key}`
            subItem.label = `${subItem.key}${subItem.label ? `(${subItem.label})` : ''}`
          })
        })
        ifItem.triggerParamOptions = res.data // Assign processed data
      } else {
        ifItem.triggerParamOptions = [] // Ensure array on API failure
      }
    } catch (error) {
      console.error('Error loading trigger param options during echo:', error)
      ifItem.triggerParamOptions = [] // Ensure array on error
    } finally {
      // Add statusData regardless of API outcome
      // Ensure statusData is not added multiple times if loaded elsewhere
      if (!ifItem.triggerParamOptions.some(opt => opt.value === 'status')) {
        ifItem.triggerParamOptions.push(statusData.value)
      }
    }
  }
}

// Action identifier obtained by pulling down
const actionParamShow = async (ifItem: any, data: any) => {
  // Call active loading function，It will handle duplicate loading issues
  if (data === true) {
    await loadTriggerParamOptions(ifItem)
  }
  // original actionParamShow Logic can be simplified or removed，because loadTriggerParamOptions did the main work
  // Keep original commented out logic for reference，or remove it completely
  // if (data === true && ifItem.trigger_source) {
  //   ifItem.triggerParamOptions = [];
  //   let res = null as any;
  //   if (ifItem.trigger_conditions_type === '10') {
  //     res = await deviceMetricsConditionMenu({
  //       device_id: ifItem.trigger_source
  //     });
  //   } else if (ifItem.trigger_conditions_type === '11') {
  //     res = await configMetricsConditionMenu({
  //       device_config_id: ifItem.trigger_source
  //     });
  //   }
  //   // eslint-disable-next-line array-callback-return
  //   if (res.data) {
  //     // eslint-disable-next-line array-callback-return
  //     res.data.map((item: any) => {
  //       item.value = item.data_source_type;
  //       item.label = `${item.data_source_type}${item.label ? `(${item.label})` : ''}`;

  //       // eslint-disable-next-line array-callback-return
  //       item.options.map((subItem: any) => {
  //         subItem.value = `${item.value}/${subItem.key}`;
  //         subItem.label = `${subItem.key}${subItem.label ? `(${subItem.label})` : ''}`;
  //       });
  //     });
  //     // eslint-disable-next-line require-atomic-updates
  //     ifItem.triggerParamOptions = res.data;
  //   }
  //   const statusData = {
  //     value: 'status',
  //     label: 'status(state)',
  //     options: [
  //       {
  //         value: 'status/On-line',
  //         label: 'On-line(Go online)',
  //         key: 'On-line'
  //       },
  //       {
  //         value: 'status/Off-line',
  //         label: 'Off-line(offline)',
  //         key: 'Off-line'
  //       },
  //       {
  //         value: 'status/All',
  //         label: 'All(all)',
  //         key: 'All'
  //       }
  //     ]
  //   };
  //   ifItem.triggerParamOptions.push(statusData);
  // }
}

// Create a globalstatusDataComputed properties
const statusData = computed(() => ({
  value: 'status',
  label: $t('page.automation.linkage.premise.status.label'),
  options: [
    {
      value: 'status/On-line',
      label: $t('page.automation.linkage.premise.status.options.online'),
      key: 'On-line'
    },
    {
      value: 'status/Off-line',
      label: $t('page.automation.linkage.premise.status.options.offline'),
      key: 'Off-line'
    },
    {
      value: 'status/All',
      label: $t('page.automation.linkage.premise.status.options.all'),
      key: 'All'
    }
  ]
}))

const message = useMessage()

// action value identifier
const actionValueChange = (ifItem: any) => {
  if (ifItem.trigger_param_type === 'event') {
    try {
      JSON.parse(ifItem.trigger_value)
      if (typeof JSON.parse(ifItem.trigger_value) === 'object') {
        ifItem.inputFeedback = ''
        ifItem.inputValidationStatus = undefined
      } else {
        message.error($t('common.enterJson'))
        ifItem.inputValidationStatus = 'error'
      }
    } catch (e) {
      message.error($t('common.enterJson'))
      ifItem.inputValidationStatus = 'error'
    }
  }
}

// Options under time condition type2Use the dropdown
const getTimeConditionOptions = ifGroup => {
  return [
    {
      label: $t('common.single'),
      value: '20',
      disabled: ifGroup.some(item => item.ifType === '1')
    },
    {
      label: $t('common.repeat'),

      value: '21',
      disabled: ifGroup.some(item => item.ifType === '1')
    },
    {
      label: $t('common.timeFrame'),
      value: '22'
    }
  ]
}
// const timeConditionOptions = ref([
//   {
//     label: $t('common.single'),
//     value: '20'
//   },
//   {
//     label: $t('common.repeat'),
//     value: '21'
//   },
//   {
//     label: $t('common.timeFrame'),
//     value: '22'
//   }
// ]);
// Options under service condition type2Use the dropdown
const serviceConditionOptions = computed(() => [
  {
    label: $t('common.weather'),
    value: 'weather'
  }
])

// const deviceOptions = ref([]);

// under time conditions，when repeated，Period options used
const cycleOptions = computed(() => [
  {
    label: $t('common.everyHour'),
    value: 'HOUR'
  },
  {
    label: $t('common.everyDay'),
    value: 'DAY'
  },
  {
    label: $t('common.weekly'),
    value: 'WEEK'
  },
  {
    label: $t('common.monthly'),
    value: 'MONTH'
  }
])

// under time conditions，range，Period options used
const weekOptions = computed(() => [
  {
    label: $t('page.irrigation.time.week.monday'),
    value: '1'
  },
  {
    label: $t('page.irrigation.time.week.tuesday'),
    value: '2'
  },
  {
    label: $t('page.irrigation.time.week.wednesday'),
    value: '3'
  },
  {
    label: $t('page.irrigation.time.week.thursday'),
    value: '4'
  },
  {
    label: $t('page.irrigation.time.week.friday'),
    value: '5'
  },
  {
    label: $t('page.irrigation.time.week.saturday'),
    value: '6'
  },
  {
    label: $t('page.irrigation.time.week.sunday'),
    value: '7'
  }
])
// Weather conditions options
const weatherOptions = computed(() => [
  {
    label: $t('common.sunrise'),
    value: 'sunrise'
  },
  {
    label: $t('common.sunset'),
    value: 'sunset'
  }
])

// Operator options
const determineOptions = computed(() => [
  {
    label: $t('common.equal'),
    value: '='
  },
  {
    label: $t('common.unequal'),
    value: '!='
  },
  {
    label: $t('common.pass'),
    value: '>'
  },
  {
    label: $t('common.under'),
    value: '<'
  },
  {
    label: $t('common.greaterOrEqual'),
    value: '>='
  },
  {
    label: $t('common.lessOrEqual'),
    value: '<='
  },
  {
    label: $t('common.between'),
    value: 'between'
  },
  {
    label: $t('common.includeList'),
    value: 'in'
  }
])
// Expiration time options
const expirationTimeOptions = computed(() => [
  {
    label: $t('common.minutes5'),
    value: 5
  },
  {
    label: $t('common.minutes10'),
    value: 10
  },
  {
    label: $t('common.minutes30'),
    value: 30
  },
  {
    label: $t('common.hours1'),
    value: 60
  },
  {
    label: $t('common.days1'),
    value: 1440
  }
])

// Month range options
const mouthRangeOptions = repeat(31, undefined).map((_, i) => ({
  label: String(i + 1),
  value: i + 1
}))
const judgeItem = ref({
  ifType: null, // first condition type
  trigger_conditions_type: null, // second condition-rear end
  trigger_source: null, // equipment/Equipment classIDvalue-rear end
  trigger_param_type: null, // Trigger message identifier-rear end
  trigger_param: null, // Trigger parameters-rear end
  trigger_param_key: null, // Trigger parameters-
  trigger_operator: null, // Operator
  trigger_value: null, // target value(rear end)
  task_type: null, // Repeat time period value-rear end
  params: null, //  time value-rear end
  execution_time: null, // Execution time-Day time minute value-rear end
  expiration_time: null, // Expiration time-Day time minute value-rear end
  timeValue: null, // Hours, minutes and seconds
  onceTimeValue: null, // Single execution time-Day time minute value
  hourTimeValue: null, // time value-Select hour
  dayTimeValue: null, // time value-Select day
  weekTimeValue: null, // time value-Select week
  monthTimeValue: null, // time value-Select month

  // eslint-disable-next-line no-bitwise
  weekChoseValue: [], // Weekday multiple choice value
  monthChoseValue: null, // a certain day of the month

  startTimeValue: null, // range start time
  endTimeValue: null, // range end time
  minValue: null, // smallest
  maxValue: null, // maximum
  weatherValue: null, // weather value
  deviceGroupId: null, // Device groupingid
  triggerParamOptions: [] // Action ID menu dropdown list data options
})
// interface JudgeItem {
//   ifType: string; // first condition type
//   trigger_conditions_type: string; // second condition--rear end
//   trigger_source: string; // Equipment classIDvalue--rear end
//   trigger_param_type: string; // Trigger message identifier--rear end
//   trigger_param: string; // Trigger parameters--rear end
//   trigger_operator: string; // Operator
//   trigger_value: string; // target value(rear end)
//   onceTimeValue: string; // Single execution time-Day time minute value
//   execution_time: string; // Single execution time-rear end
//   expiration_time: string; // Single expiration time-rear end
//
//   timeValue: string; // Hours, minutes and seconds
//   task_type: string; // Repeat time period value
//   params: string; //  time value-rear end
//   hourTimeValue: number; // time value-Select hour
//   dayTimeValue: number; // time value-Select day
//   weekTimeValue: number; // time value-Select week
//   monthTimeValue: number; // time value-Select month
//   weekChoseValue: (string | number)[] | null | undefined; // Weekday multiple choice value
//   monthChoseValue: string; // a certain day of the month
//   startTimeValue: number; // range start time
//   endTimeValue: number; // range end time
//   minValue: string; // smallest
//   maxValue: string; // maximum
//   weatherValue: string; // weather value
//   deviceGroupId: string; // Device groupingid
//   triggerParamOptions: object | any; // Action ID menu dropdown list data options
// }

// const ifGroups = ref([] as any);

// Add a condition to a condition
const addIfGroupsSubItem = async (ifGroupIndex: any) => {
  await premiseFormRef.value?.validate()
  premiseForm.value.ifGroups[ifGroupIndex].push(JSON.parse(JSON.stringify(judgeItem.value)))
}
// Delete a condition in an entry group
const deleteIfGroupsSubItem = (ifGroupIndex: any, ifIndex: any) => {
  premiseForm.value.ifGroups[ifGroupIndex].splice(ifIndex, 1)
}
// Delete a condition group
const deleteIfGroupsItem = (ifIndex: any) => {
  premiseForm.value.ifGroups.splice(ifIndex, 1)
}
// Add a new condition group
const addIfGroupItem = (data: any) => {
  // await premiseFormRef.value?.validate();
  const groupObj: any = []
  if (!data) {
    groupObj.push(JSON.parse(JSON.stringify(judgeItem.value)))
    premiseForm.value.ifGroups.push(groupObj)
  } else {
    groupObj.push(data)
    premiseForm.value.ifGroups.push(groupObj)
  }
}

const ifGroupsData = () => {
  return premiseForm.value.ifGroups
}
const premiseFormRefReturn = () => {
  return premiseFormRef.value
}

defineExpose({
  ifGroupsData,
  premiseFormRefReturn
})

const triggerParamChange = (ifItem: any, data: any) => {
  ifItem.trigger_param_type = data[0].value
  ifItem.trigger_param = data[1].key
}

interface Props {
  // eslint-disable-next-line vue/no-unused-properties
  conditionData?: object | any
  // eslint-disable-next-line vue/no-unused-properties,vue/prop-name-casing
  device_id?: string | any
  // eslint-disable-next-line vue/no-unused-properties,vue/prop-name-casing
  device_config_id?: string | any
}

const props = withDefaults(defineProps<Props>(), {
  // eslint-disable-next-line vue/require-valid-default-prop
  conditionData: [],
  device_id: '',
  device_config_id: ''
})

const onTapInput = (item: any, ifIndex: number) => {
  if (item.group_id || item.device_name) {
    getDevice(item.group_id, item.device_name)
  } else {
    selectInstRef.value[ifIndex] = true
  }
}

watch(
  () => props.conditionData,
  newValue => {
    if (newValue && Array.isArray(newValue)) {
      // Use deep copies to ensure responsiveness
      premiseForm.value.ifGroups = JSON.parse(JSON.stringify(newValue))
      // Traverse and actively load options
      premiseForm.value.ifGroups.forEach(ifGroup => {
        if (Array.isArray(ifGroup)) {
          ifGroup.forEach(ifItem => {
            // Call the function defined earlier to load options
            loadTriggerParamOptions(ifItem)
          })
        }
      })
    }
  },
  { deep: true } // Options object
)
const configId = ref(route.query.id || null)
onMounted(() => {
  getGroup()
  getDevice(null, null)
  getDeviceConfig('')
  if (!configId.value) {
    const judgeItemData = JSON.parse(JSON.stringify(judgeItem.value))
    if (props.device_id) {
      judgeItemData.ifType = '1'
      judgeItemData.trigger_conditions_type = '10'
      judgeItemData.trigger_source = props.device_id
      // eslint-disable-next-line array-callback-return
    } else if (props.device_config_id) {
      judgeItemData.ifType = '1'
      judgeItemData.trigger_conditions_type = '11'
      judgeItemData.trigger_source = props.device_config_id
      deviceConfigDisabled.value = true
    }
    emit('conditionChose', judgeItemData.trigger_conditions_type)
    addIfGroupItem(judgeItemData)
  }
})

// Monitor internationalization language changes，renewtriggerParamOptionsinstatusData
watch(locale, () => {
  // Traverse allifGroupsinifItems，update itstriggerParamOptionsinstatusData
  premiseForm.value.ifGroups.forEach((ifGroup: any) => {
    ifGroup.ifItems.forEach((ifItem: any) => {
      if (ifItem.triggerParamOptions && Array.isArray(ifItem.triggerParamOptions)) {
        // Find and updatestatusDataitem
        const statusIndex = ifItem.triggerParamOptions.findIndex((opt: any) => opt.value === 'status')
        if (statusIndex !== -1) {
          // use newstatusDatareplace old one
          ifItem.triggerParamOptions[statusIndex] = statusData.value
        }
      }
    })
  })
})

watch(
  premiseForm.value.ifGroups,
  () => {
    // selectInstRef.value = false;
  },
  { deep: true }
)
</script>

<template>
  <NFlex vertical class="mt-1 w-100%">
    <NForm
      ref="premiseFormRef"
      :model="premiseForm"
      :rules="premiseFormRules"
      :submit-on-enter="false"
      label-placement="left"
      size="small"
      :show-feedback="false"
      @keydown.enter="onKeydownEnter"
    >
      {{ $t('generate.condition-trigger') }}
      <NFlex v-for="(ifGroupItem, ifGroupIndex) in premiseForm.ifGroups" :key="ifGroupIndex" class="w-100%">
        <NCard class="mb-2 w-[calc(100%-78px)]">
          <NFlex v-for="(ifItem, ifIndex) in ifGroupItem" :key="ifIndex" class="ifGroupItem-class mb-2 w-100%">
            <NFlex class="flex-1" align="center">
              <NTag v-if="ifIndex !== 0" type="success" class="tag-class" size="small">{{ $t('generate.and') }}</NTag>
              <!-- Options1Condition type drop-down-->
              <NFormItem
                :show-label="false"
                :path="`ifGroups[${ifGroupIndex}][${ifIndex}].ifType`"
                :rule="premiseFormRules.ifType"
                class="ml-10 max-w-25 w-full"
              >
                <NSelect
                  v-model:value="ifItem.ifType"
                  :options="getIfTypeOptions(ifGroupItem, ifIndex)"
                  :placeholder="$t('common.select')"
                  @update-value="data => ifTypeChange(ifItem, data)"
                />
              </NFormItem>
              <NFlex v-if="ifItem.ifType === '1'" class="flex-1">
                <!--  Equipment conditions->Select type drop down-->
                <NFormItem
                  :show-label="false"
                  :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_conditions_type`"
                  :rule="premiseFormRules.trigger_conditions_type"
                  class="max-w-25 w-full"
                >
                  <NSelect
                    v-model:value="ifItem.trigger_conditions_type"
                    :options="deviceConditionOptions"
                    :placeholder="$t('common.select')"
                    clearable
                    @update:value="data => triggerConditionsTypeChange(ifItem, data)"
                  />
                </NFormItem>
                <template v-if="ifItem.trigger_conditions_type === '10'">
                  <NFormItem
                    :show-label="false"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_source`"
                    :rule="premiseFormRules.trigger_source"
                    class="max-w-40 w-full"
                  >
                    <NSelect
                      v-model:value="ifItem.trigger_source"
                      :options="deviceOptions"
                      value-field="id"
                      label-field="name"
                      clearable
                      :consistent-menu-width="false"
                      @click.prevent="
                        e => {
                          onDeviceKeydownEnter(e, ifIndex)
                        }
                      "
                      @keydown.enter="
                        e => {
                          onDeviceKeydownEnter(e, ifIndex)
                        }
                      "
                      @update:value="() => triggerSourceChange(ifItem, ifIndex)"
                    >
                      <template #header>
                        <NFlex align="center" class="w-500px">
                          {{ $t('generate.group') }}
                          <NSelect
                            v-model:value="queryDevice.group_id"
                            :options="deviceGroupOptions"
                            label-field="name"
                            value-field="id"
                            class="max-w-40"
                            clearable
                            :placeholder="$t('common.select')"
                            @keydown.enter="onKeydownEnter"
                            @update:value="data => getDevice(data, queryDevice.device_name)"
                          />
                          <NInput
                            :ref="el => setQueryDeviceNameRef(el, ifIndex)"
                            v-model:value="queryDevice.device_name"
                            class="flex-1"
                            clearable
                            :placeholder="$t('common.input')"
                            @keydown.enter="onTapInput(queryDevice, ifIndex)"
                            @click="handleFocus(ifIndex)"
                          ></NInput>
                          <NButton
                            :disabled="!btnloading"
                            type="primary"
                            @click.stop="getDevice(queryDevice.group_id, queryDevice.device_name)"
                          >
                            {{ $t('common.search') }}
                          </NButton>
                        </NFlex>
                      </template>
                    </NSelect>
                  </NFormItem>
                </template>
                <template v-if="ifItem.trigger_conditions_type === '11'">
                  <!--  under equipment conditions->single class device>Select device type drop down-->
                  <NFormItem
                    :show-label="false"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_source`"
                    :rule="premiseFormRules.trigger_source"
                    class="max-w-40 w-full"
                  >
                    <NSelect
                      v-model:value="ifItem.trigger_source"
                      :options="deviceConfigOption"
                      label-field="name"
                      value-field="id"
                      :placeholder="$t('common.select')"
                      remote
                      filterable
                      @search="getDeviceConfig"
                      @update:value="() => triggerSourceChange(ifItem, ifIndex)"
                    />
                  </NFormItem>
                </template>
                <template v-if="ifItem.trigger_source">
                  <!--            under equipment conditions->single device/单类equipment->equipmentID/equipment类ID->选择equipment状态-->
                  <NFormItem
                    :show-label="false"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_param`"
                    :rule="premiseFormRules.trigger_param"
                    class="max-w-40 w-full"
                  >
                    <NCascader
                      v-model:value="ifItem.trigger_param_key"
                      :placeholder="$t('common.select')"
                      :options="ifItem.triggerParamOptions"
                      check-strategy="child"
                      children-field="options"
                      size="small"
                      @update:show="data => actionParamShow(ifItem, data)"
                      @update:value="(value, option, pathValues) => triggerParamChange(ifItem, pathValues)"
                    />
                  </NFormItem>
                  <template
                    v-if="ifItem.trigger_param_type === 'telemetry' || ifItem.trigger_param_type === 'attributes'"
                  >
                    <!--          under equipment conditions->single device/单类equipment>-equipmentID/Select device classID>The trigger message identifier is telemetry/property->selection operator --->
                    <NFormItem
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_operator`"
                      :rule="premiseFormRules.trigger_operator"
                      class="max-w-35 w-full"
                    >
                      <NSelect v-model:value="ifItem.trigger_operator" :options="determineOptions" />
                    </NFormItem>
                    <template v-if="ifItem.trigger_operator === 'in'">
                      <!--          under equipment conditions->single device/单类equipment>-equipmentID/Select device classID>The trigger message identifier is telemetry->The operator isin(included in)->Enter range value --->
                      <NFormItem
                        :show-label="false"
                        :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_value`"
                        :rule="premiseFormRules.trigger_value"
                        class="max-w-50 w-full"
                      >
                        <NInput
                          v-model:value="ifItem.trigger_value"
                          :placeholder="$t('generate.separated-by-commas')"
                        />
                      </NFormItem>
                    </template>
                    <template v-else-if="ifItem.trigger_operator == 'between'">
                      <!--          under equipment conditions->single device/单类equipment>-equipmentID/Select device classID>The trigger message identifier is telemetry->The operator isbetween(between)->Enter maximum/minimum value --->
                      <NFormItem
                        :show-label="false"
                        :path="`ifGroups[${ifGroupIndex}][${ifIndex}].minValue`"
                        :rule="premiseFormRules.minValue"
                        class="max-w-35 w-full"
                      >
                        <NInput v-model:value="ifItem.minValue" :placeholder="$t('generate.min-value')" />
                      </NFormItem>
                      <NFormItem
                        :show-label="false"
                        :path="`ifGroups[${ifGroupIndex}][${ifIndex}].maxValue`"
                        :rule="premiseFormRules.maxValue"
                        class="max-w-30 w-full"
                      >
                        <NInput v-model:value="ifItem.maxValue" :placeholder="$t('generate.max-value')" />
                      </NFormItem>
                    </template>
                    <template v-else>
                      <!--          under equipment conditions->single device/单类equipment>-equipmentID/Select device classID>The trigger message identifier is telemetry->The operators are except for the above->Enter target value --->
                      <NFormItem
                        :show-label="false"
                        :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_value`"
                        :rule="premiseFormRules.trigger_value"
                        class="max-w-40 w-full"
                      >
                        <NInput v-model:value="ifItem.trigger_value" :placeholder="$t('generate.value')" />
                      </NFormItem>
                    </template>
                  </template>
                  <!--                  <template v-if="ifItem.trigger_param_type === 'attributes'">-->
                  <!--                    &lt;!&ndash;          under equipment conditions->single device/单类equipment>-equipmentID/Select device classID>The trigger message identifier is a property->input parameters -&ndash;&gt;-->
                  <!--                    <NFormItem-->
                  <!--                      :show-label="false"-->
                  <!--                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_value`"-->
                  <!--                      :rule="premiseFormRules.trigger_value"-->
                  <!--                      class="max-w-40 w-full"-->
                  <!--                    >-->
                  <!--                      <NInput-->
                  <!--                        v-model:value="ifItem.trigger_value"-->
                  <!--                        :placeholder="$t('common.param') + '，' + $t('common.as') + '：{param1:1}'"-->
                  <!--                      />-->
                  <!--                    </NFormItem>-->
                  <!--                  </template>-->
                  <template v-if="ifItem.trigger_param_type === 'event'">
                    <!--          under equipment conditions->single device/单类equipment>-equipmentID/Select device classID>The trigger message identifier is the event->input parameters --->
                    <NFormItem
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_value`"
                      :rule="premiseFormRules.trigger_value"
                      :validation-status="ifItem.inputValidationStatus"
                      :feedback="ifItem.inputFeedback"
                      class="max-w-40 w-full"
                    >
                      <NInput
                        v-model:value="ifItem.trigger_value"
                        :placeholder="`${$t('common.param')},${$t('common.as')}:{&quot;param1&quot;:1}`"
                        @blur="actionValueChange(ifItem)"
                      />
                    </NFormItem>
                  </template>
                  <template v-if="ifItem.trigger_param_type === 'status'">
                    <!--          under equipment conditions->single device/单类equipment>-equipmentID/Select device classID>The trigger message identifier is status-> --->
                  </template>
                </template>
              </NFlex>
              <NFlex v-if="ifItem.ifType === '2'" class="flex-1">
                <!--  time condition->Select type drop down-->
                <NFormItem
                  :show-label="false"
                  :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_conditions_type`"
                  :rule="premiseFormRules.trigger_conditions_type"
                  class="max-w-25 w-full"
                >
                  <NSelect
                    v-model:value="ifItem.trigger_conditions_type"
                    :options="getTimeConditionOptions(ifGroupItem)"
                    :placeholder="$t('common.select')"
                    @update:value="ifItem.task_type = null"
                  />
                </NFormItem>
                <template v-if="ifItem.trigger_conditions_type === '20'">
                  <!--  under time conditions->Single->Enter time-->
                  <NFormItem
                    :show-label="false"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].onceTimeValue`"
                    :rule="premiseFormRules.onceTimeValue"
                    class="max-w-40 w-full"
                  >
                    <n-date-picker
                      v-model:value="ifItem.onceTimeValue"
                      type="datetime"
                      :time-picker-props="{ format: 'HH:mm' }"
                      format="yyyy-MM-dd HH:mm"
                      :placeholder="$t('generate.please-select-day-hour-minute')"
                    />
                  </NFormItem>
                  <NFlex align="center">
                    {{ $t('generate.not-executed') }}
                    <NButton text class="refresh-class">
                      <n-icon>
                        <IosRefresh />
                      </n-icon>
                    </NButton>
                  </NFlex>
                  <!--                  <span class="ml-4"></span>-->
                  <NFormItem
                    :label="$t('generate.expiration-time')"
                    label-width="80px"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].expiration_time`"
                    :rule="premiseFormRules.expiration_time"
                  >
                    <NSelect
                      v-model:value="ifItem.expiration_time"
                      :options="expirationTimeOptions"
                      :placeholder="$t('generate.please-select')"
                      class="w-25"
                    />
                    <n-tooltip placement="top-start" trigger="hover">
                      <template #trigger>
                        <n-icon size="24" class="ml-2">
                          <IosAlert />
                        </n-icon>
                      </template>
                      execution time exceeded{{ expirationTimeOptions.find(data => ifItem['expiration_time'])?.label || '' }}expire after
                    </n-tooltip>
                  </NFormItem>
                </template>
                <template v-if="ifItem.trigger_conditions_type === '21'">
                  <!--  under time conditions->repeat->Select cycle-->
                  <NFormItem
                    :show-label="false"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].task_type`"
                    :rule="premiseFormRules.task_type"
                    class="max-w-25 w-full"
                  >
                    <NSelect
                      v-model:value="ifItem.task_type"
                      :options="cycleOptions"
                      :placeholder="$t('generate.please-select')"
                      @update:value="
                        () => {
                          ifItem.hourTimeValue = null
                          ifItem.expiration_time = null
                          ifItem.dayTimeValue = null
                          ifItem.weekTimeValue = null
                          ifItem.monthChoseValue = null
                          ifItem.weekChoseValue = null
                          ifItem.monthTimeValue = null
                        }
                      "
                    />
                  </NFormItem>
                  <template v-if="ifItem.task_type === 'HOUR'">
                    <!--  under time conditions->repeat->per hour->Select points-->
                    <NFormItem
                      key="hourTimeValue"
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].hourTimeValue`"
                      :rule="premiseFormRules.hourTimeValue"
                      class="max-w-25 w-full"
                    >
                      <NTimePicker
                        v-model:value="ifItem.hourTimeValue"
                        :placeholder="$t('common.select')"
                        format="mm"
                      />
                    </NFormItem>
                    <NFormItem
                      key="expiration_time0"
                      :label="$t('generate.expiration-time')"
                      label-width="80px"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].expiration_time`"
                      :rule="premiseFormRules.expiration_time"
                    >
                      <NSelect
                        v-model:value="ifItem.expiration_time"
                        :options="expirationTimeOptions"
                        :placeholder="$t('generate.please-select')"
                        class="w-25"
                      />
                      <n-tooltip placement="top-start" trigger="hover">
                        <template #trigger>
                          <n-icon size="24" class="ml-2">
                            <IosAlert />
                          </n-icon>
                        </template>
                        execution time exceeded{{
                          expirationTimeOptions.find(data => ifItem['expiration_time'])?.label || ''
                        }}expire after
                      </n-tooltip>
                    </NFormItem>
                  </template>
                  <template v-if="ifItem.task_type === 'DAY'">
                    <!--  under time conditions->repeat->every day->Select hours, minutes and seconds-->
                    <NFormItem
                      key="dayTimeValue"
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].dayTimeValue`"
                      :rule="premiseFormRules.dayTimeValue"
                      class="max-w-25 w-full"
                    >
                      <NTimePicker
                        v-model:value="ifItem.dayTimeValue"
                        :placeholder="$t('common.select')"
                        value-format="HH:mm"
                        format="HH:mm"
                      />
                    </NFormItem>
                    <NFormItem
                      key="expiration_time1"
                      :label="$t('generate.expiration-time')"
                      label-width="80px"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].expiration_time`"
                      :rule="premiseFormRules.expiration_time"
                    >
                      <NSelect
                        v-model:value="ifItem.expiration_time"
                        :options="expirationTimeOptions"
                        :placeholder="$t('generate.please-select')"
                        class="w-25"
                      />
                      <n-tooltip placement="top-start" trigger="hover">
                        <template #trigger>
                          <n-icon size="24" class="ml-2">
                            <IosAlert />
                          </n-icon>
                        </template>
                        execution time exceeded{{
                          expirationTimeOptions.find(data => ifItem['expiration_time'])?.label || ''
                        }}expire after
                      </n-tooltip>
                    </NFormItem>
                  </template>
                  <template v-if="ifItem.task_type === 'WEEK'">
                    <!--  under time conditions->repeat->weekly->Select the day of the week and enter the hours and minutes-->
                    <div class="weekChoseValue-box w-120">
                      <NFormItem
                        key="weekChoseValue"
                        :show-label="false"
                        :path="`ifGroups[${ifGroupIndex}][${ifIndex}].weekChoseValue`"
                        :rule="premiseFormRules.weekChoseValue"
                        :show-feedback="true"
                        class="w-full"
                      >
                        <NCheckboxGroup v-model:value="ifItem.weekChoseValue">
                          <NSpace item-style="display: flex;">
                            <n-checkbox
                              v-for="(weekItem, weekIndex) in weekOptions"
                              :key="weekIndex"
                              :value="weekItem.value"
                              :label="weekItem.label"
                            />
                          </NSpace>
                        </NCheckboxGroup>
                      </NFormItem>
                    </div>
                    <NFormItem
                      key="weekTimeValue"
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].weekTimeValue`"
                      :rule="premiseFormRules.weekTimeValue"
                      class="max-w-25 w-full"
                    >
                      <NTimePicker
                        v-model:value="ifItem.weekTimeValue"
                        :placeholder="$t('common.select')"
                        value-format="HH:mm"
                        format="HH:mm"
                      />
                    </NFormItem>
                    <NFormItem
                      key="expiration_time2"
                      :label="$t('generate.expiration-time')"
                      label-width="80px"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].expiration_time`"
                      :rule="premiseFormRules.expiration_time"
                    >
                      <NSelect
                        v-model:value="ifItem.expiration_time"
                        :options="expirationTimeOptions"
                        :placeholder="$t('generate.please-select')"
                        class="w-25"
                      />
                      <n-tooltip placement="top-start" trigger="hover">
                        <template #trigger>
                          <n-icon size="24" class="ml-2">
                            <IosAlert />
                          </n-icon>
                        </template>
                        execution time exceeded{{
                          expirationTimeOptions.find(data => ifItem['expiration_time'])?.label || ''
                        }}expire after
                      </n-tooltip>
                    </NFormItem>
                  </template>
                  <template v-if="ifItem.task_type === 'MONTH'">
                    <!--  under time conditions->repeat->per month->Select date and time-->
                    <NFormItem
                      key="monthChoseValue"
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].monthChoseValue`"
                      :rule="premiseFormRules.monthChoseValue"
                      class="max-w-25 w-full"
                    >
                      <NSelect
                        v-model:value="ifItem.monthChoseValue"
                        :options="mouthRangeOptions"
                        :placeholder="$t('generate.please-select-date')"
                      />
                    </NFormItem>
                    <NFormItem
                      key="monthTimeValue"
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].monthTimeValue`"
                      :rule="premiseFormRules.monthTimeValue"
                      class="max-w-25 w-full"
                    >
                      <NTimePicker
                        v-model:value="ifItem.monthTimeValue"
                        :placeholder="$t('common.select')"
                        value-format="HH:mm"
                        format="HH:mm"
                      />
                    </NFormItem>
                    <NFormItem
                      key="expiration_time3"
                      :label="$t('generate.expiration-time')"
                      label-width="80px"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].expiration_time`"
                      :rule="premiseFormRules.expiration_time"
                    >
                      <NSelect
                        v-model:value="ifItem.expiration_time"
                        :options="expirationTimeOptions"
                        :placeholder="$t('generate.please-select')"
                        class="w-25"
                      />
                      <n-tooltip placement="top-start" trigger="hover">
                        <template #trigger>
                          <n-icon size="24" class="ml-2">
                            <IosAlert />
                          </n-icon>
                        </template>
                        execution time exceeded{{
                          expirationTimeOptions.find(data => ifItem['expiration_time'])?.label || ''
                        }}expire after
                      </n-tooltip>
                    </NFormItem>
                  </template>
                </template>
                <template v-if="ifItem.trigger_conditions_type === '22'">
                  <!--  under time conditions->scope->Select the day of the week and time period-->
                  <div class="weekChoseValue-box w-120">
                    <NFormItem
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].weekChoseValue`"
                      :rule="premiseFormRules.weekChoseValue"
                      :show-feedback="true"
                      class="w-full"
                    >
                      <NCheckboxGroup v-model:value="ifItem.weekChoseValue">
                        <NSpace item-style="display: flex;">
                          <NCheckbox
                            v-for="(weekItem, weekIndex) in weekOptions"
                            :key="weekIndex"
                            :value="weekItem.value"
                            :label="weekItem.label"
                          />
                        </NSpace>
                      </NCheckboxGroup>
                    </NFormItem>
                  </div>
                  <NFormItem
                    :show-label="false"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].startTimeValue`"
                    :rule="premiseFormRules.startTimeValue"
                    class="max-w-25 w-full"
                  >
                    <NTimePicker
                      v-model:value="ifItem.startTimeValue"
                      :placeholder="$t('common.select')"
                      value-format="HH:mm:ss"
                      format="HH:mm:ss"
                    />
                  </NFormItem>
                  -
                  <NFormItem
                    :show-label="false"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].endTimeValue`"
                    :rule="premiseFormRules.endTimeValue"
                    class="max-w-25 w-full"
                  >
                    <NTimePicker
                      v-model:value="ifItem.endTimeValue"
                      :placeholder="$t('common.select')"
                      value-format="HH:mm:ss"
                      format="HH:mm:ss"
                    />
                  </NFormItem>
                </template>
              </NFlex>
              <NFlex v-if="ifItem.ifType === '3'" class="flex-1">
                <!--            Conditions of service->Select type drop down-->
                <NFormItem
                  :show-label="false"
                  :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_conditions_type`"
                  :rule="premiseFormRules.trigger_conditions_type"
                  class="max-w-40 w-full"
                >
                  <NSelect
                    v-model:value="ifItem.trigger_conditions_type"
                    :options="serviceConditionOptions"
                    class="max-w-40"
                  />
                </NFormItem>
                <NFormItem
                  :show-label="false"
                  :path="`ifGroups[${ifGroupIndex}][${ifIndex}].weatherValue`"
                  :rule="premiseFormRules.weatherValue"
                  class="max-w-40 w-full"
                >
                  <NSelect v-model:value="ifItem.weatherValue" :options="weatherOptions" />
                </NFormItem>
              </NFlex>
            </NFlex>
            <NFlex class="w-100px">
              <NButton
                v-if="ifIndex === 0"
                type="primary"
                class="absolute right-0"
                @click="addIfGroupsSubItem(ifGroupIndex)"
              >
                {{ $t('generate.add-condition') }}
              </NButton>
              <NButton
                v-if="ifIndex !== 0"
                type="error"
                class="absolute right-0"
                @click="deleteIfGroupsSubItem(ifGroupIndex, ifIndex)"
              >
                {{ $t('generate.delete-condition') }}
              </NButton>
            </NFlex>
          </NFlex>
        </NCard>
        <NButton v-if="ifGroupIndex > 0" type="error" class="relative" @click="deleteIfGroupsItem(ifGroupIndex)">
          {{ $t('generate.delete-group') }}
        </NButton>
      </NFlex>
    </NForm>
    <NButton type="primary" class="w-30" @click="addIfGroupItem(null)">{{ $t('generate.add-group') }}</NButton>
  </NFlex>
</template>

<style scoped>
.ifGroupItem-class {
  position: relative;

  .tag-class {
    position: absolute;
    top: 5px;
  }
}

.refresh-class {
  font-size: 24px;
}

:deep(.n-card__content) {
  padding: 10px 10px 4px 10px !important;
}

.weekChoseValue-box {
  :deep(.n-form-item-feedback-wrapper) {
    position: absolute;
    top: 20px;
  }
}
</style>
