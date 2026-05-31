<template>
  <div class="analytics-root">
    <div class="kpi-row mb-4">
      <v-card
        v-for="(card, idx) in kpiCards"
        :key="idx"
        class="kpi-card"
        elevation="2"
        rounded="lg"
      >
        <v-card-text class="kpi-card-inner pa-2 px-3">
          <div class="kpi-title text-medium-emphasis font-weight-medium">{{ card.title }}</div>
          <div class="kpi-value font-weight-bold my-1">{{ card.value }}</div>
          <div class="kpi-progress-track mb-1">
            <div
              class="kpi-progress-fill"
              :style="{
                width: Math.min(100, card.progress) + '%',
                backgroundColor: card.barColor,
              }"
            />
          </div>
          <div v-if="idx === 0 && isAdmin" class="kpi-breakdown-slot">
            <v-btn
              variant="text"
              density="compact"
              size="x-small"
              class="pa-0 mt-n1 text-none kpi-breakdown-btn"
              @click="toggleBreakdown"
            >
              {{ showRevenueBreakdown ? t('ordersDashboard.charts.hideBreakdown') : t('ordersDashboard.charts.showBreakdown') }}
            </v-btn>
          </div>
          <div v-else class="kpi-subtitle text-medium-emphasis">{{ card.subtitle }}</div>
        </v-card-text>
      </v-card>
    </div>

    <v-expand-transition>
      <div v-if="isAdmin && showRevenueBreakdown" key="revenue-breakdown">
        <v-card class="mb-4 revenue-summary breakdown-table-card" elevation="2" rounded="lg">
          <v-card-text class="pa-3">
            <div class="text-caption font-weight-bold mb-2">{{ t('ordersDashboard.charts.breakdownTitle') }}</div>
            <v-table density="compact" class="text-caption">
              <thead>
                <tr>
                  <th class="text-left">{{ t('ordersDashboard.charts.breakdownCaseType') }}</th>
                  <th class="text-left">{{ t('ordersDashboard.charts.breakdownCase') }}</th>
                  <th class="text-left">{{ t('ordersDashboard.charts.breakdownStatus') }}</th>
                  <th class="text-right">{{ t('ordersDashboard.charts.breakdownGoal') }}</th>
                  <th class="text-right">{{ t('ordersDashboard.charts.breakdownPerUnit') }}</th>
                  <th class="text-right">{{ t('ordersDashboard.charts.breakdownRevenue') }}</th>
                  <th class="text-left">{{ t('ordersDashboard.charts.breakdownIncluded') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in estimatedRevenueBreakdown"
                  :key="i"
                  :class="{ 'bg-grey-lighten-4': !row.included }"
                >
                  <td>{{ row.caseType }}</td>
                  <td>{{ row.caseName }}</td>
                  <td>{{ row.status }}</td>
                  <td class="text-right">{{ formatStatNumber(row.monthlyGoal) }}</td>
                  <td class="text-right">{{ row.pricePerUnit.toFixed(2) }}</td>
                  <td class="text-right">€{{ row.revenue.toFixed(2) }}</td>
                  <td>
                    <span v-if="row.included" class="text-success">{{ t('ordersDashboard.charts.breakdownIncludedYes') }}</span>
                    <span v-else class="text-error">{{ row.excludedReason }}</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </div>
    </v-expand-transition>

    <v-row class="ga-y-4">
      <v-col cols="12" lg="5">
        <v-card class="h-100 chart-card" elevation="2" rounded="lg">
          <v-card-title class="text-subtitle-1 font-weight-bold pb-0">
            {{ t('ordersDashboard.charts.revenueByCaseType') }}
          </v-card-title>
          <v-card-text class="chart-wrap donut-wrap">
            <Doughnut v-if="donutData.labels.length" :data="donutData" :options="donutOptions" />
            <div v-else class="text-medium-emphasis text-body-2 pa-4">{{ t('ordersDashboard.charts.noData') }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="7">
        <v-card class="h-100 chart-card" elevation="2" rounded="lg">
          <v-card-title class="text-subtitle-1 font-weight-bold pb-0">
            {{ t('ordersDashboard.charts.revenueByCase') }}
          </v-card-title>
          <v-card-text class="chart-wrap">
            <div
              class="horizontal-scroll"
              :style="{ height: horizontalBarHeight + 'px' }"
            >
              <Bar v-if="horizontalBarData.labels.length" :data="horizontalBarData" :options="horizontalBarOptions" />
              <div v-else class="text-medium-emphasis text-body-2 pa-4">{{ t('ordersDashboard.charts.noData') }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-4 chart-card" elevation="2" rounded="lg">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        {{ t('ordersDashboard.charts.revenueOverWeeks') }}
      </v-card-title>
      <v-card-text>
        <v-row v-if="facetCharts.length">
          <v-col
            v-for="facet in facetCharts"
            :key="facet.caseType"
            cols="12"
            sm="6"
            lg="3"
          >
            <div class="text-caption font-weight-bold mb-2 text-center">{{ facet.caseType }}</div>
            <div class="facet-chart-height">
              <Bar :data="facet.data" :options="facet.options" />
            </div>
          </v-col>
          <v-col
            v-if="combinedFacetChart && facetCombinedInline"
            cols="12"
            sm="6"
            lg="3"
          >
            <div class="text-caption font-weight-bold mb-2 text-center">
              {{ t('ordersDashboard.charts.revenueOverWeeksCombined') }}
            </div>
            <div class="facet-chart-height">
              <Bar :data="combinedFacetChart.data" :options="combinedFacetChart.options" />
            </div>
          </v-col>
        </v-row>
        <v-row v-if="combinedFacetChart && !facetCombinedInline" class="mt-2">
          <v-col cols="12" sm="10" md="8" lg="6" class="mx-auto">
            <div class="text-caption font-weight-bold mb-2 text-center">
              {{ t('ordersDashboard.charts.revenueOverWeeksCombined') }}
            </div>
            <div class="facet-chart-height combined-facet-chart">
              <Bar :data="combinedFacetChart.data" :options="combinedFacetChart.options" />
            </div>
          </v-col>
        </v-row>
        <div v-if="!facetCharts.length" class="text-medium-emphasis text-body-2">
          {{ t('ordersDashboard.charts.noData') }}
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Doughnut, Bar } from 'vue-chartjs'
import { formatStatNumber, formatCurrencyEUR } from '@/js/formatNumbers'
import { toLocalYmdNumber } from '@/js/dateUtils'

function stackedBarEndX(el) {
  if (!el || !Number.isFinite(el.x)) return null
  const base = Number(el.base)
  return Number.isFinite(base) ? Math.max(el.x, base) : el.x
}

const stackedBarTotalsPlugin = {
  id: 'stackedBarTotals',
  afterDatasetsDraw(chart, _args, pluginOptions) {
    if (!pluginOptions?.enabled) return

    const values = Array.isArray(pluginOptions.values) ? pluginOptions.values : []
    const offset = Number(pluginOptions.offset ?? 6)
    const gap = Number(pluginOptions.gap ?? 12)
    const rightPadding = Number(pluginOptions.rightPadding ?? 4)
    const alignToChartRight = pluginOptions.alignToChartRight === true
    const gapAfterBars = pluginOptions.gapAfterBars === true
    const color = pluginOptions.color || '#424242'
    const font = pluginOptions.font || { size: 11, weight: '700', family: "'Roboto', sans-serif" }

    const currentMeta = chart.getDatasetMeta(0)
    const remainingMeta = chart.getDatasetMeta(1)
    if (!currentMeta?.data?.length) return

    const ctx = chart.ctx
    const { chartArea } = chart
    if (!chartArea) return

    ctx.save()
    ctx.fillStyle = color
    ctx.textBaseline = 'middle'
    ctx.font = `${font.weight || '700'} ${font.size || 11}px ${font.family || 'sans-serif'}`

    let labelX = null
    let textAlign = 'left'

    if (gapAfterBars) {
      let maxBarEndX = chartArea.left
      for (let i = 0; i < values.length; i += 1) {
        const curEnd = stackedBarEndX(currentMeta?.data?.[i])
        const remEnd = stackedBarEndX(remainingMeta?.data?.[i])
        maxBarEndX = Math.max(maxBarEndX, curEnd ?? chartArea.left, remEnd ?? chartArea.left)
      }
      labelX = maxBarEndX + gap
      textAlign = 'left'
    } else if (alignToChartRight) {
      labelX = chartArea.right - rightPadding
      textAlign = 'right'
    }

    ctx.textAlign = textAlign

    for (let i = 0; i < values.length; i += 1) {
      const endEl = remainingMeta?.data?.[i] || currentMeta?.data?.[i]
      if (!endEl) continue
      const barEnd = Math.max(
        stackedBarEndX(currentMeta?.data?.[i]) ?? chartArea.left,
        stackedBarEndX(remainingMeta?.data?.[i]) ?? chartArea.left
      )
      const x = labelX != null ? labelX : barEnd + offset
      ctx.fillText(String(values[i] ?? ''), x, endEl.y)
    }

    ctx.restore()
  },
}

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartDataLabels,
  stackedBarTotalsPlugin
)

const CHANNEL_COLORS = ['#26a69a', '#5d5d5d', '#ef5350', '#ffc107', '#7e57c2', '#42a5f5', '#8d6e63', '#ab47bc']

const props = defineProps({
  orders: { type: Array, default: () => [] },
  dailyLogs: { type: Array, default: () => [] },
  monthWeeks: { type: Array, default: () => [] },
  currentRevenueTotal: { type: Number, default: 0 },
  estimatedRevenueTotal: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  estimatedRevenueBreakdown: { type: Array, default: () => [] },
  showRevenueBreakdown: { type: Boolean, default: false },
})

const emit = defineEmits(['update:showRevenueBreakdown'])

function toggleBreakdown() {
  emit('update:showRevenueBreakdown', !props.showRevenueBreakdown)
}

const { t } = useI18n()

function isTestCase(order) {
  if (!order) return false
  const caseType = String(order.caseType || '').toLowerCase()
  if (caseType.includes('test')) return true
  const caseName = String(order.caseName || '').toLowerCase()
  if (caseName.includes('test')) return true
  if (order.isTest === true || order.test === true) return true
  return false
}

function isGoodCallCase(order) {
  if (!order) return false
  const caseName = String(order.caseName || '').toLowerCase()
  return caseName === 'case good call' || caseName === 'good call'
}

function eligibleOrder(order) {
  if (isTestCase(order) || isGoodCallCase(order)) return false
  return true
}

function getMonthBoundsFromWeeks(weeks) {
  if (!Array.isArray(weeks) || weeks.length === 0) return null
  const starts = weeks.map((w) => new Date(w.start))
  const ends = weeks.map((w) => new Date(w.end))
  const monthStart = new Date(Math.min.apply(null, starts))
  const monthEnd = new Date(Math.max.apply(null, ends))
  monthEnd.setHours(23, 59, 59, 999)
  return { monthStart, monthEnd }
}

function computeOrderQuantity(order, dailyLogs, bounds) {
  if (!order || !Array.isArray(dailyLogs) || !bounds) return 0
  const startN = toLocalYmdNumber(bounds.monthStart)
  const endN = toLocalYmdNumber(bounds.monthEnd)
  if (startN == null || endN == null) return 0
  const oid = String(order._id)
  return dailyLogs
    .filter((log) => {
      const logN = toLocalYmdNumber(log.date)
      if (logN == null) return false
      const idMatch = String(log.order?._id || log.order || log.orderId) === oid
      return (
        idMatch &&
        logN >= startN &&
        logN <= endN &&
        typeof log.quantityCompleted === 'number'
      )
    })
    .reduce((sum, log) => sum + Number(log.quantityCompleted || 0), 0)
}

function computeOrderRevenue(order, dailyLogs, bounds) {
  const qty = computeOrderQuantity(order, dailyLogs, bounds)
  const price = Number(order?.pricePerUnit) || 0
  return qty * price
}

function estimatedRevenueForOrder(order) {
  const direct = Number(order?.estimatedRevenueEuros)
  if (Number.isFinite(direct) && direct >= 0) return direct
  const goal = Number(order?.monthlyGoal ?? order?.totalQuantity) || 0
  const price = Number(order?.pricePerUnit) || 0
  return goal * price
}

const eligibleOrders = computed(() => (props.orders || []).filter(eligibleOrder))

const bounds = computed(() => getMonthBoundsFromWeeks(props.monthWeeks))

const revenueByCaseType = computed(() => {
  const map = new Map()
  if (!bounds.value) return map
  for (const order of eligibleOrders.value) {
    const type = order.caseType || t('ordersDashboard.unspecified')
    const rev = computeOrderRevenue(order, props.dailyLogs, bounds.value)
    map.set(type, (map.get(type) || 0) + rev)
  }
  return map
})

const caseTypeColorMap = computed(() => {
  const types = [...revenueByCaseType.value.keys()].sort((a, b) => a.localeCompare(b))
  const m = new Map()
  types.forEach((type, i) => m.set(type, CHANNEL_COLORS[i % CHANNEL_COLORS.length]))
  return m
})

function formatEuroK(n) {
  if (n >= 1000) return `€${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return formatCurrencyEUR(n)
}

function buildInsightKpi(est, total, t) {
  if (!(est > 0)) {
    return {
      title: t('ordersDashboard.charts.kpiVsPlan'),
      value: '—',
      progress: 0,
      barColor: '#e0e0e0',
      subtitle: t('ordersDashboard.charts.kpiVsPlanNoEstimate'),
    }
  }
  const ahead = total - est
  if (ahead > 0) {
    return {
      title: t('ordersDashboard.charts.kpiAheadOfPlan'),
      value: formatCurrencyEUR(ahead),
      progress: 100,
      barColor: '#43a047',
      subtitle: t('ordersDashboard.charts.kpiAheadOfPlanHint'),
    }
  }
  const remaining = est - total
  const remainingPct = Math.round((remaining / est) * 100)
  return {
    title: t('ordersDashboard.charts.kpiRemainingToPlan'),
    value: formatCurrencyEUR(remaining),
    progress: Math.min(100, remainingPct),
    barColor: remaining <= 0 ? '#43a047' : '#fb8c00',
    subtitle:
      remaining <= 0
        ? t('ordersDashboard.charts.kpiPlanMet')
        : `${formatStatNumber(remainingPct)}% ${t('ordersDashboard.charts.ofEstimateRemaining')}`,
  }
}

const kpiCards = computed(() => {
  const total = props.currentRevenueTotal || 0
  const est = props.estimatedRevenueTotal || 0
  const pctEst = est > 0 ? Math.min(100, Math.round((total / est) * 100)) : 0

  const byType = [...revenueByCaseType.value.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])

  const top = byType.slice(0, 3)
  const cards = [
    {
      title: t('ordersDashboard.charts.kpiEstimated'),
      value: formatCurrencyEUR(est),
      progress: est > 0 ? 100 : 0,
      barColor: '#90a4ae',
      subtitle: props.isAdmin
        ? ''
        : est > 0
          ? t('ordersDashboard.charts.kpiEstimatedHint')
          : t('ordersDashboard.charts.noEstimate'),
    },
    {
      title: t('ordersDashboard.charts.kpiCurrent'),
      value: formatCurrencyEUR(total),
      progress: pctEst,
      barColor: '#455a64',
      subtitle:
        est > 0
          ? `${formatStatNumber(pctEst)}% ${t('ordersDashboard.charts.ofEstimate')}`
          : t('ordersDashboard.charts.noEstimate'),
    },
  ]

  for (const [type, rev] of top) {
    const share = total > 0 ? Math.round((rev / total) * 100) : 0
    const col = caseTypeColorMap.value.get(type) || CHANNEL_COLORS[0]
    cards.push({
      title: type,
      value: formatCurrencyEUR(rev),
      progress: Math.min(100, share),
      barColor: col,
      subtitle: `${formatStatNumber(share)}% ${t('ordersDashboard.charts.ofTotal')}`,
    })
  }

  while (cards.length < 5) {
    cards.push({
      title: '—',
      value: '—',
      progress: 0,
      barColor: '#e0e0e0',
      subtitle: '',
    })
  }

  const insight = buildInsightKpi(est, total, t)
  cards.push(insight)

  return cards.slice(0, 6)
})

const donutData = computed(() => {
  const entries = [...revenueByCaseType.value.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  return {
    labels: entries.map(([k]) => k),
    datasets: [
      {
        data: entries.map(([, v]) => v),
        backgroundColor: entries.map(([k]) => caseTypeColorMap.value.get(k)),
        borderWidth: 1,
        borderColor: '#fff',
      },
    ],
  }
})

const donutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '58%',
  plugins: {
    legend: { position: 'right', labels: { boxWidth: 12, padding: 12 } },
    datalabels: {
      color: '#fff',
      font: { weight: '600', size: 11 },
      formatter: (value, ctx) => {
        const arr = ctx.dataset.data
        const sum = arr.reduce((a, b) => a + b, 0)
        if (!sum) return ''
        const pct = (value / sum) * 100
        if (pct < 4) return ''
        return `${pct.toFixed(1)}%`
      },
    },
    tooltip: {
      callbacks: {
        label(ctx) {
          const v = ctx.raw || 0
          const sum = ctx.dataset.data.reduce((a, b) => a + b, 0)
          const pct = sum ? ((v / sum) * 100).toFixed(1) : 0
          return `${formatCurrencyEUR(v)} (${pct}%)`
        },
      },
    },
  },
}))

const revenueByCaseRows = computed(() => {
  if (!bounds.value) return []
  const rows = eligibleOrders.value
    .map((order) => ({
      name: order.caseName || '—',
      type: order.caseType || t('ordersDashboard.unspecified'),
      revenue: computeOrderRevenue(order, props.dailyLogs, bounds.value),
      estimatedRevenue: estimatedRevenueForOrder(order),
    }))
    .map((row) => ({
      ...row,
      remainingRevenue: Math.max(0, row.estimatedRevenue - row.revenue),
      displayTotal: Math.max(row.revenue, row.estimatedRevenue),
    }))
    .filter((r) => r.revenue > 0 || r.remainingRevenue > 0)
    .sort((a, b) => b.displayTotal - a.displayTotal)

  return rows
})

const horizontalBarData = computed(() => {
  const rows = revenueByCaseRows.value

  return {
    labels: rows.map((r) => r.name),
    datasets: [
      {
        label: t('ordersDashboard.revenue.current'),
        data: rows.map((r) => r.revenue),
        backgroundColor: rows.map((r) => caseTypeColorMap.value.get(r.type)),
        borderSkipped: false,
        borderRadius: 4,
      },
      {
        label: t('ordersDashboard.monthlyBreakdown.remaining'),
        data: rows.map((r) => r.remainingRevenue),
        backgroundColor: '#cfd8dc',
        borderSkipped: false,
        borderRadius: 4,
      },
    ],
  }
})

const horizontalBarHeight = computed(() => {
  const n = revenueByCaseRows.value.length || 0
  return Math.max(300, n * 34 + 48)
})

const horizontalBarOptions = computed(() => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  layout: { padding: { right: 8 } },
  plugins: {
    legend: { display: true, position: 'top' },
    datalabels: {
      clip: false,
      anchor: 'center',
      align: 'center',
      offset: 0,
      color: (ctx) => (ctx.datasetIndex === 0 ? '#ffffff' : '#424242'),
      font: { size: 11, weight: '600' },
      formatter: (v) => (v > 0 ? formatCurrencyEUR(v) : ''),
    },
    stackedBarTotals: {
      enabled: true,
      gapAfterBars: true,
      gap: 12,
      color: '#424242',
      font: { size: 11, weight: '700', family: "'Roboto', sans-serif" },
      values: revenueByCaseRows.value.map((row) => formatCurrencyEUR(row.estimatedRevenue)),
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${formatCurrencyEUR(ctx.raw || 0)}`,
        footer: (items) => {
          const idx = items?.[0]?.dataIndex
          const row = Number.isInteger(idx) ? revenueByCaseRows.value[idx] : null
          return row ? `${t('ordersDashboard.tableHeaders.revenueGoal')}: ${formatCurrencyEUR(row.estimatedRevenue)}` : ''
        },
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      stacked: true,
      grace: '12%',
      grid: { display: true, color: 'rgba(0,0,0,0.06)' },
      ticks: {
        callback: (v) => formatEuroK(Number(v)),
      },
    },
    y: {
      stacked: true,
      grid: { display: false },
      ticks: { font: { size: 11 } },
    },
  },
}))

