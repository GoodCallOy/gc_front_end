<template>
  <div class="d-flex flex-column align-center" style="height:100vh; margin-bottom: 15%;">
    <h1 class="mb-3 mt-5">{{ $route.query.agent }}</h1>

    <div class="d-flex justify-center date-range-picker">
      <v-date-input
        v-model="selectedDateRange"
        label="Select range" 
        multiple="range"
        outlined
      ></v-date-input>
    </div>
    <div>
      <MonthButtons @childEvent="handleUdatedDateRange">
      </MonthButtons>
    </div>
    <div class="grid-container" >
      <singleStatCard
      v-for="(singleCase, index) in filteredStats"
        :key="index"
        :agent=this.$route.query.agent
        :selectedCase="singleCase" 
        :YTDStats="CaseStatsYTD"
      />
    </div>
  </div>
</template>

<script>
import singleStatCard from './singleStatCard.vue';
import MonthButtons from './monthButtons.vue';
import { populateCasesSortedByAgent } from '../js/statsUtils';
import { mapGetters, mapActions, mapState, mapMutations } from 'vuex';

export default {
  name: 'SingleAgent',

  components: { singleStatCard, MonthButtons },

  data() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      // selectedDateRange: [sevenDaysAgo, currentDate],
      selectedDateRange: [startOfMonth, endOfMonth],  // Set current month
      casesSortedByAgent: [],
      CaseStatsGroupedByCase: [],
      CaseStatsGroupedByMonth: [],
      CaseStatsYTD: [],
      filteredStats: [],
    };
  },

  computed: {
    ...mapGetters(['enrichedAgents', 'agents', 'cases', 'agentStats', 'currentPage']),    ...mapState(['currentPage']),

    selectedAgent() {
      return this.$route.query.agent;
    },

    selectedAgentInfo() {
      const agentName = this.$route.query.agent;
      return this.agents.find(singleAgent => singleAgent.name === agentName);
    },
    CasesSortedByAgentClean() {
      return this.agentStats
        .filter(singleCase =>singleCase.name.includes(this.selectedAgent))
    }, 

  },

  watch: {
    selectedDateRange(newRange) {
      console.log("📆 Date range changed:", newRange);

      if (!this.CaseStatsGroupedByMonth.length) {
        console.warn("🚨 No data available yet for filtering!");
        return;
      }

      const [startDate, endDate] = newRange.map(date => new Date(date));
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error("❌ Invalid date range detected:", newRange);
        return;
      }

      this.filteredStats = this.FilterCaseStatsGroupedByMonth(startDate, endDate);
      console.log("🔍 Filtered stats:", this.filteredStats);
  
    },
    CaseStatsGroupedByMonth(newStats) {
      if (newStats.length > 0) {
       
        this.filteredStats = this.FilterCaseStatsGroupedByMonth(...this.selectedDateRange);
      } else {
        console.warn("🚨 Still no case stats, waiting...");
      }
    }
  },

  mounted() {
    this.selectedDateRange = [new Date(new Date().getFullYear(), new Date().getMonth(), 1), 
                            new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)];


  const initialize = async () => {
    await this.fetchAgents();
    await this.fetchAgentStats();
    await this.fetchCases();

    console.log("✅ :", this.agentStats);

    this.updatePage('singleAgent');

    this.populateCasesSortedByAgent(); 
    this.populateCaseStatsGroupedByCase();
    this.populateCaseStatsGroupedByMonth();
    this.FilterCaseStatsGroupedByMonth();
    this.populateCaseStatsYTD();
    this.loadCases();
    this.printDebug();
  };

  initialize();
},
  methods: {
    ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases', 'fetchCurrentDateRange']),
    ...mapMutations(['setCurrentPage']),

    loadCases() {
      this.casesSortedByAgent = populateCasesSortedByAgent(this.agentStats, this.selectedAgent);
    },

    updatePage(newPage) {
      this.setCurrentPage(newPage);
      },
    populateCasesSortedByAgent() {
      this.casesSortedByAgent = this.agentStats
      .filter(singleCase =>singleCase.name.includes(this.selectedAgent))
    },
    populateCaseStatsGroupedByCase() {
      this.CaseStatsGroupedByCase = this.casesSortedByAgent.reduce((acc, singleCase) => {
        const caseId = singleCase.case; // Unique case identifier
        if (!acc[caseId]) {
          acc[caseId] = []; // Create a new array for each case
        }

        acc[caseId].push(singleCase); // Add the case entry to the corresponding array
        return acc;
      }, {});
    },
    populateCaseStatsGroupedByMonth() {
      this.CaseStatsGroupedByMonth = Object.values(this.CaseStatsGroupedByCase).flatMap(caseEntries => {
        return Object.values(caseEntries.reduce((acc, singleCase) => {
          const caseDate = new Date(singleCase.calling_date.start); // Assuming calling_date is an object with start & end
          const caseMonth = caseDate.getMonth() + 1; // 1-based month
          const caseYear = caseDate.getFullYear();
          const monthKey = `${caseYear}-${caseMonth}`;

          if (!acc[monthKey]) {
            acc[monthKey] = { 
              caseId: singleCase.case, // Add caseId field
              calling_date: monthKey, // Store the month-year string
              meetings: 0, 
              calls_made: 0, 
              call_time: 0, 
              outgoing_calls: 0, 
              answered_calls: 0,
              response_rate: 0,
              case: singleCase.case,
              monthKey: monthKey,
            };
          }

          // Aggregate stats
          acc[monthKey].meetings += singleCase.meetings || 0;
          acc[monthKey].calls_made += singleCase.calls_made || 0;
          acc[monthKey].call_time += singleCase.call_time || 0;
          acc[monthKey].outgoing_calls += singleCase.outgoing_calls || 0;
          acc[monthKey].answered_calls += singleCase.answered_calls || 0;

          // Recalculate response rate and limit to 2 decimal places
          acc[monthKey].response_rate = acc[monthKey].outgoing_calls > 0
            ? parseFloat(((acc[monthKey].answered_calls / acc[monthKey].outgoing_calls) * 100).toFixed(2))
            : 0;  
          return acc;
        }, {}));
      });
      console.log('Final CaseStatsGroupedByMonth:', this.CaseStatsGroupedByMonth);
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
    populateCaseStatsYTD() {
      const currentYear = new Date().getFullYear();

      this.CaseStatsYTD = Object.values(this.CaseStatsGroupedByMonth).reduce((acc, singleCase) => {
        const caseId = singleCase.caseId; 
        const caseYear = parseInt(singleCase.calling_date.split('-')[0]); // Extract year from YYYY-MM

        // Only include data from the current year
        if (caseYear !== currentYear) {
          return acc;
        }

        if (!acc[caseId]) {
          acc[caseId] = { 
            caseId: caseId,
            meetings: 0, 
            calls_made: 0, 
            call_time: 0, 
            outgoing_calls: 0, 
            answered_calls: 0,
            response_rate: 0 
          };
        }

        // Add up stats for the current year
        acc[caseId].meetings += singleCase.meetings;
        acc[caseId].calls_made += singleCase.calls_made;
        acc[caseId].call_time += singleCase.call_time;
        acc[caseId].outgoing_calls += singleCase.outgoing_calls;
        acc[caseId].answered_calls += singleCase.answered_calls;

        return acc;
      }, {});

      // Convert to array & calculate response rate
      this.CaseStatsYTD = Object.values(this.CaseStatsYTD).map(caseObj => ({
        ...caseObj,
        response_rate: caseObj.outgoing_calls > 0 
          ? parseFloat(((caseObj.answered_calls / caseObj.outgoing_calls) * 100).toFixed(2))
          : 0
      }));
    },
    handleUdatedDateRange(newRange) {
      this.selectedDateRange = newRange;
    },
    printDebug() {
        console.log('selectedDateRange', this.selectedDateRange );
      }
  },
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