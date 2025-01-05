<template>
    <div class="d-flex flex-column align-center" style="height: 100vh;">
      <h1 class="mb-3 mt-5">Agents by Name</h1>
  
      <!-- List of Agent Cards -->
      <div class="d-flex flex-wrap justify-center">
        <v-card
          v-for="(agent, index) in agentsAndStats"
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
  import axios from 'axios';
  
  export default {
    name: 'dashBoard',
    data() {
      return {
        agents: [], // Array to store agents data
        agentStats: [], // Array to store agents data
        agentsAndStats: [],
      };
    },
    async mounted() {
      // Fetch the list of agents when the component is mounted
      try {
      // Wait for both data fetching functions to complete
      await Promise.all([this.getAgents(), this.getAgentStats()]);

      // Enrich the agents with stats
      this.agentsAndStats = this.getEnrichedAgents();
      console.log('agentsAndStats', this.agentsAndStats);
    } catch (error) {
      console.error('Error during data fetching:', error);
    }
    },

    methods: {
      async getAgents() {
        try {
          const response = await axios.get('https://goodcall-back-end.onrender.com/api/v1/agent/');
          this.agents = response.data;  // Store the fetched data in the agents array
        } catch (error) {
          console.error('Error fetching agents:', error);
        }
      },
      async getAgentStats() {
        try {
          const response = await axios.get('https://goodcall-back-end.onrender.com/api/v1/agentStats/');
          this.agentStats = response.data;  // Store the fetched data in the agents array
          console.log('agentStats', this.agentStats)
        } catch (error) {
          console.error('Error fetching agents:', error);
        }
      },

      
      getEnrichedAgents() {
        return this.agents.map(agent => {
          const stats = this.agentStats.find(stat => stat.name === agent.name);
          return { ...agent, ...stats }; // Merge agent and stats
        });
      }
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
  