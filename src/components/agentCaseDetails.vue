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

    <v-card v-if="order" class="pa-4">
      <h2>Case Details</h2>

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
  <v-container>
    <v-card class="pa-4 elevation-4" style="background-color: #eeeff1;">
    <v-row>
      <v-col cols="12" md="3">
        <h2 class="text-h5">Case Statistics - {{ getFormattedDateRange() }}</h2>
      </v-col>
      <v-col cols="12" md="3">
        <h2 class="text-h6">Revenue Generate: €{{ revenueGenerated.revenue }}</h2>
      </v-col>
      <v-col cols="12" md="3">
        <h2 class="text-h6">Total Units: {{ revenueGenerated.totalUnits }}</h2>
      </v-col>
      <v-col cols="12" md="3">
        <h2 class="text-h6">{{ t('agentWeeklyGoal.goal') }}: {{ caseGoal }}</h2>
      </v-col>
    </v-row>
    
    <div v-if="isLoadingStats" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="40" />
    </div>
    <template v-else>
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
        </v-data-table>
      </div>

      <!-- Individual Logs Tables by Week -->
      <div v-if="weeklyLogGroups.length > 0">
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
              <v-icon
                icon
                size="small"
                color="grey"
                title="Edit Log"
                @click="editLog(item.originalLog)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-icon>
            </template>
          </v-data-table>
        </div>
      </div>
    </div>
    </template>
  </v-card>
  </v-container>
    
  
</template>

<script setup>
  import { ref, onMounted, computed, watch } from 'vue'
  import axios from 'axios'
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n';
  import { useStore } from 'vuex'
  import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth, getMonthWeeks } from '@/js/dateUtils';
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
  const gcCases = computed(() => store.getters['gcCases'])
  const monthWeeks = ref([])
  const isLoadingStats = ref(false)
  
  const goalTypes = ['hours', 'interviews', 'meetings']
  const orderStatuses = ['pending', 'in-progress', 'completed', 'cancelled', 'on-hold']

  // Selected agent for this case details view:
  // - Prefer explicit ?agentId from route (when coming from agentDashboard)
  // - Fallback to the first assigned caller on the order
  const routeAgentId = computed(() => route.query.agentId ? String(route.query.agentId) : null)
  const selectedAgentId = computed(() => {
    if (routeAgentId.value) return routeAgentId.value
    const firstCaller = order.value?.assignedCallers?.[0]
    const agentId = firstCaller?._id || firstCaller?.id || firstCaller
    return agentId ? String(agentId) : null
  })
  const agentName = id => {
    // Handle both object and string formats
    const agentId = id?._id || id?.id || id;
    const agent = agents.value.find(a => String(a._id) === String(agentId));
    return agent?.name || agentId || 'Unknown';
  };

  const revenueGenerated = computed(() => {
  // Make this reactive to both caseStats and currentDateRange
  const stats = caseStats.value;
  const dateRange = currentDateRange.value;
  
  if (!order.value || !order.value.assignedCallers || !Array.isArray(stats) || !dateRange) {
    return { totalUnits: 0, revenue: '0.00' };
  }
  
  // Get agent ID for filtering - handle both object and string formats
  const agentIdStr = String(selectedAgentId.value || '');
  if (!agentIdStr) {
    console.log('⚠️ Revenue: No selected agent ID');
    return { totalUnits: 0, revenue: '0.00' };
  }
  console.log('💰 Revenue Calculation - Agent ID:', agentIdStr);
  console.log('💰 Revenue Calculation - Assigned callers:', order.value.assignedCallers);
  
  // Filter logs to only include those within the selected date range AND for the specific agent
  const [startDate, endDate] = dateRange;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);
  monthEnd.setHours(23, 59, 59, 999);
  
  console.log('💰 Revenue Calculation - Date range:', { startDate, endDate, monthStart, monthEnd });
  console.log('💰 Revenue Calculation - Total stats:', stats.length);
  
  const filteredStats = stats.filter(log => {
    const logDate = new Date(log.date);
    const isInDateRange = logDate >= monthStart && logDate <= monthEnd;
    
    // Check if this log belongs to the specific agent - handle multiple formats
    const logAgentId = log.agent?._id || log.agent?.id || log.agent || log.agentId;
    const logAgentIdStr = String(logAgentId || '');
    const isAgentLog = logAgentIdStr === agentIdStr;
    
    if (isInDateRange && isAgentLog) {
      console.log('✅ Revenue: Matching log found:', {
        date: log.date,
        caseName: log.caseName,
        agentId: logAgentIdStr,
        quantityCompleted: log.quantityCompleted
      });
    }
    
    return isInDateRange && isAgentLog;
  });
  
  console.log('💰 Revenue Calculation - Filtered stats count:', filteredStats.length);

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

  // Calculate total units and revenue from deduplicated logs for the current case only (excluding test cases)
  const currentCaseName = order.value.caseName;
  const isTest = isTestCase(order.value);
  
  // If it's a test case, return zero revenue
  if (isTest) {
    return { totalUnits: 0, revenue: '0.00' };
  }
  
  const totalUnits = uniqueLogs
    .filter(log => {
      if (log.caseName !== currentCaseName) return false;
      // Also filter out test logs by case name
      const logCaseName = String(log.caseName || '').toLowerCase();
      return !logCaseName.includes('test');
    })
    .reduce((sum, log) => sum + (Number(log.quantityCompleted) || 0), 0);
  const revenue = (totalUnits * (Number(order.value.pricePerUnit) || 0)).toFixed(2);
  
  console.log('Revenue calculation - Total stats:', stats.length);
  console.log('Revenue calculation - Filtered stats:', filteredStats.length);
  console.log('Revenue calculation - Unique logs:', uniqueLogs.length);
  console.log('Revenue calculation - Current case logs:', uniqueLogs.filter(log => log.caseName === currentCaseName).length);
  console.log('Revenue calculation - Total units:', totalUnits);
  console.log('Revenue calculation - Total revenue:', revenue);
  
  return { totalUnits, revenue };
});

