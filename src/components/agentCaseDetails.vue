<template>
  <v-container>
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

    <v-card v-if="order" class="pa-4"   >
      <v-row justify="space-between">
        <v-col>
          <h2>Case Details</h2>
        </v-col>
        
      </v-row>


      <div>
        <v-row>
            <v-col cols="3">
                <strong>Case:</strong> {{ order.caseName }}
            </v-col>
            <v-col cols="3">
                <strong>Case Unit:</strong> {{ order.caseUnit }}
            </v-col>
            <v-col cols="3">
                <strong>Price per Unit:</strong> {{ order.pricePerUnit }}
            </v-col>
            <v-col cols="3">
                <strong>Status:</strong> {{ order.orderStatus }}
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="3">
               <strong>Deadline:</strong> {{ formatDate(order.deadline) }}
            </v-col>
            <v-col cols="3">
               <strong>Quantity:</strong> {{ order.totalQuantity }}
            </v-col>
            <v-col cols="3">
                <strong>Estimated Revenue:</strong> €{{ order.estimatedRevenue }}
            </v-col>
            <v-col cols="3">
                <strong>Callers:</strong> {{ getCallerNames(order, agents) }}
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <div v-if="order.agentGoals">
                    <strong>Agent Goals:</strong>
                    <ul>
                        <li v-for="id in order.assignedCallers" :key="id">
                        {{ agentName(id) }}: {{ order.agentGoals[id] || 0 }}
                        </li>
                    </ul>
                </div>
            </v-col>
        </v-row>
        </div>
    </v-card>
  </v-container>
  <v-card class="mx-auto my-4 pa-4 elevation-4" style="width: 90%; background-color: #eeeff1;">
    <v-row>
      <v-col cols="4">
        <h2 class="text-h5">Case Statistics - {{ getFormattedDateRange() }}</h2>
      </v-col>
      <v-col cols="4">
        <h2 class="text-h6">Revenue Generate: €{{ revenueGenerated.revenue }}</h2>
      </v-col>
      <v-col cols="4">
        <h2 class="text-h6">Total Units: {{ revenueGenerated.totalUnits }}</h2>
      </v-col>
    </v-row>
    
    <p v-if="weeklyTotals.length === 0 && individualLogs.length === 0">No statistics available for this case in the selected month.</p>
    <div v-else>
      <!-- Weekly Totals Table -->
      <div v-if="weeklyTotals.length > 0" class="mb-6">
        <h3 class="text-h6 mb-3">Weekly Summary</h3>
        <v-data-table
          :headers="weeklyHeaders"
          :items="weeklyTotals"
          class="elevation-1"
          density="comfortable"
          :items-per-page="10"
          style="width: 100%"
        >
          <!-- Response Rate formatting -->
          <template #item.responseRate="{ value }">
            {{ value }}%
          </template>
          
          <!-- Actions column for weekly totals -->
          <template #item.actions="{ item }">
            <span class="text-grey">—</span>
          </template>
        </v-data-table>
      </div>

      <!-- Individual Logs Table -->
      <div v-if="individualLogs.length > 0">
        <h3 class="text-h6 mb-3">Daily Entries</h3>
        <v-data-table
          :headers="individualHeaders"
          :items="individualLogs"
          class="elevation-1"
          density="comfortable"
          :items-per-page="20"
          style="width: 100%"
        >
          <!-- Response Rate formatting -->
          <template #item.responseRate="{ value }">
            {{ value }}%
          </template>
          
          <!-- Actions column for individual logs -->
          <template #item.actions="{ item }">
            <v-btn
              icon
              size="small"
              color="primary"
              title="Edit Log"
              @click="editLog(item.originalLog)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </div>
    </div>
  </v-card>
    
  
</template>

