<script setup lang="ts">
import { computed, reactive, ref, toRefs, watch } from 'vue'
import type { FormInst, FormItemRule } from 'naive-ui'
import {
  NButton,
  NForm,
  NFormItemGridItem,
  NGrid,
  NInput,
  NModal,
  NSpace,
  NSelect,
  NRadioGroup,
  NRadio
} from 'naive-ui'
// import { genderOptions } from '@/constants'
import { addUser, editUser } from '@/service/api/auth'
import { createRequiredFormRule, formRules, getConfirmPwdRule } from '@/utils/form/rule'
import { userStatusOptions } from '@/constants/business'
import { $t } from '@/locales'
import ProvinceCityDistrictSelector from '@/components/common/ProvinceCityDistrictSelector.vue'

export interface Props {
  /** Popup visibility */
  visible: boolean
  /** Popup type add: New edit: edit */
  type?: 'add' | 'edit'
  /** Edited table row data */
  editData?: UserManagement.User | null
}

export type ModalType = NonNullable<Props['type']>

defineOptions({ name: 'TableActionModal' })

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
})

interface Emits {
  (e: 'update:visible', visible: boolean): void

  /** Click Agreement */
  (e: 'success'): void
}

const emit = defineEmits<Emits>()

const modalVisible = computed({
  get() {
    return props.visible
  },
  set(visible) {
    emit('update:visible', visible)
  }
})

const customUserStatusOptions = computed(() => {
  return userStatusOptions.map(item => {
    const key = item.value === 'N' ? 'page.manage.user.status.normal' : 'page.manage.user.status.freeze'
    return {
      label: $t(key),
      value: item.value
    }
  })
})

// Calculate complete mobile phone number
const fullPhoneNumber = computed(() => {
  return `${formModel.country_code}${formModel.phone_only}`
})

// Time zone options
const timezoneOptions = [
  { label: 'Asia/Shanghai (Beijing time)', value: 'Asia/Shanghai' },
  { label: 'Asia/Tokyo (Tokyo time)', value: 'Asia/Tokyo' },
  { label: 'Asia/Seoul (Seoul time)', value: 'Asia/Seoul' },
  { label: 'Asia/Singapore (Singapore time)', value: 'Asia/Singapore' },
  { label: 'Asia/Hong_Kong (Hong Kong time)', value: 'Asia/Hong_Kong' },
  { label: 'Asia/Bangkok (Bangkok time)', value: 'Asia/Bangkok' },
  { label: 'Asia/Dubai (dubai time)', value: 'Asia/Dubai' },
  { label: 'Asia/Kolkata (indian time)', value: 'Asia/Kolkata' },
  { label: 'Europe/London (london time)', value: 'Europe/London' },
  { label: 'Europe/Paris (paris time)', value: 'Europe/Paris' },
  { label: 'Europe/Berlin (Berlin time)', value: 'Europe/Berlin' },
  { label: 'Europe/Moscow (Moscow time)', value: 'Europe/Moscow' },
  { label: 'America/New_York (new york time)', value: 'America/New_York' },
  { label: 'America/Los_Angeles (Los Angeles time)', value: 'America/Los_Angeles' },
  { label: 'America/Chicago (chicago time)', value: 'America/Chicago' },
  { label: 'America/Toronto (toronto time)', value: 'America/Toronto' },
  { label: 'Australia/Sydney (Sydney time)', value: 'Australia/Sydney' },
  { label: 'Australia/Melbourne (Melbourne time)', value: 'Australia/Melbourne' },
  { label: 'Pacific/Auckland (Auckland time)', value: 'Pacific/Auckland' },
  { label: 'UTC (coordinated universal time)', value: 'UTC' }
]

// Language options
const languageOptions = [
  { label: 'Chinese', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
]

// Country code options
const countryCodeOptions = [
  { label: '+86', value: '+86' },
  { label: '+1', value: '+1' },
  { label: '+44', value: '+44' },
  { label: '+33', value: '+33' },
  { label: '+49', value: '+49' },
  { label: '+39', value: '+39' },
  { label: '+34', value: '+34' },
  { label: '+7', value: '+7' },
  { label: '+81', value: '+81' },
  { label: '+82', value: '+82' },
  { label: '+65', value: '+65' },
  { label: '+60', value: '+60' },
  { label: '+66', value: '+66' },
  { label: '+84', value: '+84' },
  { label: '+62', value: '+62' },
  { label: '+63', value: '+63' },
  { label: '+91', value: '+91' },
  { label: '+61', value: '+61' },
  { label: '+64', value: '+64' },
  { label: '+55', value: '+55' },
  { label: '+52', value: '+52' },
  { label: '+54', value: '+54' },
  { label: '+27', value: '+27' },
  { label: '+20', value: '+20' },
  { label: '+971', value: '+971' },
  { label: '+966', value: '+966' },
  { label: '+90', value: '+90' },
  { label: '+31', value: '+31' },
  { label: '+46', value: '+46' },
  { label: '+47', value: '+47' },
  { label: '+45', value: '+45' },
  { label: '+41', value: '+41' },
  { label: '+43', value: '+43' },
  { label: '+32', value: '+32' },
  { label: '+351', value: '+351' },
  { label: '+30', value: '+30' },
  { label: '+48', value: '+48' },
  { label: '+420', value: '+420' },
  { label: '+36', value: '+36' },
  { label: '+385', value: '+385' },
  { label: '+852', value: '+852' },
  { label: '+853', value: '+853' },
  { label: '+886', value: '+886' }
]

// Handling province and city selection changes
const handleAddressChange = (value: { province: string; city: string; district: string }) => {
  // Update address data in form model
  formModel.address.province = value.province
  formModel.address.city = value.city
  formModel.address.district = value.district
}

const closeModal = () => {
  modalVisible.value = false
}

const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: $t('common.add'),
    edit: $t('common.edit')
  }
  return titles[props.type]
})