function weekChartLabels(weeks) {
  return weeks.map(
    (w, i) =>
      `${t('ordersDashboard.charts.week')} ${w.weekNumber != null ? w.weekNumber : i + 1}`
  )
}

function computeWeekRevenueForCaseType(caseType, week) {
  const startN = toLocalYmdNumber(week.start)
  const endN = toLocalYmdNumber(week.end)
  if (startN == null || endN == null) return 0
  const typeLabel = caseType || t('ordersDashboard.unspecified')
  const typeOrders = eligibleOrders.value.filter(
    (o) => (o.caseType || t('ordersDashboard.unspecified')) === typeLabel
  )
  const idSet = new Set(typeOrders.map((o) => String(o._id)))
  let sum = 0
  for (const log of props.dailyLogs || []) {
    const logN = toLocalYmdNumber(log.date)
    if (logN == null || logN < startN || logN > endN) continue
    const oid = String(log.order?._id || log.order || log.orderId)
    if (!idSet.has(oid)) continue
    const order = typeOrders.find((o) => String(o._id) === oid)
    if (!order) continue
    sum += (Number(log.quantityCompleted) || 0) * (Number(order.pricePerUnit) || 0)
  }
  return sum
}

function buildFacetChartOptions({ stacked = false, showLegend = false } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom',
        labels: { boxWidth: 10, padding: 8, font: { size: 10 } },
      },
      datalabels: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.dataset?.label ? `${ctx.dataset.label}: ` : ''
            return `${label}${formatCurrencyEUR(ctx.raw || 0)}`
          },
          footer: stacked
            ? (items) => {
                const total = items.reduce((s, item) => s + (Number(item.raw) || 0), 0)
                return total > 0 ? `${t('ordersDashboard.charts.revenue')}: ${formatCurrencyEUR(total)}` : ''
              }
            : undefined,
        },
      },
    },
    scales: {
      x: {
        stacked,
        grid: { display: false },
        ticks: { maxRotation: 0, font: { size: 10 } },
      },
      y: {
        stacked,
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.06)', borderDash: [4, 4] },
        ticks: {
          font: { size: 10 },
          callback: (v) => formatEuroK(Number(v)),
        },
      },
    },
  }
}

