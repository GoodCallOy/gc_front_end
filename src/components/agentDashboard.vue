<template>
  <v-container fluid class="agent-dashboard-container">
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
    <v-card v-if="userOrders.length > 0" class="mx-auto my-2 pa-4 elevation-4" style="background-color: #eeeff1;">
      <v-row align="center" dense>
        <v-col cols="12" md="3" class="py-0">
          <div class="text-h5">
            {{ t('agentDashboard.agentStatistics') }} - {{ getFormattedDateRange() }}
          </div>
        </v-col>
        <v-col cols="12" md="3" class="py-0">
          <div class="text-h6">
            {{ t('agentDashboard.revenue') }}: €{{ revenueGenerated.revenue }}
          </div>
        </v-col>
        <v-col cols="12" md="3" class="py-0">
          <div class="text-h6">
            {{ t('agentDashboard.myRateRevenue') }}: €{{ revenueGenerated.myRateRevenue }}
          </div>
        </v-col>
        <v-col cols="12" md="3" class="py-0">  
          <div class="d-flex flex-wrap" style="gap: 12px;">
            <div class="text-body-2">
              {{ t('agentCaseCard.interviews') }}: {{ revenueGenerated.unitsByType.interviews }}
            </div>
            <div class="text-body-2">
              {{ t('agentCaseCard.hours') }}: {{ revenueGenerated.unitsByType.hours }}
            </div>
            <div class="text-body-2">
              {{ t('agentCaseCard.meetings') }}: {{ revenueGenerated.unitsByType.meetings }}
            </div>
            <div class="text-body-2">
              {{ t('dailyLogForm.aLeads') }}: {{ revenueGenerated.unitsByType.aLeads }}
            </div>
          </div>
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
      <div class="d-flex align-center justify-space-between mb-4">
        <h1 class="text-h4 mb-0">
          {{ t('agentDashboard.casesFor') }} {{ selectedGcAgent ? selectedGcAgent.name : '—' }}
        </h1>
        <v-select
          v-if="currentUser?.role === 'admin' || currentUser?.role === 'manager'"
          v-model="selectedAgentName"
          :items="activeGcAgents"
          item-title="name"
          item-value="name"
          density="compact"
          hide-details
          style="max-width: 260px;"
          :label="t('agentDashboard.casesFor')"
        />
      </div>

      <div v-if="isLoadingDashboard" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="40" />
      </div>
      <template v-else>
        <v-tabs v-model="casesViewTab" density="comfortable" class="mb-4">
          <v-tab value="table">{{ t('ordersDashboard.tabs.tables') }}</v-tab>
          <v-tab value="cards">{{ t('ordersDashboard.tabs.cards') }}</v-tab>
        </v-tabs>

        <v-window v-model="casesViewTab">
          <v-window-item value="table">
            <v-card elevation="1">
              <v-data-table
                :headers="casesTableHeaders"
                :items="casesTableRows"
                item-value="_id"
                class="elevation-0"
                :items-per-page="25"
                density="comfortable"
                @click:row="(event, row) => goToCaseDetails(row?.item ?? row)"
              >
                <template #item.callers="{ item }">
                  {{ getCallerNames(item?.raw ?? item) }}
                </template>
                <template #item.myGoal="{ item }">
                  {{ (item?.raw ?? item)?.myGoal }}
                </template>
                <template #item.myUnits="{ item }">
                  {{ (item?.raw ?? item)?.myAgentUnits }} / {{ (item?.raw ?? item)?.myGoal || 0 }}
                </template>
                <template #item.teamUnits="{ item }">
                  {{ (item?.raw ?? item)?.teamUnits }} / {{ (item?.raw ?? item)?.teamGoal || 0 }}
                </template>
                <template #item.myRevenueGoal="{ item }">
                  {{ formatCurrency((item?.raw ?? item)?.myRevenueGoal) }}
                </template>
                <template #item.currentRevenue="{ item }">
                  {{ formatCurrency((item?.raw ?? item)?.currentRevenue) }}
                </template>
                <template #item.myRate="{ item }">
                  €{{ (item?.raw ?? item)?.myRate?.toFixed ? (item?.raw ?? item)?.myRate.toFixed(2) : (item?.raw ?? item)?.myRate || 0 }}
                </template>
                <template #item.percentage="{ item }">
                  {{ (item?.raw ?? item)?.percentage }}%
                </template>
                <template #item.deadline="{ item }">
                  {{ formatDateForTable((item?.raw ?? item)?.deadline) }}
                </template>
              </v-data-table>
            </v-card>
          </v-window-item>

          <v-window-item value="cards">
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
          </v-window-item>
        </v-window>
      </template>
    </div>
    

  <!-- Weekly Totals Table -->
  <v-card v-if="userOrders.length > 0 && weeklyTotals.length > 0" class="mx-auto my-4 pa-4 elevation-4" style="background-color: #eeeff1;">
    <h3 class="text-h6 mb-3">{{ t('agentDashboard.weeklySummary') }}</h3>
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
    <h3 class="text-h6 mb-3">{{ t('agentDashboard.dailyEntriesByWeek') }}</h3>
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
            icon
            variant="text"
            size="small"
            color="grey"
            :title="t('agentDashboard.deleteLog')"
            @click.stop="deleteLog(item.raw?.originalLog ?? item.originalLog)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </div>
  </v-card>

  <!-- Weekly goals by project (per week) -->
  <v-card v-if="userOrders.length > 0" class="mx-auto my-4 pa-4 elevation-4" style="background-color: #eeeff1;">
  <h3 class="text-h6 mb-3">{{ t('agentDashboard.weeklyGoalsByCase') }}</h3>
  <div v-if="weeklyGoalsByWeek.length > 0">
    <div
      v-for="group in weeklyGoalsByWeek"
      :key="group.weekKey"
      class="mb-6"
    >
      <h4 class="text-subtitle-1 mb-2">
        {{ group.weekLabel }}
      </h4>
      <v-data-table
        :headers="weeklyGoalsHeaders"
        :items="group.rows"
        class="elevation-1"
        density="comfortable"
        :items-per-page="10"
        style="width: 100%"
      >
        <template #item.goalReached="{ item }">
          {{ item.goalReached }}%
        </template>
        <template #item.edit="{ item }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="grey"
            :title="t('agentDashboard.editGoal')"
            @click.stop="openEditWeeklyGoalDialog(item)"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>
        <template #item.delete="{ item }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="grey"
            :title="t('agentDashboard.deleteWeeklyGoal')"
            @click.stop="deleteWeeklyGoal(item)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </div>
  </div>
  <p v-else class="text-body-2 text-grey">{{ t('agentDashboard.noWeeklyGoals') }}</p>
