<template>
    <div class="d-flex flex-column align-center" style="height: 100vh;">
      <h1 class="mb-3 mt-5">The DashBoard</h1>
      <p>List of cases.</p>
  
       <!-- List of Cases Cards -->
       <div class="d-flex flex-wrap justify-center">
        <CaseCard
          v-for="(singleCase, index) in cases"
          :key="index"
          :companyCase="singleCase"
          :agents="agents"
        />
      </div>

      <p>List of agents.</p>
      <!-- List of Agent Cards -->
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
  import AgentCard from './agentCard.vue'
  import CaseCard from './caseCard.vue'
  
  export default {
    name: 'dashBoard',
    
    components: {
      AgentCard, // Register the component
      CaseCard, // Register the component
    },
    
    data() {
      return {
        agents: [], // Array to store agents data
        cases: [],
      };
    },

    mounted() {
      // Fetch the list of agents when the component is mounted
      this.getAgents();
      this.getCases();
    },

    methods: {
      async getAgents() {
        try {
          const response = await axios.get('https://goodcall-back-end.onrender.com/api/v1/agents/');
          this.agents = response.data; // Store the fetched data in the agents array
        } catch (error) {
          console.error('Error fetching agents:', error);
        }
      },
      async getCases() {
        try {
          const response = await axios.get('https://goodcall-back-end.onrender.com/api/v1/cases/');
          this.cases = response.data; // Store the fetched data in the agents array
        } catch (error) {
          console.error('Error fetching agents:', error);
        }
      },
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
  