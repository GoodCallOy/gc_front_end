<template>
    <v-card class="mx-auto my-2 mr-3" elevation="16" style="min-width: 600px; max-width: 800px; padding: 20px;">
      <!-- Centered Case Information -->
      <div class="text-center mb-5">
        <v-card-title>{{ companyCase.name }}</v-card-title>
        <v-card-subtitle></v-card-subtitle>
        <v-card-text class="text-center">
          <p><strong>Billing:</strong> {{ companyCase.billing }} mins</p>
          <p><strong>Total Meetings:</strong> {{ aggregateStats.totalMeetings }}</p>
          <p><strong>Total Call Time:</strong> {{ aggregateStats.totalCallTime }} mins</p>
          <p><strong>Total Calls Made:</strong> {{ aggregateStats.totalCallsMade }}</p>
          <p><strong>Total Outgoing Calls:</strong> {{ aggregateStats.totalOutgoingCalls }}</p>
          <p><strong>Total Answered Calls:</strong> {{ aggregateStats.totalAnsweredCalls }}</p>
          <p><strong>Total Response Rate:</strong> {{ aggregateStats.totalResponseRate }}%</p>
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
      aggregateStats() {
      return this.filteredAgents.reduce(
        (totals, agent) => {
          totals.totalMeetings += agent.meetings || 0;
          totals.totalCallTime += agent.call_time || 0;
          totals.totalCallsMade += agent.calls_made || 0;
          totals.totalOutgoingCalls += agent.outgoing_calls || 0;
          totals.totalAnsweredCalls += agent.answered_calls || 0;
          totals.totalResponseRate += agent.response_rate || 0;
          return totals;
        },
        {
          totalMeetings: 0,
          totalCallTime: 0,
          totalCallsMade: 0,
          totalOutgoingCalls: 0,
          totalAnsweredCalls: 0,
          totalResponseRate: 0,
        }
      );
    },
    // Compute the average response rate
    averageResponseRate() {
      const agentsCount = this.filteredAgents.length;
      return agentsCount > 0
        ? this.aggregateStats.totalResponseRate / agentsCount
        : 0;
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
  