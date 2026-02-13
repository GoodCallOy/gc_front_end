  <template>
    <div class="case-card" elevation="16">
      <div class="menu">
        <EditMenu align="right" class="relative inline-flex">
            <li>
                <a
                    class="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3"
                    @click="showCase"
                >
                    {{ t('agentCaseCard.showOrder') }}
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
                    {{ t('agentCaseCard.myGoal') }}: {{ myAgentUnits }}/{{ displayMyGoal }}
                </v-card-subtitle>
            </v-col>

        </v-row>
        <v-row align="center" class="mt-2">
            <v-col cols="12">
                <v-card-subtitle class="text-caption">
                    {{ t('agentCaseCard.myRevenueGoal') }}: €{{ myRevenue }}
                </v-card-subtitle>
            </v-col>
        </v-row>
    
      <div class="pt-5">
        {{ t('agentCaseCard.myCurrentRevenue') }}:
        <div class="value"> 
         €{{ totalAgentUnitsValue || 0 }}
         <span :class="['percentage', percentageClass]"> {{ percentage || 0 }}%</span>
        </div>
        
      </div>
        <div>
          <strong>{{ translateCaseUnit(order.caseUnit) }}: </strong>
          <span v-if="order.assignedCallers.length">
           {{ myAgentUnits }} / {{ totalProjectGoal }}
          </span>
          <span v-else>{{ t('agentCaseCard.none') }}</span>
        </div>
        <div>
          <strong>{{ t('agentCaseCard.callers') }}: </strong>
          <span v-if="order.assignedCallers.length">
            {{ getCallerNames(order, agents) }}
          </span>
          <span v-else>{{ t('agentCaseCard.none') }}</span>
        </div>
        <div><strong>{{ t('agentCaseCard.deadline') }}:</strong> {{ formatDate(order.deadline) }}</div>
    </div>
  </template>
  
  
  <script>
  import { ref, computed, watchEffect } from 'vue'
  import { useStore } from 'vuex'
  import { useI18n } from 'vue-i18n'
  import EditMenu from '../components/DropdownEditMenu.vue'
  
  
  // Import utilities
  import { adjustColorOpacity } from '../utils/Utils'
  
  export default {
    name: 'agentCaseCard',
    components: {
      EditMenu,
    },
    props: {
      order: { type: Object, required: true },
      agents: { type: Array, default: () => [] },
      dailyLogs: { type: Array, default: () => [] },
      currentUser: { type: Object, required: true },
    },
    setup(props) {
      const store = useStore()
      const { t } = useI18n()

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

      // current month/date range from store (shared with dashboards)
      const currentDateRange = computed(() => store.getters['currentDateRange'])

      const monthBounds = computed(() => {
        const range = currentDateRange.value
        if (!Array.isArray(range) || range.length < 2) return null
        const [start, end] = range
        const from = new Date(start)
        const to = new Date(end)
        to.setHours(23, 59, 59, 999)
        return { from, to }
      })

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
        
        return filtered
      })

      // only this order’s logs for the current agent
      const myAgentOrderLogs = computed(() => {
        const bounds = monthBounds.value
        const preliminary = agentLogs.value.filter(l => {
          const rawOrderId = l?.order?._id ?? l?.order ?? l?.orderId
          const sameOrder = String(rawOrderId) === orderId.value
          if (!sameOrder) return false
          if (!bounds) return true
          const d = new Date(l?.date)
          return d >= bounds.from && d <= bounds.to
        })

        // De‑duplicate logs by _id (or by date+order+agent as a fallback)
        const uniqueMap = new Map()
        for (const l of preliminary) {
          const rawOrderId = l?.order?._id ?? l?.order ?? l?.orderId
          const rawAgentId = l?.agent?._id ?? l?.agent ?? l?.agentId
          const key = String(l?._id ?? `${l?.date}|${rawOrderId}|${rawAgentId}`)
          if (!uniqueMap.has(key)) uniqueMap.set(key, l)
        }
        return Array.from(uniqueMap.values())
      })

      // agent's specific goal for this case (from agentGoals)
      const myGoal = computed(() => {
        const agentId = myAgentId.value;
        if (!agentId || !props.order?.agentGoals) {
          return 0;
        }
        
        // Get the agent's specific goal for this case
        const agentGoal = props.order.agentGoals[agentId];
        
        
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
        const total = myAgentOrderLogs.value.reduce(
          (sum, l) => sum + (Number(l.quantityCompleted) || 0),
          0
        )
        return total
      })

      // revenue completed for this agent on this order (from daily logs, using agent rate only)
      const totalAgentUnitsValue = computed(() => {
        const rawAgentRates = props.order?.agentRates || props.order?.agentPrices || {}
        const rateFromOrder = Number(rawAgentRates[myAgentId.value]) || 0

        const value = myAgentUnits.value * rateFromOrder
        console.log('Total agent units value (agent rate):', value)
        return value
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
      })

      // Function to translate caseUnit values
      const translateCaseUnit = (caseUnit) => {
        if (!caseUnit) return '';
        const unit = String(caseUnit).toLowerCase();
        if (unit === 'meetings') return t('agentCaseCard.meetings');
        if (unit === 'hours') return t('agentCaseCard.hours');
        if (unit === 'interviews') return t('agentCaseCard.interviews');
        return caseUnit; // Return original if no translation found
      }

      return {
        t,
        translateCaseUnit,
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
    padding: 16px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    font-family: 'Inter', sans-serif;
    width: 100%;
    min-width: 0; /* Allow shrinking in grid to prevent overflow */
    min-height: 250px;
    box-sizing: border-box;
    overflow: visible;
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
    word-wrap: break-word;
    overflow-wrap: break-word;
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

  /* Ensure bottom content wraps and doesn't get cut off */
  .case-card > div {
    min-width: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .case-card .value {
    flex-wrap: wrap;
    word-break: break-word;
  }

  /* Mobile and narrow screen optimizations (e.g. Lenovo Yoga) */
  @media (max-width: 600px) {
    .case-card {
      width: 100% !important;
      max-width: none !important;
      margin: 8px 0 !important;
      padding: 12px !important;
    }
  }

  /* Prevent horizontal cut-off on narrow cards (1400px and below) */
  @media (max-width: 1400px) {
    .case-card {
      min-width: 0;
      padding: 14px;
    }
  }
</style>