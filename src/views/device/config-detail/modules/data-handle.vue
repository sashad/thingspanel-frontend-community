<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'
import { type FormInst, NButton, useDialog } from 'naive-ui'
import { PencilOutline as editIcon, TrashOutline as trashIcon } from '@vicons/ionicons5'
import MonacoEditor from 'monaco-editor-vue3'
import ItemCard from '@/components/dev-card-item/index.vue'
import {
  dataScriptAdd,
  dataScriptDel,
  dataScriptEdit,
  dataScriptQuiz,
  getDataScriptList,
  setDeviceScriptEnable
} from '@/service/api/device'
import { $t } from '@/locales'
import { useI18n } from 'vue-i18n'
// import { createLogger } from '@/utils/logger'
// const logger = createLogger('DataHandle')

// Get internationalization function
const { t } = useI18n()
// const message = useMessage();
const dialog = useDialog()

interface Props {
  configInfo?: object | any
}

const props = withDefaults(defineProps<Props>(), {
  configInfo: null
})
const configFormRef = ref<HTMLElement & FormInst>()

const modalTitle = ref($t('generate.add'))
const configForm: any = ref({})
const scripTypeOpt = ref([
  {
    label: $t('generate.all'),
    value: ''
  },
  {
    label: $t('custom.devicePage.reportPreprocessing'),
    value: 'A'
  },
  {
    label: $t('custom.devicePage.transmissionPreprocessing'),
    value: 'B'
  },
  {
    label: $t('custom.devicePage.attributeReporting'),
    value: 'C'
  },
  {
    label: $t('custom.devicePage.attributeDistribution'),
    value: 'D'
  },
  {
    label: $t('custom.devicePage.commandDeliveryPreprocessing'),
    value: 'E'
  },
  {
    label: $t('custom.devicePage.eventReportPreprocessing'),
    value: 'F'
  }
])

function defaultConfigForm() {
  return {
    id: null,
    content: `function encodeInp(msg,topic) 
 -- illustrate：This function is a coding function，Encode incoming messages into a platform-recognizable message format or a device-recognizable message format，Please write coding logic according to actual needs 
 -- Add ginseng：inputmsg，Can be a string of any data type。 
 -- Take out the ginseng：The return value is the encoded message,need to bejsonstring form 
 -- Notice：stringandjsonObjImporting is required for mutual transferjsonLibrary：local json = require("json") 
 -- example，stringchangejsonObj：local jsonData = json.decode(msgString) 
 -- example，jsonObjchangestring：local jsonStr = json.encode(jsonTable) 
 local json = require("json") 
 local jsonData = json.decode(msg) 
 -- example if jsonData.temp then 
 -- example jsonData.temp = jsonData.temp * 10 
 -- example end 
 local newJsonString = json.encode(jsonData) 
 return newJsonString 
 end`,
    description: null,
    device_config_id: null,
    enable_flag: 'Y',
    analog_input: null,
    last_analog_input: null,
    name: null,
    remark: null,
    script_type: null,
    resolt_analog_input: ''
  }
}

// Monaco Editor Configuration
const editorOptions = ref({
  automaticLayout: true,
  theme: 'vs',
  language: 'lua',
  fontSize: 14,
  lineHeight: 20,
  fontFamily: 'Consolas, "Courier New", monospace',
  wordWrap: 'on',
  lineNumbers: 'on',
  glyphMargin: true,
  folding: true,
  lineDecorationsWidth: 10,
  lineNumbersMinChars: 3,
  minimap: {
    enabled: true,
    side: 'right',
    size: 'proportional',
    showSlider: 'mouseover'
  },
  scrollBeyondLastLine: false,
  readOnly: false,
  cursorStyle: 'line',
  cursorBlinking: 'blink',
  renderWhitespace: 'selection',
  renderControlCharacters: false,
  fontLigatures: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on',
  tabCompletion: 'on',
  wordBasedSuggestions: true,
  parameterHints: {
    enabled: true
  },
  quickSuggestions: {
    other: true,
    comments: false,
    strings: false
  },
  bracketPairColorization: {
    enabled: true
  },
  guides: {
    bracketPairs: true,
    indentation: true
  },
  formatOnPaste: true,
  formatOnType: true
})