const formRef = ref<HTMLElement & FormInst>()

type FormModel = Pick<UserManagement.User, 'email' | 'name' | 'phone_number' | 'gender' | 'remark' | 'status'> & {
  password: string
  confirmPwd: string
  organization: string
  timezone: string
  default_language: string
  country_code: string
  phone_only: string
  address: {
    province: string
    city: string
    district: string
    detailed_address: string
  }
}

const formModel = reactive<FormModel>(createDefaultFormModel())

const rules = ref({})
// Mobile phone number verification rules
const phoneNumberRule: FormItemRule = {
  validator: (rule, value) => {
    if (!value) return true
    // Only numbers allowed
    if (!/^\d+$/.test(value)) {
      return new Error($t('form.phone.invalid'))
    }
    // // Length check（Adjust according to area code）
    // const minLength = formModel.country_code === '+86' ? 11 : 7
    // const maxLength = formModel.country_code === '+86' ? 11 : 15
    // if (value.length < minLength || value.length > maxLength) {
    //   return new Error(`The length of mobile phone number should be within${minLength}-${maxLength}between bits`)
    // }
    return true
  },
  trigger: ['input', 'blur']
}
watch(
  () => props.type,
  () => {
    if (props.type == 'add') {
      rules.value = {
        name: createRequiredFormRule($t('common.pleaseCheckValue')),
        gender: createRequiredFormRule($t('common.pleaseCheckValue')),
        phone_only: [createRequiredFormRule($t('form.phone.required'))].concat(phoneNumberRule),
        email: formRules.email,
        password: [{ required: true, message: $t('form.pwd.tip') }].concat(formRules.pwd),
        confirmPwd: getConfirmPwdRule(toRefs(formModel).password),
        status: getConfirmPwdRule(toRefs(formModel).password),
        remark: createRequiredFormRule($t('common.pleaseCheckValue')),
        // organization: createRequiredFormRule($t('common.pleaseCheckValue')),
        timezone: createRequiredFormRule($t('common.pleaseCheckValue')),
        default_language: createRequiredFormRule($t('common.pleaseCheckValue'))
        // address: {
        //   province: createRequiredFormRule($t('page.manage.user.form.address')),
        //   city: createRequiredFormRule($t('page.manage.user.form.address')),
        //   district: createRequiredFormRule($t('page.manage.user.form.address')),
        //   detailed_address: createRequiredFormRule($t('page.manage.user.form.detailedAddress'))
        // }
      }
    } else {
      rules.value = {}
    }
  },
  {
    immediate: true
  }
)

function createDefaultFormModel(): FormModel {
  return {
    name: '',
    gender: null,
    phone_number: '',
    email: '',
    password: '',
    confirmPwd: '',
    remark: '',
    status: 'N',
    organization: '',
    timezone: 'Asia/Shanghai',
    default_language: 'zh-CN',
    country_code: '+86',
    phone_only: '',
    address: {
      province: '',
      city: '',
      district: '',
      detailed_address: ''
    }
  }
}

// Parse mobile phone number，Split into area code and mobile phone number parts
function parsePhoneNumber(phoneNumber: string): { country_code: string; phone_only: string } {
  if (!phoneNumber) {
    return { country_code: '+86', phone_only: '' }
  }

  // Remove all spaces and special characters，Only keep numbers and+Number
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '')

  // Match area codes by length（Match from long to short，Avoid mismatches）
  const sortedCountryCodes = countryCodeOptions.map(option => option.value).sort((a, b) => b.length - a.length)

  for (const code of sortedCountryCodes) {
    if (cleanPhone.startsWith(code)) {
      return {
        country_code: code,
        phone_only: cleanPhone.substring(code.length)
      }
    }
  }

  // If no area code is matched，Used by default+86
  return {
    country_code: '+86',
    phone_only: cleanPhone
  }
}

