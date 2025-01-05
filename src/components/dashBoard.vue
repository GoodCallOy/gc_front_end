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
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'dashBoard',
  components: {
    AgentCard, // Register the component
    CaseCard,  // Register the component
  },

  computed: {
    ...mapGetters(['enrichedAgents', 'agents', 'cases']), // Map Vuex getter to local computed property
  },

  mounted() {
    this.fetchAgents(); // Fetch agents when the component is mounted
    this.fetchAgentStats(); // Fetch agent stats when the component is mounted
    this.fetchCases();
  },

  methods: {
    ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases']), // Map Vuex actions to local methods
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