</v-card>

  <!-- Edit weekly goal dialog -->
  <v-dialog v-model="editWeeklyGoalDialog" max-width="400" persistent>
    <v-card>
      <v-card-title>{{ t('agentDashboard.editWeeklyGoal') }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model.number="editWeeklyGoalValue"
          type="number"
          min="0"
          :label="t('agentWeeklyGoal.goal')"
          density="comfortable"
          hide-details
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="editWeeklyGoalDialog = false">Cancel</v-btn>
        <v-btn color="primary" :loading="editWeeklyGoalSaving" @click="saveEditedWeeklyGoal">{{ t('agentDashboard.saveGoal') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  </v-container>
  
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth, getMonthWeeks } from '@/js/dateUtils';
import { fetchAgentgoalsByAgentAndMonth } from '@/js/statsUtils';
import agentCaseCard from './agentCaseCard.vue'
import axios from 'axios'
import urls from '@/js/config.js'

const store = useStore()
const router = useRouter()
const route = useRoute()
const userOrders = ref([])
const caseStats = ref([])
const isLoadingDashboard = ref(false)
const monthWeeks = ref([])
const agentWeeklyGoals = ref([])
const casesViewTab = ref('table')
const editWeeklyGoalDialog = ref(false)
const editWeeklyGoalValue = ref(0)
const editWeeklyGoalSaving = ref(false)
const editingGoalRow = ref(null)
const { t } = useI18n()

const orders = computed(() => store.getters['orders'])
const gcAgents = computed(() => store.getters['gcAgents'])
const activeGcAgents = computed(() =>
  (gcAgents.value || []).filter(agent => agent.active !== false)
)
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

function formatDateForTable(dateString) {
  if (!dateString) return '';
  const date = typeof dateString === 'string' && dateString.includes('T')
    ? new Date(dateString.split('T')[0])
    : new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString();
}

function getCallerNames(order) {
  if (!order?.assignedCallers || !Array.isArray(order.assignedCallers)) return '';
  const agents = gcAgents.value || [];
  return order.assignedCallers
    .map(x => {
      const id = x?._id ?? x?.id ?? x;
      return agents.find(a => String(a._id ?? a.id) === String(id))?.name || t('assignGoals.unknownAgent') || '—';
    })
    .join(', ');
}

function goToCaseDetails(row) {
  if (!row?._id) return;
  const agentId = selectedGcAgent.value?._id ?? selectedGcAgent.value?.id;
  router.push({
    name: 'agentCaseDetails',
    query: {
      orderId: row._id,
      agentId: agentId ? String(agentId) : undefined,
    },
  });
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

// Helper function to find the correct order for a log
// Handles cases where multiple orders have the same caseName but different prices
// Always uses the most recent order (by deadline) to ensure latest pricePerUnit
function findOrderForLog(log, availableOrders) {
  if (!log || !availableOrders || !availableOrders.length) return null;
  
  const matchingOrders = availableOrders.filter(order => order.caseName === log.caseName);
  
  if (matchingOrders.length === 0) return null;
  if (matchingOrders.length === 1) return matchingOrders[0];
  
  // Multiple orders match - always use the most recent one (by deadline) to get latest pricePerUnit
  // Sort by deadline descending (most recent first), then by startDate descending as fallback
  return matchingOrders.sort((a, b) => {
    const deadlineA = new Date(a.deadline || a.startDate || 0);
    const deadlineB = new Date(b.deadline || b.startDate || 0);
    if (deadlineB.getTime() !== deadlineA.getTime()) {
      return deadlineB - deadlineA; // Most recent deadline first
    }
    // If deadlines are equal, sort by startDate
    const startA = new Date(a.startDate || 0);
    const startB = new Date(b.startDate || 0);
    return startB - startA; // Most recent startDate first
  })[0];
}

// Revenue calculation for all agent cases
const revenueGenerated = computed(() => {
  const stats = caseStats.value;
  const dateRange = currentDateRange.value;
  const allOrders = orders.value || [];
  
  console.log('💰 Revenue Calculation Started');
  console.log('📊 Inputs:', {
    statsCount: stats?.length || 0,
    dateRange,
    agent: selectedGcAgent.value?.name || 'N/A'
  });
  
  if (!selectedGcAgent.value || !Array.isArray(stats) || !dateRange) {
    console.log('⚠️ Revenue Calculation: Missing required data');
    return { 
      totalUnits: 0, 
      revenue: '0.00',
      myRateRevenue: '0.00',
      myRate: '0.00',
      unitsByType: {
        interviews: 0,
        hours: 0,
        meetings: 0,
        aLeads: 0
      }
    };
  }
  
  const agentId = String(selectedGcAgent.value._id ?? selectedGcAgent.value.id);
  console.log('👤 Agent ID:', agentId);
  
  // Filter logs to only include those within the selected date range AND for the specific agent
  const [startDate, endDate] = dateRange;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);
  monthEnd.setHours(23, 59, 59, 999);
  
  console.log('📅 Date Range:', {
    start: startDate,
    end: endDate,
    monthStart: monthStart.toISOString(),
    monthEnd: monthEnd.toISOString()
  });
  
  // Check if target log exists in stats
  const targetLogId = '6932e3779ba092ac6bfc8fb6';
  const targetLog = stats.find(log => String(log._id || log.id || '') === targetLogId);
  if (targetLog) {
    console.log('🎯 TARGET LOG FOUND in stats:', {
      _id: targetLog._id,
      date: targetLog.date,
      agent: targetLog.agent,
      agentId: targetLog.agent?._id || targetLog.agent?.id || targetLog.agent || targetLog.agentId,
      caseName: targetLog.caseName,
      quantityCompleted: targetLog.quantityCompleted,
      fullLog: targetLog
    });
  } else {
    console.log('⚠️ TARGET LOG NOT FOUND in stats array');
  }
  
  const filteredStats = stats.filter(log => {
    const logId = String(log._id || log.id || '');
    const isTargetLog = logId === targetLogId;
    
    const logDate = new Date(log.date);
    const isInDateRange = logDate >= monthStart && logDate <= monthEnd;
    
    // Check if this log belongs to the specific agent
    const logAgentId = log.agent?._id || log.agent?.id || log.agent || log.agentId;
    const isAgentLog = String(logAgentId) === String(agentId);
    
    if (isTargetLog) {
      console.log('🎯 TARGET LOG filtering check:', {
        logDate: logDate.toISOString(),
        monthStart: monthStart.toISOString(),
        monthEnd: monthEnd.toISOString(),
        isInDateRange,
        logAgentId: String(logAgentId),
        expectedAgentId: String(agentId),
        isAgentLog,
        willBeIncluded: isInDateRange && isAgentLog
      });
    }
    
    return isInDateRange && isAgentLog;
  });

  console.log(`🔍 Filtered ${filteredStats.length} logs after date/agent filtering (from ${stats.length} total)`);
  
  // Check if target log made it through filtering
  const targetLogInFiltered = filteredStats.find(log => String(log._id || log.id || '') === targetLogId);
  if (targetLogInFiltered) {
    console.log('✅ TARGET LOG passed date/agent filtering');
  } else if (targetLog) {
    console.log('❌ TARGET LOG was filtered out during date/agent filtering');
  }

  // Add deduplication to prevent double counting
  const uniqueLogs = [];
  const seenLogs = new Set();
  
  filteredStats.forEach(log => {
    const logId = String(log._id || log.id || '');
    const isTargetLog = logId === targetLogId;
    
    // Create a unique key for deduplication
    const logKey = `${log.date}_${log.agentName || log.agent}_${log.caseName}_${log._id || log.id}`;
    
    if (!seenLogs.has(logKey)) {
      seenLogs.add(logKey);
      uniqueLogs.push(log);
      if (isTargetLog) {
        console.log('✅ TARGET LOG added to uniqueLogs:', { logKey, log });
      }
    } else {
      if (isTargetLog) {
        console.log('❌ TARGET LOG marked as duplicate and skipped:', {
          date: log.date,
          caseName: log.caseName,
          agent: log.agentName || log.agent,
          _id: log._id || log.id,
          logKey
        });
      }
      console.log('🚫 Duplicate log skipped:', {
        date: log.date,
        caseName: log.caseName,
        agent: log.agentName || log.agent,
        _id: log._id || log.id
      });
    }
  });

  console.log(`✅ After deduplication: ${uniqueLogs.length} unique logs`);
  
  // Check if target log is in uniqueLogs
  const targetLogInUnique = uniqueLogs.find(log => String(log._id || log.id || '') === targetLogId);
  if (targetLogInUnique) {
    console.log('✅ TARGET LOG is in uniqueLogs');
  } else if (targetLogInFiltered) {
    console.log('❌ TARGET LOG was removed during deduplication');
  }

  // Calculate total units and revenue from deduplicated logs for ALL cases the agent is assigned to (excluding test cases)
  const agentCases = allOrders.filter(order => {
    if (!order.assignedCallers) return false;
    
    // Handle both object and string formats for assignedCallers
    const isAssigned = order.assignedCallers.some(caller => {
      const callerId = caller?._id || caller?.id || caller;
      return String(callerId) === String(agentId);
    });
    
    const isTest = isTestCase(order);
    
    return isAssigned && !isTest;
  });
  
  console.log(`📦 Found ${agentCases.length} agent cases (excluding test cases):`, 
    agentCases.map(c => ({ name: c.caseName, pricePerUnit: c.pricePerUnit, caseUnit: c.caseUnit, _id: c._id }))
  );
  
  // Check if target log's case is in agentCases
  if (targetLogInUnique) {
    const targetCaseName = targetLogInUnique.caseName;
    const targetCaseInAgentCases = agentCases.find(c => c.caseName === targetCaseName);
    if (targetCaseInAgentCases) {
      console.log('✅ TARGET LOG case found in agentCases:', {
        caseName: targetCaseName,
        order: targetCaseInAgentCases
      });
    } else {
      console.log('❌ TARGET LOG case NOT found in agentCases:', {
        caseName: targetCaseName,
        availableCases: agentCases.map(c => c.caseName)
      });
    }
  }
  
  let totalUnits = 0;
  let totalRevenue = 0;
  let totalMyRateRevenue = 0;
  const revenueBreakdown = [];
  
  // Track units by type
  const unitsByType = {
    interviews: 0,
    hours: 0,
    meetings: 0,
    aLeads: 0
  };
  
  uniqueLogs.forEach((log, index) => {
    const logId = String(log._id || log.id || '');
    const isTargetLog = logId === targetLogId;
    
    if (isTargetLog) {
      console.log('🎯 TARGET LOG in revenue calculation loop:', {
        index: index + 1,
        caseName: log.caseName,
        quantityCompleted: log.quantityCompleted,
        agentCases: agentCases.map(c => c.caseName)
      });
    }
    
    // Check if log case name indicates test
    const caseName = String(log.caseName || '').toLowerCase();
    if (caseName.includes('test')) {
      if (isTargetLog) {
        console.log('❌ TARGET LOG skipped: test case name');
      }
      console.log(`🚫 Log ${index + 1}: Skipped (test case) - ${log.caseName}`);
      return;
    }
    
    const logQuantityCompleted = Number(log.quantityCompleted) || 0;
    totalUnits += logQuantityCompleted;
    
    // Find the case for this log to get the correct price per unit and case unit type
    const logCase = findOrderForLog(log, agentCases);
    
    if (isTargetLog) {
      const matchingOrders = agentCases.filter(c => c.caseName === log.caseName);
      console.log('🎯 TARGET LOG case matching:', {
        logCaseName: log.caseName,
        logDate: log.date,
        allMatchingOrders: matchingOrders.map(o => ({
          _id: o._id,
          caseName: o.caseName,
          pricePerUnit: o.pricePerUnit,
          startDate: o.startDate,
          deadline: o.deadline
        })),
        selectedOrder: logCase ? {
          _id: logCase._id,
          caseName: logCase.caseName,
          pricePerUnit: logCase.pricePerUnit,
          startDate: logCase.startDate,
          deadline: logCase.deadline
        } : 'NOT FOUND'
      });
    }
    
    if (logCase && !isTestCase(logCase)) {
      const pricePerUnit = Number(logCase.pricePerUnit) || 0;
      const logRevenue = logQuantityCompleted * pricePerUnit;
      totalRevenue += logRevenue;

      // Agent-specific rate revenue (from agentRates on the order)
      const rawAgentRates = logCase.agentRates || logCase.agentPrices || {};
      const agentRate = Number(rawAgentRates[agentId]) || 0;
      const logMyRateRevenue = agentRate > 0 ? logQuantityCompleted * agentRate : 0;
      totalMyRateRevenue += logMyRateRevenue;
      
      // Track units by case unit type
      const caseUnit = String(logCase.caseUnit || '').toLowerCase();
      if (caseUnit === 'interviews') {
        unitsByType.interviews += logQuantityCompleted;
      } else if (caseUnit === 'hours') {
        unitsByType.hours += logQuantityCompleted;
      } else if (caseUnit === 'meetings') {
        unitsByType.meetings += logQuantityCompleted;
      }
      
      // Track A-leads from the log entry
      const aLeads = Number(log.aLeads || 0);
      unitsByType.aLeads += aLeads;
      
      const breakdown = {
        logIndex: index + 1,
        date: log.date,
        caseName: log.caseName,
        quantityCompleted: logQuantityCompleted,
        pricePerUnit: pricePerUnit,
        revenue: logRevenue,
        logId: log._id || log.id,
        orderId: logCase._id
      };
      
      revenueBreakdown.push(breakdown);
      if (isTargetLog) {
        console.log('✅ TARGET LOG included in revenue:', breakdown);
      }
      console.log(`💰 Log ${index + 1}:`, breakdown);
    } else {
      if (isTargetLog) {
        console.log('❌ TARGET LOG excluded from revenue:', {
          logCaseName: log.caseName,
          foundCase: logCase ? { name: logCase.caseName, isTest: isTestCase(logCase) } : 'NOT FOUND',
          quantityCompleted: logQuantityCompleted,
          logId: log._id || log.id
        });
      }
      console.warn(`⚠️ Log ${index + 1}: No matching case found or is test case:`, {
        logCaseName: log.caseName,
        foundCase: logCase ? { name: logCase.caseName, isTest: isTestCase(logCase) } : 'NOT FOUND',
        quantityCompleted: logQuantityCompleted,
        logId: log._id || log.id
      });
    }
  });
  
  const revenue = totalRevenue.toFixed(2);
  const myRateRevenue = totalMyRateRevenue.toFixed(2);
  const myRate = totalUnits > 0 ? (totalMyRateRevenue / totalUnits).toFixed(2) : '0.00';
  
  console.log('📊 Revenue Calculation Summary:', {
    totalLogsProcessed: uniqueLogs.length,
    totalUnits,
    unitsByType,
    totalRevenue: revenue,
    breakdown: revenueBreakdown
  });
  
  return { 
    totalUnits, 
    revenue,
    myRateRevenue,
    myRate,
    unitsByType: {
      interviews: unitsByType.interviews,
      hours: unitsByType.hours,
      meetings: unitsByType.meetings,
      aLeads: unitsByType.aLeads
    }
  };
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
      const logCase = findOrderForLog(log, agentCases);
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
    const casesDisplay = casesList.length > 0 ? casesList.join(', ') : t('agentDashboard.noCases');

    // Format custom week dates for display
    const startDate = new Date(group.weekInfo.start);
    const endDate = new Date(group.weekInfo.end);
    const startStr = startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    const endStr = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    
    result.push({
      date: `${t('agentDashboard.week')} ${group.weekInfo.weekNumber} (${startStr} - ${endStr})`,
      cases: casesDisplay,
      caseUnit: t('agentDashboard.allCases'),
      callTime: formatNumber(group.totals.callTime),
      outgoingCalls: group.totals.outgoingCalls,
      answeredCalls: group.totals.answeredCalls,
      responseRate: formatNumber(avgResponseRate),
      completedCalls: group.totals.completedCalls,
      // Personal results: this agent's completed quantity
      personalResults: group.totals.quantityCompleted,
      // Team results: currently same as personal (only this agent's logs are included here)
      // You can extend this later to include all agents if desired.
      teamResults: group.totals.quantityCompleted,
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
      const logCase = findOrderForLog(log, agentCases);
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
        // Personal result for this log row
        personalResults: quantityCompleted,
        // Team result placeholder: currently same as personal
        // (this table is scoped to the current agent's logs only)
        teamResults: quantityCompleted,
        comments: log.comments || '',
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
          weekTitle: `${t('agentDashboard.week')} ${customWeek.weekNumber} (${startStr} - ${endStr})`,
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
  { title: t('agentDashboard.week'), key: 'date', sortable: true },
  { title: t('agentDashboard.cases'), key: 'cases', sortable: true },
  { title: t('agentTables.callTime'), key: 'callTime', sortable: true, class: 'd-none d-md-table-cell' },
  { title: t('agentTables.outgoingCalls'), key: 'outgoingCalls', sortable: true, class: 'd-none d-lg-table-cell' },
  { title: t('agentTables.answeredCalls'), key: 'answeredCalls', sortable: true, class: 'd-none d-lg-table-cell' },
  { title: t('agentTables.responseRate'), key: 'responseRate', sortable: true, class: 'd-none d-md-table-cell' },
  { title: t('agentTables.completedCalls'), key: 'completedCalls', sortable: true, class: 'd-none d-xl-table-cell' },
  { title: t('agentTables.personalResults'), key: 'personalResults', sortable: true },
  { title: t('agentTables.teamResults'), key: 'teamResults', sortable: true },
  { title: t('agentTables.amountMade'), key: 'amountMade', sortable: true },
])

// Headers for individual logs table
const individualHeaders = computed(() => [
  { title: t('agentTables.date'), key: 'date', sortable: true },
  { title: t('agentTables.case'), key: 'caseName', sortable: true },
  { title: t('agentTables.unit'), key: 'caseUnit', sortable: true, class: 'd-none d-md-table-cell' },
  { title: t('agentTables.callTime'), key: 'callTime', sortable: true, class: 'd-none d-lg-table-cell' },
  { title: t('agentTables.outgoingCalls'), key: 'outgoingCalls', sortable: true, class: 'd-none d-xl-table-cell' },
  { title: t('agentTables.answeredCalls'), key: 'answeredCalls', sortable: true, class: 'd-none d-xl-table-cell' },
  { title: t('agentTables.responseRate'), key: 'responseRate', sortable: true, class: 'd-none d-lg-table-cell' },
  { title: t('agentTables.completedCalls'), key: 'completedCalls', sortable: true, class: 'd-none d-xl-table-cell' },
  { title: t('agentTables.personalResults'), key: 'personalResults', sortable: true },
  { title: t('agentTables.teamResults'), key: 'teamResults', sortable: true },
  { title: t('dailyLogForm.comments'), key: 'comments', sortable: false },
  { title: t('agentTables.amountMade'), key: 'amountMade', sortable: true },
  { title: t('agentTables.edit'), key: 'edit', sortable: false, width: '60px' },
  { title: t('assignGoals.tableHeaders.delete'), key: 'delete', sortable: false, width: '60px' },
])

// Headers for cases table view (agent dashboard)
const casesTableHeaders = computed(() => [
  { title: t('ordersDashboard.tableHeaders.caseName'), key: 'caseName', sortable: true },
  { title: t('ordersDashboard.tableHeaders.status'), key: 'orderStatus', sortable: true },
  { title: t('ordersDashboard.tableHeaders.callers'), key: 'callers', sortable: false },
  { title: t('ordersDashboard.tableHeaders.unit'), key: 'caseUnit', sortable: true },
  { title: t('ordersDashboard.tableHeaders.totalQty'), key: 'totalQuantity', sortable: true },
  { title: t('agentCaseCard.myGoal'), key: 'myGoal', sortable: true },
  { title: t('agentTables.personalResults'), key: 'myUnits', sortable: true },
  { title: t('agentTables.teamResults'), key: 'teamUnits', sortable: true },
  { title: t('agentCaseCard.myRevenueGoal'), key: 'myRevenueGoal', sortable: true },
  { title: t('agentCaseCard.myCurrentRevenue'), key: 'currentRevenue', sortable: true },
  { title: t('agentDashboard.myRate'), key: 'myRate', sortable: true },
  { title: '%', key: 'percentage', sortable: true },
  { title: t('ordersDashboard.tableHeaders.deadline'), key: 'deadline', sortable: true },
])

// Headers for weekly goals by project table (per week section)
const weeklyGoalsHeaders = computed(() => [
  { title: t('ordersDashboard.tableHeaders.caseName'), key: 'project', sortable: true },
  { title: t('agentWeeklyGoal.goal'), key: 'goal', sortable: true },
  { title: t('agentTables.results'), key: 'progress', sortable: false },
  { title: t('agentTables.goalReached'), key: 'goalReached', sortable: true },
  { title: t('agentTables.edit'), key: 'edit', sortable: false, width: '60px' },
  { title: t('assignGoals.tableHeaders.delete'), key: 'delete', sortable: false, width: '60px' },
])

// Table rows: all weekly goals for this agent for the current month
// (project, week start, goal, progress "results / goal") + _raw for edit/delete
const weeklyGoalsTableRows = computed(() => {
  const goals = agentWeeklyGoals.value || []
  const stats = caseStats.value || []
  const agent = selectedGcAgent.value

  // If no agent or no stats, we still return rows, just without progress
  const agentId = agent ? String(agent._id ?? agent.id ?? '') : null

  return goals.map((g) => {
    const start = g?.goal_date?.start ?? g?.weekStartDate ?? g?.weekStart ?? g?.week_start ?? ''
    const end = g?.goal_date?.end ?? g?.weekEndDate ?? g?.week_end ?? ''

    let completed = 0

    if (agentId && start) {
      const from = new Date(start)
      const to = end ? new Date(end) : new Date(start)
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999)

        const goalOrderId = String(g?.orderId ?? g?.order_id ?? '')
        const goalCaseName = g?.case ?? g?.caseName ?? g?.case_name ?? ''

        // First, collect all matching logs for this agent, order/case and week
        const matchingLogsRaw = stats.filter((log) => {
          // Match by date range
          const d = new Date(log.date)
          if (isNaN(d.getTime()) || d < from || d > to) return false

          // Match by agent
          const logAgentId = String(
            log?.agent?._id ??
            log?.agent?.id ??
            log?.agent ??
            log?.agentId ??
            ''
          )
          if (logAgentId !== agentId) return false

          // Match by order or case name
          const logOrderId = String(
            log?.order?._id ??
            log?.order?.id ??
            log?.orderId ??
            ''
          )
          const logCaseName = log?.caseName ?? ''
          const sameOrder =
            (goalOrderId && logOrderId && logOrderId === goalOrderId) ||
            (goalCaseName && logCaseName && logCaseName === goalCaseName)

          return sameOrder
        })

        // De-duplicate logs to avoid double-counting
        const seen = new Set()
        const matchingLogs = []
        matchingLogsRaw.forEach((log) => {
          const key = `${log.date}_${log.agentName || log.agent}_${log.caseName}_${log._id || log.id}`
          if (!seen.has(key)) {
            seen.add(key)
            matchingLogs.push(log)
          }
        })

        completed = matchingLogs.reduce(
          (sum, log) => sum + (Number(log.quantityCompleted) || 0),
          0
        )
      }
    }

    const goalValue = Number(g?.goal ?? 0)
    const progress = `${completed} / ${goalValue}`
    const goalReached = goalValue > 0
      ? Number(((completed / goalValue) * 100).toFixed(1))
      : 0

    const weekStartFormatted = start
      ? formatDateForTable(start)
      : ''
    return {
      project: g?.case ?? g?.caseName ?? g?.case_name ?? '—',
      weekStart: weekStartFormatted,
      goal: goalValue,
      completed,
      progress,
      goalReached,
      _raw: g,
    }
  })
})

// Group weekly goals rows by week, so each week shows only its own cases
const weeklyGoalsByWeek = computed(() => {
  const rows = weeklyGoalsTableRows.value || []
  if (!rows.length) return []

  const groups = new Map()

  rows.forEach((row) => {
    const raw = row._raw || {}
    const startRaw = raw?.goal_date?.start ?? raw?.weekStartDate ?? raw?.weekStart ?? raw?.week_start ?? ''
    const endRaw = raw?.goal_date?.end ?? raw?.weekEndDate ?? raw?.week_end ?? ''

    const key = startRaw || row.weekStart || String(raw._id ?? raw.id ?? '')

    if (!groups.has(key)) {
      // Build a label that matches "Daily Entries by Week" visual style:
      // "Week N (dd/mm - dd/mm)"
      let label = ''

      if (startRaw && monthWeeks.value && monthWeeks.value.length > 0) {
        const startDateObj = new Date(startRaw)
        if (!isNaN(startDateObj.getTime())) {
          const matchingWeek = monthWeeks.value.find(week => {
            const weekStart = new Date(week.start)
            return !isNaN(weekStart.getTime()) && weekStart.getTime() === startDateObj.getTime()
          })

          if (matchingWeek) {
            const startDate = new Date(matchingWeek.start)
            const endDate = new Date(matchingWeek.end)
            const startStr = startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
            const endStr = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
            label = `${t('agentDashboard.week')} ${matchingWeek.weekNumber} (${startStr} - ${endStr})`
          }
        }
      }

      // Fallback if we couldn't match to a configured week
      if (!label) {
        if (startRaw && endRaw) {
          const startDate = new Date(startRaw)
          const endDate = new Date(endRaw)
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const startStr = startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
            const endStr = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
            label = `${t('agentDashboard.week')} (${startStr} - ${endStr})`
          }
        }
      }
      if (!label) {
        label = t('agentDashboard.week')
      }

      groups.set(key, {
        weekKey: key,
        weekLabel: label,
        rows: [],
      })
    }

    groups.get(key).rows.push(row)
  })

  // Sort weeks by their key when it's a date
  return Array.from(groups.values()).sort((a, b) => {
    const da = new Date(a.weekKey)
    const db = new Date(b.weekKey)
    if (!isNaN(da) && !isNaN(db)) {
      return da - db
    }
    return String(a.weekLabel).localeCompare(String(b.weekLabel))
  })
})

// Table rows for cases view: each order enriched with agent-specific stats
const casesTableRows = computed(() => {
  const orders = userOrders.value || [];
  const agent = selectedGcAgent.value;
  const stats = caseStats.value || [];
  const dateRange = currentDateRange.value;

  if (!agent || !Array.isArray(orders)) return [];

  const agentId = String(agent._id ?? agent.id ?? '');
  let from, to;
  if (dateRange && dateRange.length >= 2) {
    from = new Date(dateRange[0]);
    to = new Date(dateRange[1]);
    to.setHours(23, 59, 59, 999);
  }

  return orders.map((order) => {
    const orderId = String(order._id ?? order.id ?? '');
    const myGoal = Number(order?.agentGoals?.[agentId] ?? 0);
    const pricePerUnit = Number(order?.pricePerUnit ?? 0);
    const rawAgentRates = order?.agentRates || order?.agentPrices || {};
    const agentRate = Number(rawAgentRates[agentId]) || 0;

    // All logs for this agent & order within the current date range
    const myAgentOrderLogsRaw = stats.filter((log) => {
      const logOrderId = String(log?.order?._id ?? log?.order ?? log?.orderId ?? '');
      const logCaseName = log?.caseName ?? '';
      const sameOrder = logOrderId === orderId || logCaseName === (order?.caseName ?? '');
      const logAgentId = String(log?.agent?._id ?? log?.agent ?? log?.agentId ?? '');
      if (logAgentId !== agentId || !sameOrder) return false;
      if (from && to) {
        const d = new Date(log?.date);
        return d >= from && d <= to;
      }
      return true;
    });

    // De-duplicate logs to avoid double-counting (same strategy as in revenue calculations)
    const myAgentOrderLogs = [];
    const seenMyLogs = new Set();
    myAgentOrderLogsRaw.forEach(log => {
      const key = `${log.date}_${log.agentName || log.agent}_${log.caseName}_${log._id || log.id}`;
      if (!seenMyLogs.has(key)) {
        seenMyLogs.add(key);
        myAgentOrderLogs.push(log);
      }
    });

    const myAgentUnits = myAgentOrderLogs.reduce(
      (sum, l) => sum + (Number(l?.quantityCompleted) ?? 0),
      0
    );

    // Team goal: use the order's total quantity (project goal)
    const teamGoal = Number(order?.totalQuantity ?? 0);

    // Team units: all agents' quantityCompleted for this order in the same date range,
    // with basic de-duplication to avoid double-counting identical logs.
    const candidateTeamLogs = stats.filter((log) => {
      const logOrderId = String(log?.order?._id ?? log?.order ?? log?.orderId ?? '');
      const logCaseName = log?.caseName ?? '';
      const sameOrder = logOrderId === orderId || logCaseName === (order?.caseName ?? '');
      if (!sameOrder) return false;
      if (from && to) {
        const d = new Date(log?.date);
        return d >= from && d <= to;
      }
      return true;
    });

    const teamTeamLogsUnique = [];
    const seenTeam = new Set();
    candidateTeamLogs.forEach(log => {
      const key = `${log.date}_${log.agentName || log.agent}_${log.caseName}_${log._id || log.id}`;
      if (!seenTeam.has(key)) {
        seenTeam.add(key);
        teamTeamLogsUnique.push(log);
      }
    });

    const teamUnits = teamTeamLogsUnique.reduce(
      (sum, l) => sum + (Number(l?.quantityCompleted) ?? 0),
      0
    );
    const myRevenueGoal = myGoal * pricePerUnit;
    const currentRevenue = myAgentUnits * agentRate;
    const percentage = myGoal > 0 ? Number(((myAgentUnits / myGoal) * 100).toFixed(1)) : 0;

    return {
      ...order,
      _id: order._id ?? order.id,
      myGoal,
      myAgentUnits,
      teamGoal,
      teamUnits,
      totalQuantity: Number(order?.totalQuantity ?? 0),
      myRevenueGoal,
      myRate: agentRate,
      currentRevenue,
      percentage,
    };
  });
});

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

// Admin/manager agent selector (kept in sync with ?agent= query)
const selectedAgentName = ref('')

watch(
  () => route.query.agent,
  (newVal) => {
    // Keep local select in sync with URL / selected agent
    if (typeof newVal === 'string') {
      selectedAgentName.value = newVal
    } else if (selectedGcAgent.value?.name) {
      selectedAgentName.value = selectedGcAgent.value.name
    } else {
      selectedAgentName.value = ''
    }
  },
  { immediate: true }
)

watch(selectedAgentName, (newName) => {
  // When admin/manager changes the dropdown, update the query param
  if (!newName) return
  const current = route.query.agent
  if (current === newName) return
  router.push({
    name: 'agentDashboard',
    query: { ...route.query, agent: newName },
  })
})

// Function to fetch all case stats for the agent across all cases
const fetchCaseStats = async () => {
  if (!selectedGcAgent.value || !orders.value) {
    caseStats.value = [];
    return;
  }
  
  isLoadingDashboard.value = true;

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
  } finally {
    isLoadingDashboard.value = false;
  }
}

