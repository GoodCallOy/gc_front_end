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
        <v-col cols="12" sm="4" class="py-0">
          <div class="text-h6">
            {{ t('agentDashboard.totalRevenue') }}: €{{ topBoxStats.totalTeamRevenue }}
          </div>
          <div class="text-h6">
            {{ t('agentDashboard.myTotalRevenue') }}: €{{ revenueGenerated.myRevenue }}
          </div>
        </v-col>
        <v-col cols="12" sm="4" class="py-0">
          <div class="text-h6">
            {{ t('agentDashboard.revenueToGoal') }}: {{ topBoxStats.revenueToGoalPercent }}%
          </div>
          <div class="text-h6">
            {{ t('agentDashboard.myRevenueToGoal') }}: {{ myRevenueToGoalPercent }}%
          </div>
        </v-col>
        <v-col cols="12" sm="4" class="py-0">
          <div class="text-h6">
            {{ t('agentDashboard.myPaycheck') }}: €{{ revenueGenerated.myPaycheck }}
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- Units & Call Time Breakdown -->
    <v-card v-if="userOrders.length > 0" class="mx-auto my-2 pa-4 elevation-4" style="background-color: #eeeff1;">
      <v-row align="center" dense>
        <v-col cols="6" sm="3" class="py-0">
          <div class="d-flex flex-wrap align-center" style="gap: 6px 10px;">
            <span class="text-caption">{{ t('dailyLogForm.aLeads') }}: {{ revenueGenerated.unitsByType.aLeads }}</span>
            <span class="text-caption">{{ t('agentDashboard.billedHours') }}: {{ revenueGenerated.billedHours }}</span>
          </div>
        </v-col>
        <v-col cols="6" sm="3" class="py-0">
          <div class="d-flex flex-wrap align-center" style="gap: 6px 10px;">
            <span class="text-caption">{{ t('agentCaseCard.meetings') }}: {{ revenueGenerated.unitsByType.meetings }}</span>
            <span class="text-caption">{{ t('agentDashboard.callingHours') }}: {{ revenueGenerated.callTimeByType.meetings }}</span>
          </div>
        </v-col>
        <v-col cols="6" sm="3" class="py-0">
          <div class="d-flex flex-wrap align-center" style="gap: 6px 10px;">
            <span class="text-caption">{{ t('agentCaseCard.interviews') }}: {{ revenueGenerated.unitsByType.interviews }}</span>
            <span class="text-caption">{{ t('agentDashboard.callingHours') }}: {{ revenueGenerated.callTimeByType.interviews }}</span>
          </div>
        </v-col>
        <v-col cols="6" sm="3" class="py-0">
          <div class="d-flex flex-wrap align-center" style="gap: 6px 10px;">
            <span class="text-caption">{{ t('agentDashboard.canceledMeeting') }}: {{ canceledMeetingCount }}</span>
            <span class="text-caption">{{ t('agentDashboard.rebookedMeetings') }}: {{ rebookedMeetingsCount }}</span>
          </div>
        </v-col>
      </v-row>
    </v-card>
    
    <!-- Global loading state -->
    <div v-if="isInitialLoading || isLoadingDashboard" class="dashboard-loading-placeholder">
      <v-skeleton-loader
        type="heading"
        class="mb-4"
      />
      <v-skeleton-loader
        type="image"
        class="mb-4"
      />
      <v-skeleton-loader
        type="table-heading, table-thead, table-row-divider@6"
      />
    </div>

    <!-- Show simple message if no cases assigned -->
    <div v-else-if="userOrders.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-clipboard-outline</v-icon>
      <h2 class="text-h5 mb-2 text-grey-darken-1">{{ t('messages.noCasesAssigned') }}</h2>
      <p class="text-body-1 text-grey">{{ t('messages.contactManagerForCases') }}</p>
    </div>

    <!-- Show cases if assigned -->
    <div v-else>
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap" style="gap: 12px;">
        <div class="d-flex align-center flex-wrap" style="gap: 8px;">
          <h1 class="text-h4 mb-0">
            {{ t('agentDashboard.casesFor') }} {{ selectedGcAgent ? selectedGcAgent.name : '—' }}
          </h1>
          <v-btn
            size="small"
            color="primary"
            variant="text"
            class="ml-2"
            @click="showWeeklyNotesDialog = true"
          >
            {{ t('agentDashboard.weeklyNotes') }}
          </v-btn>
        </div>
        <div
          v-if="currentUser?.role === 'admin' || currentUser?.role === 'manager'"
          class="header-actions"
        >
          <div class="header-action-item">
            <v-select
              v-model="viewReportCaseId"
              :items="reportCaseOptions"
              item-title="caseName"
              :item-value="(item) => item._id ?? item.id ?? ''"
              density="compact"
              hide-details
              label="View Report"
              :disabled="!reportCaseOptions.length"
              @update:model-value="onViewReportCaseSelect"
            />
          </div>
          <div class="header-action-item">
            <v-select
              v-model="selectedAgentName"
              :items="activeGcAgents"
              item-title="name"
              item-value="name"
              density="compact"
              hide-details
              :label="t('agentDashboard.casesFor')"
            />
          </div>
        </div>
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
            <div v-if="selectedGcAgent" class="grid-container ">
              <agentCaseCard
                v-for="(userOrder, index) in userOrders"
                :key="userOrder?._id ?? userOrder?.caseName ?? index"
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

  <!-- Weekly notes dialog -->
  <v-dialog
    v-model="showWeeklyNotesDialog"
    max-width="720"
  >
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ t('agentDashboard.weeklyNotes') }}</span>
        <v-btn icon size="small" variant="text" @click="showWeeklyNotesDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <div v-if="weeklyNotesLoading" class="text-center py-6">
          <v-progress-circular indeterminate color="primary" size="32" />
        </div>
        <div v-else-if="monthWeeks.length === 0" class="text-body-2 text-grey">
          {{ t('agentDashboard.noWeeklyNotesWeeks') }}
        </div>
        <div v-else>
          <!-- Form to edit note for selected week -->
          <div class="mb-4">
            <v-row dense>
              <v-col cols="12" sm="5">
                <v-select
                  v-model="selectedWeekIndexForNotes"
                  :items="monthWeeks.map((w, idx) => ({ label: getWeeklyNoteWeekLabel(w), value: idx }))"
                  item-title="label"
                  item-value="value"
                  density="comfortable"
                  hide-details
                  :label="t('agentDashboard.week')"
                />
              </v-col>
              <v-col cols="12" sm="7">
                <v-textarea
                  v-if="monthWeeks[selectedWeekIndexForNotes]"
                  v-model="weeklyNotes[getWeeklyNoteWeekKey(monthWeeks[selectedWeekIndexForNotes])]"
                  :label="t('agentDashboard.weeklyNotePlaceholder')"
                  auto-grow
                  rows="2"
                  max-rows="6"
                  density="comfortable"
                  :readonly="!canManageWeeklyNotes"
                />
              </v-col>
            </v-row>
            <div class="d-flex align-center mt-2" style="gap: 10px;">
              <v-btn
                size="small"
                color="primary"
                :loading="weeklyNoteSaving[getWeeklyNoteWeekKey(monthWeeks[selectedWeekIndexForNotes])] === true"
                :disabled="!monthWeeks[selectedWeekIndexForNotes] || !canManageWeeklyNotes"
                @click="monthWeeks[selectedWeekIndexForNotes] && saveWeeklyNote(monthWeeks[selectedWeekIndexForNotes])"
              >
                {{ t('agentDashboard.saveWeeklyNote') }}
              </v-btn>
              <span class="text-caption text-grey-darken-1">
                {{
                  monthWeeks[selectedWeekIndexForNotes]
                    ? (weeklyNoteStatus[getWeeklyNoteWeekKey(monthWeeks[selectedWeekIndexForNotes])] || '')
                    : ''
                }}
              </span>
            </div>
          </div>

          <!-- Existing notes list -->
          <div class="mt-4">
            <div class="text-subtitle-2 mb-2">
              {{ t('agentDashboard.weeklyNotes') }}
            </div>
            <v-list density="compact">
              <v-list-item
                v-for="(week, idx) in monthWeeks"
                :key="getWeeklyNoteWeekKey(week)"
                class="py-2"
              >
                <v-list-item-title class="text-body-2 font-weight-medium">
                  {{ getWeeklyNoteWeekLabel(week) }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-body-2">
                  {{ weeklyNotes[getWeeklyNoteWeekKey(week)] || '—' }}
                </v-list-item-subtitle>
                <template v-if="canManageWeeklyNotes" #append>
                  <div class="d-flex align-center" style="gap: 6px;">
                    <v-btn
                      size="x-small"
                      variant="text"
                      color="primary"
                      @click="editWeeklyNoteFromList(idx)"
                    >
                      {{ t('agentDashboard.editWeeklyNoteNote') }}
                    </v-btn>
                    <v-btn
                      size="x-small"
                      variant="text"
                      color="error"
                      :loading="weeklyNoteSaving[getWeeklyNoteWeekKey(week)] === true"
                      @click="deleteWeeklyNote(week)"
                    >
                      {{ t('agentDashboard.deleteWeeklyNoteNote') }}
                    </v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

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
import { resolveLinkedGcAgent } from '@/js/resolveLinkedGcAgent.js'
const store = useStore()
const router = useRouter()
const route = useRoute()
const userOrders = ref([])
const caseStats = ref([])
const allCaseStats = ref([]) // For revenue-to-goal (same for every agent)
const isLoadingDashboard = ref(false)
const isInitialLoading = ref(true)
const monthWeeks = ref([])
const agentWeeklyGoals = ref([])
const weeklyNotes = ref({})
const weeklyNotesLoading = ref(false)
const weeklyNoteSaving = ref({})
const weeklyNoteStatus = ref({})
const showWeeklyNotesDialog = ref(false)
const selectedWeekIndexForNotes = ref(0)
const casesViewTab = ref('table')
const editWeeklyGoalDialog = ref(false)
const editWeeklyGoalValue = ref(0)
const editWeeklyGoalSaving = ref(false)
const editingGoalRow = ref(null)
const canceledCalls = ref([])
const { t } = useI18n()

const orders = computed(() => store.getters['orders'])
const dailyLogs = computed(() => store.getters['dailyLogs'] || [])
const gcAgents = computed(() => store.getters['gcAgents'])
const activeGcAgents = computed(() =>
  (gcAgents.value || []).filter(agent => agent.active !== false)
)
const currentDate = computed(() => store.getters['currentDate'])
const currentDateRange = computed(() => store.getters['currentDateRange'])
const canManageWeeklyNotes = computed(() => {
  const role = currentUser.value?.role
  return role === 'admin' || role === 'manager'
})


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

function getCurrentMonthKey() {
  const range = currentDateRange.value
  if (!Array.isArray(range) || range.length < 1 || !range[0]) return ''
  return String(range[0]).slice(0, 7)
}

function getWeeklyNoteWeekKey(week) {
  const monthKey = getCurrentMonthKey()
  const weekNumber = Number(week?.weekNumber ?? 0)
  return monthKey && weekNumber ? `${monthKey}-W${weekNumber}` : `${week?.start ?? ''}`
}

function getWeeklyNoteWeekLabel(week) {
  const startDate = new Date(week?.start)
  const endDate = new Date(week?.end)
  const startStr = !isNaN(startDate.getTime())
    ? startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
    : '—'
  const endStr = !isNaN(endDate.getTime())
    ? endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
    : '—'
  return `${t('agentDashboard.week')} ${week?.weekNumber ?? ''} (${startStr} - ${endStr})`
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

function goToAgentReports(agentName, caseId) {
  const name = agentName || selectedAgentName.value || selectedGcAgent.value?.name;
  const query = {};
  if (name) query.agent = name;
  if (caseId) query.case = caseId;
  router.push({ name: 'agentReport', query });
}

// Cases for the selected agent (for View Report dropdown) - matches report page case options
const reportCaseOptions = computed(() => userOrders.value || []);

const viewReportCaseId = ref('');

function onViewReportCaseSelect(caseId) {
  if (!caseId) return;
  goToAgentReports(selectedAgentName.value || selectedGcAgent.value?.name, caseId);
  viewReportCaseId.value = ''; // reset so dropdown shows placeholder again
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

// Normalize case name for comparison (trim, collapse spaces)
function normalizeCaseName(name) {
  if (name == null) return '';
  return String(name).trim().replace(/\s+/g, ' ');
}

// Helper function to find the correct order for a log
// Handles cases where multiple orders have the same caseName but different prices
// Always uses the most recent order (by deadline) to ensure latest pricePerUnit
// Uses normalized comparison to tolerate minor spacing/casing differences
function findOrderForLog(log, availableOrders) {
  if (!log || !availableOrders || !availableOrders.length) return null;

  // 1) Prefer exact order ID match from the log (most reliable)
  const logOrderId = String(
    log?.order?._id ??
    log?.order?.id ??
    log?.orderId ??
    log?.order ??
    ''
  );
  if (logOrderId) {
    const byId = availableOrders.find(order =>
      String(order?._id ?? order?.id ?? '') === logOrderId
    );
    if (byId) return byId;
  }
  
  // 2) Fallback to case name match
  const logCaseName = normalizeCaseName(log.caseName);
  const matchingOrders = availableOrders.filter(order =>
    normalizeCaseName(order.caseName) === logCaseName
  );
  
  if (matchingOrders.length === 0) return null;
  if (matchingOrders.length === 1) return matchingOrders[0];

  // 3) If multiple orders have same case name, choose the one active on log date
  const logDate = new Date(log?.date);
  if (!isNaN(logDate.getTime())) {
    const activeOnDate = matchingOrders.find(order => {
      const start = new Date(order?.startDate || 0);
      const end = new Date(order?.deadline || 0);
      end.setHours(23, 59, 59, 999);
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && logDate >= start && logDate <= end;
    });
    if (activeOnDate) return activeOnDate;
  }
  
  // 4) Last fallback: most recent order
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

  if (!selectedGcAgent.value || !Array.isArray(stats) || !dateRange) {
    return {
      totalUnits: 0,
      revenue: '0.00',
      myRevenue: '0.00',
      myRateRevenue: '0.00',
      myPaycheck: '0.00',
      myRate: '0.00',
      unitsByType: {
        interviews: 0,
        hours: 0,
        meetings: 0,
        aLeads: 0
      },
      billedHours: 0,
      callTimeByType: { aLeads: 0, meetings: 0, interviews: 0 }
    };
  }

  const agentId = String(selectedGcAgent.value._id ?? selectedGcAgent.value.id);

  const [startDate, endDate] = dateRange;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);
  monthEnd.setHours(23, 59, 59, 999);

  const filteredStats = stats.filter(log => {
    const logDate = new Date(log.date);
    const isInDateRange = logDate >= monthStart && logDate <= monthEnd;
    const logAgentId = log.agent?._id || log.agent?.id || log.agent || log.agentId;
    const isAgentLog = String(logAgentId) === String(agentId);
    return isInDateRange && isAgentLog;
  });

  const uniqueLogs = [];
  const seenLogs = new Set();
  filteredStats.forEach(log => {
    const logKey = `${log.date}_${log.agentName || log.agent}_${log.caseName}_${log._id || log.id}`;
    if (!seenLogs.has(logKey)) {
      seenLogs.add(logKey);
      uniqueLogs.push(log);
    }
  });

  const agentCases = allOrders.filter(order => {
    if (!order.assignedCallers) return false;
    const isAssigned = order.assignedCallers.some(caller => {
      const callerId = caller?._id || caller?.id || caller;
      return String(callerId) === String(agentId);
    });
    return isAssigned && !isTestCase(order);
  });

  let totalUnits = 0;
  let totalRevenue = 0;
  let totalMyRateRevenue = 0;

  const unitsByType = {
    interviews: 0,
    hours: 0,
    meetings: 0,
    aLeads: 0
  };
  const callTimeByType = { aLeads: 0, meetings: 0, interviews: 0 };

  uniqueLogs.forEach((log) => {
    const caseName = String(log.caseName || '').toLowerCase();
    if (caseName.includes('test')) return;

    const logQuantityCompleted = Number(log.quantityCompleted) || 0;
    totalUnits += logQuantityCompleted;

    const logCase = findOrderForLog(log, agentCases);
    if (!logCase || isTestCase(logCase)) return;

    const pricePerUnit = Number(logCase.pricePerUnit) || 0;
    const caseUnit = String(logCase.caseUnit || log.caseUnit || log.case_unit || '').toLowerCase();
    const isHoursCase = /^hours?$|^hrs?$|^h$/.test(caseUnit);
    const isInterviewsCase = /^interview(s)?$/.test(caseUnit);

    let canonicalUnits = logQuantityCompleted;
    if (isHoursCase) {
      canonicalUnits = Number(log.hours) || Number(logQuantityCompleted) || 0;
    } else if (isInterviewsCase) {
      canonicalUnits = Number(log.completedInterviews ?? log.interviews ?? logQuantityCompleted) || 0;
    }

    const logRevenue = canonicalUnits * pricePerUnit;
    totalRevenue += logRevenue;

    const rawAgentRates = logCase.agentRates || logCase.agentPrices || {};
    const agentRate = Number(rawAgentRates[agentId]) || 0;
    const logMyRateRevenue = agentRate > 0 ? canonicalUnits * agentRate : 0;
    totalMyRateRevenue += logMyRateRevenue;

    const interviewUnits = isInterviewsCase
      ? Number(log.completedInterviews ?? log.interviews ?? logQuantityCompleted) || 0
      : Number(log.completedInterviews ?? log.interviews ?? 0);
    if (Number.isFinite(interviewUnits) && !Number.isNaN(interviewUnits)) {
      unitsByType.interviews += interviewUnits;
    }

    const hourUnits = isHoursCase
      ? Number(log.hours) || Number(logQuantityCompleted) || 0
      : Number(log.hours ?? 0);
    if (Number.isFinite(hourUnits) && !Number.isNaN(hourUnits)) {
      unitsByType.hours += hourUnits;
    }

    const isMeetingsCase = /^meeting(s)?$/.test(caseUnit);
    if (isMeetingsCase) {
      unitsByType.meetings += logQuantityCompleted;
    }

    const isALeadsCase = /^a[-_]?leads?$/i.test(String(logCase.caseUnit || ''));
    const aLeads = isALeadsCase
      ? Number(log.aLeads ?? logQuantityCompleted) || 0
      : Number(log.aLeads ?? 0);
    if (Number.isFinite(aLeads) && !Number.isNaN(aLeads)) {
      unitsByType.aLeads += aLeads;
    }

    const logCallTime = Number(log.call_time ?? log.callTime ?? 0) || 0;
    if (isALeadsCase) {
      callTimeByType.aLeads += logCallTime;
    } else if (isMeetingsCase) {
      callTimeByType.meetings += logCallTime;
    } else if (isInterviewsCase) {
      callTimeByType.interviews += logCallTime;
    }
  });

  const revenue = totalRevenue.toFixed(2);
  const myRateRevenue = totalMyRateRevenue.toFixed(2);
  const myRate = totalUnits > 0 ? (totalMyRateRevenue / totalUnits).toFixed(2) : '0.00';
  const myRevenue = totalRevenue.toFixed(2);
  const myPaycheck = totalMyRateRevenue.toFixed(2);

  return {
    totalUnits,
    revenue,
    myRevenue,
    myRateRevenue,
    myPaycheck,
    myRate,
    unitsByType: {
      interviews: unitsByType.interviews,
      hours: unitsByType.hours,
      meetings: unitsByType.meetings,
      aLeads: unitsByType.aLeads
    },
    billedHours: unitsByType.hours,
    callTimeByType: {
      aLeads: callTimeByType.aLeads,
      meetings: callTimeByType.meetings,
      interviews: callTimeByType.interviews
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

  // Get all cases the agent is assigned to (handle both object and string assignedCallers)
  const agentId = String(selectedGcAgent.value._id ?? selectedGcAgent.value.id);
  const agentCases = allOrders.filter(order =>
    isAgentAssignedToOrder(order, agentId)
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

  // Get all cases the agent is assigned to (handle both object and string assignedCallers)
  const agentId = String(selectedGcAgent.value._id ?? selectedGcAgent.value.id);
  const agentCases = allOrders.filter(order =>
    isAgentAssignedToOrder(order, agentId)
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

  // Convert to array and sort by week number (show all weeks in the month)
  return Object.values(weekGroups)
    .sort((a, b) => a.weekInfo.weekNumber - b.weekInfo.weekNumber);
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
  { title: t('agentTables.personalResults'), key: 'myUnits', sortable: true },
  { title: t('ordersDashboard.tableHeaders.unit'), key: 'caseUnit', sortable: true },
  { title: t('agentTables.teamResults'), key: 'teamUnits', sortable: true },
  { title: t('agentCaseCard.myCurrentRevenue'), key: 'currentRevenue', sortable: true },
  { title: t('agentCaseCard.myRevenueGoal'), key: 'myRevenueGoal', sortable: true },
  { title: '%', key: 'percentage', sortable: true },
  { title: t('agentDashboard.myRate'), key: 'myRate', sortable: true },
  { title: t('ordersDashboard.tableHeaders.callers'), key: 'callers', sortable: false },
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
    const teamGoal = Number(order?.monthlyGoal ?? order?.totalQuantity ?? 0);

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
      totalQuantity: Number(order?.monthlyGoal ?? order?.totalQuantity ?? 0),
      myRevenueGoal,
      myRate: agentRate,
      currentRevenue,
      percentage,
    };
  });
});

// Top box: revenue to goal = current revenue / total revenue goal across ALL cases (same % for every agent)
// Total team revenue uses SAME logic as orders dashboard currentRevenueTotal for consistency
const topBoxStats = computed(() => {
  const allOrders = orders.value || [];
  const logs = dailyLogs.value || [];
  const dateRange = currentDateRange.value;
  const weeks = monthWeeks.value || [];

  if (!dateRange || dateRange.length < 2 || allOrders.length === 0) {
    return { revenueToGoalPercent: 0, totalTeamRevenue: '0.00' };
  }

  // Use monthWeeks for date range when available (matches orders dashboard), else currentDateRange
  let monthStart, monthEnd;
  if (Array.isArray(weeks) && weeks.length > 0) {
    const starts = weeks.map(w => new Date(w.start));
    const ends = weeks.map(w => new Date(w.end));
    monthStart = new Date(Math.min.apply(null, starts));
    monthEnd = new Date(Math.max.apply(null, ends));
    monthEnd.setHours(23, 59, 59, 999);
  } else {
    const [startStr, endStr] = dateRange;
    monthStart = new Date(startStr);
    monthEnd = new Date(endStr);
    monthEnd.setHours(23, 59, 59, 999);
  }

  // Filter orders by overlap with date range (matches orders dashboard filteredOrders)
  const ordersToCalculate = allOrders.filter(order => {
    const orderStart = new Date(order.startDate || 0);
    const orderEnd = new Date(order.deadline || 0);
    return orderStart <= monthEnd && orderEnd >= monthStart;
  });

  // Same logic as orders dashboard currentRevenueTotal: filter logs, exclude case good call & test
  const logsInMonth = logs.filter(log => {
    const logDate = new Date(log.date);
    const isInDateRange = logDate >= monthStart && logDate <= monthEnd;
    const isNotCaseGoodCall = log.caseName !== 'case good call';
    const caseName = String(log.caseName || '').toLowerCase();
    const isNotTest = !caseName.includes('test');
    return isInDateRange && isNotCaseGoodCall && isNotTest;
  });

  let currentRevenue = 0;
  let totalRevenueGoal = 0;

  // Revenue: sum quantityCompleted * pricePerUnit per log (match orders dashboard)
  logsInMonth.forEach(log => {
    const quantityCompleted = Number(log.quantityCompleted) || 0;
    const order = ordersToCalculate.find(o =>
      o.caseName === log.caseName ||
      String(o._id) === String(log.order?._id || log.order || log.orderId)
    );
    if (order && !isTestCase(order)) {
      const pricePerUnit = Number(order.pricePerUnit) || 0;
      currentRevenue += quantityCompleted * pricePerUnit;
    }
  });

  // Total revenue goal: from orders that overlap the month (for revenue-to-goal %)
  for (const order of ordersToCalculate) {
    if (isTestCase(order)) continue;
    const pricePerUnit = Number(order?.pricePerUnit ?? 0);
    const teamGoal = Number(order?.monthlyGoal ?? order?.totalQuantity ?? 0);
    totalRevenueGoal += teamGoal * pricePerUnit;
  }

  const revenueToGoalPercent = totalRevenueGoal > 0
    ? Math.round((currentRevenue / totalRevenueGoal) * 100)
    : 0;
  return {
    revenueToGoalPercent,
    totalTeamRevenue: currentRevenue.toFixed(2)
  };
});

// Average of all % column values from cases table (agent's revenue-to-goal per case, averaged)
const myRevenueToGoalPercent = computed(() => {
  const rows = casesTableRows.value || [];
  if (rows.length === 0) return 0;
  const sum = rows.reduce((acc, row) => acc + (Number(row?.percentage) || 0), 0);
  return Math.round((sum / rows.length) * 10) / 10; // 1 decimal place
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
  
  return resolveLinkedGcAgent(currentUser.value, gcAgents.value);
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
  viewReportCaseId.value = '' // reset View Report selection when agent changes
  // When admin/manager changes the dropdown, update the query param
  if (!newName) return
  const current = route.query.agent
  if (current === newName) return
  router.push({
    name: 'agentDashboard',
    query: { ...route.query, agent: newName },
  })
})

// Helper: check if agent is assigned to order (handles both object and string ID formats)
function isAgentAssignedToOrder(order, agentId) {
  if (!order?.assignedCallers || !Array.isArray(order.assignedCallers)) return false;
  const aid = String(agentId);
  return order.assignedCallers.some(caller => {
    const callerId = caller?._id ?? caller?.id ?? caller;
    return String(callerId) === aid;
  });
}

// Function to fetch all case stats for the agent across all cases
const fetchCaseStats = async () => {
  if (!selectedGcAgent.value || !orders.value) {
    caseStats.value = [];
    return;
  }

  try {
    // Get all cases the agent is assigned to (handle both object and string assignedCallers)
    const agentId = String(selectedGcAgent.value._id ?? selectedGcAgent.value.id);
    const agentCases = orders.value.filter(order =>
      isAgentAssignedToOrder(order, agentId)
    );


    // Fetch data for all cases the agent is assigned to in parallel.
    const caseNames = [...new Set(agentCases.map(c => c.caseName).filter(Boolean))];
    const allStats = [];
    const responses = await Promise.allSettled(
      caseNames.map((caseName) =>
        axios.get(`${urls.backEndURL}/dailyLogs/${encodeURIComponent(caseName)}`)
      )
    );

    responses.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allStats.push(...(result.value.data || []));
      } else {
        console.warn(`AgentDashboard: Error fetching stats for case ${caseNames[index]}:`, result.reason);
      }
    });
    
    caseStats.value = allStats;
  } catch (error) {
    console.error('AgentDashboard: Error fetching case stats:', error);
    caseStats.value = [];
  }
}

