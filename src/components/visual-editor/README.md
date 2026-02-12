# ThingsPanel Visual Editor Architecture documentation

**Document date**: 2025-08-29  
**Version**: v2.0.0  
**Project version**: 0.1.0

## 📋 Overview

ThingsPanel Visual Editor is a based on Vue 3 visual editor system，Supports multiple renderer architectures，Provides drag-and-drop visual component editing capabilities for IoT dashboards。

> 📖 **Detailed development documentation**: Check [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) get completeAPIrefer to、Development Guidelines and Best Practices。

### Core features

- **Multi-renderer architecture**: support Canvas、Gridstack、GridLayoutPlus and other layout engines
- **Component design**: fully componentized Widget system
- **Configure the system**: Unified component configuration and data binding management
- **Theme integration**: Fully supports light and dark theme switching
- **Card 2.1 integrated**: 与新一代数据绑定系统深度integrated

## 🏗️ Architecture overview

```
visual-editor/
├── PanelEditor.vue              # Main entrance component
├── index.ts                     # foreign API Export
├── components/                  # UI component layer
│   ├── Canvas/                  # Canvas Rendering related components
│   ├── PropertyPanel/           # Property panel system
│   ├── WidgetLibrary/           # Component library panel
│   └── toolbar/                 # toolbar component
├── renderers/                   # Multi-renderer system
│   ├── base/                    # Renderer base class
│   ├── canvas/                  # Canvas Renderer
│   ├── gridstack/               # Gridstack Renderer
│   └── templates/               # Renderer template
├── configuration/               # configuration management system
├── core/                        # core business logic
├── store/                       # Status management
├── types/                       # TypeScript type definition
└── widgets/                     # Widget Component library
```

## 🎯 Core component description

### 1. Main entrance component
- **PanelEditor.vue**: Editor main component，Integrate all subsystems

### 2. renderer system (`renderers/`)
Multi-renderer architecture supports different layout engines：

#### Basic renderer (`base/`)
- `BaseRenderer.ts`: Renderer abstract base class
- `BaseRendererComponent.vue`: Renderer component base class
- `RendererManager.ts`: Renderer Manager

#### Canvas Renderer (`canvas/`)
- `CanvasRenderer.vue`: Free layout canvas renderer
- `Card2Wrapper.vue`: Card 2.1 component wrapper
- `ContextMenu.vue`: Right-click context menu

#### Gridstack Renderer (`gridstack/`)
- `GridstackRenderer.vue`: based on GridStack.js mesh renderer
- `GridLayoutPlusWrapper.vue`: Enhanced grid layout wrapper

### 3. component system (`components/`)

#### Properties panel (`PropertyPanel/`)
- `PropertyPanel.vue`: Main properties panel
- `components/`: Property editor for various types of components
  - `BarChartPropertyEditor.vue`: Histogram Properties Editor
  - `ImagePropertyEditor.vue`: Image component property editor
  - `TextPropertyEditor.vue`: Text component property editor

#### Component library (`WidgetLibrary/`)
- `WidgetLibrary.vue`: Left component library panel，Display available Widget

#### Toolbar (`toolbar/`)
- `VisualEditorToolbar.vue`: Main toolbar
- `CommonToolbar.vue`: Universal Toolbar Component

### 4. configuration management system (`configuration/`)
Unified component configuration and data binding management：

- `ConfigurationManager.ts`: configuration manager
- `ConfigurationStateManager.ts`: Configuration status management
- `ConfigurationIntegrationBridge.ts`: Configuring the integrated bridge
- `ConfigurationPanel.vue`: Configure panel components

#### Configure components (`components/`)
- `DataFieldMappingInput.vue`: Data field mapping input
- `DataFilterInput.vue`: Data filter input
- `ScriptDataSourceEditor.vue`: Script data source editor
- `SimpleDataDisplay.vue`: Simple data display component

### 5. core system (`core/`)
- `component-api-config.ts`: components API Configure the system
- `component-data-requirements.ts`: Component data requirement declaration system
- `EditorDataSourceManager.ts`: Editor Data Source Manager
- `GlobalPollingManager.ts`: Global Poll Manager
- `ConfigDiscovery.ts`: Configure discovery system

### 6. Status management (`store/`)
- `editor.ts`: Editor main state management（canvas、viewport、mode etc.）
- `widget.ts`: Widget Status management（Component definition、Instance management, etc.）

