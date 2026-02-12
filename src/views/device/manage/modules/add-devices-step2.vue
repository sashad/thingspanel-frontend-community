<script setup lang="ts">
import { defineProps, onMounted, reactive, ref, watchEffect } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { NButton, NForm, NFormItem, NInput, NSelect } from 'naive-ui'
import type { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import { getDeviceConnectInfo, updateDeviceVoucher } from '@/service/api/device'
import { $t } from '@/locales'

const formRef = ref<FormInst | null>(null)

const formRules = ref<FormRules>({})
// Define supported form element types
type FormElementType = 'input' | 'table' | 'select'

// Define options interface，Applicable to select Type of form element
interface Option {
  label: string
  value: number | string
}

// Define validation rule interface
interface Validate {
  message?: string // Error message displayed when verification fails
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

const props = defineProps<{
  formElements: FormElement[]
  nextCallback: () => void
  device_id: string
  formData: object
  setIsSuccess: (flag: boolean) => void
}>()

// eslint-disable-next-line vue/no-dupe-keys
const formData = reactive({})
const connectInfo = ref<object>({})
const feachConnectInfo = async () => {
  const res = await getDeviceConnectInfo({ device_id: props.device_id })
  connectInfo.value = res.data
}

onMounted(() => {
  feachConnectInfo()
})
watchEffect(() => {
  if (props.formElements && Array.isArray(props.formElements)) {
    props.formElements.forEach(element => {
      if (element.type === 'table' && Array.isArray(element.array)) {
        element.array.forEach(subElement => {
          formRules.value[element.dataKey] = subElement.validate || {}
          formData[subElement.dataKey] ??= props.formData[subElement.dataKey] || ''
        })
      } else {
        formRules.value[element.dataKey] = element.validate || {}
        formData[element.dataKey] ??= props.formData[element.dataKey] || ''
      }
    })
  }
})

const handleSubmit = async () => {
  // eslint-disable-next-line consistent-return
  await formRef.value?.validate()

  const res = await updateDeviceVoucher({
    device_id: props.device_id,
    voucher: JSON.stringify(formData) || '{}'
  })

  if (!res.error) {
    props.setIsSuccess(true)
    props.nextCallback()
  } else {
    props.setIsSuccess(false)
    props.nextCallback()
  }
}
const copy = event => {
  const input = event.target
  input.select()
  document.execCommand('copy')
  window.$message?.success($t('theme.configOperation.copySuccess'))
}
</script>

<template>
  <NForm ref="formRef" :rules="formRules" :model="formData">
    <n-scrollbar style="max-height: 360px">
      <template v-for="element in formElements" :key="element.dataKey">
        <div v-if="element.type === 'input'" class="form-item">
          <NFormItem :label="element.label" :path="element.dataKey">
            <NInput
              id="input"
              v-model:value="formData[element.dataKey]"
              :placeholder="element.placeholder"
              @click="copy"
            />
          </NFormItem>
        </div>
        <div v-if="element.type === 'select'" class="form-item">
          <NFormItem :label="element.label" :path="element.dataKey">
            <NSelect v-model:value="formData[element.dataKey]" :options="element.options as SelectMixedOption[]" />
          </NFormItem>
        </div>
        <div v-if="element.type === 'table'">
          <div class="table-label">{{ element.label }}</div>
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

      <NCard style="margin-top: -15px" :title="$t('custom.devicePage.connectInfo')">
        <NDescriptions :column="1">
          <NDescriptionsItem v-for="(value, key) in connectInfo" :key="key" :label="key">
            <span class="font-600">{{ value }}</span>
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>
    </n-scrollbar>
    <div class="mt-4 w-full flex-center">
      <NButton type="primary" @click="handleSubmit">{{ $t('custom.devicePage.saveAndNext') }}</NButton>
    </div>
  </NForm>
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
</style>