async function fetchAgentWeeklyGoals() {
  const agent = selectedGcAgent.value;
  const dateRange = currentDateRange.value;
  if (!agent || !dateRange || dateRange.length < 1) {
    agentWeeklyGoals.value = [];
    return;
  }
  try {
    const monthKey = dateRange[0].slice(0, 7); // "YYYY-MM"
    // Prefer agent ID (backend spec uses agentId); fallback to name for path-style APIs
    const agentId = String(agent._id ?? agent.id ?? '');
    const name = agent.name || agent.username || '';
    if (!agentId && !name) {
      agentWeeklyGoals.value = [];
      return;
    }
    const data = await fetchAgentgoalsByAgentAndMonth(agentId || name, monthKey, name || undefined);
    agentWeeklyGoals.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('AgentDashboard: Error fetching weekly goals:', err);
    agentWeeklyGoals.value = [];
  }
}

function openEditWeeklyGoalDialog(row) {
  const raw = (row?.raw ?? row)?._raw ?? row?._raw;
  if (!raw) return;
  editingGoalRow.value = row?.raw ?? row;
  editWeeklyGoalValue.value = Number(raw?.goal ?? 0) || 0;
  editWeeklyGoalDialog.value = true;
}

function toYYYYMMDD(val) {
  if (!val) return '';
  const d = new Date(val);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
}

