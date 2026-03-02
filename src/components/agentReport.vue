<template>
  <v-container fluid class="agent-report-container">
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

    <div class="d-flex align-center justify-space-between mb-4 flex-wrap" style="gap: 12px;">
      <h1 class="text-h4 mb-0">Reports - {{ getFormattedDateRange() }}</h1>
      <v-select
        v-model="selectedCaseId"
        :items="caseOptions"
        item-title="caseName"
        :item-value="(item) => item._id ?? item.id ?? ''"
        density="compact"
        hide-details
        style="max-width: 260px;"
        label="View Report"
        :disabled="!caseOptions.length"
      />
      <v-select
        v-if="isAdminOrManager && activeGcAgents.length > 0"
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

    <!-- Charts section -->
    <p v-if="caseOptions.length === 0" class="text-body-1 text-grey mb-4">
      No cases assigned. Contact your manager to be assigned to cases.
    </p>
    <p v-else-if="!selectedCaseId" class="text-body-1 text-grey mb-4">
      Select a case above to view reports.
    </p>
    <!-- Always render charts (v-show) to avoid mount/unmount errors with vue-chartjs -->
    <v-row v-show="!!selectedCaseId">
      <!-- Chart 1: Agent goals vs Team goals by week -->
      <v-col cols="12" md="6">
        <v-card class="pa-4 elevation-2">
          <h3 class="text-h6 mb-4">Goals vs Team Goals by Week</h3>
          <div style="height: 300px;">
            <Bar
              :data="chart1Data"
              :options="barChartOptions"
            />
          </div>
        </v-card>
      </v-col>

      <!-- Chart 2: Agent's current results vs weekly personal goal -->
      <v-col cols="12" md="6">
        <v-card class="pa-4 elevation-2">
          <h3 class="text-h6 mb-4">Current Results vs Weekly Personal Goal</h3>
          <div style="height: 300px;">
            <Bar
              :data="chart2Data"
              :options="barChartOptions"
            />
          </div>
        </v-card>
      </v-col>

      <!-- Chart 3: Donut - Agent goals per case -->
      <v-col cols="12">
        <v-card class="pa-4 elevation-2">
          <h3 class="text-h6 mb-4">Goals by Case</h3>
          <div style="height: 300px;">
            <Doughnut
              :data="donutChartDataSafe"
              :options="donutChartOptions"
            />
          </div>
        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { goToNextMonth, goToPreviousMonth, formattedDateRange, getMonthWeeks } from '@/js/dateUtils'
import { fetchAgentgoalsByAgentAndMonth } from '@/js/statsUtils'

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
)

const store = useStore()
const route = useRoute()
const { t } = useI18n()

// Date range from store
const currentDateRange = computed(() => store.getters['currentDateRange'])
const orders = computed(() => store.getters['orders'] || [])
const gcAgents = computed(() => store.getters['gcAgents'] || [])

// Agent selection (for admin/manager)
const selectedAgentName = ref('')
const activeGcAgents = computed(() =>
  (gcAgents.value || []).filter((a) => a.active !== false)
)
const isAdminOrManager = computed(() => {
  const role = store.state.user?.user?.role
  return role === 'admin' || role === 'manager'
})

const selectedGcAgent = computed(() => {
  const name = selectedAgentName.value
  const agents = gcAgents.value || []
  if (name) return agents.find((a) => (a.name || a.username) === name) || null
  return agents[0] || null
})

// Case selection - orders assigned to the selected agent that overlap the current month (no fallback to current user for admins)
const selectedCaseId = ref('')
const caseOptions = computed(() => {
  let agent = selectedGcAgent.value
  if (!agent && !isAdminOrManager.value) {
    const user = store.state.user?.user
    if (user) agent = { _id: user.linkedUserId || user._id, id: user.linkedUserId || user._id }
  }
  if (!agent) return []
  const agentId = String(agent._id ?? agent.id ?? '')
  const range = currentDateRange.value
  if (!range || !Array.isArray(range) || range.length < 2) return []

  const monthStart = new Date(range[0])
  const monthEnd = new Date(range[1])
  monthEnd.setHours(23, 59, 59, 999)

  const agentOrders = (orders.value || []).filter((o) => {
    if (!(o.assignedCallers || []).some((x) => String(x?._id ?? x?.id ?? x) === agentId)) return false
    const orderStart = new Date(o?.startDate || 0)
    const orderEnd = new Date(o?.deadline || 0)
    return orderStart <= monthEnd && orderEnd >= monthStart
  })
  return agentOrders
})

// Chart data - use computed so we always have valid data (never null)
const agentVsTeamChartData = ref(null)
const resultsVsGoalChartData = ref(null)

