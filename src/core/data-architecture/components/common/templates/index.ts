/**
 * Parameter value template management v2.0
 * Support complex component templates：Manual entry、drop down selection、Property binding、component template
 */

import type { Component, AsyncComponentLoader } from 'vue'

// Template type enum
export enum ParameterTemplateType {
  MANUAL = 'manual', // Manual entry
  DROPDOWN = 'dropdown', // drop down selection
  PROPERTY = 'property', // Property binding（dynamic）
  COMPONENT = 'component' // Complex component template
}

// Template options interface
export interface TemplateOption {
  label: string
  value: string | number | boolean
  description?: string
}

// Component template configuration interface
export interface ComponentTemplateConfig {
  /** Component name string or component import function or component instance */
  component: string | Component | AsyncComponentLoader<Component>
  /** passed to the componentprops */
  props?: Record<string, any>
  /** Component event listener mapping */
  events?: Record<string, string>
  /** Component slot configuration */
  slots?: Record<string, any>
  /** Component rendering configuration */
  renderConfig?: {
    /** Whether packaged in a container */
    wrapped?: boolean
    /** Container style class */
    containerClass?: string
    /** minimum height */
    minHeight?: string
  }
}

// Template configuration interface
export interface ParameterTemplate {
  id: string
  name: string
  type: ParameterTemplateType
  description: string
  // Drop down options to select a template
  options?: TemplateOption[]
  // default value
  defaultValue?: any
  // Whether to support custom input（Select template for dropdown）
  allowCustom?: boolean
  // 🔥 New：Component template configuration
  componentConfig?: ComponentTemplateConfig
}

/**
 * Built-in template list
 */
