import type { ComponentDefinition } from '@/card2.1/core2'
import component from './component.vue'

/**
 * Device reporting data component definition
 * Display the latest device telemetry data，Support real-time refresh and data display
 */
export default {
  type: 'reported-data',
  name: 'components.reportedData', // Store translation keys，instead of calling$t()
  description: 'Display the latest telemetry data reported by the device，Support real-time refresh and online status display',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h8v-2h-8V9h8V7h-8V5h8V3h-8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2h-8z"/><circle cx="17" cy="8" r="2" fill="#10b981"/><circle cx="19" cy="14" r="1.5" fill="#3b82f6"/></svg>',
  component,
  version: '2.1.0',
  tags: ['Device data', 'telemetry', 'Real-time monitoring', 'interaction'],
  dataDriven: false, // This is a purely presentational component，data from internal API Call to get，rather than being driven by external data sources
  interactionCapabilities: {
    // Declare the component to support click events and refresh functions
    supportedEvents: ['click', 'refresh'],
  },
  permission: 'NO_LIMIT'
} as ComponentDefinition
