<template>
  <div class="widget-library">
    <!-- search box -->
    <div class="search-bar">
      <n-input v-model:value="searchTerm" :placeholder="$t('visualEditor.searchComponents')" clearable>
        <template #prefix>
          <n-icon :component="SearchOutline" />
        </template>
      </n-input>
    </div>

    <!-- Loading status -->
    <div v-if="!isInitialized && !initializationError" class="loading-state">
      <n-spin size="large" />
      <div class="loading-text">{{ $t('visualEditor.loadingComponents') }}</div>
    </div>

    <!-- error status -->
    <div v-else-if="initializationError" class="error-state">
      <n-icon size="48" color="#ff4d4f">
        <component :is="AlertCircleOutline" />
      </n-icon>
      <div class="error-text">{{ $t('visualEditor.loadingFailed') }}</div>
      <div class="error-detail">{{ initializationError }}</div>
      <n-button type="primary" size="small" @click="initializeWidgets">{{ $t('visualEditor.retry') }}</n-button>
    </div>

    <!-- two-level classification Tabs -->
    <n-tabs v-else type="line" animated class="widget-tabs">
      <!-- Chart classificationTabs -->
      <n-tab-pane
        v-for="topCategory in filteredWidgetTree"
        :key="topCategory.name"
        :name="topCategory.name"
        :tab="$t(topCategory.name)"
      >
        <div class="tab-content">
          <!-- Check if there are subcategories -->
          <div v-if="topCategory.subCategories && topCategory.subCategories.length > 0">
            <div v-for="subCategory in topCategory.subCategories" :key="subCategory.name" class="widget-subcategory">
              <h4 class="subcategory-title">{{ $t(subCategory.name) }}</h4>

              <!-- Check if there is a component -->
              <div v-if="subCategory.children && subCategory.children.length > 0" class="category-grid">
                <div
                  v-for="widget in subCategory.children"
                  :key="widget.type"
                  class="widget-card"
                  :title="`Click Add to Editor\n${widget.description}`"
                  @click="handleAddWidget(widget)"
                >
                  <div class="widget-icon">
                    <n-icon v-if="typeof widget.icon !== 'string' && widget.icon" size="20">
                      <component :is="widget.icon" />
                    </n-icon>
                    <SvgIcon
                      v-else-if="typeof widget.icon === 'string' && !widget.icon.startsWith('<svg')"
                      :icon="widget.icon"
                    />
                    <div
                      v-else-if="typeof widget.icon === 'string' && widget.icon.startsWith('<svg')"
                      class="svg-icon-inline"
                      v-html="widget.icon"
                    ></div>
                  </div>
                  <div class="widget-name">{{ $t(widget.name) }}</div>
                </div>
              </div>

              <!-- Empty subcategory tips -->
              <div v-else class="empty-subcategory">
                <n-empty size="small" :description="`None yet${$t(subCategory.name)}components`" />
              </div>
            </div>
          </div>

          <!-- Empty category prompt -->
          <div v-else class="empty-category">
            <n-empty :description="`${$t(topCategory.name)}There are currently no components in the category`" />
          </div>
        </div>
      </n-tab-pane>

      <!-- 🔥 New：equipmentTab（Kanban mode only） -->
      <n-tab-pane v-if="props.mode === 'dashboard'" name="device" :tab="$t('card.deviceTab')">
        <div class="tab-content">
          <!-- Device selector -->
          <div class="device-selector">
            <NSelect
              v-model:value="selectedDeviceId"
              :placeholder="$t('generate.select-device')"
              :options="deviceOptions"
              filterable
              clearable
              value-field="device_id"
              label-field="device_name"
              @update:value="(value, option) => parseDeviceTemplate(value, option)"
            />
          </div>

          <!-- Device component grid -->
          <div v-if="deviceTabWidgets.length > 0" class="widget-subcategory">
            <h4 class="subcategory-title">{{ $t('card.availableComponents') || 'Available components' }}</h4>
            <div class="category-grid">
              <div
                v-for="widget in deviceTabWidgets"
                :key="widget.type"
                class="widget-card"
                :title="`Click Add to Editor\n${widget.description}`"
                @click="handleAddWidget(widget)"
              >
                <div class="widget-icon">
                  <n-icon v-if="typeof widget.icon !== 'string' && widget.icon" size="20">
                    <component :is="widget.icon" />
                  </n-icon>
                  <SvgIcon
                    v-else-if="typeof widget.icon === 'string' && !widget.icon.startsWith('<svg')"
                    :icon="widget.icon"
                  />
                  <div
                    v-else-if="typeof widget.icon === 'string' && widget.icon.startsWith('<svg')"
                    class="svg-icon-inline"
                    v-html="widget.icon"
                  ></div>
                </div>
                <div class="widget-name">{{ $t(widget.name) }}</div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="empty-device-state">
            <n-empty
              :description="selectedDeviceId ? 'There are no components available for this device template（v2Format）' : 'Please select a device'"
            />
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <!-- Dev Debug data panel（Only shown in development environment） -->
    <div v-if="DEV" class="debug-dump">
      <details>
        <summary>debug data（summary）</summary>
        <pre class="debug-pre">{{ debugDump }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { SearchOutline, AlertCircleOutline } from '@vicons/ionicons5'
import { useComponentTree } from '@/card2.1/hooks/useComponentTree'
import type { WidgetDefinition } from '@/components/visual-editor/types/widget'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { useI18n } from 'vue-i18n'
import { deviceTemplateSelect } from '@/service/api/device'

const componentTree = useComponentTree({ autoInit: true })

// --- internationalization ---
const { t } = useI18n()

// --- Props ---
interface Props {
  mode?: 'template' | 'dashboard' // model：template=Template configuration，dashboard=Kanban board editor
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'dashboard'
})

