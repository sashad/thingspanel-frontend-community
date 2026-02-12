<script setup lang="ts">
import { computed } from 'vue'
import { $t } from '@/locales'

defineOptions({ name: 'LoginAgreement' })

interface Props {
  /** Check or not */
  value?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  value: true
})

interface Emits {
  (e: 'update:value', value: boolean): void

  /** Click Agreement */
  (e: 'click-protocol'): void

  /** Click Privacy Policy */
  (e: 'click-policy'): void
}

const emit = defineEmits<Emits>()

const checked = computed({
  get() {
    return props.value
  },
  set(newValue: boolean) {
    emit('update:value', newValue)
  }
})

function handleClickProtocol() {
  emit('click-protocol')
}

function handleClickPolicy() {
  emit('click-policy')
}
</script>

<template>
  <div class="w-full text-14px">
    <NCheckbox v-model:checked="checked">{{ $t('page.login.register.agreement') }}</NCheckbox>

    <NButton :text="true" type="primary" @click="handleClickProtocol">{{ $t('generate.user-agreement') }}</NButton>
    <NButton :text="true" type="primary" @click="handleClickPolicy">{{ $t('generate.privacy-policy') }}</NButton>
  </div>
</template>

<style scoped></style>
