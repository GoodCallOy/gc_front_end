<template>
  <div class="d-flex flex-column align-center" style="height: 100vh;">
    <h1 class="mb-3 mt-5">{{ $route.query.agent }}</h1>

    <div class="d-flex justify-center date-range-picker">
      <v-date-input
        v-model="selectedDateRange"
        label="Select range" 
        multiple="range"
        outlined
      ></v-date-input>
    </div>
    <div class="justify-center mt-5 d-flex flex-wrap flex-row">
      <singleStatCard class="mr-5"
      v-for="(singleCase, index) in CasesSortedByAgent"
        :key="index"
        :agent="singleCase" 
      />
    </div>
  </div>
</template>

<script>
import singleStatCard from './singleStatCard.vue';
import { mapGetters, mapActions, mapState, mapMutations } from 'vuex';

export default {
  name: 'SingleAgent',

  components: { singleStatCard },

  data() {
    const currentDate = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    return {
      selectedDateRange: [sevenDaysAgo, currentDate],
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
      CasesSortedByAgent() {
      return this.agentStats
        .filter(singleCase =>singleCase.name.includes(this.selectedAgent))
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
    this.updatePage('singleAgent');
    // this.printDebug();
  },

  methods: {
    ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases', 'fetchCurrentDateRange']),
    ...mapMutations(['setCurrentPage']),

    updatePage(newPage) {
      this.setCurrentPage(newPage);
    },
    printDebug() {
        console.log('CasesSortedByAgent', this.CasesSortedByAgent)
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
</style>