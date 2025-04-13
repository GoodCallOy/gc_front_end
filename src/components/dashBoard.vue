<template>
  <div class="d-flex flex-column align-center" style="height: 100vh;">
    <h1 class="mb-3 mt-5">{{ $t('dashboard.title') }}</h1>

    <div>
      <MonthButtons @childEvent="handleUpdatedDateRange" />
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

    <!-- List of Agents
    <p class="mt-5">{{ $t('dashboard.agents') }}</p>
    <div class="d-flex flex-wrap justify-center">
      <AgentCard
        v-for="(agent, index) in enrichedAgents"
        :key="index"
        :agent="agent"
      />
    </div> -->
  </div>
</template>

<script>
// import AgentCard from './agentCard.vue';
import CaseCard from './caseCard.vue';
import MonthButtons from './monthButtons.vue';    
import { mapGetters, mapActions, mapState, mapMutations } from 'vuex';

export default {
  name: 'DashBoard',
  components: {
    // AgentCard, 
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
    ...mapGetters(['enrichedAgents', 'agents', 'cases', 'agentStats']),
    ...mapState(['currentPage']),

    user() {
      return this.$store.state.user;
    },

    casesGrouped() {
      const casesMap = {};
      this.agentStats.forEach(agent => {
        if (Array.isArray(agent.cases)) {
          agent.cases.forEach(caseItem => {
            if (!casesMap[caseItem]) {
              casesMap[caseItem] = [];
            }
            casesMap[caseItem].push(agent);
          });
        }
      });
      return Object.entries(casesMap).map(([caseName, agents]) => ({ caseName, agents }));
    },
  },

  async mounted() {
    this.fetchAgents();
    this.fetchCases();
    this.updatePage('DashBoard');
    this.printDebug();
    await this.fetchAgentStats();
    console.log('🟠 onMounted: Checking user in Vuex:', this.$store.state.user);
    if (!this.$store.state.user) {
      this.$store.dispatch('loadUserFromStorage');
      await this.fetchUserData();
    }
  },

  methods: {
    ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases']),
    ...mapMutations(['setCurrentPage']),
    
    updatePage(newPage) {
      this.setCurrentPage(newPage);
    },
    
    async fetchUserData() {
      await this.$store.dispatch('fetchUser');
    },
    
    handleUpdatedDateRange(newRange) {
      this.selectedDateRange = newRange;
    },
    
    printDebug() {
     
      console.log('🔍 Current Page:', this.currentPage);
      console.log('🔍 User in dashboard:', this.$store.state.user);
    },
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
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
</style>
