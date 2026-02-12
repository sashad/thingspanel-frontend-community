<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { type FormInst, NButton, NCard, NFlex, useMessage } from 'naive-ui'
import { deviceGroupTree } from '@/service/api'
import { warningMessageList } from '@/service/api/alarm'
import PopUp from '@/views/alarm/warning-message/components/pop-up.vue'
import {
  deviceConfigAll,
  deviceConfigMetricsMenu,
  deviceListAll,
  deviceMetricsMenu,
  sceneGet
} from '@/service/api/automation'
import { $t } from '@/locales'

const route = useRoute()

interface Props {
  // eslint-disable-next-line vue/no-unused-properties
  conditionsType?: object | any
  actionData?: any
}

const props = withDefaults(defineProps<Props>(), {
  conditionsType: null,
  actionData: []
})

// single condition/When a single type of equipment changes,Reset device content in action
const resetActionData = () => {
  actionForm.value.actionGroups.map((item: any) => {
    if (item.actionInstructList && item.actionInstructList.length > 0) {
      const data = [] as any
      const instructItem = JSON.parse(JSON.stringify(instructListItem.value))
      instructItem.action_type = props.conditionsType
      data.push(instructItem)
      item.actionInstructList = data
    }
  })
}

watch(
  () => props.conditionsType,
  newValue => {
    if (newValue) {
      resetActionData()
    }
  }
)
watch(
  () => props.actionData,
  newValue => {
    if (newValue) {
      actionForm.value.actionGroups = []
      actionForm.value.actionGroups = JSON.parse(JSON.stringify(props.actionData))
      actionForm.value.actionGroups.map((item: any) => {
        if (item.actionType === '1') {
          item.actionInstructList.map(instructItem => {
            instructItem.actionParamOptions = []
            actionParamShow(instructItem)
          })
        }
      })
    }
  }
)

const configId = ref(route.query.id || null)

// Create a new alarm pop-up window to display status
const popUpVisible = ref(false)
// Create a new alarm receipt
const newEdit = () => {
  getAlarmList('')
}
// Scenario form example
const configFormRef = ref<FormInst | null>(null)
const actionGroupsReturn = () => {
  return actionForm.value.actionGroups
}
const actionFormRefReturn = () => {
  return configFormRef.value
}
// Scenario form data
const actionForm = ref({
  actionGroups: [] as any
})

defineExpose({
  actionGroupsReturn,
  actionFormRefReturn
})

// Scenario form rules
const configFormRules = ref({
  actionType: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  action_type: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  action_target: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  action_param_type: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  action_param: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  actionValue: {
    required: true,
    message: $t('common.select')
  }
})
// Dropdown selector loading status
const loadingSelect = ref(false)

// Action options
const actionOptions = ref([
  {
    label: $t('common.operateDevice'),
    value: '1',
    disabled: false
  },
  {
    label: $t('common.activateScene'),
    value: '20'
  },
  {
    label: $t('common.triggerAlarm'),
    value: '30'
  }
  // {
  //   label: $t('common.triggerService'),
  //   value: '40'
  // }
])

// action selectionactionwhen value changes
const actionChange = (actionGroupItem: any, actionGroupIndex: any, data: any) => {
  // eslint-disable-next-line array-callback-return
  actionOptions.value.map(item => {
    item.disabled = false
  })
  actionGroupItem.actionInstructList = [
    {
      actionParamOptionsData: [],
      actionParamTypeOptions: [],
      actionParamOptions: [],
      action_param_type: null,
      action_param: null,
      action_target: null,
      action_type: null,
      actionValue: null,
      deviceGroupId: null
    }
  ]
  actionGroupItem.action_type = null
  actionGroupItem.action_target = null

  if (data === '1') {
    // eslint-disable-next-line array-callback-return
    actionOptions.value.map(item => {
      if (item.value === '1') {
        // item.disabled = true;
        // if (actionGroupItem.actionInstructList.length <= 0) actionForm.value.actionGroups = JSON.parse(JSON.stringify(props.actionData));
      }
    })
    addIfGroupsSubItem(actionGroupIndex)
  }
}
// Device type options
const actionTypeOptions = ref([
  {
    label: $t('common.singleDevice'),
    value: '10'
  },
  {
    label: $t('common.singleClassDevice'),
    value: '11'
  }
])

