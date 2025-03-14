<template>
  <div class="d-flex flex-column align-center" style="height: 100vh;">
    <h1 class="mb-3 mt-5">{{ $t('dashboard.title') }}</h1>

    <div>
      <MonthButtons @childEvent="handleUdatedDateRange">
      </MonthButtons>
    </div>

    <!-- List of Cases -->
    <p>{{ $t('dashboard.cases') }}.</p>
    <div class="grid-container">
      <CaseCard
        v-for="(singleCase, index) in cases"
        :key="index"
        :companyCase="singleCase"
        :agents="agents"
        :currentPage="'dashboard'"
        :dateRange="selectedDateRange"
      />
    </div>

    <!-- List of Agents -->
    <p class="mt-5">{{ $t('dashboard.agents') }}</p>
    <div class="d-flex flex-wrap justify-center">
      <AgentCard
        v-for="(agent, index) in enrichedAgents"
        :key="index"
        :agent="agent"
      />
    </div>
  </div>
</template>

<script>

import AgentCard from './agentCard.vue';
import CaseCard from './caseCard.vue';
import MonthButtons from './monthButtons.vue';    
import { mapGetters, mapActions, mapState, mapMutations } from 'vuex';

export default {
  name: 'dashBoard',
  components: {
    AgentCard, 
    CaseCard,  
    MonthButtons,
  },

  data() {

    const currentDate = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    return {
      selectedDateRange: [
        sevenDaysAgo.toISOString().split('T')[0],
        currentDate.toISOString().split('T')[0],
      ],
    };
  },

  computed: {
    ...mapGetters(['enrichedAgents', 'agents', 'cases', 'agentStats', 'currentPage']), // Map Vuex getter to local computed property
    ...mapState(["currentPage"]), // Maps the `currentPage` state to a computed property

    currentPage() {
      console.log('currentPage', this.$store.getters.currentPage)
      return this.$store.getters.currentPage;
    },
    casesGrouped() {
      const casesMap = {};

      // Loop over each agent from the store
      this.agentStats.forEach(agent => {
        // Ensure agent.cases exists and is an array
        if (Array.isArray(agent.case)) {
         
            // Initialize array for this case if it doesn't exist
            if (!casesMap[agent.case]) {
              casesMap[agent.case] = [];
            }
            // Add the agent to the corresponding case group
            casesMap[agent.case].push(agent);
        }
      });

      // Convert the casesMap object into an array of objects
      return Object.entries(casesMap).map(([caseName, agents]) => ({
        caseName,
        agents
      }));
    }
  },

  async mounted() {
    this.fetchAgents(); // Fetch agents when the component is mounted
    this.fetchCases();
    this.updatePage('dashBoard');
    await this.fetchAgentStats();
    this.printDebug();
  },

  methods: {
    ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases']), // Map Vuex actions to local methods

    ...mapMutations(["setCurrentPage"]), // Maps mutation to update `currentPage`
    updatePage(newPage) {
      this.setCurrentPage(newPage); // Update `currentPage` in the store
    },
    handleUdatedDateRange(newRange) {
      this.selectedDateRange = newRange;
    },
    printDebug() {
       
      }
  },
};
</script>

<style scoped>
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
  .grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 3 per row */
    gap: 16px; /* Adjust spacing */
  }
</style>
