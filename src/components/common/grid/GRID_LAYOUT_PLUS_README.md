# Grid Layout Plus Component usage guide

based on [Grid Layout Plus](https://grid-layout-plus.netlify.app/) A modern grid layout component，Provide better performance and user experience。

## 🎯 Why choose Grid Layout Plus？

Compared to the original DraggableResizableGrid，Grid Layout Plus Has the following advantages：

### ✅ Technical advantages
- **Mature and stable** - Based on proven grid-layout-plus Library
- **Superior performance** - Better drag performance and smoothness
- **Responsive design** - Built-in breakpoint support，Adapt to different screens
- **modernizationAPI** - More intuitive configuration and event system
- **Widely compatible** - Better browser compatibility

### ✅ Features
- **completeTypeScriptsupport** - type safety，Good development experience
- **Rich configuration options** - Flexible layout control
- **Powerful event system** - Complete life cycle callback
- **Theme support** - Built-in light and dark theme switching
- **History** - Undo redo function
- **Import and export** - Layout data persistence

## 📦 Install

Project already included `grid-layout-plus` rely，No additional installation required。

## 🚀 quick start

### Basic usage

```vue
<template>
  <GridLayoutPlus
    v-model:layout="layout"
    :config="gridConfig"
    @layout-change="handleLayoutChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { GridLayoutPlus, type GridLayoutPlusItem } from '@/components/common/grid'

const layout = ref<GridLayoutPlusItem[]>([
  {
    i: 'item-1',
    x: 0,
    y: 0,
    w: 3,
    h: 2,
    type: 'chart',
    title: 'chart component'
  },
  {
    i: 'item-2',
    x: 3,
    y: 0,
    w: 2,
    h: 1,
    type: 'text',
    title: 'text component'
  }
])

const gridConfig = {
  colNum: 12,
  rowHeight: 80,
  margin: [10, 10],
  isDraggable: true,
  isResizable: true
}

const handleLayoutChange = (newLayout: GridLayoutPlusItem[]) => {
  console.log('Layout changes:', newLayout)
}
</script>
```

### use Hook Perform status management

```vue
<template>
  <div class="grid-container">
    <div class="toolbar">
      <button @click="addItem('chart')">Add chart</button>
      <button @click="compactLayout">Compact layout</button>
      <button @click="undo" :disabled="!canUndo">Cancel</button>
      <button @click="redo" :disabled="!canRedo">Redo</button>
    </div>
    
    <GridLayoutPlus
      v-model:layout="layout"
      :config="gridConfig"
      @item-edit="handleItemEdit"
    />
    
    <div class="stats">
      <span>Number of items: {{ layoutStats.totalItems }}</span>
      <span>Utilization: {{ layoutStats.utilization.toFixed(1) }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GridLayoutPlus, useGridLayoutPlus } from '@/components/common/grid'

const {
  layout,
  layoutStats,
  canUndo,
  canRedo,
  addItem,
  compactCurrentLayout,
  undo,
  redo
} = useGridLayoutPlus({
  initialLayout: [],
  enableHistory: true,
  autoSave: true,
  onSave: (layout) => {
    // Automatically save to backend
    localStorage.setItem('grid-layout', JSON.stringify(layout))
  }
})

const gridConfig = {
  colNum: 12,
  rowHeight: 100,
  margin: [10, 10]
}

const compactLayout = () => {
  compactCurrentLayout()
}

const handleItemEdit = (item) => {
  // Working on Project Editing
  console.log('Edit project:', item)
}
</script>
```

## 🔧 Configuration options

### GridLayoutPlusConfig

```typescript
interface GridLayoutPlusConfig {
  // Basic configuration
  colNum: number              // Number of columns，default 12
  rowHeight: number           // row height，default 100
  margin: [number, number]    // margin [x, y]，default [10, 10]
  
  // Interactive configuration
  isDraggable: boolean        // Whether it can be dragged，default true
  isResizable: boolean        // Is it resizable?，default true
  preventCollision: boolean   // Whether to prevent collision，default false
  
  // layout configuration
  isMirrored: boolean         // Whether to mirror，default false
  autoSize: boolean           // Whether to automatically resize，default true
  verticalCompact: boolean    // Is it vertically compact?，default true
  useCssTransforms: boolean   // Whether to useCSStransform，default true
  
  // Responsive configuration
  responsive: boolean         // Is it responsive?，default false
  breakpoints: Record<string, number>  // Breakpoint configuration
  cols: Record<string, number>         // Number of columns for different breakpoints
  
  // Other configurations
  useStyleCursor: boolean     // Whether to use style cursor，default true
  restoreOnDrag: boolean      // Whether to restore when dragging，default false
}
```

### GridLayoutPlusItem

```typescript
interface GridLayoutPlusItem {
  // Required fields
  i: string                   // unique identifier
  x: number                   // Xaxis position
  y: number                   // Yaxis position
  w: number                   // width
  h: number                   // high
  
  // constraint configuration
  minW?: number               // minimum width
  minH?: number               // minimum height
  maxW?: number               // maximum width
  maxH?: number               // maximum height
  
  // behavior configuration
  isDraggable?: boolean       // Whether it can be dragged
  isResizable?: boolean       // Is it resizable?
  static?: boolean            // Whether it is a static project
  
  // business data
  type?: string               // Component type
  title?: string              // Component title
  component?: Component       // Rendered component
  props?: Record<string, any> // Component properties
  data?: Record<string, any>  // component data
  style?: Record<string, string | number>  // Custom style
  className?: string          // Custom class name
  metadata?: Record<string, any>           // Project metadata
}
```

## 📡 event system

### Layout events

```vue
<GridLayoutPlus
  @layout-created="handleLayoutCreated"
  @layout-mounted="handleLayoutMounted"
  @layout-updated="handleLayoutUpdated"
  @layout-ready="handleLayoutReady"
  @layout-change="handleLayoutChange"
  @breakpoint-changed="handleBreakpointChange"
/>
```

### Project events

```vue
<GridLayoutPlus
  @item-add="handleItemAdd"
  @item-delete="handleItemDelete"
  @item-update="handleItemUpdate"
  @item-edit="handleItemEdit"
  @item-move="handleItemMove"
  @item-resize="handleItemResize"
  @item-data-update="handleItemDataUpdate"
/>
```

## 🎨 Custom style

### CSS variable

```css
.grid-layout-plus-wrapper {
  /* theme color */
  --bg-color: #f8f9fa;
  --bg-color-dark: #1a1a1a;
  --border-color: #e1e5e9;
  --border-color-dark: #404040;
  --text-color: #495057;
  --text-color-dark: #ffffff;
  
  /* Item style */
  --item-bg: white;
  --item-border: #e1e5e9;
  --item-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  
  /* Drag prompt */
  --drag-hint-color: #007bff;
}
```

### Custom project content

```vue
<GridLayoutPlus v-model:layout="layout">
  <template #default="{ item, readonly }">
    <div class="custom-item">
      <div class="item-header">
        <h3>{{ item.title }}</h3>
        <div v-if="!readonly" class="item-actions">
          <button @click="editItem(item)">edit</button>
          <button @click="deleteItem(item)">delete</button>
        </div>
      </div>
      
      <div class="item-content">
        <!-- according to item.type Render different content -->
        <component 
          v-if="item.component"
          :is="item.component"
          v-bind="item.props"
        />
        <div v-else>{{ item.type }} components</div>
      </div>
    </div>
  </template>
</GridLayoutPlus>
```

## 🚀 Advanced usage

### Responsive layout

```typescript
const gridConfig = {
  responsive: true,
  breakpoints: { 
    lg: 1200, 
    md: 996, 
    sm: 768, 
    xs: 480, 
    xxs: 0 
  },
  cols: { 
    lg: 12, 
    md: 10, 
    sm: 6, 
    xs: 4, 
    xxs: 2 
  }
}
```

### Prevent collision

```typescript
const gridConfig = {
  preventCollision: true  // Prevent project overlap
}
```

### project constraints

```typescript
const item: GridLayoutPlusItem = {
  i: 'constrained-item',
  x: 0,
  y: 0,
  w: 3,
  h: 2,
  minW: 2,     // minimum width
  maxW: 6,     // maximum width
  minH: 1,     // minimum height
  maxH: 4,     // maximum height
  static: false, // Is it static?（Not removable/Adjustment）
}
```

### Drag control

```typescript
const item: GridLayoutPlusItem = {
  i: 'drag-controlled',
  x: 0,
  y: 0,
  w: 2,
  h: 2,
  dragIgnoreFrom: '.no-drag',      // Ignore dragged selectors
  dragAllowFrom: '.drag-handle',   // Selector that allows dragging
  resizeIgnoreFrom: '.no-resize',  // Ignore resized selectors
}
```

## 📱 Mobile support

Component automatically supports touch devices：

```typescript
const gridConfig = {
  colNum: 6,        // Mobile uses fewer columns
  rowHeight: 60,    // Smaller row height
  margin: [5, 5],   // smaller margins
}
```

## 🔄 Migration Guide

from DraggableResizableGrid Migrate to GridLayoutPlus：

### 1. Import changes

```typescript
// old version
import { DraggableResizableGrid } from '@/components/common/grid'

// new version
import { GridLayoutPlus } from '@/components/common/grid'
```

### 2. attribute mapping

| DraggableResizableGrid | GridLayoutPlus | illustrate |
|----------------------|----------------|------|
| `items` | `layout` | Data attribute name change |
| `config.columns` | `config.colNum` | Column number configuration |
| `config.rowHeight` | `config.rowHeight` | Row height configuration（same） |
| `config.gap` | `config.margin` | spacing configuration（Format changes） |
| `config.readonly` | `readonly` | Read-only mode promoted to top-level property |

### 3. event mapping

| DraggableResizableGrid | GridLayoutPlus | illustrate |
|----------------------|----------------|------|
| `@layout-change` | `@layout-change` | same |
| `@item-click` | `@item-edit` | click event rename |
| `@item-add` | `@item-add` | same |
| `@item-remove` | `@item-delete` | Rename |

## 📚 Sample project

View full example：`src/components/common/grid/examples/GridLayoutPlusExample.vue`

Run the example：
```bash
# Access the sample page in a development environment
http://localhost:3000/grid-layout-plus-example
```

## 🆘 FAQ

### Q: How to set the minimum for a project/Maximum size？
A: exist GridLayoutPlusItem Medium settings `minW`, `maxW`, `minH`, `maxH` property。

### Q: How to disable dragging or resizing of an item？
A: Set up the project `isDraggable: false` or `isResizable: false`。

### Q: How to implement custom drag handles for projects？
A: use `dragAllowFrom` Property specifies the selector for the drag handle。

### Q: How to handle data updates for projects？
A: monitor `@item-data-update` event or use Hook data management methods。

### Q: How to save and restore layouts？
A: use Hook of `exportCurrentLayout()` and `importLayout()` method。

## 🔗 Related links

- [Grid Layout Plus Official documentation](https://grid-layout-plus.netlify.app/)
- [Vue 3 document](https://vuejs.org/)
- [TypeScript document](https://www.typescriptlang.org/)

---

**Recommended for use in new projects GridLayoutPlus，It provides better performance and user experience！** 🚀