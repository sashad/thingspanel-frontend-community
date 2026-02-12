<script setup lang="ts">
import { defineProps, onMounted, reactive, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInst, FormRules } from 'naive-ui'
import { NButton, NForm, NFormItem, NInput, NSelect } from 'naive-ui'
import type { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import {
  devicCeonnectForm,
  getDeviceConnectInfo,
  getPlugininfoByService,
  updateDeviceVoucher
} from '@/service/api/device'
import { useDeviceDataStore } from '@/store/modules/device'
import { $t } from '@/locales'
const router = useRouter()
// Define supported form element types
type FormElementType = 'input' | 'table' | 'select'
const formRef = ref<FormInst | null>(null)

const formRules = ref<FormRules>({})

// Define options interface，Applicable to select Type of form element
interface Option {
  label: string
  value: number | string
}

// Define validation rule interface
interface Validate {
  message: string // Error message displayed when verification fails
  required?: boolean // Specifies whether the field is required
  rules?: string // Regular expression rules for validating field values
  type?: 'number' | 'string' | 'array' | 'boolean' | 'object' // Type of verification
}

// Define form element interface
interface FormElement {
  type: FormElementType // Type of form element
  dataKey: string // The key used to uniquely identify the form element
  label: string // The text that appears as the form element label
  options?: Option[] // Enumeration options for drop-down selection，only select Valid when type
  placeholder?: string // Prompt text，only input Valid when type
  validate?: Validate // Object containing form validation rules
  array?: FormElement[] // only table Valid when type，Define the configuration of table columns
}

const deviceDataStore = useDeviceDataStore()

const props = defineProps<{
  id: string
}>()
const formElements = ref<FormElement[]>([])
const formData = reactive({})
const getFormJson = async () => {
  const res = await devicCeonnectForm({ device_id: props.id })

  formElements.value = res.data
}
const connectInfo = ref<object>({})
const feachConnectInfo = async () => {
  const res = await getDeviceConnectInfo({ device_id: props.id })
  connectInfo.value = res.data
}

const pluginInfo = ref<object>({})
const getPlugininfoByServiceReq = async str => {
  const { error, data } = await getPlugininfoByService(str)
  if (!error) {
    pluginInfo.value = data
  }
}

onMounted(async () => {
  await deviceDataStore.fetchData(props.id)
  const service_identifier = deviceDataStore?.deviceData?.device_config?.protocol_type
  if (service_identifier) {
    getPlugininfoByServiceReq({ service_identifier })
  }

  feachConnectInfo()
  getFormJson()
})

watchEffect(() => {
  const str = deviceDataStore?.deviceData?.voucher || '{}'
  const thejson = JSON.parse(str)
  if (formElements.value && Array.isArray(formElements.value)) {
    formElements.value.forEach(element => {
      if (element.type === 'table' && Array.isArray(element.array)) {
        element.array.forEach(subElement => {
          formRules.value[element.dataKey] = subElement.validate || {}
          formData[subElement.dataKey] ??= thejson[subElement.dataKey] || ''
        })
      } else {
        formRules.value[element.dataKey] = element.validate || {}
        formData[element.dataKey] = thejson[element.dataKey] || ''
      }
    })
  }
})

const handleSubmit = async () => {
  await formRef.value?.validate()
  await updateDeviceVoucher({
    device_id: props.id,
    voucher: JSON.stringify(formData)
  })
  window.$message?.success($t('common.updateSuccess'))
}
const copy = async param => {
  const element = document.getElementById(param.toString())
  const range = document.createRange()
  range.selectNodeContents(element!)
  const selection = document.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  document.execCommand('Copy')
  window.$message?.success($t('theme.configOperation.copySuccess'))
}
const toServiceClick = () => {
  if (deviceDataStore?.deviceData?.access_way === 'B') {
    router.push(
      `/device/service-details?id=${pluginInfo.value.id}&service_type=${pluginInfo.value.service_type}&service_name=${pluginInfo.value.name}&service_identifier=${pluginInfo.value.service_identifier}`
    )
  }
}
</script>

<template>
  <div>
    <n-descriptions label-placement="left" :column="1" class="mt-6">
      <n-descriptions-item :label="$t('generate.access-method-service')">
        <div :class="deviceDataStore?.deviceData?.access_way === 'B' ? 'blue-text' : ''" @click="toServiceClick">
          {{ deviceDataStore?.deviceData?.device_config?.protocol_type || '--' }}
        </div>
      </n-descriptions-item>
    </n-descriptions>

    <NCard v-if="deviceDataStore?.deviceData?.access_way !== 'B'"  class="mb-6 mt-6">
      <NForm ref="formRef" :rules="formRules" :model="formData">
        <template v-for="element in formElements" :key="element.dataKey">
          <div v-if="element.type === 'input'" class="form-item">
            <NFormItem :label="element.label" :path="element.dataKey" style="height: 50px">
              <NInput v-model:value="formData[element.dataKey]" :placeholder="element.placeholder" />
            </NFormItem>
          </div>
          <div v-if="element.type === 'select'" class="form-item">
            <NFormItem :label="element.label" :path="element.dataKey">
              <NSelect v-model:value="formData[element.dataKey]" :options="element.options as SelectMixedOption[]" />
            </NFormItem>
          </div>
          <div v-if="element.type === 'table'">
            <!--          <div class="table-label">{{ element.label }}</div>-->
            <div class="table-content">
              <template v-for="subElement in element.array" :key="subElement.dataKey">
                <div v-if="subElement.type === 'input'" class="table-item">
                  <NFormItem :label="subElement.label" :path="subElement.dataKey">
                    <NInput v-model:value="formData[subElement.dataKey]" :placeholder="subElement.placeholder" />
                  </NFormItem>
                </div>
                <div v-if="subElement.type === 'select'" class="table-item">
                  <NFormItem :label="subElement.label" :path="subElement.dataKey">
                    <NSelect
                      v-model:value="formData[subElement.dataKey]"
                      :options="subElement.options as SelectMixedOption[]"
                    />
                  </NFormItem>
                </div>
              </template>
            </div>
          </div>
        </template>
      </NForm>
    </NCard>
    <n-scrollbar v-if="deviceDataStore?.deviceData?.access_way !== 'B'" class="h-400px">
      <NCard>
        <NDescriptions :column="1">
          <NDescriptionsItem v-for="(value, key, index) in connectInfo" :key="key" :index="index" :label="key">
            <span :id="index.toString()" class="font-600" @click="copy(index)">{{ value }}</span>
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>
    </n-scrollbar>
    <div v-if="deviceDataStore?.deviceData?.access_way !== 'B'" class="mt-4 w-full flex-center">
      <NButton type="primary" @click="handleSubmit">{{ $t('common.save') }}</NButton>
    </div>
  </div>
</template>

<style scoped>
.form-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.form-item > * {
  width: 100%;
}

.table-label {
  font-weight: bold;
  margin-bottom: 10px;
}

.table-content {
  margin-left: 20px;
}

.table-item {
  margin-bottom: 8px;
}
.blue-text {
  color: blue;
  cursor: pointer;
}
</style>
