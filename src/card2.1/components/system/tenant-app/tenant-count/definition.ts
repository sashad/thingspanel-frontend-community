import type { ComponentDefinition } from '@/card2.1/core2';
import component from './component.vue';

/**
 * @description Tenant quantity statistics component definition
 * @summary Display statistics of the total number of tenants in the system
 */
export default {
  type: 'tenant-count',
  name: 'components.tenantCount', // Store translation keys，instead of calling$t()
  description: 'Display statistics of the total number of tenants in the system，Every60Automatically refresh data every second',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/><circle cx="18" cy="8" r="3" fill="#3b82f6"/><circle cx="6" cy="8" r="3" fill="#10b981"/></svg>',
  component,
  version: '2.1.0',
  tags: ['system', 'tenant', 'statistics', 'User management', 'interaction'],
  dataDriven: false, // This is a purely presentational component，data from internal API Call to get，rather than being driven by external data sources
  interactionCapabilities: {
    // Declare that the component supports click events
    supportedEvents: ['click'],
  },
  permission: 'SYS_ADMIN'
} as ComponentDefinition;