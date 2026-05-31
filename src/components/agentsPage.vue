<template>
    <v-container fluid class="agents-page-root">
      <DateHeader
        :currentDateRange="currentDateRange"
        :showMonthOnly="true"
        @prev="getPreviousMonth"
        @next="getNextMonth"
      />

      <h1 class="text-h4 text-center mb-3">Agents Stats - {{ getFormattedDateRange() }}</h1>

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
      <v-container class="py-2 agents-page-container" style="width: 90%; max-width: 100%;">
        <v-row dense align="stretch">
          <v-col
            v-for="agent in agentsWithStats"
            :key="`${agent._id || agent.id || agent.name}-${currentDateRange?.[0] || ''}`"
            cols="12"
            sm="6"
            md="4"
            lg="3"
            class="d-flex"
            style="min-width: 0;"
          >
            <v-card class="h-100 d-flex flex-column agent-card">
              <v-card-title class="text-truncate text-center">
                {{ agent.name || 'Unknown Agent' }}
              </v-card-title>

              <v-card-text class="pt-0 pb-1 flex-grow-1 agent-card-content">
                <div class="agent-card-sections">
                  <v-card class="section-card" elevation="2" rounded="lg">
                    <v-card-text class="section-card-inner pa-2 px-3">
                      <div class="section-card-title text-medium-emphasis font-weight-medium mb-2">
                        Assigned cases
                      </div>
                      <ul
                        v-if="agent.agentCases && agent.agentCases.length"
                        class="mb-0 text-caption agent-case-list"
                      >
                        <li
                          v-for="c in agent.agentCases"
                          :key="c.orderKey"
                          class="mb-2"
                          :title="c.tooltip"
                        >
                          <div
                            v-if="c.hasNickname"
                            class="text-truncate text-left"
                            :title="c.fullCaseName"
                          >
                            <span class="text-decoration-dotted text-high-emphasis">{{ c.displayName }}</span>
                            — {{ formatStatNumber(c.completed) }}/{{ formatStatNumber(c.goal) }}
                          </div>
                          <div v-else class="text-truncate text-left">
                            {{ c.displayName }} — {{ formatStatNumber(c.completed) }}/{{ formatStatNumber(c.goal) }}
                          </div>
                          <div class="case-progress-linear-wrap mt-1">
                            <v-progress-linear
                              :model-value="c.progressPercent"
                              :color="c.progressColor"
                              height="10"
                              rounded="sm"
                              striped
                            />
                            <div class="case-progress-linear-wrap__label d-flex align-center justify-center">
                              <small
                                :class="c.progressLabelClass"
                                class="font-weight-bold"
                              >{{ c.progressPercentRounded }}%</small>
                            </div>
                          </div>
                        </li>
                      </ul>
                      <div v-else class="section-card-subtitle text-medium-emphasis">
                        No cases assigned
                      </div>
                    </v-card-text>
                  </v-card>

                  <AgentPersonalRevenueStatsStack
                    v-if="agent.revenueKpi && agent.revenueKpi.goal > 0"
                    :monthly-goal-euros="agent.revenueKpi.goal"
                    :results-now-euros="agent.revenueKpi.current"
                  />
                </div>
              </v-card-text>

              <v-spacer />

              <v-card-actions class="justify-center flex-wrap pa-2" style="gap: 8px;">
                <!-- Role chip -->
                <v-chip
                  size="small"
                  :color="agent.active !== false ? 'success' : 'grey'"
                >
                  {{ agent.role || 'caller' }}
                </v-chip>

                <!-- Linked status chip -->
                <v-chip
                  size="small"
                  :color="agent.linkedUserId ? 'success' : 'grey'"
                >
                  {{ agent.linkedUserId ? 'Linked' : 'Unlinked' }}
                </v-chip>

                <v-spacer />

                <v-btn size="small" color="grey" @click="editGCAgent(agent)">Edit</v-btn>
                <v-btn size="small" color="primary" @click="viewAgent(agent)">View</v-btn>

              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-container>
</template>

<style scoped>
.agent-case-list {
  list-style: none;
  padding-left: 0;
  margin: 0;
}
</style>
  
<script>
import { mapGetters, mapMutations, mapActions } from 'vuex';
import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth } from '@/js/dateUtils';
import { formatStatNumber } from '@/js/formatNumbers';
import { getPercentageToGoalVuetifyColor } from '@/js/percentageToGoalStyle';
import DateHeader from '@/components/DateHeader.vue';
import AgentPersonalRevenueStatsStack from '@/components/AgentPersonalRevenueStatsStack.vue';

/** Display order on agents page: callers → managers → admins → other */
function agentRoleSortRank(role) {
  const r = String(role || 'caller').toLowerCase();
  if (r === 'caller') return 0;
  if (r === 'manager') return 1;
  if (r === 'admin') return 2;
  return 3;
}

