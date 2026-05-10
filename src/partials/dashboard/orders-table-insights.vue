<template>
  <div class="table-insights-root">
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card class="chart-surface" elevation="2" rounded="lg">
          <v-card-title class="text-subtitle-1 font-weight-bold pb-0">
            {{ t('ordersDashboard.tableInsights.estVsCurrentTitle') }}
          </v-card-title>
          <v-card-text>
            <div
              class="insight-chart-h"
              :style="{ height: estVsCurrentHeight + 'px' }"
            >
              <Bar
                v-if="estVsCurrentData.labels.length"
                :data="estVsCurrentData"
                :options="estVsCurrentOptions"
              />
              <div v-else class="text-medium-emphasis text-body-2 pa-4">{{ t('ordersDashboard.tableInsights.noData') }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="6">
        <v-card class="chart-surface h-lg-100" elevation="2" rounded="lg">
          <v-card-title class="text-subtitle-1 font-weight-bold pb-0">
            {{ t('ordersDashboard.tableInsights.pctToGoalTitle') }}
          </v-card-title>
          <v-card-text>
            <div
              class="insight-chart-h"
              :style="{ height: pctGoalHeight + 'px' }"
            >
              <Bar
                v-if="pctGoalData.labels.length"
                :data="pctGoalData"
                :options="pctGoalOptions"
              />
              <div v-else class="text-medium-emphasis text-body-2 pa-4">{{ t('ordersDashboard.tableInsights.noData') }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="6">
        <v-card class="chart-surface h-lg-100" elevation="2" rounded="lg">
          <v-card-title class="text-subtitle-1 font-weight-bold pb-0">
            {{ t('ordersDashboard.tableInsights.workloadTitle') }}
          </v-card-title>
          <v-card-text>
            <div class="insight-chart-h workload-chart">
              <Bar
                v-if="workloadData.labels.length"
                :data="workloadData"
                :options="workloadOptions"
              />
              <div v-else class="text-medium-emphasis text-body-2 pa-4">{{ t('ordersDashboard.tableInsights.noData') }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-card class="chart-surface" elevation="2" rounded="lg">
          <v-card-title class="text-subtitle-1 font-weight-bold pb-0">
            {{ t('ordersDashboard.tableInsights.qtyProgressTitle') }}
          </v-card-title>
          <v-card-text>
            <div
              class="insight-chart-h"
              :style="{ height: qtyProgressHeight + 'px' }"
            >
              <Bar
                v-if="qtyProgressData.labels.length"
                :data="qtyProgressData"
                :options="qtyProgressOptions"
              />
              <div v-else class="text-medium-emphasis text-body-2 pa-4">{{ t('ordersDashboard.tableInsights.noData') }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar } from 'vue-chartjs'
import { formatStatNumber, formatCurrencyEUR } from '@/js/formatNumbers'
import { toLocalYmdNumber } from '@/js/dateUtils'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ChartDataLabels)

const props = defineProps({
  rows: { type: Array, default: () => [] },
  agents: { type: Array, default: () => [] },
  dailyLogs: { type: Array, default: () => [] },
  monthWeeks: { type: Array, default: () => [] },
})

const { t } = useI18n()

function barColorForPct(p) {
  const x = Number(p)
  if (!Number.isFinite(x)) return '#9e9e9e'
  if (x <= 25) return '#e53935'
  if (x <= 50) return '#fb8c00'
  if (x <= 75) return '#f9a825'
  return '#43a047'
}

function agentLabel(id) {
  const a = props.agents.find((x) => String(x._id) === String(id))
  return a?.name || String(id).slice(0, 8)
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

function logMatchesDashboardOrder(log, rows) {
  if (!rows.length) return true
  const oid = String(log.order?._id || log.order || log.orderId || '')
  const idSet = new Set(rows.map((r) => String(r.id)))
  if (oid && idSet.has(oid)) return true
  return rows.some((r) => String(r.caseName) === String(log.caseName || ''))
}

const sortedForEstVsCur = computed(() => {
  const list = [...(props.rows || [])]
  list.sort((a, b) => {
    const ma = Math.max(a.estimatedRevenue || 0, a.currentRevenue || 0)
    const mb = Math.max(b.estimatedRevenue || 0, b.currentRevenue || 0)
    return mb - ma
  })
  return list.slice(0, 14)
})

const estVsCurrentHeight = computed(() => {
  const n = sortedForEstVsCur.value.length || 1
  return Math.min(520, Math.max(220, n * 36 + 48))
})

const estVsCurrentData = computed(() => {
  const rows = sortedForEstVsCur.value
  return {
    labels: rows.map((r) => r.caseName),
    datasets: [
      {
        label: t('ordersDashboard.tableInsights.estimated'),
        data: rows.map((r) => r.estimatedRevenue || 0),
        backgroundColor: '#90a4ae',
        borderRadius: 4,
      },
      {
        label: t('ordersDashboard.tableInsights.current'),
        data: rows.map((r) => r.currentRevenue || 0),
        backgroundColor: '#26a69a',
        borderRadius: 4,
      },
    ],
  }
})

const estVsCurrentOptions = computed(() => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  layout: { padding: { right: 8 } },
  plugins: {
    legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: true } },
    datalabels: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${formatCurrencyEUR(ctx.raw || 0)}`,
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      stacked: false,
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: {
        callback: (v) => (Number(v) >= 1000 ? `€${(v / 1000).toFixed(1)}k` : formatCurrencyEUR(Number(v))),
      },
    },
    y: {
      stacked: false,
      grid: { display: false },
      ticks: { font: { size: 11 } },
    },
  },
}))

const sortedForPct = computed(() => {
  const list = [...(props.rows || [])].filter((r) => (r.monthlyGoal || 0) > 0)
  list.sort((a, b) => (b.pctToGoal || 0) - (a.pctToGoal || 0))
  return list.slice(0, 14)
})

const pctGoalHeight = computed(() => {
  const n = sortedForPct.value.length || 1
  return Math.min(480, Math.max(200, n * 32 + 40))
})

const pctGoalData = computed(() => {
  const rows = sortedForPct.value
  return {
    labels: rows.map((r) => r.caseName),
    datasets: [
      {
        label: t('ordersDashboard.tableInsights.pctGoal'),
        data: rows.map((r) => r.pctToGoal || 0),
        backgroundColor: rows.map((r) => barColorForPct(r.pctToGoal)),
        borderRadius: 4,
      },
    ],
  }
})

const pctGoalOptions = computed(() => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  layout: { padding: { right: 36 } },
  plugins: {
    legend: { display: false },
    datalabels: {
      display: true,
      anchor: 'end',
      align: 'start',
      offset: 2,
      color: '#424242',
      font: { size: 10, weight: '600' },
      formatter: (v) => `${formatStatNumber(v)}%`,
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `${formatStatNumber(ctx.raw || 0)}%`,
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: {
        callback: (v) => `${v}%`,
      },
    },
    y: {
      grid: { display: false },
      ticks: { font: { size: 11 } },
    },
  },
}))

const meetingsByAgentPairs = computed(() => {
  const bounds = getMonthBoundsFromWeeks(props.monthWeeks)
  const rows = props.rows || []
  if (!bounds) return []

  const startN = toLocalYmdNumber(bounds.monthStart)
  const endN = toLocalYmdNumber(bounds.monthEnd)
  if (startN == null || endN == null) return []

  const map = new Map()
  for (const log of props.dailyLogs || []) {
    const logN = toLocalYmdNumber(log.date)
    if (logN == null || logN < startN || logN > endN) continue

    const cn = String(log.caseName || '').toLowerCase()
    if (cn === 'case good call' || cn === 'good call') continue
    if (cn.includes('test')) continue

    if (!logMatchesDashboardOrder(log, rows)) continue

    const qty = Number(log.quantityCompleted) || 0
    if (!Number.isFinite(qty) || qty === 0) continue

    const label =
      String(log.agentName || '').trim() || (log.agent ? agentLabel(log.agent) : '')
    if (!label) continue

    map.set(label, (map.get(label) || 0) + qty)
  }

  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16)
})

const workloadData = computed(() => {
  const pairs = meetingsByAgentPairs.value
  return {
    labels: pairs.map(([name]) => name),
    datasets: [
      {
        label: t('ordersDashboard.tableInsights.meetingsLogged'),
        data: pairs.map(([, n]) => n),
        backgroundColor: '#5c6bc0',
        borderRadius: 6,
      },
    ],
  }
})

const workloadOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    datalabels: {
      display: true,
      anchor: 'end',
      align: 'top',
      color: '#424242',
      font: { size: 10, weight: '600' },
    },
    tooltip: {
      callbacks: {
        label: (ctx) =>
          `${t('ordersDashboard.tableInsights.meetingsLogged')}: ${formatStatNumber(ctx.raw || 0)}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { maxRotation: 45, minRotation: 0, font: { size: 10 } },
    },
    y: {
      beginAtZero: true,
      ticks: { precision: 0 },
      grid: { color: 'rgba(0,0,0,0.06)' },
    },
  },
}))

