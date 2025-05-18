<template>
  <v-card class="pa-6" elevation="6" rounded="xl">
    <!-- Header -->
    <div class="d-flex justify-space-between align-start mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold mb-2">Case Stats</h2>
        <div class="text-body-2 grey--text">
          Total <strong>48.5% Growth</strong> 😎 this month
        </div>
      </div>
      <v-card elevation="1">
        <div class="d-flex align-center">
        <!-- Previous Button -->
        <v-btn icon flat class="pa-0 ma-0" @click="goToPreviousMonth">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>

        <!-- Current Month Label -->
        <div class="text-h6 font-weight-medium mx-3"> {{ this.formattedDateRange }}</div>

        <!-- Next Button -->
        <v-btn icon flat @click="goToNextMonth" v-if="!isCurrentMonth">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
      </v-card>
      <!-- Navigation Arrows and Month -->
      
    </div>

    <!-- Stats Cards -->
    <v-row class="px-6 py-4" dense style="row-gap: 24px;" no-gutters>
      <v-col
        v-for="(stat, index) in stats"
        :key="index"
        class="d-flex"
        style="flex: 1 1 20%; max-width: 20%; padding: 12px;"
      >
        <singleCaseStatCard
          :icon="stat.icon"
          :color="stat.color"
          :title="stat.title"
          :value="String(stat.value)"
        />
      </v-col>
    </v-row>

    <!-- Assigned Agents -->
    <div class="d-flex flex-column ml-5 mt-5">
      <v-card-subtitle>
        <strong>Assigned Manager:</strong>
      </v-card-subtitle>
      <v-card-subtitle>
        <strong>Assigned Agents: {{ getAgentNameInCase(companyCase.name) }}</strong>
      </v-card-subtitle>
    </div>

    
  </v-card>
</template>
<script>
import singleCaseStatCard from './cases/singleCaseStatCard.vue';
import { mapGetters, mapActions, mapState } from 'vuex';
import { toRaw } from 'vue';

