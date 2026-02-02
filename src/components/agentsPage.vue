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

      <!-- Toggle: active agents only (default) vs all agents -->
      <div class="d-flex align-center justify-center mb-4">
        <span class="mr-2 text-body-2">{{ showAllAgents ? 'Show all agents' : 'Active agents only' }}</span>
        <v-switch
          v-model="showAllAgents"
          color="primary"
          hide-details
        />
      </div>

      <!-- List of Agent Cards styled like listGcAgents.vue -->
      <v-container class="py-2" style="width: 80%;">
        <v-row dense align="stretch">
          <v-col
            v-for="(agent, index) in agentsWithStats"
            :key="index"
            cols="12"
            sm="6"
            md="4"
            lg="3"
            class="d-flex"
          >
            <v-card class="h-100 d-flex flex-column agent-card">
              <v-card-title class="text-truncate text-center">
                {{ agent.name || 'Unknown Agent' }}
              </v-card-title>
              <v-card-subtitle v-if="agent.case" class="text-truncate">
                {{ agent.case }}
              </v-card-subtitle>

              <!-- Assigned cases and total revenue -->
              <v-card-text class="pt-0 pb-1 flex-grow-1 agent-card-content">
                <div v-if="getAgentCases(agent).length" class="text-body-2">
                  <div class="font-weight-medium mb-1">Assigned cases</div>
                  <ul class="mb-2 text-caption agent-case-list">
                    <li v-for="c in getAgentCases(agent)" :key="c.caseName" class="text-truncate" :title="c.caseName">
                      {{ c.caseName }}
                    </li>
                  </ul>
                  <div class="font-weight-medium">
                    Total revenue: €{{ formatCurrency(getAgentTotalRevenue(agent)) }}
                  </div>
                </div>
                <div v-else class="text-caption text-grey">
                  No cases assigned
                </div>
              </v-card-text>

              <v-spacer />

              <v-card-actions class="justify-center">
                <v-btn size="small" color="primary" @click="viewAgent(agent)">View</v-btn>
                <v-spacer />
                <v-btn size="small" color="grey" @click="editAgent(agent)">Edit</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
</template>
  
<script>
import { mapGetters, mapMutations, mapActions } from 'vuex';
import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth } from '@/js/dateUtils';
import AgentCard from './agentCard.vue';
  
  export default {
    name: 'agentsPage',

    components: { AgentCard }, // Register the component

    data() {
      return {
        showAllAgents: false, // default: active agents only
      };
    },
    
    computed: {
      ...mapGetters(['gcAgents', 'dailyLogs', 'currentPage', 'currentDateRange', 'orders']),
      
      // Calculate combined stats from daily logs for each agent (current month only)
      agentsWithStats() {
        let agents = this.showAllAgents
          ? (this.gcAgents || [])
          : (this.gcAgents || []).filter(agent => agent.active !== false);

        // When showing all agents, put active agents first
        if (this.showAllAgents && agents.length) {
          agents = [...agents].sort((a, b) => {
            const aActive = a.active !== false ? 0 : 1;
            const bActive = b.active !== false ? 0 : 1;
            return aActive - bActive;
          });
        }

        if (!this.dailyLogs) {
          return agents;
        }

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        return agents.map(agent => {
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
            case: agentLogs.length > 0 ? agentLogs[0].caseName || 'Unknown' : ''
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
          this.fetchDailyLogs(),
          this.fetchOrders()
        ]);
        
        // Always use current month for this page (stats are for current month only)
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDay = new Date(Date.UTC(year, month, 1));
        const lastDay = new Date(Date.UTC(year, month + 1, 0));
        const format = (date) => date.toISOString().split('T')[0];
        this.updateDateRange([format(firstDay), format(lastDay)]);
        
        console.log('🔍 agentsWithStats on mount:', this.agentsWithStats);
      } catch (error) {
        console.error('Error fetching agents data:', error);
      }
    },

    methods: {
      ...mapMutations(['setCurrentPage', 'setDateRange']),
      ...mapActions(['fetchgcAgents', 'fetchDailyLogs', 'fetchOrders']),

      // True if order's startDate–deadline overlaps the current calendar month
      orderOverlapsCurrentMonth(order) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const orderStart = new Date(order?.startDate || 0);
        const orderEnd = new Date(order?.deadline || 0);
        return orderStart <= monthEnd && orderEnd >= monthStart;
      },

      // Orders where this agent is in assignedCallers and order overlaps current month only
      getAgentOrdersCurrentMonth(agent) {
        const aid = String(agent?._id ?? agent?.id ?? '');
        if (!aid) return [];
        const all = this.orders || [];
        return all.filter(
          (order) =>
            (order.assignedCallers || []).some((x) => String(x?._id ?? x?.id ?? x) === aid) &&
            this.orderOverlapsCurrentMonth(order)
        );
      },

      // Unique assigned cases for this agent in the current month (no duplicates by case name)
      getAgentCases(agent) {
        const orders = this.getAgentOrdersCurrentMonth(agent);
        const seen = new Set();
        return orders
          .filter((order) => {
            const name = order?.caseName || order?.caseId || '';
            if (!name || seen.has(name)) return false;
            seen.add(name);
            return true;
          })
          .map((order) => ({ caseName: order.caseName || order.caseId || '—' }));
      },

      // Total revenue from assigned cases in current month: sum of (agent goal × pricePerUnit) per order
      getAgentTotalRevenue(agent) {
        const aid = String(agent?._id ?? agent?.id ?? '');
        if (!aid) return 0;
        const orders = this.getAgentOrdersCurrentMonth(agent);
        return orders.reduce((sum, order) => {
          const goal = Number(order?.agentGoals?.[aid] ?? 0);
          const price = Number(order?.pricePerUnit ?? 0);
          return sum + goal * price;
        }, 0);
      },

      formatCurrency(n) {
        try {
          return new Intl.NumberFormat(undefined, { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);
        } catch {
          return n ?? 0;
        }
      },

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
      },
      viewAgent(agent) {
        // Match original AgentCard behavior
        this.$router.push({ name: 'agentDashboard', query: { agent: agent.name } })
      },
      editAgent(agent) {
        // Restore original behavior
        this.$router.push({ name: 'editAgent', query: { activeAgent: agent.name } })
      }
    },
  };

  </script>
  
  <style scoped>
  .agent-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    text-align: center;
    min-height: 360px;
    width: 100%;
    min-width: 0;
  }
  .agent-card .v-card-title,
  .agent-card .v-card-subtitle {
    justify-content: center;
    width: 100%;
  }
  .agent-card-content {
    text-align: center;
    width: 100%;
  }
  .agent-case-list {
    list-style-position: outside;
    padding-left: 1.5rem;
    margin-left: 0;
    text-align: left;
  }
  </style>
  