const emptyChartData1 = {
  labels: [],
  datasets: [
    { label: 'Agent Goal', data: [], backgroundColor: 'rgba(63, 81, 181, 0.7)', borderColor: 'rgb(63, 81, 181)', borderWidth: 1 },
    { label: 'Team Goal', data: [], backgroundColor: 'rgba(76, 175, 80, 0.7)', borderColor: 'rgb(76, 175, 80)', borderWidth: 1 },
  ],
}
const emptyChartData2 = {
  labels: [],
  datasets: [
    { label: 'Current Results', data: [], backgroundColor: 'rgba(255, 152, 0, 0.7)', borderColor: 'rgb(255, 152, 0)', borderWidth: 1 },
    { label: 'Weekly Personal Goal', data: [], backgroundColor: 'rgba(156, 39, 176, 0.7)', borderColor: 'rgb(156, 39, 176)', borderWidth: 1 },
  ],
}
const chart1Data = computed(() => agentVsTeamChartData.value || emptyChartData1)
const chart2Data = computed(() => resultsVsGoalChartData.value || emptyChartData2)

// Donut chart: agent goals per case (all active cases for the month)
const emptyDonutData = {
  labels: [],
  datasets: [{ data: [], backgroundColor: [], borderColor: '#fff', borderWidth: 2 }],
}
const donutChartData = computed(() => {
  try {
    let agent = selectedGcAgent.value
    if (!agent && !isAdminOrManager.value) {
      const user = store.state.user?.user
      if (user) agent = { _id: user.linkedUserId || user._id, id: user.linkedUserId || user._id }
    }
    if (!agent) return emptyDonutData
    const agentId = String(agent._id ?? agent.id ?? '')
    const cases = caseOptions.value
    if (!cases || !cases.length) return emptyDonutData

    const DONUT_COLORS = [
      'rgba(63, 81, 181, 0.8)',
      'rgba(76, 175, 80, 0.8)',
      'rgba(255, 152, 0, 0.8)',
      'rgba(156, 39, 176, 0.8)',
      'rgba(244, 67, 54, 0.8)',
      'rgba(0, 188, 212, 0.8)',
      'rgba(255, 87, 34, 0.8)',
      'rgba(121, 85, 72, 0.8)',
    ]

    const casesWithGoal = cases.filter((o) => (Number(o?.agentGoals?.[agentId] ?? 0) || 0) > 0)
    if (!casesWithGoal.length) return emptyDonutData

    const labels = casesWithGoal.map((o) => o.caseName || o.caseId || 'Unknown')
    const data = casesWithGoal.map((o) => Number(o?.agentGoals?.[agentId] ?? 0) || 0)
    const backgroundColor = casesWithGoal.map((_, i) => DONUT_COLORS[i % DONUT_COLORS.length])

    return {
      labels,
      datasets: [{
        data,
        backgroundColor,
        borderColor: '#fff',
        borderWidth: 2,
      }],
    }
  } catch {
    return emptyDonutData
  }
})
const donutChartDataSafe = computed(() => donutChartData.value || emptyDonutData)

const donutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'right',
      labels: {
        generateLabels(chart) {
          const dataset = chart.data.datasets?.[0]
          if (!dataset) return []
          const data = dataset.data || []
          return (chart.data.labels || []).map((label, i) => ({
            text: `${label}: ${data[i] ?? 0}`,
            fillStyle: dataset.backgroundColor?.[i] ?? '#999',
            strokeStyle: dataset.borderColor ?? '#fff',
            lineWidth: dataset.borderWidth ?? 1,
            hidden: chart.getDatasetMeta(0).data[i]?.hidden ?? false,
            index: i,
            datasetIndex: 0,
          }))
        },
      },
    },
    datalabels: {
      color: '#fff',
      font: { size: 14, weight: 'bold' },
      formatter: (value) => value,
    },
  },
  cutout: '60%',
}

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: { top: 30, bottom: 10 },
  },
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      padding: 16,
    },
    datalabels: {
      anchor: 'end',
      align: 'top',
      font: { size: 12, weight: 'bold' },
      formatter: (value) => (value > 0 ? value : ''),
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
}

function getFormattedDateRange() {
  return formattedDateRange(currentDateRange.value)
}

function getPreviousMonth() {
  const prev = goToPreviousMonth(currentDateRange.value)
  store.commit('setDateRange', prev)
}

function getNextMonth() {
  const next = goToNextMonth(currentDateRange.value)
  store.commit('setDateRange', next)
}

