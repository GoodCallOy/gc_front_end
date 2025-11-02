<template>
  <v-container  style="width: 90%;" >
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

    <!-- Agent Statistics Header -->
    <v-card v-if="userOrders.length > 0" class="mx-auto my-4 pa-4 elevation-4" style="background-color: #eeeff1;">
      <v-row>
        <v-col cols="4">
          <h2 class="text-h5">Agent Statistics - {{ getFormattedDateRange() }}</h2>
        </v-col>
        <v-col cols="4">
          <h2 class="text-h6">Revenue Generated: €{{ revenueGenerated.revenue }}</h2>
        </v-col>
        <v-col cols="4">
          <h2 class="text-h6">Total Units: {{ revenueGenerated.totalUnits }}</h2>
        </v-col>
      </v-row>
    </v-card>
    
    <!-- Show simple message if no cases assigned -->
    <div v-if="userOrders.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-clipboard-outline</v-icon>
      <h2 class="text-h5 mb-2 text-grey-darken-1">{{ t('messages.noCasesAssigned') }}</h2>
      <p class="text-body-1 text-grey">{{ t('messages.contactManagerForCases') }}</p>
    </div>

    <!-- Show cases if assigned -->
    <div v-else>
      <h1 class="text-h4 mb-4" style="width: 90vw;"> Cases for {{ selectedGcAgent ? selectedGcAgent.name : '—' }}</h1>
      <div class="grid-container ">
        <agentCaseCard
        v-for="(userOrder, index) in userOrders"
        :key="index"
        :order="userOrder"
        :agents="gcAgents"
        :dailyLogs="caseStats"
        :currentUser="selectedGcAgent"
        />
      </div>
    </div>
    

  <!-- Weekly Totals Table -->
  <v-card v-if="userOrders.length > 0 && weeklyTotals.length > 0" class="mx-auto my-4 pa-4 elevation-4" style="background-color: #eeeff1;">
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
    </v-data-table>
  </v-card>

  <!-- Individual Logs Tables by Week -->
  <v-card v-if="userOrders.length > 0 && weeklyLogGroups.length > 0" class="mx-auto my-4 pa-4 elevation-4" style="background-color: #eeeff1;">
    <h3 class="text-h6 mb-3">Daily Entries by Week</h3>
    <div v-for="weekGroup in weeklyLogGroups" :key="weekGroup.weekKey" class="mb-6">
      <h4 class="text-subtitle-1 mb-2">{{ weekGroup.weekTitle }}</h4>
      <v-data-table
        :headers="individualHeaders"
        :items="weekGroup.logs"
        class="elevation-1"
        density="comfortable"
        :items-per-page="10"
        style="width: 100%"
      >
        <!-- Response Rate formatting -->
        <template #item.responseRate="{ value }">
          {{ value }}%
        </template>
        
        <!-- Actions column for individual logs -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center">
            <v-icon
              icon
              size="small"
              color="grey"
              title="Edit Log"
              @click="editLog(item.originalLog)"
              class="mr-2"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-icon>
            <v-icon
              icon
              size="small"
              color="red"
              title="Delete Log"
              @click="deleteLog(item.originalLog)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-icon>
          </div>
        </template>
      </v-data-table>
    </div>
  </v-card>
  </v-container>
  
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth, getMonthWeeks } from '@/js/dateUtils';
import agentCaseCard from './agentCaseCard.vue'
import axios from 'axios'
import urls from '@/js/config.js'

const store = useStore()
const router = useRouter()
const route = useRoute()
const userOrders = ref([])
const caseStats = ref([])
const monthWeeks = ref([])
const { t } = useI18n()

const orders = computed(() => store.getters['orders'])
const gcAgents = computed(() => store.getters['gcAgents'])
const currentDate = computed(() => store.getters['currentDate'])
const currentDateRange = computed(() => store.getters['currentDateRange'])


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


