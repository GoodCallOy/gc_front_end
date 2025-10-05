<template>
  <slot />
</template>

<script setup>
import { provide, ref, onMounted } from 'vue'
import { fetchWeekConfiguration, clearWeekConfigCache } from '@/js/dateUtils.js'

// Provide week configuration context to child components
const weekConfigs = ref(new Map())
const loading = ref(false)

const getWeekConfig = async (year, month) => {
  const cacheKey = `${year}-${month}`
  
  if (weekConfigs.value.has(cacheKey)) {
    return weekConfigs.value.get(cacheKey)
  }
  
  loading.value = true
  try {
    const config = await fetchWeekConfiguration(year, month)
    weekConfigs.value.set(cacheKey, config)
    return config
  } finally {
    loading.value = false
  }
}

const refreshWeekConfig = async (year, month) => {
  const cacheKey = `${year}-${month}`
  weekConfigs.value.delete(cacheKey)
  clearWeekConfigCache()
  return await getWeekConfig(year, month)
}

const clearAllConfigs = () => {
  weekConfigs.value.clear()
  clearWeekConfigCache()
}

// Provide context to child components
provide('weekConfig', {
  getWeekConfig,
  refreshWeekConfig,
  clearAllConfigs,
  loading: loading.value
})
</script>