// --- State and Emits ---
const searchTerm = ref('')
const emit = defineEmits<{
  'add-widget': [payload: { type: string; source: 'card2' | 'legacy' }]
}>()

// 🔥 equipmentTabRelated status
const deviceOptions = ref<any[]>([])
const selectedDeviceId = ref<string | null>(null)
const availableComponentTypes = ref<string[]>([])

// --- Widget Initialization ---
// use componentTree initialization state
const isInitialized = computed(() => !componentTree.isLoading.value && componentTree.componentTree.value.totalCount > 0)
const initializationError = computed(() => componentTree.error.value)


const initializeWidgets = async () => {
  try {
    await componentTree.initialize()
  } catch (error) {}
}

// 🔥 Device related functions

/**
 * Load device list
 */
const loadDeviceOptions = async () => {
  try {
    const { data, error } = await deviceTemplateSelect()
    if (!error && data) {
      deviceOptions.value = [...data].reverse()
    } else {
      deviceOptions.value = []
    }
  } catch (error) {
    console.error('❌ Failed to load device list:', error)
    deviceOptions.value = []
  }
}

/**
 * Parse device template configuration
 * Extract the list of available component types
 */
const parseDeviceTemplate = (deviceId: string | null, deviceOption: any) => {
  // Clear selection
  if (!deviceId || !deviceOption?.web_chart_config) {
    availableComponentTypes.value = []
    return
  }

  try {
    const config = JSON.parse(deviceOption.web_chart_config)

    // only handle v2 version data
    if (config.version === 'v2' && config.web?.config?.widgets) {
      // Extract all components type Field
      const types = config.web.config.widgets.map((w: any) => w.type).filter(Boolean)
      availableComponentTypes.value = types
      console.log('🔥 [equipmentTab] Extracted component type:', types)
    } else {
      // Old version data or non-v2Version，Show empty list
      console.log('⚠️ [equipmentTab] Nov2format data，Show empty list')
      availableComponentTypes.value = []
    }
  } catch (e) {
    console.error('❌ [equipmentTab] parse web_chart_config fail:', e)
    availableComponentTypes.value = []
  }
}

/**
 * equipmentTabDedicated component list
 * Configure filter components based on templates
 */
const deviceTabWidgets = computed(() => {
  if (!selectedDeviceId.value || availableComponentTypes.value.length === 0) {
    return []
  }

  // Filter out the component types configured in the template
  const filtered = allWidgets.value.filter(widget =>
    availableComponentTypes.value.includes(widget.type)
  )

  console.log('🔥 [equipmentTab] filtered components:', filtered.length, 'indivual')
  return filtered
})