// Select device type
const actionTypeChange = (instructItem: any, data: any) => {
  instructItem.action_target = null
  instructItem.action_param_type = null
  instructItem.action_param = null
  instructItem.actionValue = null

  if (data === '10') {
    getDevice('', '')
  } else if (data === '11') {
    getDeviceConfig('')
  }
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
  group_id: null,
  device_name: null,
  bind_config: 0
})

// Get device list
const getDevice = async (groupId: any, name: any) => {
  queryDevice.value.group_id = groupId || null
  queryDevice.value.device_name = name || null
  const res = await deviceListAll(queryDevice.value)
  deviceOptions.value = res.data
}

const queryDeviceName = ref([] as any)
const handleFocus = (ifIndex: any) => {
  queryDeviceName.value[ifIndex].focus()
}

// Device configuration list
const deviceConfigOption = ref([])
// Device configuration list query conditions
const queryDeviceConfig = ref({
  device_config_name: ''
})
// Get device configuration list
const getDeviceConfig = async (name: any) => {
  queryDeviceConfig.value.device_config_name = name || ''
  const res = await deviceConfigAll(queryDeviceConfig.value)
  deviceConfigOption.value = res.data || []
}

// Select action target
const actionTargetChange = (instructItem: any) => {
  instructItem.action_param_type = null
  instructItem.action_param = null
  instructItem.actionValue = null
  instructItem.actionParamOptionsData = []
  instructItem.actionParamTypeOptions = []
  instructItem.actionParamOptions = []
  actionParamShow(instructItem)
}

