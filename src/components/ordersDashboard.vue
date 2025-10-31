<template>
  <v-container  style="width: 90%;" >
    <!-- Sticky Menu/Header -->
    <div class="sticky-toolbar">
      <!-- Date Navigation Header -->
      <DateHeader 
        :currentDateRange="currentDateRange"
        :monthWeeks="monthWeeks"
        :showMonthOnly="true"
        @prev="getPreviousMonth"
        @next="getNextMonth"
      />

      <!-- Tabs -->
      <v-tabs v-model="activeTab" density="comfortable" class="mb-2">
        <v-tab value="tables">Tables</v-tab>
        <v-tab value="cards">Cards</v-tab>
      </v-tabs>
    </div>

    <!-- Revenue Summary Row -->
    <v-card class="mb-4 pa-4 revenue-summary" elevation="2">
      <v-row align="center" justify="center">
        <v-col cols="4" class="text-center">
          <div class="text-h6 font-weight-bold text-primary">Estimated Revenue</div>
          <div class="text-h5 font-weight-bold">€{{ estimatedRevenueTotal.toFixed(2) }}</div>
        </v-col>
        <v-col cols="4" class="text-center">
          <div class="text-h6 font-weight-bold text-success">Current Revenue</div>
          <div class="text-h5 font-weight-bold">€{{ currentRevenueTotal.toFixed(2) }}</div>
        </v-col>
        <v-col cols="4" class="text-center">
          <!-- Empty column for future use -->
        </v-col>
      </v-row>
    </v-card>
    
    <h1 class="text-h4 mb-4" style="width: 100%;">All Cases - {{ getFormattedDateRange() }}</h1>

    <v-window v-model="activeTab">
      <v-window-item value="tables">
        <v-card elevation="1">
          <v-data-table
            :headers="tableHeaders"
            :items="filteredOrders"
            item-value="_id"
            class="elevation-0"
            :items-per-page="25"
            density="comfortable"
          >
            <template #item.callers="{ item }">
              {{ getCallerNames(item) }}
            </template>
            <template #item.goal="{ item }">
              {{ formatCurrency(Number(item.estimatedRevenue) || 0) }}
            </template>
            <template #item.revenue="{ item }">
              {{ formatCurrency(computeOrderRevenue(item)) }}
            </template>
            <template #item.quantity="{ item }">
              {{ computeOrderQuantity(item) }}
            </template>
            <template #item.startDate="{ item }">
              {{ formatDate(item.startDate) }}
            </template>
            <template #item.deadline="{ item }">
              {{ formatDate(item.deadline) }}
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <v-window-item value="cards">
        <div class="grid-container ">
          <DashboardCard01
          v-for="(order, index) in filteredOrders"
          :key="index"
          :order="order"
          :agents="gcAgents"
          :dailyLogs="dailyLogs"
          :monthWeeks="monthWeeks"
          />
        </div>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth, getMonthWeeks } from '@/js/dateUtils';
import DashboardCard01 from '@/partials/dashboard/caseCard2.vue'
import DateHeader from '@/components/DateHeader.vue'

const store = useStore()
const activeTab = ref('tables')

const tableHeaders = ([
  { title: 'Case Name', key: 'caseName' },
  { title: 'Status', key: 'orderStatus' },
  { title: 'Callers', key: 'callers', sortable: false },
  { title: 'Price/Unit (€)', key: 'pricePerUnit' },
  { title: 'Unit', key: 'caseUnit' },
  { title: 'Quantity', key: 'quantity', sortable: false },
  { title: 'Total Qty', key: 'totalQuantity' },
  { title: 'Goal (€)', key: 'goal', sortable: false },
  { title: 'Revenue (€)', key: 'revenue', sortable: false },
  { title: 'Start', key: 'startDate' },
  { title: 'Deadline', key: 'deadline' },
])

const orders = computed(() => store.getters['orders'])
const gcAgents = computed(() => store.getters['gcAgents'])
const dailyLogs = computed(() => store.getters['dailyLogs'])
const currentDateRange = computed(() => store.getters['currentDateRange'])
// Custom weeks for current month
const monthWeeks = ref([])

// Filter orders by the selected month
const filteredOrders = computed(() => {
  if (!orders.value || !currentDateRange.value || currentDateRange.value.length < 2) {
    return orders.value || [];
  }

  const [startDate, endDate] = currentDateRange.value;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);

  return orders.value.filter(order => {
    const orderStart = new Date(order.startDate);
    const orderEnd = new Date(order.deadline);
    
    // Check if order overlaps with the selected month
    return orderStart <= monthEnd && orderEnd >= monthStart;
  });
});

