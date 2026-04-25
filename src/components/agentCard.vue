<template>
  <v-card class="mx-2 my-2 mb-5" elevation="16" style="width: 200px; min-height: 360px;">
    <v-card-title class="text-center">{{ agent.name }}</v-card-title>
    <v-card-text>
      <p><strong>Meetings:</strong> {{ formatStatNumber(agent.meetings || 0) }}</p>
      <p><strong>Call Time:</strong> {{ formatStatNumber(agent.call_time || 0) }} hrs</p>
      <p><strong>Outgoing Calls:</strong> {{ formatStatNumber(agent.outgoing_calls || 0) }}</p>
      <p><strong>Answered Calls:</strong> {{ formatStatNumber(agent.answered_calls || 0) }}</p>
      <p><strong>Response Rate:</strong> {{ formatStatNumber(agent.response_rate || 0) }}%</p>
      <p><strong>Completed Calls:</strong> {{ formatStatNumber(agent.completed_calls || 0) }}</p>
      <p><strong>Quantity Completed:</strong> {{ formatStatNumber(agent.quantityCompleted || 0) }}</p>
      <p><strong>Case:</strong> {{ agent.case || 'No activity' }}</p>
      <p class="mt-2">
        <strong>{{ $t('agentDashboard.personalMyProgress') }}:</strong>
        <span v-if="myProgressPercent != null" :class="['ml-1', myProgressBadgeClass]">{{ formatStatNumber(myProgressPercent) }}%</span>
        <span v-else class="text-medium-emphasis">—</span>
      </p>
    </v-card-text>

    <v-card-text>
      <div class="d-flex justify-center">
        <v-btn color="primary" class="mb-5 mr-2" @click="viewAgent">
          View
        </v-btn>
        <v-btn color="primary" class="mb-5" @click="editAgent">
          Edit
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { formatStatNumber } from '@/js/formatNumbers';
import { computeAgentMyProgressPercent } from '@/js/agentMyProgress';
import { getPercentageToGoalBadgeClass } from '@/js/percentageToGoalStyle';

export default {
  name: 'AgentCard',
  props: {
    agent: {
      type: Object,
      required: true, // Pass the case ID as a prop
    },
    /** When set (e.g. from case card), use this range for “My progress” instead of store `currentDateRange` */
    progressDateRange: {
      type: Array,
      default: null,
    },
  },

  computed: {
    ...mapState(['cases', 'currentPage']), // Access cases and currentPage from the store
    ...mapGetters(['orders', 'dailyLogs', 'currentDateRange', 'gcAgents']),

    progressRange() {
      return this.progressDateRange && this.progressDateRange.length >= 2
        ? this.progressDateRange
        : this.currentDateRange;
    },
    myProgressPercent() {
      return computeAgentMyProgressPercent(
        this.agent,
        this.orders || [],
        this.dailyLogs || [],
        this.progressRange,
        this.gcAgents || []
      );
    },
    myProgressBadgeClass() {
      return getPercentageToGoalBadgeClass(this.myProgressPercent);
    },
    caseData() {
      // Find the case data by ID from the store
      return this.cases.find(singleCase => singleCase.id === this.caseId) || {};
    },

    caseStats() {
      // Example: Calculate stats based on the case data
      return {
        totalMeetings: this.caseData.meetings || 0,
        totalOutgoingCalls: this.caseData.outgoing_calls || 0,
        totalCallTime: this.caseData.call_time || 0,
      };
    },
  },


  methods: {
    formatStatNumber,
    viewAgent() {
      this.$router.push({
        name: 'agentDashboard',
        query: { agent: this.agent.name },
      });
    },

    editAgent() {
      this.$router.push({
        name: 'editAgent',
        query: { activeAgent: this.agent.name },
      });
    },
  },
};
</script>