// Revenue calculation for all agent cases
const revenueGenerated = computed(() => {
  const stats = caseStats.value;
  const dateRange = currentDateRange.value;
  
  if (!selectedGcAgent.value || !Array.isArray(stats) || !dateRange) {
    return { totalUnits: 0, revenue: '0.00' };
  }
  
  const agentId = String(selectedGcAgent.value._id ?? selectedGcAgent.value.id);
  
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
  
  // Helper function to check if an order is a test case
  function isTestCase(order) {
    if (!order) return false;
    const caseType = String(order.caseType || '').toLowerCase();
    if (caseType.includes('test')) return true;
    const caseName = String(order.caseName || '').toLowerCase();
    if (caseName.includes('test')) return true;
    if (order.isTest === true || order.test === true) return true;
    return false;
  }

  // Calculate total units and revenue from deduplicated logs for ALL cases the agent is assigned to (excluding test cases)
  const agentCases = orders.value.filter(order => 
    order.assignedCallers && order.assignedCallers.includes(agentId) && !isTestCase(order)
  );
  
  let totalUnits = 0;
  let totalRevenue = 0;
  
  uniqueLogs.forEach(log => {
    // Check if log case name indicates test
    const caseName = String(log.caseName || '').toLowerCase();
    if (caseName.includes('test')) return;
    
    const logQuantityCompleted = Number(log.quantityCompleted) || 0;
    totalUnits += logQuantityCompleted;
    
    // Find the case for this log to get the correct price per unit
    const logCase = agentCases.find(c => c.caseName === log.caseName);
    if (logCase && !isTestCase(logCase)) {
      const pricePerUnit = logCase.pricePerUnit || 0;
      totalRevenue += logQuantityCompleted * pricePerUnit;
    }
  });
  
  const revenue = totalRevenue.toFixed(2);
  
  return { totalUnits, revenue };
});

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
  
  if (!stats || !Array.isArray(stats) || !dateRange || !allOrders || !selectedGcAgent.value) {
    return [];
  }

  // Get all cases the agent is assigned to
  const agentId = String(selectedGcAgent.value._id ?? selectedGcAgent.value.id);
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

  // Group logs by custom week using deduplicated logs
  const weeklyGroups = {};
  
  // If no custom weeks available, return empty array
  if (!monthWeeks.value || monthWeeks.value.length === 0) {
    return [];
  }
  
  uniqueLogs.forEach(log => {
    const logDate = new Date(log.date);
    
    // Find which custom week this log belongs to
    const customWeek = monthWeeks.value.find(week => {
      const weekStart = new Date(week.start);
      const weekEnd = new Date(week.end);
      return logDate >= weekStart && logDate <= weekEnd;
    });
    
    if (customWeek) {
      const weekKey = `W${customWeek.weekNumber}`;
      
      if (!weeklyGroups[weekKey]) {
        weeklyGroups[weekKey] = {
          weekKey,
          weekInfo: customWeek,
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
    }
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

    // Format custom week dates for display
    const startDate = new Date(group.weekInfo.start);
    const endDate = new Date(group.weekInfo.end);
    const startStr = startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    const endStr = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    
    result.push({
      date: `Week ${group.weekInfo.weekNumber} (${startStr} - ${endStr})`,
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
  
  // Sort by week (oldest first)
  return result.sort((a, b) => new Date(a.originalDate) - new Date(b.originalDate));
});

// Individual logs computed property - for all cases the agent is assigned to
const individualLogs = computed(() => {
  const stats = caseStats.value;
  const dateRange = currentDateRange.value;
  const allOrders = orders.value;
  
  if (!stats || !Array.isArray(stats) || !dateRange || !allOrders || !selectedGcAgent.value) {
    return [];
  }

  // Get all cases the agent is assigned to
  const agentId = String(selectedGcAgent.value._id ?? selectedGcAgent.value.id);
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

  // Convert to individual log entries
  return uniqueLogs
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(log => {
      const outgoingCalls = log.outgoing_calls || 0;
      const answeredCalls = log.answered_calls || 0;
      const responseRate = outgoingCalls > 0 ? (answeredCalls / outgoingCalls) * 100 : 0;
      const quantityCompleted = log.quantityCompleted || 0;
      
      // Find the case for this log to get the correct case unit and price per unit
      const logCase = agentCases.find(c => c.caseName === log.caseName);
      const caseUnit = logCase?.caseUnit || 'N/A';
      const pricePerUnit = logCase?.pricePerUnit || 0;
      const amountMade = (quantityCompleted * pricePerUnit).toFixed(2);

      return {
        date: formatDateToDDMMYYYY(log.date),
        caseName: log.caseName || 'Unknown Case',
        caseUnit,
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

// Group individual logs by custom week
const weeklyLogGroups = computed(() => {
  const logs = individualLogs.value;
  if (!logs || logs.length === 0 || !monthWeeks.value || monthWeeks.value.length === 0) return [];

  const weekGroups = {};
  
  logs.forEach(log => {
    const logDate = new Date(log.originalLog.date);
    
    // Find which custom week this log belongs to
    const customWeek = monthWeeks.value.find(week => {
      const weekStart = new Date(week.start);
      const weekEnd = new Date(week.end);
      return logDate >= weekStart && logDate <= weekEnd;
    });
    
    if (customWeek) {
      const weekKey = `W${customWeek.weekNumber}`;
      
      if (!weekGroups[weekKey]) {
        const startDate = new Date(customWeek.start);
        const endDate = new Date(customWeek.end);
        const startStr = startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        const endStr = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        
        weekGroups[weekKey] = {
          weekKey,
          weekInfo: customWeek,
          weekTitle: `Week ${customWeek.weekNumber} (${startStr} - ${endStr})`,
          logs: []
        };
      }
      
      weekGroups[weekKey].logs.push(log);
    }
  });

  // Convert to array and sort by week number
  const result = Object.values(weekGroups)
    .sort((a, b) => a.weekInfo.weekNumber - b.weekInfo.weekNumber)
    .slice(0, 4); // Limit to 4 weeks
  
  return result;
});

// Headers for weekly totals table
const weeklyHeaders = computed(() => [
  { title: 'Week', key: 'date', sortable: true },
  { title: 'Cases', key: 'cases', sortable: true },
  { title: t('agentTables.callTime'), key: 'callTime', sortable: true, class: 'd-none d-md-table-cell' },
  { title: t('agentTables.outgoingCalls'), key: 'outgoingCalls', sortable: true, class: 'd-none d-lg-table-cell' },
  { title: t('agentTables.answeredCalls'), key: 'answeredCalls', sortable: true, class: 'd-none d-lg-table-cell' },
  { title: t('agentTables.responseRate'), key: 'responseRate', sortable: true, class: 'd-none d-md-table-cell' },
  { title: t('agentTables.completedCalls'), key: 'completedCalls', sortable: true, class: 'd-none d-xl-table-cell' },
  { title: t('agentTables.results'), key: 'quantityCompleted', sortable: true },
  { title: t('agentTables.amountMade'), key: 'amountMade', sortable: true },
])

// Headers for individual logs table
const individualHeaders = computed(() => [
  { title: t('agentTables.date'), key: 'date', sortable: true },
  { title: 'Case', key: 'caseName', sortable: true },
  { title: t('agentTables.unit'), key: 'caseUnit', sortable: true, class: 'd-none d-md-table-cell' },
  { title: t('agentTables.callTime'), key: 'callTime', sortable: true, class: 'd-none d-lg-table-cell' },
  { title: t('agentTables.outgoingCalls'), key: 'outgoingCalls', sortable: true, class: 'd-none d-xl-table-cell' },
  { title: t('agentTables.answeredCalls'), key: 'answeredCalls', sortable: true, class: 'd-none d-xl-table-cell' },
  { title: t('agentTables.responseRate'), key: 'responseRate', sortable: true, class: 'd-none d-lg-table-cell' },
  { title: t('agentTables.completedCalls'), key: 'completedCalls', sortable: true, class: 'd-none d-xl-table-cell' },
  { title: t('agentTables.results'), key: 'quantityCompleted', sortable: true },
  { title: t('agentTables.amountMade'), key: 'amountMade', sortable: true },
  { title: t('agentTables.edit'), key: 'actions', sortable: false, width: '100px' },
])

const currentUser = computed(() => {
  return store.state.user?.user
      ?? JSON.parse(localStorage.getItem('auth_user') || 'null')
      ?? null;
});

const selectedGcAgent = computed(() => {
  // First check if there's an agent query parameter (for admin viewing)
  const agentFromQuery = route.query.agent;
  
  if (agentFromQuery) {
    // Find agent by name from query parameter
    return (gcAgents.value || []).find(a =>
      a.name === agentFromQuery
    ) || null;
  }
  
  // Fall back to current user's linked agent
  const user = currentUser.value;
  const linkId = user?.linkedUserId ?? null;
  if (!linkId) return null;

  return (gcAgents.value || []).find(a =>
    String(a._id ?? a.id) === String(linkId)
  ) || null;
});

// Function to fetch all case stats for the agent across all cases
const fetchCaseStats = async () => {
  if (!selectedGcAgent.value || !orders.value) {
    return;
  }
  
  try {
    // Get all cases the agent is assigned to
    const agentId = String(selectedGcAgent.value._id ?? selectedGcAgent.value.id);
    
    const agentCases = orders.value.filter(order => 
      order.assignedCallers && order.assignedCallers.includes(agentId)
    );


    // Fetch data for all cases the agent is assigned to
    const caseNames = agentCases.map(c => c.caseName);
    const allStats = [];

    for (const caseName of caseNames) {
      try {
        const encodedCaseName = encodeURIComponent(caseName);
        const response = await axios.get(
          `${urls.backEndURL}/dailyLogs/${encodedCaseName}`
        );
        allStats.push(...response.data);
      } catch (error) {
        console.warn(`AgentDashboard: Error fetching stats for case ${caseName}:`, error);
      }
    }
    
    caseStats.value = allStats;
  } catch (error) {
    console.error('AgentDashboard: Error fetching case stats:', error);
    caseStats.value = [];
  }
}

watch([orders, selectedGcAgent, currentDateRange], async ([allOrders, agent, dateRange]) => {
  userOrders.value = agent
    ? findOrdersForUser(allOrders, agent._id ?? agent.id)
    : [];

  // Fetch case stats when agent or orders change
  if (agent) {
    await fetchCaseStats();
  }
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

// Load custom weeks for the current month
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

// Edit log function
const editLog = (logData) => {
  // Navigate to the daily log form with the log data for editing
  router.push({ 
    name: 'addDailyLog', 
    query: { editLog: JSON.stringify(logData) }
  });
};

// Delete log function
const deleteLog = async (logData) => {
  if (!confirm('Are you sure you want to delete this log entry? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await axios.delete(`${urls.backEndURL}/dailyLogs/${logData._id}`);
    
    if (response.status === 200) {
      // Refresh the data to reflect the deletion
      await store.dispatch('fetchDailyLogs');
      console.log('Log deleted successfully');
    }
  } catch (error) {
    console.error('Error deleting log:', error);
    alert('Failed to delete log entry. Please try again.');
  }
};


onMounted(async () => {
  try {
    // Register this component as active
    store.commit('addActiveComponent', 'agentDashboard');
    
    // Selective fetching - only fetch data needed for agent dashboard
    await store.dispatch('fetchForContext', 'agentDashboard');
    
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
    } else {
    }

    // Load custom weeks for the current month
    await loadMonthWeeks()
    
    // Fetch case stats for the agent
    await fetchCaseStats();
  } catch (error) {
    console.error('Error fetching data on mount:', error)
  }
})

onUnmounted(() => {
  // Unregister this component when it's destroyed
  store.commit('removeActiveComponent', 'agentDashboard');
})

// Reload custom weeks when date range (month) changes
watch(currentDateRange, async (newRange) => {
  if (newRange && newRange.length >= 2) {
    await loadMonthWeeks()
  }
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
    grid-template-columns: repeat(6, 1fr); /* 6 columns for smaller cards */
    gap: 12px;
    width: 90vw;
    margin-bottom: 1rem;
    flex-shrink: 0; /* ✅ Prevent it from collapsing or overlapping */

    /* Hide scrollbar for Webkit browsers (Chrome, Safari) */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* IE and Edge */
  }


  .grid-container::-webkit-scrollbar {
    display: none; /* Chrome, Safari, and Opera */
  }

  /* Responsive grid */
  @media (max-width: 1200px) {
    .grid-container {
      grid-template-columns: repeat(4, 1fr); /* 4 columns for medium screens */
      width: 100% !important;
    }
  }

  @media (max-width: 960px) {
    .grid-container {
      grid-template-columns: repeat(3, 1fr); /* 3 columns for tablets */
      width: 100% !important;
    }
  }

  @media (max-width: 600px) {
    .grid-container {
      grid-template-columns: 1fr; /* single column vertical list */
      width: 100% !important;
    }
    
    /* Stack all container elements vertically on mobile */
    .v-container {
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      padding: 8px !important;
    }
    
    /* Make cards and tables full width on mobile */
    .v-card {
      width: 100% !important;
      margin: 8px 0 !important;
    }
    
    /* Mobile table optimizations */
    .v-data-table {
      font-size: 0.875rem;
      width: 100% !important;
    }
    
    .v-data-table th,
    .v-data-table td {
      padding: 12px 8px !important;
      white-space: nowrap !important;
    }
    
    /* Make tables horizontally scrollable on mobile */
    .v-data-table__wrapper {
      overflow-x: auto;
      width: 100% !important;
    }
    
    /* Ensure proper spacing between stacked elements */
    .mx-auto {
      margin-left: 0 !important;
      margin-right: 0 !important;
    }
  }
</style>