<script setup>
  import { ref, onMounted, computed, watch } from 'vue'
  import axios from 'axios'
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n';
  import { useStore } from 'vuex'
  import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth } from '@/js/dateUtils';
  import urls from '@/js/config.js'


  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()
  const store = useStore()
  const orderId = route.query.orderId
  console.log('Order ID:', orderId)

  const order = ref(null)
  const agents = ref([])
  const caseStats = ref([]);
  
  // Date range functionality
  const currentDateRange = computed(() => store.getters['currentDateRange'])
  const orders = computed(() => store.getters['orders'])
  
  const goalTypes = ['hours', 'interviews', 'meetings']
  const orderStatuses = ['pending', 'in-progress', 'completed', 'cancelled', 'on-hold']
  const agentName = id => agents.value.find(a => a._id === id)?.name || id;

  const revenueGenerated = computed(() => {
  // Make this reactive to both caseStats and currentDateRange
  const stats = caseStats.value;
  const dateRange = currentDateRange.value;
  
  if (!order.value || !order.value.assignedCallers || !Array.isArray(stats) || !dateRange) {
    return { totalUnits: 0, revenue: '0.00' };
  }
  
  // Get agent ID for filtering
  const agentId = order.value.assignedCallers?.[0];
  if (!agentId) return { totalUnits: 0, revenue: '0.00' };
  
  // Filter logs to only include those within the selected date range AND for the specific agent
  const [startDate, endDate] = dateRange;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);
  monthEnd.setHours(23, 59, 59, 999);
  
  const filteredStats = stats.filter(log => {
    const logDate = new Date(log.date);
    const isInDateRange = logDate >= monthStart && logDate <= monthEnd;
    
    // Check if this log belongs to the specific agent
    const logAgentId = log.agent?._id || log.agent || log.agentId;
    const isAgentLog = String(logAgentId) === String(agentId);
    
    return isInDateRange && isAgentLog;
  });

  // Add deduplication to prevent double counting
  const uniqueLogs = [];
  const seenLogs = new Set();
  
  filteredStats.forEach(log => {
    // Create a unique key for deduplication
    const logKey = `${log.date}_${log.agentName || log.agent}_${log.caseName}_${log._id || log.id}`;
    
    if (!seenLogs.has(logKey)) {
      seenLogs.add(logKey);
      uniqueLogs.push(log);
    }
  });
  
  // Calculate total units from deduplicated logs for the current case only
  const currentCaseName = order.value.caseName;
  const totalUnits = uniqueLogs
    .filter(log => log.caseName === currentCaseName)
    .reduce((sum, log) => sum + (Number(log.quantityCompleted) || 0), 0);
  const revenue = (totalUnits * (Number(order.value.pricePerUnit) || 0)).toFixed(2);
  
  console.log('Revenue calculation - Total stats:', stats.length);
  console.log('Revenue calculation - Filtered stats:', filteredStats.length);
  console.log('Revenue calculation - Unique logs:', uniqueLogs.length);
  console.log('Revenue calculation - Current case logs:', uniqueLogs.filter(log => log.caseName === currentCaseName).length);
  console.log('Revenue calculation - Total units:', totalUnits);
  
  return { totalUnits, revenue };
});

// Headers for weekly totals table
const weeklyHeaders = computed(() => [
  { title: 'Week', key: 'date', sortable: true },
  { title: 'Cases', key: 'cases', sortable: true },
  { title: t('agentTables.unit'), key: 'caseUnit', sortable: true },
  { title: t('agentTables.callTime'), key: 'callTime', sortable: true },
  { title: t('agentTables.outgoingCalls'), key: 'outgoingCalls', sortable: true },
  { title: t('agentTables.answeredCalls'), key: 'answeredCalls', sortable: true },
  { title: t('agentTables.responseRate'), key: 'responseRate', sortable: true },
  { title: t('agentTables.completedCalls'), key: 'completedCalls', sortable: true },
  { title: t('agentTables.results'), key: 'quantityCompleted', sortable: true },
  { title: t('agentTables.amountMade'), key: 'amountMade', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, width: '100px' },
])

// Headers for individual logs table
const individualHeaders = computed(() => [
  { title: t('agentTables.date'), key: 'date', sortable: true },
  { title: 'Agent', key: 'agentName', sortable: true },
  { title: t('agentTables.unit'), key: 'caseUnit', sortable: true },
  { title: t('agentTables.callTime'), key: 'callTime', sortable: true },
  { title: t('agentTables.outgoingCalls'), key: 'outgoingCalls', sortable: true },
  { title: t('agentTables.answeredCalls'), key: 'answeredCalls', sortable: true },
  { title: t('agentTables.responseRate'), key: 'responseRate', sortable: true },
  { title: t('agentTables.completedCalls'), key: 'completedCalls', sortable: true },
  { title: t('agentTables.results'), key: 'quantityCompleted', sortable: true },
  { title: t('agentTables.amountMade'), key: 'amountMade', sortable: true },
  { title: t('agentTables.edit'), key: 'actions', sortable: false, width: '100px' },
])

