<template>
    <div class="d-flex flex-column align-center" style="height: 100vh;">
      <h1 class="mb-3 mt-5">Agents by Name</h1>
  
      <!-- List of Agent Cards -->
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
import { mapGetters, mapActions, mapState, mapMutations } from 'vuex';
import AgentCard from './agentCard.vue';
  
  export default {
    name: 'dashBoard',

    components: { AgentCard }, // Register the component
    
    computed: {
      ...mapGetters(['enrichedAgents', 'agents', 'cases', 'agentStats', 'currentPage']), // Map Vuex getter to local computed property
      ...mapState(["currentPage"]),
  },

    mounted() {
      this.fetchAgents(); // Fetch agents when the component is mounted
      this.fetchAgentStats(); // Fetch agent stats when the component is mounted
      this.fetchCases();
      this.updatePage('agentPage');
      // this.printDebug();
    },

    methods: {
      ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases','fetchCurrentDateRange']),
      ...mapMutations(['setCurrentPage']),

      updatePage(newPage) {
        this.setCurrentPage(newPage); // Update `currentPage` in the store
      },
      printDebug() {
       
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
  