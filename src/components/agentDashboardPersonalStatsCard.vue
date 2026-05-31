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
          <div class="kpi-subtitle text-medium-emphasis">{{ card.subtitle }}</div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatStatNumber, formatCurrencyEUR } from '@/js/formatNumbers';

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
});

const { t } = useI18n();

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
</style>