// Format number helper function
function formatNumber(n) {
  return typeof n === 'number' ? n.toFixed(2) : n
}

// Format date helper function
function formatDateToDDMMYYYY(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

// Helper function to get week number and year from a date
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return Math.ceil((((d - week1) / 86400000) + week1.getDay() + 1) / 7);
}

// Helper function to get week start and end dates
function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    start: monday,
    end: sunday,
    weekNumber: getWeekNumber(date),
    year: d.getFullYear()
  };
}

// Weekly totals computed property - across ALL cases for the agent
const weeklyTotals = computed(() => {
  const stats = caseStats.value;
  const dateRange = currentDateRange.value;
  const allOrders = orders.value;
  
  if (!stats || !Array.isArray(stats) || !dateRange || !allOrders) {
    return [];
  }

  // Get all cases the agent is assigned to
  const agentId = order.value?.assignedCallers?.[0]; // Assuming single agent per case
  if (!agentId) return [];

  const agentCases = allOrders.filter(order => 
    order.assignedCallers && order.assignedCallers.includes(agentId)
  );

  // Filter logs to only include those within the selected date range AND for the specific agent
  const [startDate, endDate] = dateRange;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);
  monthEnd.setHours(23, 59, 59, 999);
  
  const filteredStats = stats.filter(log => {
    const logDate = new Date(log.date);
    const isInDateRange = logDate >= monthStart && logDate <= monthEnd;
    
    // Check if this log belongs to the specific agent
    const logAgentId = log.agent?._id || log.agent || log.agentId;
    const isAgentLog = String(logAgentId) === String(agentId);
    
    return isInDateRange && isAgentLog;
  });

  // Add deduplication to prevent double counting
  const uniqueLogs = [];
  const seenLogs = new Set();
  
  filteredStats.forEach(log => {
    // Create a unique key for deduplication
    const logKey = `${log.date}_${log.agentName || log.agent}_${log.caseName}_${log._id || log.id}`;
    
    if (!seenLogs.has(logKey)) {
      seenLogs.add(logKey);
      uniqueLogs.push(log);
    }
  });

  console.log('Weekly totals - Total stats:', stats.length);
  console.log('Weekly totals - Filtered stats:', filteredStats.length);
  console.log('Weekly totals - Unique logs:', uniqueLogs.length);
  console.log('Weekly totals - Agent ID:', agentId);

  // Group logs by week using deduplicated logs
  const weeklyGroups = {};
  
  uniqueLogs.forEach(log => {
    const weekInfo = getWeekRange(log.date);
    const weekKey = `${weekInfo.year}-W${weekInfo.weekNumber}`;
    
    if (!weeklyGroups[weekKey]) {
      weeklyGroups[weekKey] = {
        weekKey,
        weekInfo,
        logs: [],
        cases: new Set(), // Track unique cases for this week
        totals: {
          callTime: 0,
          outgoingCalls: 0,
          answeredCalls: 0,
          completedCalls: 0,
          quantityCompleted: 0,
          amountMade: 0
        }
      };
    }
    
    weeklyGroups[weekKey].logs.push(log);
    weeklyGroups[weekKey].cases.add(log.caseName); // Add case to the set
    
    // Add to totals
    const logCallTime = log.call_time || 0;
    const logOutgoingCalls = log.outgoing_calls || 0;
    const logAnsweredCalls = log.answered_calls || 0;
    const logCompletedCalls = log.completed_calls || 0;
    const logQuantityCompleted = log.quantityCompleted || 0;
    
    // Find the case for this log to get the correct price per unit
    const logCase = agentCases.find(c => c.caseName === log.caseName);
    const pricePerUnit = logCase?.pricePerUnit || 0;
    const logAmountMade = logQuantityCompleted * pricePerUnit;
    
    weeklyGroups[weekKey].totals.callTime += logCallTime;
    weeklyGroups[weekKey].totals.outgoingCalls += logOutgoingCalls;
    weeklyGroups[weekKey].totals.answeredCalls += logAnsweredCalls;
    weeklyGroups[weekKey].totals.completedCalls += logCompletedCalls;
    weeklyGroups[weekKey].totals.quantityCompleted += logQuantityCompleted;
    weeklyGroups[weekKey].totals.amountMade += logAmountMade;
  });

  // Convert to array for weekly totals
  const result = [];
  
  Object.values(weeklyGroups).forEach(group => {
    // Calculate average response rate for the week
    const avgResponseRate = group.totals.outgoingCalls > 0 
      ? (group.totals.answeredCalls / group.totals.outgoingCalls) * 100 
      : 0;
    
    // Convert cases set to sorted array for display
    const casesList = Array.from(group.cases).sort();
    const casesDisplay = casesList.length > 0 ? casesList.join(', ') : 'No cases';
    
    console.log(`Week ${group.weekInfo.weekNumber} totals:`, {
      quantityCompleted: group.totals.quantityCompleted,
      logsCount: group.logs.length,
      cases: casesDisplay
    });

    result.push({
      date: `Week ${group.weekInfo.weekNumber}, ${group.weekInfo.year}`,
      cases: casesDisplay,
      caseUnit: 'All Cases',
      callTime: formatNumber(group.totals.callTime),
      outgoingCalls: group.totals.outgoingCalls,
      answeredCalls: group.totals.answeredCalls,
      responseRate: formatNumber(avgResponseRate),
      completedCalls: group.totals.completedCalls,
      quantityCompleted: group.totals.quantityCompleted,
      amountMade: `€${group.totals.amountMade.toFixed(2)}`,
      originalDate: group.weekInfo.start,
    });
  });
  
  // Sort by week (newest first)
  return result.sort((a, b) => new Date(b.originalDate) - new Date(a.originalDate));
});

