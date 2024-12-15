<template>
  <div class="d-flex flex-column align-center" style="height: 100vh;">
    <h1 class="mb-3 mt-5">{{ $t('dashboard.title') }}</h1>

    <!-- List of Cases -->
    <p>{{ $t('dashboard.cases') }}.</p>
    <div class="d-flex flex-wrap justify-center mb-5">
      <CaseCard
        v-for="(singleCase, index) in cases"
        :key="index"
        :companyCase="singleCase"
        :agents="agents"
        :currentPage="'dashboard'"
      />
    </div>

    <!-- List of Agents -->
    <p class="mt-5">{{ $t('dashboard.agents') }}</p>
    <div class="d-flex flex-wrap justify-center">
      <AgentCard
        v-for="(agent, index) in agents"
        :key="index"
        :agent="agent"
      />
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import AgentCard from './agentCard.vue';
import CaseCard from './caseCard.vue';

export default {
  name: 'dashBoard',
  components: {
    AgentCard, // Register the component
    CaseCard,  // Register the component
  },

  data() {
    return {
      agents: [],          // Array to store agents data
      cases: [],           // Array to store cases data
    }
  },

  mounted() {
    // Fetch the list of agents when the component is mounted
    this.getAgents();
    this.getCases();
  },

  methods: {
    async getAgents() {
      try {
        const response = await axios.get('https://goodcall-back-end.onrender.com/api/v1/agent/');
        this.agents = response.data; // Store the fetched data in the agents array
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    },

    async getCases() {
      try {
        const response = await axios.get('https://goodcall-back-end.onrender.com/api/v1/cases/');
        this.cases = response.data; // Store the fetched data in the cases array
      } catch (error) {
        console.error('Error fetching cases:', error);
      }
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
</style>
