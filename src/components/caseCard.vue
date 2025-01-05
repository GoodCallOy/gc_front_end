<template>
  <v-card :class="['mx-2 my-2', { 'full-width-card': currentPage === 'singleCase' }]"
  :style="currentPage === 'singleCase' ? 'width: 100%; margin: 0;' : 'width: auto; max-width: 400px; padding: 20px;'"
  :elevation="currentPage === 'singleCase' ? 0 : 16">
    <!-- Centered Case Information -->
    <div class="text-center">
      <v-card-title>{{ companyCase.name }}</v-card-title>
      
      <!-- Statistics -->
      <div class="d-flex stats-container">
        <!-- First card -->
        <div class="stats-card">
          <v-card-subtitle></v-card-subtitle>
          <v-card-text class="text-center">
            <p><strong>Total Billing:</strong> {{ companyCase.billing }}</p>
            <p><strong>Total Meetings (Tapaamiset ):</strong> {{ aggregateStats.totalMeetings }}</p>
            <p><strong>Dials / Meeting (Uloslähtenyttä):</strong> {{ aggregateStats.totalMeetings }}</p>
            <p><strong>Hour/Meeting (Tunti):</strong> {{ aggregateStats.totalOutgoingCalls }}</p>       
          </v-card-text>
        </div>

        <!-- Second card -->
          <div v-if="currentPage !== 'dashBoard'" class="stats-card2">
            <v-card-subtitle></v-card-subtitle>
            <v-card-text class="text-center">
              <p><strong> Active Call Time (Soittoaika ):</strong> {{ aggregateStats.totalCallTime }} mins</p>
              <p><strong>Completed Calls Made (Läpiviedyt puhelut):</strong> {{ aggregateStats.totalCallsMade }}</p>
              <p><strong>Total Outgoing Calls (Uloslähteneet puhelut):</strong> {{ aggregateStats.totalOutgoingCalls }}</p>
              <p><strong>Total Answered Calls (Vastatut puhelut):</strong> {{ aggregateStats.totalAnsweredCalls }}</p>
              <p><strong>Average Response Rate (Vastausprosentti ):</strong> {{ averageResponseRate }}%</p>   
            </v-card-text>
          </div>
        <!-- Second card -->
          <div v-if="currentPage !== 'dashBoard'" class="stats-card2">
            <v-card-subtitle></v-card-subtitle>
            <v-card-text class="text-center">
              <p><strong>Answered call/Meeting (Vastattua puhelua):</strong> {{ aggregateStats.totalCallTime }}</p>
              <p><strong>Completed calls/Meeting (Läpivietyä):</strong> {{ aggregateStats.totalCallsMade }}</p>
              <p><strong>Hour/Meeting (Tunti):</strong> {{ aggregateStats.totalOutgoingCalls }}</p>
              <p><strong>Calls/Hour (Puheluita ):</strong> {{ aggregateStats.totalAnsweredCalls }}</p>
              <p><strong>Completed Calls/Hour (Läpivietyjä):</strong> {{ averageResponseRate }}</p>
              <p><strong>Price/Appointment (Hinta):</strong> {{ averageResponseRate }}</p>
            </v-card-text>
          </div>
      </div>
    </div>
    <div  v-if="currentPage === 'dashBoard'" class="d-flex justify-center">
      <v-btn color="primary" class="mb-5" @click="showCase">
        show case
      </v-btn>
    </div>   
      
    <!-- Filtered Agent Cards -->
    <v-card-subtitle><strong>Assigned Manager:</strong> </v-card-subtitle>
    <v-card-subtitle><strong>Assigned Agents: {{ getAgentNameInCase(companyCase.name) }} </strong></v-card-subtitle>

    <div class="d-flex flex-wrap justify-center mt-5">
      <AgentCard
        v-for="(agent, index) in filteredAgents"
        :key="index"
        :agent="agent"
        class="m-2"
      />
    </div>
    <div v-if="currentPage !== 'dashBoard'" class="d-flex flex-wrap justify-center">
      <AgentCard
        v-for="(agent, index) in filteredAgentsList"
        :key="index"
        :agent="agent"
      />
    </div>
  </v-card>
</template>


  
<script>
  import AgentCard from './agentCard.vue';
  import { mapGetters, mapActions, mapState } from 'vuex';


  export default {
    name: 'CaseCard',
    props: {
      companyCase: {
        type: Object,
        required: true,
        default: () => ({}),
      },
      
    },
    components: {
      AgentCard,
    },

    data() {
    return {
      dateRange: 'day', // Default value: 'day', 'week', or 'month'
    };
  },
    
    computed: {
      ...mapGetters(['enrichedAgents', 'agents', 'cases']), // Map Vuex getter to local computed property
      ...mapState(["currentPage"]),

      currentPage() {
        return this.$store.getters.currentPage;
      },
    
      // Filter agents by the current case and date range
      filteredAgents() {
        const endDate = new Date();
        let startDate;
        switch (this.dateRange) {
          case 'week':
            startDate = new Date();
            startDate.setDate(endDate.getDate() - 7);
            break;
          case 'month':
            startDate = new Date();
            startDate.setMonth(endDate.getMonth() - 1);
            break;
          default: // 'day'
            startDate = new Date();
            startDate.setDate(endDate.getDate() - 1);
            break;
        }

        return this.agents.filter(agent => {
          const activityDate = new Date(agent.lastActivityDate);
          return (
            agent.case === this.companyCase.name &&
            activityDate >= startDate &&
            activityDate <= endDate
          );
        });
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
      averageResponseRate() {
        const agentsCount = this.filteredAgents.length;
        return agentsCount > 0
          ? (this.aggregateStats.totalResponseRate / agentsCount).toFixed(2)
          : 0;
      },

      filteredAgentsList() {
        return this.agents.filter(agent =>
          agent.cases && agent.cases.includes(this.companyCase.name)
        );
      },
    },

    mounted() {
      this.fetchAgents(); // Fetch agents when the component is mounted
      this.fetchAgentStats(); // Fetch agent stats when the component is mounted
      this.fetchCases();
    },

    methods: {
      ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases']), // Map Vuex actions to local methods

      groupAgentsByCases(inputCaseName) {
        const grouped = {};

        this.agents.forEach((agent) => {
          agent.cases.forEach((caseName) => {
            // Initialize the array for the case if it doesn't exist
            if (!grouped[caseName]) {
              grouped[caseName] = [];
            }
            // Add the agent to the case's array
            grouped[caseName].push(agent);
          });
        });
        return grouped[inputCaseName] || [];
      },

      getAgentNameInCase(inputCaseName) {
        const agentsInCase = this.groupAgentsByCases(inputCaseName);
        return agentsInCase.map((agent) => agent.name).join(', ');
      },

      showCase() {
        this.$router.push({
          name: 'singleCase',
          query: { case: this.companyCase.name },
        });
      }
    }
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
  /* Flexbox container for side-by-side layout */
.stats-container {
  display: flex;
  justify-content: space-between; /* Space between the two cards */
  gap: 10px; /* Optional, for consistent spacing */
}

/* Individual card styling */
.stats-card {
  flex: 1; /* Makes the cards equal in size */
  padding: 20px;
  background-color: white; /* Ensure consistent background */
}
.stats-card2 {
  flex: 1; /* Makes the cards equal in size */
  max-width: 50%; /* Restrict max width for balance */
  padding: 20px;
  background-color: white; /* Ensure consistent background */
}
.full-width-card {
  width: 100%;
  margin: 0;
  padding: 20px; /* Optional: Adjust padding as needed */
}
</style>
  