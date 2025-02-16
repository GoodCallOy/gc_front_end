<template>
  <div class="d-flex flex-column align-center" style="height: 100vh;">
    <h1 class="mb-3 mt-5">{{ $route.query.case }}</h1>

    <div class="d-flex justify-center date-range-picker">
      <v-date-input
        v-model="selectedDateRange"
        label="Select range" 
        multiple="range"
        outlined
      ></v-date-input>
    </div><div>
      <MonthButtons @childEvent="handleUdatedDateRange">
      </MonthButtons>
    </div>
    <div class="justify-center card-container">
      <CaseStatsCard
        :companyCase="selectedCase"
        :agents="agents"
        :dateRange="selectedDateRange"
      />
    </div>
  </div>
</template>

<script>
import CaseStatsCard from './caseStatsCard.vue';
import MonthButtons from './monthButtons.vue';
import { mapGetters, mapActions, mapState, mapMutations } from 'vuex';

export default {
  name: 'SingleCase',

  components: { CaseStatsCard, MonthButtons},

  data() {
  const currentDate = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(currentDate.getDate() - 7);

  return {
    selectedDateRange: [sevenDaysAgo, currentDate],
  };
},


  computed: {
    ...mapGetters(['enrichedAgents', 'agents', 'cases', 'agentStats', 'currentPage']),
    ...mapState(["currentPage"]), 


    selectedCase() {
      const caseName = this.$route.query.case;
      return this.cases.find(singleCase => singleCase.name === caseName);
    },
  },

  watch: {
  selectedDateRange(newRange) {
    console.log('Date range changed:', newRange);

    const [startDate, endDate] = newRange.map(date => new Date(date));
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid date range detected:', newRange);
    } else {
      console.log('Valid date range:', { startDate, endDate });
    }
  },
},

  mounted() {
    this.fetchAgents();
    this.fetchAgentStats();
    this.fetchCases();
    this.updatePage('singleCase');
  },

  methods: {
    ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases','fetchCurrentDateRange']),
    ...mapMutations(['setCurrentPage']),

    updatePage(newPage) {
      this.setCurrentPage(newPage);
    },
    handleUdatedDateRange(newDateRange) {
      this.selectedDateRange = newDateRange;
    },
  },
};
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
</style>
