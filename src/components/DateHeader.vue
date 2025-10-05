<template>
  <v-card elevation="1" class="mb-4">
    <div class="d-flex align-center justify-center pa-4">
      <v-btn icon flat class="pa-0 ma-0" @click="$emit('prev')">
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
      <div class="text-h6 font-weight-medium mx-3">{{ displayLabel }}</div>
      <v-btn icon flat @click="$emit('next')">
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentDateRange: {
    type: Array,
    required: true,
  },
  monthWeeks: {
    type: Array,
    required: false,
    default: () => ([])
  },
  showMonthOnly: {
    type: Boolean,
    required: false,
    default: false
  }
})

const displayLabel = computed(() => {
  // Explicit month-year only display
  if (props.showMonthOnly) {
    if (Array.isArray(props.currentDateRange) && props.currentDateRange.length >= 1) {
      const d = new Date(props.currentDateRange[0])
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${month}-${year}`
    }
    return ''
  }

  if (Array.isArray(props.monthWeeks) && props.monthWeeks.length > 0) {
    const starts = props.monthWeeks.map(w => new Date(w.start))
    const ends = props.monthWeeks.map(w => new Date(w.end))
    const minStart = new Date(Math.min.apply(null, starts))
    const maxEnd = new Date(Math.max.apply(null, ends))

    const fmt = (d) => {
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()) // match previous UX: no leading zero on day
      return `${mm}-${dd}`
    }

    return `${fmt(minStart)} through ${fmt(maxEnd)}`
  }

  // Fallback to currentDateRange label MM-YYYY
  if (Array.isArray(props.currentDateRange) && props.currentDateRange.length >= 1) {
    const date = new Date(props.currentDateRange[0])
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${month}-${year}`
  }
  return ''
})
</script>

<style scoped>
</style>


