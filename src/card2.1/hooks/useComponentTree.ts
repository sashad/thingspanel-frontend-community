/**
 * Card 2.1 Component tree structure Hook
 * Provide component classification、Filtering and tree structure generation functions
 */

import { ref, computed, onMounted, onUnmounted, shallowRef, readonly } from 'vue'

import {
  initializeCard2System,
  getComponentTree,
  getComponentsByCategory as getComponentsByCategoryFromIndex
} from '@/card2.1/index'
import type { ComponentDefinition } from '@/card2.1/types'
import type { ComponentTree, ComponentCategory } from '@/card2.1/core2/registry'
import { permissionWatcher } from '@/card2.1/core2/utils'

// 🔥 Global shared state，Ensure multiple instances are in sync
let globalComponentTree = shallowRef<ComponentTree>({ categories: [], components: [], totalCount: 0 })
let globalIsLoading = ref(false)
let globalError = ref<string | null>(null)
let globalInitialized = false

export interface ComponentTreeOptions {
  autoInit?: boolean
  filter?: (component: ComponentDefinition) => boolean
  sortBy?: 'name' | 'type' | 'category'
  sortOrder?: 'asc' | 'desc'
}

export interface FilteredComponentTree extends ComponentTree {
  filteredComponents: ComponentDefinition[]
  appliedFilters: {
    search?: string
    mainCategory?: string
    subCategory?: string
  }
}

