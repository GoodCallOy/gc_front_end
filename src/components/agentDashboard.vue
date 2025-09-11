<template>
  <v-container  style="width: 80%;" >
    <!-- Date Navigation Header -->
    <v-card elevation="1" class="mb-4">
      <div class="d-flex align-center justify-center pa-4">
        <v-btn icon flat class="pa-0 ma-0" @click="getPreviousMonth">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <div class="text-h6 font-weight-medium mx-3">{{ getFormattedDateRange() }}</div>
        <v-btn icon flat @click="getNextMonth">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
    </v-card>
    
    <h1 class="text-h4 mb-4" style="width: 75vw;"> Cases for {{ selectedGcAgent ? selectedGcAgent.name : '—' }}</h1>
    <div class="grid-container ">
      <agentCaseCard
      v-for="(userOrder, index) in userOrders"
      :key="index"
      :order="userOrder"
      :agents="gcAgents"
      :dailyLogs="dailyLogs"
      :currentUser="currentUser"
      />
    </div>
    <v-card>
    <v-card-title class="text-h6">Daily Logs - {{ getFormattedDateRange() }}</v-card-title>

    <v-data-table
      :headers="statsHeaders"
      :items="statsItems"
      class="elevation-1"
      density="comfortable"
      :items-per-page="20"
    >
      <!-- Response Rate formatting -->
      <template #item.responseRate="{ value }">
        {{ value }}%
      </template>
    </v-data-table>
  </v-card>
  </v-container>
  
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n';
import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth } from '@/js/dateUtils';
import agentCaseCard from './agentCaseCard.vue'

const store = useStore()
const userOrders = ref([])
const { t } = useI18n()

const orders = computed(() => store.getters['orders'])
console.log('dashOrders', orders.value)
const gcAgents = computed(() => store.getters['gcAgents'])
console.log('gcAgents', gcAgents.value)
const dailyLogs = computed(() => store.getters['dailyLogs'])
console.log('dailyLogs', dailyLogs.value)
const currentDate = computed(() => store.getters['currentDate'])
const currentDateRange = computed(() => store.getters['currentDateRange'])
console.log('currentDate', currentDate.value)
console.log('currentDateRange', currentDateRange.value)

const statsHeaders = computed(() => [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Case Name', key: 'caseName', sortable: true },
  { title: 'Call Time (hrs)', key: 'callTime', sortable: true },
  { title: 'Outgoing Calls', key: 'outgoingCalls', sortable: true },
  { title: 'Answered Calls', key: 'answeredCalls', sortable: true },
  { title: 'Response Rate %', key: 'responseRate', sortable: true },
  { title: 'Completed Calls', key: 'completedCalls', sortable: true },
  { title: 'Quantity Completed', key: 'quantityCompleted', sortable: true },
])

function formatNumber(n) {
  return typeof n === 'number' ? n.toFixed(2) : n
}
function formatCurrency(n) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(n ?? 0)
  } catch {
    return n
  }
}
function formatDateToDDMMYYYY(dateString) {
  if (!dateString) return '';
  
  // Optimized: handle common date formats more efficiently
  let date;
  if (typeof dateString === 'string' && dateString.includes('T')) {
    // ISO string - extract date part first
    date = new Date(dateString.split('T')[0]);
  } else {
    date = new Date(dateString);
  }
  
  if (isNaN(date.getTime())) return dateString;
  
  // Optimized: use template literals and avoid multiple String() calls
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

const statsItems = computed(() => {
  if (!selectedGcAgent.value || !dailyLogs.value || !currentDateRange.value) {
    return [];
  }

  const agentId = String(selectedGcAgent.value._id ?? selectedGcAgent.value.id);
  const [startDate, endDate] = currentDateRange.value;
  
  // Pre-calculate date boundaries once (not in the loop)
  const monthStart = new Date(startDate);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(endDate);
  monthEnd.setHours(23, 59, 59, 999);
  
  // Pre-calculate date-only boundaries for comparison
  const monthStartOnly = new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate());
  const monthEndOnly = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate());

  // Optimized filtering with pre-calculated values
  const agentDailyLogs = dailyLogs.value.filter(log => {
    // Fast agent ID check first (most selective)
    const logAgentId = String(log?.agent?._id ?? log?.agent ?? '');
    if (logAgentId !== agentId) return false;
    
    // Optimized date parsing and validation
    const logDate = new Date(log.date);
    if (isNaN(logDate.getTime())) return false;
    
    // Fast date comparison using pre-calculated boundaries
    const logDateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
    return logDateOnly >= monthStartOnly && logDateOnly <= monthEndOnly;
  });

  // Optimized mapping with pre-calculated values
  return agentDailyLogs.map(log => {
    const outgoingCalls = log.outgoing_calls || 0;
    const answeredCalls = log.answered_calls || 0;
    const responseRate = outgoingCalls > 0 ? (answeredCalls / outgoingCalls) * 100 : 0;

    return {
      date: formatDateToDDMMYYYY(log.date),
      originalDate: log.date,
      caseName: log.caseName || 'Unknown Case',
      callTime: formatNumber(log.call_time || 0),
      outgoingCalls,
      answeredCalls,
      responseRate: formatNumber(responseRate),
      completedCalls: log.completed_calls || 0,
      quantityCompleted: log.quantityCompleted || 0,
    };
  }).sort((a, b) => new Date(b.originalDate) - new Date(a.originalDate));
});
const currentUser = computed(() => {
  return store.state.user?.user
      ?? JSON.parse(localStorage.getItem('auth_user') || 'null')
      ?? null;
});
console.log('user', currentUser.value)

