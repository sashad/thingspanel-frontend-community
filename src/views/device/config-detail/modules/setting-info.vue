<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue'
import { NButton, useDialog, useMessage } from 'naive-ui'
import { useRoute } from 'vue-router'
import ClipboardJS from 'clipboard'
import { useTabStore } from '@/store/modules/tab'
import { useRouterPush } from '@/hooks/common/router'
import { deviceConfigDel, deviceConfigEdit } from '@/service/api/device'
import { $t } from '@/locales'
import type { UploadFileInfo } from 'naive-ui'
import { localStg } from '@/utils/storage'
import { getDemoServerUrl } from '@/utils/common/tool'

interface Props {
  configInfo?: object | any
}
const emit = defineEmits(['change'])
const props = withDefaults(defineProps<Props>(), {
  configInfo: null
})
const dialog = useDialog()
const message = useMessage()
const route = useRoute()
const tabStore = useTabStore()
const { routerPush } = useRouterPush()
const deleteConfig = () => {
  dialog.warning({
    title: $t('common.tip'),
    content: $t('common.deleteDeviceConfig'),
    positiveText: $t('device_template.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const res: any = await deviceConfigDel({ id: props.configInfo.id })

      if (!res || !res.error) {
        message.success($t('custom.grouping_details.operationSuccess'))
        await tabStore.removeTab(route.path)
        await routerPush({ path: '/device/config' })
      }
    }
  })
}
const showModal = ref(false)
const modalIndex = ref(1)
if (process.env.NODE_ENV === 'development') {
}
const auto_register = ref(props.configInfo?.auto_register === 1 || false)
const onlinejson = reactive({
  online_timeout: 0,
  heartbeat: 0
})

