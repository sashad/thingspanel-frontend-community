import type { ComponentDefinition } from '@/card2.1/core2'
import component from './component.vue'

/**
 * Version information component definition
 * Display the current version and latest version information of the system
 */
export default {
  type: 'version',
  name: 'components.version', // Store translation keys，instead of calling$t()
  description: 'Display current system version and latest version information，Support version comparison',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M12 6v6l4 2" fill="#8b5cf6"/><text x="12" y="16" text-anchor="middle" font-size="3" fill="white">v</text></svg>',
  component,
  version: '2.1.0',
  tags: ['Version', 'System information', 'update status', 'interaction'],
  dataDriven: false, // This is a purely presentational component，Version information is provided by static configuration，rather than being driven by external data sources
  interactionCapabilities: {
    // Declare the component to support click events and navigation functions
    supportedEvents: ['click', 'navigate'],
  },
  permission: 'NO_LIMIT'
} as ComponentDefinition