// Build chart data: agent goals vs team goals, and results vs weekly goal
async function loadReportData() {
  const range = currentDateRange.value
  if (!range || !Array.isArray(range) || range.length < 2) return

  const [startStr, endStr] = range
  const from = new Date(startStr)
  const to = new Date(endStr)
  to.setHours(23, 59, 59, 999)
  const fromTime = from.getTime()
  const toTime = to.getTime()

  const user = store.state.user?.user
  let agent = selectedGcAgent.value
  if (!agent && !isAdminOrManager.value && user) {
    agent = { _id: user.linkedUserId || user._id, id: user.linkedUserId || user._id, name: user.name || user.username }
  }
  if (!agent) {
    agentVsTeamChartData.value = null
    resultsVsGoalChartData.value = null
    return
  }

  const agentId = String(agent._id ?? agent.id ?? agent.linkedUserId ?? '')
  const agentName = agent.name || agent.username || ''

  try {
    const monthKey = startStr.slice(0, 7) // YYYY-MM
    const year = from.getFullYear()
    const month = from.getMonth() + 1

    // Fetch agent weekly goals and month weeks in parallel
    const [weeklyGoals, monthWeeks] = await Promise.all([
      fetchAgentgoalsByAgentAndMonth(agentId || agentName, monthKey, agentName),
      getMonthWeeks(year, month),
    ])

    const allLogs = store.getters['dailyLogs'] || []
    const logs = allLogs.filter((log) => {
      const d = new Date(log.date)
      const t = d.getTime()
      if (t < fromTime || t > toTime) return false
      const logAgentId = String(log?.agent?._id ?? log?.agent ?? log?.agentId ?? '')
      return logAgentId === agentId || (!agentId && logAgentId === '')
    })

    // Agent's assigned orders (for team goals)
    let agentOrders = (orders.value || []).filter(
      (o) =>
        (o.assignedCallers || []).some(
          (x) => String(x?._id ?? x?.id ?? x) === agentId
        )
    )

    // Filter by selected case
    const caseId = selectedCaseId.value
    if (caseId) {
      agentOrders = agentOrders.filter(
        (o) => String(o._id ?? o.id) === caseId || (o?.caseName ?? '') === caseId
      )
    } else {
      agentVsTeamChartData.value = null
      resultsVsGoalChartData.value = null
      return
    }

    const numWeeks = monthWeeks.length || 4

    // Per-week buckets keyed by week start date (ISO string)
    const weekBuckets = new Map()
    for (const w of monthWeeks) {
      const start = new Date(w.start)
      const key = start.toISOString().split('T')[0]
      weekBuckets.set(key, {
        label: `Week ${w.weekNumber}`,
        agentGoal: 0,
        teamGoal: 0,
        completed: 0,
        weeklyPersonalGoal: 0,
      })
    }

    // Team goal per week: sum of (totalQuantity/numWeeks) for orders agent is in
    for (const order of agentOrders) {
      const teamQty = Number(order?.monthlyGoal ?? order?.totalQuantity ?? 0)
      const perWeek = teamQty / numWeeks
      for (const [, bucket] of weekBuckets) {
        bucket.teamGoal += perWeek
      }
    }

    // Agent weekly goals: from agentGoals API - match to week by date range, filter by selected case
    const orderIds = new Set(agentOrders.map((o) => String(o._id ?? o.id)))
    const caseNames = new Set(agentOrders.map((o) => o?.caseName ?? '').filter(Boolean))
    for (const g of weeklyGoals || []) {
      const goalOrderId = String(g?.orderId ?? g?.order_id ?? '')
      const goalCaseName = g?.case ?? g?.caseName ?? g?.case_name ?? ''
      if (caseId && !orderIds.has(goalOrderId) && !caseNames.has(goalCaseName)) continue
      const startRaw = g?.goal_date?.start ?? g?.weekStartDate ?? g?.week_start ?? ''
      if (!startRaw) continue
      const goalDate = new Date(startRaw)
      for (const [weekKey, bucket] of weekBuckets) {
        const weekStart = new Date(weekKey)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)
        if (goalDate >= weekStart && goalDate <= weekEnd) {
          const goalVal = Number(g?.goal ?? 0)
          bucket.agentGoal += goalVal
          bucket.weeklyPersonalGoal += goalVal
          break
        }
      }
    }

    // If no weekly goals, use monthly agentGoals from orders as fallback (divided by weeks)
    if (weeklyGoals.length === 0) {
      for (const order of agentOrders) {
        const myGoal = Number(order?.agentGoals?.[agentId] ?? 0)
        const perWeek = myGoal / numWeeks
        for (const [, bucket] of weekBuckets) {
          bucket.agentGoal += perWeek
          bucket.weeklyPersonalGoal += perWeek
        }
      }
    }

    // Completed: from daily logs per week
    for (const log of logs) {
      const d = new Date(log.date)
      const logOrderId = String(log?.order?._id ?? log?.order ?? log?.orderId ?? '')
      const logCaseName = log?.caseName ?? ''
      const sameOrder = agentOrders.some(
        (o) =>
          String(o._id ?? o.id) === logOrderId ||
          (o?.caseName ?? '') === logCaseName
      )
      if (!sameOrder) continue

      const units = Number(log?.quantityCompleted ?? 0)
      for (const [weekKey, bucket] of weekBuckets) {
        const weekStart = new Date(weekKey)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)
        if (d >= weekStart && d <= weekEnd) {
          bucket.completed += units
          break
        }
      }
    }

    const sortedBuckets = Array.from(weekBuckets.entries()).sort(
      (a, b) => new Date(a[0]) - new Date(b[0])
    )
    const labels = sortedBuckets.map(([, b]) => b.label)
    const agentGoalsData = sortedBuckets.map(([, b]) => b.agentGoal)
    const teamGoalsData = sortedBuckets.map(([, b]) => b.teamGoal)
    const completedData = sortedBuckets.map(([, b]) => b.completed)
    const weeklyGoalData = sortedBuckets.map(([, b]) => b.weeklyPersonalGoal)

    // Chart 1: Agent goals vs Team goals
    agentVsTeamChartData.value = {
      labels,
      datasets: [
        {
          label: 'Agent Goal',
          data: agentGoalsData,
          backgroundColor: 'rgba(63, 81, 181, 0.7)',
          borderColor: 'rgb(63, 81, 181)',
          borderWidth: 1,
        },
        {
          label: 'Team Goal',
          data: teamGoalsData,
          backgroundColor: 'rgba(76, 175, 80, 0.7)',
          borderColor: 'rgb(76, 175, 80)',
          borderWidth: 1,
        },
      ],
    }

    // Chart 2: Current results vs weekly personal goal
    resultsVsGoalChartData.value = {
      labels,
      datasets: [
        {
          label: 'Current Results',
          data: completedData,
          backgroundColor: 'rgba(255, 152, 0, 0.7)',
          borderColor: 'rgb(255, 152, 0)',
          borderWidth: 1,
        },
        {
          label: 'Weekly Personal Goal',
          data: weeklyGoalData,
          backgroundColor: 'rgba(156, 39, 176, 0.7)',
          borderColor: 'rgb(156, 39, 176)',
          borderWidth: 1,
        },
      ],
    }
  } catch (err) {
    console.error('Failed to load report data:', err)
    agentVsTeamChartData.value = null
    resultsVsGoalChartData.value = null
  }
}