// Editor instance reference
const editorRef = ref(null)

// Editor toolbar features
const formatCode = () => {
  if (editorRef.value) {
    editorRef.value.getAction('editor.action.formatDocument').run()
  }
}

const toggleMinimap = () => {
  editorOptions.value.minimap.enabled = !editorOptions.value.minimap.enabled
}

const toggleWordWrap = () => {
  editorOptions.value.wordWrap = editorOptions.value.wordWrap === 'on' ? 'off' : 'on'
}

const changeFontSize = (delta: number) => {
  const newSize = editorOptions.value.fontSize + delta
  if (newSize >= 10 && newSize <= 24) {
    editorOptions.value.fontSize = newSize
  }
}

const configFormRules = ref({
  name: {
    required: true,
    message: $t('generate.enter-title'),
    trigger: 'blur'
  },
  content: {
    required: true,
    message: $t('generate.parse-script'),
    trigger: 'blur'
  },
  enable_flag: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  script_type: {
    required: true,
    message: $t('generate.select-processing-type'),
    trigger: 'change'
  }
})
const showModal = ref(false)

const openModal = (type: any, item: any) => {
  modalTitle.value = type
  // Initialize the form with default values ​​first
  configForm.value = defaultConfigForm()

  if (modalTitle.value === $t('common.edit')) {
    // edit mode：Load selected data
    configForm.value = JSON.parse(JSON.stringify(item))
  } else {
    // Add mode：Check if filter has value
    if (queryData.value.script_type) {
      // if filter has value，then the value is preset to the form's script_type Field
      configForm.value.script_type = queryData.value.script_type
    }
  }
  // Set up first showModal for true，Let modals and forms start rendering
  showModal.value = true

  // use nextTick make sure VDOM Executed after updates and component mounting are complete
  nextTick(() => {
    // Clear validation prompts that may be triggered by initial data binding
    configFormRef.value?.restoreValidation()
  })
}

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
const bodyStyle = ref({
  width: getPlatform.value ? '90%' : '800px'
})
const queryData: any = ref({
  device_config_id: '',
  script_type: '',
  page: 1,
  page_size: 10
})

interface DataScriptItem {
  id: string
  name: string
  content: string
  description: string
  device_config_id: string
  enable_flag: string
  script_type: string
}
const dataScriptList = ref<Array<DataScriptItem>>([])
const dataScriptTotal = ref(0)
const queryDataScriptList = async () => {
  queryData.value.device_config_id = props.configInfo.id
  const res = await getDataScriptList(queryData.value)
  dataScriptList.value = res.data.list
  dataScriptTotal.value = res.data.total
}
// const findScriptType = (scriptType: any) => {

//   if (scriptType) {
//     return scripTypeOpt.value.find((data: any) => {
//       return scriptType === data.value
//     })?.label
//   }
//   return ''
// }
const searchDataScript = () => {
  queryData.value.page = 1
  queryDataScriptList()
}