// Action identifier obtained by pulling down
const actionParamShow = async (instructItem: any) => {
  if (instructItem.action_target) {
    let res = null as any
    if (instructItem.action_type === '10') {
      res = await deviceMetricsMenu({ device_id: instructItem.action_target })
    } else if (instructItem.action_type === '11') {
      res = await deviceConfigMetricsMenu({
        device_config_id: instructItem.action_target
      })
    }
    // eslint-disable-next-line array-callback-return
    if (res.data) {
      // eslint-disable-next-line array-callback-return
      res.data.map((item: any) => {
        item.value = item.data_source_type
        item.label = `${item.data_source_type}${item.label ? `(${item.label})` : ''}`

        // eslint-disable-next-line array-callback-return
        item.options.map((subItem: any) => {
          subItem.value = subItem.key
          subItem.label = `${subItem.key}${subItem.label ? `(${subItem.label})` : ''}`
        })
      })
      // eslint-disable-next-line require-atomic-updates
      instructItem.actionParamOptionsData = res.data
      // eslint-disable-next-line require-atomic-updates
      instructItem.actionParamTypeOptions = res.data.map((item: any) => {
        return {
          label: item.label,
          value: item.value
        }
      })
      if (instructItem.action_param_type) {
        instructItem.actionParamOptions =
          instructItem.actionParamOptionsData.find(item => item.data_source_type === instructItem.action_param_type)
            ?.options || []
        if (
          instructItem.action_param_type === 'c_attribute' ||
          instructItem.action_param_type === 'c_telemetry' ||
          instructItem.action_param_type === 'c_command'
        ) {
          instructItem.showSubSelect = false
        } else {
          instructItem.showSubSelect = true
        }
      }
      if (instructItem.action_param && instructItem.actionParamOptions.length > 0) {
        instructItem.actionParamData =
          instructItem.actionParamOptions.find(item => item.key === instructItem.action_param) || null
        if (instructItem.actionParamData?.data_type) {
          instructItem.actionParamData.data_type = instructItem?.actionParamData?.data_type?.toLowerCase()
        }
      }
    }
  }
}
const placeholderMap = {
  telemetry: '20',
  attributes: 'on-line',
  command: '{"param1":1}',
  c_telemetry: '{"switch":1,"switch1":0}',
  c_attribute: '{"addr":1,"port":0}',
  c_command: '{"method":"switch1","params":{"false":0}}'
}
// Select device attribute type
const actionParamTypeChange = (instructItem: any, data: any) => {
  instructItem.action_param = null
  instructItem.actionParamData = null
  instructItem.actionParamOptions =
    instructItem.actionParamOptionsData.find(item => item.data_source_type === data)?.options || []
  instructItem.placeholder = placeholderMap[data]
  instructItem.actionValue = null
  if (
    instructItem.action_param_type === 'c_attribute' ||
    instructItem.action_param_type === 'c_telemetry' ||
    instructItem.action_param_type === 'c_command'
  ) {
    instructItem.showSubSelect = false
  } else {
    instructItem.showSubSelect = true
  }
}
// Select action identifier
const actionParamChange = (instructItem: any, data: any) => {
  instructItem.actionValue = null
  instructItem.actionParamData = instructItem.actionParamOptions.find(item => item.key === data) || null
  if (instructItem.actionParamData?.data_type) {
    instructItem.actionParamData.data_type = instructItem?.actionParamData?.data_type?.toLowerCase()
  }
}
const message = useMessage()
// action value identifier
const actionValueChange = (instructItem: any) => {
  if (
    instructItem.action_param_type === 'command' ||
    instructItem.action_param_type === 'c_attribute' ||
    instructItem.action_param_type === 'c_telemetry' ||
    instructItem.action_param_type === 'c_command'
  ) {
    try {
      JSON.parse(instructItem.actionValue)
      if (typeof JSON.parse(instructItem.actionValue) === 'object') {
        instructItem.inputFeedback = ''
        instructItem.inputValidationStatus = undefined
      } else {
        message.error($t('common.enterJson'))
        instructItem.inputValidationStatus = 'error'
      }
    } catch (e) {
      message.error($t('common.enterJson'))
      // instructItem.inputFeedback=$t('common.enterJson')
      instructItem.inputValidationStatus = 'error'
    }
  }
}
// scene list
const sceneList = ref([])
// Scene query conditions
const queryScene = ref({
  page: 1,
  page_size: 10,
  name: ''
})
// Get scene list
const getSceneList = async (name: string) => {
  queryScene.value.name = name || ''
  loadingSelect.value = true
  const res = await sceneGet(queryScene.value)
  sceneList.value = res.data.list
  loadingSelect.value = false
}

// Alarm list
const alarmList = ref([])
// Alarm list query conditions
const queryAlarm = ref({
  page: 1,
  page_size: 10,
  name: ''
})
const getAlarmList = async (name: string) => {
  queryAlarm.value.name = name || ''
  loadingSelect.value = true
  const res = await warningMessageList(queryAlarm.value)
  loadingSelect.value = false
  alarmList.value = res.data.list
}

// Data for operating device typesItem
const instructListItem = ref({
  action_target: null, //  action targetid  equipmentid、Device configurationid，sceneid、Alarmid
  action_type: null, // action identifier type
  action_param_type: null, // Property type
  action_param: null, // attribute value
  actionValue: null, // parameter/command value
  deviceGroupId: null, // Device groupingID
  actionParamOptions: [], // Action ID attribute drop-down list data options
  actionParamOptionsData: [], // Action ID menu dropdown list data options
  actionParamTypeOptions: [] // Action ID type drop-down list
})

// interface ActionInstructItem {
//   action_target: string;
//   action_type: string;
//   action_param_type: string;
//   action_param: string; // action identifier type
//   actionValue: string; // Parameter value
//   deviceGroupId: string;
//   actionParamOptions: object | any;
// }

