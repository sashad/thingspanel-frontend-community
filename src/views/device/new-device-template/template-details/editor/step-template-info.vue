<script setup lang="ts">
/**
 * step1：Template basic information
 * Click"Next step"Save to server immediately，gettemplate_id
 */

import { ref, watchEffect, nextTick } from 'vue'
import type { UploadFileInfo } from 'naive-ui'
import { NForm, NFormItem, NInput, NTag, NButton, NUpload } from 'naive-ui'
import { $t } from '@/locales'
import { localStg } from '@/utils/storage'
import { getDemoServerUrl } from '@/utils/common/tool'
import { addTemplat, putTemplat, getTemplat } from '@/service/api/system-data'
import { createProxyPattern } from '~/env.config'
import SvgIcon from '@/components/custom/svg-icon.vue'

const emit = defineEmits(['update:stepCurrent', 'update:modalVisible', 'update:deviceTemplateId'])

const props = defineProps({
  stepCurrent: {
    type: Number,
    required: true
  },
  modalVisible: {
    type: Boolean,
    required: true
  },
  deviceTemplateId: {
    type: String,
    required: true
  }
})

const deviceTemplateId = ref(props.deviceTemplateId)
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

// tag related
const tagInputVisible = ref(false)
const tagInputValue = ref('')

const handleAddTag = () => {
  tagInputVisible.value = true
}

const handleTagInputBlur = () => {
  if (tagInputValue.value.trim()) {
    formData.value.templateTage.push(tagInputValue.value.trim())
    tagInputValue.value = ''
    tagInputVisible.value = false
  }
}

const handleTagClose = (index: number) => {
  formData.value.templateTage.splice(index, 1)
}

// Image upload
// Development environment uses proxy path，Complete production environment useURL
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
 * Next step - Save basic information to the server
 */
const handleNext = async () => {
  try {
    await formRef.value?.validate()

    // WilltemplateTageConvert array to comma separated string
    formData.value.label = formData.value.templateTage.join(',')

    let response: any
    if (formData.value.id) {
      // edit mode - renew
      response = await putTemplat(formData.value)
    } else {
      // New mode - create
      response = await addTemplat(formData.value)
    }

    if (!response.error && response.data) {
      // Saved successfully，transferIDto parent component，Go to next step
      emit('update:deviceTemplateId', response.data.id)
      emit('update:stepCurrent', 2)
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
  emit('update:modalVisible', false)
}

/**
 * monitordeviceTemplateIdchange，Load data
 */
watchEffect(async () => {
  deviceTemplateId.value = props.deviceTemplateId

  if (deviceTemplateId.value) {
    // edit mode - Load existing data
    const { data, error } = await getTemplat(deviceTemplateId.value)
    if (!error && data) {
      formData.value.name = data.name || ''
      formData.value.id = data.id
      formData.value.path = data.path || ''
      formData.value.description = data.description || ''
      formData.value.version = data.version || ''
      formData.value.author = data.author || ''
      formData.value.templateTage = data.label && data.label.length > 0 ? data.label.split(',') : []

      if (data.path) {
        // Use server domain name when displaying images，remove /api/v1 path
        const serverUrl = getDemoServerUrl().replace('/api/v1', '')
        iconPreviewUrl.value = serverUrl + data.path.substring(1)
      }
    }
  } else {
    // New mode - Clear form
    formData.value = {
      name: '',
      templateTage: [],
      version: '',
      author: '',
      description: '',
      path: '',
      label: ''
    }
    iconPreviewUrl.value = ''
  }
})
</script>

<template>
  <div class="step-template-info">
    <NForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="120"
      require-mark-placement="right-hanging"
    >
      <!-- Template name -->
      <NFormItem :label="$t('device_template.templateName')" path="name">
        <NInput v-model:value="formData.name" :placeholder="$t('device_template.enterTemplateName')" />
      </NFormItem>

      <!-- Label -->
      <NFormItem :label="$t('device_template.templateTage')" class="tag-item">
        <NTag
          v-for="(item, index) in formData.templateTage"
          :key="index"
          size="small"
          class="tag"
          closable
          @close="handleTagClose(index)"
        >
          {{ item }}
        </NTag>
        <NTag v-if="!tagInputVisible" size="small" class="tag add-tag" @click="handleAddTag">
          {{ $t('device_template.addTage') }}
          <template #icon>
            <SvgIcon local-icon="add" class="more" />
          </template>
        </NTag>
        <NInput
          v-else
          v-model:value="tagInputValue"
          class="tag-input"
          :placeholder="$t('generate.enter-tag-name')"
          autofocus
          @blur="handleTagInputBlur"
        />
      </NFormItem>

      <!-- Icon upload -->
      <NFormItem :label="$t('device_template.cover')">
        <NUpload
          :action="url + '/file/up'"
          :headers="uploadHeaders"
          :data="{ type: 'image' }"
          class="upload"
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

      <!-- author -->
      <NFormItem :label="$t('device_template.authorName')">
        <NInput v-model:value="formData.author" :placeholder="$t('device_template.enterAuthorName')" />
      </NFormItem>

      <!-- Version -->
      <NFormItem :label="$t('device_template.templateVersion')">
        <NInput v-model:value="formData.version" :placeholder="$t('device_template.entertemplateVersion')" />
      </NFormItem>

      <!-- illustrate -->
      <NFormItem :label="$t('device_template.illustrate')">
        <NInput
          v-model:value="formData.description"
          type="textarea"
          :placeholder="$t('device_template.enterIllustrate')"
        />
      </NFormItem>
    </NForm>

    <!-- bottom button -->
    <div class="footer-actions">
      <NButton type="primary" @click="handleNext">{{ $t('device_template.nextStep') }}</NButton>
      <NButton @click="handleCancel">{{ $t('generate.cancel') }}</NButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.step-template-info {
  padding: 20px 0;
}

.tag-item {
  :deep(.n-form-item-blank) {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.tag {
  min-width: max-content;
  padding: 0 8px;
  height: 32px;
  border-radius: 4px;
  margin: 0;
}

.add-tag {
  cursor: pointer;
}

.tag-input {
  width: 120px;
  height: 32px;
}

.upload {
  width: 200px;
  height: 150px;
  position: relative;

  .upload-dragger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 200px;
    height: 150px;
    cursor: pointer;
  }

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .upload-text {
    margin-top: 8px;
    font-size: 14px;
    color: var(--text-color-3);
  }

  .preview-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 200px;
    height: 150px;
    object-fit: cover;
  }
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
</style>
