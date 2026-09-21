<template>
  <div class="agent-kpi-section">
    <div class="section-label text-subtitle-2 font-weight-medium text-medium-emphasis mb-2">
      {{ t('agentDashboard.personalStatsTitle') }}
    </div>
    <div class="kpi-row kpi-row--5">
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
                width: Math.min(100, Math.max(0, card.progress)) + '%',
                backgroundColor: card.barColor,
              }"
            />
          </div>
          <div v-if="card.breakdownKind" class="kpi-breakdown-slot">
            <v-btn
              variant="text"
              density="compact"
              size="x-small"
              class="pa-0 mt-n1 text-none kpi-breakdown-btn"
              @click="toggleBreakdown(idx)"
            >
              {{ openKpiBreakdownIndex === idx ? t('ordersDashboard.charts.hideBreakdown') : t('ordersDashboard.charts.showBreakdown') }}
            </v-btn>
          </div>
          <div v-else class="kpi-subtitle text-medium-emphasis">{{ card.subtitle }}</div>
        </v-card-text>
      </v-card>
    </div>

    <v-expand-transition>
      <div v-if="openKpiBreakdownIndex != null" key="kpi-breakdown">
        <v-card class="mt-3 revenue-summary breakdown-table-card" elevation="2" rounded="lg">
          <v-card-text class="pa-3">
            <div class="text-caption font-weight-bold mb-2">{{ activeBreakdownTitle }}</div>
            <v-table v-if="activeBreakdownKind === 'estimated'" density="compact" class="text-caption">
              <thead>
                <tr>
                  <th class="text-left">{{ t('ordersDashboard.charts.breakdownCaseType') }}</th>
                  <th class="text-left">{{ t('ordersDashboard.charts.breakdownCase') }}</th>
                  <th class="text-left">{{ t('ordersDashboard.charts.breakdownStatus') }}</th>
                  <th class="text-right">{{ t('ordersDashboard.charts.breakdownGoal') }}</th>
                  <th class="text-right">{{ t('ordersDashboard.charts.breakdownPerUnit') }}</th>
                  <th class="text-right">{{ t('ordersDashboard.charts.breakdownRevenue') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in monthlyGoalBreakdown"
                  :key="row.orderId || i"
                  :class="breakdownRowClass(row)"
                  @click="selectOrder(row.orderId)"
                >
                  <td>{{ row.caseType }}</td>
                  <td class="breakdown-case-link">{{ row.caseName }}</td>
                  <td>{{ row.status }}</td>
                  <td class="text-right">{{ formatUnitsByCaseUnit(row.monthlyGoal, row.caseUnit) }}</td>
                  <td class="text-right">{{ Number(row.pricePerUnit || 0).toFixed(2) }}</td>
                  <td class="text-right">{{ formatCurrencyEUR(row.revenue) }}</td>
                </tr>
              </tbody>
            </v-table>
            <v-table v-else-if="activeBreakdownKind === 'current'" density="compact" class="text-caption">
              <thead>
                <tr>
                  <th class="text-left">{{ t('ordersDashboard.charts.breakdownCaseType') }}</th>
                  <th class="text-left">{{ t('ordersDashboard.charts.breakdownCase') }}</th>
                  <th class="text-right">{{ t('ordersDashboard.charts.breakdownQuantity') }}</th>
                  <th class="text-right">{{ t('ordersDashboard.charts.breakdownPerUnit') }}</th>
                  <th class="text-right">{{ t('ordersDashboard.charts.breakdownRevenue') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in resultsNowBreakdown"
                  :key="row.orderId || i"
                  :class="breakdownRowClass(row)"
                  @click="selectOrder(row.orderId)"
                >
                  <td>{{ row.caseType }}</td>
                  <td class="breakdown-case-link">{{ row.caseName }}</td>
                  <td class="text-right">{{ formatUnitsByCaseUnit(row.quantityCompleted, row.caseUnit) }}</td>
                  <td class="text-right">{{ Number(row.pricePerUnit || 0).toFixed(2) }}</td>
                  <td class="text-right">{{ formatCurrencyEUR(row.revenue) }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </div>
    </v-expand-transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatStatNumber, formatCurrencyEUR, formatUnitsByCaseUnit } from '@/js/formatNumbers';

const props = defineProps({
  monthlyGoalEuros: {
    type: [String, Number],
    required: true,
  },
  resultsNowEuros: {
    type: [String, Number],
    required: true,
  },
  hoursWorked: {
    type: [String, Number],
    default: 0,
  },
  outgoingCallsMade: {
    type: [String, Number],
    default: 0,
  },
  myPaycheck: {
    type: [String, Number],
    required: true,
  },
  monthlyGoalBreakdown: {
    type: Array,
    default: () => [],
  },
  resultsNowBreakdown: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['select-order']);

const { t } = useI18n();
const openKpiBreakdownIndex = ref(null);

function toggleBreakdown(idx) {
  openKpiBreakdownIndex.value = openKpiBreakdownIndex.value === idx ? null : idx;
}

function breakdownRowClass(row) {
  return {
    'breakdown-row-link': !!row?.orderId,
    'bg-grey-lighten-4': row?.included === false,
  };
}

function selectOrder(orderId) {
  if (!orderId) return;
  emit('select-order', orderId);
}

const kpiCards = computed(() => {
  const goal = Number(props.monthlyGoalEuros) || 0;
  const current = Number(props.resultsNowEuros) || 0;
  const hours = Number(props.hoursWorked) || 0;
  const outgoing = Number(props.outgoingCallsMade) || 0;
  const pctOfGoal = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;

  return [
    {
      title: t('agentDashboard.personalMonthlyGoal'),
      value: formatCurrencyEUR(goal),
      progress: goal > 0 ? 100 : 0,
      barColor: '#90a4ae',
      subtitle: goal > 0 ? t('ordersDashboard.charts.kpiEstimatedHint') : '',
      breakdownKind: 'estimated',
    },
    {
      title: t('agentDashboard.personalResultsNow'),
      value: formatCurrencyEUR(current),
      progress: pctOfGoal,
      barColor: '#455a64',
      subtitle:
        goal > 0
          ? `${formatStatNumber(pctOfGoal)}% ${t('agentDashboard.ofMonthlyGoal')}`
          : '',
      breakdownKind: 'current',
    },
    {
      title: t('agentDashboard.personalHoursWorked'),
      value: formatStatNumber(hours),
      progress: 100,
      barColor: '#5d5d5d',
      subtitle: t('agentDashboard.personalHoursWorkedHint'),
    },
    {
      title: t('agentDashboard.personalCallsMade'),
      value: formatStatNumber(outgoing),
      progress: 100,
      barColor: '#7e57c2',
      subtitle: t('agentDashboard.personalCallsMadeHint'),
    },
    {
      title: t('agentDashboard.myPaycheck'),
      value: formatCurrencyEUR(props.myPaycheck),
      progress: pctOfGoal,
      barColor: '#455a64',
      subtitle: '',
    },
  ];
});

const activeBreakdownCard = computed(() => {
  const idx = openKpiBreakdownIndex.value;
  if (idx == null || idx < 0) return null;
  return kpiCards.value[idx] || null;
});

const activeBreakdownKind = computed(() => activeBreakdownCard.value?.breakdownKind || null);

const activeBreakdownTitle = computed(() => {
  if (activeBreakdownKind.value === 'estimated') {
    return t('agentDashboard.breakdownTitleMonthlyGoal');
  }
  if (activeBreakdownKind.value === 'current') {
    return t('agentDashboard.breakdownTitleResultsNow');
  }
  return '';
});
</script>

<style scoped>
.kpi-row {
  display: grid;
  gap: 8px;
  width: 100%;
}

.kpi-row--5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

@media (max-width: 1279px) {
  .kpi-row--5 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 959px) {
  .kpi-row--5 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .kpi-row--5 {
    grid-template-columns: 1fr;
  }
}

.kpi-card {
  min-width: 0;
  overflow: hidden;
  background: #fff;
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
  min-height: 1.2rem;
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

.kpi-progress-track {
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.kpi-progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.25s ease;
}

.revenue-summary.breakdown-table-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
}

.breakdown-row-link {
  cursor: pointer;
}

.breakdown-row-link:hover td {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.breakdown-case-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