// Fetch stats for ALL orders (for revenue-to-goal - same % for every agent)
const fetchAllCaseStats = async () => {
  const allOrders = orders.value || [];
  const dateRange = currentDateRange.value;
  if (!Array.isArray(allOrders) || allOrders.length === 0 || !dateRange || dateRange.length < 2) {
    allCaseStats.value = [];
    return;
  }

  const caseNames = [...new Set(
    allOrders.filter(o => !isTestCase(o)).map(o => o.caseName).filter(Boolean)
  )];

  if (caseNames.length === 0) {
    allCaseStats.value = [];
    return;
  }

  try {
    const allStats = [];
    const responses = await Promise.allSettled(
      caseNames.map((caseName) =>
        axios.get(`${urls.backEndURL}/dailyLogs/${encodeURIComponent(caseName)}`)
      )
    );
    responses.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allStats.push(...(result.value.data || []));
      } else {
        console.warn(`AgentDashboard: Error fetching all-case stats for ${caseNames[index]}:`, result.reason);
      }
    });
    allCaseStats.value = allStats;
  } catch (error) {
    console.error('AgentDashboard: Error fetching all case stats:', error);
    allCaseStats.value = [];
  }
};

// Fetch canceled calls for canceled/rebooked meeting counts
const fetchCanceledCalls = async () => {
  try {
    const res = await axios.get(`${urls.backEndURL}/canceledCalls`);
    const raw = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    const SNAKE_TO_CAMEL = {
      cancel_date: 'cancelDate',
      rebook_agent: 'rebookAgent',
      rebook_date: 'rebookDate',
      call_date: 'callDate',
    };
    canceledCalls.value = raw.map((row) => {
      if (!row || typeof row !== 'object') return row;
      const out = { ...row };
      for (const [snake, camel] of Object.entries(SNAKE_TO_CAMEL)) {
        if (out[snake] !== undefined && out[camel] === undefined) out[camel] = out[snake];
      }
      return out;
    });
  } catch (err) {
    console.warn('AgentDashboard: Error fetching canceled calls:', err);
    canceledCalls.value = [];
  }
};

