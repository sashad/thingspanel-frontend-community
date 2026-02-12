/**
 * Card2.1 Component settings configuration type definition
 * Implement a unified three-file structure standard and attribute binding mechanism
 * Supports a complete component configuration system，Includes setting definitions、Validation rules andUIRendering controls
 * Integrated with the original flexible configuration system，Provide a unified configuration type architecture
 */

import type { Component } from 'vue'

/**
 * Enumeration of supported control types
 * Integrated original configuration field types，Provide a unified control type system
 */
export enum SettingControlType {
  /** Text input box */
  INPUT = 'input',
  /** text field */
  TEXTAREA = 'textarea',
  /** Number input box */
  INPUT_NUMBER = 'input-number',
  /** color picker */
  COLOR_PICKER = 'color-picker',
  /** slider */
  SLIDER = 'slider',
  /** switch */
  SWITCH = 'switch',
  /** drop down selection */
  SELECT = 'select',
  /** checkbox */
  CHECKBOX = 'checkbox',
  /** radio button group */
  RADIO_GROUP = 'radio-group',
  /** date picker */
  DATE_PICKER = 'date-picker',
  /** Dynamic tags */
  DYNAMIC_TAGS = 'dynamic-tags',
  /** Vuecomponent renderer（Advanced features）*/
  VUE_COMPONENT = 'vue-component'
}

/**
 * Setting item configuration interface
 * Corresponding to each setting item in the component configuration interface，Used to generate dynamic configuration forms
 * 
 * @template T - Set the type of item value
 */
export interface Setting<T = unknown> {
  /** Control type，like 'input', 'color-picker', 'slider', 'vue-component' */
  type: string
  /** UIlabels shown on */
  label: string
  /** bound customConfig.customize property path in */
  field: string
  /** Setting item grouping，Used to categorize and display related setting items */
  group?: string
  /** placeholder text */
  placeholder?: string
  /** default value */
  defaultValue?: T
  /** minimum value（Numeric type） */
  min?: number
  /** maximum value（Numeric type） */
  max?: number
  /** step size（Numeric type） */
  step?: number
  /** drop down options */
  options?: Array<{ label: string; value: T; description?: string }>
  /** Setting item description text */
  description?: string
  /** Is it required? */
  required?: boolean
  /** Whether to disable */
  disabled?: boolean

  // ============ VueComponent rendering extension（fromconfig-types.tsIntegrate） ============
  /** Vuecomponent renderer（whentypefor'vue-component'used when） */
  component?: Component | string
  /** passed toVuecomponentProps */
  componentProps?: Record<string, unknown>

  /** Other configurations of the control */
  [key: string]: unknown
}

/**
 * The default style of the component、Properties and initial behavior
 * corresponding to the CustomConfig design
 * @template T - component specific customize Object type
 */
export interface CustomConfig<T = Record<string, unknown>> {
  /** The component's unique type identifier */
  type: string
  /** Common transform properties at the component root level */
  root: {
    transform: {
      rotate: number
      scale: number
    }
  }
  /** component core、Unique custom styles and functional attributes */
  customize: T
}

/**
 * The complete component configuration object ultimately used by the rendering engine
 * corresponding to the DataConfig design
 * @template T - component specific customize Object type
 */
export interface DataConfig<T = Record<string, unknown>> {
  /** The unique component instanceID */
  id: string
  /** Display name of the component */
  name: string
  /** VueComponent name，source field */
  field: string
  /** Receive linkage target component configuration */
  components: TargetComponent[]
  /** Custom configuration of components */
  customConfig: CustomConfig<T>
}

/**
 * Target component in linkage
 * corresponding to the TargetComponent design
 */
export interface TargetComponent {
  /** target componentID */
  id: string
  /** Fields that receive linkage data */
  field: string
}

/**
 * Component settings configuration
 * Will Setting and CustomConfig Integrate，Define the complete configuration structure of the component
 */
export interface ComponentSettingConfig<T = Record<string, unknown>> {
  /** component type identifier */
  componentType: string
  /** Setting list */
  settings: Setting[]
  /** Default custom configuration */
  customConfig: CustomConfig<T>
}

/**
 * Enumeration of supported control types
 * Integrated original configuration field types，Provide a unified control type system
 */
export enum SettingControlType {
  /** Text input box */
  INPUT = 'input',
  /** text field */
  TEXTAREA = 'textarea',
  /** Number input box */
  INPUT_NUMBER = 'input-number',
  /** color picker */
  COLOR_PICKER = 'color-picker',
  /** slider */
  SLIDER = 'slider',
  /** switch */
  SWITCH = 'switch',
  /** drop down selection */
  SELECT = 'select',
  /** checkbox */
  CHECKBOX = 'checkbox',
  /** radio button group */
  RADIO_GROUP = 'radio-group',
  /** date picker */
  DATE_PICKER = 'date-picker',
  /** Dynamic tags */
  DYNAMIC_TAGS = 'dynamic-tags',
  /** Vuecomponent renderer（Advanced features）*/
  VUE_COMPONENT = 'vue-component'
}