export const PARAMETER_TEMPLATES: ParameterTemplate[] = [
  {
    id: 'manual',
    name: 'Manual entry',
    type: ParameterTemplateType.MANUAL,
    description: 'Enter fixed value directly',
    defaultValue: ''
  },
  {
    id: 'http-methods',
    name: 'HTTPmethod',
    type: ParameterTemplateType.DROPDOWN,
    description: 'HTTPRequest method selection',
    options: [
      { label: 'GET', value: 'GET', description: 'Get data' },
      { label: 'POST', value: 'POST', description: 'Submit data' },
      { label: 'PUT', value: 'PUT', description: 'Update data' },
      { label: 'DELETE', value: 'DELETE', description: 'Delete data' },
      { label: 'PATCH', value: 'PATCH', description: 'Partial update' }
    ],
    defaultValue: 'GET'
  },
  {
    id: 'content-types',
    name: 'Content type',
    type: ParameterTemplateType.DROPDOWN,
    description: 'Commonly usedContent-Typevalue',
    options: [
      { label: 'application/json', value: 'application/json' },
      { label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
      { label: 'multipart/form-data', value: 'multipart/form-data' },
      { label: 'text/plain', value: 'text/plain' },
      { label: 'text/html', value: 'text/html' }
    ],
    defaultValue: 'application/json',
    allowCustom: true
  },
  {
    id: 'auth-types',
    name: 'Certification type',
    type: ParameterTemplateType.DROPDOWN,
    description: 'Commonly usedAuthorizationtype',
    options: [
      { label: 'Bearer Token', value: 'Bearer ' },
      { label: 'Basic Auth', value: 'Basic ' },
      { label: 'API Key', value: 'ApiKey ' },
      { label: 'Custom', value: '' }
    ],
    defaultValue: 'Bearer ',
    allowCustom: true
  },
  {
    id: 'boolean-values',
    name: 'Boolean value',
    type: ParameterTemplateType.DROPDOWN,
    description: 'True or false value selection',
    options: [
      { label: 'yes (true)', value: 'true' },
      { label: 'no (false)', value: 'false' },
      { label: '1', value: '1' },
      { label: '0', value: '0' }
    ],
    defaultValue: 'true'
  },
  {
    id: 'property-binding',
    name: 'Property binding',
    type: ParameterTemplateType.PROPERTY,
    description: 'Bind to dynamic properties（Get value at runtime）',
    defaultValue: ''
  },
  // 🔥 New：Component property binding template
  {
    id: 'component-property-binding',
    name: 'Component property binding',
    type: ParameterTemplateType.COMPONENT,
    description: 'Bind to a property of a loaded component in the editor',
    defaultValue: '',
    componentConfig: {
      component: 'ComponentPropertySelector',
      props: {
        placeholder: 'Select the component properties to bind',
        // 🔥 critical fix：Enable automatic detection of current componentsID
        autoDetectComponentId: true
      },
      events: {
        'update:selectedValue': 'handleComponentPropertyChange'
      },
      renderConfig: {
        wrapped: true,
        containerClass: 'component-property-container',
        minHeight: '400px'
      }
    }
  },
  // 🔥 New：component template
  {
    id: 'device-metrics-selector',
    name: 'Device configuration',
    type: ParameterTemplateType.COMPONENT,
    description: 'Select equipment and corresponding indicator data',
    defaultValue: '',
    componentConfig: {
      component: 'DeviceMetricsSelector',
      props: {
        mode: 'single',
        showMetrics: true
      },
      events: {
        'update:selectedValue': 'handleDeviceMetricsChange'
      },
      renderConfig: {
        wrapped: true,
        containerClass: 'device-metrics-container',
        minHeight: '200px'
      }
    }
  },
  {
    id: 'device-dispatch-selector',
    name: 'Device distribution selector',
    type: ParameterTemplateType.COMPONENT,
    description: 'Device distribution selector component',
    defaultValue: '',
    componentConfig: {
      component: 'DeviceDispatchSelector',
      props: {
        multiple: false,
        showDetails: true
      },
      events: {
        'update:selectedValue': 'handleDeviceSelectionChange'
      },
      renderConfig: {
        wrapped: true,
        containerClass: 'device-dispatch-container',
        minHeight: '150px'
      }
    }
  },
  {
    id: 'icon-selector',
    name: 'Icon selector',
    type: ParameterTemplateType.COMPONENT,
    description: 'Icon picker component',
    defaultValue: '',
    componentConfig: {
      component: 'IconSelector',
      props: {
        size: 'small'
      },
      events: {
        'update:value': 'handleIconChange'
      },
      renderConfig: {
        wrapped: true,
        containerClass: 'icon-selector-container',
        minHeight: '100px'
      }
    }
  },
  {
    id: 'interface-template',
    name: 'interface template',
    type: ParameterTemplateType.DROPDOWN,
    description: 'Use common parameter templates for internal interfaces',
    options: [
      { label: 'equipmentID', value: '{device_id}', description: 'device identifier' },
      { label: 'userID', value: '{user_id}', description: 'user标识符' },
      { label: 'tenantID', value: '{tenant_id}', description: 'Tenant identifier' },
      { label: 'panelID', value: '{board_id}', description: 'panel identifier' },
      { label: 'GroupID', value: '{group_id}', description: 'group identifier' },
      { label: 'Timestamp', value: '{timestamp}', description: '当前Timestamp' },
      { label: 'page number', value: '1', description: '分页page number' },
      { label: 'page size', value: '10', description: 'paging size' }
    ],
    defaultValue: '{device_id}',
    allowCustom: true
  }
]

/**
 * 🔥 Revise：Get recommended templates based on parameter type（3options）
 * return：Manual entry、Component property binding、Device configuration
 * Notice：There is a unified device configuration selector out there（batch），There are device configuration options for individual parameters.
 */
export function getRecommendedTemplates(parameterType: 'header' | 'query' | 'path'): ParameterTemplate[] {
  return [
    // 1. Manual entry
    PARAMETER_TEMPLATES.find(t => t.id === 'manual')!,

    // 2. Component property binding
    PARAMETER_TEMPLATES.find(t => t.id === 'component-property-binding')!,

    // 3. Device configuration（Device configuration for individual parameters）
    PARAMETER_TEMPLATES.find(t => t.id === 'device-metrics-selector')!
  ]
}

/**
 * Get all component templates
 */
export function getComponentTemplates(): ParameterTemplate[] {
  return PARAMETER_TEMPLATES.filter(t => t.type === ParameterTemplateType.COMPONENT)
}

/**
 * Check if template is component type
 */
export function isComponentTemplate(template: ParameterTemplate): boolean {
  return template.type === ParameterTemplateType.COMPONENT
}

/**
 * Get templateby ID
 */
export function getTemplateById(id: string): ParameterTemplate | undefined {
  return PARAMETER_TEMPLATES.find(t => t.id === id)
}
