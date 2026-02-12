import type { ComponentDefinition } from '@/card2.1/types'
import { customConfig, alertStatusSettingConfig } from './settingConfig'
import AlertStatus from './index.vue'
import AlertStatusSetting from './setting.vue'
import { createPropertyWhitelist } from '@/card2.1/core2/property'
export const alertStatusDefinition: ComponentDefinition = { type: 'alert-status', name: '⚠️Alarm status', description: 'Display system alarm and status information', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13,13H11V7H13M12,17.3A1.3,1.3 0 0,1 10.7,16A1.3,1.3 0 0,1 12,14.7A1.3,1.3 0 0,1 13.3,16A1.3,1.3 0 0,1 12,17.3M15.73,3H8.27L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3Z" /></svg>', version: '1.0.0', author: 'ThingsPanel', component: AlertStatus, configComponent: AlertStatusSetting, defaultConfig: { type: 'alert-status', root: { transform: { rotate: 0, scale: 1 } }, customize: customConfig }, config: { type: 'alert-status', root: { transform: { rotate: 0, scale: 1 } }, customize: customConfig }, defaultLayout: { gridstack: { w: 3, h: 2, x: 0, y: 0, minW: 2, minH: 2, maxW: 6, maxH: 4 } }, layout: { defaultSize: { width: 3, height: 2 }, minSize: { width: 2, height: 2 }, maxSize: { width: 6, height: 4 }, resizable: true }, permission: 'NO_LIMIT', tags: ['Alarm', 'state', 'monitor'], features: { realtime: true, dataBinding: true, configurable: true }, dataSources: [
    { key: 'title', name: 'title', description: '告警title', supportedTypes: ['static', 'api', 'websocket'], example: "High temperature alarm", required: false },
    { key: 'amount', name: 'Amount', description: '相关Amount数据', supportedTypes: ['static', 'api', 'websocket'], example: 1000, required: false },
    { key: 'description', name: 'describe', description: '告警describe信息', supportedTypes: ['static', 'api', 'websocket'], example: "The system is running normally", required: false }
  ], settingConfig: alertStatusSettingConfig,

  // 🎯 Interactive capability statement
  interactionCapabilities: {
    // Supported interaction event types
    supportedEvents: ['click', 'hover', 'focus', 'blur', 'dataChange'],

    // Types of interactive actions that can be triggered
    availableActions: [
      'navigateToUrl', 'updateComponentData', 'changeVisibility',
      'changeBackgroundColor', 'changeBorderColor', 'triggerAnimation',
      'showNotification', 'emitEvent', 'flashColor', 'pulseEffect'
    ],

    // List of properties that can be listened to by other components
    watchableProperties: {
      'title': {
        type: 'string',
        description: 'Alarm title',
        defaultValue: 'High temperature alarm'
      },
      'amount': {
        type: 'number',
        description: 'Relevant amount data',
        defaultValue: 1000
      },
      'description': {
        type: 'string',
        description: 'Alarm description information',
        defaultValue: 'The system is running normally'
      },
      'alertLevel': {
        type: 'string',
        description: 'Alarm level',
        defaultValue: 'normal'
      }
    },

    // Default interaction configuration
    defaultInteractions: [
      {
        event: 'dataChange',
        responses: [
          {
            action: 'flashColor',
            delay: 0,
            name: 'Alarm flashing effect',
            enabled: true
          },
          {
            action: 'showNotification',
            delay: 500,
            name: 'Alarm notification',
            enabled: true
          }
        ],
        enabled: true,
        name: 'Alarm status changes',
        watchedProperty: 'alertLevel'
      },
      {
        event: 'click',
        responses: [
          {
            action: 'navigateToUrl',
            delay: 0,
            name: 'Jump to alarm details',
            enabled: true
          }
        ],
        enabled: true,
        name: 'View alarm details'
      }
    ]
  },

  // 🔒 Attribute exposure whitelist configuration
  propertyWhitelist: createPropertyWhitelist({
    // 🔒 core business attributes - Can be used interactively
    title: {
      level: 'public',
      type: 'string',
      description: 'Alarm title',
      defaultValue: 'High temperature alarm',
      visibleInInteraction: true,
      visibleInDebug: true
    },
    amount: {
      level: 'public',
      type: 'number',
      description: 'Relevant amount data',
      defaultValue: 1000,
      visibleInInteraction: true,
      visibleInDebug: true
    },
    description: {
      level: 'public',
      type: 'string',
      description: 'Alarm description information',
      defaultValue: 'The system is running normally',
      visibleInInteraction: true,
      visibleInDebug: true
    },

    // 🔒 Computed properties - read only，For use by interactive systems
    alertLevel: {
      level: 'public',
      type: 'string',
      description: 'Alarm level',
      defaultValue: 'normal',
      readonly: true,
      visibleInInteraction: true,
      visibleInDebug: true
    },

    // 🔒 status attribute - read only
    lastUpdated: {
      level: 'public',
      type: 'string',
      description: 'Last updated',
      readonly: true,
      visibleInInteraction: false,
      visibleInDebug: true
    },

    // 🔒 BaseUIproperty - protected level
    visible: {
      level: 'protected',
      type: 'boolean',
      description: 'Component visibility',
      defaultValue: true,
      visibleInInteraction: true,
      visibleInDebug: true
    }
  }, {
    enabled: true,
    defaultLevel: 'public',
    audit: {
      logAccess: process.env.NODE_ENV === 'development',
      logModification: true
    }
  }) }
export default alertStatusDefinition
