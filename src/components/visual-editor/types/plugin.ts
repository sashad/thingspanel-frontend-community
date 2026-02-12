/**
 * Plug-in type definition
 */

// Plug-in interface
export interface IPlugin {
  name: string
  version: string
  install(_context: PluginContext): void
  uninstall?(): void
}

// plugin context
export interface PluginContext {
  hooks: PluginHooks
  registerAPI: (_name: string, _fn: (..._args: any[]) => any) => void
}

// Plugin hook
export interface PluginHooks {
  beforeRender: Hook
  afterRender: Hook
  onNodeSelect: Hook
  onNodeUpdate: Hook
  transformData: Hook
  registerComponent: Hook
}

// hook type
export interface Hook {
  tap: (_name: string, _fn: (..._args: any[]) => any) => void
}

// Plug-in configuration
export interface PluginConfig {
  enabled: boolean
  options: Record<string, any>
}
