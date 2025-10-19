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
            <li>
                <a
                    class="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3"
                    @click="editCase"
                >
                    Edit case
                </a>
            </li>
        </EditMenu>
      </div>
        <header>
            <h2 class="text-h6">{{ order.caseName }}</h2>
        </header>
        <div>
          <strong> Goal: €{{ order.estimatedRevenue }}</strong>
        </div>
      <div class="pt-3">
        <div class="value">
          €{{ Number(totalAgentUnitsValue || 0).toFixed(2) }}
          <span :class="['percentage', percentageClass]">{{ percentage }}%</span>
        </div>
      </div>
      <div>
       <strong>{{ order.caseUnit }}:</strong> {{ totalUnits }} / {{ order.totalQuantity }}
      </div>
      <div>
        <strong>Deadline:</strong> {{ formatDate(order.deadline) }}
      </div>
      <div>
        <strong>Callers: </strong>
        <span v-if="order.assignedCallers.length">
          {{ getCallerNames(order, agents) }}
        </span>
        <span v-else>None</span>
      </div>
    </div>
  </template>
  
  
  <script>
  import { computed } from 'vue'
  import EditMenu from '../../components/DropdownEditMenu.vue'
  import { useRouter, useRoute } from 'vue-router';

  const router = useRouter();
  const route = useRoute();
  
  // Import utilities
  import { adjustColorOpacity } from '../../utils/Utils'
  
  export default {
    name: 'DashboardCard01',
    components: {
      EditMenu,
    },
    props: {
        order: {
        type: Object,
        required: true,
        },
        agents: {
        type: Object,
        required: true,
        },
        dailyLogs: {
        type: Object,
        required: true,
        },
        monthWeeks: {
        type: Object,
        required: false,
        default: () => ([])
        },
    },
    setup(props) {
      const totalAgentUnitsValue = computed(() => {
        if (
          !props.order ||
          !props.order.assignedCallers ||
          !Array.isArray(props.dailyLogs)
        )
          return 0;

        const assignedIds = props.order.assignedCallers;
        // If we have custom weeks, base total on current month weeks; otherwise fallback to all logs
        const weeks = Array.isArray(props.monthWeeks) ? props.monthWeeks : []
        let totalUnits = 0
        if (weeks.length) {
          for (const w of weeks) {
            const start = new Date(w.start)
            const end = new Date(w.end)
            const weekUnits = props.dailyLogs
              .filter(log =>
                assignedIds.includes(log.agent._id) &&
                log.order._id === props.order._id &&
                new Date(log.date) >= start && new Date(log.date) <= end &&
                typeof log.quantityCompleted === 'number'
              )
              .reduce((sum, log) => sum + log.quantityCompleted, 0)
            totalUnits += weekUnits
          }
        } else {
          totalUnits = props.dailyLogs
            .filter(
              log =>
                assignedIds.includes(log.agent._id) &&
                log.order._id === props.order._id &&
                typeof log.quantityCompleted === 'number'
            )
            .reduce((sum, log) => sum + log.quantityCompleted, 0)
        }

        return totalUnits * (props.order.pricePerUnit || 0);
      });

      const percentage = computed(() => {
        const goal = props.order.estimatedRevenue || 0;
        if (!goal) return 0;
        if (totalAgentUnitsValue.value === 0) return 0;
        const ret_percentage = (totalAgentUnitsValue.value / goal) * 100;
        console.log('Percentage:', ret_percentage);
        return Number(ret_percentage.toFixed(1))
      });

      const percentageClass = computed(() => {
        const pct = percentage.value;
        if (pct <= 25) return 'percentage-red';
        if (pct > 25 && pct <= 50) return 'percentage-orange';
        if (pct > 50 && pct <= 75) return 'percentage-yellow';
        return 'percentage-green';
      });

      const totalUnits = computed(() => {
        if (
          !props.order ||
          !props.order.assignedCallers ||
          !Array.isArray(props.dailyLogs)
        )
          return 0;

        const assignedIds = props.order.assignedCallers;
        return props.dailyLogs
          .filter(
            log =>
              assignedIds.includes(log.agent._id) &&
              log.order._id === props.order._id &&
              typeof log.quantityCompleted === 'number'
          )
          .reduce((sum, log) => sum + log.quantityCompleted, 0);
      });

  
      return {
        totalAgentUnitsValue,
        percentage,
        percentageClass,
        totalUnits,
      }
      const agentNames = getCallerNames(order, agents); 
    },

    methods: {
        getCallerNames(order, agents) {
            const agentNames = order.assignedCallers
                .map(id => agents.find(agent => agent._id === id)?.name || 'Unknown')
                .join(', ')
            console.log('Agent Names:', agentNames);
            return agentNames
        },
        formatDate() {
            
            return new Date(this.order.deadline).toLocaleDateString();
        },
        navigateTo(value) {
            router.push({ name: value });
        },
        showCase() {
            console.log('Navigating to order details for order:', this.order._id);
            this.$router.push({
                name: 'orderDetails',
                query: { orderId: this.order._id },
            });
        },
        editCase() {
            console.log('Navigating to edit order for order:', this.order._id);
            this.$router.push({
                name: 'editOrderForm',
                params: { id: this.order._id },
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
    padding: 16px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    font-family: 'Inter', sans-serif;
    width: 210px; /* widened to fit unit count */
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
  .case-card .value .units {
    font-size: 0.75rem;
    font-weight: 500;
    color: #374151;
    margin-left: 6px;
  }
  .sep {
    margin: 0 8px;
    color: #9ca3af;
  }

  /* compact layout; metrics/progress bar removed */

  .case-card .percentage {
    display: inline-block;
    color: #151313;
    font-weight: 600;
    font-size: 0.875rem;
    padding: 2px 8px;
    border-radius: 9999px;
  }

  /* chart removed */

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