// Canceled meeting and rebooked counts filtered by agent and date range
const canceledMeetingCount = computed(() => {
  const agent = selectedGcAgent.value;
  const dateRange = currentDateRange.value;
  if (!agent || !dateRange || dateRange.length < 2) return 0;
  const agentId = String(agent._id ?? agent.id ?? '');
  const [startDate, endDate] = dateRange;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);
  monthEnd.setHours(23, 59, 59, 999);
  const list = canceledCalls.value || [];
  return list.filter((item) => {
    const itemAgentId = item.agent?._id ?? item.agent?.id ?? item.agent;
    if (String(itemAgentId) !== agentId) return false;
    const d = item.cancelDate || item.callDate;
    if (!d) return false;
    const date = new Date(typeof d === 'string' ? d.split('T')[0] : d);
    return date >= monthStart && date <= monthEnd;
  }).length;
});

const rebookedMeetingsCount = computed(() => {
  const agent = selectedGcAgent.value;
  const dateRange = currentDateRange.value;
  if (!agent || !dateRange || dateRange.length < 2) return 0;
  const agentId = String(agent._id ?? agent.id ?? '');
  const [startDate, endDate] = dateRange;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);
  monthEnd.setHours(23, 59, 59, 999);
  const list = canceledCalls.value || [];
  return list.filter((item) => {
    const itemAgentId = item.agent?._id ?? item.agent?.id ?? item.agent;
    if (String(itemAgentId) !== agentId) return false;
    const d = item.cancelDate || item.callDate;
    if (!d) return false;
    const date = new Date(typeof d === 'string' ? d.split('T')[0] : d);
    if (date < monthStart || date > monthEnd) return false;
    const hasRebook = !!(item.rebookDate || item.rebookAgent);
    return hasRebook;
  }).length;
});

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