// Calculate estimated revenue total from all orders for the month
const estimatedRevenueTotal = computed(() => {
  if (!filteredOrders.value || filteredOrders.value.length === 0) {
    return 0;
  }
  
  return filteredOrders.value.reduce((total, order) => {
    return total + (Number(order.estimatedRevenue) || 0);
  }, 0);
});

// Calculate current revenue from daily logs for all orders in the month using custom weeks
const currentRevenueTotal = computed(() => {
  if (!dailyLogs.value || !filteredOrders.value || !monthWeeks.value) {
    return 0;
  }

  // Get date range from custom weeks
  if (monthWeeks.value.length === 0) {
    return 0;
  }

  const starts = monthWeeks.value.map(w => new Date(w.start));
  const ends = monthWeeks.value.map(w => new Date(w.end));
  const monthStart = new Date(Math.min.apply(null, starts));
  const monthEnd = new Date(Math.max.apply(null, ends));
  monthEnd.setHours(23, 59, 59, 999);

  // Filter daily logs within the custom week date range, excluding "case good call"
  const logsInMonth = dailyLogs.value.filter(log => {
    const logDate = new Date(log.date);
    const isInDateRange = logDate >= monthStart && logDate <= monthEnd;
    const isNotCaseGoodCall = log.caseName !== 'case good call';
    return isInDateRange && isNotCaseGoodCall;
  });

  // Calculate revenue from quantity completed
  let totalRevenue = 0;
  
  logsInMonth.forEach(log => {
    const quantityCompleted = Number(log.quantityCompleted) || 0;
    
    // Find the order for this log to get price per unit
    const order = filteredOrders.value.find(o => 
      o.caseName === log.caseName || 
      String(o._id) === String(log.order?._id || log.order || log.orderId)
    );
    
    if (order) {
      const pricePerUnit = Number(order.pricePerUnit) || 0;
      totalRevenue += quantityCompleted * pricePerUnit;
    }
  });

  return totalRevenue;
});

// Debug logging for revenue calculations
watch([estimatedRevenueTotal, currentRevenueTotal, monthWeeks], ([estimated, current, weeks]) => {
  // Count logs excluding "case good call" for debugging
  const totalLogs = dailyLogs.value?.length || 0;
  const caseGoodCallLogs = dailyLogs.value?.filter(log => log.caseName === 'case good call').length || 0;
  const logsExcluded = caseGoodCallLogs;
  
  console.log('Orders Dashboard Revenue Debug:', {
    estimatedRevenue: estimated,
    currentRevenue: current,
    monthWeeksCount: weeks?.length || 0,
    filteredOrdersCount: filteredOrders.value?.length || 0,
    totalDailyLogsCount: totalLogs,
    caseGoodCallLogsExcluded: logsExcluded,
    logsUsedInCalculation: totalLogs - logsExcluded
  });
});

// Date navigation functions
const getFormattedDateRange = () => {
  // Prefer custom weeks if available: show overall month start and end from custom weeks
  if (Array.isArray(monthWeeks.value) && monthWeeks.value.length > 0) {
    const starts = monthWeeks.value.map(w => new Date(w.start))
    const ends = monthWeeks.value.map(w => new Date(w.end))
    const minStart = new Date(Math.min.apply(null, starts))
    const maxEnd = new Date(Math.max.apply(null, ends))

    const fmt = (d) => {
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()) // no leading zero per example "09-1"
      return `${mm}-${dd}`
    }

    return `${fmt(minStart)} through ${fmt(maxEnd)}`
  }

  // Fallback to existing formatted month range
  return formattedDateRange(currentDateRange.value);
}

const getIsCurrentMonth = () => {
  return isCurrentMonth(currentDateRange.value);
}

const getPreviousMonth = () => {
  const prevMonth = goToPreviousMonth(currentDateRange.value);
  updateDateRange(prevMonth);
}

const getNextMonth = () => {
  const nextMonth = goToNextMonth(currentDateRange.value);
  updateDateRange(nextMonth);
}

const updateDateRange = (newRange) => {
  store.commit('setDateRange', newRange);
}

const formatDate = date => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

const formatCurrency = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(n || 0)