watch(currentDateRange, () => loadReportData(), { deep: true })
watch(selectedAgentName, () => {
  selectedCaseId.value = ''
  loadReportData()
})
watch(selectedCaseId, () => loadReportData())
watch(caseOptions, (newOptions) => {
  const caseFromQuery = route.query?.case
  if (caseFromQuery && newOptions?.length && !selectedCaseId.value) {
    const match = newOptions.find((o) => String(o._id ?? o.id) === caseFromQuery || (o?.caseName ?? '') === caseFromQuery)
    if (match) selectedCaseId.value = match._id ?? match.id ?? match.caseName ?? ''
  }
  const ids = new Set(newOptions.map((o) => String(o._id ?? o.id ?? '')))
  if (selectedCaseId.value && !ids.has(selectedCaseId.value)) {
    selectedCaseId.value = ''
  }
}, { deep: true })

onMounted(async () => {
  await Promise.all([
    store.dispatch('fetchDailyLogs'),
    store.dispatch('fetchOrders'),
    store.dispatch('fetchgcAgents'),
  ])
  const user = store.state.user?.user
  const agentFromQuery = route.query?.agent
  if (agentFromQuery && (user?.role === 'admin' || user?.role === 'manager')) {
    selectedAgentName.value = String(agentFromQuery)
  } else if (user?.role === 'caller' && !selectedAgentName.value) {
    selectedAgentName.value = user?.name || user?.username || ''
  } else if (
    (user?.role === 'admin' || user?.role === 'manager') &&
    activeGcAgents.value?.length > 0 &&
    !selectedAgentName.value
  ) {
    selectedAgentName.value = activeGcAgents.value[0]?.name || ''
  }
  const caseFromQuery = route.query?.case
  if (caseFromQuery) {
    await nextTick() // wait for caseOptions to update after selectedAgentName
    const opts = caseOptions.value
    if (opts?.length) {
      const match = opts.find((o) => String(o._id ?? o.id) === caseFromQuery || (o?.caseName ?? '') === caseFromQuery)
      if (match) selectedCaseId.value = match._id ?? match.id ?? match.caseName ?? ''
    }
  }
  loadReportData()
})
</script>

<style scoped>
.agent-report-container {
  padding: 24px;
}
</style>
