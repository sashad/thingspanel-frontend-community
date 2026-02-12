<script setup lang="ts">
import { ref } from 'vue'
// import { useMessage } from "naive-ui";
import { createServiceDrop, getServiceAccessForm, putServiceDrop, getServiceListDrop } from '@/service/api/plugin'
import { $t } from '@/locales'
import FormInput from './form.vue'

// const message = useMessage();
const isEdit = ref<any>(false)
const emit = defineEmits(['getList', 'isEdit'])
const serviceModals = ref<any>(false)
const formRef = ref<any>(null)
const currentStep = ref(1)

const service_plugin_id = ref<any>('')
const formElements = ref<any>([])
const defaultForm = {
  name: '',
  service_plugin_id: '',
  voucher: {},
  vouchers: {},
  auth_type: 'manual' // Add schema field，Default is manual
}
const form = ref<any>({ ...defaultForm })
const rules = ref<any>({
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: 'Please enter access point name'
  },
  auth_type: {
    required: true,
    trigger: ['change'],
    message: 'Please select mode'
  }
})
const openModal: (id: any, row?: any) => void = async (id, row) => {
  if (row) {
    // edit mode：set up isEdit for true and populate the form data
    isEdit.value = true
    Object.assign(form.value, row)
    const voucherData = JSON.parse(row.voucher)
    Object.assign(form.value.vouchers, voucherData)
    // from voucher echo in the parsed data auth_type to select mode field
    if (voucherData.auth_type) {
      form.value.auth_type = voucherData.auth_type
    }
  } else {
    // New mode：reset isEdit for false
    isEdit.value = false
  }
  service_plugin_id.value = id
  form.value.service_plugin_id = id
  const data = await getServiceAccessForm({
    service_plugin_id: service_plugin_id.value
  })
  if (data.data) {
    formElements.value = data.data
    serviceModals.value = true
  }
}
const close: () => void = () => {
  serviceModals.value = false
  form.value = { ...defaultForm }
  form.value.vouchers = {}
  currentStep.value = 1
  // Reset editing status
  isEdit.value = false
}

const submitSevice: () => void = async () => {
  formRef.value?.validate(async errors => {
    if (errors) return

    // Whether in manual or automatic mode，First call the interface to create/Update service
    // exist vouchers Add in auth_type Field
    form.value.vouchers.auth_type = form.value.auth_type
    form.value.voucher = JSON.stringify(form.value.vouchers)
    const data: any = isEdit.value ? await putServiceDrop(form.value) : await createServiceDrop(form.value)
    serviceModals.value = false

    if (form.value.auth_type === 'auto') {
      // automatic mode，Call the device list interface（Same as manual mode）
      try {
        await getServiceListDrop({
          voucher: form.value.voucher,
          service_type: '', // May need to be adjusted according to actual conditions
          page: 1,
          page_size: 10
        })
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
        }
      }
      
      // Close the current pop-up window，and open the configuration pop-up window
      const id = isEdit.value ? form.value.id : data.data.id
      emit(
        'isEdit',
        form.value.voucher,
        {
          id: id,
          auth_type: form.value.auth_type,
          name: form.value.name
        },
        true
      )
    } else {
      // Manual mode handling
      const id = isEdit.value ? form.value.id : data.data.id
      emit('isEdit', form.value.voucher, id, isEdit.value)
    }

    // Reset form
    form.value = { ...defaultForm }
    form.value.vouchers = {}
  })
}

defineExpose({ openModal })
</script>

<template>
  <n-modal
    v-model:show="serviceModals"
    preset="dialog"
    :title="$t('card.addNewAccessPoint')"
    class="w"
    @after-leave="close"
  >
    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
    >
      <n-form-item :label="$t('card.accessPointName')" path="name">
        <n-input v-model:value="form.name" placeholder="Please enter access point name" />
      </n-form-item>
      <n-form-item :label="$t('common.selectionMode')" path="auth_type">
        <n-radio-group v-model:value="form.auth_type">
          <n-radio value="manual">{{ $t('common.manual') }}</n-radio>
          <n-radio value="auto">{{ $t('common.automatic') }}</n-radio>
        </n-radio-group>
      </n-form-item>
    </n-form>
    <div class="box">
      <FormInput v-model:protocol-config="form.vouchers" :form-elements="formElements"></FormInput>
    </div>
    <div class="footer">
      <NButton type="primary" class="btn" @click="submitSevice">{{ $t('card.saveNext') }}</NButton>
      <NButton @click="close">{{ $t('common.cancel') }}</NButton>
    </div>
  </n-modal>
</template>

<style lang="scss" scoped>
.selectType {
  width: 100%;
}
.footer {
  display: flex;
  flex-direction: row-reverse;
  .btn {
    margin-left: 10px;
  }
}
.box {
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss">
.w {
  width: 70% !important;
  margin-top: 15vh;
  height: max-content !important;
  max-height: 800px !important;
  overflow: auto;
}
</style>