const sortedForQty = computed(() => {
  const list = [...(props.rows || [])].filter((r) => (r.campaignGoal || 0) > 0)
  list.sort((a, b) => (b.qtyCompleted || 0) / Math.max(1, b.campaignGoal) - (a.qtyCompleted || 0) / Math.max(1, a.campaignGoal))
  return list.slice(0, 14)
})

const qtyProgressHeight = computed(() => {
  const n = sortedForQty.value.length || 1
  return Math.min(500, Math.max(200, n * 34 + 40))
})

const qtyProgressData = computed(() => {
  const rows = sortedForQty.value
  return {
    labels: rows.map((r) => r.caseName),
    datasets: [
      {
        label: t('ordersDashboard.tableInsights.qtyCompleted'),
        data: rows.map((r) => Math.min(r.campaignGoal || 0, r.qtyCompleted || 0)),
        backgroundColor: '#42a5f5',
        borderRadius: 4,
      },
      {
        label: t('ordersDashboard.tableInsights.qtyRemaining'),
        data: rows.map((r) => Math.max(0, (r.campaignGoal || 0) - (r.qtyCompleted || 0))),
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
      },
    ],
  }
})

const qtyProgressOptions = computed(() => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: true } },
    datalabels: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const row = sortedForQty.value[ctx.dataIndex]
          if (!row) return ''
          if (ctx.datasetIndex === 0) {
            return `${ctx.dataset.label}: ${formatStatNumber(ctx.raw || 0)} / ${formatStatNumber(row.campaignGoal || 0)}`
          }
          return `${ctx.dataset.label}: ${formatStatNumber(ctx.raw || 0)}`
        },
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: { precision: 0 },
    },
    y: {
      stacked: true,
      grid: { display: false },
      ticks: { font: { size: 11 } },
    },
  },
}))
</script>

<style scoped>
.table-insights-root {
  padding: 4px 0 8px;
}

.chart-surface {
  background: #fff;
}

.insight-chart-h {
  position: relative;
  width: 100%;
  min-height: 200px;
}

.workload-chart {
  height: 320px;
}

@media (min-width: 1280px) {
  .h-lg-100 {
    height: 100%;
  }
}
</style>