const selectedGcAgent = computed(() => {
  const user = currentUser.value;
  const linkId = user?.linkedUserId ?? null;
  if (!linkId) return null;

  return (gcAgents.value || []).find(a =>
    String(a._id ?? a.id) === String(linkId)
  ) || null;
});

watch([orders, selectedGcAgent, currentDateRange], ([allOrders, agent, dateRange]) => {
  userOrders.value = agent
    ? findOrdersForUser(allOrders, agent._id ?? agent.id)
    : [];

  const caseNamesArray = groupByCaseName(userOrders.value);
  const dailyLogsForUser = findDailyLogsForUser(caseNamesArray);
  const dailyBreakdown = dailyLogsForUser.map(log => ({
    date: currentDate.value.split('T')[0],
    quantity: log.quantityCompleted
  }));
}, { immediate: true });

function findOrdersForUser(allOrdersArray, agentId) {
  const wanted = String(agentId || '');
  if (!wanted) return [];
  
  // Filter by agent first (most selective filter)
  const agentOrders = (allOrdersArray || []).filter(order =>
    (order.assignedCallers || []).some(id => String(id?._id ?? id) === wanted)
  );
  
  // Early return if no date range
  if (!currentDateRange.value || currentDateRange.value.length < 2) {
    return agentOrders;
  }
  
  // Pre-calculate date boundaries once
  const [startDate, endDate] = currentDateRange.value;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);
  
  // Optimized date filtering
  return agentOrders.filter(order => {
    const orderStart = new Date(order.startDate);
    const orderEnd = new Date(order.deadline);
    
    // Fast overlap check
    return orderStart <= monthEnd && orderEnd >= monthStart;
  });
}

function groupByCaseName(orders) {
  // Optimized: single pass with Set for deduplication
  const names = new Set();
  for (const order of orders) {
    if (order.caseName) {
      names.add(order.caseName);
    }
  }
  return Array.from(names);
}

function findDailyLogsForUser(caseNamesArray) {
  // Optimized: use Set for O(1) lookup instead of O(n) includes
  const caseNamesSet = new Set(caseNamesArray);
  return (dailyLogs.value || []).filter(log =>
    caseNamesSet.has(log.caseName)
  );
}

// Date navigation functions
const getFormattedDateRange = () => {
  return formattedDateRange(currentDateRange.value);
}

const getIsCurrentMonth = () => {
  return isCurrentMonth(currentDateRange.value)
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

onMounted(async () => {
  try {
    // Register this component as active
    store.commit('addActiveComponent', 'agentDashboard');
    
    // Selective fetching - only fetch data needed for agent dashboard
    await store.dispatch('fetchForContext', 'agentDashboard');
    
    // Initialize date range if not set
    console.log('Current date range on mount:', currentDateRange.value);
    if (!currentDateRange.value || currentDateRange.value.length < 2) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      // Use UTC methods to avoid timezone issues
      const firstDay = new Date(Date.UTC(year, month, 1));
      const lastDay = new Date(Date.UTC(year, month + 1, 0));
      const format = (date) => date.toISOString().split('T')[0]
      const newRange = [format(firstDay), format(lastDay)]
      console.log('Setting new date range:', newRange);
      console.log('Current month should be:', month + 1, 'Year:', year);
      updateDateRange(newRange)
    } else {
      console.log('Date range already set, not overriding');
    }
  } catch (error) {
    console.error('Error fetching data on mount:', error)
  }
})

onUnmounted(() => {
  // Unregister this component when it's destroyed
  store.commit('removeActiveComponent', 'agentDashboard');
})
</script>

<style scoped>
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
    grid-template-columns: repeat(3, 1fr); /* 3 columns */
    gap: 16px;
    width: 75vw;
    margin-bottom: 1rem;
    flex-shrink: 0; /* ✅ Prevent it from collapsing or overlapping */

    /* Hide scrollbar for Webkit browsers (Chrome, Safari) */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* IE and Edge */
  }


  .grid-container::-webkit-scrollbar {
    display: none; /* Chrome, Safari, and Opera */
  }

  /* Enable scrolling when hovering */
  .grid-container:hover {
    overflow-x: auto; /* Ensure scrolling works on hover */
  }
</style>
