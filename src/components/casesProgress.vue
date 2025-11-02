<template>
  <v-container>
    <DateHeader
      :currentDateRange="currentDateRange"
      :monthWeeks="monthWeeks"
      :showMonthOnly="true"
      @prev="getPreviousMonth"
      @next="getNextMonth"
    />
    <h1 class="text-h5 mb-4">Case Progress (Admin/Manager)</h1>

    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedCaseType"
          :items="caseTypes"
          label="Filter by Case Type"
          clearable
        />
      </v-col>
    </v-row>

    <div v-for="group in groupedByCaseType" :key="group.caseType" class="mb-8">
      <h2 class="text-h6 mb-2">{{ group.caseType || 'Unspecified' }}</h2>
      <v-data-table
        :headers="headers"
        :items="group.items"
        class="elevation-1"
        density="comfortable"
        :items-per-page="10"
        show-expand
        :expanded="Array.from(expandedRows)"
        @update:expanded="(value) => { expandedRows = new Set(value) }"
        item-value="orderId"
      >
        <template #item.data-table-expand="{ item }">
          <v-btn
            v-if="item.isMultiMonth"
            icon
            size="small"
            variant="text"
            @click.stop="toggleExpand(item.orderId)"
          >
            <v-icon>{{ expandedRows.has(item.orderId) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </v-btn>
          <v-icon v-else size="small" color="transparent">mdi-circle-outline</v-icon>
        </template>
        <template #expanded-row="{ item }">
          <tr v-if="item.isMultiMonth && item.monthlyBreakdown">
            <td :colspan="headers.length">
              <div class="pa-4 bg-grey-lighten-4">
                <h3 class="text-h6 mb-3">Monthly Breakdown</h3>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Date Range</th>
                      <th>Quantity Completed</th>
                      <th>Revenue (€)</th>
                      <th>Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="month in item.monthlyBreakdown" :key="month.monthKey">
                      <td>{{ getMonthName(month.month) }} {{ month.year }}</td>
                      <td>{{ formatDate(month.startDateStr) }} - {{ formatDate(month.endDateStr) }}</td>
                      <td>{{ month.quantityCompleted }}</td>
                      <td>€{{ formatCurrency(month.revenue) }}</td>
                      <td>{{ Math.max(0, item.monthGoal - getTotalCompletedUpToMonth(item.monthlyBreakdown, month.monthKey)) }}</td>
                    </tr>
                    <tr class="font-weight-bold">
                      <td colspan="2">Total</td>
                      <td>{{ getTotalQuantity(item.monthlyBreakdown) }}</td>
                      <td>€{{ formatCurrency(getTotalRevenue(item.monthlyBreakdown)) }}</td>
                      <td>{{ Math.max(0, item.monthGoal - getTotalQuantity(item.monthlyBreakdown)) }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </td>
          </tr>
        </template>
        <template #item.revenueNow="{ item }">€{{ formatCurrency(item.revenueNow) }}</template>
        <template #item.revenueGoal="{ item }">€{{ formatCurrency(item.revenueGoal) }}</template>
        <template #item.projectManagementFee="{ item }">€{{ formatCurrency(item.projectManagementFee) }}</template>
        <template #item.projectStartFee="{ item }">€{{ formatCurrency(item.projectStartFee) }}</template>
        <template #item.invoicePrice="{ item }">€{{ formatCurrency(item.invoicePrice) }}</template>
        <template #item.totalPrice="{ item }">€{{ formatCurrency(item.totalPrice) }}</template>
        <template #item.caseName="{ item }">
          <span>
            {{ item.caseName }}
            <v-chip v-if="item.isMultiMonth" size="x-small" color="primary" class="ml-2">
              Multi-Month
            </v-chip>
          </span>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon size="small" color="grey" title="Edit Order" @click="editOrder(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </div>
  </v-container>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import DateHeader from '@/components/DateHeader.vue'
import { goToNextMonth, goToPreviousMonth } from '@/js/dateUtils'
import { useRouter } from 'vue-router'
import { orderSpansMultipleMonths, calculateMonthlyProgress } from '@/js/statsUtils'

// Helper function to check if an order is a test case
function isTestCase(order) {
  if (!order) return false;
  
  // Check caseType (case-insensitive)
  const caseType = String(order.caseType || '').toLowerCase();
  if (caseType.includes('test')) return true;
  
  // Check caseName (case-insensitive)
  const caseName = String(order.caseName || '').toLowerCase();
  if (caseName.includes('test')) return true;
  
  // Check for explicit isTest flag
  if (order.isTest === true || order.test === true) return true;
  
  return false;
}

const headers = [
  { title: '', key: 'data-table-expand', sortable: false, width: '40px' },
  { title: 'Case Name', key: 'caseName', sortable: true },
  { title: 'Case Unit', key: 'caseUnit', sortable: true },
  { title: 'Managers', key: 'managers', sortable: false },
  { title: 'Month Goal', key: 'monthGoal', sortable: true },
  { title: 'Current Amount', key: 'currentAmount', sortable: true },
  { title: 'Goal Missing', key: 'goalMissing', sortable: true },
  { title: 'Revenue Now', key: 'revenueNow', sortable: true },
  { title: 'Revenue Goal', key: 'revenueGoal', sortable: true },
  { title: 'Project Managment Fee', key: 'projectManagementFee', sortable: true },
  { title: 'Project start fee', key: 'projectStartFee', sortable: true },
  { title: 'Invioce price', key: 'invoicePrice', sortable: true },
  { title: 'Total Price', key: 'totalPrice', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// Vuex store orders
const store = useStore()
const router = useRouter()
const orders = computed(() => store.getters['orders'] || [])
const gcCases = computed(() => store.getters['gcCases'] || [])
const dailyLogs = computed(() => store.getters['dailyLogs'] || [])
const agents = computed(() => store.getters['gcAgents'] || [])
const agentIdToName = computed(() => {
  const m = new Map()
  for (const a of agents.value) {
    m.set(String(a._id || a.id), a.name || '')
  }
  return m
})
const caseIdToCase = computed(() => {
  const map = new Map()
  for (const c of gcCases.value) {
    // Support multiple possible field names for the monthly goal
    const monthGoal = c.monthGoal ?? c.monthlyGoal ?? c.goal ?? 0
    const projectStartFee = c.projectStartFee ?? c.startFee ?? 0
    const invoicePrice = c.invoicePrice ?? c.pricePerUnit ?? 0
    // Normalize managers as a comma-separated string of names
    const managers = Array.isArray(c.managers)
      ? c.managers.map(m => m.name || m).join(', ')
      : (c.managerName || c.manager || '')
    map.set(c._id || c.id, { ...c, monthGoal, projectStartFee, invoicePrice, managers })
  }
  return map
})
const currentDateRange = computed(() => store.getters['currentDateRange'])
const monthWeeks = ref([])

// Track expanded rows for each case type group
const expandedRows = ref(new Set())

function getPreviousMonth() {
  const prev = goToPreviousMonth(currentDateRange.value)
  store.commit('setDateRange', prev)
}

function getNextMonth() {
  const next = goToNextMonth(currentDateRange.value)
  store.commit('setDateRange', next)
}

// Filter orders by the selected month (overlap with date range), same logic as ordersDashboard
const filteredOrders = computed(() => {
  const list = orders.value || []
  const range = currentDateRange.value
  if (!range || range.length < 2) return list
  const [startDate, endDate] = range
  const monthStart = new Date(startDate)
  const monthEnd = new Date(endDate)
  return list.filter(order => {
    const orderStart = new Date(order.startDate)
    const orderEnd = new Date(order.deadline)
    return orderStart <= monthEnd && orderEnd >= monthStart
  })
})

// Split orders into arrays by caseType
const caseTypeArrays = computed(() => {
  const groups = {
    'Customer Order': [],
    'Special Invoincing': [],
    'Pilot': [],
    'Interviews': [],
    'Kukki': [],
    'Unspecified': [],
  }
  for (const o of filteredOrders.value) {
    const key = o.caseType && groups[o.caseType] !== undefined ? o.caseType : 'Unspecified'
    const normalized = { ...o, caseType: key }
    groups[key].push(normalized)
  }
  // Debug: validate grouping
  console.log('[casesProgress] caseType arrays:', Object.fromEntries(Object.entries(groups).map(([k,v]) => [k, v.length])))
  return groups
})

// Debug: log full arrays by case type whenever grouping changes
import { watch } from 'vue'
watch(caseTypeArrays, (val) => {
  const summarized = Object.fromEntries(
    Object.entries(val).map(([k, arr]) => [k, arr.map(o => o.caseName || o.name || o._id || '—')])
  )
  console.log('[casesProgress] arrays by caseType:', summarized)
}, { deep: true, immediate: true })

// Placeholder row used only when no data is available yet
const placeholderRow = {
  caseType: 'Unspecified',
  caseName: '—',
  caseUnit: '—',
  managers: '',
  monthGoal: 0,
  currentAmount: 0,
  goalMissing: 0,
  revenueNow: 0,
  revenueGoal: 0,
  projectStartFee: 0,
  invoicePrice: 0,
  totalPrice: 0,
}

const caseTypes = ['Customer Order', 'Special Invoincing', 'Pilot', 'Interviews', 'Kukki']
const selectedCaseType = ref(null)

// Build table rows from orders split; pulls Month Goal from case collection
const tableRowsFromOrders = computed(() => {
  const rows = []
  Object.entries(caseTypeArrays.value).forEach(([caseType, arr]) => {
    arr.forEach(o => {
      const caseMeta = caseIdToCase.value.get(o.caseId) || {}
      // Managers come from the order per spec
      const managers = (() => {
        if (!o.manager) return caseMeta.managers || ''
        // If manager is an id (string), look up in agents
        if (typeof o.manager === 'string') {
          return agentIdToName.value.get(String(o.manager)) || caseMeta.managers || o.manager
        }
        // If manager is an object with id
        const managerId = o.manager?._id || o.manager?.id
        if (managerId) {
          return agentIdToName.value.get(String(managerId)) || o.manager?.name || caseMeta.managers || ''
        }
        return o.manager?.name || caseMeta.managers || ''
      })()

      // Month Goal and Revenue Goal from order
      const monthGoal = Number(o.totalQuantity || 0)
      const revenueGoal = Number(o.estimatedRevenue || 0)

      // Check if order spans multiple months
      const isMultiMonth = orderSpansMultipleMonths(o)
      const monthlyBreakdown = isMultiMonth ? calculateMonthlyProgress(o, dailyLogs.value) : null

      // Current Amount = sum of quantityCompleted from daily logs for this order within current month
      const range = currentDateRange.value || []
      const [startDate, endDate] = range
      const monthStart = startDate ? new Date(startDate) : null
      const monthEnd = endDate ? new Date(endDate) : null
      const isInRange = (d) => {
        if (!monthStart || !monthEnd) return true
        const x = new Date(d)
        return x >= monthStart && x <= monthEnd
      }
      const isOrderMatch = (log) => {
        const orderId = o._id || o.id
        return (
          (log.order?._id && orderId && String(log.order._id) === String(orderId)) ||
          (log.caseId && o.caseId && String(log.caseId) === String(o.caseId)) ||
          (log.caseName && o.caseName && String(log.caseName) === String(o.caseName))
        )
      }
      const currentAmount = dailyLogs.value
        .filter(l => isInRange(l.date) && isOrderMatch(l))
        .reduce((sum, l) => sum + (Number(l.quantityCompleted) || 0), 0)

      // For multi-month cases, calculate total completed across all months
      const totalCompleted = isMultiMonth && monthlyBreakdown
        ? monthlyBreakdown.reduce((sum, m) => sum + m.quantityCompleted, 0)
        : currentAmount

      // Revenue Now = currentAmount * unit price from order (exclude test cases)
      const isTest = isTestCase(o)
      const unitPrice = Number(o.pricePerUnit || 0)
      const revenueNow = isTest ? 0 : currentAmount * unitPrice

      // Placeholders for now; will be computed from logs/orders per month later
      const goalMissing = Math.max(monthGoal - totalCompleted, 0)
      // Fees/prices: invoice price from order.pricePerUnit, start fee from order
      const projectStartFee = Number(o.ProjectStartFee || o.projectStartFee || 0)
      const invoicePrice = Number(o.pricePerUnit || caseMeta.invoicePrice || 0)
      const projectManagementFee = Number(o.ProjectManagmentFee || o.projectManagementFee || 0)
      // Total price = Start Fee + Management Fee + Revenue Goal (per spec)
      const totalPrice = projectStartFee + projectManagementFee + revenueGoal

      rows.push({
        caseType,
        caseName: o.caseName || o.name || '—',
        caseUnit: o.caseUnit || '—',
        managers,
        orderId: o._id || o.id,
        order: o, // Store original order for monthly breakdown
        monthGoal,
        currentAmount,
        totalCompleted, // Total across all months
        goalMissing,
        revenueNow,
        revenueGoal,
        projectManagementFee,
        projectStartFee,
        invoicePrice,
        totalPrice,
        isMultiMonth,
        monthlyBreakdown,
      })
    })
  })
  // Debug: surface sample of rows
  console.log('[casesProgress] table rows sample:', rows.slice(0, 5))
  return rows
})

// Ensure data is loaded when page mounts (mirror ordersDashboard pattern)
onMounted(async () => {
  try {
    store.commit('addActiveComponent', 'casesProgress')
    // Reuse existing context fetcher if available
    if (store.dispatch) {
      try { await store.dispatch('fetchForContext', 'ordersDashboard') } catch {}
    }
    // Initialize date range if missing
    if (!currentDateRange.value || currentDateRange.value.length < 2) {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()
      const firstDay = new Date(Date.UTC(year, month, 1))
      const lastDay = new Date(Date.UTC(year, month + 1, 0))
      const fmt = (d) => d.toISOString().split('T')[0]
      store.commit('setDateRange', [fmt(firstDay), fmt(lastDay)])
    }
  } catch (e) {
    console.warn('[casesProgress] onMounted error:', e)
  }
})

onUnmounted(() => {
  store.commit('removeActiveComponent', 'casesProgress')
})

const filteredRows = computed(() => {
  const source = tableRowsFromOrders.value.length ? tableRowsFromOrders.value : [placeholderRow]
  if (!selectedCaseType.value) return source
  return source.filter(r => r.caseType === selectedCaseType.value)
})

const groupedByCaseType = computed(() => {
  const groups = {}
  filteredRows.value.forEach(r => {
    const key = r.caseType || 'Unspecified'
    if (!groups[key]) groups[key] = []
    groups[key].push(r)
  })
  return Object.entries(groups).map(([caseType, items]) => ({ caseType, items }))
})

function formatCurrency(n) {
  const v = Number(n || 0)
  return v.toFixed(2)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getMonthName(monthNum) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  return months[monthNum - 1] || ''
}

function getTotalQuantity(monthlyBreakdown) {
  if (!monthlyBreakdown || !Array.isArray(monthlyBreakdown)) return 0
  return monthlyBreakdown.reduce((sum, m) => sum + (m.quantityCompleted || 0), 0)
}

function getTotalRevenue(monthlyBreakdown) {
  if (!monthlyBreakdown || !Array.isArray(monthlyBreakdown)) return 0
  return monthlyBreakdown.reduce((sum, m) => sum + (m.revenue || 0), 0)
}

function getTotalCompletedUpToMonth(monthlyBreakdown, upToMonthKey) {
  if (!monthlyBreakdown || !Array.isArray(monthlyBreakdown)) return 0
  let total = 0
  for (const m of monthlyBreakdown) {
    if (m.monthKey <= upToMonthKey) {
      total += (m.quantityCompleted || 0)
    }
  }
  return total
}

function toggleExpand(orderId) {
  const newExpanded = new Set(expandedRows.value)
  if (newExpanded.has(orderId)) {
    newExpanded.delete(orderId)
  } else {
    newExpanded.add(orderId)
  }
  expandedRows.value = newExpanded
}

function editOrder(item) {
  const id = item.orderId
  if (!id) return
  router.push({ name: 'editOrderForm', params: { id } })
}
</script>

<style scoped>
::deep(.v-data-table__wrapper) { overflow-x: auto; }
::deep(.v-data-table table) { min-width: 1100px; }
</style>


