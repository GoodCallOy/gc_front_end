<template>
  <v-container>
    <!-- Date Navigation Header -->
    <DateHeader 
      :currentDateRange="currentDateRange"
      :monthWeeks="monthWeeks"
      :showMonthOnly="true"
      @prev="getPreviousMonth"
      @next="getNextMonth"
    />

    <v-card v-if="order" class="pa-4"   >
      <v-row justify="space-between">
        <v-col>
          <h2>{{ t('orderDetails.detailsFor', { name: order.caseName }) }}</h2>
        </v-col>
        <v-col cols="auto">
          <v-btn color="primary" @click="editOrder">{{ t('orderDetails.editCase') }}</v-btn>
        </v-col>
      </v-row>


      <div>
        <v-row>
            <v-col cols="3">
                <strong>{{ t('orderDetails.unit') }}:</strong> {{ order.caseUnit }}
            </v-col>
            <v-col cols="3">
                <strong>{{ t('orderDetails.pricePerUnit') }}:</strong> {{ order.pricePerUnit }}
            </v-col>
            <v-col cols="3">
                <strong>{{ t('orderDetails.status') }}:</strong> {{ order.orderStatus }}
            </v-col>
            <v-col cols="3">
                <strong>{{ t('orderDetails.type') }}:</strong> {{ order.caseType || t('orderDetails.nA') }}
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="3">
               <strong>{{ t('orderDetails.deadline') }}:</strong> {{ formatDate(order.deadline) }}
            </v-col>
            <v-col cols="3">
               <strong>{{ t('orderDetails.teamGoal') }}:</strong> {{ order.totalQuantity }}
            </v-col>
            <v-col cols="3">
                <strong>{{ t('orderDetails.estimatedRevenue') }}:</strong> €{{ order.estimatedRevenue }}
            </v-col>
            <v-col cols="3">
                <strong>{{ t('orderDetails.callers') }}:</strong> {{ getCallerNames(order, agents) }}
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <div v-if="order.assignedCallers?.length">
                    <strong>{{ t('orderDetails.agentGoals') }}:</strong>
                    <ul>
                        <li v-for="item in agentGoalsWithAchieved" :key="item.agentId">
                        {{ item.name }}: {{ item.achieved }} / {{ item.target }}
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
      <v-col cols="4">
        <h2 class="text-h5">{{ t('orderDetails.caseStatistics') }} - {{ getFormattedDateRange() }}</h2>
      </v-col>
      <v-col cols="4">
        <h2 class="text-h6">
          {{ t('orderDetails.currentRevenue') }}: 
          <v-progress-circular
            v-if="isCalculatingRevenue"
            indeterminate
            size="20"
            width="2"
            color="primary"
            class="ml-2"
          ></v-progress-circular>
          <span v-else>€{{ revenueGenerated.revenue }}</span>
        </h2>
      </v-col>
      <v-col cols="4">
        <h2 class="text-h6">{{ t('orderDetails.totalUnits') }}: {{ revenueGenerated.totalUnits }}</h2>
      </v-col>
    </v-row>
    
    <p v-if="weeklyTotals.length === 0 && individualLogs.length === 0">{{ t('orderDetails.noStatistics') }}</p>
    <div v-else>
      <!-- Weekly Totals Table -->
      <div v-if="weeklyTotals.length > 0" class="mb-6">
        <h3 class="text-h6 mb-3">{{ t('orderDetails.weeklySummary') }}</h3>
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
      <div>
        <h3 class="text-h6 mb-3 d-flex align-center">
          {{ t('orderDetails.dailyEntriesByWeek') }}
          <v-progress-circular
            v-if="isCalculatingWeeklyLogs"
            indeterminate
            size="20"
            width="2"
            color="primary"
            class="ml-2"
          ></v-progress-circular>
        </h3>
        
        <div v-if="isCalculatingWeeklyLogs" class="text-center pa-4">
          <v-progress-circular
            indeterminate
            size="40"
            width="3"
            color="primary"
            class="mb-2"
          ></v-progress-circular>
          <p class="text-caption text-grey">{{ t('orderDetails.loadingDailyEntries') }}</p>
        </div>
        
        <div v-else-if="weeklyLogGroups.length > 0">
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
            <!-- Comments preview -->
            <template #item.comments="{ item }">
              <span
                v-if="item.comments"
                class="text-truncate"
                style="max-width: 220px; display: inline-block;"
                :title="item.comments"
              >
                {{ item.comments }}
              </span>
              <span v-else class="text-caption text-grey">—</span>
            </template>
            
            <!-- Edit column for individual logs -->
            <template #item.edit="{ item }">
              <v-btn
                icon
                variant="text"
                size="small"
                color="grey"
                :title="t('agentDashboard.editLog')"
                @click.stop="editLog(item.raw?.originalLog ?? item.originalLog)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
            
            <!-- Delete column for individual logs -->
            <template #item.delete="{ item }">
              <v-btn
                v-if="canDeleteLog || true"
                icon
                variant="text"
                size="small"
                color="grey"
                :title="t('agentDashboard.deleteLog')"
                @click.stop="deleteLog(item.raw?.originalLog ?? item.originalLog)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
              <span v-else-if="!canDeleteLog" class="text-caption text-grey">
                {{ t('orderDetails.noPermission') }}
              </span>
            </template>
          </v-data-table>
        </div>
        </div>
      </div>
    </div>
  </v-card>
  </v-container>
    
  
