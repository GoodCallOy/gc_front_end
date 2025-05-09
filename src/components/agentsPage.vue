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
import { mapGetters, mapMutations } from 'vuex';
import AgentCard from './agentCard.vue';
  
  export default {
    name: 'dashBoard',

    components: { AgentCard }, // Register the component
    
    computed: {
      ...mapGetters(['enrichedAgents', 'currentPage']),
  },

    mounted() {
      this.updatePage('agentPage');
      console.log('🔍 enrichedAgents on mount:', this.enrichedAgents);
      // this.printDebug();
    },

    methods: {
      ...mapMutations(['setCurrentPage']),

      updatePage(newPage) {
        this.setCurrentPage(newPage); // Update `currentPage` in the store
      },
      printDebug() {
       console.log('Debugging info:', this.enrichedAgents);
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
  