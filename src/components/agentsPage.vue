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
            v-for="(agent, index) in agentsWithStats"
            :key="index"
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

              <!-- Assigned cases and monthly goal -->
              <v-card-text class="pt-0 pb-1 flex-grow-1 agent-card-content">
                <div v-if="getAgentCases(agent).length" class="text-body-2">
                  <div class="font-weight-medium mb-1">Assigned cases</div>
                  <ul class="mb-2 text-caption agent-case-list">
                    <li
                      v-for="(c, cIdx) in getAgentCases(agent)"
                      :key="`${c.orderKey || cIdx}-${cIdx}`"
                      class="mb-2"
                      :title="tooltipForAgentCaseRow(c)"
                    >
                      <v-tooltip v-if="c.hasNickname" location="top">
                        <template #activator="{ props: tip }">
                          <div v-bind="tip" class="text-truncate text-left" style="cursor: default">
                            <span class="text-decoration-dotted text-high-emphasis">{{ c.displayName }}</span>
                            — {{ formatStatNumber(c.completed) }}/{{ formatStatNumber(c.goal) }}
                          </div>
                        </template>
                        <span>{{ c.fullCaseName }}</span>
                      </v-tooltip>
                      <div v-else class="text-truncate text-left">
                        {{ c.displayName }} — {{ formatStatNumber(c.completed) }}/{{ formatStatNumber(c.goal) }}
                      </div>
                      <!-- Label overlaid (no default slot) to avoid Vuetify/DOM patch issues. Stripes: not animated (CSS below). -->
                      <div
                        class="case-progress-linear-wrap mt-1"
                        :key="`pg-${c.orderKey || cIdx}-${cIdx}`"
                      >
                        <v-progress-linear
                          :model-value="caseProgressPercent(c)"
                          :color="getPercentageToGoalVuetifyColor(caseProgressPercent(c))"
                          height="10"
                          rounded="sm"
                          striped
                        />
                        <div class="case-progress-linear-wrap__label d-flex align-center justify-center">
                          <small
                            :class="caseProgressLabelTextClass(c)"
                            class="font-weight-bold"
                          >{{ caseProgressPercentRounded(c) }}%</small>
                        </div>
                      </div>
                    </li>
                  </ul>
                  <div class="font-weight-medium">
                    {{ $t('agentDashboard.personalMonthlyGoal') }}: €{{ formatCurrency(monthlyGoalByAgent[String(agent._id || agent.id || agent.name)] ?? 0) }}
                  </div>
                </div>
                <div v-else class="text-caption text-grey">
                  No cases assigned
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