function monthBoundsFromRange(dateRange) {
  if (!Array.isArray(dateRange) || dateRange.length < 2) {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  const [start, end] = dateRange;
  const from = new Date(start);
  const to = new Date(end);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function orderOverlapsRange(order, from, to) {
  const orderStart = new Date(order?.startDate || 0);
  const orderEnd = new Date(order?.deadline || 0);
  return orderStart <= to && orderEnd >= from;
}

function getAgentMonthOrders(agent, orders, dateRange) {
  const aid = String(agent?._id ?? agent?.id ?? '');
  if (!aid || !Array.isArray(orders)) return [];
  const { from, to } = monthBoundsFromRange(dateRange);
  return orders.filter(
    (order) =>
      (order.assignedCallers || []).some((x) => String(x?._id ?? x?.id ?? x) === aid) &&
      orderOverlapsRange(order, from, to) &&
      Number(order?.agentGoals?.[aid] ?? 0) > 0
  );
}

function computeAgentMonthlyGoalEuros(agent, orders, dateRange) {
  const aid = String(agent?._id ?? agent?.id ?? '');
  if (!aid) return 0;
  return getAgentMonthOrders(agent, orders, dateRange).reduce((sum, order) => {
    const goal = Number(order?.agentGoals?.[aid] ?? 0);
    const price = Number(order?.pricePerUnit ?? 0);
    return sum + goal * price;
  }, 0);
}

function sumAgentUnitsOnOrderInRange(agent, order, dailyLogs, from, to) {
  const aid = String(agent?._id ?? agent?.id ?? '');
  if (!aid || !Array.isArray(dailyLogs)) return 0;
  const fromTime = from.getTime();
  const toTime = to.getTime();
  const orderId = String(order?._id ?? order?.id ?? '');
  const caseName = order?.caseName || '';
  const seenLogs = new Set();
  let units = 0;

  dailyLogs.forEach((log) => {
    const logAgentId = String(log?.agent?._id ?? log?.agentId ?? log?.agent ?? '');
    if (logAgentId !== aid) return;
    const logOrderId = String(log?.order?._id ?? log?.order?.id ?? log?.orderId ?? '');
    const logCaseName = log?.caseName ?? '';
    const sameOrder =
      (orderId && logOrderId && logOrderId === orderId) ||
      (caseName && logCaseName && logCaseName === caseName);
    if (!sameOrder) return;
    const d = new Date(log.date);
    const tMs = d.getTime();
    if (!Number.isFinite(tMs) || tMs < fromTime || tMs > toTime) return;
    const key = `${log.date}_${logAgentId}_${logCaseName}_${log._id || log.id}`;
    if (seenLogs.has(key)) return;
    seenLogs.add(key);
    const qty = Number(log.quantityCompleted ?? 0);
    if (Number.isFinite(qty) && !Number.isNaN(qty)) units += qty;
  });

  return units;
}

function computeAgentRevenueKpi(agent, orders, dailyLogs, dateRange) {
  const goal = computeAgentMonthlyGoalEuros(agent, orders, dateRange);
  if (goal <= 0) return { goal: 0, current: 0 };
  const { from, to } = monthBoundsFromRange(dateRange);
  let current = 0;
  for (const order of getAgentMonthOrders(agent, orders, dateRange)) {
    const price = Number(order?.pricePerUnit ?? 0);
    current += sumAgentUnitsOnOrderInRange(agent, order, dailyLogs, from, to) * price;
  }
  return { goal, current };
}

function caseProgressLabelTextClass(percent) {
  const p = Number(percent) || 0;
  return p > 2 ? 'text-white' : 'text-high-emphasis';
}

function buildAgentCasesForAgent(agent, orders, dailyLogs, gcCases, dateRange) {
  const aid = String(agent?._id ?? agent?.id ?? '');
  if (!aid) return [];
  const { from, to } = monthBoundsFromRange(dateRange);
  const seen = new Set();

  return getAgentMonthOrders(agent, orders, dateRange)
    .filter((order) => {
      const name = order?.caseName || order?.caseId || '';
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    })
    .map((order) => {
      const goal = Number(order?.agentGoals?.[aid] ?? 0);
      const completed = sumAgentUnitsOnOrderInRange(agent, order, dailyLogs, from, to);
      const progressPercent = goal > 0 ? Math.min(100, (completed / goal) * 100) : 0;
      const fullCaseName = order.caseName || order.caseId || '—';
      const caseId = order?.caseId;
      const gc = (gcCases || []).find(
        (x) => caseId && String(x._id ?? x.id) === String(caseId)
      );
      const nick = gc?.nickname != null ? String(gc.nickname).trim() : '';
      const hasNickname = nick.length > 0;
      const displayName = hasNickname ? nick : fullCaseName;

      return {
        fullCaseName,
        displayName,
        hasNickname,
        orderKey: String(order?._id ?? order?.id ?? ''),
        completed,
        goal,
        progressPercent,
        progressPercentRounded: Math.round(progressPercent),
        progressColor: getPercentageToGoalVuetifyColor(progressPercent),
        progressLabelClass: caseProgressLabelTextClass(progressPercent),
        tooltip: `${fullCaseName} — ${completed}/${goal}`,
      };
    });
}

function enrichAgentRow(agent, orders, dailyLogs, gcCases, dateRange, logStats = {}) {
  return {
    ...agent,
    ...logStats,
    agentCases: buildAgentCasesForAgent(agent, orders, dailyLogs, gcCases, dateRange),
    revenueKpi: computeAgentRevenueKpi(agent, orders, dailyLogs, dateRange),
  };
}
  
  export default {
    name: 'agentsPage',

    components: {
      DateHeader,
      AgentPersonalRevenueStatsStack,
    },

    data() {
      return {
        showAllAgents: false, // default: active agents only
      };
    },
    
    computed: {
      ...mapGetters(['gcAgents', 'dailyLogs', 'currentPage', 'currentDateRange', 'orders', 'users', 'gcCases']),
      
      // Calculate combined stats from daily logs for each agent (current month only)
      agentsWithStats() {
        let agents = this.showAllAgents
          ? (this.gcAgents || [])
          : (this.gcAgents || []).filter(agent => agent.active !== false);

        agents = [...agents].sort((a, b) => {
          const ra = agentRoleSortRank(a.role);
          const rb = agentRoleSortRank(b.role);
          if (ra !== rb) return ra - rb;
          if (this.showAllAgents) {
            const aActive = a.active !== false ? 0 : 1;
            const bActive = b.active !== false ? 0 : 1;
            if (aActive !== bActive) return aActive - bActive;
          }
          return String(a.name || '').toLowerCase().localeCompare(String(b.name || '').toLowerCase());
        });

        const orders = this.orders || [];
        const logs = this.dailyLogs || [];
        const range = this.currentDateRange;
        const gcCases = this.gcCases || [];

        if (!this.dailyLogs) {
          return agents.map((agent) => enrichAgentRow(agent, orders, logs, gcCases, range));
        }

        const { from: monthStart, to: monthEnd } = monthBoundsFromRange(range);

        return agents.map((agent) => {
          const agentLogs = this.dailyLogs.filter((log) => {
            const logAgentId = String(log?.agent?._id ?? log?.agent ?? '');
            const agentId = String(agent._id ?? agent.id);
            if (logAgentId !== agentId) return false;
            const logDate = new Date(log.date);
            if (isNaN(logDate.getTime())) return false;
            return logDate >= monthStart && logDate <= monthEnd;
          });

          const totalOutgoingCalls = agentLogs.reduce((sum, log) => sum + (log.outgoing_calls || 0), 0);
          const totalAnsweredCalls = agentLogs.reduce((sum, log) => sum + (log.answered_calls || 0), 0);

          return enrichAgentRow(agent, orders, logs, gcCases, range, {
            call_time: agentLogs.reduce((sum, log) => sum + (log.call_time || 0), 0).toFixed(2),
            outgoing_calls: totalOutgoingCalls,
            answered_calls: totalAnsweredCalls,
            completed_calls: agentLogs.reduce((sum, log) => sum + (log.completed_calls || 0), 0),
            quantityCompleted: agentLogs.reduce((sum, log) => sum + (log.quantityCompleted || 0), 0),
            response_rate: (totalOutgoingCalls > 0 ? (totalAnsweredCalls / totalOutgoingCalls) * 100 : 0).toFixed(2),
            meetings: agentLogs.length,
          });
        });
      },
    },

    async mounted() {
      this.updatePage('agentPage');
      
      // Fetch the required data for agents page
      try {
        await Promise.all([
          this.fetchUsers(),
          this.fetchgcAgents(),
          this.fetchDailyLogs(),
          this.fetchOrders(),
          this.fetchGcCases(),
        ]);

        if (!this.currentDateRange || this.currentDateRange.length < 2) {
          await this.fetchCurrentDateRange();
        }

        console.log('🔍 agentsWithStats on mount:', this.agentsWithStats);
        console.log(
          '🔍 Agent info:',
          (this.agentsWithStats || []).map(agent => ({
            id: agent?._id ?? agent?.id ?? null,
            name: agent?.name ?? '',
            email: agent?.email ?? '',
            role: agent?.role ?? '',
            active: agent?.active !== false,
            linkedUserId: agent?.linkedUserId ?? null,
          }))
        );
      } catch (error) {
        console.error('Error fetching agents data:', error);
      }
    },

    methods: {
      formatStatNumber,
      ...mapMutations(['setCurrentPage', 'setDateRange']),
      ...mapActions(['fetchUsers', 'fetchgcAgents', 'fetchDailyLogs', 'fetchOrders', 'fetchGcCases', 'fetchCurrentDateRange']),

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
      },
      editGCAgent(agent) {
        // Resolve the auth user for this gcAgent and pass user _id to editGcAgent.
        // Prefer explicit link (linkedUserId) when present; fallback to email, then name.
        const users = Array.isArray(this.users) ? this.users : [];
        const linkedUserId = String(agent?.linkedUserId ?? '').trim();
        const agentEmail = String(agent?.email ?? '').trim().toLowerCase();
        const agentName = String(agent?.name ?? '').trim().toLowerCase();

        const foundById = linkedUserId
          ? users.find((u) => String(u?._id ?? u?.id ?? '') === linkedUserId) || null
          : null;

        const foundByEmail = users.find((u) => {
          const userEmail = String(u?.email ?? u?.emails?.[0]?.value ?? '').trim().toLowerCase();
          if (agentEmail && userEmail && userEmail === agentEmail) return true;
          return false;
        }) || null;

        const foundByName = users.find((u) => {
          const userName = String(u?.name ?? u?.username ?? '').trim().toLowerCase();
          return agentName && userName && userName === agentName;
        }) || null;

        const foundUser = foundById || foundByEmail || foundByName;

        const selectedUser = String(foundUser?._id ?? foundUser?.id ?? '');
        const selectedGcAgent = String(agent?._id ?? agent?.id ?? '');
        const payload = { selectedUser, selectedGcAgent };

        console.log('editGCAgent() agent object:', agent);
        console.log('editGCAgent() lookup:', {
          usersCount: users.length,
          linkedUserId: linkedUserId || null,
          agentEmail: agent?.email ?? null,
          agentName: agent?.name ?? null,
          matchedUser: foundUser ? {
            _id: foundUser._id ?? foundUser.id ?? null,
            name: foundUser.name ?? null,
            email: foundUser.email ?? null,
          } : null,
          selectedUserSent: selectedUser || null,
          selectedGcAgentSent: selectedGcAgent || null,
        });
        console.log('editGCAgent() route payload:', payload);
        if (!selectedUser) {
          console.warn('editGCAgent(): No matching user found in user collection for agent', agent);
        }
        // Restore original behavior
        this.$router.push({ name: 'editGcAgent', query: payload });
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
    overflow: visible;
    box-sizing: border-box;
  }
  .agent-card .v-card-title,
  .agent-card .v-card-subtitle {
    justify-content: center;
    width: 100%;
  }
  .agent-card-content {
    text-align: left;
    width: 100%;
  }
  .agent-case-list {
    list-style-position: outside;
    padding-left: 1.5rem;
    margin-left: 0;
    text-align: left;
  }

  /* Prevent card actions from being cut off on narrow screens (e.g. Lenovo Yoga) */
  .agent-card .v-card-actions {
    flex-wrap: wrap;
    justify-content: center;
    padding: 8px !important;
    min-height: 0;
  }

  .agents-page-container .v-col {
    min-width: 0;
  }

  .case-progress-linear-wrap {
    position: relative;
    min-height: 10px;
  }
  .case-progress-linear-wrap__label {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .case-progress-linear-wrap__label .font-weight-bold {
    font-size: 0.6rem;
    line-height: 1;
  }
  /* Static stripes: Vuetify animates the stripe pattern by default; disable it */
  .case-progress-linear-wrap :deep(.v-progress-linear--striped .v-progress-linear__determinate) {
    animation: none !important;
  }
  .case-progress-linear-wrap :deep(.v-progress-linear) {
    transition: none !important;
  }
  .case-progress-linear-wrap :deep(.v-progress-linear__determinate),
  .case-progress-linear-wrap :deep(.v-progress-linear__background) {
    transition: width 0s linear, left 0s linear, right 0s linear, opacity 0s linear !important;
  }

  .agents-page-root {
    max-width: 100%;
  }

  .agent-card-sections {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .section-card {
    min-width: 0;
    overflow: hidden;
    background: #fff;
    width: 100%;
  }

  .section-card-inner {
    min-width: 0;
    text-align: left;
  }

  .section-card-title {
    font-size: 0.65rem;
    line-height: 1.2;
  }

  .section-card-subtitle {
    font-size: 0.65rem;
    line-height: 1.2;
  }

  </style>
  