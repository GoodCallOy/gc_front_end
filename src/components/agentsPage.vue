<template>
    <div class="d-flex flex-column align-center" style="height: 100vh;">
      <!-- Date Navigation Header -->
      <v-card elevation="1" class="mb-4" style="width: 80%;">
        <div class="d-flex align-center justify-center pa-4">
          <v-btn icon flat class="pa-0 ma-0" @click="getPreviousMonth">
            <v-icon>mdi-chevron-left</v-icon>
          </v-btn>
          <div class="text-h6 font-weight-medium mx-3">{{ getFormattedDateRange() }}</div>
          <v-btn icon flat @click="getNextMonth">
            <v-icon>mdi-chevron-right</v-icon>
          </v-btn>
        </div>
      </v-card>

      <h1 class="mb-3 mt-5">Agents Stats - {{ getFormattedDateRange() }}</h1>
  
      <!-- List of Agent Cards -->
      <div class="d-flex flex-wrap justify-center">   
        <AgentCard
        v-for="(agent, index) in agentsWithStats"
        :key="index"
        :agent="agent"
      />
      </div>
    </div>
</template>
  
<script>
import { mapGetters, mapMutations, mapActions } from 'vuex';
import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth } from '@/js/dateUtils';
import AgentCard from './agentCard.vue';
  
  export default {
    name: 'agentsPage',

    components: { AgentCard }, // Register the component
    
    computed: {
      ...mapGetters(['gcAgents', 'dailyLogs', 'currentPage', 'currentDateRange']),
      
      // Calculate combined stats from daily logs for each agent
      agentsWithStats() {
        if (!this.gcAgents || !this.dailyLogs || !this.currentDateRange) {
          return this.gcAgents || [];
        }

        const [startDate, endDate] = this.currentDateRange;
        const monthStart = new Date(startDate);
        const monthEnd = new Date(endDate);

        return this.gcAgents.map(agent => {
          // Filter daily logs for this agent within the selected month
          const agentLogs = this.dailyLogs.filter(log => {
            const logAgentId = String(log?.agent?._id ?? log?.agent ?? '');
            const agentId = String(agent._id ?? agent.id);
            
            if (logAgentId !== agentId) return false;
            
            const logDate = new Date(log.date);
            if (isNaN(logDate.getTime())) return false;
            
            return logDate >= monthStart && logDate <= monthEnd;
          });

          // Calculate combined stats
          const totalCallTime = agentLogs.reduce((sum, log) => sum + (log.call_time || 0), 0);
          const totalOutgoingCalls = agentLogs.reduce((sum, log) => sum + (log.outgoing_calls || 0), 0);
          const totalAnsweredCalls = agentLogs.reduce((sum, log) => sum + (log.answered_calls || 0), 0);
          const totalCompletedCalls = agentLogs.reduce((sum, log) => sum + (log.completed_calls || 0), 0);
          const totalQuantityCompleted = agentLogs.reduce((sum, log) => sum + (log.quantityCompleted || 0), 0);
          const responseRate = totalOutgoingCalls > 0 ? (totalAnsweredCalls / totalOutgoingCalls) * 100 : 0;

          return {
            ...agent,
            // Combined stats from daily logs
            call_time: totalCallTime.toFixed(2),
            outgoing_calls: totalOutgoingCalls,
            answered_calls: totalAnsweredCalls,
            completed_calls: totalCompletedCalls,
            quantityCompleted: totalQuantityCompleted,
            response_rate: responseRate.toFixed(1),
            meetings: agentLogs.length, // Number of daily log entries (meetings)
            case: agentLogs.length > 0 ? agentLogs[0].caseName || 'Unknown' : 'No activity'
          };
        });
      }
  },

    async mounted() {
      this.updatePage('agentPage');
      
      // Fetch the required data for agents page
      try {
        await Promise.all([
          this.fetchgcAgents(),
          this.fetchDailyLogs()
        ]);
        
        // Initialize date range if not set
        if (!this.currentDateRange || this.currentDateRange.length < 2) {
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth();
          const firstDay = new Date(Date.UTC(year, month, 1));
          const lastDay = new Date(Date.UTC(year, month + 1, 0));
          const format = (date) => date.toISOString().split('T')[0];
          const newRange = [format(firstDay), format(lastDay)];
          this.updateDateRange(newRange);
        }
        
        console.log('🔍 agentsWithStats on mount:', this.agentsWithStats);
      } catch (error) {
        console.error('Error fetching agents data:', error);
      }
    },

    methods: {
      ...mapMutations(['setCurrentPage', 'setDateRange']),
      ...mapActions(['fetchgcAgents', 'fetchDailyLogs']),

      updatePage(newPage) {
        this.setCurrentPage(newPage);
      },

      // Date navigation functions
      getFormattedDateRange() {
        return formattedDateRange(this.currentDateRange);
      },

      getIsCurrentMonth() {
        return isCurrentMonth(this.currentDateRange);
      },

      getPreviousMonth() {
        const prevMonth = goToPreviousMonth(this.currentDateRange);
        this.updateDateRange(prevMonth);
      },

      getNextMonth() {
        const nextMonth = goToNextMonth(this.currentDateRange);
        this.updateDateRange(nextMonth);
      },

      updateDateRange(newRange) {
        this.setDateRange(newRange);
      },

      printDebug() {
       console.log('Debugging info:', this.agentsWithStats);
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
  