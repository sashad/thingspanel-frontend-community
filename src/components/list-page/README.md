# ListPage Component usage documentation

## Overview

`ListPage` Is a highly customizable list page layout component，Designed to unify list pages in projectsUIand interactive experience，At the same time, it provides enough flexibility to meet the needs of different scenarios.。

## characteristic

- 🔍 **Smart search area**：Automatically displayed based on slot content/Hide search area
- 🎛️ **Flexible head operation**：Supports customizing the left and right operating areas
- 👁️ **Multiple view switching**：Support cards、list、Multiple view modes such as maps
- 🔄 **Built-in refresh function**：Provide unified refresh interaction
- 📱 **Responsive design**：Adapt to different screen sizes
- 🎨 **Highly customizable**：Flexible content customization via slot system

## Basic usage

```vue
<template>
  <list-page>
    <!-- search form -->
    <template #search-form-content>
      <n-form inline>
        <n-form-item label="name">
          <n-input v-model:value="searchForm.name" placeholder="Please enter name" />
        </n-form-item>
        <n-form-item label="state">
          <n-select v-model:value="searchForm.status" :options="statusOptions" />
        </n-form-item>
      </n-form>
    </template>

    <!-- list view -->
    <template #list-view>
      <n-data-table :columns="columns" :data="data" />
    </template>

    <!-- Pagination -->
    <template #footer>
      <n-pagination v-model:page="pagination.page" :page-count="pagination.pageCount" />
    </template>
  </list-page>
</template>
```

## API

### Props

| attribute name | type | default value | illustrate |
|--------|------|--------|------|
| `addButtonText` | `string \| (() => string)` | `''` | New button text，Support functional form |
| `addButtonI18nKey` | `string` | `'card.addButton'` | New button internationalizationkey |
| `initialView` | `string` | `''` | Initial view type |
| `availableViews` | `ViewItem[]` | `[card, list, map]` | Available view type configurations |
| `showQueryButton` | `boolean` | `true` | Whether to display the query button |
| `showResetButton` | `boolean` | `true` | Whether to display the reset button |

### ViewItem interface

```typescript
interface ViewItem {
  key: string;        // View ID
  icon: any;          // View icon component
  label?: string;     // view label（internationalizationkey）
}
```

### Events

| event name | parameter | illustrate |
|--------|------|------|
| `query` | `filterData: Record<string, any>` | Query events |
| `reset` | - | reset event |
| `add-new` | - | New event |
| `view-change` | `{ viewType: string }` | View switching event |
| `refresh` | - | refresh event |

### slot

#### Search area slot

| Slot name | illustrate |
|--------|------|
| `search-form-content` | Search form content |

#### Head operating slot

| Slot name | illustrate |
|--------|------|
| `header-left` | Fully customize left header content |
| `add-button` | Customize new button（Within the default left layout） |
| `header-right` | Fully customize the right header content |

#### View content slot

| Slot name | illustrate |
|--------|------|
| `card-view` | card view content |
| `list-view` | list view content |
| `map-view` | Map view content |

#### Other slots

| Slot name | illustrate |
|--------|------|
| `footer` | bottom content（Usually used for pagination） |

## Usage scenarios

### 1. Basic list page

```vue
<template>
  <list-page @query="handleQuery" @reset="handleReset" @add-new="handleAddNew">
    <template #search-form-content>
      <n-form ref="searchFormRef" inline :model="searchForm">
        <n-form-item label="name" path="name">
          <n-input v-model:value="searchForm.name" placeholder="Please enter name" />
        </n-form-item>
      </n-form>
    </template>

    <template #list-view>
      <n-data-table :columns="columns" :data="data" :loading="loading" />
    </template>

    <template #footer>
      <n-pagination
        v-model:page="pagination.page"
        :page-count="pagination.pageCount"
        @update:page="handlePageChange"
      />
    </template>
  </list-page>
</template>
```

### 2. Multiple view switching

```vue
<template>
  <list-page
    initial-view="card"
    @view-change="handleViewChange"
  >
    <template #search-form-content>
      <!-- search form -->
    </template>

    <!-- card view -->
    <template #card-view>
      <div class="card-grid">
        <div v-for="item in data" :key="item.id" class="card-item">
          <!-- Card content -->
        </div>
      </div>
    </template>

    <!-- list view -->
    <template #list-view>
      <n-data-table :columns="columns" :data="data" />
    </template>

    <!-- map view -->
    <template #map-view>
      <div class="map-container">
        <!-- map component -->
      </div>
    </template>
  </list-page>
</template>
```