// action arrayitem
const actionItem = ref({
  actionType: '30',
  action_type: null, // Action type backend
  action_target: null, // action targetid   equipmentid、Device configurationid，sceneid、Alarmid
  actionInstructList: []
})
// interface ActionItem {
//   actionType: string;
//   action_type: string;
//   action_target: string;
//   actionInstructList: Array<ActionInstructItem>;
//   actions: any;
// }

// action array values
// const state = reactive({
//   actionGroups: [] as any
// });
// let actionForm.value.actionGroups: Array<ActionItem> = reactive([] as any);

// Add a new action group
const addActionGroupItem = async () => {
  await configFormRef.value?.validate()
  const actionItemData = JSON.parse(JSON.stringify(actionItem.value))
  // actionItemData.actionInstructList.push(JSON.parse(JSON.stringify(instructListItem.value)));
  actionForm.value.actionGroups.push(actionItemData)
}
// Delete an action group
const deleteActionGroupItem = (actionGroupIndex: any) => {
  actionForm.value.actionGroups.splice(actionGroupIndex, 1)
}

// Add instructions to an action group
const addIfGroupsSubItem = async (actionGroupIndex: any) => {
  await configFormRef.value?.validate()
  const data = JSON.parse(JSON.stringify(instructListItem.value))
  if (props.conditionsType === '11') {
    data.action_type = '11'
  }
  actionForm.value.actionGroups[actionGroupIndex].actionInstructList.push(data)
}
// Delete an instruction in an action group
const deleteIfGroupsSubItem = (actionGroupIndex: any, ifIndex: any) => {
  actionForm.value.actionGroups[actionGroupIndex].actionInstructList.splice(ifIndex, 1)
}

onMounted(() => {
  getGroup()
  getDevice(null, null)
  getDeviceConfig('')
  getAlarmList('')
  getSceneList('')
  if (!configId.value) {
    addActionGroupItem()
  }
})
</script>

