<template>
    <div class="d-flex flex-column align-center" style="height: 100vh;">
      <h1 class="mb-3 mt-5">Agents by Name</h1>
  
      <!-- List of Agent Cards -->
      <div class="d-flex flex-wrap justify-center">
        <v-card
          v-for="(agent, index) in enrichedAgents"
          :key="index"
          class="mx-2 my-2"
          elevation="16"
          style="width: 200px; height: 300px;"
        >
          <v-card-title>{{ agent.name }}</v-card-title>
          <v-card-subtitle>Agents Stats</v-card-subtitle>
          <v-card-text>
            <p>Meetings: {{ agent.meeting }}</p>
            <p>Call Time: {{ agent.call_time }} mins</p>
            <p>Calls Made: {{ agent.calls_made }}</p>
            <p>outgoing_calls: {{ agent.outgoing_calls }}</p>
            <p>answered_calls: {{ agent.answered_calls }}</p>
            <p>resopnse_rate: {{ agent.resopnse_rate }}%</p>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </template>
  
  <script>
import { mapGetters, mapActions } from 'vuex';
  
  export default {
    name: 'dashBoard',
    
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
  /* Optional styles for cards */
  .v-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  </style>
  