<template>
  <v-card class="mx-auto my-2 mr-1" elevation="16" style="width: auto; max-width: 800px; padding: 20px;">
    <!-- Centered Case Information -->
    <div class="text-center mb-5">
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
          <div v-if="currentPage !== 'dashboard'" class="stats-card2">
            <v-card-subtitle></v-card-subtitle>
            <v-card-text class="text-center">
              <p><strong> Active Call Time (Soittoaika ):</strong> {{ aggregateStats.totalCallTime }} mins</p>
              <p><strong>Completed Calls Made (Läpiviedyt puhelut):</strong> {{ aggregateStats.totalCallsMade }}</p>
              <p><strong>Total Outgoing Calls (Uloslähteneet puhelut):</strong> {{ aggregateStats.totalOutgoingCalls }}</p>
              <p><strong>Total Answered Calls (Vastatut puhelut):</strong> {{ aggregateStats.totalAnsweredCalls }}</p>
              <p><strong>Average Response Rate (Vastausprosentti ):</strong> {{ averageResponseRate }}%</p>
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
      
    <!-- Filtered Agent Cards -->
    <v-card-subtitle>Assigned Manager: </v-card-subtitle>
    <v-card-subtitle>Assigned Agents</v-card-subtitle>
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
      currentPage: {
        type: String,
        default: () => "caseCard",
        required: true,
      },
      companyCase: {
        type: Object,
        required: true,
        default: () => ({}),
      },
      agents: {
        type: Array,
        required: true,
        default: () => [],
      },
    },
    components: {
      AgentCard,
    },
    data() {
      return {
        
      };
    },
    computed: {
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
    },
    created() {
      console.log('currentPage:', this.currentPage);
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
</style>
  