<template>
  <div class="actions-box w-100%">
    <NForm
      ref="configFormRef"
      :model="actionForm"
      :rules="configFormRules"
      label-placement="left"
      label-width="150"
      size="small"
      :show-feedback="false"
    >
      <NFlex vertical class="mt-1 w-100%">
        <NFlex
          v-for="(actionGroupItem, actionGroupIndex) in actionForm.actionGroups"
          :key="actionGroupIndex"
          class="mt-1 w-100%"
        >
          <NFormItem
            :show-label="false"
            :path="`actionGroups[${actionGroupIndex}].actionType`"
            :rule="configFormRules.actionType"
            class="w-100%"
          >
            <NFlex class="w-100%">
              <NSelect
                v-model:value="actionGroupItem.actionType"
                :options="actionOptions"
                class="max-w-40"
                @update:value="data => actionChange(actionGroupItem, actionGroupIndex, data)"
              />
              <template v-if="actionGroupItem.actionType === '1'">
                <!--          To perform an action is to operate a device->Add directive--->
                <NCard class="flex-1">
                  <NFlex
                    v-for="(instructItem, instructIndex) in actionGroupItem.actionInstructList"
                    :key="instructIndex"
                    class="mb-2 mr-30"
                  >
                    <template v-if="props.conditionsType !== '11'">
                      <NFormItem
                        :show-label="false"
                        :path="`actionGroups[${actionGroupIndex}].actionInstructList[${instructIndex}].action_type`"
                        :rule="configFormRules.action_type"
                        class="w-40"
                      >
                        <NSelect
                          v-model:value="instructItem.action_type"
                          :options="actionTypeOptions"
                          class="max-w-40"
                          @update:value="data => actionTypeChange(instructItem, data)"
                        />
                      </NFormItem>
                    </template>
                    <template v-if="instructItem.action_type === '10'">
                      <!--                      Select a single device-->
                      <NFormItem
                        :show-label="false"
                        :path="`actionGroups[${actionGroupIndex}].actionInstructList[${instructIndex}].action_target`"
                        :rule="configFormRules.action_target"
                        class="w-40"
                      >
                        <NSelect
                          v-model:value="instructItem.action_target"
                          :options="deviceOptions"
                          value-field="id"
                          label-field="name"
                          :consistent-menu-width="false"
                          :loading="loadingSelect"
                          class="max-w-40"
                          @update:value="() => actionTargetChange(instructItem)"
                        >
                          <template #header>
                            <NFlex align="center" class="w-500px">
                              {{ $t('generate.group') }}
                              <n-select
                                v-model:value="queryDevice.group_id"
                                :options="deviceGroupOptions"
                                label-field="name"
                                value-field="id"
                                class="max-w-40"
                                clearable
                                @update:value="data => getDevice(data, queryDevice.device_name)"
                              />
                              <NInput
                                ref="queryDeviceName"
                                v-model:value="queryDevice.device_name"
                                class="flex-1"
                                clearable
                                @click="handleFocus(instructIndex)"
                              ></NInput>
                              <NButton
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
                    <template v-if="instructItem.action_type === '11'">
                      <!--                      Select a single type of device-->
                      <NFormItem
                        :show-label="false"
                        :path="`actionGroups[${actionGroupIndex}].actionInstructList[${instructIndex}].action_target`"
                        :rule="configFormRules.action_target"
                        class="w-40"
                      >
                        <NSelect
                          v-model:value="instructItem.action_target"
                          :options="deviceConfigOption"
                          label-field="name"
                          value-field="id"
                          class="max-w-40"
                          :placeholder="$t('common.select')"
                          remote
                          filterable
                          @search="getDeviceConfig"
                          @update:value="() => actionTargetChange(instructItem)"
                        />
                      </NFormItem>
                    </template>
                    <template v-if="instructItem.action_type">
                      <!--                      Select properties-->
                      <NFormItem
                        :show-label="false"
                        :path="`actionGroups[${actionGroupIndex}].actionInstructList[${instructIndex}].action_param_type`"
                        :rule="configFormRules.action_param_type"
                        class="w-40"
                      >
                        <NSelect
                          v-model:value="instructItem.action_param_type"
                          :options="instructItem.actionParamTypeOptions"
                          class="max-w-40"
                          @update:value="data => actionParamTypeChange(instructItem, data)"
                        />
                      </NFormItem>
                      <NFormItem
                        v-if="instructItem.showSubSelect"
                        :show-label="false"
                        :path="`actionGroups[${actionGroupIndex}].actionInstructList[${instructIndex}].action_param`"
                        :rule="configFormRules.action_param"
                        class="w-40"
                      >
                        <NSelect
                          v-model:value="instructItem.action_param"
                          :options="instructItem.actionParamOptions"
                          @update:value="data => actionParamChange(instructItem, data)"
                        />
                      </NFormItem>
                      <template v-if="instructItem.showSubSelect && instructItem.actionParamData">
                        <NFormItem
                          :show-label="false"
                          :show-feedback="instructItem.actionParamData?.data_type === 'boolean'"
                          :path="`actionGroups[${actionGroupIndex}].actionInstructList[${instructIndex}].actionValue`"
                          :rule="configFormRules.actionValue"
                          :validation-status="instructItem.inputValidationStatus"
                          :feedback="instructItem.inputFeedback"
                          class="w-60"
                        >
                          <NInput
                            v-if="instructItem.actionParamData.data_type === 'string'"
                            v-model:value="instructItem.actionValue"
                            :placeholder="$t('common.as') + '：' + instructItem.placeholder || '--'"
                            class="w-full"
                            @blur="actionValueChange(instructItem)"
                          />
                          <n-input-number
                            v-if="instructItem.actionParamData && instructItem.actionParamData.data_type === 'number'"
                            v-model:value="instructItem.actionValue"
                            class="w-full"
                            :placeholder="$t('common.as') + '：' + instructItem.placeholder || '--'"
                            :show-button="false"
                          />
                          <n-radio-group
                            v-if="instructItem.actionParamData && instructItem.actionParamData.data_type === 'boolean'"
                            v-model:value="instructItem.actionValue"
                            name="radiogroup"
                          >
                            <n-space>
                              <n-radio :value="true">true</n-radio>
                              <n-radio :value="false">false</n-radio>
                            </n-space>
                          </n-radio-group>
                        </NFormItem>
                      </template>
                      <template v-if="!instructItem.showSubSelect">
                        <NFormItem
                          :show-label="false"
                          :show-feedback="false"
                          :path="`actionGroups[${actionGroupIndex}].actionInstructList[${instructIndex}].actionValue`"
                          :rule="configFormRules.actionValue"
                          :validation-status="instructItem.inputValidationStatus"
                          :feedback="instructItem.inputFeedback"
                          class="w-60"
                        >
                          <NInput
                            v-model:value="instructItem.actionValue"
                            :placeholder="$t('common.as') + '：' + instructItem.placeholder || '--'"
                            class="w-full"
                            @blur="actionValueChange(instructItem)"
                          />
                        </NFormItem>
                      </template>
                    </template>
                    <NButton
                      v-if="instructIndex === 0"
                      type="primary"
                      class="absolute right-5"
                      @click="addIfGroupsSubItem(actionGroupIndex)"
                    >
                      {{ $t('generate.add-operation') }}
                    </NButton>
                    <NButton
                      v-if="instructIndex !== 0"
                      type="error"
                      class="absolute right-5"
                      @click="deleteIfGroupsSubItem(actionGroupIndex, instructIndex)"
                    >
                      {{ $t('generate.delete-operation') }}
                    </NButton>
                  </NFlex>
                </NCard>
              </template>
              <template v-if="actionGroupItem.actionType === '20'">
                <!--          Executing an action is the activation scene->Add directive--->
                <NFlex class="ml-6" align="center">
                  <NFormItem
                    label-width="60"
                    :label="$t('generate.activate')"
                    :path="`actionGroups[${actionGroupIndex}].action_target`"
                    :rule="configFormRules.action_target"
                  >
                    <NSelect
                      v-model:value="actionGroupItem.action_target"
                      :options="sceneList"
                      label-field="name"
                      value-field="id"
                      :placeholder="$t('common.select')"
                      class="max-w-60"
                      :loading="loadingSelect"
                      filterable
                      remote
                      @search="getSceneList"
                    />
                  </NFormItem>
                </NFlex>
              </template>
              <template v-if="actionGroupItem.actionType === '30'">
                <!--          The execution action is to trigger an alarm->Add directive--->
                <NFlex class="ml-6">
                  <NFormItem
                    label-width="60"
                    :label="$t('generate.trigger')"
                    :path="`actionGroups[${actionGroupIndex}].action_target`"
                    :rule="configFormRules.action_target"
                  >
                    <NSelect
                      v-model:value="actionGroupItem.action_target"
                      :options="alarmList"
                      label-field="name"
                      value-field="id"
                      class="max-w-60"
                      :placeholder="$t('common.select')"
                      filterable
                      remote
                      :loading="loadingSelect"
                      @search="getAlarmList"
                    />
                  </NFormItem>
                  <NButton class="w-20" dashed type="info" @click="popUpVisible = true">
                    {{ $t('generate.create-alarm') }}
                  </NButton>
                </NFlex>
              </template>
              <NButton v-if="actionGroupIndex > 0" type="error" @click="deleteActionGroupItem(actionGroupIndex)">
                {{ $t('generate.delete-execution-action') }}
              </NButton>
            </NFlex>
          </NFormItem>
        </NFlex>
        <NButton type="primary" class="w-30" @click="addActionGroupItem()">
          {{ $t('generate.add-execution-action') }}
        </NButton>
      </NFlex>
    </NForm>
    <PopUp v-model:visible="popUpVisible" type="add" @new-edit="newEdit" />
  </div>
</template>

<style scoped lang="scss">
:deep(.n-card__content) {
  padding: 10px 10px 4px 10px !important;
}
</style>