/** Personal monthly goal (€) for one agent in the selected month */
function computeAgentMonthlyGoalEuros(agent, orders, dateRange) {
  const aid = String(agent?._id ?? agent?.id ?? '');
  if (!aid || !Array.isArray(orders)) return 0;
  const { from, to } = monthBoundsFromRange(dateRange);
  return orders
    .filter(
      (order) =>
        (order.assignedCallers || []).some((x) => String(x?._id ?? x?.id ?? x) === aid) &&
        orderOverlapsRange(order, from, to) &&
        Number(order?.agentGoals?.[aid] ?? 0) > 0
    )
    .reduce((sum, order) => {
      const goal = Number(order?.agentGoals?.[aid] ?? 0);
      const price = Number(order?.pricePerUnit ?? 0);
      return sum + goal * price;
    }, 0);
}
  
  export default {
    name: 'agentsPage',

    components: {
      DateHeader,
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

        if (!this.dailyLogs) {
          return agents;
        }

        const { from: monthStart, to: monthEnd } = this.getCurrentMonthBounds();

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
            response_rate: responseRate.toFixed(2),
            meetings: agentLogs.length
          };
          });
      },

      /** Per-agent monthly goal (€) — computed map avoids template method loader issues */
      monthlyGoalByAgent() {
        const list = this.agentsWithStats || [];
        const orders = this.orders || [];
        const range = this.currentDateRange;
        const out = Object.create(null);
        for (const agent of list) {
          const key = String(agent?._id ?? agent?.id ?? agent?.name ?? '');
          if (!key) continue;
          out[key] = computeAgentMonthlyGoalEuros(agent, orders, range);
        }
        return out;
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
      getPercentageToGoalVuetifyColor,
      ...mapMutations(['setCurrentPage', 'setDateRange']),
      ...mapActions(['fetchUsers', 'fetchgcAgents', 'fetchDailyLogs', 'fetchOrders', 'fetchGcCases', 'fetchCurrentDateRange']),

      // True if order's startDate–deadline overlaps the selected month
      orderOverlapsSelectedMonth(order) {
        const { from: monthStart, to: monthEnd } = this.getCurrentMonthBounds();
        const orderStart = new Date(order?.startDate || 0);
        const orderEnd = new Date(order?.deadline || 0);
        return orderStart <= monthEnd && orderEnd >= monthStart;
      },

      // Orders where this agent is in assignedCallers and order overlaps selected month
      getAgentOrdersCurrentMonth(agent) {
        const aid = String(agent?._id ?? agent?.id ?? '');
        if (!aid) return [];
        const all = this.orders || [];
        
        const agentOrders = all.filter(
          (order) =>
            (order.assignedCallers || []).some((x) => String(x?._id ?? x?.id ?? x) === aid) &&
            this.orderOverlapsSelectedMonth(order)
        );

        // Then, exclude cases where this agent's goal is 0 or not set
        return agentOrders.filter(order => {
          const goal = Number(order?.agentGoals?.[aid] ?? 0);
          return goal > 0;
        });
      },

      getCurrentMonthBounds() {
        return monthBoundsFromRange(this.currentDateRange);
      },

      // Unique assigned cases for this agent in the current month (no duplicates by case name)
      getAgentCases(agent) {
        const orders = this.getAgentOrdersCurrentMonth(agent);
        const seen = new Set();
        const { from, to } = this.getCurrentMonthBounds();
        const fromTime = from.getTime();
        const toTime = to.getTime();

        return orders
          .filter((order) => {
            const name = order?.caseName || order?.caseId || '';
            if (!name || seen.has(name)) return false;
            seen.add(name);
            return true;
          })
          .map((order) => {
            const aid = String(agent?._id ?? agent?.id ?? '');
            const goal = Number(order?.agentGoals?.[aid] ?? 0);
            let completed = 0;

            try {
              const logs = Array.isArray(this.dailyLogs) ? this.dailyLogs : [];
              const orderId = String(order?._id ?? order?.id ?? '');
              const caseName = order?.caseName || '';

              const seenLogs = new Set();
              logs.forEach((log) => {
                const logAgentId = String(
                  log?.agent?._id ??
                  log?.agentId ??
                  log?.agent ??
                  ''
                );
                if (logAgentId !== aid) return;

                const logOrderId = String(
                  log?.order?._id ??
                  log?.order?.id ??
                  log?.orderId ??
                  ''
                );
                const logCaseName = log?.caseName ?? '';
                const sameOrder =
                  (orderId && logOrderId && logOrderId === orderId) ||
                  (caseName && logCaseName && logCaseName === caseName);
                if (!sameOrder) return;

                const d = new Date(log.date);
                const tMs = d.getTime();
                if (!Number.isFinite(tMs)) return;
                if (tMs < fromTime || tMs > toTime) return;

                const key = `${log.date}_${logAgentId}_${logCaseName}_${log._id || log.id}`;
                if (seenLogs.has(key)) return;
                seenLogs.add(key);

                const units = Number(log.quantityCompleted ?? 0);
                if (Number.isFinite(units) && !Number.isNaN(units)) {
                  completed += units;
                }
              });
            } catch (e) {
              console.warn('Failed to compute case progress on agentsPage:', e);
            }

            const fullCaseName = order.caseName || order.caseId || '—';
            const caseId = order?.caseId;
            const gc = (this.gcCases || []).find(
              (x) => caseId && String(x._id ?? x.id) === String(caseId)
            );
            const nick = gc?.nickname != null ? String(gc.nickname).trim() : '';
            const hasNickname = nick.length > 0;
            const displayName = hasNickname ? nick : fullCaseName;

            return {
              caseName: fullCaseName,
              fullCaseName,
              displayName,
              hasNickname,
              orderKey: String(order?._id ?? order?.id ?? ''),
              completed,
              goal,
            };
          });
      },

      /** Native title for row when v-tooltip is not used (or extra hint on li) */
      tooltipForAgentCaseRow(c) {
        const name = c.fullCaseName || c.displayName;
        return `${name} — ${c.completed}/${c.goal}`;
      },

      formatCurrency(n) {
        try {
          return new Intl.NumberFormat(undefined, { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);
        } catch {
          return n ?? 0;
        }
      },

      caseProgressPercent(c) {
        const goal = Number(c?.goal) || 0;
        const done = Number(c?.completed) || 0;
        if (goal <= 0) return 0;
        return Math.min(100, (done / goal) * 100);
      },

      caseProgressPercentRounded(c) {
        return Math.round(this.caseProgressPercent(c));
      },

      /** Contrast: white on filled area; darker when the bar is nearly empty */
      caseProgressLabelTextClass(c) {
        const p = this.caseProgressPercent(c);
        return p > 2 ? 'text-white' : 'text-high-emphasis';
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
    text-align: center;
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

  </style>
  