async function fetchAgentWeeklyNotes() {
  if (!canManageWeeklyNotes.value) return
  const agent = selectedGcAgent.value
  const monthKey = getCurrentMonthKey()
  if (!agent || !monthKey) {
    weeklyNotes.value = {}
    return
  }

  weeklyNotesLoading.value = true
  try {
    const agentId = String(agent._id ?? agent.id ?? '')
    let data = []

    try {
      const res = await axios.get(`${urls.backEndURL}/agentWeeklyNotes`, {
        params: { agentId, monthKey },
      })
      data = Array.isArray(res.data) ? res.data : (res.data?.data || [])
    } catch (_) {
      const res = await axios.get(`${urls.backEndURL}/agent-weekly-notes`, {
        params: { agentId, monthKey },
      })
      data = Array.isArray(res.data) ? res.data : (res.data?.data || [])
    }

    const next = {}
    ;(monthWeeks.value || []).forEach((week) => {
      const key = getWeeklyNoteWeekKey(week)
      next[key] = ''
    })
    data.forEach((row) => {
      const key = row?.weekKey || row?.week_key || ''
      if (key) next[key] = row?.note ?? ''
    })
    weeklyNotes.value = next
  } catch (err) {
    console.warn('AgentDashboard: Error fetching weekly notes:', err)
    weeklyNotes.value = {}
  } finally {
    weeklyNotesLoading.value = false
  }
}