// --- Widget Data ---
const allWidgets = computed(() => {
  if (!isInitialized.value) return []

  // from componentTree Get component data and convert to WidgetDefinition Format
  const components = componentTree.filteredComponents.value
  if (!Array.isArray(components)) {
    console.warn('❌ [WidgetLibrary] filteredComponents not an array:', components)
    return []
  }

  // 🔥 debug：Print received component data
  console.log('🔥 [WidgetLibrary] Receive component:', components.length, 'indivual')
  console.log('🔥 [WidgetLibrary] Classification statistics:', components.reduce((acc, c) => {
    const mainCat = c?.mainCategory || 'unknown'
    acc[mainCat] = (acc[mainCat] || 0) + 1
    return acc
  }, {} as Record<string, number>))
  
  // 🔥 Detailed debugging：Print classification information for digital indicators
  const digitIndicator = components.find(c => c.type === 'digit-indicator')
  console.log('🔥 [WidgetLibrary] Digital indicator classification information:', {
    type: digitIndicator?.type,
    mainCategory: digitIndicator?.mainCategory,
    subCategory: digitIndicator?.subCategory,
    category: digitIndicator?.category
  })

  const widgets = components.map(component => {
    // auto-registry.ts Pass translation key，UIlayer responsible for translation
    const widget = {
      type: component.type,
      name: component.name || component.type, // auto-registry.tsTranslation key passed
      description: component.description || '',
      icon: component.icon,
      source: 'card2' as const,
      definition: {
        mainCategory: component.mainCategory || 'categories.chart', // Default translation key
        subCategory: component.subCategory     // Use actual subcategories，No default value set
      }
    }

    return widget
  })

  return widgets
})


// Dev Panel brief data summary（Development display only）
const DEV = import.meta.env.DEV
const debugDump = computed(() => {
  if (!DEV || !isInitialized.value) return ''
  const tree = componentTree.componentTree.value
  const filtered = componentTree.filteredComponents.value || []
  const sample = Array.isArray(filtered)
    ? filtered.slice(0, 5).map(c => ({
        type: c?.type,
        name: c?.name,
        mainCategory: c?.mainCategory,
        subCategory: c?.subCategory,
        category: c?.category
      }))
    : []
  const categories = Array.isArray(tree?.categories) ? tree.categories.map((c: any) => c?.name) : []
  return JSON.stringify(
    {
      totalCount: tree?.totalCount,
      categories,
      componentsSample: sample
    },
    null,
    2
  )
})


interface SubCategory {
  name: string
  children: WidgetDefinition[]
}

interface TopCategory {
  name: string
  subCategories: SubCategory[]
}

// Generate a two-level classification tree：top level（system/chart）、chart下再分子类
const simplifiedWidgetTree = computed(() => {
  // main → sub → widgets
  const map: Record<string, Record<string, WidgetDefinition[]>> = {}

  allWidgets.value.forEach(widget => {
    const main = widget.definition?.mainCategory
    if (!main) return
    // Use actual subcategories，No default value set
    const sub = widget.definition?.subCategory

    if (!sub) return // If there is no subcategory，skip this component

    if (!map[main]) map[main] = {}
    if (!map[main][sub]) map[main][sub] = []
    map[main][sub].push(widget)
  })


  // usecomponentTreeSorted category order in
  const orderedCategories = componentTree.componentTree.value?.categories || []
  const categoryOrder = orderedCategories.map(cat => cat.name)


  // according tocomponentTreeClassification order construction results in
  const result: TopCategory[] = []

  // First add in sorted category order
  categoryOrder.forEach(categoryName => {
    if (map[categoryName]) {
      result.push({
        name: categoryName,
        subCategories: Object.entries(map[categoryName])
          .map(([subName, list]) => ({ name: subName, children: list }))
          // Subcategories sorted alphabetically
          .sort((a, b) => a.name.localeCompare(b.name))
      })
    }
  })

  // and then add anycategoryOrderClassification in（as backup）
  Object.keys(map).forEach(categoryName => {
    if (!categoryOrder.includes(categoryName)) {
      result.push({
        name: categoryName,
        subCategories: Object.entries(map[categoryName])
          .map(([subName, list]) => ({ name: subName, children: list }))
          .sort((a, b) => a.name.localeCompare(b.name))
      })
    }
  })


  // 🔥 repair：Keep empty categories，Facilitate debugging and ensure system classification display
  return result.map(top => ({
    name: top.name,
    subCategories: top.subCategories // Temporarily remove empty category filtering
  }))
})