// Agent goal for this case (for the selected agent)
const caseGoal = computed(() => {
  if (!order.value || !order.value.agentGoals) {
    return 0;
  }
  const agentIdStr = String(selectedAgentId.value || '');
  if (!agentIdStr) return 0;
  return Number(order.value.agentGoals[agentIdStr] ?? 0);
});

// Headers for weekly totals table
const weeklyHeaders = computed(() => [
  { title: 'Week', key: 'date', sortable: true },
  { title: t('agentTables.callTime'), key: 'callTime', sortable: true },
  { title: t('agentTables.outgoingCalls'), key: 'outgoingCalls', sortable: true },
  { title: t('agentTables.answeredCalls'), key: 'answeredCalls', sortable: true },
  { title: t('agentTables.responseRate'), key: 'responseRate', sortable: true },
  { title: t('agentTables.completedCalls'), key: 'completedCalls', sortable: true },
  { title: t('agentTables.results'), key: 'quantityCompleted', sortable: true },
  { title: t('agentTables.goalReached'), key: 'goalReached', sortable: true },
  { title: t('agentTables.amountMade'), key: 'amountMade', sortable: true },
])

// Headers for individual logs table
const individualHeaders = computed(() => [
  { title: t('agentTables.date'), key: 'date', sortable: true },
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

// Helper function to get week number and year from a date
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return Math.ceil((((d - week1) / 86400000) + week1.getDay() + 1) / 7);
}

// Helper: get matching custom week for a given date from monthWeeks
function getCustomWeekForDate(date) {
  if (!Array.isArray(monthWeeks.value) || monthWeeks.value.length === 0) return null;
  const d = new Date(date);
  return monthWeeks.value.find(w => {
    const start = new Date(w.start);
    const end = new Date(w.end);
    return d >= start && d <= end;
  }) || null;
}

// Weekly totals computed property - across ALL cases for the agent
const weeklyTotals = computed(() => {
  const stats = caseStats.value;
  const dateRange = currentDateRange.value;
  const allOrders = orders.value;
  
  if (!stats || !Array.isArray(stats) || !dateRange || !allOrders) {
    return [];
  }

  // Get selected agent ID
  const agentIdStr = String(selectedAgentId.value || '');
  if (!agentIdStr) {
    console.log('⚠️ Weekly Totals: No selected agent ID');
    return [];
  }
  console.log('📊 Weekly Totals - Agent ID:', agentIdStr);

  const agentCases = allOrders.filter(order => {
    if (!order.assignedCallers) return false;
    // Check if any assigned caller matches the agent ID (handle both object and string formats)
    return order.assignedCallers.some(caller => {
      const callerId = caller?._id || caller?.id || caller;
      return String(callerId) === agentIdStr;
    });
  });
  
  console.log('📊 Weekly Totals - Agent cases found:', agentCases.length);

  // Filter logs to only include those within the selected date range AND for the specific agent AND current case
  const [startDate, endDate] = dateRange;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);
  monthEnd.setHours(23, 59, 59, 999);
  
  const filteredStats = stats.filter(log => {
    const logDate = new Date(log.date);
    const isInDateRange = logDate >= monthStart && logDate <= monthEnd;
    
    // Check if this log belongs to the specific agent - handle multiple formats
    const logAgentId = log.agent?._id || log.agent?.id || log.agent || log.agentId;
    const logAgentIdStr = String(logAgentId || '');
    const isAgentLog = logAgentIdStr === agentIdStr;
    
    // Check if this log is for the current case
    const currentCaseName = order.value.caseName;
    const isCurrentCase = log.caseName === currentCaseName;
    
    return isInDateRange && isAgentLog && isCurrentCase;
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
  console.log('Weekly totals - Agent ID:', agentIdStr);

  // Group logs by custom weeks using deduplicated logs
  const weeks = Array.isArray(monthWeeks.value) ? monthWeeks.value : [];
  const weeklyGroups = {};

  // Initialize groups based on custom weeks to keep ordering consistent
  weeks.forEach((w, idx) => {
    const start = new Date(w.start);
    const end   = new Date(w.end);
    const weekNumber = w.weekNumber || (idx + 1);
    const year  = start.getFullYear();
    const key   = `W${weekNumber}`;

    weeklyGroups[key] = {
      key,
      weekNumber,
      year,
      start,
      end,
      totals: {
        callTime: 0,
        outgoingCalls: 0,
        answeredCalls: 0,
        completedCalls: 0,
        quantityCompleted: 0,
        amountMade: 0
      }
    };
  });

  uniqueLogs.forEach(log => {
    const logDate = new Date(log.date);

    // Find the custom week this log belongs to
    const customWeek = weeks.find(w => {
      const ws = new Date(w.start);
      const we = new Date(w.end);
      return logDate >= ws && logDate <= we;
    });

    if (!customWeek) return;

    const weekNumber = customWeek.weekNumber || (weeks.indexOf(customWeek) + 1);
    const key = `W${weekNumber}`;
    const group = weeklyGroups[key];
    if (!group) return;

    // Add to totals
    const logCallTime = log.call_time || 0;
    const logOutgoingCalls = log.outgoing_calls || 0;
    const logAnsweredCalls = log.answered_calls || 0;
    const logCompletedCalls = log.completed_calls || 0;
    const logQuantityCompleted = log.quantityCompleted || 0;
    
    // Use the current case's price per unit
    const pricePerUnit = Number(order.value.pricePerUnit) || 0;
    const logAmountMade = logQuantityCompleted * pricePerUnit;
    
    group.totals.callTime          += logCallTime;
    group.totals.outgoingCalls     += logOutgoingCalls;
    group.totals.answeredCalls     += logAnsweredCalls;
    group.totals.completedCalls    += logCompletedCalls;
    group.totals.quantityCompleted += logQuantityCompleted;
    group.totals.amountMade        += logAmountMade;
  });

  // Convert to array for weekly totals
  const result = [];
  
  Object.values(weeklyGroups).forEach(group => {
    const { weekNumber, year, start, totals } = group;

    // Skip empty weeks
    if (
      totals.quantityCompleted === 0 &&
      totals.callTime === 0 &&
      totals.outgoingCalls === 0 &&
      totals.answeredCalls === 0
    ) {
      return;
    }

    // Calculate average response rate for the week
    const avgResponseRate = totals.outgoingCalls > 0 
      ? (totals.answeredCalls / totals.outgoingCalls) * 100 
      : 0;
    
    // Since we're only showing the current case, display it
    const casesDisplay = order.value.caseName || 'Current Case';

    // Agent's goal for this case (for selected agent)
    const agentIdForGoal = String(selectedAgentId.value || '');
    const myGoal = Number(order.value?.agentGoals?.[agentIdForGoal] ?? 0);
    const goalReached = myGoal > 0
      ? Number(((totals.quantityCompleted / myGoal) * 100).toFixed(1))
      : 0;

    result.push({
      date: `Week ${weekNumber}, ${year}`,
      cases: casesDisplay,
      caseUnit: 'All Cases',
      callTime: formatNumber(totals.callTime),
      outgoingCalls: totals.outgoingCalls,
      answeredCalls: totals.answeredCalls,
      responseRate: formatNumber(avgResponseRate),
      completedCalls: totals.completedCalls,
      quantityCompleted: totals.quantityCompleted,
      goalReached,
      amountMade: `€${totals.amountMade.toFixed(2)}`,
      originalDate: start,
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
  
  if (!stats || !Array.isArray(stats) || !dateRange || !allOrders) {
    return [];
  }

  // Get selected agent ID
  const agentIdStr = String(selectedAgentId.value || '');
  if (!agentIdStr) {
    console.log('⚠️ Individual Logs: No selected agent ID');
    return [];
  }
  console.log('📋 Individual logs - Agent ID:', agentIdStr);
  console.log('📋 Individual logs - All orders:', allOrders);

  const agentCases = allOrders.filter(order => {
    if (!order.assignedCallers) return false;
    // Check if any assigned caller matches the agent ID (handle both object and string formats)
    return order.assignedCallers.some(caller => {
      const callerId = caller?._id || caller?.id || caller;
      return String(callerId) === agentIdStr;
    });
  });

  console.log('📋 Individual logs - Agent cases:', agentCases);

  // Filter logs to only include those within the selected date range AND for the specific agent AND current case
  const [startDate, endDate] = dateRange;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);
  monthEnd.setHours(23, 59, 59, 999);
  
  const filteredStats = stats.filter(log => {
    const logDate = new Date(log.date);
    const isInDateRange = logDate >= monthStart && logDate <= monthEnd;
    
    // Check if this log belongs to the specific agent - handle multiple formats
    const logAgentId = log.agent?._id || log.agent?.id || log.agent || log.agentId;
    const logAgentIdStr = String(logAgentId || '');
    const isAgentLog = logAgentIdStr === agentIdStr;
    
    // Check if this log is for the current case
    const currentCaseName = order.value.caseName;
    const isCurrentCase = log.caseName === currentCaseName;
    
    return isInDateRange && isAgentLog && isCurrentCase;
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
  console.log('Individual logs - All daily logs for agent:', uniqueLogs);

  // Convert to individual log entries
  return uniqueLogs
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(log => {
      const outgoingCalls = log.outgoing_calls || 0;
      const answeredCalls = log.answered_calls || 0;
      const responseRate = outgoingCalls > 0 ? (answeredCalls / outgoingCalls) * 100 : 0;
      const quantityCompleted = log.quantityCompleted || 0;
      
      // Use the current case's unit and price per unit
      const caseUnit = order.value.caseUnit || 'N/A';
      const pricePerUnit = Number(order.value.pricePerUnit) || 0;
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

// Group individual logs by custom weeks
const weeklyLogGroups = computed(() => {
  const logs = individualLogs.value;
  if (!logs || logs.length === 0 || !Array.isArray(monthWeeks.value) || monthWeeks.value.length === 0) return [];

  console.log('Weekly log groups - Individual logs:', logs);
  console.log('Weekly log groups - Number of logs:', logs.length);

  const weeks = monthWeeks.value;
  const weekGroups = {};
  
  logs.forEach(log => {
    const logDate = new Date(log.originalLog.date);

    const customWeek = weeks.find(w => {
      const ws = new Date(w.start);
      const we = new Date(w.end);
      return logDate >= ws && logDate <= we;
    });

    if (!customWeek) return;

    const weekNumber = customWeek.weekNumber || (weeks.indexOf(customWeek) + 1);
    const key = `W${weekNumber}`;
    
    if (!weekGroups[key]) {
      const start = new Date(customWeek.start);
      const end   = new Date(customWeek.end);
      weekGroups[key] = {
        weekKey: key,
        weekInfo: { start, end, weekNumber, year: start.getFullYear() },
        weekTitle: `Week ${weekNumber}, ${start.getFullYear()}`,
        logs: [],
      };
    }
    
    weekGroups[key].logs.push(log);
  });

  // Convert to array and sort by week (oldest first); limit to 4 weeks as before
  const result = Object.values(weekGroups)
    .sort((a, b) => new Date(a.weekInfo.start) - new Date(b.weekInfo.start))
    .slice(0, 4);

  console.log('Weekly log groups - Final result:', result);
  console.log('Weekly log groups - Number of week groups:', result.length);
  
  return result;
});

  function getCallerNames(order, agents) {
      if (!order.assignedCallers || !Array.isArray(order.assignedCallers)) return 'No callers assigned';
      const agentNames = order.assignedCallers
          .map(caller => {
            // Handle both object and string formats
            const callerId = caller?._id || caller?.id || caller;
            const agent = agents.find(a => String(a._id) === String(callerId));
            return agent?.name || 'Unknown';
          })
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

      const [orderRes, agentRes, ordersRes, casesRes] = await Promise.all([
        axios.get(`${urls.backEndURL}/orders/${orderId}`),
        axios.get(`${urls.backEndURL}/gcAgents`),
        axios.get(`${urls.backEndURL}/orders`),
        axios.get(`${urls.backEndURL}/gcCases`)
      ])
      order.value = orderRes.data
      agents.value = agentRes.data
      
      // Store orders and cases in the store
      store.commit('setOrders', ordersRes.data)
      store.commit('setGcCases', casesRes.data)

      // Load custom weeks for the current month
      if (currentDateRange.value && currentDateRange.value.length >= 2) {
        const [startDate] = currentDateRange.value;
        const d = new Date(startDate);
        const year = d.getFullYear();
        const monthIdx = d.getMonth() + 1;
        monthWeeks.value = await getMonthWeeks(year, monthIdx);
      }

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
    isLoadingStats.value = true;

    if (!order.value || !orders.value) {
      console.log('⚠️ fetchCaseStats: Missing order or orders');
      caseStats.value = [];
      isLoadingStats.value = false;
      return;
    }
    
    try {
      // Get selected agent ID for stats loading
      const agentIdStr = String(selectedAgentId.value || '');
      if (!agentIdStr) {
        console.log('⚠️ fetchCaseStats: No selected agent ID');
        caseStats.value = [];
        return;
      }
      
      console.log('📥 fetchCaseStats - Agent ID:', agentIdStr);

      const agentCases = orders.value.filter(order => {
        if (!order.assignedCallers) return false;
        // Check if any assigned caller matches the agent ID (handle both object and string formats)
        return order.assignedCallers.some(caller => {
          const callerId = caller?._id || caller?.id || caller;
          return String(callerId) === agentIdStr;
        });
      });
      
      console.log('📥 fetchCaseStats - Agent cases found:', agentCases.length);

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
    } finally {
      isLoadingStats.value = false;
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