const facetCaseTypes = computed(() =>
  [...revenueByCaseType.value.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([caseType]) => caseType)
)

const facetCombinedInline = computed(() => {
  const n = facetCaseTypes.value.length
  return n > 0 && n <= 3
})

const facetCharts = computed(() => {
  const weeks = props.monthWeeks || []
  if (!weeks.length || !bounds.value) return []

  const labels = weekChartLabels(weeks)

  return facetCaseTypes.value.map((caseType) => {
    const color = caseTypeColorMap.value.get(caseType) || CHANNEL_COLORS[0]
    const data = weeks.map((week) => computeWeekRevenueForCaseType(caseType, week))

    return {
      caseType,
      data: {
        labels,
        datasets: [
          {
            label: caseType,
            data,
            backgroundColor: color,
            borderRadius: 4,
          },
        ],
      },
      options: buildFacetChartOptions(),
    }
  })
})

const combinedFacetChart = computed(() => {
  const weeks = props.monthWeeks || []
  if (!weeks.length || !bounds.value || !facetCaseTypes.value.length) return null

  const labels = weekChartLabels(weeks)
  const datasets = facetCaseTypes.value.map((caseType) => ({
    label: caseType,
    data: weeks.map((week) => computeWeekRevenueForCaseType(caseType, week)),
    backgroundColor: caseTypeColorMap.value.get(caseType) || CHANNEL_COLORS[0],
    borderRadius: 4,
    stack: 'combined',
  }))

  return {
    data: { labels, datasets },
    options: buildFacetChartOptions({ stacked: true, showLegend: true }),
  }
})
</script>

