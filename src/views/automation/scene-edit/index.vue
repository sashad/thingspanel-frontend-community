<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NCard, NFlex, useDialog, useMessage } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import { deviceGroupTree } from '@/service/api'
import { warningMessageList } from '@/service/api/alarm'
import PopUp from '@/views/alarm/warning-message/components/pop-up.vue'
import {
  deviceConfigAll,
  deviceConfigMetricsMenu,
  deviceListAll,
  deviceMetricsMenu,
  sceneAdd,
  sceneEdit,
  sceneGet,
  sceneInfo
} from '@/service/api/automation'
// import { useRouterPush } from '@/hooks/common/router';
import { $t } from '@/locales'
import { useTabStore } from '@/store/modules/tab'
const route = useRoute()
const router = useRouter()
const dialog = useDialog()
// const { routerBack } = useRouterPush();

const configId = ref(route.query.id || '')

// Create a new alarm pop-up window to display status
const popUpVisible = ref(false)
// Create a new alarm receipt
const newEdit = () => {
  getAlarmList('')
}
// Scenario form example
const configFormRef = ref<FormInst | null>(null)
// Scenario form data
const configForm = ref({
  id: '',
  name: '',
  description: '',
  actions: [] as any
})
// Scenario form rules
const configFormRules = ref({
  name: {
    required: true,
    message: $t('generate.enter-scene-name')
  },
  description: {
    required: false,
    message: $t('generate.enterSceneDesc')
  },
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
  }
  // {
  //   label: $t('common.activateScene'),
  //   value: '20'
  // },
  // {
  //   label: $t('common.triggerAlarm'),
  //   value: '30'
  // },
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
  actionGroupItem.actionInstructList = []
  actionGroupItem.action_type = null
  actionGroupItem.action_target = null
  if (data === '1') {
    // eslint-disable-next-line array-callback-return
    actionOptions.value.map(item => {
      if (item.value === '1') {
        item.disabled = true
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
  instructItem.action_param_key = null
  instructItem.action_value = null

  if (data === '10') {
    getDevice(null, null)
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
      item.label = `${item.label ? `(${item.label})` : ''}${item.data_source_type}`

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
// // Select action identifier
// const actionParamChange = (instructItem: any, pathValues: any) => {
//   instructItem.action_param_type = pathValues[0].value;
//   instructItem.action_param = pathValues[1].key;
//   // instructItem.action_param_type = pathValues[0].value;
//   instructItem.action_value = null;
// };

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
  action_param_type: null, // action identifier type
  action_param: null, // action identifier type
  action_param_key: null,
  action_value: null, // Parameter value
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
//   action_value: string; // Parameter value
//   deviceGroupId: string;
//   actionParamType: object | any;
// }

// action arrayitem
const actionItem = ref({
  actionType: null,
  action_type: null, // Action type backend
  action_target: null, // action targetid   equipmentid、Device configurationid，sceneid、Alarmid
  actionInstructList: []
})
// interface ActionItem {
//   actionType: string;
//   action_type: string;
//   action_target: string;
//   actionInstructList: Array<ActionInstructItem>;
// }

// action array values
// let actionGroups: Array<ActionItem> = reactive([] as any);

// Add a new action group
const addActionGroupItem = async () => {
  if (configForm.value.actions.length !== 0) {
    await configFormRef.value?.validate()
  }
  const actionItemData = JSON.parse(JSON.stringify(actionItem.value))
  // actionItemData.actionInstructList.push(JSON.parse(JSON.stringify(instructListItem.value)));
  configForm.value.actions.push(actionItemData)
}
// Delete an action group
const deleteActionGroupItem = (actionGroupIndex: any) => {
  configForm.value.actions.splice(actionGroupIndex, 1)
}

// Add instructions to an action group
const addIfGroupsSubItem = async (actionGroupIndex: any) => {
  // if (configForm.value.actions[actionGroupIndex].actionInstructList.length != 0) {
  //   await configFormRef.value?.validate();
  // }
  configForm.value.actions[actionGroupIndex].actionInstructList.push(JSON.parse(JSON.stringify(instructListItem.value)))
}
// Delete an instruction in an action group
const deleteIfGroupsSubItem = (actionGroupIndex: any, ifIndex: any) => {
  configForm.value.actions[actionGroupIndex].actionInstructList.splice(ifIndex, 1)
}

const tabStore = useTabStore()
// form submission
const submitData = async () => {
  await configFormRef.value?.validate()
  const actionsData = [] as any
  // eslint-disable-next-line array-callback-return
  configForm.value.actions.map((item: any) => {
    if (item.actionType === '1') {
      // eslint-disable-next-line array-callback-return
      item.actionInstructList.map((instructItem: any) => {
        // in the case ofc_telemetry/c_attribute,Soaction_valueExample format：{"c_telemetry":2}
        // in the case ofc_command,Soaction_valueExample format：{"method":"switch1","params":{"false":0}}
        if (
          instructItem.action_param_type === 'c_telemetry' ||
          instructItem.action_param_type === 'c_attribute' ||
          instructItem.action_param_type === 'c_command'
        ) {
          instructItem.action_value = instructItem.actionValue
        }
        // in the case oftelemetry/attribute，So action_valueExample format：{"humidity":2}
        if (instructItem.action_param_type === 'telemetry' || instructItem.action_param_type === 'attributes') {
          const action_value = {}
          action_value[instructItem.action_param] = instructItem.actionValue
          instructItem.action_value = JSON.stringify(action_value)
        }
        // in the case ofcommand/c_command，So action_valueExample format:	{"method":"ReSet","params":{"switch":1,"light":"close"}}
        if (instructItem.action_param_type === 'command') {
          const action_value = {
            method: instructItem.action_param,
            params: JSON.stringify(JSON.parse(instructItem.actionValue))
          }
          instructItem.action_value = JSON.stringify(action_value)
        }
        actionsData.push(instructItem)
      })
    } else {
      item.action_type = item.actionType
      actionsData.push(item)
    }
  })
  dialog.warning({
    title: $t('common.tip'),
    content: $t('common.saveSceneInfo'),
    positiveText: $t('device_template.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      // configForm.value.actions = actionsData;
      const configFormData = JSON.parse(JSON.stringify(configForm.value))
      configFormData.actions = actionsData
      if (configId.value) {
        const res = await sceneEdit(configFormData)
        if (!res.error) {
          await tabStore.removeTab(route.path)
          router.replace({ path: '/automation/scene-manage' })
        }
      } else {
        const res = await sceneAdd(configFormData)
        if (!res.error) {
          await tabStore.removeTab(route.path)
          router.replace({ path: '/automation/scene-manage' })
        }
      }
    }
  })
}

const getSceneInfo = async () => {
  const res = await sceneInfo(configId.value)
  configForm.value = { ...configForm.value, ...res.data.info }
  configForm.value.actions = res.data.actions
  dataEcho(configForm.value.actions)
}

// Process the page and go back to echo
const dataEcho = actionsData => {
  const actionGroupsData = [] as any
  const actionInstructList = [] as any
  // eslint-disable-next-line array-callback-return
  actionsData.map((item: any) => {
    if (item.action_type === '10' || item.action_type === '11') {
      item.actionParamOptions = []
      const actionValueObj = JSON.parse(item.action_value)
      if (
        item.action_param_type === 'c_telemetry' ||
        item.action_param_type === 'c_attribute' ||
        item.action_param_type === 'c_command'
      ) {
        item.actionValue = item.action_value
      }
      // in the case oftelemetry/attribute，So action_valueExample format：{"humidity":2}
      if (item.action_param_type === 'telemetry' || item.action_param_type === 'attributes') {
        // item.action_value = JSON.stringify(action_value);
        item.actionValue = actionValueObj[item.action_param]
      }
      // in the case ofcommand/c_command，So action_valueExample format:	{"method":"ReSet","params":{"switch":1,"light":"close"}}
      if (item.action_param_type === 'command') {
        item.actionValue = actionValueObj.params
      }
      item.actionParamOptions = []
      actionParamShow(item)
      actionInstructList.push(item)
    } else {
      item.actionType = item.action_type
      actionGroupsData.push(item)
    }
  })
  if (actionInstructList.length > 0) {
    const type1Data = {
      actionType: '1',
      actionInstructList
    }
    actionGroupsData.push(type1Data)
  }
  configForm.value.actions = actionGroupsData
}

onMounted(() => {
  getGroup()
  getDevice(null, null)
  getAlarmList('')
  getSceneList('')
  getDeviceConfig('')
  if (configId.value) {
    // eslint-disable-next-line no-unused-expressions
    typeof configId.value === 'string' ? (configForm.value.id = configId.value) : ''
    getSceneInfo()
  } else {
    addActionGroupItem()
  }
})
</script>

<template>
  <div class="scene-edit">
    <NCard :bordered="false" :title="`${configId ? $t('card.editScene') : $t('card.addScene')}`">
      <NForm
        ref="configFormRef"
        :model="configForm"
        :rules="configFormRules"
        label-placement="left"
        label-width="100"
        size="small"
      >
        <NFormItem :label="$t('generate.labelName')" path="name" class="w-150">
          <NInput v-model:value="configForm.name" :placeholder="$t('generate.enterSceneName')" />
        </NFormItem>
        <NFormItem :label="$t('generate.description')" path="description" class="w-150">
          <NInput
            v-model:value="configForm.description"
            type="textarea"
            :placeholder="$t('generate.enter-description')"
            rows="1"
          />
        </NFormItem>
        <NFormItem :label="$t('generate.action')" required class="w-100%" :show-feedback="false">
          <NFlex vertical class="mt-1 w-100%">
            <NFlex
              v-for="(actionGroupItem, actionGroupIndex) in configForm.actions"
              :key="actionGroupIndex"
              class="mt-1 w-100%"
            >
              <NFormItem
                :show-label="false"
                :show-feedback="false"
                :path="`actions[${actionGroupIndex}].actionType`"
                :rule="configFormRules.actionType"
                class="max-w-30 w-full"
              >
                <NSelect
                  v-model:value="actionGroupItem.actionType"
                  :options="actionOptions"
                  @update:value="data => actionChange(actionGroupItem, actionGroupIndex, data)"
                />
              </NFormItem>
              <template v-if="actionGroupItem.actionType === '1'">
                <!--          To perform an action is to operate a device->Add directive--->
                <NCard class="flex-1">
                  <NFlex
                    v-for="(instructItem, instructIndex) in actionGroupItem.actionInstructList"
                    :key="instructIndex"
                    class="mb-2 mr-30"
                  >
                    <NFormItem
                      :show-label="false"
                      :show-feedback="false"
                      :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].action_type`"
                      :rule="configFormRules.action_type"
                      class="max-w-30 w-full"
                    >
                      <NSelect
                        v-model:value="instructItem.action_type"
                        :options="actionTypeOptions"
                        @update:value="data => actionTypeChange(instructItem, data)"
                      />
                    </NFormItem>
                    <template v-if="instructItem.action_type === '10'">
                      <NFormItem
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].action_target`"
                        :rule="configFormRules.action_target"
                        class="max-w-40 w-full"
                      >
                        <NSelect
                          v-model:value="instructItem.action_target"
                          :options="deviceOptions"
                          value-field="id"
                          label-field="name"
                          :consistent-menu-width="false"
                          :loading="loadingSelect"
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
                                autofocus
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
                      <NFormItem
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].action_target`"
                        :rule="configFormRules.action_target"
                        class="max-w-40 w-full"
                      >
                        <NSelect
                          v-model:value="instructItem.action_target"
                          :options="deviceConfigOption"
                          label-field="name"
                          value-field="id"
                          :placeholder="$t('common.select')"
                          remote
                          filterable
                          @search="getDeviceConfig"
                          @update:value="() => actionTargetChange(instructItem)"
                        />
                      </NFormItem>
                    </template>
                    <template v-if="instructItem.action_type">
                      <NFormItem
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].action_param_type`"
                        :rule="configFormRules.action_param_type"
                        class="max-w-30 w-full"
                      >
                        <NSelect
                          v-model:value="instructItem.action_param_type"
                          :options="instructItem.actionParamTypeOptions"
                          @update:value="data => actionParamTypeChange(instructItem, data)"
                        />

                        <!--                        <NCascader-->
                        <!--                          v-model:value="instructItem.action_param_key"-->
                        <!--                          :placeholder="$t('common.select')"-->
                        <!--                          :options="instructItem.actionParamType"-->
                        <!--                          check-strategy="child"-->
                        <!--                          children-field="options"-->
                        <!--                          size="small"-->
                        <!--                          class="max-w-40"-->
                        <!--                          @update:show="data => actionParamShow(instructItem, data)"-->
                        <!--                          @update:value="(value, option, pathValues) => actionParamChange(instructItem, pathValues)"-->
                        <!--                        />-->
                      </NFormItem>
                      <NFormItem
                        v-if="instructItem.showSubSelect"
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].action_param`"
                        :rule="configFormRules.action_param"
                        class="max-w-40 w-full"
                      >
                        <NSelect
                          v-model:value="instructItem.action_param"
                          :options="instructItem.actionParamOptions"
                          @update:value="data => actionParamChange(instructItem, data)"
                        />
                      </NFormItem>
                      <NFormItem
                        v-if="instructItem.showSubSelect && instructItem.actionParamData"
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].actionValue`"
                        :rule="configFormRules.actionValue"
                        :validation-status="instructItem.inputValidationStatus"
                        :feedback="instructItem.inputFeedback"
                        class="max-w-60 w-full"
                      >
                        <NInput
                          v-if="instructItem.actionParamData.data_type === 'string'"
                          v-model:value="instructItem.actionValue"
                          :placeholder="$t('common.as') + '：' + instructItem.placeholder"
                          class="w-full"
                          @blur="actionValueChange(instructItem)"
                        />
                        <n-input-number
                          v-if="instructItem.actionParamData.data_type === 'number'"
                          v-model:value="instructItem.actionValue"
                          class="w-full"
                          :placeholder="$t('common.as') + '：' + instructItem.placeholder"
                          :show-button="false"
                        />
                        <n-radio-group
                          v-if="instructItem.actionParamData.data_type === 'boolean'"
                          v-model:value="instructItem.actionValue"
                          name="radiogroup"
                        >
                          <n-space>
                            <n-radio :value="true">true</n-radio>
                            <n-radio :value="false">false</n-radio>
                          </n-space>
                        </n-radio-group>
                      </NFormItem>
                      <NFormItem
                        v-if="!instructItem.showSubSelect"
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].actionValue`"
                        :rule="configFormRules.actionValue"
                        :validation-status="instructItem.inputValidationStatus"
                        :feedback="instructItem.inputFeedback"
                        class="w-60"
                      >
                        <NInput
                          v-model:value="instructItem.actionValue"
                          :placeholder="$t('common.as') + '：' + instructItem.placeholder"
                          class="w-full"
                          @blur="actionValueChange(instructItem)"
                        />
                      </NFormItem>
                    </template>
                    <NButton
                      v-if="instructIndex === 0"
                      type="primary"
                      class="absolute right-5"
                      @click="addIfGroupsSubItem(actionGroupIndex)"
                    >
                      {{ $t('generate.add-row') }}
                    </NButton>
                    <NButton
                      v-if="instructIndex !== 0"
                      type="error"
                      class="absolute right-5"
                      @click="deleteIfGroupsSubItem(actionGroupIndex, instructIndex)"
                    >
                      {{ $t('common.delete') }}
                    </NButton>
                  </NFlex>
                </NCard>
              </template>
              <template v-if="actionGroupItem.actionType === '20'">
                <NFlex class="ml-6 w-auto" align="center">
                  <NFormItem
                    :label="$t('generate.activate')"
                    label-width="60px"
                    :show-feedback="false"
                    :path="`actions[${actionGroupIndex}].action_target`"
                    :rule="configFormRules.action_target"
                    class="w-full"
                  >
                    <NSelect
                      v-model:value="actionGroupItem.action_target"
                      :options="sceneList"
                      label-field="name"
                      value-field="id"
                      :placeholder="$t('common.select')"
                      :loading="loadingSelect"
                      filterable
                      class="max-w-50"
                      remote
                      @search="getSceneList"
                    />
                  </NFormItem>
                </NFlex>
              </template>
              <template v-if="actionGroupItem.actionType === '30'">
                <NFlex class="ml-6 w-auto">
                  <NFormItem
                    :label="$t('generate.trigger')"
                    label-width="60px"
                    :show-feedback="false"
                    :path="`actions[${actionGroupIndex}].action_target`"
                    :rule="configFormRules.action_target"
                  >
                    <NSelect
                      v-model:value="actionGroupItem.action_target"
                      :options="alarmList"
                      label-field="name"
                      value-field="id"
                      :placeholder="$t('common.select')"
                      class="max-w-50"
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
            <NButton type="primary" class="w-30" @click="addActionGroupItem()">
              {{ $t('generate.add-execution-action') }}
            </NButton>
          </NFlex>
        </NFormItem>
      </NForm>
      <n-divider class="divider-class" />
      <NFlex justify="center" class="mb-5">
        <NButton type="primary" @click="submitData">{{ $t('generate.save-scene-configuration') }}</NButton>
      </NFlex>
    </NCard>
    <PopUp v-model:visible="popUpVisible" type="add" @new-edit="newEdit" />
  </div>
</template>

<style scoped>
:deep(.n-card__content) {
  padding: 10px 10px 4px 10px !important;
}
</style>