/**
 * Attribute data type mapping
 * IntegratedVueComponent rendering type
 */
export type PropertyDataTypeFromSetting =
  | 'string' // input, textarea, select, radio-group
  | 'number' // input-number, slider
  | 'boolean' // switch, checkbox
  | 'color' // color-picker
  | 'date' // date-picker
  | 'array' // dynamic-tags
  | 'component' // vue-component

/**
 * Infer attribute data type based on setting item type
 * @param setting Setting item configuration
 * @returns Property data type
 */
export function inferPropertyDataType(setting: Setting): PropertyDataTypeFromSetting {
  switch (setting.type) {
    case SettingControlType.INPUT:
    case SettingControlType.TEXTAREA:
    case SettingControlType.SELECT:
    case SettingControlType.RADIO_GROUP:
      return 'string'

    case SettingControlType.INPUT_NUMBER:
    case SettingControlType.SLIDER:
      return 'number'

    case SettingControlType.SWITCH:
    case SettingControlType.CHECKBOX:
      return 'boolean'

    case SettingControlType.COLOR_PICKER:
      return 'color'

    case SettingControlType.DATE_PICKER:
      return 'date'

    case SettingControlType.DYNAMIC_TAGS:
      return 'array'

    case SettingControlType.VUE_COMPONENT:
      return 'component'

    default:
      return 'string'
  }
}

/**
 * Set item validation rules
 */
export interface SettingValidationRule {
  /** Is it required? */
  required?: boolean
  /** minimum length/value */
  min?: number
  /** maximum length/value */
  max?: number
  /** Regular expression validation */
  pattern?: string
  /** Custom validation function */
  validator?: (value: unknown) => boolean | string
}

/**
 * Extended settings configuration（Contains validation）
 */
export interface EnhancedSetting extends Setting {
  /** Validation rules */
  validation?: SettingValidationRule
  /** Is it read-only? */
  readonly?: boolean
  /** visible or not */
  visible?: boolean | ((config: unknown) => boolean)
  /** help text */
  helpText?: string
}

// ============ Configuration mode and group management（fromconfig-types.tsIntegrate） ============

/**
 * Configuration mode type
 * Support different configuration rendering methods
 */
export type ConfigMode = 'standard' | 'vue-component' | 'hybrid'

/**
 * Configure group definition
 * Used to organize and display configuration items
 */
export interface SettingGroup {
  /** Group name（unique identifier） */
  name: string
  /** Display labels in groups */
  label: string
  /** Group description */
  description?: string
  /** Fields included in the group */
  fields: string[]
  /** Whether the group is collapsible */
  collapsible?: boolean
  /** Whether the group is expanded by default */
  defaultExpanded?: boolean
}

/**
 * TSConfiguration definition（From the originalconfig-types.tsIntegrate）
 * for pureTypeScriptconfiguration mode
 */
export interface TSConfig {
  title?: string
  description?: string
  fields: Setting[]
  groups?: SettingGroup[]
}

/**
 * Configuration value type（From the originalconfig-types.tsIntegrate）
 */
export interface ConfigValues {
  [key: string]: unknown
}

/**
 * Extended component settings configuration
 * Integrated configuration grouping and schema management
 */
export interface EnhancedComponentSettingConfig<T = Record<string, unknown>> extends ComponentSettingConfig<T> {
  /** configuration mode */
  mode?: ConfigMode
  /** Configure group definition */
  groups?: SettingGroup[]
  /** Configure title */
  title?: string
  /** Configuration description */
  description?: string
}

/**
 * Helper function for creating setting items
 */
export function createSetting(type: string, label: string, field: string, options: Partial<Setting> = {}): Setting {
  return {
    type,
    label,
    field,
    group: options.group || 'Basic settings',
    ...options
  }
}

/**
 * Create custom configuration helper functions
 * Supports multiple calling methods to maintain backward compatibility
 * 
 * @template T - Type of custom configuration object
 * @param typeOrCustomize - Component type or custom configuration object
 * @param customize - Custom configuration object（When the first parameter is a type）
 * @param transform - Transform configuration（Rotate and scale）
 * @returns Complete custom configuration object
 */
export function createCustomConfig<T extends Record<string, unknown>>(
  typeOrCustomize: string | T,
  customize?: T,
  transform: { rotate: number; scale: number } = { rotate: 0, scale: 1 }
): CustomConfig<T> {
  // Supports two calling methods：
  // 1. createCustomConfig('component-type', { prop: value })
  // 2. createCustomConfig({ type: 'component-type', prop: value })
  if (typeof typeOrCustomize === 'string') {
    // first way：type + Configuration object
    if (!customize) {
      throw new Error('customize Parameters are specified type is required when')
    }
    return {
      type: typeOrCustomize,
      root: { transform },
      customize
    }
  } else {
    // Second way：single configuration object（backwards compatible）
    const config = typeOrCustomize as T & { type?: string }
    const { type, ...customizeObj } = config
    
    if (!type) {
      throw new Error('The configuration object must contain type Field')
    }
    
    return {
      type,
      root: { transform: customize as any || transform },
      customize: customizeObj as T
    }
  }
}