function getMonthBoundsFromWeeks() {
  if (!Array.isArray(monthWeeks.value) || monthWeeks.value.length === 0) return null
  const starts = monthWeeks.value.map(w => new Date(w.start))
  const ends = monthWeeks.value.map(w => new Date(w.end))
  const monthStart = new Date(Math.min.apply(null, starts))
  const monthEnd = new Date(Math.max.apply(null, ends))
  monthEnd.setHours(23, 59, 59, 999)
  return { monthStart, monthEnd }
}

function computeOrderQuantity(order) {
  if (!order || !Array.isArray(dailyLogs.value)) return 0
  const bounds = getMonthBoundsFromWeeks()
  if (!bounds) return 0
  const { monthStart, monthEnd } = bounds

  const oid = String(order._id)
  return dailyLogs.value
    .filter(log => {
      const d = new Date(log.date)
      const idMatch = String(log.order?._id || log.order || log.orderId) === oid
      return idMatch && d >= monthStart && d <= monthEnd && typeof log.quantityCompleted === 'number'
    })
    .reduce((sum, log) => sum + Number(log.quantityCompleted || 0), 0)
}

function computeOrderRevenue(order) {
  const qty = computeOrderQuantity(order)
  const price = Number(order?.pricePerUnit) || 0
  return qty * price
}

function getCallerNames(order) {
  return order.assignedCallers
    .map(id => gcAgents.value.find(agent => agent._id === id)?.name || 'Unknown')
    .join(', ')
}

onMounted(async () => {
  try {
    // Register this component as active
    store.commit('addActiveComponent', 'ordersDashboard');
    
    // Selective fetching - only fetch data needed for orders dashboard
    await store.dispatch('fetchForContext', 'ordersDashboard');
    
    // Initialize date range if not set
    if (!currentDateRange.value || currentDateRange.value.length < 2) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      // Use UTC methods to avoid timezone issues
      const firstDay = new Date(Date.UTC(year, month, 1));
      const lastDay = new Date(Date.UTC(year, month + 1, 0));
      const format = (date) => date.toISOString().split('T')[0]
      const newRange = [format(firstDay), format(lastDay)]
      updateDateRange(newRange)
    }
    // Load custom weeks for the current month
    await loadMonthWeeks()
  } catch (error) {
    console.error('Error fetching data on mount:', error)
  }
})

onUnmounted(() => {
  // Unregister this component when it's destroyed
  store.commit('removeActiveComponent', 'ordersDashboard');
})

// Reload custom weeks when date range (month) changes
watch(currentDateRange, async (newRange) => {
  if (newRange && newRange.length >= 2) {
    await loadMonthWeeks()
  }
})

async function loadMonthWeeks() {
  try {
    if (!currentDateRange.value || currentDateRange.value.length < 2) return
    const [startDate] = currentDateRange.value
    const d = new Date(startDate)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    monthWeeks.value = await getMonthWeeks(year, month)
  } catch (e) {
    console.warn('Failed to load month weeks:', e)
    monthWeeks.value = []
  }
}
</script>

<style scoped>
  .sticky-toolbar {
    position: sticky;
    top: 0;
    z-index: 20;
    background: #ffffff;
    padding-top: 8px;
    margin-bottom: 12px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.06);
  }
  .order-card {
    transition: box-shadow 0.3s ease;
  }
  .order-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
  .small-card {
      max-width: 450px;
      max-height: 300px;
      overflow: auto;
  }
  
  .small-btn {
    font-size: 12px;
    padding: 4px 8px;
    min-width: 85px;
  }
  
  .grid-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr); /* 4 columns on desktop */
    gap: 16px;
    width: 100%;
    margin-bottom: 1rem;
    flex-shrink: 0; /* ✅ Prevent it from collapsing or overlapping */

    /* Hide scrollbar for Webkit browsers (Chrome, Safari) */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* IE and Edge */
  }

  /* Responsive grid */
  /* Keep at 4 columns on ultra-wide as well to match 90% width */
  @media (max-width: 960px) {
    .grid-container {
      grid-template-columns: repeat(2, 1fr);
      width: 100% !important;
    }
  }

  @media (max-width: 600px) {
    .grid-container {
      grid-template-columns: 1fr;
      width: 100% !important;
    }
  }


  .grid-container::-webkit-scrollbar {
    display: none; /* Chrome, Safari, and Opera */
  }

  /* Remove horizontal hover scroll to avoid cut-off */
  
  /* Revenue summary card styling */
  .revenue-summary {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 1px solid #dee2e6;
  }
  
  .revenue-summary .text-primary {
    color: #0d6efd !important;
  }
  
  .revenue-summary .text-success {
    color: #198754 !important;
  }
</style>