function handleUpdateFormModel(model: Partial<FormModel>) {
  Object.assign(formModel, model)
}

function handleUpdateFormModelByModalType() {
  const handlers: Record<ModalType, () => void> = {
    add: () => {
      const defaultFormModel = createDefaultFormModel()

      handleUpdateFormModel(defaultFormModel)
    },
    edit: () => {
      if (props.editData) {
        // Extract address fields from backend data（The address field is in address in object）
        const editDataAny = props.editData as any
        const addressData = editDataAny.address || {
          province: '',
          city: '',
          district: '',
          detailed_address: ''
        }

        // Parse existing mobile phone number，Split into area code and mobile phone number parts
        const phoneData = parsePhoneNumber(editDataAny.phone_number || '')

        // There is no need to build values ​​for cascading selectors in edit mode，Because we are using independent province and city fields
        const editFormData = {
          ...editDataAny,
          password: '',
          confirmPwd: '',
          organization: editDataAny.organization || '',
          timezone: editDataAny.timezone || 'Asia/Shanghai',
          default_language: editDataAny.default_language || 'zh-CN',
          country_code: phoneData.country_code,
          phone_only: phoneData.phone_only,
          address: {
            ...addressData
          }
        }
        handleUpdateFormModel(editFormData)

        // In edit mode, the address data has been set directly into the form model.
      }
    }
  }

  handlers[props.type]()
}

async function handleSubmit() {
  await formRef.value?.validate()

  // Prepare data for submission，Make sure the address fields are correct
  const submitData = {
    ...formModel
  }

  // Remove fields that do not need to be submitted
  delete (submitData as any).confirmPwd

  let data: any
  if (props.type === 'add') {
    data = await addUser(submitData)
  } else if (props.type === 'edit') {
    data = await editUser(submitData)
  }
  if (!data.error) {
    // window.$message?.success(data.msg);
    emit('success')
  }
  closeModal()
}

watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      handleUpdateFormModelByModalType()
    }
  }
)

// Monitor area code and mobile phone number changes，Update complete mobile number
watch(
  () => [formModel.country_code, formModel.phone_only],
  () => {
    formModel.phone_number = fullPhoneNumber.value
  },
  { deep: true }
)
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-700px">
    <NForm ref="formRef" label-placement="left" :label-width="80" :model="formModel" :rules="rules">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="12" :label="$t('page.manage.user.userName')" path="name">
          <NInput v-model:value="formModel.name" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.manage.user.userEmail')" path="email">
          <NInput v-model:value="formModel.email" :disabled="type === 'edit'" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.manage.user.userPhone')" path="phone_only">
          <div class="flex gap-2">
            <NSelect
              v-model:value="formModel.country_code"
              :options="countryCodeOptions"
              class="w-24"
              :placeholder="'area code'"
            />
            <NInput v-model:value="formModel.phone_only" :placeholder="'Please enter mobile phone number'" class="flex-1" />
          </div>
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.manage.user.organization')" path="organization">
          <NInput v-model:value="formModel.organization" :placeholder="$t('page.manage.user.form.organization')" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.manage.user.timezone')" path="timezone">
          <NSelect
            v-model:value="formModel.timezone"
            :options="timezoneOptions"
            :placeholder="$t('page.manage.user.form.timezone')"
          />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.manage.user.defaultLanguage')" path="default_language">
          <NSelect
            v-model:value="formModel.default_language"
            :options="languageOptions"
            :placeholder="$t('page.manage.user.form.defaultLanguage')"
          />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('page.manage.user.address')" path="address.province">
          <ProvinceCityDistrictSelector
            :province="formModel.address.province"
            :city="formModel.address.city"
            :district="formModel.address.district"
            @change="handleAddressChange"
          />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('page.manage.user.detailedAddress')" path="address.detailed_address">
          <NInput
            v-model:value="formModel.address.detailed_address"
            :placeholder="$t('page.manage.user.form.detailedAddress')"
          />
        </NFormItemGridItem>

        <template v-if="type === 'add'">
          <NFormItemGridItem :span="12" :label="$t('page.manage.user.password')" path="password">
            <NInput v-model:value="formModel.password" type="password" />
          </NFormItemGridItem>
          <NFormItemGridItem :span="12" :label="$t('page.manage.user.confirmPwd')" path="confirmPwd">
            <NInput v-model:value="formModel.confirmPwd" type="password" />
          </NFormItemGridItem>
        </template>
        <n-form-item-grid-item v-else :span="12" :label="$t('page.manage.user.accountStatus')">
          <n-radio-group v-model:value="formModel.status">
            <n-radio v-for="item in customUserStatusOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </n-radio>
          </n-radio-group>
        </n-form-item-grid-item>
        <NFormItemGridItem :span="24" :label="$t('common.remark')">
          <NInput v-model:value="formModel.remark" type="textarea" />
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped></style>
