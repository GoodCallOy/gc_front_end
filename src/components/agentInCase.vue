<template>
  <div class="d-flex flex-column align-center" style="margin-bottom: 5%;">
    <h1 class="mb-3 mt-5">Agent in Case</h1>
    <h1 class="mb-3 mt-5">
      {{ selectedAgent }} stats in {{ selectedCase }}
    </h1>
  </div>
  <div class="grid-container" >
    
      <agentMonthStatCard
        v-for="(caseByWeek, index) in CaseStatsGroupedByMonth"
          :key="index"
          :activeCase=selectedCase
          :caseId="caseByWeek.caseId"
          :agent=selectedAgent
          :meetings=caseByWeek.meetings
          :call_time=caseByWeek.call_time
          :calls_made=caseByWeek.calls_made
          :outgoing_calls=caseByWeek.outgoing_calls
          :answered_calls=caseByWeek.answered_calls
          :response_rate=caseByWeek.response_rate
          :calling_date=caseByWeek.calling_date
      />
  </div>
</template>

<script>
import agentMonthStatCard from './agentMonthStatCard.vue';

import { mapGetters, mapState, mapActions } from 'vuex';
import { 
  populateCasesSortedByAgent, 
  populateCaseStatsGroupedByMonth, 
  populateCaseStatsGroupedByCase 
} from '../js/statsUtils';

export default {
  name: 'agentInCase',

  props: {
    activeAgent: String,
    activeCase: String,
  },

  components: { agentMonthStatCard, },

  data() {
    return {
      selectedAgent: this.$route.query.agent,
      selectedCase: this.$route.query.selectedCase,
      casesSortedByAgent: [],
      CaseStatsGroupedByCase: [],
      CaseStatsGroupedByMonth: [],
      filteredStats: [],
    };
  },
  
  computed: {
    ...mapGetters(['enrichedAgents', 'agents', 'cases', 'agentStats', 'currentPage']),
    ...mapState(['currentPage']),
  },

  async mounted() {
    await this.fetchAgents();
    await this.fetchAgentStats();
    await this.fetchCases();
    
    this.loadCasesSortedByAgent();
    // this.loadfilteredStats();
  },

  methods: {
    ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases']),

    loadCasesSortedByAgent() {
      if (!this.agentStats.length) {
        return;
      }
      this.casesSortedByAgent = populateCasesSortedByAgent(this.agentStats, this.selectedAgent);
      this.loadCaseStatsGroupedByCase();
    },

    loadCaseStatsGroupedByCase() {
      if (!this.casesSortedByAgent.length) {
        return;
      }

      this.CaseStatsGroupedByCase = populateCaseStatsGroupedByCase(this.casesSortedByAgent);
      console.log('CaseStatsGroupedByCase', this.CaseStatsGroupedByCase);
      this.loadCaseStatsGroupedByMonth();
    },

    // loadfilteredStats() {
    //   console.log('selectedCase:', this.selectedCase);
    //   console.log('CaseStatsGroupedByCase:', this.CaseStatsGroupedByCase);

    //   const stats = this.CaseStatsGroupedByCase.filter(stat => stat.caseId === this.selectedCase);
    //   console.log('Filtered stats:', stats);
    //   return stats;
    // },

    loadCaseStatsGroupedByMonth() {
      this.CaseStatsGroupedByMonth = populateCaseStatsGroupedByMonth(this.CaseStatsGroupedByCase);
    },
  }
};
</script>
<style scoped>
  .date-range-picker {
    width: 25vw;
    margin-bottom: 20px; /* Add margin to control spacing */
  }

  .card-container {
    width: 100vw;
  }

  .small-btn {
    font-size: 12px;
    padding: 4px 8px;
    min-width: 85px;
  }
  .grid-container {
    display: grid;
    grid-template-columns: repeat(5, 1fr); /* 3 per row */
    gap: 16px; /* Adjust spacing */
  }
</style>