// Individual logs computed property - only for the current case
const individualLogs = computed(() => {
  const stats = caseStats.value;
  const dateRange = currentDateRange.value;
  
  if (!stats || !Array.isArray(stats) || !dateRange) {
    return [];
  }

  // Filter logs to only include those within the selected date range AND for the current case only
  const [startDate, endDate] = dateRange;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);
  monthEnd.setHours(23, 59, 59, 999);
  
  const currentCaseName = order.value?.caseName;
  
  const filteredStats = stats.filter(log => {
    const logDate = new Date(log.date);
    const isInDateRange = logDate >= monthStart && logDate <= monthEnd;
    const isCurrentCase = log.caseName === currentCaseName;
    return isInDateRange && isCurrentCase;
  });

  // Remove duplicates based on unique log ID or combination of date + agent + case
  const uniqueLogs = [];
  const seenLogs = new Set();
  
  filteredStats.forEach(log => {
    // Create a unique key for deduplication
    const logKey = `${log.date}_${log.agentName || log.agent}_${log.caseName}_${log._id || log.id}`;
    
    if (!seenLogs.has(logKey)) {
      seenLogs.add(logKey);
      uniqueLogs.push(log);
    }
  });

  console.log('Individual logs - Total stats:', stats.length);
  console.log('Individual logs - Filtered stats:', filteredStats.length);
  console.log('Individual logs - Unique logs:', uniqueLogs.length);

  // Convert to individual log entries
  return uniqueLogs
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(log => {
      const outgoingCalls = log.outgoing_calls || 0;
      const answeredCalls = log.answered_calls || 0;
      const responseRate = outgoingCalls > 0 ? (answeredCalls / outgoingCalls) * 100 : 0;
      const quantityCompleted = log.quantityCompleted || 0;
      const pricePerUnit = order.value?.pricePerUnit || 0;
      const amountMade = (quantityCompleted * pricePerUnit).toFixed(2);

      // Get agent name from various possible sources
      let agentName = 'Unknown Agent';
      if (log.agentName) {
        agentName = log.agentName;
      } else if (log.agent && typeof log.agent === 'string') {
        // If agent is a string ID, try to find the agent name
        const agent = agents.value.find(a => String(a._id || a.id) === String(log.agent));
        agentName = agent ? agent.name : `Agent ${log.agent}`;
      } else if (log.agent && log.agent.name) {
        agentName = log.agent.name;
      } else if (log.agent && log.agent._id) {
        // If agent is an object with _id, try to find the agent name
        const agent = agents.value.find(a => String(a._id || a.id) === String(log.agent._id));
        agentName = agent ? agent.name : `Agent ${log.agent._id}`;
      }

      // Debug logging for agent name resolution
      if (agentName === 'Unknown Agent') {
        console.log('Unknown agent in log:', {
          logAgent: log.agent,
          logAgentName: log.agentName,
          availableAgents: agents.value.map(a => ({ id: a._id || a.id, name: a.name }))
        });
      }

      return {
        date: formatDateToDDMMYYYY(log.date),
        agentName,
        caseUnit: order.value?.caseUnit || 'N/A',
        callTime: formatNumber(log.call_time || 0),
        outgoingCalls,
        answeredCalls,
        responseRate: formatNumber(responseRate),
        completedCalls: log.completed_calls || 0,
        quantityCompleted,
        amountMade: `€${amountMade}`,
        originalLog: log,
      };
    });
});

  function getCallerNames(order, agents) {
      const agentNames = order.assignedCallers
          .map(id => agents.find(agent => agent._id === id)?.name || 'Unknown')
          .join(', ')
      console.log('Agent Names:', agentNames);
      return agentNames
  }
  onMounted(async () => {
    try {
      // Initialize date range if not set
      if (!currentDateRange.value || currentDateRange.value.length < 2) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDay = new Date(Date.UTC(year, month, 1));
        const lastDay = new Date(Date.UTC(year, month + 1, 0));
        const format = (date) => date.toISOString().split('T')[0]
        const newRange = [format(firstDay), format(lastDay)]
        updateDateRange(newRange);
      }

      const [orderRes, agentRes, ordersRes] = await Promise.all([
        axios.get(`${urls.backEndURL}/orders/${orderId}`),
        axios.get(`${urls.backEndURL}/gcAgents`),
        axios.get(`${urls.backEndURL}/orders`)
      ])
      order.value = orderRes.data
      agents.value = agentRes.data
      
      // Store orders in the store
      store.commit('setOrders', ordersRes.data)

      // Fetch case stats for all cases the agent is assigned to
      await fetchCaseStats();
    } catch (error) {
      console.error('Error in onMounted:', error);
    }
  })

  const editOrder = () => {
    // Navigate to the edit order form
    router.push({ name: 'editOrderForm', params: { id: orderId } });
  }

  const editLog = (logData) => {
    // Navigate to the daily log form with the log data for editing
    router.push({ 
      name: 'addDailyLog', 
      query: { editLog: JSON.stringify(logData) }
    });
  }

  const formatDate = dateStr => new Date(dateStr).toLocaleDateString()

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

  // Function to fetch all case stats for the agent across all cases
  const fetchCaseStats = async () => {
    if (!order.value || !orders.value) return;
    
    try {
      // Get all cases the agent is assigned to
      const agentId = order.value.assignedCallers?.[0];
      if (!agentId) return;

      const agentCases = orders.value.filter(order => 
        order.assignedCallers && order.assignedCallers.includes(agentId)
      );

      // Fetch data for all cases the agent is assigned to
      const caseNames = agentCases.map(c => c.caseName);
      const allStats = [];

      for (const caseName of caseNames) {
        try {
          const response = await axios.get(
            `${urls.backEndURL}/dailyLogs/${caseName}`
          );
          allStats.push(...response.data);
        } catch (error) {
          console.warn(`Error fetching stats for case ${caseName}:`, error);
        }
      }
      
      caseStats.value = allStats;
      console.log('All Agent Case Stats loaded:', caseStats.value);
    } catch (error) {
      console.error('Error fetching case stats:', error);
      caseStats.value = [];
    }
  }

  // No need to watch date range changes since we filter in computed properties
</script>
<style scoped>
/* Table spacing */
.mb-6 {
  margin-bottom: 24px;
}

.mb-3 {
  margin-bottom: 12px;
}

/* Ensure tables take full width */
:deep(.v-data-table) {
  width: 100% !important;
}

:deep(.v-data-table__wrapper) {
  width: 100% !important;
}
</style>