<template>
  <div class="d-flex flex-column align-center" style="height: 100vh;">
    <h1 class="mb-3 mt-5">{{ $route.query.case }}</h1>

    <div>
      <MonthButtons @childEvent="handleUpdatedDateRange" />
    </div>
    
    <div class="card-container d-flex justify-center pa-0 mb-5 mt-5" style="width: 80vw;">
      <CaseStatsCard
        :companyCase="selectedCase"
        :agents="agents"
        :agentsStatsByMonth="agentsStatsByMonth"
        :dateRange="selectedDateRange"
        :aggregatedStats="aggregatedStats"
        @selectedDateRange="handleUpdatedDateRange"
      />
    </div>

    <v-container fluid class="pa-0 mt-5" style="width: 80vw;">
      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title>
              <v-row justify="space-between" class="w-100">
                <div>
                  <v-chip color="primary" outlined>● Total Revenue</v-chip>
                  <v-chip color="primary lighten-4" outlined class="ml-2">○ Total Sales</v-chip>
                  <div class="text-caption mt-1">12.04.2022 - 12.05.2022</div>
                </div>
                <v-btn-toggle dense mandatory>
                  <v-btn>Day</v-btn>
                  <v-btn>Week</v-btn>
                  <v-btn>Month</v-btn>
                </v-btn-toggle>
              </v-row>
            </v-card-title>
            <v-card-text>
              <LineChart style="height: 400px;" />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card>
            <v-card-title class="d-flex justify-space-between">
              <span class="font-weight-medium">Profit this week</span>
              <v-menu>
                <template v-slot:activator="{ on = {}, attrs = {} }">
                  <v-btn text v-bind="attrs" v-on="on">This Week ▾</v-btn>
                </template>
                <v-list>
                  <v-list-item>Last Week</v-list-item>
                  <v-list-item>This Month</v-list-item>
                </v-list>
              </v-menu>
            </v-card-title>
            <v-card-text>
              <BarChart style="height: 400px;" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    <div fluid class="d-flex flex-wrap justify-center mt-5" style="width: 80vw;" >
      <singleCaseAgentCard
      v-for="(agent, index) in filteredAgentsStats"
        :key="index"
        :agent="agent"
        
      />
    </div>
  </div>
  
</template>

<script>
import CaseStatsCard from './caseStatsCard.vue';
// import MonthButtons from './monthButtons.vue';
import LineChart from '../partials/dashboard/line-chart.vue'
import BarChart from '../partials/dashboard/bar-chart.vue'
import { mapState, mapMutations } from 'vuex';
import MonthButtons from './monthButtons.vue';
import singleCaseAgentCard from './cases/singleCaseAgentCard.vue';
import { getAgentsInCase, groupAgentsStatsByMonth } from '../js/statsUtils';



