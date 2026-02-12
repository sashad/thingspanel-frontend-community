<template>
  <div class="category-test">
    <h1>Classification system testing</h1>
    <n-button @click="testComponentTree">test getComponentTree()</n-button>
    
    <div v-if="componentTree">
      <h2>Classification statistics results</h2>
      <n-data-table :columns="columns" :data="categoryStats" />
      
      <h2>Detailed component list</h2>
      <n-data-table :columns="detailColumns" :data="componentDetails" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NDataTable } from 'naive-ui'
import { getComponentTree } from '@/card2.1/index'

const componentTree = ref<any>(null)
const categoryStats = ref<any[]>([])
const componentDetails = ref<any[]>([])

const columns = [
  { title: 'Classification', key: 'category' },
  { title: 'Number of components', key: 'count' }
]

const detailColumns = [
  { title: 'Component name', key: 'name' },
  { title: 'Main category', key: 'mainCategory' },
  { title: 'subcategory', key: 'subCategory' },
  { title: 'full path', key: 'path' }
]

const testComponentTree = async () => {
  try {
    componentTree.value = getComponentTree()
    
    // Statistical classification
    const stats: Record<string, number> = {}
    const details: any[] = []
    
    // Traverse correctly components array
    componentTree.value.components.forEach((component: any) => {
      const category = `${component.mainCategory}/${component.subCategory}`
      stats[category] = (stats[category] || 0) + 1
      
      details.push({
        name: component.name,
        mainCategory: component.mainCategory,
        subCategory: component.subCategory,
        type: component.type
      })
    })
    
    categoryStats.value = Object.entries(stats).map(([category, count]) => ({
      category,
      count
    }))
    
    componentDetails.value = details
    
    console.log('Classification system test results:', componentTree.value)
  } catch (error) {
    console.error('test failed:', error)
  }
}
</script>

<style scoped>
.category-test {
  padding: 20px;
}
</style>