<template>
    <div class="d-flex flex-column align-center" style="height: 100vh;">
      <h1 class="mb-3 mt-5">{{ this.$route.query.case }}</h1>
  
      
      <div class="d-flex justify-center" style="width: 25vw;">
        <v-date-input
          v-model="selectedDateRange"
          label="Select range" 
          multiple="range"
          outlined
        ></v-date-input>
      </div>
      
      <div class=" justify-center" style="width: 100vw;">
        <CaseCard
          :companyCase="selectedCase"
          :agents="agents"
        />
      </div>
  
      <!-- List of Agents -->
      
    </div>
  </template>
  
  <script>
  import CaseCard from './caseCard.vue';
  import { mapGetters, mapActions, mapState, mapMutations } from 'vuex';
  
  export default {
    name: 'SinglCase',
  
    components: {
      CaseCard,  // Register the component
      
    },
  
    data() {
      return {
        selectedDateRange: null, 
      };
    },
    
    computed: {
      ...mapGetters(['enrichedAgents', 'agents', 'cases']), // Map Vuex getter to local computed property
      ...mapState(["currentPage"]),

      currentPage() {
        console.log('currentPage', this.$store.getters.currentPage)
        return this.$store.getters.currentPage;
      },

      selectedCase() {
        const caseName = this.$route.query.case; // Get the case name from the query string
        const selected = this.cases.find(singleCase => singleCase.name === caseName); // Find the specific case by name
        return selected;
      },
    },
  
    mounted() {
      this.fetchAgents(); // Fetch agents when the component is mounted
      this.fetchAgentStats(); // Fetch agent stats when the component is mounted
      this.fetchCases();
      this.updatePage('singleCase');

    },
  
    methods: {
      
      ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases']), // Map Vuex actions to local methods
      ...mapMutations(["setCurrentPage"]), // Maps mutation to update `currentPage`
      
      updatePage(newPage) {
        this.setCurrentPage(newPage); // Update `currentPage` in the store
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
  