async function saveWeeklyNote(week) {
  if (!canManageWeeklyNotes.value) return
  const agent = selectedGcAgent.value
  const monthKey = getCurrentMonthKey()
  if (!agent || !monthKey || !week) return

  const weekKey = getWeeklyNoteWeekKey(week)
  const note = String(weeklyNotes.value?.[weekKey] ?? '')
  const agentId = String(agent._id ?? agent.id ?? '')

  weeklyNoteSaving.value = { ...weeklyNoteSaving.value, [weekKey]: true }
  weeklyNoteStatus.value = { ...weeklyNoteStatus.value, [weekKey]: '' }

  const payload = {
    agentId,
    monthKey,
    weekKey,
    weekStart: week?.start ?? '',
    weekEnd: week?.end ?? '',
    note,
  }

  try {
    try {
      await axios.put(`${urls.backEndURL}/agentWeeklyNotes/${agentId}/${monthKey}/${encodeURIComponent(weekKey)}`, payload)
    } catch (_) {
      await axios.post(`${urls.backEndURL}/agent-weekly-notes`, payload)
    }
    weeklyNoteStatus.value = { ...weeklyNoteStatus.value, [weekKey]: t('agentDashboard.weeklyNoteSaved') }
  } catch (err) {
    console.error('AgentDashboard: Error saving weekly note:', err)
    weeklyNoteStatus.value = { ...weeklyNoteStatus.value, [weekKey]: t('agentDashboard.weeklyNoteSaveFailed') }
  } finally {
    weeklyNoteSaving.value = { ...weeklyNoteSaving.value, [weekKey]: false }
  }
}