### 7. Widget Component library (`widgets/`)

#### Base Widget
- `ImageWidget.vue`: Picture component
- `TextWidget.vue`: text component
- `base-widgets.ts`: Base Widget definition

#### chart Widget (`chart/`)
- `BarChartChartWidget/`: Bar chart component
- `DigitIndicatorChartWidget/`: digital indicator component

#### Customize Widget (`custom/`)
- `BarChartWidget/`: Custom histogram
- `DigitIndicatorWidget/`: Custom digital indicator
- `ImageWidget/`: Custom picture component
- `TextWidget/`: Custom text component

### 8. type system (`types/`)
complete TypeScript type definition：

- `base-types.ts`: Basic type definition
- `editor.ts`: Editor related types
- `renderer.ts`: Renderer type
- `widget.ts`: Widget Component type
- `layout.ts`: Layout related types
- `plugin.ts`: Plug-in system type

## 🔧 Usage

### Basic usage

```vue
<script setup lang="ts">
import { PanelEditor } from '@/components/visual-editor'
import { useVisualEditor } from '@/store/modules/visual-editor'

// Use new unified architecture
const editor = useVisualEditor()
</script>

<template>
  <PanelEditor />
</template>
```

### Type import

```typescript
import type {
  GraphData,
  WidgetType,
  RendererType,
  EditorConfig
} from '@/components/visual-editor'
```

## 🎨 renderer system

### Renderer registration

```typescript
import { RendererManager } from '@/components/visual-editor/renderers'

// Register a new renderer
RendererManager.register('custom', CustomRenderer)
```

### Renderer development

inherit `BaseRenderer` kind：

```typescript
import { BaseRenderer } from '@/components/visual-editor/renderers/base'

export class CustomRenderer extends BaseRenderer {
  render(data: GraphData) {
    // Custom rendering logic
  }
}
```

## 📊 Widget develop

### Widget definition

```typescript
interface CustomWidget {
  type: string
  name: string
  icon: string
  defaultProperties: Record<string, any>
  defaultLayout: {
    canvas: { width: number; height: number }
    gridstack: { w: number; h: number }
  }
}
```

### Widget components

```vue
<script setup lang="ts">
// Widget Component implementation
defineProps<{
  config: CustomWidgetConfig
  data: any
}>()
</script>

<template>
  <div class="custom-widget">
    <!-- Widget content -->
  </div>
</template>
```

## 🔌 Configure the system

### Component configuration

Use Configuration Manager to manage component configurations：

```typescript
import { configurationManager } from '@/components/visual-editor/configuration'

// Get component configuration
const config = configurationManager.getConfig(componentId)

// Update component configuration
configurationManager.updateConfig(componentId, newConfig)
```

### data binding

and Card 2.1 Data binding system integration：

```typescript
import { componentDataRequirementsRegistry } from '@/components/visual-editor/core'

// Declare component data requirements
componentDataRequirementsRegistry.registerRequirement(
  'custom-widget',
  {
    dataFields: ['temperature', 'humidity'],
    updateTriggers: ['timer', 'websocket']
  }
)
```

## 🎯 Integration instructions

### Card 2.1 integrated

Editor with Card 2.1 Deep integration of data binding system，support：

- Component Data Requirements Statement
- Reactive data binding  
- Multiple data sources（API、WebSocket、Scripts etc.）
- Real-time data updates

### Theme system integration

All components fully support theme switching：

```vue
<script setup lang="ts">
import { useThemeStore } from '@/store/modules/theme'
const themeStore = useThemeStore()
</script>

<style scoped>
.editor-component {
  color: var(--text-color);
  background: var(--card-color);
}
</style>
```

## 🚀 Development Guide

### development environment

```bash
# Start the development server
pnpm dev

# type checking
pnpm typecheck

# code inspection
pnpm lint

# Quality check
pnpm quality-check
```

### test page

- **Editor integration testing**: `/test/editor-integration`
- **Configure system testing**: `/test/new-config-system`

## 🧹 clear record (v2.0.0)

### Cleaned files and directories

#### 1. Test and sample files
- ✅ `components/config/ConfigWrapperTest.vue` - Configure wrapper test component
- ✅ `components/Layout/example.vue` - Layout sample file
- ✅ `core/ConfigDiscoveryTest.ts` - Configure discovery test files