<style scoped>
.analytics-root {
  background: #f2f4f7;
  margin: 0;
  padding: 16px clamp(12px, 2vw, 20px) 12px;
  border-radius: 12px;
}

.kpi-row {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  width: 100%;
}

@media (max-width: 1279px) {
  .kpi-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .kpi-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.kpi-card {
  min-width: 0;
  overflow: hidden;
}

.kpi-card-inner {
  min-width: 0;
}

.kpi-title {
  font-size: 0.65rem;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.kpi-value {
  font-size: 0.95rem;
  line-height: 1.25;
  word-break: break-word;
}

.kpi-subtitle {
  font-size: 0.65rem;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kpi-breakdown-slot {
  min-height: 1.2rem;
}

.kpi-breakdown-btn {
  min-width: 0;
  font-size: 0.65rem;
  letter-spacing: normal;
  height: auto !important;
}

.revenue-summary.breakdown-table-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
}

.chart-card {
  background: #fff;
}

.chart-wrap {
  position: relative;
  min-height: 280px;
}

.donut-wrap {
  min-height: 320px;
}

.horizontal-scroll {
  overflow-y: auto;
  max-height: min(70vh, 720px);
  padding-right: 4px;
}

.kpi-progress-track {
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.kpi-progress-fill {
  height: 100%;
  border-radius: 999px;
  min-width: 0;
  transition: width 0.25s ease;
}

.facet-chart-height {
  height: 220px;
  position: relative;
}

.combined-facet-chart {
  height: 260px;
}

</style>
