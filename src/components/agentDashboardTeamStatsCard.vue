<template>
  <v-card class="pa-4 elevation-4 h-100 agent-dashboard-stats-card" style="background-color: #eeeff1;">
    <div class="text-subtitle-1 font-weight-bold mb-3">
      {{ t('agentDashboard.teamStatsTitle') }}
    </div>
    <v-row align="center" dense>
      <v-col cols="12" sm="4" class="py-0">
        <div class="text-h6">
          {{ t('agentDashboard.teamRevenueGoal') }}: €{{ teamRevenueGoal }}
        </div>
      </v-col>
      <v-col cols="12" sm="4" class="py-0 d-flex justify-center">
        <div class="text-h6">
          {{ t('agentDashboard.teamResultsNow') }}: €{{ teamResultsNow }}
        </div>
      </v-col>
      <v-col cols="12" sm="4" class="py-0 d-flex justify-sm-end justify-start">
        <div class="text-h6 d-flex align-center flex-wrap" style="gap: 6px;">
          <span>{{ t('agentDashboard.teamProgress') }}:</span>
          <span :class="['percentage-badge', teamProgressBadgeClass]">{{ teamProgressPercent }}%</span>
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
  teamRevenueGoal: {
    type: [String, Number],
    required: true,
  },
  teamResultsNow: {
    type: [String, Number],
    required: true,
  },
  teamProgressPercent: {
    type: [String, Number],
    required: true,
  },
});

const { t } = useI18n();

const teamProgressBadgeClass = computed(() =>
  getPercentageToGoalBadgeClass(props.teamProgressPercent)
);
</script>
