<template>
    <div class="d-flex flex-column align-center" style="height:100vh; margin-bottom: 15%;">
      <h1 class="mb-3 mt-5">Agent in Case</h1>
      <h1 class="mb-3 mt-5">
        {{ $route.query.agent }} stats in {{ selectedCase ? selectedCase.name : "Unknown Case" }}
      </h1>
    </div>
  </template>
  
  <script>
  import { mapGetters, mapState, mapActions } from 'vuex';
  
  export default {
    name: 'agentInCase',
  
    computed: {
      ...mapGetters(['enrichedAgents', 'agents', 'cases', 'agentStats', 'currentPage']),
      ...mapState(['currentPage']),
  
      selectedCase() {
        try {
          return this.$route.query.case ? JSON.parse(this.$route.query.case) : null;
        } catch (error) {
          console.error("Invalid case data:", error);
          return null;
        }
      }
    },
  
    mounted() {
      this.fetchAgents();
      this.fetchAgentStats();
      this.fetchCases();
      
      console.log('Parsed case:', this.selectedCase); // This should log correctly now
    },
  
    methods: {
      ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases']),
        
    }
  };
  </script>
  