async function saveEditedWeeklyGoal() {
  const row = editingGoalRow.value;
  const raw = row?._raw;
  const agent = selectedGcAgent.value;
  if (!raw || !agent) {
    editWeeklyGoalDialog.value = false;
    return;
  }
  const start = toYYYYMMDD(raw?.goal_date?.start ?? raw?.weekStartDate ?? raw?.week_start) || '';
  const end = toYYYYMMDD(raw?.goal_date?.end ?? raw?.weekEndDate ?? raw?.week_end) || '';
  const monthKey = raw?.monthKey ?? (start ? start.slice(0, 7) : '');
  const orderId = raw?.orderId ?? raw?.order_id;
  const caseName = raw?.case ?? raw?.caseName ?? raw?.case_name ?? '—';
  if (!start || !end || !orderId) {
    editWeeklyGoalDialog.value = false;
    return;
  }
  editWeeklyGoalSaving.value = true;
  try {
    await axios.post(`${urls.backEndURL}/agentGoals/`, {
      agent: agent.name,
      agentId: agent._id ?? agent.id,
      case: caseName,
      orderId,
      goal: Number(editWeeklyGoalValue.value) || 0,
      type: 'Weekly',
      goal_date: { start, end },
      monthKey,
    });
    await fetchAgentWeeklyGoals();
    editWeeklyGoalDialog.value = false;
  } catch (err) {
    console.error('Edit weekly goal error:', err);
  } finally {
    editWeeklyGoalSaving.value = false;
  }
}