export function useComponentTree(options: ComponentTreeOptions = {}) {
  const { autoInit = true, filter, sortBy = 'name', sortOrder = 'asc' } = options

  // 🔥 repair：Use global shared state，Ensure multiple instances are in sync
  const isLoading = globalIsLoading
  const error = globalError
  const componentTree = globalComponentTree

  // filter status
  const searchQuery = ref('')
  const selectedMainCategory = ref<string>('')
  const selectedSubCategory = ref<string>('')

  /**
   * Initialize component tree
   */
  const initialize = async () => {
    // 🔥 repair：Avoid repeated initialization
    if (globalInitialized && componentTree.value.totalCount > 0) {
      return
    }

    if (isLoading.value) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      await initializeCard2System()

      const tree = await getComponentTree()

      // 🔥 debug：Print the obtained component tree data
      console.group('🔥 [useComponentTree] Obtained component tree data')
      console.log('component tree:', tree)
      console.log('Number of categories:', tree.categories?.length)
      console.log('Number of components:', tree.components?.length)
      console.log('Classification details:', tree.categories?.map(cat => ({
        name: cat.name,
        children: cat.children?.length || 0
      })))
      console.log('Component classification statistics:', tree.components?.reduce((acc, comp) => {
        const mainCat = comp.mainCategory || 'unknown'
        acc[mainCat] = (acc[mainCat] || 0) + 1
        return acc
      }, {} as Record<string, number>))
      console.groupEnd()

      componentTree.value = tree

      // 🔥 repair：Force triggering of responsive updates
      componentTree.value = { ...tree }

      // 🔥 repair：Mark global initialization complete
      globalInitialized = true

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Initialization failed'
      console.error('❌ [useComponentTree] Initialization failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Filter components
   */
  const filteredComponents = computed(() => {
    let components = componentTree.value.components

    // Apply custom filters
    if (filter) {
      components = components.filter(filter)
    }

    // Apply search filters
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      components = components.filter(
        comp =>
          (comp.name || '').toLowerCase().includes(query) ||
          (comp.description || '').toLowerCase().includes(query) ||
          (comp.type || '').toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (selectedMainCategory.value) {
      components = components.filter(comp => comp.mainCategory === selectedMainCategory.value)
    }

    if (selectedSubCategory.value) {
      components = components.filter(comp => comp.subCategory === selectedSubCategory.value)
    }

    // sort
    components.sort((a, b) => {
      let aValue: string
      let bValue: string

      switch (sortBy) {
        case 'name':
          aValue = a.name || ''
          bValue = b.name || ''
          break
        case 'type':
          aValue = a.type || ''
          bValue = b.type || ''
          break
        case 'category':
          aValue = a.mainCategory || ''
          bValue = b.mainCategory || ''
          break
        default:
          aValue = a.name || ''
          bValue = b.name || ''
      }

      // Make sure the value is notundefined，preventlocaleCompareReport an error
      const safeAValue = String(aValue || '')
      const safeBValue = String(bValue || '')

      const comparison = safeAValue.localeCompare(safeBValue)
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return components
  })

  /**
   * Get the filtered component tree
   */
  const getFilteredTree = computed((): FilteredComponentTree => {
    return {
      ...componentTree.value,
      filteredComponents: filteredComponents.value,
      appliedFilters: {
        search: searchQuery.value || undefined,
        mainCategory: selectedMainCategory.value || undefined,
        subCategory: selectedSubCategory.value || undefined
      }
    }
  })

  /**
   * Get components by category
   */
  const getComponentsByCategory = async (mainCategory?: string, subCategory?: string) => {
    return await getComponentsByCategoryFromIndex(mainCategory, subCategory)
  }

  /**
   * Get all categories
   */
  const categories = computed(() => {
    // if not initialized，Return empty array
    if (!globalInitialized) return []
    try {
      // Get classification information from loaded component tree，Avoid asynchronous calls
      return componentTree.value.categories?.map(cat => cat.name) || []
    } catch {
      return []
    }
  })

  /**
   * Get available main categories
   */
  const availableMainCategories = computed(() => {
    const categories = new Set<string>()
    componentTree.value.components.forEach(comp => {
      if (comp.mainCategory) {
        categories.add(comp.mainCategory)
      }
    })
    return Array.from(categories).sort()
  })

  /**
   * Get available subcategories
   */
  const availableSubCategories = computed(() => {
    const categories = new Set<string>()
    componentTree.value.components.forEach(comp => {
      if (comp.subCategory && (!selectedMainCategory.value || comp.mainCategory === selectedMainCategory.value)) {
        categories.add(comp.subCategory)
      }
    })
    return Array.from(categories).sort()
  })

  /**
   * Clear filters
   */
  const clearFilters = () => {
    searchQuery.value = ''
    selectedMainCategory.value = ''
    selectedSubCategory.value = ''
  }

  /**
   * Reset to initial state
   */
  const reset = () => {
    clearFilters()
    componentTree.value = { categories: [], components: [], totalCount: 0 }
    error.value = null
  }

  /**
   * 🔥 critical fix：Get a component instance of a specified type
   * Card2Wrapper This method is needed to load the actual Vue components
   */
  const getComponent = async (componentType: string) => {
    // 🔥 Fix infinite loop：Remove forced reinitialization，avoid withCard2WrapperLoop call
    if (filteredComponents.value.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ [useComponentTree] No components available，Wait for system initialization to complete`)
      }
      return null
    }

    // Find from registered components
    const componentDefinition = filteredComponents.value.find(comp => comp.type === componentType)

    if (!componentDefinition) {
      console.error(`❌ [useComponentTree] Component type not found: ${componentType}`)
      return null
    }

    // Return component instance
    return componentDefinition.component
  }

  // Permission change monitoring
  let unsubscribePermissionWatcher: (() => void) | null = null

  // automatic initialization
  if (autoInit) {
    onMounted(() => {
      initialize()

      // Monitor permission changes
      unsubscribePermissionWatcher = permissionWatcher.onPermissionChange((newAuthority, oldAuthority) => {
        globalInitialized = false
        initialize()
      })
    })

    onUnmounted(() => {
      // Cancel permission monitoring
      if (unsubscribePermissionWatcher) {
        unsubscribePermissionWatcher()
      }
    })
  }

  return {
    // state
    isLoading: readonly(isLoading),
    error: readonly(error),
    componentTree: readonly(componentTree),

    // filter status
    searchQuery,
    selectedMainCategory,
    selectedSubCategory,

    // Computed properties
    filteredComponents,
    getFilteredTree,
    categories,
    availableMainCategories,
    availableSubCategories,

    // method
    initialize,
    getComponent,
    getComponentsByCategory,
    clearFilters,
    reset
  }
}