// Image upload related
const demoUrl = getDemoServerUrl()
const url: any = ref(demoUrl)
const imagePath: any = ref('')
// eslint-disable-next-line no-unused-vars
const customRequest = ({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) => {
  if (!event || !event.target) return

  const xhr = event.target as XMLHttpRequest
  const response = JSON.parse(xhr.response)

  // Save image path
  const relativePath = response.data.path.replace(/^\.\//, '')
  imagePath.value = `${url.value.replace('api/v1', '') + relativePath}`

  // Save the image path directly to the server
  saveImagePath(relativePath)
}

// Save image path to server
const saveImagePath = async (relativePath: string) => {
  const { error }: any = await deviceConfigEdit({
    id: props.configInfo.id,
    image_url: relativePath
  })

  if (!error) {
    message.success($t('custom.grouping_details.operationSuccess'))
    emit('change')
  }
}

const onDialogVisble = () => {
  showModal.value = !showModal.value
}
const onOpenDialogModal = (val: number) => {
  modalIndex.value = val
  onDialogVisble()
  if (modalIndex.value !== 1) {
    const { online_timeout, heartbeat }: any = JSON.parse(props.configInfo?.other_config || {})
    onlinejson.online_timeout = online_timeout || 0
    onlinejson.heartbeat = heartbeat || 0
  }
}
const copyOneTypeOneSecretDevicePassword = () => {
  const textToCopy = props.configInfo?.template_secret || ''
  if (process.env.NODE_ENV === 'development') {
  }

  if (!textToCopy) {
    message.error($t('common.noContentToCopy'))
    return
  }

  // 1. Create a textarea as a temporary element
  const textarea = document.createElement('textarea')
  textarea.value = textToCopy
  // Set the style so that it is invisible and does not affect the layout
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.left = '-9999px'
  // Make sure the element is editable（althoughreadonlyOK，But the default state is usually better）
  // textarea.setAttribute('readonly', '');
  document.body.appendChild(textarea)

  // 2. use clipboard.js Example，But the goal is this textarea
  // Here we do not directly clipboard bind to textarea，But use itAPIto trigger replication
  // clipboard.js Usually requires a trigger element，We still use a fake button
  const triggerElement = document.createElement('button')
  document.body.appendChild(triggerElement) // must be inDOMmedium to bind

  const clipboard = new ClipboardJS(triggerElement, {
    target: () => textarea, // Explicitly specify from textarea copy
    // text: () => textToCopy, // If used target, text options will be ignored
    container: document.body
  })

  // eslint-disable-next-line no-unused-vars
  let success = false

  clipboard.on('success', e => {
    success = true
    if (process.env.NODE_ENV === 'development') {
    }
    message.success($t('custom.grouping_details.operationSuccess'))
    e.clearSelection()
    cleanup()
  })

  clipboard.on('error', e => {
    console.error('Clipboard.js error event:', e)
    message.error($t('common.copyFailed'))
    cleanup()
  })

  const cleanup = () => {
    clipboard.destroy()
    document.body.removeChild(textarea)
    document.body.removeChild(triggerElement)
  }

  // 3. explicit selection textarea text in
  textarea.select()
  textarea.setSelectionRange(0, textToCopy.length) // Compatible with mobile devices
  textarea.focus() // try to give focus

  // 4. Trigger replication
  triggerElement.click()

  // 5. To prevent events from not triggering immediately or cleaning up prematurely in some cases，You can add a small delay
  //    But this usually shouldn't be the first choice，if clipboard.js working fine，Its events should be able to handle。
  //    If the above still fails，A very short delay can be considered for execution cleanup。
  // setTimeout(() => {
  //   if (!success) { // If there is no success event triggers（Theoretically it shouldn't）
  //     cleanup();
  //   }
  // }, 100); // 100ms should be enough
}
const onSubmit = async () => {
  onDialogVisble()
  if (modalIndex.value !== 1) {
    const { error }: any = await deviceConfigEdit({
      id: props.configInfo.id,
      other_config: JSON.stringify({
        online_timeout: onlinejson.online_timeout,
        heartbeat: onlinejson.heartbeat
      })
    })
    !error && emit('change')
  } else {
    const { error }: any = await deviceConfigEdit({
      id: props.configInfo.id,
      auto_register: auto_register.value ? 1 : 0
    })
    message.success($t('custom.grouping_details.operationSuccess'))
    !error && emit('change')
  }
}
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
onMounted(() => {
  if (process.env.NODE_ENV === 'development') {
  }
  auto_register.value = props.configInfo?.auto_register === 1 || false
  // Initialize image path
  imagePath.value = props.configInfo?.image_url ? `${url.value.replace('api/v1', '') + props.configInfo.image_url}` : ''
})
</script>

<template>
  <div class="flex-col gap-30px p-10px">
    <div class="">
      <div class="m-b-10px">{{ $t('generate.auto-create-device') }}</div>
      <div class="m-b-10px">{{ $t('generate.auto-create-device-via-one-type-one-secret') }}</div>
      <NButton class="" type="primary" @click="onOpenDialogModal(1)">{{ $t('generate.configuration') }}</NButton>
    </div>
    <div class="">
      <div class="m-b-10px">{{ $t('generate.onlineDeviceConfig') }}</div>
      <NButton class="" type="primary" @click="onOpenDialogModal(2)">{{ $t('generate.configuration') }}</NButton>
    </div>
    <div class="">
      <div class="m-b-10px">{{ $t('generate.deviceConfigImage') }}</div>

      <n-upload
        :action="url + '/file/up'"
        :headers="{ 'x-token': localStg.get('token') || '' }"
        :data="{ type: 'image' }"
        class="upload"
        :show-file-list="false"
        accept="image/png, image/jpeg, image/jpg, image/gif"
        @finish="customRequest"
      >
        <n-upload-dragger class="upload-dragger">
          <div class="upload-content">
            <img v-if="imagePath && imagePath !== ''" :src="imagePath" class="slt" />
            <template v-else>
              <n-icon size="35" :depth="3">
                <SvgIcon local-icon="picture" class="more" />
              </n-icon>
              <p class="upload-text">{{ $t('generate.deviceConfigImage') }}</p>
            </template>
          </div>
        </n-upload-dragger>
      </n-upload>
    </div>
    <div>
      <!-- <div class="m-b-10px color-error-500">{{ $t('generate.delete-device-configuration') }}</div> -->
      <NButton type="error" @click="deleteConfig">{{ $t('common.delete') }}</NButton>
    </div>

    <n-modal
      v-model:show="showModal"
      preset="dialog"
      :class="getPlatform ? '90%' : 'w-400px'"
      :title="modalIndex === 1 ? $t('generate.configure-auto-create-device') : $t('generate.onlineDeviceConfig')"
      :show-icon="false"
    >
      <template v-if="modalIndex === 1">
        <dl class="flex-col gap-20px">
          <dd>{{ $t('generate.allow-device-auto-create') }}</dd>
          <dd>
            <n-switch v-model:value="auto_register" />
          </dd>
          <dd>{{ $t('generate.copy-one-type-one-secret-device-password') }}</dd>
          <dd>
            <NButton type="primary" @click="copyOneTypeOneSecretDevicePassword">{{ $t('generate.copy') }}</NButton>
          </dd>
        </dl>
      </template>
      <template v-else>
        <dl class="m-b-20px flex-col">
          <dt class="m-b-5px font-900">{{ $t('generate.timeoutMinutes') }}</dt>
          <dd class="m-b-10px">
            {{ $t('generate.timeoutThreshold') }}
          </dd>
          <dd class="m-b-20px max-w-220px">
            <n-input-number v-model:value="onlinejson.online_timeout" placeholder=""></n-input-number>
          </dd>
          <dt class="m-b-5px font-900">{{ $t('generate.heartbeatIntervalSeconds') }}</dt>
          <dd class="m-b-10px">{{ $t('generate.heartbeatThreshold') }}</dd>
          <dd class="max-w-220px">
            <n-input-number v-model:value="onlinejson.heartbeat" type="text" placeholder=""></n-input-number>
          </dd>
        </dl>
      </template>

      <NFlex justify="end">
        <NButton @click="onDialogVisble">{{ $t('generate.cancel') }}</NButton>
        <NButton type="primary" @click="onSubmit">{{ $t('common.save') }}</NButton>
      </NFlex>
    </n-modal>
  </div>
</template>

<style lang="scss" scoped>
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
  }

  .slt {
    position: absolute;
    top: 0;
    left: 0;
    width: 200px;
    height: 150px;
    object-fit: cover;
  }
}
</style>
