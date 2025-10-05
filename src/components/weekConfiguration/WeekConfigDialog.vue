<template>
  <v-dialog v-model="dialog" max-width="900px" persistent>
    <v-card>
      <v-card-title>
        {{ isEditing ? 'Edit' : 'Create' }} Week Configuration
        <span class="text-h6 ml-2">{{ getMonthName(month) }} {{ year }}</span>
      </v-card-title>

      <v-card-text>
        <v-alert 
          type="info" 
          variant="tonal" 
          class="mb-4"
        >
          Define custom week start and end dates for {{ getMonthName(month) }} {{ year }}. 
          Weeks can span across months for flexible business reporting periods.
          Weeks must not overlap and must be numbered sequentially.
        </v-alert>

        <div v-for="(week, index) in weeks" :key="index" class="week-config-item mb-4">
          <v-card variant="outlined">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Week {{ week.weekNumber }}</span>
              <v-btn 
                v-if="weeks.length > 1"
                icon="mdi-delete" 
                color="error" 
                size="small"
                @click="removeWeek(index)"
              />
            </v-card-title>
            
            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <v-text-field
                    v-model="week.startDate"
                    label="Start Date"
                    type="date"
                    :rules="[validateDate]"
                    @update:model-value="updateWeekDates(index)"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="week.endDate"
                    label="End Date"
                    type="date"
                    :rules="[validateDate]"
                    @update:model-value="updateWeekDates(index)"
                  />
                </v-col>
              </v-row>
              
              <v-row>
                <v-col cols="12">
                  <v-textarea
                    v-model="week.notes"
                    label="Notes (optional)"
                    rows="2"
                    placeholder="Add any notes about this week..."
                  />
                </v-col>
              </v-row>
              
              <v-row>
                <v-col cols="12">
                  <v-switch
                    v-model="week.isActive"
                    label="Active"
                    color="success"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </div>

        <v-btn 
          color="primary" 
          @click="addWeek"
          prepend-icon="mdi-plus"
          class="mb-4"
        >
          Add Week
        </v-btn>

        <!-- Validation Errors -->
        <v-alert 
          v-if="validationErrors.length > 0"
          type="error"
          variant="tonal"
          class="mt-4"
        >
          <div v-for="error in validationErrors" :key="error">
            {{ error }}
          </div>
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="closeDialog">Cancel</v-btn>
        <v-btn 
          color="primary" 
          @click="saveConfiguration"
          :disabled="!isValid"
          :loading="saving"
        >
          {{ isEditing ? 'Update' : 'Create' }} Configuration
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import urls from '@/js/config.js'

const props = defineProps({
  modelValue: Boolean,
  year: Number,
  month: Number,
  existingConfig: Object
})