export default {
  name: 'SingleCase',
  

  components: { 
    CaseStatsCard, 
    MonthButtons,
    LineChart,
    BarChart,
    singleCaseAgentCard
  },

  data() {
  const currentDate = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(currentDate.getDate() - 7);
  

  return {
    selectedDateRange: [sevenDaysAgo, currentDate],
    agentsInCase: [],
    agentsStatsByMonth: [],
  };
},


  computed: {
    ...mapState(['cases', 'agents', 'agentStats', 'currentPage']),

    selectedCase() {
      const caseName = this.$route.query.case;
      return this.cases.find(singleCase => singleCase.name === caseName);
    },

    aggregatedStats() {
    // Get the current month key (default to the first month in the selected range)
    const [startDate] = this.selectedDateRange.map(date => new Date(date));
    const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      console.log('monthKey in aggregatedStats:', monthKey);
    // Get the agents for the selected month
    const agentsForMonth = this.agentsStatsByMonth[monthKey] || [];

    // Aggregate the stats for the agents
    const totals = {
      meetings: 0,
      calls_made: 0,
      call_time: 0,
      outgoing_calls: 0,
      answered_calls: 0,
      response_rate: 0,
    };

    agentsForMonth.forEach(agent => {
      totals.meetings += agent.meetings || 0;
      totals.calls_made += agent.calls_made || 0;
      totals.call_time += agent.call_time || 0;
      totals.outgoing_calls += agent.outgoing_calls || 0;
      totals.answered_calls += agent.answered_calls || 0;
    });

    // Calculate the overall response rate
    totals.response_rate = totals.outgoing_calls > 0
      ? parseFloat(((totals.answered_calls / totals.outgoing_calls) * 100).toFixed(2))
      : 0;
      console.log('aggregatedStats:', totals);
    return totals;
  },

    filteredAgentsStats() {
      console.log('Recalculating filteredAgentsStats...');
      if (!this.agentsStatsByMonth || Object.keys(this.agentsStatsByMonth).length === 0) {
      return [];
    }

      const [startDate] = this.selectedDateRange.map(date => new Date(date));

      const monthKey = `${new Date(startDate).getFullYear()}-${String(new Date(startDate).getMonth() + 1).padStart(2, '0')}`;
      console.log('monthKey in singleCase:', monthKey);
      console.log('selectedDateRange:', this.selectedDateRange);
      console.log('agentsStatsByMonth:', this.agentsStatsByMonth);
      const agentsForMonth = this.agentsStatsByMonth[monthKey] || [];
      console.log('agentsForMonth:', agentsForMonth);
     // Return the array from agentsStatsByMonth that matches the monthKey
     return this.agentsStatsByMonth[monthKey] || [];
     
    },

    FilterCaseStatsGroupedByMonth(startDate, endDate) {
      const now = new Date();
      const filterStart = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const filterEnd = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const filteredStats = this.CaseStatsGroupedByMonth.filter(stat => {
        const statDate = new Date(stat.calling_date); // Ensure correct property
        return statDate >= filterStart && statDate <= filterEnd;
      });

      return filteredStats;
    },
  },

  watch: {
  selectedDateRange(newRange) {
    console.log('Date range changed:', newRange);

    const [startDate, endDate] = newRange.map(date => new Date(date));
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid date range detected:', newRange);
    } 
  },
},

  mounted() {
    this.updatePage('singleCase');
    this.agentsInCase = getAgentsInCase(this.selectedCase.name, this.agentStats);
    this.agentsStatsByMonth = groupAgentsStatsByMonth(this.agentsInCase);
    console.log('agentsStatsByMonth:', this.agentsStatsByMonth);
    console.log('agentsStatsByMonth[2]:', this.agentsStatsByMonth['2025-04']);
    console.log('agentsStatsByMonth[2]:', this.agentsStatsByMonth['2025-04']);
    console.log('Filtered Agents Stats (initial):', this.filteredAgentsStats);
    console.log('Selected Date Range:', this.selectedDateRange);
    console.log('aggregatedStats:', this.aggregatedStats);
    // console.log('FilterCaseStatsGroupedByMonth:', this.FilterCaseStatsGroupedByMonth(...this.selectedDateRange));
  },

  methods: {
    ...mapMutations(['setCurrentPage']),

    updatePage(newPage) {
      this.setCurrentPage(newPage);
    },
    handleUpdatedDateRange(newRange) {
      this.selectedDateRange = newRange;
      console.log('Updated selectedDateRange:', this.selectedDateRange);
    },
  },
}
</script>

<style scoped>
.date-range-picker {
  width: 25vw;
}

.card-container {
  width: 100vw;
}

.small-card {
  max-width: 450px;
  max-height: 300px;
  overflow: auto;
}

.small-btn {
  font-size: 12px;
  padding: 4px 8px;
  min-width: 85px;
}

.agent-card-container {
  margin-top: 20px; /* Add some space above the container */
  width: 80vw; /* Match the width of other components */
  margin: 0 auto; /* Center the container */
}

.agent-card-grid {
  display: flex;
  flex-wrap: wrap; /* Ensure cards wrap to the next row if needed */
  gap: 16px; /* Add spacing between cards */
  justify-content: center; /* Center the cards within the container */
}

.agent-card-grid .AgentCard {
  flex: 1 1 calc(25% - 16px); /* Adjust card width (4 cards per row) */
  max-width: 200px; /* Optional: Set a max width for cards */
}
</style>
