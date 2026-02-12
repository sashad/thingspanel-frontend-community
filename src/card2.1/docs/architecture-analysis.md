# Card2.1 Architecture Analysis Document

## Directory structure overview

```
src/card2.1/
├── index.ts                    # System main entrance
├── components/                 # Component Catalog
│   ├── index.ts               # Unified export of components
│   ├── category-mapping.ts    # Classification mapping
│   ├── chart/                 # chart component
│   │   ├── alarm/            # Alarm related
│   │   ├── data/             # Data display
│   │   └── ...               # Other charts
│   ├── common/               # Common components
│   │   └── generic-card/     # Universal card component
│   └── system/               # system components
│       ├── alarm-management/ # Alarm management
│       ├── device-status/    # Device status
│       ├── system-monitoring/# System monitoring
│       └── ...               # Other system components
├── core/                      # core module
│   ├── index.ts              # Core module export
│   ├── auto-registry.ts      # Automatic registration system
│   ├── component-registry.ts # component registry
│   ├── types.ts              # core type definition
│   ├── PropertyExposureManager.ts # Attribute exposure management
│   ├── permission-utils.ts   # permission tool
│   ├── data-source/          # Data source system
│   │   ├── data-binding-manager.ts
│   │   ├── reactive-data-manager.ts
│   │   └── ...
│   └── interaction-*.ts      # interactive system
├── hooks/                     # React Hooks
│   ├── index.ts
│   ├── useComponentTree.ts   # Component tree management
│   └── useCard2Props.ts      # Property management
├── types/                     # type definition
│   ├── index.ts              # Unified type export
│   ├── setting-config.ts     # Set configuration type
│   └── interaction-*.ts     # Interaction type
├── integration/              # Integrated module
│   └── visual-editor-config.ts
└── docs/                      # Document directory
```

## Module dependency analysis

### 1. Core entry module (`index.ts`)
**Function**: system主入口，Responsible for initializing the entire Card2.1 system
**Dependencies**:
- `@/card2.1/core/component-registry` - component registry
- `@/card2.1/core/auto-registry` - Automatic registration system
- `@/card2.1/core/permission-watcher` - Permission monitoring

**provided externally**:
- `initializeCard2System()` - System initialization
- `getComponentTree()` - Get component tree
- `componentRegistry` - Component registry instance

### 2. component module (`components/`)
**Function**: Store all visual components
**Component structure pattern**:
```
Component Catalog/
├── index.ts          # Component export file
├── definition.ts     # Component definition
├── component.vue    # VueComponent implementation
├── setting.vue      # Setting interface
└── settingConfig.ts # Set configuration
```

**Key component examples**:
- `digit-indicator` (digital indicator)
- `alarm-count` (Alarm count)
- `cpu-usage` (CPUUsage rate)
- `generic-card` (General card)

### 3. core module (`core/`)
**Function**: 提供核心系统Function

#### 3.1 Component registration system
- `component-registry.ts` - Component registration management
- `auto-registry.ts` - Automatic scan registration
- `PropertyExposureManager.ts` - Attribute exposure management

#### 3.2 Data source system
- `data-binding-manager.ts` - Data binding management
- `reactive-data-manager.ts` - Responsive data management
- `static-data-source.ts` - Static data source

#### 3.3 interactive system
- `interaction-manager.ts` - Interaction management
- `interaction-adapter.ts` - interactive adapter
- `interaction-types.ts` - Interaction type definition

### 4. Hooks module (`hooks/`)
**Function**: supply React/Vue Integrated interface
- `useComponentTree.ts` - Component tree management Hook
- `useCard2Props.ts` - Property management Hook

### 5. type module (`types/`)
**Function**: Unified type definition system
- Component definition type
- Set configuration type
- Interactive system type
- Data source type

## Citation relationship analysis

### Internal reference relationship

1. **components → core types**
   - All component definition files reference `@/card2.1/core/types`
   - Example: `import type { ComponentDefinition } from '@/card2.1/core/types'`

2. **References between core modules**
   - `component-registry.ts` → `PropertyExposureManager.ts` (dynamic import)
   - `auto-registry.ts` → `component-registry.ts`
   - `data-binding-manager.ts` → `component-registry.ts`

3. **Hooks → Core functions**
   - `useComponentTree.ts` → `@/card2.1/index` (System entrance)
   - `useCard2Props.ts` → `PropertyExposureManager.ts`

### External reference relationship

1. **Main application reference**
   - `src/main.ts` - Initialized when application starts Card2.1 system
   - `src/store/modules/visual-editor/card2-adapter.ts` - Visual editor adaptation

2. **Visual editor integration**
   - `src/components/visual-editor/` - Multiple file references Card2.1 system
   - `src/features/iot-visualization/` - IoTVisualization function integration

3. **Interactive system integration**
   - `src/core/interaction-system/` - Interactive system component references

## Architectural Features Analysis

### 1. Modular design
- **clear hierarchy**: Entrance → core → components → integrated
- **Segregation of duties**: register、data、interaction、UI separation
- **plug-in architecture**: Support dynamic component registration

### 2. type safety
- **complete TypeScript support**
- **Generic component configuration**
- **Strict type constraints**

### 3. Automatic registration system
- **directory scan**: Automatically discover components
- **Classification management**: Path-based automatic classification
- **Permission filtering**: Component filtering based on user roles

### 4. Attribute exposure system
- **Whitelist mechanism**: Secure attribute access control
- **Permission classification**: public/protected/private Level three authority
- **Audit log**: Property access and modification records

### 5. data binding system
- **Multiple data sources support**: static/api/websocket/mqtt
- **Responsive updates**: Real-time data synchronization
- **Field mapping**: 灵活的数据Field mapping

## Existing problems and improvement suggestions

### Fixed issues
1. ✅ Path parsing error - Change relative path to absolute path
2. ✅ Incomplete type definition - Add missing attribute definitions
3. ✅ import error - Remove non-existent imports
4. ✅ Debug code cleanup - Production environment optimization

### Problems to be optimized
1. ⚠️ Circular dependency risk - Need to further optimize inter-module references
2. ⚠️ Permission check logic - Support dynamic permission changes
3. ⚠️ Port isolation complexity - Simplified multi-environment support

### Suggestions for architectural improvements
1. **dependency injection**: Introducing dependency injection container management module dependencies
2. **event bus**: Decoupling modules using event-driven architecture
3. **Configuration center**: Unified management system configuration
4. **Performance monitoring**: Add system performance monitoring indicators

## Summarize

Card2.1 It is a well-designed component architecture system，Has complete component management、data binding、Permission control and interaction capabilities。The system adopts modular design，type safety，Support automatic registration and dynamic expansion。Through continuous architectural optimization，Can further improve the stability and maintainability of the system。