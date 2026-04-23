<template>
  <v-card class="pa-4 elevation-4 h-100 agent-dashboard-stats-card" style="background-color: #eeeff1;">
    <div class="text-subtitle-1 font-weight-bold mb-3">
      {{ t('agentDashboard.personalStatsTitle') }}
    </div>
    <v-row align="center" dense>
      <v-col cols="12" sm="6" md="3" class="py-0">
        <div class="text-h6">
          {{ t('agentDashboard.personalMonthlyGoal') }}: €{{ monthlyGoalEuros }}
        </div>
      </v-col>
      <v-col cols="12" sm="6" md="3" class="py-0">
        <div class="text-h6">
          {{ t('agentDashboard.personalResultsNow') }}: €{{ resultsNowEuros }}
        </div>
      </v-col>
      <v-col cols="12" sm="6" md="3" class="py-0">
        <div class="text-h6 d-flex align-center flex-wrap" style="gap: 6px;">
          <span>{{ t('agentDashboard.personalMyProgress') }}:</span>
          <span :class="['percentage-badge', myProgressBadgeClass]">{{ myProgressPercent }}%</span>
        </div>
      </v-col>
      <v-col cols="12" sm="6" md="3" class="py-0">
        <div class="text-h6">
          {{ t('agentDashboard.myPaycheck') }}: €{{ myPaycheck }}
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getPercentageToGoalBadgeClass } from '@/js/percentageToGoalStyle';

const props = defineProps({
  monthlyGoalEuros: {
    type: [String, Number],
    required: true,
  },
  resultsNowEuros: {
    type: [String, Number],
    required: true,
  },
  myProgressPercent: {
    type: [String, Number],
    required: true,
  },
  myPaycheck: {
    type: [String, Number],
    required: true,
  },
});

const { t } = useI18n();

const myProgressBadgeClass = computed(() =>
  getPercentageToGoalBadgeClass(props.myProgressPercent)
);
</script>
