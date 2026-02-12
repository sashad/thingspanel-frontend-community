<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { NAutoComplete } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { $t } from '@/locales'
import { loginModuleRecord } from '@/constants/app'
import { useRouterPush } from '@/hooks/common/router'
import { useNaiveForm } from '@/hooks/common/form'
import { useAuthStore } from '@/store/modules/auth'
import { getFunction } from '@/service/api/setting'

defineOptions({
  name: 'PwdLogin'
})

const { locale } = useI18n()
const isRememberPath = ref(true)
const rememberMe = ref(false)
const authStore = useAuthStore()
const { toggleLoginModule } = useRouterPush()
const { formRef, validate } = useNaiveForm()
const showYzm = ref(false)
const showZc = ref(false)

interface FormModel {
  userName: string
  password: string
}

const model: FormModel = reactive({
  userName: '',
  password: ''
})

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  // Regular expression to define email address and mobile phone number
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^(\+|\d)\d{5,15}$/

  return {
    userName: [
      {
        required: true,
        message: () => $t('form.userName.required'),
        trigger: ['blur'] // required The rules are blur triggered when
      },
      {
        validator: (_rule, value) => {
          // Only check format if there is a value
          if (value && !emailRegex.test(value) && !phoneRegex.test(value)) {
            return Promise.reject(new Error($t('form.userName.invalidFormat'))) // Use format error prompts
          }
          return Promise.resolve() // Passed when the value is empty or in the correct format
        },
        message: () => $t('form.userName.invalidFormat'), // Tips for format errors
        trigger: ['input', 'blur'] // input Also check the format，but do not prompt required
      }
    ],
    password: [
      {
        required: true,
        message: () => $t('form.pwd.required'),
        trigger: ['input', 'blur']
      }
    ]
  }
})

// List of commonly used email suffixes
const commonDomains = ['qq.com', '163.com', 'gmail.com', 'outlook.com', 'sina.com', 'hotmail.com', 'yahoo.com']

// Calculate email autocomplete options
const emailOptions = computed(() => {
  const userName = model.userName
  if (!userName || !userName.includes('@')) {
    return [] // If there is no input or it does not contain @，no prompt
  }

  const parts = userName.split('@')
  const username = parts[0]
  const domainInput = parts[1] || '' // @ the back part

  if (username === '') {
    return [] // if @ The front is empty，no prompt
  }

  // Filter common domain names，Based on the user's @ Content entered after
  const filteredDomains = commonDomains.filter(
    domain => domain.startsWith(domainInput) && domain !== domainInput // Prompts only when the domain name partially matches and is not equal to the full domain name
  )

  // Generate complete email suggestions
  return filteredDomains.map(domain => `${username}@${domain}`)
})

async function handleSubmit() {
  // Determine the password length first
  if (model.password.length < 6) {
    return // Still blocking submission
  }

  await validate()
  await authStore.login(model.userName.trim(), model.password)

  if (rememberMe.value) {
    localStorage.setItem('rememberMe', 'true')
    localStorage.setItem('rememberedUserName', model.userName.trim())
    localStorage.setItem('rememberedPassword', window.btoa(model.password))
  } else {
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('rememberedUserName')
    localStorage.removeItem('rememberedPassword')
  }
}

async function getFunctionOption() {
  const { data } = await getFunction()
  if (data) {
    localStorage.setItem('enableZcAndYzm', JSON.stringify(data))
    showZc.value = data.find(v => v.name === 'enable_reg')?.enable_flag === 'enable'

    showYzm.value = data.find(v => v.name === 'use_captcha')?.enable_flag === 'enable'
  }
}

function loadSavedCredentials() {
  const savedRememberMe = localStorage.getItem('rememberMe')
  if (savedRememberMe === 'true') {
    rememberMe.value = true
    const savedUserName = localStorage.getItem('rememberedUserName')
    const savedPassword = localStorage.getItem('rememberedPassword')

    if (savedUserName) {
      model.userName = savedUserName
    }

    if (savedPassword) {
      model.password = window.atob(savedPassword)
    }
  }
}

// Load automatic login credentials from environment variables
async function loadAutoLoginCredentials() {
  // Check routing parameters
  const urlParams = new URLSearchParams(window.location.search)
  const autoLogin = urlParams.get('auto') === 'true'
  const urlUsername = urlParams.get('username')
  const urlPassword = urlParams.get('password')

  // if onlyURLThere is an account password in the parameters andauto=trueAllow automatic login
  if (autoLogin && urlUsername && urlPassword) {
    // Set form data
    model.userName = urlUsername
    model.password = urlPassword

    // Delay to ensure the component is fully mounted
    setTimeout(async () => {
      try {
        await authStore.login(model.userName.trim(), model.password)
      } catch (error) {
        window.$message?.error('Automatic login failed，Please enter the account password manually')
      }
    }, 500)
  }
}

onMounted(() => {
  const is_remember_rath = localStorage.getItem('isRememberPath')
  if (is_remember_rath === '0' || is_remember_rath === '1') {
    isRememberPath.value = is_remember_rath === '1'
  }
  getFunctionOption()
  loadSavedCredentials()
  loadAutoLoginCredentials()
})
</script>

<template>
  <NForm ref="formRef" :key="locale" :model="model" :rules="rules" size="large" :show-label="false">
    <NFormItem path="userName">
      <NAutoComplete
        v-model:value="model.userName"
        :options="emailOptions"
        :placeholder="$t('page.login.common.userNamePlaceholder')"
        clearable
        @keydown.enter="handleSubmit"
      >
        <template #prefix>
          <svg class="w-18px h-18px ml--1" fill="#888" viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
            ></path>
          </svg>
        </template>
      </NAutoComplete>
    </NFormItem>
    <NFormItem path="password">
      <NInput
        v-model:value="model.password"
        class="h-40px"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.passwordPlaceholder')"
      >
        <template #prefix>
          <svg class="w-18px h-18px ml--1" fill="#888" viewBox="0 0 24 24">
            <path
              d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
            ></path>
          </svg>
        </template>
      </NInput>
    </NFormItem>
    <NSpace vertical :size="18">
      <div class="flex-y-center justify-between">
        <NCheckbox v-model:checked="rememberMe">{{ $t('page.login.pwdLogin.rememberMe') }}</NCheckbox>
        <NButton quaternary @click="toggleLoginModule('reset-pwd')">
          {{ $t('page.login.pwdLogin.forgetPassword') }}
        </NButton>
      </div>
      <NButton
        style="border-radius: 8px"
        type="primary"
        size="large"
        block
        :loading="authStore.loginLoading"
        @click="handleSubmit"
      >
        {{ $t('route.login') }}
      </NButton>
      <n-divider title-placement="center" style="padding: 0px; margin: 0px">
        {{ $t('generate.or') }}
      </n-divider>
      <div class="flex-y-center justify-between gap-12px mt--4">
        <NButton v-if="showYzm" class="flex-1" block @click="toggleLoginModule('code-login')">
          {{ $t(loginModuleRecord['code-login']) }}
        </NButton>

        <NButton
          v-if="showZc"
          class="flex-1"
          block
          type="primary"
          quaternary
          @click="toggleLoginModule('register-email')"
        >
          {{ $t('page.login.common.noAccount') }}
          {{ $t(loginModuleRecord.register) }}
        </NButton>
      </div>
    </NSpace>
  </NForm>
</template>

<style scoped></style>