function editWeeklyNoteFromList(index) {
  if (!Number.isInteger(index)) return
  if (index < 0 || index >= monthWeeks.value.length) return
  selectedWeekIndexForNotes.value = index
}

async function deleteWeeklyNote(week) {
  if (!canManageWeeklyNotes.value) return
  const agent = selectedGcAgent.value
  const monthKey = getCurrentMonthKey()
  if (!agent || !monthKey || !week) return
  if (!window.confirm(t('agentDashboard.confirmDeleteWeeklyNoteNote'))) return

  const weekKey = getWeeklyNoteWeekKey(week)
  const agentId = String(agent._id ?? agent.id ?? '')
  weeklyNoteSaving.value = { ...weeklyNoteSaving.value, [weekKey]: true }
  weeklyNoteStatus.value = { ...weeklyNoteStatus.value, [weekKey]: '' }

  const payload = {
    agentId,
    monthKey,
    weekKey,
    weekStart: week?.start ?? '',
    weekEnd: week?.end ?? '',
    note: '',
  }

  try {
    try {
      await axios.delete(`${urls.backEndURL}/agentWeeklyNotes/${agentId}/${monthKey}/${encodeURIComponent(weekKey)}`)
    } catch (_) {
      await axios.post(`${urls.backEndURL}/agent-weekly-notes`, payload)
    }
    weeklyNotes.value = { ...weeklyNotes.value, [weekKey]: '' }
    weeklyNoteStatus.value = { ...weeklyNoteStatus.value, [weekKey]: t('agentDashboard.weeklyNoteDeleted') }
  } catch (err) {
    console.error('AgentDashboard: Error deleting weekly note:', err)
    weeklyNoteStatus.value = { ...weeklyNoteStatus.value, [weekKey]: t('agentDashboard.weeklyNoteDeleteFailed') }
  } finally {
    weeklyNoteSaving.value = { ...weeklyNoteSaving.value, [weekKey]: false }
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

async function refreshDashboardForCurrentSelection(allOrders, agent, dateRange) {
  isLoadingDashboard.value = true;

  // Ensure we have basic data before attempting refresh
  if (!agent || !allOrders || !Array.isArray(allOrders) || !dateRange || dateRange.length < 2) {
    userOrders.value = [];
    agentWeeklyGoals.value = [];
    canceledCalls.value = [];
    weeklyNotes.value = {};
    isLoadingDashboard.value = false;
    isInitialLoading.value = false;
    return;
  }

  try {
    userOrders.value = findOrdersForUser(allOrders, agent._id ?? agent.id);

    // Fetch dashboard data in parallel to reduce total waiting time.
    await Promise.all([
      fetchAllCaseStats(),
      fetchCaseStats(),
      fetchAgentWeeklyGoals(),
      fetchCanceledCalls(),
      fetchAgentWeeklyNotes(),
    ]);
  } finally {
    isLoadingDashboard.value = false;
    isInitialLoading.value = false;
  }
}

watch([orders, selectedGcAgent, currentDateRange], async ([allOrders, agent, dateRange]) => {
  await refreshDashboardForCurrentSelection(allOrders, agent, dateRange);
});

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

    // Initial dashboard load for current orders/agent/month
    await refreshDashboardForCurrentSelection(orders.value, selectedGcAgent.value, currentDateRange.value);
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
    await fetchAgentWeeklyNotes()
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

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    width: min(560px, 100%);
  }

  .header-action-item {
    flex: 1;
    min-width: 180px;
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

  .dashboard-loading-placeholder {
    width: 100%;
    padding: 8px 0 20px;
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
    .header-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .header-action-item {
      min-width: 100%;
    }

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