const handleChange = async (item: object) => {
  await setDeviceScriptEnable(item)
}
const handleClose = () => {
  configFormRef.value?.restoreValidation()
  showModal.value = false
}
// Submit form
const handleSubmit = async () => {
  await configFormRef?.value?.validate()
  configForm.value.device_config_id = props.configInfo.id
  if (!configForm.value.id) {
    const res = await dataScriptAdd(configForm.value)
    if (!res.error) {
      // message.success('Added successfully');
      handleClose()
      searchDataScript()
    }
  } else {
    const res = await dataScriptEdit(configForm.value)
    if (!res.error) {
      handleClose()
      // message.success('Modification successful');
      searchDataScript()
    }
  }
}
const deleteData = async (item: any) => {
  dialog.warning({
    title: $t('common.tip'),
    content: $t('common.deleteProcessing'),
    positiveText: $t('device_template.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      await dataScriptDel({ id: item.id })
      // message.success($t('custom.grouping_details.operationSuccess'));
      searchDataScript()
    }
  })
}
const doQuiz = async () => {
  await configFormRef?.value?.validate()

  try {
    const response = await dataScriptQuiz(configForm.value)
    // Add detailed debugging information
    // Check if it is an error response structure {data: null, error: {...}}
    if (response.error && response.data === null) {
      // if (process.env.NODE_ENV === 'development') {
      // }
      // Handle network errors or backend errors
      const errorInfo = response.error
      const errorMessage = errorInfo.message || t('page.dataForward.requestFailed')
      configForm.value.resolt_analog_input = `${t('page.dataForward.debugFailed')}\n${t('page.dataForward.errorType')}: ${errorInfo.name || 'Unknown'}\n${t('page.dataForward.errorCode')}: ${errorInfo.code || 'N/A'}\n${t('page.dataForward.errorMessage')}: ${errorMessage}`
      return
    }

    // Check response structure，may be nested
    let actualResponse = response
    // ifresponse.dataexist and containcodeproperty，Indicates that the real response is inresponse.datamiddle
    if (response.data && typeof response.data === 'object' && 'code' in response.data) {
      actualResponse = response.data
      // if (process.env.NODE_ENV === 'development') {
      // }
    }
    // if (process.env.NODE_ENV === 'development') {
    // }
    // According to the returnedcodeThe value determines what is displayed
    // Use loose comparison，becausecodemay be a string"200"
    if (actualResponse.code == 200 || actualResponse.code === '200') {
      // codefor200time displaydatavalue
      if (typeof actualResponse.data === 'string') {
        // ifdatais a string，display directly（include"null"string）
        configForm.value.resolt_analog_input =
          actualResponse.data === 'null' ? t('page.dataForward.debugSuccessWithNull') : actualResponse.data
      } else if (actualResponse.data === null || actualResponse.data === undefined) {
        // ifdatayesnullorundefined
        configForm.value.resolt_analog_input = t('page.dataForward.debugSuccessWithNull')
      } else {
        // ifdatais an object，Convert toJSONstring
        configForm.value.resolt_analog_input = JSON.stringify(actualResponse.data, null, 2)
      }
    } else {
      // codeNot for200error message is displayed when
      // Show prioritymessage，ifmessageIf empty, the default error message will be displayed.
      const errorMessage = actualResponse.message || t('page.dataForward.noErrorMessage')
      configForm.value.resolt_analog_input = `${t('page.dataForward.debugFailed')}\ncode: ${actualResponse.code}\nmessage: ${errorMessage}`
    }
  } catch (error) {
    // Handling request exceptions
    console.error('Debug request exception:', error)
    configForm.value.resolt_analog_input =
      t('page.dataForward.debugRequestFailed') + ': ' + (error.message || t('page.dataForward.unknownError'))
  }
}
watch(queryData.value, () => queryDataScriptList(), { deep: true })
onMounted(() => {
  queryDataScriptList()
})
</script>
<template>
  <div class="m-b-20px flex items-center gap-20px">
    <n-select v-model:value="queryData.script_type" :options="scripTypeOpt" class="max-w-40" clearable />
    <NButton type="primary" @click="openModal($t('common.add'), null)">
      {{ $t('generate.add-data-processing') }}
    </NButton>
  </div>
  <n-empty v-if="dataScriptList.length === 0" size="huge" :description="$t('common.nodata')"></n-empty>
  <NGrid v-else x-gap="24" y-gap="16" cols="1 s:2 m:3 l:4" responsive="screen">
    <NGridItem v-for="item in dataScriptList" :key="item.id">
      <ItemCard
        :title="item.name"
        :status-active="true"
        :status-type="'success'"
        :isStatus="false"
        :hideFooterLeft="true"
        hoverable
      >
        <template #default>
          <div class="item-desc">{{ item.description }}</div>
        </template>
        <!-- Upper right corner switch -->
        <template #top-right-icon>
          <NSwitch
            v-model:value="item.enable_flag"
            checked-value="Y"
            unchecked-value="N"
            @update-value="handleChange(item)"
          />
        </template>

        <!-- Bottom operation button -->
        <template #footer>
          <div class="flex items-center gap-2 w-full justify-between">
            <NButton size="small" quaternary circle @click="openModal($t('common.edit'), item)">
              <template #icon>
                <n-icon color="#888">
                  <editIcon />
                </n-icon>
              </template>
            </NButton>
            <NButton size="small" quaternary circle @click="deleteData(item)">
              <template #icon>
                <n-icon color="#888">
                  <trashIcon />
                </n-icon>
              </template>
            </NButton>
          </div>
        </template>
      </ItemCard>
      <!-- <NCard hoverable style="height: 180px">
        <div class="item-name item-center flex">
          <div class="flex-1">
            {{ item.name }}
          </div>
          <NSwitch
            v-model:value="item.enable_flag"
            checked-value="Y"
            unchecked-value="N"
            @update-value="handleChange(item)"
          />
        </div>
        <div class="h-80px flex-1">
          <div class="item-desc description">{{ item.description }}</div>
          <div class="item-desc">{{ findScriptType(item.script_type) }}</div>
        </div>
        <NFlex justify="end">
          <NButton tertiary circle type="info" @click="openModal($t('common.edit'), item)">
            <template #icon>
              <n-icon>
                <editIcon />
              </n-icon>
            </template>
          </NButton>
          <NButton circle tertiary type="error" @click="deleteData(item)">
            <template #icon>
              <n-icon>
                <trashIcon />
              </n-icon>
            </template>
          </NButton>
        </NFlex>
      </NCard> -->
    </NGridItem>
  </NGrid>

  <n-modal
    v-model:show="showModal"
    preset="dialog"
    :width="800"
    :title="modalTitle + $t('common.dataProces')"
    :show-icon="false"
    :style="bodyStyle"
    :closable="false"
  >
    <NForm
      ref="configFormRef"
      class="flex-wrap"
      :class="getPlatform ? 'flex-col' : 'flex'"
      :model="configForm"
      :rules="configFormRules"
      label-placement="left"
      label-width="auto"
    >
      <NFormItem :class="getPlatform ? 'w-100%' : 'w-50%'" :label="$t('page.manage.menu.form.title')" path="name">
        <NInput v-model:value="configForm.name" :placeholder="$t('generate.enter-title')" />
      </NFormItem>
      <NFormItem :class="getPlatform ? 'w-100%' : 'w-50%'" :label="$t('generate.processing-type')" path="script_type">
        <NSelect
          v-model:value="configForm.script_type"
          :options="scripTypeOpt"
          :placeholder="$t('generate.select-processing-type')"
        ></NSelect>
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('device_template.table_header.description')" path="description">
        <NInput
          v-model:value="configForm.description"
          type="textarea"
          :rows="2"
          :placeholder="$t('generate.enter-description')"
        />
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('generate.parse-script')" :rules="configFormRules" path="content">
        <div class="editor-container">
          <!-- Editor toolbar -->
          <div class="editor-toolbar">
            <div class="toolbar-left">
              <NButton size="small" tertiary @click="formatCode">
                <template #icon>
                  <n-icon>
                    <svg viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M9.5 15.5L4.5 10.5L9.5 5.5L8.09 4.09L1.5 10.68L8.09 17.27L9.5 15.5ZM14.5 8.5L19.5 13.5L14.5 18.5L15.91 19.91L22.5 13.32L15.91 6.73L14.5 8.5Z"
                      />
                    </svg>
                  </n-icon>
                </template>
                format
              </NButton>
              <NButton size="small" tertiary @click="toggleWordWrap">
                <template #icon>
                  <n-icon>
                    <svg viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M4 19h6v-2H4v2zM20 5H4v2h16V5zm-3 6H4v2h13.25c1.1 0 2 .9 2 2s-.9 2-2 2H15v-2l-3 3l3 3v-2h2.25c2.3 0 4.25-2.05 4.25-4.5S19.55 11 17.25 11z"
                      />
                    </svg>
                  </n-icon>
                </template>
                Automatic line wrapping
              </NButton>
              <NButton size="small" tertiary @click="toggleMinimap">
                <template #icon>
                  <n-icon>
                    <svg viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2zm4-8h6v2h-6V7zm0 4h6v2h-6v-2zm0 4h6v2h-6v-2z"
                      />
                    </svg>
                  </n-icon>
                </template>
                mini map
              </NButton>
            </div>
            <div class="toolbar-right">
              <NButton size="small" tertiary @click="changeFontSize(-1)">
                <template #icon>
                  <n-icon>
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13H5v-2h14v2z" /></svg>
                  </n-icon>
                </template>
              </NButton>
              <span class="font-size-display">{{ editorOptions.fontSize }}px</span>
              <NButton size="small" tertiary @click="changeFontSize(1)">
                <template #icon>
                  <n-icon>
                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                  </n-icon>
                </template>
              </NButton>
            </div>
          </div>
          <!-- Monaco Editor -->
          <div class="editor-wrapper">
            <MonacoEditor
              ref="editorRef"
              v-model:value="configForm.content"
              :options="editorOptions"
              height="300"
              language="lua"
              class="custom-monaco-editor"
            />
          </div>
        </div>
      </NFormItem>
      <NFormItem
        v-if="0"
        class="w-100%"
        :label="$t('page.manage.setting.dataClearSetting.form.enabled')"
        path="enable_flag"
      >
        <NSwitch v-model:value="configForm.enable_flag" checked-value="Y" unchecked-value="N" />
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('generate.simulate-input')" path="last_analog_input">
        <NInput v-model:value="configForm.last_analog_input" type="textarea" :rows="2" />
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('generate.debug-run-result')" path="resolt_analog_input">
        <NInput v-model:value="configForm.resolt_analog_input" :rows="5" :disabled="true" type="textarea" />
      </NFormItem>
      <NFormItem>
        <NButton type="primary" @click="doQuiz">{{ $t('common.debug') }}</NButton>
      </NFormItem>
    </NForm>
    <NFlex justify="end">
      <NButton @click="handleClose">{{ $t('generate.cancel') }}</NButton>
      <NButton type="primary" @click="handleSubmit">{{ $t('common.save') }}</NButton>
    </NFlex>
  </n-modal>
