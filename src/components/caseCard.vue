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
            <p><strong>Billing:</strong> {{ companyCase.billing }} mins</p>
            <p><strong>Total Meetings:</strong> {{ aggregateStats.totalMeetings }}</p>
            <p><strong>Total Call Time:</strong> {{ aggregateStats.totalCallTime }} mins</p>
            <p><strong>Total Calls Made:</strong> {{ aggregateStats.totalCallsMade }}</p>
            <p><strong>Total Outgoing Calls:</strong> {{ aggregateStats.totalOutgoingCalls }}</p>
            <p><strong>Total Answered Calls:</strong> {{ aggregateStats.totalAnsweredCalls }}</p>
            <p><strong>Average Response Rate:</strong> {{ averageResponseRate }}%</p>
          </v-card-text>
        </div>

        <!-- Second card -->
        <div class="stats-card">
          <v-card-subtitle></v-card-subtitle>
          <v-card-text class="text-center">
            <p><strong>Billing:</strong> {{ companyCase.billing }} mins</p>
            <p><strong>Total Meetings:</strong> {{ aggregateStats.totalMeetings }}</p>
            <p><strong>Total Call Time:</strong> {{ aggregateStats.totalCallTime }} mins</p>
            <p><strong>Total Calls Made:</strong> {{ aggregateStats.totalCallsMade }}</p>
            <p><strong>Total Outgoing Calls:</strong> {{ aggregateStats.totalOutgoingCalls }}</p>
            <p><strong>Total Answered Calls:</strong> {{ aggregateStats.totalAnsweredCalls }}</p>
            <p><strong>Average Response Rate:</strong> {{ averageResponseRate }}%</p>
          </v-card-text>
        </div>
      </div>
    </div>
      
    <!-- Filtered Agent Cards -->
    <v-card-title>Assigned Agents</v-card-title>
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
      companyCase: {
        type: Object,
        required: true,
      },
      agents: {
        type: Array,
        required: true,
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
  max-width: 50%; /* Restrict max width for balance */
  padding: 20px;
  background-color: white; /* Ensure consistent background */
}
</style>
  