async function deleteWeeklyGoal(row) {
  const raw = row?._raw ?? row?.raw ?? row;
  if (!raw) return;

  if (!confirm(t('agentDashboard.confirmDeleteWeeklyGoal'))) {
    return;
  }

  try {
    const goalId = raw._id ?? raw.id;
    if (!goalId) {
      console.warn('deleteWeeklyGoal: no id on goal row', raw);
      return;
    }
    await axios.delete(`${urls.backEndURL}/agentGoals/${goalId}`);
    await fetchAgentWeeklyGoals();
  } catch (err) {
    console.error('Delete weekly goal error:', err);
    alert(t('agentDashboard.failedToDeleteWeeklyGoal'));
  }
}

watch([orders, selectedGcAgent, currentDateRange], async ([allOrders, agent, dateRange]) => {
  userOrders.value = agent
    ? findOrdersForUser(allOrders, agent._id ?? agent.id)
    : [];

  // Fetch case stats when agent or orders change
  if (agent) {
    await fetchCaseStats();
    await fetchAgentWeeklyGoals();
  } else {
    agentWeeklyGoals.value = [];
  }
}, { immediate: true });

function findOrdersForUser(allOrdersArray, agentId) {
  const wanted = String(agentId || '');
  if (!wanted) return [];
  
  // Filter by agent first (most selective filter)
  const agentOrders = (allOrdersArray || []).filter(order =>
    (order.assignedCallers || []).some(id => String(id?._id ?? id) === wanted)
  );

  // Exclude cases where this agent's goal is 0 or not set
  const agentOrdersWithGoal = agentOrders.filter(order => {
    const goal = Number(order?.agentGoals?.[wanted] ?? 0);
    return goal > 0;
  });
  
  // Early return if no date range
  if (!currentDateRange.value || currentDateRange.value.length < 2) {
    return agentOrdersWithGoal;
  }
  
  // Pre-calculate date boundaries once
  const [startDate, endDate] = currentDateRange.value;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);
  
  // Optimized date filtering
  return agentOrdersWithGoal.filter(order => {
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
  if (!confirm(t('agentDashboard.confirmDeleteLog'))) {
    return;
  }
  
  try {
    const response = await axios.delete(`${urls.backEndURL}/dailyLogs/${logData._id}`);
    
    if (response.status === 200) {
      // Refresh the data to reflect the deletion
      await store.dispatch('fetchDailyLogs');
      console.log(t('agentDashboard.logDeletedSuccessfully'));
    }
  } catch (error) {
    console.error('Error deleting log:', error);
    alert(t('agentDashboard.failedToDeleteLog'));
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
  
  .agent-dashboard-container {
    max-width: 90vw;
    margin-left: auto;
    margin-right: auto;
    padding-left: 24px;
    padding-right: 24px;
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr)); /* minmax(0,1fr) allows cards to shrink and prevents overflow */
    gap: 12px;
    width: 100%;
    max-width: 100%;
    margin-bottom: 1rem;
    flex-shrink: 0;
    box-sizing: border-box;

    /* Hide scrollbar for Webkit browsers (Chrome, Safari) */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* IE and Edge */
  }

  /* Allow grid children to shrink below content size - prevents cut-off on Yoga/narrow screens */
  .grid-container > * {
    min-width: 0;
    overflow: visible;
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
    .agent-dashboard-container {
      padding-left: 16px !important;
      padding-right: 16px !important;
    }
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
