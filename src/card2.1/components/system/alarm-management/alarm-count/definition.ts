import type { ComponentDefinition } from '@/card2.1/core2';
import component from './component.vue';

/**
 * @description Alarm management component definition
 * @summary Provides quick entry and navigation interface for alarm management functions
 */
export default {
  type: 'alarm-count',
  name: 'components.alarmCount',
  description: 'Provides quick access to alarm management functions，Including viewing alarms、Configure rules and other interactive functions',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-1.1 0-2 .9-2 2v.17c-2.1.4-3.5 2.24-3.5 4.83v4l-2 2v1h15v-1l-2-2V9c0-2.59-1.4-4.43-3.5-4.83V4c0-1.1-.9-2-2-2zm-1 17h2c0 1.1-.9 2-2 2s-2-.9-2-2z"/></svg>',
  component,
  version: '2.1.0',
  tags: ['system', 'Alarm', 'manage', 'interaction'],
  dataDriven: false, // This is a purely interactive component，Does not rely on external data source drivers
  interactionCapabilities: {
    // Declare the component to support click events and navigation functions
    supportedEvents: ['click', 'navigate'],
  },
  permission: 'NO_LIMIT'
} as ComponentDefinition;
