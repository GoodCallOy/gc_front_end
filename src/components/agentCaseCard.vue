  <template>
    <div class="case-card" elevation="16">
      <div class="menu">
        <EditMenu align="right" class="relative inline-flex">
            <li>
                <a
                    class="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3"
                    @click="showCase"
                >
                    Show order
                </a>
            </li>
        </EditMenu>
      </div>
        <header>
            <h2 class="text-h6">{{ order.caseName }}</h2>
        </header>
        <v-row align="center" class="mt-2">
            <v-col cols="12">
                <v-card-subtitle class="text-caption">
                    My goal: {{ myAgentUnits }}/{{ displayMyGoal }}
                </v-card-subtitle>
            </v-col>

        </v-row>
        <v-row align="center" class="mt-2">
            <v-col cols="12">
                <v-card-subtitle class="text-caption">
                    My revenue goal: €{{ myRevenue }}
                </v-card-subtitle>
            </v-col>
        </v-row>
    
      <div class="pt-5">
        My current revenue:
        <div class="value"> 
         €{{ totalAgentUnitsValue || 0 }}
         <span :class="['percentage', percentageClass]"> {{ percentage || 0 }}%</span>
        </div>
        
      </div>
      <div class="chart" style="height: 128px; overflow: hidden;">
        <!-- Chart built with Chart.js 3 -->
        <LineChart :data="chartData" width="100%" height="128" />
      </div>
        <div>
          <strong>{{ order.caseUnit }}: </strong>
          <span v-if="order.assignedCallers.length">
           {{ myAgentUnits }} / {{ totalProjectGoal }}
          </span>
          <span v-else>None</span>
        </div>
        <div>
          <strong>Callers: </strong>
          <span v-if="order.assignedCallers.length">
            {{ getCallerNames(order, agents) }}
          </span>
          <span v-else>None</span>
        </div>
        <div><strong>Deadline:</strong> {{ formatDate(order.deadline) }}</div>
    </div>
  </template>
  
  
  <script>
  import { ref, computed, watchEffect } from 'vue'
  import { chartAreaGradient } from '../charts/ChartjsConfig'
  import LineChart from '../charts/LineChart01.vue'
  import EditMenu from '../components/DropdownEditMenu.vue'
  
  
  // Import utilities
  import { adjustColorOpacity } from '../utils/Utils'
  
  export default {
    name: 'agentCaseCard',
    components: {
      LineChart,
      EditMenu,
    },
    props: {
      order: { type: Object, required: true },
      agents: { type: Array, default: () => [] },
      dailyLogs: { type: Array, default: () => [] },
      currentUser: { type: Object, required: true },
    },
    setup(props) {
      // Debug props
      console.log('AgentCaseCard Props:', {
        order: props.order,
        agents: props.agents?.length,
        dailyLogs: props.dailyLogs?.length,
        currentUser: props.currentUser
      });

      // Daily progress chart data
      const chartData = computed(() => {
        console.log('Chart Debug - Props:', {
          dailyLogs: props.dailyLogs,
          orderId: orderId.value,
          orderCaseName: props.order?.caseName,
          totalLogs: props.dailyLogs?.length || 0,
          sampleLog: props.dailyLogs?.[0]
        })

        // Get all logs for this case from all agents
        const allLogs = (props.dailyLogs || []).filter(log => {
          const logOrderId = log?.order?._id ?? log?.order ?? log?.orderId ?? ''
          const logCaseName = log?.caseName ?? ''
          const matchesOrderId = String(logOrderId) === orderId.value
          const matchesCaseName = logCaseName === props.order?.caseName
          console.log('Log filtering:', {
            logOrderId,
            logCaseName,
            matchesOrderId,
            matchesCaseName,
            orderId: orderId.value,
            caseName: props.order?.caseName
          })
          return matchesOrderId || matchesCaseName
        })

        console.log('Chart data - All logs for case:', allLogs)

        // If no real data, show empty state
        if (allLogs.length === 0) {
          console.log('No data found, showing empty state')
          return {
            labels: ['No Data'],
            datasets: [
              {
                label: 'No Data',
                data: [0],
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.2,
              }
            ]
          }
        }

        // Sort logs by date
        const sortedLogs = [...allLogs].sort((a, b) => new Date(a.date) - new Date(b.date))
        
        // Create chart data from daily log entries
        const dailyData = []
        const labels = []
        
        console.log('Processing logs for chart:', sortedLogs)
        
        sortedLogs.forEach((log, index) => {
          // Use the exact same logic as the tables: log.quantityCompleted || 0
          const completedAmount = log.quantityCompleted || 0
          dailyData.push(completedAmount)
          
          // Format date for display
          const logDate = new Date(log.date)
          const dateLabel = logDate.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit' 
          })
          labels.push(dateLabel)
          
          console.log(`Log ${index + 1}:`, {
            date: log.date,
            formattedDate: dateLabel,
            quantityCompleted: completedAmount,
            rawQuantityCompleted: log.quantityCompleted
          })
        })

        // Calculate average daily performance
        const averageDaily = dailyData.length > 0 
          ? dailyData.reduce((sum, val) => sum + val, 0) / dailyData.length 
          : 0

        console.log('Final chart data:', {
          labels,
          dailyData,
          averageDaily,
          hasData: dailyData.length > 0,
          dataSum: dailyData.reduce((sum, val) => sum + val, 0)
        })

        const chartConfig = {
          labels,
          datasets: [
            {
              label: 'Units Completed',
              data: dailyData,
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              borderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: '#8b5cf6',
              pointHoverBackgroundColor: '#8b5cf6',
              fill: true,
              tension: 0.2,
            }
          ]
        }

        console.log('Chart config being passed to LineChart:', chartConfig)
        return chartConfig
      })

      const percentage = computed(() => {
        if (myGoal.value === 0) return 0;
        // Use current agent's progress, not total case progress
        const ret_percentage = (myAgentUnits.value / myGoal.value) * 100;

        return Number(ret_percentage.toFixed(1))
      });

      const percentageClass = computed(() => {
        const pct = percentage.value;
        if (pct <= 25) return 'percentage-red';
        if (pct > 25 && pct <= 50) return 'percentage-orange';
        if (pct > 50 && pct <= 75) return 'percentage-yellow';
        return 'percentage-green';
      });

      const myAgentId = computed(() => {
        // If currentUser is the selected agent (from agentDashboard), use its ID
        if (props.currentUser?._id) {
          return String(props.currentUser._id);
        }
        // Otherwise, use linkedUserId (for regular user dashboard)
        return String(props.currentUser?.linkedUserId ?? props.currentUser?.id ?? '');
      });
      const orderId = computed(() => String(props.order?._id ?? ''))

      // all logs that belong to the current agent (reactive)
      const agentLogs = computed(() => {
        const myId = myAgentId.value
        if (!myId) return []
        const logs = Array.isArray(props.dailyLogs) ? props.dailyLogs : []
        const filtered = logs.filter(l => {
          // Handle different data structures for agent ID
          const logAgentId = l?.agent?._id ?? l?.agent ?? l?.agentId ?? ''
          return String(logAgentId) === myId
        })
        console.log('Agent logs filtering:', {
          myId,
          totalLogs: logs.length,
          filteredLogs: filtered.length,
          sampleLog: logs[0]
        })
        return filtered
      })

      // only this order’s logs for the current agent
      const myAgentOrderLogs = computed(() =>
        agentLogs.value.filter(
          l => String(l?.order?._id ?? l?.order ?? '') === orderId.value
        )
      )

      // agent's specific goal for this case (from agentGoals)
      const myGoal = computed(() => {
        const agentId = myAgentId.value;
        if (!agentId || !props.order?.agentGoals) {
          return 0;
        }
        
        // Get the agent's specific goal for this case
        const agentGoal = props.order.agentGoals[agentId];
        console.log('Agent goal lookup:', {
          agentId,
          agentGoals: props.order.agentGoals,
          agentGoal
        });
        
        return Number(agentGoal ?? 0);
      });

      // Total project goal (for reference)
      const totalProjectGoal = computed(() => {
        return Number(props.order?.totalQuantity ?? 0);
      });

      const euro = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' })
      const displayMyGoal = computed(() => (myAgentId.value ? `${myGoal.value}` : 'N/A'))

      // ✅ make this computed so it updates when myGoal or price changes
      const myRevenue = computed(() =>
        myGoal.value * (Number(props.order?.pricePerUnit) || 0)
      )

      // current agent's units completed for this order
      const myAgentUnits = computed(() => {
        return myAgentOrderLogs.value.reduce(
          (sum, l) => sum + (Number(l.quantityCompleted) || 0),
          0
        )
      })

      // revenue completed for this agent on this order (from daily logs)
      const totalAgentUnitsValue = computed(() => {
        return myAgentUnits.value * (Number(props.order?.pricePerUnit) || 0)
      })

      // total units for this specific case from all agents
      const totalUnits = computed(() => {
        // Get all logs for this case (not just current agent)
        const allCaseLogs = (props.dailyLogs || []).filter(
          l => {
            // Handle different data structures for order/case matching
            const logOrderId = l?.order?._id ?? l?.order ?? l?.orderId ?? ''
            const logCaseName = l?.caseName ?? ''
            return String(logOrderId) === orderId.value || logCaseName === props.order?.caseName
          }
        )
        return allCaseLogs.reduce(
          (sum, log) => sum + (Number(log?.quantityCompleted) || 0),
          0
        )
      })

      // helpful: see when things actually populate (runs on every change)
      watchEffect(() => {
        console.log('Agent Case Card Debug:', {
          myAgentId: myAgentId.value,
          orderId: orderId.value,
          agentLogs: agentLogs.value.length,
          myAgentOrderLogs: myAgentOrderLogs.value.length,
          myAgentUnits: myAgentUnits.value,
          totalUnits: totalUnits.value,
          totalProjectGoal: totalProjectGoal.value,
          totalAgentUnitsValue: totalAgentUnitsValue.value,
          percentage: percentage.value,
          myGoal: myGoal.value
        })
      })

      return {
        chartData,
        percentage,
        percentageClass,
        myAgentId,
        myGoal,
        displayMyGoal,
        myRevenue,              // <-- return so template can use it
        totalAgentUnitsValue,
        totalUnits,
        myAgentUnits,            // <-- return for template use
        totalProjectGoal,        // <-- return for template use
      }

      const agentNames = getCallerNames(order, agents); 
    },

    methods: {
        getCallerNames(order, agents) {
            const agentNames = order.assignedCallers
                .map(id => agents.find(agent => agent._id === id)?.name || 'Unknown')
                .join(', ')
           
            return agentNames
        },
        formatDate() {
            
            return new Date(this.order.deadline).toLocaleDateString();
        },
        navigateTo(value) {
            router.push({ name: value });
        },
        showCase() {
            console.log('Navigating to agent case details for order:', this.order._id);
            this.$router.push({
                name: 'agentCaseDetails',
                query: { orderId: this.order._id },
            });
        }
    },
}
</script>
<style scoped>
  .case-card {
    position: relative;
    background-color: #eeeff1;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    font-family: 'Inter', sans-serif;
    width: 100%; /* Fill the grid container */
    min-height: 300px; /* Ensure consistent height */
  }

  .case-card .menu {
    position: absolute;
    top: 16px;
    right: 16px;
    color: #9ca3af;
    font-size: 20px;
    cursor: pointer;
  }

  .case-card h2 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: #111827;
  }

  .case-card .label {
    text-transform: uppercase;
    font-size: 0.75rem;
    font-weight: 500;
    color: #9ca3af;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }

  .case-card .value {
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .case-card .percentage {
    display: inline-block;
    color: #151313;
    font-weight: 600;
    font-size: 0.875rem;
    padding: 2px 8px;
    border-radius: 9999px;
  }

  .case-card .chart {
    margin-top: 16px;
  }

  .percentage-red {
    background-color: #f35555;
  }
  .percentage-orange {
    background-color: #e8b731;
  }
  .percentage-yellow {
    background-color: #eaea08;  }
  .percentage-green {
    background-color: #10b981;
  }
</style>