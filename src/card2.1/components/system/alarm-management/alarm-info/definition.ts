import type { ComponentDefinition } from '@/card2.1/core2'
import component from './component.vue'

/**
 * Alarm information component definition
 * Display the latest alarm information list，Support viewing details and status display
 */
export default {
  type: 'alarm-info',
  name: 'components.alarmInfo', // Store translation keys，instead of calling$t()
  description: 'Display the latest alarm information list，Contains the alarm name、state、content and time',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
  component,
  version: '2.1.0',
  tags: ['Alarm', 'Information display', 'status monitoring', 'interaction'],
  dataDriven: false, // This is a purely interactive component，Does not rely on external data source drivers
  interactionCapabilities: {
    // Declare the component to support click events and navigation functions
    supportedEvents: ['click', 'navigate'],
  },
  permission: 'NO_LIMIT'
} as ComponentDefinition