const filteredWidgetTree = computed(() => {
  let result = !searchTerm.value
    ? simplifiedWidgetTree.value
    : (() => {
        const lowerCaseSearch = searchTerm.value.toLowerCase()
        const filteredTopCategories: TopCategory[] = []

        simplifiedWidgetTree.value.forEach(topCategory => {
          const filteredSubCategories: SubCategory[] = []
          topCategory.subCategories.forEach(subCategory => {
            const filteredChildren = subCategory.children.filter(
              widget =>
                widget.name.toLowerCase().includes(lowerCaseSearch) ||
                widget.type.toLowerCase().includes(lowerCaseSearch)
            )
            if (filteredChildren.length > 0) {
              filteredSubCategories.push({ name: subCategory.name, children: filteredChildren })
            }
          })


          // 🔥 repair：always include categories，Even if there is no matching component（Convenient to display empty category status）
          filteredTopCategories.push({ name: topCategory.name, subCategories: filteredSubCategories })
        })

        return filteredTopCategories
      })()

  // 🔥 according to mode Filter top categories
  if (props.mode === 'template') {
    // Template mode：Show only chart categories（categories.chart）
    result = result.filter(topCategory => topCategory.name === 'categories.chart')
  }

  return result
})



// --- Event Handlers ---
const handleAddWidget = (widget: any) => {
  if (!widget.type) {
    return
  }

  const payload = { type: widget.type, source: widget.source || 'legacy' }
  emit('add-widget', payload)
}

// 🔥 Load the device list when the component is mounted（Kanban mode only）
onMounted(() => {
  if (props.mode === 'dashboard') {
    loadDeviceOptions()
  }
})
</script>

<style scoped>
.widget-library {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--n-body-color);
}

.search-bar {
  padding: 8px 12px;
  border-bottom: 1px solid var(--n-border-color);
}

.widget-tabs {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

:deep(.n-tabs-pane) {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0;
}

.tab-content {
  padding: 12px;
}

.loading-state,
.error-state {
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.loading-text {
  margin-top: 8px;
  color: var(--n-text-color-3);
}

.error-text {
  margin-top: 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--n-text-color-1);
}

.error-detail {
  margin-top: 8px;
  color: var(--n-text-color-3);
  font-size: 12px;
  max-width: 300px;
  word-break: break-word;
}

.widget-subcategory {
  margin-bottom: 16px;
}

.subcategory-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--n-text-color-1);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--n-border-color);
  position: relative;
}

.subcategory-title::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 30px;
  height: 2px;
  background: var(--n-primary-color);
  border-radius: 1px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.widget-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 12px 8px;
  border: 2px solid var(--n-border-color);
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease-in-out;
  background-color: var(--n-card-color);
  height: 90px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.widget-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--n-primary-color), var(--n-primary-color-hover));
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.widget-card:hover {
  border-color: var(--n-primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.widget-card:hover::before {
  opacity: 1;
}

.widget-card:active {
  cursor: grabbing;
  transform: scale(0.98);
}

/* Ensure that drag events are not blocked by child elements */
.widget-card * {
  pointer-events: none;
}

.widget-icon {
  margin-bottom: 8px;
  color: var(--n-primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.widget-name {
  font-size: 11px;
  font-weight: 500;
  color: var(--n-text-color-2);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  max-width: 100%;
}

.svg-icon-inline {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.svg-icon-inline svg {
  width: 20px;
  height: 20px;
}

/* Dev Debug panel style */
.debug-dump {
  padding: 8px 12px;
  border-top: 1px dashed var(--n-border-color);
}
.debug-pre {
  margin: 8px 0 0;
  background: var(--n-code-color);
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  padding: 8px;
  font-size: 12px;
  max-height: 320px;
  overflow: auto;
}

/* Empty category status style */
.empty-category,
.empty-subcategory {
  padding: 20px;
  text-align: center;
  color: var(--n-text-color-3);
}

.empty-subcategory {
  padding: 10px;
  margin: 10px 0;
  background-color: var(--n-card-color);
  border-radius: 6px;
  border: 1px dashed var(--n-border-color);
}
</style>
