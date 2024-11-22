<template>
    <v-card class="mx-auto my-2 mr-3" elevation="16" style="width: auto; max-width: 800px; padding: 20px;">
      <!-- Centered Case Information -->
      <div class="text-center mb-5">
        <v-card-title>{{ companyCase.name }}</v-card-title>
        <v-card-subtitle></v-card-subtitle>
        <v-card-text>
          <p><strong>Name:</strong> {{ companyCase.name }}</p>
          <p><strong>Billing:</strong> {{ companyCase.billing }} mins</p>
        </v-card-text>
      </div>
  
      <!-- Filtered Agent Cards -->
      <div class="d-flex flex-wrap justify-center">
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
  
  export default {
    name: 'CaseCard',
    props: {
      companyCase: {
        type: Object,
        required: true, // The current case object
      },
      agents: {
        type: Array,
        required: true, // Array of all agents
      },
    },
    components: {
      AgentCard, // Register the AgentCard component
    },
    computed: {
      // Filter agents by the current case
      filteredAgents() {
        return this.agents.filter(agent => agent.case === this.companyCase.name);
      },
    },
  };
  </script>
  
  <style scoped>
  /* Ensures proper wrapping and alignment */
  .d-flex.flex-wrap {
    gap: 16px; /* Adds spacing between cards */
  }
  
  .text-center {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  </style>
  