#### 2. Completely deleted document directory
- ✅ `docs/` The entire directory and all its subfiles
  - `docs/ARCHITECTURE.md` - Old architecture documentation
  - `docs/CONFIGURATION.md` - Configure system documentation
  - `docs/STATE_MANAGEMENT.md` - State Management Documentation
  - `docs/WIDGET_REGISTRY_GUIDE.md` - Widget Registration Guide
  - `docs/components/Layout.md` - Layout component documentation
  - `docs/renderers/` - Renderer development documentation directory
  - `docs/review/` - Code review document directory
  - `docs/xiugaidfangan/` - Modify the project document directory

#### 3. root directory document file
- ✅ `ARCHITECTURE_GUIDE.md` - Architecture Guide
- ✅ `COMPONENT_ANALYSIS.md` - Component Analysis Report
- ✅ `COMPONENT_SUMMARY.md` - Component Summary Document
- ✅ `CLEANUP_SUMMARY.md` - Cleanup summary report
- ✅ `COMPONENT_API_CONFIG_IMPLEMENTATION.md` - APIConfiguration implementation documentation
- ✅ `README.md` - Old moderator documents (rewritten)

#### 4. Submodule documentation file
- ✅ `configuration/README.md` - Configure system documentation
- ✅ `configuration/CONFIGURATION_ARCHITECTURE.md` - Configuration schema documentation
- ✅ `configuration/test-integration.html` - Configuration testHTML
- ✅ `renderers/RENDERER_SYSTEM_GUIDE.md` - Renderer System Guide
- ✅ `renderers/canvas/README.md` - CanvasRenderer documentation
- ✅ `core/component-api-config.test.md` - APIConfigure test documents

### Documents awaiting further evaluation

#### 1. Duplicate property editor (Reserved for now)
- `components/property-editors/ImagePropertyEditor.vue`
- `components/property-editors/TextPropertyEditor.vue`
- **illustrate**: and `PropertyPanel/components/` Duplicate files in，Need to confirm usage before cleaning

#### 2. Duplicate Widget document (Reserved for now)
- `widgets/ImageWidget.vue` 
- `widgets/TextWidget.vue`
- **illustrate**: and `widgets/custom/` Duplicate files with the same name in the directory，Need to confirm functional differences

#### 3. Suspected unused components (Reserved for now)
- `components/EditorCanvas.vue` - Only mentioned in deleted documents
- `components/PanelLayout.vue` - Referenced only within type definitions
- `components/DataSourceTriggerPanel.vue` - Imported but not actually used

### Cleaning effect

#### Quantity statistics
- **删除文档document**: about 20+ indivual `.md` document
- **Delete test files**: 3 test related files
- **deleteHTMLdocument**: 1 integration test pages
- **Keep core files**: ~100 core function files

#### Directory structure optimization
- Removed `docs/` redundant document directory
- Cleaned up temporary analysis documents in the root directory
- unified into one `README.md` Architecture documentation
- Maintains a complete functional module structure

#### 维护效益
- 🎯 **Simplify maintenance**: Reduce document maintenance burden，unified information source
- 🚀 **Improve performance**: Reduce unnecessary file scanning and build time  
- 📖 **Improve experience**: unified、Clear architecture documentation replaces scattered files
- 🔍 **Easy to navigate**: clear directory structure，Convenient for developers to locate functions

## 📝 Change log

### v2.0.0 (2025-08-29)
- 🧹 **major cleanup**: delete 20+ Redundant documentation files and test files
- 📋 **Document reconstruction**: Create unified architecture documentation，Replacement of decentralized documentation systems
- 🏗️ **Structural optimization**: Simplify directory structure，Improve project maintainability
- ✨ **Functionality maintained**: Keep all core functional modules，Clean documentation and test files only
- 🎯 **Development experience**: Provide clear usage guidelines and development specifications

### Historical version
- v1.x: Initial multi-renderer architecture implementation
- v0.x: Prototype and proof-of-concept phase

## 🤝 Contribution Guide

1. follow project TypeScript and Vue 3 specification
2. New Widget Requires complete type definition
3. Renderer development requires inheriting base classes
4. All components must support the theme system
5. Use Chinese comments to illustrate key business logic

---

**maintainer**: ThingsPanel development team  
**last updated**: 2025-08-29