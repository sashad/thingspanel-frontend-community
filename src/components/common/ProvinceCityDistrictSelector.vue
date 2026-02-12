<template>
  <div class="province-city-district-selector">
    <!-- Province selection -->
    <n-select
      v-model:value="selectedProvince"
      :options="provinceOptions"
      placeholder="Please select a province"
      clearable
      filterable
      class="selector-item"
      @update:value="handleProvinceChange"
    />
    
    <!-- City selection -->
    <n-select
      v-model:value="selectedCity"
      :options="cityOptions"
      :placeholder="isMunicipality ? 'Please select a district or county' : 'Please select a city'"
      clearable
      filterable
      :disabled="!selectedProvince"
      class="selector-item"
      @update:value="handleCityChange"
    />
    
    <!-- District and county selection - Hide when municipality -->
    <n-select
      v-if="!isMunicipality"
      v-model:value="selectedDistrict"
      :options="districtOptions"
      placeholder="Please select a district or county"
      clearable
      filterable
      :disabled="!selectedCity"
      class="selector-item"
      @update:value="handleDistrictChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NSelect } from 'naive-ui'
import pwData from '@/views/management/user/components/pw.json'

// Define components props
interface Props {
  // The currently selected province and city value
  province?: string
  city?: string
  district?: string
}

// Define components emits
interface Emits {
  // Fires when selection changes
  change: [value: { province: string; city: string; district: string }]
}

const props = withDefaults(defineProps<Props>(), {
  province: '',
  city: '',
  district: ''
})

const emit = defineEmits<Emits>()

// currently selected value
const selectedProvince = ref<string>('')
const selectedCity = ref<string>('')
const selectedDistrict = ref<string>('')

// Province options
const provinceOptions = computed(() => {
  return pwData.map(province => ({
    label: province.name,
    value: province.name
  }))
})

// city ​​options
const cityOptions = computed(() => {
  if (!selectedProvince.value) return []
  
  const province = pwData.find(p => p.name === selectedProvince.value)
  if (!province || !province.children) return []
  
  if (isMunicipality.value) {
    // municipality：jump over"Municipal district"Hierarchy，Return directly to district and county as city option
    const cityDistricts = province.children.find(city => city.name === 'Municipal district')
    if (cityDistricts && cityDistricts.children) {
      return cityDistricts.children.map(district => ({
        label: district.name,
        value: district.name
      }))
    }
  }
  
  // Ordinary province：Return to normal city list
  return province.children.map(city => ({
    label: city.name,
    value: city.name
  }))
})

// Determine whether it is a municipality
const isMunicipality = computed(() => {
  const municipalities = ['Beijing', 'Tianjin City', 'Shanghai', 'Chongqing City']
  return municipalities.includes(selectedProvince.value)
})

// District and county options
const districtOptions = computed(() => {
  if (!selectedProvince.value || !selectedCity.value) return []
  
  const province = pwData.find(p => p.name === selectedProvince.value)
  if (!province || !province.children) return []
  
  // Municipalities do not display district and county selectors
  if (isMunicipality.value) {
    return []
  }
  
  // Ordinary province：Find the districts and counties corresponding to the city
  const city = province.children.find(c => c.name === selectedCity.value)
  if (!city || !city.children) return []
  
  return city.children.map(district => ({
    label: district.name,
    value: district.name
  }))
})

// Handling province changes
const handleProvinceChange = (value: string | null) => {
  selectedProvince.value = value || ''
  selectedCity.value = ''
  selectedDistrict.value = ''
  emitChange()
}

// Dealing with urban change
const handleCityChange = (value: string | null) => {
  selectedCity.value = value || ''
  selectedDistrict.value = ''
  emitChange()
}

// Handling district and county changes
const handleDistrictChange = (value: string | null) => {
  selectedDistrict.value = value || ''
  emitChange()
}

// Trigger change event
const emitChange = () => {
  let province = selectedProvince.value
  let city = selectedCity.value
  let district = selectedDistrict.value
  
  if (isMunicipality.value) {
    // municipality：Cities are provinces，Districts and counties are the ones who choose"City"
    city = selectedProvince.value
    district = selectedCity.value
  }
  
  emit('change', {
    province,
    city,
    district
  })
}

// monitor props change，used to echo
watch(
  () => [props.province, props.city, props.district],
  ([newProvince, newCity, newDistrict]) => {
    selectedProvince.value = newProvince || ''
    
    // Processing the echo logic of municipalities
    const municipalities = ['Beijing', 'Tianjin City', 'Shanghai', 'Chongqing City']
    const isCurrentMunicipality = municipalities.includes(newProvince || '')
    
    if (isCurrentMunicipality) {
      // municipality：The city selector shows districts and counties
      selectedCity.value = newDistrict || ''
      selectedDistrict.value = ''
    } else {
      // Ordinary province：Normal display
      selectedCity.value = newCity || ''
      selectedDistrict.value = newDistrict || ''
    }
  },
  { immediate: true }
)

// Initialized when component is mounted
onMounted(() => {
  // If there is an initial value，Trigger a change event
  if (props.province || props.city || props.district) {
    emitChange()
  }
})

</script>

<style scoped>
.province-city-district-selector {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  /* Make the address selector occupy the entire line */
}

.selector-item {
  min-width: 150px;
  flex: 1;
  max-width: 200px;
  /* Limit maximum width，Keep proportions reasonable */
}

/* Responsive layout */
@media (max-width: 768px) {
  .province-city-district-selector {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .selector-item {
    min-width: unset;
    max-width: unset;
  }
}

/* Tablet layout */
@media (max-width: 1024px) and (min-width: 769px) {
  .selector-item {
    max-width: 180px;
  }
}
</style>