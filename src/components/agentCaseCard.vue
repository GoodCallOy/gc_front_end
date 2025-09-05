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
                    My goal: {{ totalUnits }}/{{ displayMyGoal }}
                </v-card-subtitle>
            </v-col>

        </v-row>
        <v-row align="center" class="mt-2">
            <v-col cols="12">
                <v-card-subtitle class="text-caption">
                    My estimated revenue: €{{ myRevenue }}
                </v-card-subtitle>
            </v-col>
        </v-row>
        <v-row align="center" class="mt-2">
          <v-col cols="12">
                <v-card-subtitle class="text-caption">
                    Case's estimated revenue: €{{ order.estimatedRevenue }}
                </v-card-subtitle>
            </v-col>
        </v-row>
        <v-row align="center" class="mt-2">
            <v-col cols="12" class="d-flex text-align-left">
                <v-card-subtitle class="text-caption">
                    case status: {{ order.orderStatus }}
                </v-card-subtitle>
            </v-col>
        </v-row>
    
      <div class="pt-5">
        <div class="value">
         €{{ totalAgentUnitsValue}}
         <span :class="['percentage', percentageClass]"> {{ percentage }}%</span>
        </div>
        
      </div>
      <div class="chart">
        <!-- Chart built with Chart.js 3 -->
        <LineChart :data="chartData" width="389" height="128" />
      </div>
        <div>
          <strong>{{ order.caseUnit }}: </strong>
          <span v-if="order.assignedCallers.length">
           {{ totalUnits }} / {{ order.totalQuantity }}
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
      const chartData = ref({
        labels: [
          '12-01-2022', '01-01-2023', '02-01-2023',
          '03-01-2023', '04-01-2023', '05-01-2023',
          '06-01-2023', '07-01-2023', '08-01-2023',
          '09-01-2023', '10-01-2023', '11-01-2023',
          '12-01-2023', '01-01-2024', '02-01-2024',
          '03-01-2024', '04-01-2024', '05-01-2024',
          '06-01-2024', '07-01-2024', '08-01-2024',
          '09-01-2024', '10-01-2024', '11-01-2024',
          '12-01-2024', '01-01-2025',
        ],
        datasets: [
          // Indigo line
          {
            data: [
              732, 610, 610, 504, 504, 504, 349,
              349, 504, 342, 504, 610, 391, 192,
              154, 273, 191, 191, 126, 263, 349,
              252, 423, 622, 470, 532,
            ],
            fill: true,
            backgroundColor: function(context) {
              const chart = context.chart;
              const {ctx, chartArea} = chart;
              return chartAreaGradient(ctx, chartArea, [
                { stop: 0, color: adjustColorOpacity('#8b5cf6', 0) },
                { stop: 1, color: adjustColorOpacity('#8b5cf6', 0.2) }
              ]);
            },
           borderColor: '#8b5cf6',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 3,
            pointBackgroundColor: '#8b5cf6',
            pointHoverBackgroundColor: '#8b5cf6',
            pointBorderWidth: 0,
            pointHoverBorderWidth: 0,          
            clip: 20,
            tension: 0.2,
          },
          // Gray line
          {
            data: [
              532, 532, 532, 404, 404, 314, 314,
              314, 314, 314, 234, 314, 234, 234,
              314, 314, 314, 388, 314, 202, 202,
              202, 202, 314, 720, 642,
            ],
            borderColor: adjustColorOpacity('#8b5cf6', 0.25),
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 3,
            pointBackgroundColor: adjustColorOpacity('#8b5cf6', 0.25),
            pointHoverBackgroundColor: adjustColorOpacity('#8b5cf6', 0.25),
            pointBorderWidth: 0,
            pointHoverBorderWidth: 0,               
            clip: 20,
            tension: 0.2,
          },
        ],
      })

      const percentage = computed(() => {
        if (totalAgentUnitsValue.value === 0) return 0;
        const ret_percentage = (totalAgentUnitsValue.value / myRevenue.value) * 100;

        return Number(ret_percentage.toFixed(1))
      });

      const percentageClass = computed(() => {
        const pct = percentage.value;
        if (pct <= 25) return 'percentage-red';
        if (pct > 25 && pct <= 50) return 'percentage-orange';
        if (pct > 50 && pct <= 75) return 'percentage-yellow';
        return 'percentage-green';
      });

      const myAgentId = computed(() =>
        String(props.currentUser?.linkedUserId ?? props.currentUser?.id ?? '')
      )
      const orderId = computed(() => String(props.order?._id ?? ''))

      // all logs that belong to the current agent (reactive)
      const agentLogs = computed(() => {
        const myId = myAgentId.value
        if (!myId) return []
        const logs = Array.isArray(props.dailyLogs) ? props.dailyLogs : []
        return logs.filter(l => String(l?.agent?._id ?? l?.agent ?? '') === myId)
      })
      console.log('agentLogs', agentLogs.value)

      // only this order’s logs for the current agent
      const myAgentOrderLogs = computed(() =>
        agentLogs.value.filter(
          l => String(l?.order?._id ?? l?.order ?? '') === orderId.value
        )
      )

      // your goal from order.agentGoals
      const myGoal = computed(() => {
        const map = props.order?.agentGoals ?? {}
        const id = myAgentId.value
        return id ? Number(map[id] ?? 0) : 0
      })

      const euro = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' })
      const displayMyGoal = computed(() => (myAgentId.value ? `${myGoal.value}` : 'N/A'))

      // ✅ make this computed so it updates when myGoal or price changes
      const myRevenue = computed(() =>
        myGoal.value * (Number(props.order?.pricePerUnit) || 0)
      )

      // revenue completed for this agent on this order (from daily logs)
      const totalAgentUnitsValue = computed(() => {
        console.log('Calculating totalAgentUnitsValue...', agentLogs.value)
        const units = agentLogs.value.reduce(
          (sum, l) => sum + (Number(l.quantityCompleted) || 0),
          0
        )
        return units * (Number(props.order?.pricePerUnit) || 0)
      })

      // total units across all assigned (fix id normalization)
      const totalUnits = computed(() =>
        (agentLogs.value || []).reduce(
          (sum, log) => sum + (Number(log?.quantityCompleted) || 0),
          0
        )
      )

      // helpful: see when things actually populate (runs on every change)
      watchEffect(() => {
        console.log('agentLogs count:', agentLogs.value.length)
        console.log('agent logs for this order:', agentLogs.value )
        console.log('myAgentOrderLogs count:', myAgentOrderLogs.value.length)
        console.log('totalAgentUnitsValue:', totalAgentUnitsValue.value)
        const units = myAgentOrderLogs.value.reduce((s,l)=>s+(Number(l?.quantityCompleted)||0),0)
        console.log('myAgentOrderLogs total units:', units)
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
    width: 320px; /* optional, for consistent sizing */
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