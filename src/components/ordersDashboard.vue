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

      <!-- Tabs and Filter -->
      <v-row class="mb-2" align="center">
        <v-col cols="12" md="8">
          <v-tabs v-model="activeTab" density="comfortable">
            <v-tab value="tables">{{ t('ordersDashboard.tabs.tables') }}</v-tab>
            <v-tab value="cards">{{ t('ordersDashboard.tabs.cards') }}</v-tab>
          </v-tabs>
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="selectedCaseType"
            :items="caseTypeOptions"
            :label="t('ordersDashboard.filterByCaseType')"
            clearable
            density="comfortable"
            hide-details
          />
        </v-col>
      </v-row>
    </div>

    <!-- Revenue Summary Row -->
    <v-card class="mb-4 pa-2 revenue-summary" elevation="2">
      <v-row align="center" justify="center">
        <v-col cols="6" class="text-center">
          <div class="text-subtitle-2 font-weight-bold text-primary">{{ t('ordersDashboard.revenue.estimated') }}</div>
          <div class="text-h6 font-weight-bold">€{{ estimatedRevenueTotal.toFixed(2) }}</div>
        </v-col>
        <v-col cols="6" class="text-center">
          <div class="text-subtitle-2 font-weight-bold text-success">{{ t('ordersDashboard.revenue.current') }}</div>
          <div class="text-h6 font-weight-bold">€{{ currentRevenueTotal.toFixed(2) }}</div>
        </v-col>
      </v-row>
    </v-card>
    
    <h1 class="text-h4 mb-4" style="width: 100%;">{{ t('ordersDashboard.allCases') }} - {{ getFormattedDateRange() }}</h1>

    <v-window v-model="activeTab">
      <v-window-item value="tables">
        <div v-for="group in groupedOrdersByCaseType" :key="group.caseType" class="mb-6">
          <v-card elevation="2" class="mb-2">
            <v-card-title class="text-h6">
              {{ group.caseType === 'Unspecified' ? t('ordersDashboard.unspecified') : (group.caseType || t('ordersDashboard.unspecified')) }}
              <v-chip size="small" class="ml-2">
                {{ group.items.length }} {{ group.items.length === 1 ? t('ordersDashboard.case') : t('ordersDashboard.cases') }}
              </v-chip>
            </v-card-title>
          </v-card>
          <v-card elevation="1">
            <v-data-table
              :headers="tableHeaders"
              :items="group.items"
              item-value="_id"
              class="elevation-0"
              :items-per-page="25"
              density="comfortable"
              show-expand
              :expanded="Array.from(expandedRows)"
              @update:expanded="(value) => { expandedRows = new Set(value) }"
              @click:row="(event, row) => navigateToOrderDetails(row.item)"
            >
            <template #item.data-table-expand="{ item }">
              <v-btn
                v-if="item.isMultiMonth"
                icon
                size="small"
                variant="text"
                @click.stop="toggleExpand(item._id)"
              >
                <v-icon>{{ expandedRows.has(item._id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </v-btn>
              <v-icon v-else size="small" color="transparent">mdi-circle-outline</v-icon>
            </template>
            <template #expanded-row="{ item }">
              <tr v-if="item.isMultiMonth && item.monthlyBreakdown">
                <td :colspan="tableHeaders.length">
                  <div class="pa-4 bg-grey-lighten-4">
                    <h3 class="text-h6 mb-3">{{ t('ordersDashboard.monthlyBreakdown.title') }}</h3>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th>{{ t('ordersDashboard.monthlyBreakdown.month') }}</th>
                          <th>{{ t('ordersDashboard.monthlyBreakdown.dateRange') }}</th>
                          <th>{{ t('ordersDashboard.monthlyBreakdown.quantityCompleted') }}</th>
                          <th>{{ t('ordersDashboard.monthlyBreakdown.revenue') }}</th>
                          <th>{{ t('ordersDashboard.monthlyBreakdown.goal') }}</th>
                          <th>{{ t('ordersDashboard.monthlyBreakdown.percentageToGoal') }}</th>
                          <th>{{ t('ordersDashboard.monthlyBreakdown.remaining') }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="month in item.monthlyBreakdown" :key="month.monthKey">
                          <td>{{ getMonthName(month.month) }} {{ month.year }}</td>
                          <td>{{ formatDateDetailed(month.startDateStr) }} - {{ formatDateDetailed(month.endDateStr) }}</td>
                          <td>{{ month.quantityCompleted }}</td>
                          <td>{{ formatCurrency(month.revenue) }}</td>
                          <td>{{ formatCurrency(getMonthlyRevenueGoal(item, month)) }}</td>
                          <td>
                            <span :class="['percentage-badge', getMonthlyPercentageToGoalClass(item, month)]">
                              {{ getMonthlyPercentageToGoal(item, month) }}%
                            </span>
                          </td>
                          <td>{{ Math.max(0, item.totalQuantity - getTotalCompletedUpToMonth(item.monthlyBreakdown, month.monthKey)) }}</td>
                        </tr>
                        <tr class="font-weight-bold">
                          <td colspan="2">{{ t('ordersDashboard.monthlyBreakdown.total') }}</td>
                          <td>{{ getTotalQuantity(item.monthlyBreakdown) }}</td>
                          <td>{{ formatCurrency(getTotalRevenue(item.monthlyBreakdown)) }}</td>
                          <td></td>
                          <td></td>
                          <td>{{ Math.max(0, item.totalQuantity - getTotalQuantity(item.monthlyBreakdown)) }}</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </div>
                </td>
              </tr>
            </template>
            <template #item.caseName="{ item }">
              <div class="d-flex align-center">
                <span class="mr-2">{{ item.caseName }}</span>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="grey"
                  title="Edit case"
                  @click.stop="editCaseFromOrder(item)"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-chip v-if="item.isMultiMonth" size="x-small" color="primary" class="ml-1">
                  {{ t('ordersDashboard.multiMonth') }}
                </v-chip>
              </div>
            </template>
            <template #item.callers="{ item }">
              {{ getCallerNames(item) }}
            </template>
            <template #item.goal="{ item }">
              {{ formatCurrency(Number(item.estimatedRevenue) || 0) }}
            </template>
            <template #item.revenue="{ item }">
              {{ formatCurrency(computeOrderRevenue(item)) }}
            </template>
            <template #item.percentageToGoal="{ item }">
              <span :class="['percentage-badge', getPercentageToGoalClass(item)]">
                {{ computePercentageToGoal(item) }}%
              </span>
            </template>
            <template #item.teamGoals="{ item }">
              {{ computeOrderQuantity(item) }} / {{ item.totalQuantity || 0 }}
            </template>
            <template #item.startDate="{ item }">
              {{ formatDate(item.startDate) }}
            </template>
            <template #item.deadline="{ item }">
              {{ formatDate(item.deadline) }}
            </template>
            </v-data-table>
          </v-card>
        </div>
      </v-window-item>

      <v-window-item value="cards">
        <div v-for="group in groupedOrdersByCaseTypeForCards" :key="`cards-${group.caseType}`" class="mb-6">
          <v-card elevation="2" class="mb-2">
            <v-card-title class="text-h6">
              {{ group.caseType === 'Unspecified' ? t('ordersDashboard.unspecified') : (group.caseType || t('ordersDashboard.unspecified')) }}
              <v-chip size="small" class="ml-2">
                {{ group.items.length }} {{ group.items.length === 1 ? t('ordersDashboard.case') : t('ordersDashboard.cases') }}
              </v-chip>
            </v-card-title>
          </v-card>
          <div class="grid-container">
            <DashboardCard01
              v-for="(order, index) in group.items"
              :key="`${group.caseType}-${order._id || index}`"
              :order="order"
              :agents="gcAgents"
              :dailyLogs="dailyLogs"
              :monthWeeks="monthWeeks"
            />
          </div>
        </div>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth, getMonthWeeks } from '@/js/dateUtils';
import DashboardCard01 from '@/partials/dashboard/caseCard2.vue'
import DateHeader from '@/components/DateHeader.vue'
import { orderSpansMultipleMonths, calculateMonthlyProgress } from '@/js/statsUtils'

const store = useStore()
const router = useRouter()
const { t } = useI18n()
const activeTab = ref('tables')

const tableHeaders = computed(() => [
  { title: '', key: 'data-table-expand', sortable: false, width: '40px' },
  { title: t('ordersDashboard.tableHeaders.caseName'), key: 'caseName' },
  { title: t('ordersDashboard.tableHeaders.status'), key: 'orderStatus' },
  { title: t('ordersDashboard.tableHeaders.callers'), key: 'callers', sortable: false },
  { title: t('ordersDashboard.tableHeaders.pricePerUnit'), key: 'pricePerUnit' },
  { title: t('ordersDashboard.tableHeaders.unit'), key: 'caseUnit' },
  { title: t('ordersDashboard.tableHeaders.teamGoals'), key: 'teamGoals', sortable: false },
  { title: t('ordersDashboard.tableHeaders.revenueGoal'), key: 'goal', sortable: false },
  { title: t('ordersDashboard.tableHeaders.currentRevenue'), key: 'revenue', sortable: false },
  { title: t('ordersDashboard.tableHeaders.percentageToGoal'), key: 'percentageToGoal', sortable: true },
  { title: t('ordersDashboard.tableHeaders.start'), key: 'startDate' },
  { title: t('ordersDashboard.tableHeaders.deadline'), key: 'deadline' },
])

const orders = computed(() => store.getters['orders'])
const gcAgents = computed(() => store.getters['gcAgents'])
const dailyLogs = computed(() => store.getters['dailyLogs'])
const currentDateRange = computed(() => store.getters['currentDateRange'])
const caseTypes = computed(() => store.getters['caseTypes'] || [])
// Custom weeks for current month
const monthWeeks = ref([])

// Track expanded rows for multi-month cases
const expandedRows = ref(new Set())

// Case type filter
const selectedCaseType = ref(null)

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

// Enrich orders with multi-month information
const enrichedOrders = computed(() => {
  let enriched = filteredOrders.value.map(order => {
    const isMultiMonth = orderSpansMultipleMonths(order);
    const monthlyBreakdown = isMultiMonth ? calculateMonthlyProgress(order, dailyLogs.value) : null;
    
    return {
      ...order,
      isMultiMonth,
      monthlyBreakdown,
    };
  });
  
  // Apply case type filter
  if (selectedCaseType.value) {
    enriched = enriched.filter(order => order.caseType === selectedCaseType.value);
  }
  
  return enriched;
});

// Filtered orders for cards view (with case type filter)
const filteredOrdersByCaseType = computed(() => {
  let filtered = filteredOrders.value;
  
  // Apply case type filter
  if (selectedCaseType.value) {
    filtered = filtered.filter(order => order.caseType === selectedCaseType.value);
  }
  
  return filtered;
});

// Case type options for dropdown (include "All" option)
const caseTypeOptions = computed(() => {
  return [
    ...caseTypes.value.map(type => ({ title: type, value: type })),
  ];
});

// Group filtered orders by case type for cards view (respects filter if selected)
const groupedOrdersByCaseTypeForCards = computed(() => {
  // Get orders to group (already filtered by date range)
  const ordersToGroup = filteredOrdersByCaseType.value;
  
  // Group by case type
  const groups = {};
  
  // Initialize groups with all case types
  caseTypes.value.forEach(type => {
    groups[type] = {
      caseType: type,
      items: []
    };
  });
  
  // Add an "Unspecified" group for orders without a case type
  groups['Unspecified'] = {
    caseType: 'Unspecified',
    items: []
  };
  
  // Distribute orders into groups
  ordersToGroup.forEach(order => {
    const type = order.caseType || 'Unspecified';
    if (!groups[type]) {
      groups[type] = {
        caseType: type,
        items: []
      };
    }
    groups[type].items.push(order);
  });

  // Sort items inside each group alphabetically by case name
  Object.values(groups).forEach(group => {
    group.items.sort((a, b) => {
      const nameA = String(a.caseName || '').toLowerCase()
      const nameB = String(b.caseName || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })
  })

  // Return groups that have items, sorted by case type name
  return Object.values(groups)
    .filter(group => group.items.length > 0)
    .sort((a, b) => {
      // Sort "Unspecified" to the end
      if (a.caseType === 'Unspecified') return 1;
      if (b.caseType === 'Unspecified') return -1;
      return a.caseType.localeCompare(b.caseType);
    });
});

// Group orders by case type for display
const groupedOrdersByCaseType = computed(() => {
  // Get all case types from the store and create groups
  const groups = {};
  
  // Initialize groups with all case types
  caseTypes.value.forEach(type => {
    groups[type] = {
      caseType: type,
      items: []
    };
  });
  
  // Add an "Unspecified" group for orders without a case type
  groups['Unspecified'] = {
    caseType: 'Unspecified',
    items: []
  };
  
  // Distribute enriched orders into groups
  enrichedOrders.value.forEach(order => {
    const type = order.caseType || 'Unspecified';
    if (!groups[type]) {
      groups[type] = {
        caseType: type,
        items: []
      };
    }
    groups[type].items.push(order);
  });

  // Sort items inside each group alphabetically by case name
  Object.values(groups).forEach(group => {
    group.items.sort((a, b) => {
      const nameA = String(a.caseName || '').toLowerCase()
      const nameB = String(b.caseName || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })
  })

  // Return groups that have items, sorted by case type name
  return Object.values(groups)
    .filter(group => group.items.length > 0)
    .sort((a, b) => {
      // Sort "Unspecified" to the end
      if (a.caseType === 'Unspecified') return 1;
      if (b.caseType === 'Unspecified') return -1;
      return a.caseType.localeCompare(b.caseType);
    });
});

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

// Calculate estimated revenue total from filtered orders (respects case type filter, excludes test cases)
const estimatedRevenueTotal = computed(() => {
  const ordersToCalculate = selectedCaseType.value ? filteredOrdersByCaseType.value : filteredOrders.value;
  if (!ordersToCalculate || ordersToCalculate.length === 0) {
    return 0;
  }
  
  // Filter out test cases
  const nonTestOrders = ordersToCalculate.filter(order => !isTestCase(order));
  
  return nonTestOrders.reduce((total, order) => {
    return total + (Number(order.estimatedRevenue) || 0);
  }, 0);
});

// Calculate current revenue from daily logs for filtered orders using custom weeks
const currentRevenueTotal = computed(() => {
  const ordersToCalculate = selectedCaseType.value ? filteredOrdersByCaseType.value : filteredOrders.value;
  if (!dailyLogs.value || !ordersToCalculate || !monthWeeks.value) {
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

  // Filter daily logs within the custom week date range, excluding "case good call" and test cases
  const logsInMonth = dailyLogs.value.filter(log => {
    const logDate = new Date(log.date);
    const isInDateRange = logDate >= monthStart && logDate <= monthEnd;
    const isNotCaseGoodCall = log.caseName !== 'case good call';
    
    // Check if the log's case name indicates test
    const caseName = String(log.caseName || '').toLowerCase();
    const isNotTest = !caseName.includes('test');
    
    return isInDateRange && isNotCaseGoodCall && isNotTest;
  });

  // Calculate revenue from quantity completed, excluding test cases
  let totalRevenue = 0;
  
  logsInMonth.forEach(log => {
    const quantityCompleted = Number(log.quantityCompleted) || 0;
    
    // Find the order for this log to get price per unit
    const order = ordersToCalculate.find(o => 
      o.caseName === log.caseName || 
      String(o._id) === String(log.order?._id || log.order || log.orderId)
    );
    
    // Skip if order is a test case
    if (order && !isTestCase(order)) {
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

    return `${fmt(minStart)} ${t('ordersDashboard.dateFormat.through')} ${fmt(maxEnd)}`
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

function computePercentageToGoal(order) {
  const goal = Number(order?.estimatedRevenue) || 0
  if (!goal) {
    return 0
  }
  const revenue = computeOrderRevenue(order)
  const percentage = (revenue / goal) * 100
  if (!isFinite(percentage) || isNaN(percentage)) {
    return 0
  }
  return Math.round(percentage)
}

function getPercentageToGoalClass(order) {
  const pct = computePercentageToGoal(order)
  if (pct <= 25) return 'percentage-red'
  if (pct > 25 && pct <= 50) return 'percentage-orange'
  if (pct > 50 && pct <= 75) return 'percentage-yellow'
  return 'percentage-green'
}

function getMonthlyRevenueGoal(order, month) {
  const goals = order?.monthlyRevenueGoals || {}
  const raw = goals[month.monthKey]
  return Number(raw) || 0
}

function getMonthlyPercentageToGoal(order, month) {
  const goal = getMonthlyRevenueGoal(order, month)
  if (!goal) return 0
  const revenue = Number(month?.revenue) || 0
  const pct = (revenue / goal) * 100
  if (!isFinite(pct) || isNaN(pct)) return 0
  return Math.round(pct)
}

function getMonthlyPercentageToGoalClass(order, month) {
  const pct = getMonthlyPercentageToGoal(order, month)
  if (pct <= 25) return 'percentage-red'
  if (pct > 25 && pct <= 50) return 'percentage-orange'
  if (pct > 50 && pct <= 75) return 'percentage-yellow'
  return 'percentage-green'
}

function getCallerNames(order) {
  if (!order.assignedCallers || !Array.isArray(order.assignedCallers)) return ''
  return order.assignedCallers
    .map(id => gcAgents.value.find(agent => agent._id === id)?.name || t('ordersDashboard.unknown'))
    .join(', ')
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

function navigateToOrderDetails(order) {
  if (!order || !order._id) return
  console.log('Navigating to order details for order:', order._id)
  router.push({
    name: 'orderDetails',
    query: { orderId: order._id }
  })
}

function editCaseFromOrder(order) {
  if (!order) return
  // order.caseId can be a string or an object; handle both
  const rawCaseId = order.caseId ?? order.case?._id ?? order.case?.id ?? null
  const caseId =
    typeof rawCaseId === 'object'
      ? rawCaseId._id ?? rawCaseId.id ?? null
      : rawCaseId

  if (!caseId) {
    console.warn('editCaseFromOrder: no caseId found on order', order)
    return
  }

  router.push({
    name: 'addCaseForm',
    query: { caseId: caseId },
  })
}

function getMonthName(monthNum) {
  const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december']
  const key = monthKeys[monthNum - 1]
  return key ? t(`ordersDashboard.months.${key}`) : ''
}

function formatDateDetailed(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

onMounted(async () => {
  try {
    // Register this component as active
    store.commit('addActiveComponent', 'ordersDashboard');
    
    // Selective fetching - only fetch data needed for orders dashboard
    await store.dispatch('fetchForContext', 'ordersDashboard');
    
    // Ensure case types are loaded
    try {
      await store.dispatch('fetchCaseTypes');
    } catch (e) {
      console.warn('Failed to fetch case types:', e);
    }
    
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
    
    // Setup auto-refresh for daily logs
    setupAutoRefresh()
  } catch (error) {
    console.error('Error fetching data on mount:', error)
  }
})

onUnmounted(() => {
  // Unregister this component when it's destroyed
  store.commit('removeActiveComponent', 'ordersDashboard');
  
  // Clean up auto-refresh interval
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
  
  // Remove focus event listener
  if (focusHandler.value) {
    window.removeEventListener('focus', focusHandler.value);
    focusHandler.value = null;
  }
})

// Reload custom weeks when date range (month) changes
watch(currentDateRange, async (newRange) => {
  if (newRange && newRange.length >= 2) {
    await loadMonthWeeks()
  }
})

// Watch for changes in dailyLogs length to ensure breakdown refreshes
watch(
  () => dailyLogs.value?.length,
  async (newLength, oldLength) => {
    // If logs are added/removed, the computed properties will auto-update
    // But we should also check if we need to refresh from server
    if (oldLength !== undefined && newLength !== oldLength) {
      console.log('Daily logs count changed, refreshing data...');
    }
  }
)

// Refresh daily logs periodically and on window focus to catch new data
const refreshInterval = ref(null)
const focusHandler = ref(null)

function setupAutoRefresh() {
  // Refresh every 30 seconds if component is active
  refreshInterval.value = setInterval(async () => {
    if (document.hasFocus() && store.state.activeComponents.has('ordersDashboard')) {
      try {
        await store.dispatch('fetchDailyLogs', true) // Force refresh
      } catch (e) {
        console.warn('Failed to refresh daily logs:', e)
      }
    }
  }, 30000)
  
  // Also refresh when window gains focus
  focusHandler.value = async () => {
    if (store.state.activeComponents.has('ordersDashboard')) {
      try {
        await store.dispatch('fetchDailyLogs', true) // Force refresh
      } catch (e) {
        console.warn('Failed to refresh daily logs on focus:', e)
      }
    }
  }
  
  window.addEventListener('focus', focusHandler.value)
}

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
      max-width: 338px; /* Reduced by 25% from 450px */
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
  @media (max-width: 1400px) {
    .grid-container {
      grid-template-columns: repeat(4, 1fr) !important; /* 3 columns for medium screens like Surface Pro 6 */
      width: 100% !important;
    }
  }

  @media (max-width: 960px) {
    .grid-container {
      grid-template-columns: repeat(2, 1fr); /* 2 cards for tablets */
      width: 100% !important;
    }
  }

  @media (max-width: 768px) {
    .grid-container {
      grid-template-columns: 1fr !important; /* 1 card for phones *
      width: 100% !important;
      gap: 8px; /* Reduce gap for mobile */
    }
    
    .small-card {
      max-width: 100% !important; /* Full width on mobile */
      width: 100% !important;
    }
    
    /* Override the case-card width for mobile */
    .case-card {
      width: 100% !important;
      max-width: 100% !important;
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
  
  /* Make table rows clickable */
  :deep(.v-data-table__tr) {
    cursor: pointer;
  }
  
  :deep(.v-data-table__tr:hover) {
    background-color: rgba(0, 0, 0, 0.04) !important;
  }
  
  .revenue-summary .text-success {
    color: #198754 !important;
  }

  /* % to goal badge coloring (match case cards) */
  .percentage-badge {
    display: inline-block;
    color: #151313;
    font-weight: 600;
    font-size: 0.875rem;
    padding: 2px 8px;
    border-radius: 9999px;
  }

  .percentage-red {
    background-color: #f35555;
  }
  .percentage-orange {
    background-color: #e8b731;
  }
  .percentage-yellow {
    background-color: #eaea08;
  }
  .percentage-green {
    background-color: #10b981;
  }
</style>