export default {
  name: 'CaseStatsCard',
  props: {
    companyCase: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    aggregatedStats: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    dateRange: {
      type: Object,
      required: true,
      default: () => ({}),
    },
  },
  components: {
    
    singleCaseStatCard,
  },
  data() {
    return {
      agentsWithStats: [],  
      caseStats: null,
      agentsInCase: [],
      hourMeeting: 0,
      dialsMeeting: 0,
      callsMeetings: 0,
    };
  },
  computed: {
    ...mapState(['currentPage']),
    ...mapGetters(['enrichedAgents', 'agents', 'cases', 'agentStats', 'currentDateRange']),
    stats() {
      return [
        { icon: 'mdi-chart-pie', color: 'purple', title: 'Total Billing:', value: this.companyCase.billing || 0 },
        { icon: 'mdi-account-group', color: 'green', title: 'Call Time:', value: this.aggregatedStats.call_time || 0 },
        { icon: 'mdi-laptop', color: 'amber', title: 'Total Meetings: ', value: this.aggregatedStats.meetings  || 0 },
        { icon: 'mdi-currency-usd', color: 'light-blue', title: 'Completed Calls:', value: this.aggregatedStats.calls_made  || 0 },
        { icon: 'mdi-currency-usd', color: 'purple', title: 'Dials / Meeting:', value: this.dialsMeeting  || 0 },
        { icon: 'mdi-currency-usd', color: 'green', title: 'Outgoing Calls :', value: this.aggregatedStats.outgoing_calls  || 0 },
        { icon: 'mdi-currency-usd', color: 'amber', title: 'Hour / Meeting:', value: this.hourMeeting },
        { icon: 'mdi-currency-usd', color: 'light-blue', title: 'Answered Calls:', value: this.aggregatedStats.answered_calls   || 0 },
        { icon: 'mdi-currency-usd', color: 'purple', title: 'Calls / Meetings :', value: `${this.callsMeetings}%`  || 0 },    
        { icon: 'mdi-currency-usd', color: 'purple', title: 'Response Rate :', value: `${this.aggregatedStats.response_rate}%`  || 0 },    
      ];
    },
      
    formattedDateRange() {
      if (!this.currentDateRange || this.currentDateRange.length < 2) {
        return '';
      }

      const [startDate] = this.currentDateRange;
      const date = new Date(startDate);

      // Format to MM-YYYY
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero
      const year = date.getFullYear();

      return `${month}-${year}`;
      },
      isCurrentMonth() {
      if (!this.currentDateRange || this.currentDateRange.length < 2) {
        return false;
      }

      const [startDate] = this.currentDateRange;
      const currentDate = new Date();

      // Check if the current month and year match the startDate
      return (
        currentDate.getMonth() === new Date(startDate).getMonth() &&
        currentDate.getFullYear() === new Date(startDate).getFullYear()
      );
    },
  },
  watch: {
    agentStats: {
      handler() {
        this.updateStats();
      },
      immediate: true,
    },
    dateRange: {
      handler() {
        this.updateStats();
      },
      deep: true,
      immediate: true,
    },
  },
  mounted() {
    console.log('ageentsStatsByMonth: in mounted', this.agentsStatsByMonth); 
    if (!this.currentDateRange || this.currentDateRange.length < 2) {
      const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1); // First day of the current month
      const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0); // Last day of the current month

      this.updateDateRange([startDate, endDate]); // Set the default date range
    }
    
    this.hourMeeting = Number(((+this.aggregatedStats.call_time / +this.aggregatedStats.meetings) * 100).toFixed(2)) || 0;
    this.dialsMeeting = +this.aggregatedStats.outgoing_calls / +this.aggregatedStats.meetings || 0;
    this.callsMeetings = ((+this.aggregatedStats.meetings / +this.aggregatedStats.calls_made) * 100) || 0;
    this.updateStats();
  },

  methods: {
    ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases', 'fetchCurrentDateRange']),
    getAgentsInCase(caseName) {
      console.log('Fetching agents in case:', caseName);
      console.log('All agents:', this.agents);
      const agentsInCase = this.agents.filter(agent => agent.cases.includes(caseName));
      console.log('Agents in case:', agentsInCase);
      return agentsInCase;
    },
    getAgentNameInCase() {
     this.agentsInCase = this.getAgentsInCase(this.companyCase.name);
      console.log('Agents in case:', this.agentsInCase);
      if (this.agentsInCase.length === 0) return 'No agents assigned';
      return this.agentsInCase.map(agent => agent.name).join(', ');
    },
    goToPreviousMonth() {
      const [startDate] = this.currentDateRange;
      const newStartDate = new Date(startDate);

      // Move to the previous month
      newStartDate.setMonth(newStartDate.getMonth() - 1);

      // Calculate the new end date (last day of the previous month)
      const newEndDate = new Date(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0);

      // Update the currentDateRange
      this.updateDateRange([newStartDate, newEndDate]);
    },
    goToNextMonth() {
      const [startDate] = this.currentDateRange;
      const newStartDate = new Date(startDate);

      // Move to the next month
      newStartDate.setMonth(newStartDate.getMonth() + 1);

      // Calculate the new end date (last day of the next month)
      const newEndDate = new Date(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0);

      // Update the currentDateRange
      this.updateDateRange([newStartDate, newEndDate]);
    },
    updateDateRange(newRange) {
      this.$emit('selectedDateRange', newRange); // Emit the new date range to the parent
      this.$store.commit('setDateRange', newRange); // Use the correct mutation name
      this.updateStats(); // Recalculate stats based on the new date range
    },
    updateStats() {
      const rawDateRange = toRaw(this.currentDateRange);
      if (!Array.isArray(rawDateRange)) {
        console.error('Invalid date range:', rawDateRange);
        return;
      }

      this.agentsWithStats = this.mergeStatsData(this.companyCase.name);
      // console.log('Agents with stats:', this.agentsWithStats);
      
      this.caseStats = this.aggregateStats();
      // console.log('Case stats:', this.caseStats);
    },
    mergeStatsData(caseName) {
      const rawDateRange = toRaw(this.dateRange || this.currentDateRange);
      const [startDate, endDate] = Array.isArray(rawDateRange)
        ? rawDateRange
        : [rawDateRange.startDate, rawDateRange.endDate];

      const agentsInCase = this.agents.filter(agent =>
        agent.cases.includes(this.companyCase.name)
      );

      return agentsInCase.map(agent => {
        const stats = this.agentStats.find(stat => {
          if (stat.name !== agent.name || stat.case !== caseName) return false;

          const statStart = new Date(stat.calling_date.start).getTime();
          const statEnd = new Date(stat.calling_date.end).getTime();
          const CStartdate = new Date(startDate).getTime();
          const CEnddate = new Date(endDate).getTime();

          return statStart <= CEnddate && statEnd >= CStartdate;
        });

        return {
          ...agent,
          meetings: stats?.meetings || 0,
          call_time: stats?.call_time || 0,
          calls_made: stats?.calls_made || 0,
          outgoing_calls: stats?.outgoing_calls || 0,
          answered_calls: stats?.answered_calls || 0,
          response_rate: stats?.response_rate || 0,
        };
      });
    },
    aggregateStats() {
      return this.agentsWithStats.reduce(
        (totals, agent) => {
          totals.totalMeetings += agent.meetings || 0;
          totals.totalCallTime += agent.call_time || 0;
          totals.totalCallsMade += agent.calls_made || 0;
          totals.totalOutgoingCalls += agent.outgoing_calls || 0;
          totals.totalAnsweredCalls += agent.answered_calls || 0;
          totals.totalResponseRate = totals.totalOutgoingCalls
            ? ((totals.totalAnsweredCalls / totals.totalOutgoingCalls) * 100).toFixed(1)
            : 0;
          return totals;
        },
        {
          totalMeetings: 0,
          totalCallTime: 0,
          totalCallsMade: 0,
          totalOutgoingCalls: 0,
          totalAnsweredCalls: 0,
          totalResponseRate: 0,
        }
      );
    },
  },
};
</script>