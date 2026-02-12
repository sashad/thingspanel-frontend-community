import type { Ref } from 'vue'
import type { FormItemRule } from 'naive-ui'
import { $t } from '@/locales'
import { REG_CODE_SIX, REG_EMAIL, REG_PHONE, REG_PWD } from '@/constants/reg'
/** Create required form rules for custom error messages */
export const createRequiredFormRule = (message = $t('form.required')): FormItemRule => ({ required: true, message })

export const requiredFormRule = createRequiredFormRule()

/** form rules */
interface CustomFormRules {
  /** phone number */
  phone: FormItemRule[]
  /** password */
  pwd: FormItemRule[]
  /** Verification code */
  code: FormItemRule[]
  /** Mail */
  email: FormItemRule[]
}

/** form rules */
export const formRules: CustomFormRules = {
  phone: [
    createRequiredFormRule($t('form.phone.required')),
    { pattern: REG_PHONE, message: $t('form.phone.invalid'), trigger: 'input' }
  ],
  pwd: [
    // createRequiredFormRule($t('form.pwd.required'))
    { pattern: REG_PWD, message: $t('form.pwd.invalid'), trigger: 'input' }
  ],
  code: [
    createRequiredFormRule($t('form.code.required')),
    {
      pattern: REG_CODE_SIX,
      message: $t('form.code.invalid'),
      trigger: 'input'
    }
  ],
  email: [
    {
      required: true,
      pattern: REG_EMAIL,
      message: $t('form.email.required'),
      trigger: 'blur'
    }
  ]
}

/** Whether it is an empty string */
function isBlankString(str: string) {
  return str.trim() === ''
}

/** Get form rules to confirm password */
export function getConfirmPwdRule(pwd: Ref<string>) {
  const confirmPwdRule: FormItemRule[] = [
    { required: true, message: $t('form.pwd.tip') },
    {
      validator: (rule, value) => {
        if (!isBlankString(value) && value !== pwd.value) {
          return Promise.reject(rule.message)
        }
        return Promise.resolve()
      },
      message: $t('form.manycheck.invalid'),
      trigger: 'input'
    }
  ]
  return confirmPwdRule
}

/** Form rules for obtaining image verification codes */
export function getImgCodeRule(imgCode: Ref<string>) {
  const imgCodeRule: FormItemRule[] = [
    { required: true, message: $t('form.code.required') },
    {
      validator: (rule, value) => {
        if (!isBlankString(value) && value !== imgCode.value) {
          return Promise.reject(rule.message)
        }
        return Promise.resolve()
      },
      message: $t('form.code.invalid'),
      trigger: 'blur'
    }
  ]
  return imgCodeRule
}
