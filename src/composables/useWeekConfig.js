import { ref, computed } from 'vue'
import { getCustomWeekRange, getMonthWeeks, fetchWeekConfiguration } from '@/js/dateUtils.js'

export function useWeekConfig() {
  const currentWeekConfig = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Get week range for a specific date using custom configuration
  const getWeekRange = async (date) => {
    try {
      loading.value = true
      error.value = null
      const weekRange = await getCustomWeekRange(date)
      return weekRange
    } catch (err) {
      error.value = err.message
      console.error('Error getting week range:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Get all weeks for a month
  const getWeeksForMonth = async (year, month) => {
    try {
      loading.value = true
      error.value = null
      const weeks = await getMonthWeeks(year, month)
      return weeks
    } catch (err) {
      error.value = err.message
      console.error('Error getting month weeks:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Get week configuration for a month
  const getWeekConfiguration = async (year, month) => {
    try {
      loading.value = true
      error.value = null
      const config = await fetchWeekConfiguration(year, month)
      currentWeekConfig.value = config
      return config
    } catch (err) {
      error.value = err.message
      console.error('Error getting week configuration:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Check if a date falls within a specific week
  const isDateInWeek = (date, weekStart, weekEnd) => {
    const dateObj = new Date(date)
    const start = new Date(weekStart)
    const end = new Date(weekEnd)
    
    return dateObj >= start && dateObj <= end
  }

  // Get week number for a date within the current month's configuration
  const getWeekNumberForDate = async (date, year, month) => {
    const weeks = await getWeeksForMonth(year, month)
    const dateObj = new Date(date)
    
    for (const week of weeks) {
      if (isDateInWeek(date, week.start, week.end)) {
        return week.weekNumber
      }
    }
    
    return null
  }

  // Group data by custom weeks
  const groupDataByCustomWeeks = async (data, dateField, year, month) => {
    const weeks = await getWeeksForMonth(year, month)
    const groupedData = {}
    
    // Initialize week groups
    weeks.forEach(week => {
      groupedData[week.weekNumber] = {
        weekNumber: week.weekNumber,
        start: week.start,
        end: week.end,
        isActive: week.isActive,
        isCustom: week.isCustom,
        data: []
      }
    })
    
    // Group data by week
    data.forEach(item => {
      const itemDate = new Date(item[dateField])
      
      for (const week of weeks) {
        if (isDateInWeek(itemDate, week.start, week.end)) {
          groupedData[week.weekNumber].data.push(item)
          break
        }
      }
    })
    
    return Object.values(groupedData).filter(week => week.data.length > 0)
  }

  // Computed properties
  const hasCustomWeeks = computed(() => {
    return currentWeekConfig.value && !currentWeekConfig.value.isDefault
  })

  const isConfigLoading = computed(() => loading.value)

  const configError = computed(() => error.value)

  return {
    // State
    currentWeekConfig,
    loading: isConfigLoading,
    error: configError,
    hasCustomWeeks,
    
    // Methods
    getWeekRange,
    getWeeksForMonth,
    getWeekConfiguration,
    isDateInWeek,
    getWeekNumberForDate,
    groupDataByCustomWeeks
  }
}
