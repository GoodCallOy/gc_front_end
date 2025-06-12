<template>
  <v-card
    :class="['mx-2 my-2', { 'full-width-card': currentPage === 'singleCase' }]"
    :style="cardStyles"
    :elevation="currentPage === 'singleCase' ? 0 : 16"
  >
    <!-- Centered Case Information -->
    <div v-if="currentPage === 'DashBoard' || currentPage === 'casePage'" class="text-center">
      <v-card-title class="text-h5">{{ companyCase.name }}</v-card-title>
      
      <!-- Statistics -->
      <div class="d-flex stats-container">
        <div class="stats-card">
          <v-card-text class="text-center">
            <p><strong>Total Billing:</strong> {{ companyCase.billing }}</p>
            <p><strong>Total Meetings:</strong> {{ aggregatedStats.meetings }}</p>
            <p><strong>Dials / Meeting:</strong> {{ dialsMeeting }}</p>
            <p><strong>Hour/Meeting:</strong> {{ hourMeeting }}</p>
            <p><strong>Answered/Meeting:</strong> {{ callsMeetings }}</p>
            <p><strong>Revenue:</strong> {{ revenue }}</p>
          </v-card-text>
        </div>
      </div>
    </div>

    <div v-if="currentPage === 'DashBoard' || currentPage === 'casePage'" class="d-flex justify-center">
      <v-btn color="primary" class="mb-5" @click="showCase">
        Show Case
      </v-btn>
    </div>   

    <div class="d-flex flex-column ml-5">
      <v-card-subtitle>
        <strong>Assigned Manager:</strong>
      </v-card-subtitle>
      <v-card-subtitle>
        <strong>Assigned Agents: {{ agentsNameInCase }}</strong>
      </v-card-subtitle>
    </div>

    <div class="d-flex flex-wrap justify-center mt-5">
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
import AgentCard from '../agentCard.vue';
import { getAgentsInCase, groupAgentsStatsByMonth, getAggregatedStats } from '../../js/statsUtils';

import { mapState } from 'vuex';

export default {
  name: 'CaseCard',
  props: {
    companyCase: {
      type: Object,
      required: true,
    },
    dateRange: {
      type: Array,
      required: true,
    },
  },
  components: {
    AgentCard,
  },
   data() {
      const currentDate = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(currentDate.getDate() - 7);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      return {
        selectedDateRange: [sevenDaysAgo, currentDate],
        monthStart: startOfMonth, // Start of the current month
        monthEnd: endOfMonth,  
      };
    },
  computed: {
    ...mapState(['cases', 'agents', 'agentStats', 'currentPage']),

    agentsInCase() {
      return getAgentsInCase(this.companyCase.name, this.agentStats);
    },

    agentsNameInCase() {
      return this.AgentsStatsByMonth.map(agent => agent.name).join(', ');
    },

    agentsStatsByMonth() {
      return groupAgentsStatsByMonth(this.agentsInCase);
    },

     AgentsStatsByMonth() {
  
      if (!this.agentsStatsByMonth || Object.keys(this.agentsStatsByMonth).length === 0) {
      return [];
    }

      const [startDate] = this.dateRange.map(date => new Date(date));
      const monthKey = `${new Date(startDate).getFullYear()}-${String(new Date(startDate).getMonth() + 1).padStart(2, '0')}`;    
      return this.agentsStatsByMonth[monthKey] || [];
     
    },

    aggregatedStats() {
      const aggStats = getAggregatedStats(this.dateRange, this.AgentsStatsByMonth);
      return aggStats;
    },

    hourMeeting() {
      const meetings = +this.aggregatedStats.meetings || 0;    
      const callTime = +this.aggregatedStats.call_time || 0;  
      return meetings > 0 ? Number(((callTime/ meetings)).toFixed(2)) : 0;
    },
    dialsMeeting() {
      const outgoing = +this.aggregatedStats.outgoing_calls || 0;
      const meetings = +this.aggregatedStats.meetings || 0;
      return meetings > 0 ? Number((outgoing / meetings).toFixed(2)) : 0;
    },
    callsMeetings() {
      const meetings = +this.aggregatedStats.meetings || 0;
      const answeredCalls = +this.aggregatedStats.answered_calls || 0;
      return answeredCalls > 0 ? Number(((meetings /answeredCalls ) * 100).toFixed(2)) : 0;
    },
    revenue() {
      const meetings = +this.aggregatedStats.meetings || 0;
      const revenue = +this.companyCase.billing || 0;
      return revenue > 0 ? Number(((meetings * revenue )).toFixed(2)) : 0;
    },

    cardStyles() {
      return this.currentPage === 'singleCase'
        ? { width: '100%', margin: '0' }
        : { width: 'auto', maxWidth: '400px', padding: '20px' };
    },

    filteredAgents() {
      const [startDate, endDate] = this.dateRange;

      if (!startDate || !endDate) {
        console.error('Invalid date range for filtering agents:', this.dateRange);
        return [];
      }

      const filterAgent = this.agents.filter(agent => {
        const activityDate = new Date(agent.lastActivityDate).getTime();
        return (
          agent.case === this.companyCase.name &&
          activityDate >= new Date(startDate).getTime() &&
          activityDate <= new Date(endDate).getTime()
        );
      });
      return filterAgent
    },
  },
  mounted() {
    console.log('CaseCard mounted with companyCase:', this.companyCase);
},
  watch: {
   
    
  },

  methods: {
    showCase() {
      this.$router.push({
        name: 'singleCase',
        query: { case: this.companyCase.name },
      });
    },
  },
}

</script>

<style scoped>
.d-flex.flex-wrap {
  gap: 16px;
}

.text-center {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
}

.stats-card {
  flex: 1;
  min-width: 250px;
  max-width: 400px;
  background-color: white;
  padding: 20px;
}

.full-width-card {
  width: 100%;
  margin: 0;
  padding: 20px;
}
</style>