</template>

<style scoped lang="scss">
.alarm-box {
  display: flex;
  flex-flow: row;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 40px;

  .alarm-item {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 18px;
    flex: 0 0 23%;
    margin-right: calc(30% / 3);
    margin-bottom: 30px;

    .item-name {
      display: flex;
      flex-flow: row;
      align-items: center;
      justify-content: space-between;
    }

    .item-desc {
      margin: 15px 0;
    }

    .item-operate {
      display: flex;
      flex-flow: row;
      justify-content: space-between;
      align-items: center;
    }
  }
}

.description {
  height: 40px;
  word-break: break-all;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* Editor container style */
.editor-container {
  width: 100%;
  border: 1px solid #e0e0e6;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e6;
  min-height: 40px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.font-size-display {
  font-size: 12px;
  color: #666;
  min-width: 35px;
  text-align: center;
}

.editor-wrapper {
  position: relative;
  background: #fff;
  width: 100%;
}

.custom-monaco-editor {
  border: none !important;
  width: 100% !important;
}

/* Editor toolbar button style optimization */
.editor-toolbar .n-button {
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
}

.editor-toolbar .n-button .n-icon {
  font-size: 14px;
}

/* Responsive design */
@media (max-width: 768px) {
  .editor-toolbar {
    flex-direction: column;
    gap: 8px;
    padding: 12px;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }
}
</style>
