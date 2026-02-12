import { ref } from 'vue'
import { createRequiredFormRule } from '@/utils/form/rule'

export const initTemplateInfoData = {
  name: '',
  tags: [],
  description: '',
  author: '',
  version: '',
  path: ''
}

export const templateInfoData = ref({ ...initTemplateInfoData })

export const templateInfoRules = {
  name: createRequiredFormRule('Please enter template name')
}

// device model
export const deviceModelTabs = [
  { name: 'telemetry', tab: 'telemetry' },
  { name: 'property', tab: 'property' },
  { name: 'event', tab: 'event' },
  { name: 'command', tab: 'Order' }
]

export const initTelemetryModel = {}

export const telemetryModelData = ref({ ...initTelemetryModel })

export const telemetryModelDataTypeOptions = [
  {
    label: 'String',
    value: 'String'
  },
  {
    label: 'Boolean',
    value: 'Boolean'
  },
  {
    label: 'Number',
    value: 'Number'
  }
]

export const getAdditionalInfo = additionalInfoStr => {
  let additionalInfo = []
  if (typeof additionalInfoStr === 'string') {
    try {
      additionalInfo = JSON.parse(additionalInfoStr)
      if (!Array.isArray(additionalInfo)) {
        additionalInfo = []
      }
    } catch {
      additionalInfo = []
    }
  }

  return additionalInfo
}
