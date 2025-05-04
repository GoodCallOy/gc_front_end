<template>
  <v-card class="pa-6" elevation="2" rounded="xl">
    <!-- Header -->
    <div class="d-flex justify-space-between align-start mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold mb-2">Case Stats</h2>
        <div class="text-body-2 grey--text">
          Total <strong>48.5% Growth</strong> 😎 this month
        </div>
      </div>
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
      :value="stat.value"
    />
  </v-col>
</v-row>

    <!-- Assigned Agents -->
    <div class="d-flex flex-column ml-5">
      <v-card-subtitle>
        <strong>Assigned Manager:</strong>
      </v-card-subtitle>
      <v-card-subtitle>
        <strong>Assigned Agents: {{ getAgentNameInCase(companyCase.name) }}</strong>
      </v-card-subtitle>
    </div>

    <!-- Agent Cards -->
    <div class="d-flex flex-wrap justify-center mt-5">
      <AgentCard
        v-for="(agent, index) in filteredAgents"
        :key="index"
        :agent="agent"
        class="m-2"
      />
    </div>
  </v-card>
</template>

<script>
import AgentCard from './agentCard.vue';
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
    dateRange: {
      type: Object,
      required: true,
      default: () => ({}),
    },
  },
  components: {
    AgentCard,
    singleCaseStatCard,
  },
  data() {
    return {
      agentsWithStats: [],
      caseStats: null,
    };
  },
  computed: {
    ...mapState(['currentPage']),
    ...mapGetters(['enrichedAgents', 'agents', 'cases', 'agentStats', 'currentDateRange']),
    stats() {
      return [
        { icon: 'mdi-chart-pie', color: 'purple', title: 'Total Billing:', value: this.companyCase.billing || 0 },
        { icon: 'mdi-account-group', color: 'green', title: 'Active Call Time:', value: this.caseStats.totalCallTime || 0 },
        { icon: 'mdi-laptop', color: 'amber', title: 'Total Meetings: ', value: this.caseStats.totalMeetings  || 0 },
        { icon: 'mdi-currency-usd', color: 'light-blue', title: 'Completed Calls:', value: this.caseStats.totalCallsMade  || 0 },
        { icon: 'mdi-currency-usd', color: 'purple', title: 'Dials / Meeting:', value: this.caseStats.totalOutgoingCalls  || 0 },
        { icon: 'mdi-currency-usd', color: 'green', title: 'Outgoing Calls :', value: this.caseStats.totalOutgoingCalls  || 0 },
        { icon: 'mdi-currency-usd', color: 'amber', title: 'Hour/Meeting:', value: this.caseStats.totalOutgoingCalls  || 0 },
        { icon: 'mdi-currency-usd', color: 'light-blue', title: 'Answered Calls:', value: this.caseStats.totalAnsweredCalls   || 0 },
        { icon: 'mdi-currency-usd', color: 'purple', title: 'Avg Response Rate :', value: this.caseStats.totalOutgoingCalls  || 0 },    
      ];
    },
    filteredAgents() {
      const [startDate, endDate] = this.dateRange || this.currentDateRange;

      if (!startDate || !endDate) {
        console.error('Invalid date range for filtering agents:', this.dateRange);
        return [];
      }

      return this.agents.filter(agent => {
        const activityDate = new Date(agent.lastActivityDate).getTime();
        return (
          agent.case === this.companyCase.name &&
          activityDate >= new Date(startDate).getTime() &&
          activityDate <= new Date(endDate).getTime()
        );
      });
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
    this.fetchAgents();
    this.fetchAgentStats();
    this.fetchCases();
    this.updateStats();
    this.fetchCurrentDateRange();
  },
  methods: {
    ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases', 'fetchCurrentDateRange']),
    getAgentNameInCase() {
      const agentsInCase = this.agents.filter(agent =>
        agent.cases.includes(this.companyCase.name)
      );
      return agentsInCase.map(agent => agent.name).join(', ');
    },
    updateStats() {
      const rawDateRange = toRaw(this.dateRange);
      if (!Array.isArray(rawDateRange)) {
        console.error('Invalid date range:', rawDateRange);
        return;
      }

      this.agentsWithStats = this.mergeStatsData(this.companyCase.name);
      this.caseStats = this.aggregateStats();
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