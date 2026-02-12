<script setup lang="ts">
/**
 * Template edit form - Basic information
 * from step-template-info.vue Extracted form logic
 */

import { ref, onMounted } from 'vue'
import type { UploadFileInfo } from 'naive-ui'
import { NForm, NFormItem, NInput, NTag, NButton, NUpload, NSpace, NDynamicTags } from 'naive-ui'
import { $t } from '@/locales'
import { localStg } from '@/utils/storage'
import { getDemoServerUrl } from '@/utils/common/tool'
import { putTemplat, getTemplat } from '@/service/api/system-data'
import { createProxyPattern } from '~/env.config'
import SvgIcon from '@/components/custom/svg-icon.vue'

const emit = defineEmits(['success', 'cancel'])

const props = defineProps<{
  templateId: string
}>()

const formRef = ref<any>(null)

// form data
interface FormData {
  name: string
  templateTage: string[]
  version: string
  author: string
  description: string
  path: string
  label: string
  id?: string
}

const formData = ref<FormData>({
  name: '',
  templateTage: [],
  version: '',
  author: '',
  description: '',
  path: '',
  label: ''
})

// form validation rules
const formRules = {
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('device_template.enterTemplateName')
  }
}

// Image upload
const isHttpProxy = import.meta.env.VITE_HTTP_PROXY === 'Y'
const uploadUrl = isHttpProxy ? createProxyPattern() : getDemoServerUrl()
const url = ref(uploadUrl)
const iconPreviewUrl = ref('')

const handleUploadFinish = ({ event }: { file: UploadFileInfo; event?: ProgressEvent }) => {
  if (!event || !event.target) return

  const xhr = event.target as XMLHttpRequest
  const response = JSON.parse(xhr.response)

  if (response.data && response.data.path) {
    formData.value.path = response.data.path
    // Use server domain name when displaying images，remove /api/v1 path
    const serverUrl = getDemoServerUrl().replace('/api/v1', '')
    iconPreviewUrl.value = serverUrl + response.data.path.substring(1)
  }
}

const uploadHeaders = {
  'x-token': localStg.get('token') || ''
}

/**
 * Load template data
 */
const loadTemplateData = async () => {
  if (!props.templateId) return

  try {
    const res = await getTemplat(props.templateId)
    if (!res.error && res.data) {
      const data = res.data
      formData.value = {
        id: data.id,
        name: data.name || '',
        templateTage: data.label ? data.label.split(',').filter(Boolean) : [],
        version: data.version || '',
        author: data.author || '',
        description: data.description || '',
        path: data.path || '',
        label: data.label || ''
      }

      // Set icon preview
      if (data.path) {
        const serverUrl = getDemoServerUrl().replace('/api/v1', '')
        iconPreviewUrl.value = serverUrl + data.path.substring(1)
      }
    }
  } catch (error) {
    console.error('Failed to load template data:', error)
  }
}

/**
 * save
 */
const handleSave = async () => {
  try {
    await formRef.value?.validate()

    // WilltemplateTageConvert array to comma separated string
    formData.value.label = formData.value.templateTage.join(',')

    const response = await putTemplat(formData.value)

    if (!response.error) {
      window.$message?.success($t('common.updateSuccess'))
      emit('success')
    } else {
      window.$message?.error(response.error || $t('common.saveFailed'))
    }
  } catch (error) {
    console.error('Failed to save template information:', error)
  }
}

/**
 * Cancel
 */
const handleCancel = () => {
  emit('cancel')
}

onMounted(() => {
  loadTemplateData()
})
</script>

<template>
  <div class="template-edit-form">
    <NForm ref="formRef" :model="formData" :rules="formRules" label-placement="left" label-width="100">
      <!-- Template name -->
      <NFormItem :label="$t('device_template.table_header.templateName')" path="name">
        <NInput v-model:value="formData.name" :placeholder="$t('device_template.enterTemplateName')" />
      </NFormItem>

      <!-- Version -->
      <NFormItem :label="$t('device_template.version')">
        <NInput v-model:value="formData.version" :placeholder="$t('device_template.enterTemplateVersion')" />
      </NFormItem>

      <!-- author -->
      <NFormItem :label="$t('device_template.author')">
        <NInput v-model:value="formData.author" :placeholder="$t('device_template.enterTemplateAuthor')" />
      </NFormItem>

      <!-- Label -->
      <NFormItem :label="$t('generate.labels')">
        <NDynamicTags v-model:value="formData.templateTage" />
      </NFormItem>

      <!-- cover icon -->
      <NFormItem :label="$t('device_template.cover')">
        <NUpload
          :action="url + '/file/up'"
          :headers="uploadHeaders"
          :data="{ type: 'image' }"
          :show-file-list="false"
          accept="image/png, image/jpeg, image/jpg, image/gif"
          @finish="handleUploadFinish"
        >
          <n-upload-dragger class="upload-dragger">
            <div class="upload-content">
              <img v-if="iconPreviewUrl" :src="iconPreviewUrl" class="preview-img" />
              <template v-else>
                <SvgIcon local-icon="picture" :size="35" />
                <p class="upload-text">{{ $t('device_template.selectCover') }}</p>
              </template>
            </div>
          </n-upload-dragger>
        </NUpload>
      </NFormItem>

      <!-- describe -->
      <NFormItem :label="$t('device_template.table_header.description')">
        <NInput
          v-model:value="formData.description"
          type="textarea"
          :placeholder="$t('device_template.table_header.PleaseEnterADescription')"
          :autosize="{ minRows: 3, maxRows: 6 }"
        />
      </NFormItem>

      <!-- Action button -->
      <NFormItem>
        <NSpace>
          <NButton @click="handleCancel">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSave">{{ $t('common.save') }}</NButton>
        </NSpace>
      </NFormItem>
    </NForm>
  </div>
</template>

<style scoped lang="scss">
.template-edit-form {
  padding: 20px 0;
}

.upload-dragger {
  width: 100%;

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 120px;

    .preview-img {
      max-width: 100px;
      max-height: 100px;
      object-fit: contain;
    }

    .upload-text {
      margin-top: 8px;
      color: var(--text-color-3);
      font-size: 14px;
    }
  }
}
</style>
