<template>
  <div :class="['analytics-root', { 'analytics-root--embedded': embedded }]">
    <div class="section-label text-subtitle-2 font-weight-medium mb-3">
      {{ t('agentDashboard.teamStatsTitle') }}
    </div>
    <div class="kpi-row">
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
import { getPercentageToGoalBarColor } from '@/js/percentageToGoalStyle';
import { formatCurrencyEUR, formatStatNumber } from '@/js/formatNumbers';

const props = defineProps({
  teamRevenueGoal: {
    type: [String, Number],
    required: true,
  },
  teamResultsNow: {
    type: [String, Number],
    required: true,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();

const kpiCards = computed(() => {
  const estimated = Number(props.teamRevenueGoal) || 0;
  const current = Number(props.teamResultsNow) || 0;
  const progress = estimated > 0 ? Math.min(100, (current / estimated) * 100) : 0;

  return [
    {
      title: t('ordersDashboard.charts.kpiEstimated'),
      value: formatCurrencyEUR(estimated),
      progress: estimated > 0 ? 100 : 0,
      barColor: '#90a4ae',
      subtitle: estimated > 0 ? t('ordersDashboard.charts.kpiEstimatedHint') : t('ordersDashboard.charts.noEstimate'),
    },
    {
      title: t('ordersDashboard.charts.kpiCurrent'),
      value: formatCurrencyEUR(current),
      progress,
      barColor: '#455a64',
      subtitle:
        estimated > 0
          ? `${formatStatNumber(progress)}% ${t('ordersDashboard.charts.ofEstimate')}`
          : t('ordersDashboard.charts.noEstimate'),
    },
    {
      title: t('agentDashboard.teamProgress'),
      value: `${formatStatNumber(progress)}%`,
      progress,
      barColor: getPercentageToGoalBarColor(progress),
      subtitle:
        estimated > 0
          ? `${formatStatNumber(progress)}% ${t('ordersDashboard.charts.ofEstimate')}`
          : t('ordersDashboard.charts.noEstimate'),
    },
  ];
});
</script>

<style scoped>
.analytics-root {
  background: #f2f4f7;
  margin: 0;
  padding: 16px clamp(12px, 2vw, 20px) 12px;
  border-radius: 12px;
}

.analytics-root--embedded {
  background: transparent;
  padding: 0;
}

.section-label {
  color: rgba(0, 0, 0, 0.7);
}

.kpi-row {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
}

@media (max-width: 1279px) {
  .kpi-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .kpi-row {
    grid-template-columns: 1fr;
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
</style>
