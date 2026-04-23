<template>
  <v-card class="pa-4 elevation-4 h-100 agent-dashboard-stats-card" style="background-color: #eeeff1;">
    <div class="text-subtitle-1 font-weight-bold mb-3">
      {{ t('agentDashboard.teamStatsTitle') }}
    </div>
    <v-row align="center" dense>
      <v-col cols="12" sm="6" class="py-0">
        <div class="text-h6">
          {{ t('agentDashboard.teamCombinedRevenue') }}: €{{ totalTeamRevenue }}
        </div>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <div class="text-h6">
          {{ t('agentDashboard.teamRevenueVsMonthlyTarget') }}: {{ revenueToGoalPercent }}%
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  totalTeamRevenue: {
    type: [String, Number],
    required: true,
  },
  revenueToGoalPercent: {
    type: [String, Number],
    required: true,
  },
});

const { t } = useI18n();
</script>