### 3. Custom head operation

```vue
<template>
  <list-page>
    <!-- Fully customize the left side -->
    <template #header-left>
      <n-space>
        <n-button type="primary" @click="handleBatchImport">
          <template #icon><n-icon><upload-icon /></n-icon></template>
          Batch import
        </n-button>
        <n-button type="success" @click="handleAddNew">
          <template #icon><n-icon><plus-icon /></n-icon></template>
          New project
        </n-button>
      </n-space>
    </template>

    <!-- Customize the right side -->
    <template #header-right>
      <n-space>
        <n-button @click="handleExport">
          <template #icon><n-icon><download-icon /></n-icon></template>
          Export
        </n-button>
        <n-button @click="handleSettings">
          <template #icon><n-icon><settings-icon /></n-icon></template>
          set up
        </n-button>
        <n-button @click="handleRefresh">
          <template #icon><n-icon><refresh-icon /></n-icon></template>
          refresh
        </n-button>
      </n-space>
    </template>

    <template #list-view>
      <!-- List content -->
    </template>
  </list-page>
</template>
```

### 4. Simple mode（No search area）

```vue
<template>
  <list-page
    :show-query-button="false"
    :show-reset-button="false"
  >
    <!-- Not available search-form-content slot，The search area will be hidden -->

    <template #list-view>
      <n-data-table :columns="columns" :data="data" />
    </template>
  </list-page>
</template>
```

### 5. Only customize the new button

```vue
<template>
  <list-page>
    <template #add-button>
      <n-dropdown :options="addOptions" @select="handleAddSelect">
        <n-button type="primary">
          <template #icon><n-icon><plus-icon /></n-icon></template>
          New
          <template #suffix><n-icon><chevron-down-icon /></n-icon></template>
        </n-button>
      </n-dropdown>
    </template>

    <template #list-view>
      <!-- List content -->
    </template>
  </list-page>
</template>
```

## Event handling example

```vue
<script setup>
import { ref } from 'vue';

const searchForm = ref({
  name: '',
  status: null
});

const data = ref([]);
const loading = ref(false);

// Query events
const handleQuery = (filterData) => {
  console.log('query parameters:', searchForm.value);
  loadData();
};

// reset event
const handleReset = () => {
  searchForm.value = {
    name: '',
    status: null
  };
  loadData();
};

// New event
const handleAddNew = () => {
  // Jump to the new page or open the new pop-up window
  console.log('New operation');
};

// View switching event
const handleViewChange = ({ viewType }) => {
  console.log('switch to view:', viewType);
  // Data loading method can be adjusted based on view type
};

// refresh event
const handleRefresh = () => {
  loadData();
};

const loadData = async () => {
  loading.value = true;
  try {
    // Load data logic
    // const result = await api.getData(searchForm.value);
    // data.value = result.data;
  } finally {
    loading.value = false;
  }
};
</script>
```

## Style customization

The component provides the followingCSSClass name for style customization：

```scss
.advanced-list-layout {
  // main container

  .search {
    // search area

    .search-form-content {
      // Search form content area
    }

    .search-button {
      // search button area
    }
  }

  .list-content {
    // content area

    .list-content-header {
      // head area

      .list-content-header-left {
        // Left operating area
      }

      .list-content-header-right {
        // Right operating area
      }
    }

    .list-content-body {
      // main content area

      .view-wrapper {
        // View wrapper
      }
    }
  }
}

.list-content-footer {
  // bottom area
}
```

## Things to note

1. **Search area display logic**：only if there is `search-form-content` slot or `showQueryButton`/`showResetButton` for true hour，The search area will be displayed。

2. **View switching**：View switching器只有在存在多个视图对应的插槽时才会显示。

3. **event handling**：Query and reset events require the parent component to handle the collection and clearing of form data by itself。

4. **Slot priority**：`header-left` The slot completely replaces the default New button，If you just want to customize the new button，Please use `add-button` slot。

5. **internationalization**：组件内置了internationalization支持，确保项目中已正确配置internationalization。

## Change log

### v1.1.0
- ✨ Added search area smart display function
- ✨ Added slot-based head operation area
- ✨ New `add-button` Slot support
- 🐛 Fix style issue when switching views
- 📝 Improve usage documentation and examples