</template>

<script setup>
  import { ref, onMounted, computed, watch, nextTick } from 'vue'
  import axios from 'axios'
  import { useRoute, useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n';
  import { useStore } from 'vuex'
  import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth, getCustomWeekRange, getMonthWeeks } from '@/js/dateUtils';
  import urls from '@/js/config.js'
  import DateHeader from '@/components/DateHeader.vue'


  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()
  const store = useStore()
  const orderId = route.query.orderId
  console.log('Order ID:', orderId)

  const order = ref(null)
  const agents = ref([])
  const caseStats = ref([]);
  const isCalculatingRevenue = ref(false);
  const isCalculatingWeeklyLogs = ref(false);
  
  // Date range functionality
  const currentDateRange = computed(() => store.getters['currentDateRange'])
  const monthWeeks = ref([])
  const orders = computed(() => store.getters['orders'])
  const gcCases = computed(() => store.getters['gcCases'])
  
  const goalTypes = ['hours', 'interviews', 'meetings']
  const orderStatuses = ['pending', 'in-progress', 'completed', 'cancelled', 'on-hold']
  const agentName = id => agents.value.find(a => String(a._id) === String(id?._id ?? id))?.name || (id?._id ?? id) || 'Unknown';

  // Per-agent: target (from agentGoals) + achieved (from caseStats logs in current month)
  const agentGoalsWithAchieved = computed(() => {
    const ord = order.value;
    const stats = caseStats.value;
    const dateRange = currentDateRange.value;
    if (!ord?.assignedCallers?.length) return [];
    const currentCaseName = ord.caseName;
    if (!currentCaseName) return [];
    let monthStart, monthEnd;
    if (dateRange && dateRange.length >= 2) {
      monthStart = new Date(dateRange[0]);
      monthEnd = new Date(dateRange[1]);
      monthEnd.setHours(23, 59, 59, 999);
    }
    const agentGoals = ord.agentGoals || {};
    return ord.assignedCallers.map(rawId => {
      const agentId = String(rawId?._id ?? rawId ?? '');
      const name = agentName(rawId);
      const target = Number(agentGoals[agentId] ?? agentGoals[rawId] ?? 0) || 0;
      let achieved = 0;
      if (stats && Array.isArray(stats) && monthStart && monthEnd) {
        achieved = stats
          .filter(log => {
            const logDate = new Date(log.date);
            if (logDate < monthStart || logDate > monthEnd) return false;
            const logAgentId = String(log.agent?._id ?? log.agent ?? log.agentId ?? '');
            const sameCase = (log.caseName || log.case) === currentCaseName;
            return logAgentId === agentId && sameCase;
          })
          .reduce((sum, log) => sum + (Number(log.quantityCompleted) || 0), 0);
      }
      return { agentId, name, target, achieved };
    });
  });

  // Check if current user can delete logs (managers and admins only)
  const canDeleteLog = computed(() => {
    const currentUser = store.state.user?.user || JSON.parse(localStorage.getItem('auth_user') || 'null');
    console.log('Current user for delete permission:', currentUser);
    console.log('User roles:', currentUser?.roles);
    
    if (!currentUser) {
      console.log('No current user found');
      return false;
    }
    
    const userRoles = currentUser.roles || [];
    const canDelete = userRoles.includes('admin') || userRoles.includes('manager');
    console.log('Can delete logs:', canDelete);
    console.log('User roles array:', userRoles);
    
    return canDelete;
  });

  const revenueGenerated = computed(() => {
  // Make this reactive to both caseStats and currentDateRange
  const stats = caseStats.value;
  const dateRange = currentDateRange.value;
  
  if (!order.value || !Array.isArray(stats) || !dateRange) {
    return { totalUnits: 0, revenue: '0.00' };
  }
  
  const currentCaseName = order.value.caseName;
  if (!currentCaseName) return { totalUnits: 0, revenue: '0.00' };
  
  // Filter logs: within date range AND for the current case (show all logs for the case)
  const [startDate, endDate] = dateRange;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);
  monthEnd.setHours(23, 59, 59, 999);
  
  const filteredStats = stats.filter(log => {
    const logDate = new Date(log.date);
    const isInDateRange = logDate >= monthStart && logDate <= monthEnd;
    const isCurrentCase = (log.caseName || log.case) === currentCaseName;
    return isInDateRange && isCurrentCase;
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

  // Calculate total units from deduplicated logs for the current case only (excluding test cases)
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
  
  return { totalUnits, revenue };
});

// Headers for weekly totals table
const weeklyHeaders = computed(() => [
  { title: t('orderDetails.week'), key: 'date', sortable: true },
  { title: t('agentTables.callTime'), key: 'callTime', sortable: true },
  { title: t('agentTables.outgoingCalls'), key: 'outgoingCalls', sortable: true },
  { title: t('agentTables.answeredCalls'), key: 'answeredCalls', sortable: true },
  { title: t('agentTables.responseRate'), key: 'responseRate', sortable: true },
  { title: t('agentTables.completedCalls'), key: 'completedCalls', sortable: true },
  { title: t('agentTables.results'), key: 'quantityCompleted', sortable: true },
  { title: t('agentTables.amountMade'), key: 'amountMade', sortable: true },
])

// Headers for individual logs table
const individualHeaders = computed(() => [
  { title: t('agentTables.date'), key: 'date', sortable: true },
  { title: t('orderDetails.agent'), key: 'agentName', sortable: true },
  { title: t('agentTables.unit'), key: 'caseUnit', sortable: true },
  { title: t('agentTables.callTime'), key: 'callTime', sortable: true },
  { title: t('agentTables.outgoingCalls'), key: 'outgoingCalls', sortable: true },
  { title: t('agentTables.answeredCalls'), key: 'answeredCalls', sortable: true },
  { title: t('agentTables.responseRate'), key: 'responseRate', sortable: true },
  { title: t('agentTables.completedCalls'), key: 'completedCalls', sortable: true },
  { title: t('agentTables.results'), key: 'quantityCompleted', sortable: true },
  { title: t('dailyLogForm.comments'), key: 'comments', sortable: false },
  { title: t('agentTables.amountMade'), key: 'amountMade', sortable: true },
  { title: t('orderDetails.edit'), key: 'edit', sortable: false, width: '60px' },
  { title: t('orderDetails.delete'), key: 'delete', sortable: false, width: '60px' },
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

// Helper function to get week start and end dates (now uses custom week configuration)
async function getWeekRange(date) {
  try {
    // Try to get custom week configuration first
    const customWeekRange = await getCustomWeekRange(date);
    return customWeekRange;
  } catch (error) {
    console.warn('Failed to get custom week range, using default:', error);
    // Fallback to default week calculation
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
      year: d.getFullYear(),
      isCustom: false
    };
  }
}

// Weekly totals reactive property - for the current case only
const weeklyTotals = ref([]);

// Function to calculate weekly totals with custom week configuration
const calculateWeeklyTotals = async () => {
  const stats = caseStats.value;
  const dateRange = currentDateRange.value;
  const allOrders = orders.value;
  
  if (!stats || !Array.isArray(stats) || !dateRange || !allOrders || !order.value?.caseName) {
    weeklyTotals.value = [];
    return;
  }

  const currentCaseName = order.value.caseName;

  // Filter logs: within date range AND for the current case (show all logs for the case)
  const [startDate, endDate] = dateRange;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);
  monthEnd.setHours(23, 59, 59, 999);
  
  const filteredStats = stats.filter(log => {
    const logDate = new Date(log.date);
    const isInDateRange = logDate >= monthStart && logDate <= monthEnd;
    const isCurrentCase = (log.caseName || log.case) === currentCaseName;
    return isInDateRange && isCurrentCase;
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

  // Group logs by the currently loaded custom month weeks
  const weeks = Array.isArray(monthWeeks.value) ? monthWeeks.value : []
  const weeklyGroups = {}

  // Initialize groups from custom weeks to keep ordering consistent
  weeks.forEach((w, idx) => {
    const start = new Date(w.start)
    const end = new Date(w.end)
    const weekNumber = w.weekNumber || (idx + 1)
    const year = start.getFullYear()
    const weekKey = `${year}-W${weekNumber}`
    weeklyGroups[weekKey] = {
      weekKey,
      weekInfo: { start, end, weekNumber, year, isCustom: true },
      logs: [],
      cases: new Set(),
      totals: {
        callTime: 0,
        outgoingCalls: 0,
        answeredCalls: 0,
        completedCalls: 0,
        quantityCompleted: 0,
        amountMade: 0
      }
    }
  })

  // Assign logs to their custom week bucket
  for (const log of uniqueLogs) {
    const logDate = new Date(log.date)
    const targetWeekKey = weeks.reduce((found, w, idx) => {
      if (found) return found
      const start = new Date(w.start)
      const end = new Date(w.end)
      if (logDate >= start && logDate <= end) {
        const wn = w.weekNumber || (idx + 1)
        const y = start.getFullYear()
        return `${y}-W${wn}`
      }
      return null
    }, null)

    if (!targetWeekKey || !weeklyGroups[targetWeekKey]) continue

    weeklyGroups[targetWeekKey].logs.push(log)
    weeklyGroups[targetWeekKey].cases.add(log.caseName)

    // Skip test cases in revenue calculations
    const logCaseName = String(log.caseName || '').toLowerCase();
    const isTestLog = logCaseName.includes('test');
    const isTestOrder = isTestCase(order.value);
    
    const logCallTime = log.call_time || 0
    const logOutgoingCalls = log.outgoing_calls || 0
    const logAnsweredCalls = log.answered_calls || 0
    const logCompletedCalls = log.completed_calls || 0
    const logQuantityCompleted = log.quantityCompleted || 0
    const pricePerUnit = order.value?.pricePerUnit || 0
    // Only count revenue if not a test case
    const logAmountMade = (isTestLog || isTestOrder) ? 0 : logQuantityCompleted * pricePerUnit

    weeklyGroups[targetWeekKey].totals.callTime += logCallTime
    weeklyGroups[targetWeekKey].totals.outgoingCalls += logOutgoingCalls
    weeklyGroups[targetWeekKey].totals.answeredCalls += logAnsweredCalls
    weeklyGroups[targetWeekKey].totals.completedCalls += logCompletedCalls
    weeklyGroups[targetWeekKey].totals.quantityCompleted += logQuantityCompleted
    weeklyGroups[targetWeekKey].totals.amountMade += logAmountMade
  }

  // Convert to array for weekly totals
  const result = [];
  
  Object.values(weeklyGroups).forEach(group => {
    // Calculate average response rate for the week
    const avgResponseRate = group.totals.outgoingCalls > 0 
      ? (group.totals.answeredCalls / group.totals.outgoingCalls) * 100 
      : 0;
    
    // Convert cases set to sorted array for display
    const casesList = Array.from(group.cases).sort();
    const casesDisplay = casesList.length > 0 ? casesList.join(', ') : t('agentDashboard.noCases');
    
    // Show date range for clarity
    const s = new Date(group.weekInfo.start)
    const e = new Date(group.weekInfo.end)
    const fmt = (d) => `${String(d.getMonth()+1).padStart(2,'0')}-${d.getDate()}`
    result.push({
      date: `${t('orderDetails.week')} ${group.weekInfo.weekNumber}, ${fmt(s)} to ${fmt(e)}`,
      cases: casesDisplay,
      caseUnit: t('agentDashboard.allCases'),
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
  weeklyTotals.value = result.sort((a, b) => new Date(a.originalDate) - new Date(b.originalDate));
};

// Watch for changes in data that affect weekly totals
watch([caseStats, currentDateRange, order], () => {
  calculateWeeklyTotals();
}, { deep: true });

// Watch for changes that affect revenue calculation
watch([caseStats, currentDateRange, order], () => {
  isCalculatingRevenue.value = true;
  // Use nextTick to ensure the computed property has updated
  nextTick(() => {
    isCalculatingRevenue.value = false;
  });
}, { deep: true });

// (moved below, after individualLogs and calculateWeeklyLogGroups are defined)

// Individual logs computed property - for all agents assigned to the current case
const individualLogs = computed(() => {
  const stats = caseStats.value;
  const dateRange = currentDateRange.value;
  const allOrders = orders.value;
  
  if (!stats || !Array.isArray(stats) || !dateRange || !allOrders) {
    return [];
  }

  const currentCaseName = order.value?.caseName;
  if (!currentCaseName) return [];

  // Filter logs: within date range AND for the current case (show all logs for the case)
  const [startDate, endDate] = dateRange;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);
  monthEnd.setHours(23, 59, 59, 999);
  
  const filteredStats = stats.filter(log => {
    const logDate = new Date(log.date);
    const isInDateRange = logDate >= monthStart && logDate <= monthEnd;
    const isCurrentCase = (log.caseName || log.case) === currentCaseName;
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
  console.log('Individual logs - All daily logs for agent:', uniqueLogs);

  // Convert to individual log entries
  return uniqueLogs
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(log => {
      const outgoingCalls = log.outgoing_calls || 0;
      const answeredCalls = log.answered_calls || 0;
      const responseRate = outgoingCalls > 0 ? (answeredCalls / outgoingCalls) * 100 : 0;
      const quantityCompleted = log.quantityCompleted || 0;
      
      // Use the current order's data since we're only showing current case data
      const caseUnit = order.value?.caseUnit || 'N/A';
      // Skip test cases in revenue calculations
      const logCaseName = String(log.caseName || '').toLowerCase();
      const isTestLog = logCaseName.includes('test');
      const isTestOrder = isTestCase(order.value);
      
      const pricePerUnit = order.value?.pricePerUnit || 0;
      // Only count revenue if not a test case
      const amountMade = (isTestLog || isTestOrder) ? '0.00' : (quantityCompleted * pricePerUnit).toFixed(2);

      // Get agent name
      const logAgentId = log.agent?._id || log.agent || log.agentId;
      const agentName = agents.value.find(a => String(a._id) === String(logAgentId))?.name || log.agentName || 'Unknown Agent';

      return {
        date: formatDateToDDMMYYYY(log.date),
        agentName,
        caseName: log.caseName || 'Unknown Case',
        caseUnit,
        callTime: formatNumber(log.call_time || 0),
        outgoingCalls,
        answeredCalls,
        responseRate: formatNumber(responseRate),
        completedCalls: log.completed_calls || 0,
        quantityCompleted,
        comments: log.comments || '',
        amountMade: `€${amountMade}`,
        originalLog: log,
      };
    });
});

// Group individual logs by week (now reactive with custom week configuration)
const weeklyLogGroups = ref([]);

const calculateWeeklyLogGroups = async () => {
  const logs = individualLogs.value;
  
  // Set loading state
  console.log('Setting isCalculatingWeeklyLogs to true');
  isCalculatingWeeklyLogs.value = true;
  
  if (!logs || logs.length === 0) {
    console.log('No logs found, setting loading to false');
    weeklyLogGroups.value = [];
    isCalculatingWeeklyLogs.value = false;
    return;
  }

  console.log('Weekly log groups - Individual logs:', logs);
  console.log('Weekly log groups - Number of logs:', logs.length);

  const weeks = Array.isArray(monthWeeks.value) ? monthWeeks.value : []
  const weekGroups = {}

  // Initialize groups for titles/stable order
  weeks.forEach((w, idx) => {
    const start = new Date(w.start)
    const end = new Date(w.end)
    const wn = w.weekNumber || (idx + 1)
    const y = start.getFullYear()
    const key = `${y}-W${wn}`
    weekGroups[key] = {
      weekKey: key,
      weekInfo: { start, end, weekNumber: wn, year: y, isCustom: true },
      weekTitle: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      logs: []
    }
  })

  // Assign logs
  for (const log of logs) {
    const d = new Date(log.originalLog.date)
    const key = weeks.reduce((found, w, idx) => {
      if (found) return found
      const s = new Date(w.start)
      const e = new Date(w.end)
      if (d >= s && d <= e) {
        const wn = w.weekNumber || (idx + 1)
        const y = s.getFullYear()
        return `${y}-W${wn}`
      }
      return null
    }, null)
    if (key && weekGroups[key]) weekGroups[key].logs.push(log)
  }

  // Convert to array, sort by week, and filter to only weeks up to current (exclude future weeks)
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const result = Object.values(weekGroups)
    .filter((w) => new Date(w.weekInfo.start) <= today) // Only include weeks that have started
    .sort((a, b) => new Date(a.weekInfo.start) - new Date(b.weekInfo.start))
    .slice(0, 4); // Limit to 4 weeks

  console.log('Weekly log groups - Final result:', result);
  console.log('Weekly log groups - Number of week groups:', result.length);
  
  weeklyLogGroups.value = result;
  
  // Clear loading state
  console.log('Setting isCalculatingWeeklyLogs to false');
  isCalculatingWeeklyLogs.value = false;
};

// Watch for changes in individual logs that affect weekly log groups
watch(individualLogs, () => {
  calculateWeeklyLogGroups();
}, { deep: true });

  function getCallerNames(order, agents) {
      const agentNames = order.assignedCallers
          .map(id => agents.find(agent => agent._id === id)?.name || 'Unknown')
          .join(', ')
      console.log('Agent Names:', agentNames);
      return agentNames
  }

  // Date navigation functions
  function getFormattedDateRange() {
    return formattedDateRange(currentDateRange.value)
  }

  function getPreviousMonth() {
    const prevMonth = goToPreviousMonth(currentDateRange.value)
    updateDateRange(prevMonth)
  }

  function getNextMonth() {
    const nextMonth = goToNextMonth(currentDateRange.value)
    updateDateRange(nextMonth)
  }

  function updateDateRange(newRange) {
    store.commit('setDateRange', newRange)
  }

  // Fetch case stats for all cases the agent is assigned to
  const fetchCaseStats = async () => {
    if (!order.value || !orders.value) return;
    
    try {
      // Set loading state when starting to fetch case stats
      isCalculatingWeeklyLogs.value = true;
      console.log('Starting to fetch case stats, setting loading to true');
      
      const currentCaseName = order.value?.caseName;
      if (!currentCaseName) {
        console.log('No case name found, clearing loading state');
        isCalculatingWeeklyLogs.value = false;
        caseStats.value = [];
        return;
      }

      // Fetch logs for the current order's case directly (not filtered by first agent)
      const allStats = [];
      try {
        console.log(`Fetching stats for case: ${currentCaseName}`);
        const response = await axios.get(
          `${urls.backEndURL}/dailyLogs/${encodeURIComponent(currentCaseName)}`
        );
        const data = response.data;
        allStats.push(...(Array.isArray(data) ? data : []));
        console.log(`Got ${allStats.length} logs for case: ${currentCaseName}`);
      } catch (error) {
        console.warn(`Error fetching stats for case ${currentCaseName}:`, error);
      }

      caseStats.value = allStats;
      console.log('All Agent Case Stats loaded:', caseStats.value);
      
      // Clear loading state after case stats are loaded
      isCalculatingWeeklyLogs.value = false;
      console.log('Case stats loaded, setting loading to false');
    } catch (error) {
      console.error('Error fetching case stats:', error);
      caseStats.value = [];
      isCalculatingWeeklyLogs.value = false;
    }
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
      
      // Store all orders and cases in Vuex
      store.commit('setOrders', ordersRes.data)
      store.commit('setGcCases', casesRes.data)

      // Load custom weeks for current month
      await loadMonthWeeks()

      // Fetch case stats for all cases the agent is assigned to
      await fetchCaseStats();
    } catch (error) {
      console.error('Error in onMounted:', error);
    }
  })

  // Reload custom weeks when date range (month) changes
  watch(currentDateRange, async (newRange) => {
    if (newRange && newRange.length >= 2) {
      isCalculatingWeeklyLogs.value = true;
      await loadMonthWeeks()
      console.log('[orderDetails] month changed -> custom weeks:', (monthWeeks.value || []).map((w, i) => ({
        weekNumber: w.weekNumber || (i + 1),
        start: new Date(w.start).toISOString().split('T')[0],
        end: new Date(w.end).toISOString().split('T')[0]
      })))
      await calculateWeeklyTotals()
      await calculateWeeklyLogGroups()
    }
  })

  // Recalculate when custom weeks change
  watch(monthWeeks, async () => {
    isCalculatingWeeklyLogs.value = true;
    await calculateWeeklyTotals()
    await calculateWeeklyLogGroups()
  }, { deep: true })

  async function loadMonthWeeks() {
    try {
      if (!currentDateRange.value || currentDateRange.value.length < 2) return
      const [startDate] = currentDateRange.value
      const d = new Date(startDate)
      const year = d.getFullYear()
      const month = d.getMonth() + 1
      monthWeeks.value = await getMonthWeeks(year, month)
      console.log('[orderDetails] loaded custom weeks:', (monthWeeks.value || []).map((w, i) => ({
        weekNumber: w.weekNumber || (i + 1),
        start: new Date(w.start).toISOString().split('T')[0],
        end: new Date(w.end).toISOString().split('T')[0]
      })))
    } catch (e) {
      console.warn('Failed to load month weeks:', e)
      monthWeeks.value = []
    }
  }

  const editOrder = () => {
    // Navigate to the edit order form
    router.push({ name: 'editOrderForm', params: { id: orderId } });
  }

  const editLog = (logData) => {
    // Add order ID to log data if not present (for case selection in form)
    const logWithOrder = {
      ...logData,
      order: logData.order || order.value?._id || null,
      caseName: logData.caseName || order.value?.caseName || ''
    };
    
    // Navigate to the daily log form with the log data for editing
    router.push({ 
      name: 'addDailyLog', 
      query: { editLog: JSON.stringify(logWithOrder) }
    });
  }

  const deleteLog = async (logData) => {
    if (!canDeleteLog.value) {
      console.warn('User does not have permission to delete logs');
      return;
    }

    // Confirm deletion
    if (!confirm(t('agentDashboard.confirmDeleteLog'))) {
      return;
    }

    try {
      const response = await axios.delete(`${urls.backEndURL}/dailyLogs/${logData._id}`, {
        withCredentials: true
      });

      if (response.status === 200) {
        console.log('Log deleted successfully');
        
        // Remove the log from local state
        const logIndex = caseStats.value.findIndex(log => log._id === logData._id);
        if (logIndex !== -1) {
          caseStats.value.splice(logIndex, 1);
        }

        // Recalculate weekly totals and log groups
        await calculateWeeklyTotals();
        await calculateWeeklyLogGroups();
        
        // Show success message (you could add a toast notification here)
        alert(t('agentDashboard.logDeletedSuccessfully'));
      }
    } catch (error) {
      console.error('Error deleting log:', error);
      alert(t('agentDashboard.failedToDeleteLog'));
    }
  }

  const formatDate = dateStr => new Date(dateStr).toLocaleDateString()
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
::deep(.v-data-table) {
  width: 100% !important;
}

::deep(.v-data-table__wrapper) {
  width: 100% !important;
  overflow-x: auto; /* allow horizontal scroll when columns exceed viewport */
}

/* Ensure the internal table can extend beyond the container if needed */
::deep(.v-data-table table) {
  min-width: 1100px; /* adjust as needed so all columns fit; enables horizontal scroll */
}

</style>