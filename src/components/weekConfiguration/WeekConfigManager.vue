<template>
  <v-card class="week-config-manager">
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Week Configuration Manager</span>
      <v-btn 
        color="primary" 
        @click="openCreateDialog"
        prepend-icon="mdi-plus"
      >
        Add Configuration
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Year/Month Selector -->
      <v-row class="mb-4">
        <v-col cols="6">
          <v-select
            v-model="selectedYear"
            :items="availableYears"
            label="Year"
            @update:model-value="loadConfigurations"
          />
        </v-col>
        <v-col cols="6">
          <v-select
            v-model="selectedMonth"
            :items="monthOptions"
            label="Month"
            @update:model-value="loadConfigurations"
          />
        </v-col>
      </v-row>

      <!-- Current Configuration Display -->
      <div v-if="currentConfig" class="current-config">
        <h3>{{ getMonthName(selectedMonth) }} {{ selectedYear }}</h3>
        
        <v-alert 
          v-if="currentConfig.isDefault" 
          type="info" 
          variant="tonal"
          class="mb-4"
        >
          Using default week configuration (Monday-Sunday)
        </v-alert>

        <v-list>
          <v-list-item
            v-for="week in currentConfig.weeks"
            :key="week.weekNumber"
            class="week-item"
          >
            <template v-slot:prepend>
              <v-icon color="primary">mdi-calendar-week</v-icon>
            </template>
            
            <v-list-item-title>
              Week {{ week.weekNumber }}
            </v-list-item-title>
            
            <v-list-item-subtitle>
              {{ formatDate(week.startDate) }} - {{ formatDate(week.endDate) }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-chip 
                :color="week.isActive ? 'success' : 'error'"
                size="small"
              >
                {{ week.isActive ? 'Active' : 'Inactive' }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>

        <v-card-actions class="mt-4">
          <v-btn 
            color="primary" 
            @click="openEditDialog"
            prepend-icon="mdi-pencil"
          >
            Edit Configuration
          </v-btn>
          <v-btn 
            color="error" 
            @click="deleteConfiguration"
            prepend-icon="mdi-delete"
            :disabled="currentConfig.isDefault"
          >
            Delete Configuration
          </v-btn>
        </v-card-actions>
      </div>

      <!-- No Configuration Message -->
      <v-alert 
        v-else-if="!loading"
        type="info"
        variant="tonal"
      >
        No custom configuration found for {{ getMonthName(selectedMonth) }} {{ selectedYear }}. 
        Using default Monday-Sunday weeks.
      </v-alert>
    </v-card-text>

    <!-- Edit/Create Dialog -->
    <WeekConfigDialog
      v-model="showDialog"
      :year="selectedYear"
      :month="selectedMonth"
      :existing-config="currentConfig"
      @saved="onConfigurationSaved"
    />
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import urls from '@/js/config.js'
import WeekConfigDialog from './WeekConfigDialog.vue'

const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const currentConfig = ref(null)
const loading = ref(false)
const showDialog = ref(false)

const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
})

const monthOptions = [
  { title: 'January', value: 1 },
  { title: 'February', value: 2 },
  { title: 'March', value: 3 },
  { title: 'April', value: 4 },
  { title: 'May', value: 5 },
  { title: 'June', value: 6 },
  { title: 'July', value: 7 },
  { title: 'August', value: 8 },
  { title: 'September', value: 9 },
  { title: 'October', value: 10 },
  { title: 'November', value: 11 },
  { title: 'December', value: 12 }
]

const loadConfigurations = async () => {
  if (!selectedYear.value || !selectedMonth.value) return
  
  loading.value = true
  try {
    const response = await axios.get(
      `${urls.backEndURL}/week-config/${selectedYear.value}/${selectedMonth.value}`,
      { withCredentials: true }
    )
    currentConfig.value = response.data
  } catch (error) {
    console.error('Error loading week configuration:', error)
    currentConfig.value = null
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  showDialog.value = true
}

const openEditDialog = () => {
  showDialog.value = true
}

const deleteConfiguration = async () => {
  if (!currentConfig.value || currentConfig.value.isDefault) return
  
  if (confirm('Are you sure you want to delete this week configuration?')) {
    try {
      await axios.delete(
        `${urls.backEndURL}/week-config/${selectedYear.value}/${selectedMonth.value}`,
        { withCredentials: true }
      )
      await loadConfigurations()
    } catch (error) {
      console.error('Error deleting week configuration:', error)
    }
  }
}

const onConfigurationSaved = () => {
  loadConfigurations()
}

const getMonthName = (monthNumber) => {
  return monthOptions.find(m => m.value === monthNumber)?.title || ''
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

onMounted(() => {
  loadConfigurations()
})
</script>

<style scoped>
.week-config-manager {
  max-width: 800px;
  margin: 0 auto;
}

.week-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
}

.current-config {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
}
</style>