const emit = defineEmits(['update:modelValue', 'saved'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const weeks = ref([])
const saving = ref(false)
const validationErrors = ref([])

const isEditing = computed(() => !!props.existingConfig && !props.existingConfig.isDefault)

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

const getMonthName = (monthNumber) => {
  return monthOptions.find(m => m.value === monthNumber)?.title || ''
}

const initializeWeeks = () => {
  if (props.existingConfig && !props.existingConfig.isDefault) {
    // Load existing configuration
    weeks.value = props.existingConfig.weeks.map(week => ({
      weekNumber: week.weekNumber,
      startDate: formatDateForInput(week.startDate),
      endDate: formatDateForInput(week.endDate),
      isActive: week.isActive,
      notes: week.notes || ''
    }))
  } else {
    // Generate default weeks for the month
    generateDefaultWeeks()
  }
}

const generateDefaultWeeks = () => {
  const year = props.year
  const month = props.month
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)
  
  weeks.value = []
  let currentDate = new Date(monthStart)
  let weekNumber = 1
  
  while (currentDate <= monthEnd) {
    // Find Monday of current week
    const dayOfWeek = currentDate.getDay()
    const monday = new Date(currentDate)
    monday.setDate(currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
    
    // Find Sunday of current week
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    // Adjust to month boundaries
    const weekStart = monday < monthStart ? monthStart : monday
    const weekEnd = sunday > monthEnd ? monthEnd : sunday
    
    weeks.value.push({
      weekNumber,
      startDate: formatDateForInput(weekStart),
      endDate: formatDateForInput(weekEnd),
      isActive: true,
      notes: ''
    })
    
    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7)
    weekNumber++
  }
}

const formatDateForInput = (date) => {
  if (typeof date === 'string') {
    return date.split('T')[0]
  }
  return date.toISOString().split('T')[0]
}

const addWeek = () => {
  const newWeekNumber = weeks.value.length + 1
  weeks.value.push({
    weekNumber: newWeekNumber,
    startDate: '',
    endDate: '',
    isActive: true,
    notes: ''
  })
}

const removeWeek = (index) => {
  weeks.value.splice(index, 1)
  // Renumber weeks
  weeks.value.forEach((week, idx) => {
    week.weekNumber = idx + 1
  })
}

const updateWeekDates = (index) => {
  // Auto-calculate end date if start date is set and end date is empty
  const week = weeks.value[index]
  if (week.startDate && !week.endDate) {
    const startDate = new Date(week.startDate)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    week.endDate = formatDateForInput(endDate)
  }
}

const validateDate = (value) => {
  if (!value) return 'Date is required'
  const date = new Date(value)
  if (isNaN(date.getTime())) return 'Invalid date'
  return true
}

const validateWeeks = () => {
  const errors = []
  
  if (weeks.value.length === 0) {
    errors.push('At least one week must be defined')
    return errors
  }
  
  // Check for empty dates
  weeks.value.forEach((week, index) => {
    if (!week.startDate || !week.endDate) {
      errors.push(`Week ${week.weekNumber}: Both start and end dates are required`)
    }
    
    // Check that start date is before end date
    if (week.startDate && week.endDate && new Date(week.startDate) >= new Date(week.endDate)) {
      errors.push(`Week ${week.weekNumber}: Start date must be before end date`)
    }
  })
  
  // Check for overlaps
  const sortedWeeks = [...weeks.value].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  for (let i = 0; i < sortedWeeks.length - 1; i++) {
    const currentEnd = new Date(sortedWeeks[i].endDate)
    const nextStart = new Date(sortedWeeks[i + 1].startDate)
    
    if (currentEnd >= nextStart) {
      errors.push(`Week ${sortedWeeks[i].weekNumber} and Week ${sortedWeeks[i + 1].weekNumber} overlap`)
    }
  }
  
  // Check week numbers are sequential
  for (let i = 0; i < weeks.value.length; i++) {
    if (weeks.value[i].weekNumber !== i + 1) {
      errors.push(`Week numbers must be sequential starting from 1`)
      break
    }
  }
  
  // NO month boundary restrictions - weeks can span across months
  // This allows for flexible business periods like:
  // - Bi-weekly pay periods that cross months
  // - Quarterly reporting periods
  // - Custom business cycles
  
  return errors
}

const isValid = computed(() => {
  validationErrors.value = validateWeeks()
  return validationErrors.value.length === 0
})

const saveConfiguration = async () => {
  if (!isValid.value) return
  
  saving.value = true
  try {
    const configData = {
      year: props.year,
      month: props.month,
      weeks: weeks.value.map(week => ({
        weekNumber: week.weekNumber,
        startDate: new Date(week.startDate),
        endDate: new Date(week.endDate),
        isActive: week.isActive,
        notes: week.notes
      })),
      isDefault: false
    }
    
    await axios.post(
      `${urls.backEndURL}/week-config`,
      configData,
      { withCredentials: true }
    )
    
    emit('saved')
    closeDialog()
  } catch (error) {
    console.error('Error saving week configuration:', error)
    validationErrors.value = ['Failed to save configuration. Please try again.']
  } finally {
    saving.value = false
  }
}

const closeDialog = () => {
  dialog.value = false
  weeks.value = []
  validationErrors.value = []
}

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    initializeWeeks()
  }
})

onMounted(() => {
  if (props.modelValue) {
    initializeWeeks()
  }
})
</script>

<style scoped>
.week-config-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
</style>
