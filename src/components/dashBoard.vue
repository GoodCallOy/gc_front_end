<template>
    <div class="d-flex flex-column align-center" style="height: 100vh;">
      <h1 class="mb-3 mt-5">The DashBoard</h1>
      
      <div class="d-flex flex-column align-center">
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              color="primary"
              v-bind="props"
            >
            {{ displayDate }}
            </v-btn>
          </template>
          <v-card>
            <v-date-picker v-model="selectedDate" color="primary" />
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text color="primary" @click="menu = false">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </div>

      <p>List of cases.</p>
       <!-- List of Cases Cards -->
       <div class="d-flex flex-wrap justify-center mb-5">
        <CaseCard
          v-for="(singleCase, index) in cases"
          :key="index"
          :companyCase="singleCase"
          :agents="agents"
        />
      </div>

      <p class="mt-5">List of agents.</p>
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
      agents: [],          // Array to store agents data
      cases: [],           // Array to store cases data
      menu: false, // Controls the menu visibility
      selectedDate: new Date(), // Current selected date
      selectedRangeType: 'day', // Range type (day, week, month)
      rangeOptions: ['day', 'week', 'month'], // Range options
    };
    
  },

    computed: {
      displayDate() {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = this.selectedDate.toLocaleDateString(undefined, options);
        return `${formattedDate} (${this.selectedRangeType})`;
      },
    },

    mounted() {
      // Fetch the list of agents when the component is mounted
      this.getAgents();
      this.getCases();
    },

    methods: {
      async getAgents() {
        try {
          const response = await axios.get('https://goodcall-back-end.onrender.com/api/v1/agent/');
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
      onMenuToggle(newValue) {
        console.log('Menu toggled:', newValue);
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

  .date-picker-btn {
  text-transform: none; /* Avoids button text being uppercase */
  min-width: 200px;
}
  </style>
  