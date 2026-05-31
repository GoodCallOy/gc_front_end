<template>
  <v-card class="kpi-card" elevation="2" rounded="lg">
    <v-card-text class="kpi-card-inner pa-2 px-3">
      <div class="kpi-block">
        <div class="kpi-title text-medium-emphasis font-weight-medium">
          {{ t('agentDashboard.personalMonthlyGoal') }}
        </div>
        <div class="kpi-value font-weight-bold my-1">{{ goalValue }}</div>
        <div class="kpi-subtitle text-medium-emphasis">
          {{ goal > 0 ? t('ordersDashboard.charts.kpiEstimatedHint') : '' }}
        </div>
      </div>

      <div class="kpi-block kpi-block--spaced">
        <div class="kpi-title text-medium-emphasis font-weight-medium">
          {{ t('agentDashboard.personalResultsNow') }}
        </div>
        <div class="kpi-value font-weight-bold my-1">{{ resultsValue }}</div>
        <div class="kpi-progress-track mb-1">
          <div
            class="kpi-progress-fill"
            :style="{ width: resultsBarWidth, backgroundColor: '#455a64' }"
          />
        </div>
        <div class="kpi-subtitle text-medium-emphasis">{{ resultsSubtitle }}</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatStatNumber, formatCurrencyEUR } from '@/js/formatNumbers';

const props = defineProps({
  monthlyGoalEuros: { type: Number, default: 0 },
  resultsNowEuros: { type: Number, default: 0 },
});

const { t } = useI18n();

const goal = computed(() => Math.max(0, Number(props.monthlyGoalEuros) || 0));
const current = computed(() => Math.max(0, Number(props.resultsNowEuros) || 0));

const pctOfGoal = computed(() => {
  if (goal.value <= 0) return 0;
  return Math.min(100, (current.value / goal.value) * 100);
});

const goalValue = computed(() => formatCurrencyEUR(goal.value));
const resultsValue = computed(() => formatCurrencyEUR(current.value));

const resultsBarWidth = computed(() => `${Math.min(100, Math.max(0, pctOfGoal.value))}%`);

const resultsSubtitle = computed(() => {
  if (goal.value <= 0) return '';
  return `${formatStatNumber(pctOfGoal.value)}% ${t('agentDashboard.ofMonthlyGoal')}`;
});
</script>

<style scoped>
.kpi-card {
  min-width: 0;
  overflow: hidden;
  background: #fff;
  width: 100%;
}

.kpi-card-inner {
  min-width: 0;
  text-align: left;
}

.kpi-block--spaced {
  margin-top: 10px;
}

.kpi-block--spaced .kpi-subtitle {
  min-height: 0;
}

.kpi-title {
  font-size: 0.65rem;
  line-height: 1.2;
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
}
</style>
