<template>
  <v-container  style="width: 80%;" >
    <h1 class="text-h4 mb-4" style="width: 75vw;"> Cases for {{ selectedGcAgent ? selectedGcAgent.name : '—' }}</h1>
    <div class="grid-container ">
      <agentCaseCard
      v-for="(userOrder, index) in userOrders"
      :key="index"
      :order="userOrder"
      :agents="gcAgents"
      :dailyLogs="dailyLogs"
      :currentUser="currentUser"
      />
    </div>
    <v-card>
    <v-card-title class="text-h6">Agent Weekly Stats</v-card-title>

    <v-data-table
      :headers="statsHeaders"
      :items="statsItems"
      class="elevation-1"
      density="comfortable"
      :items-per-page="10"
    >
      <!-- number formatting -->
      <template #item.hourPerMeeting="{ value }">
        {{ formatNumber(value) }}
      </template>
      <template #item.callsPerMeeting="{ value }">
        {{ formatNumber(value) }}
      </template>
      <template #item.turnoverPerMeeting="{ value }">
        {{ formatCurrency(value) }}
      </template>
      <template #item.turnoverNow="{ value }">
        {{ formatCurrency(value) }}
      </template>
    </v-data-table>
  </v-card>
  </v-container>
  
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n';
import agentCaseCard from './agentCaseCard.vue'

const store = useStore()
const userOrders = ref([])
const { t } = useI18n()

const orders = computed(() => store.getters['orders'])
console.log('dashOrders', orders.value)
const gcAgents = computed(() => store.getters['gcAgents'])
console.log('gcAgents', gcAgents.value)
const dailyLogs = computed(() => store.getters['dailyLogs'])
console.log('dailyLogs', dailyLogs.value)
const currentDate = computed(() => store.getters['currentDate'])
console.log('currentDate', currentDate.value)

const statsHeaders = computed(() => [
  { title: t('agentWeeklyTable.case'), key: 'case', sortable: true },
  { title: t('agentWeeklyTable.weekGoal'), key: 'weekGoal' },
  { title: t('agentWeeklyTable.currentResults'), key: 'currentResults' },
  { title: t('agentWeeklyTable.resultsNeeded'), key: 'resultsNeeded' },
  { title: t('agentWeeklyTable.callsMade'), key: 'callsMade' },
  { title: t('agentWeeklyTable.hoursComplete'), key: 'hoursComplete' },
  { title: t('agentWeeklyTable.hourPerMeeting'), key: 'hourPerMeeting' },
  { title: t('agentWeeklyTable.callsPerMeeting'), key: 'callsPerMeeting' },
  { title: t('agentWeeklyTable.turnoverPerMeeting'), key: 'turnoverPerMeeting' },
  { title: t('agentWeeklyTable.turnoverNow'), key: 'turnoverNow' },
])

function formatNumber(n) {
  return typeof n === 'number' ? n.toFixed(2) : n
}
function formatCurrency(n) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(n ?? 0)
  } catch {
    return n
  }
}

const statsItems = [
  {
    weekGoal: 12,
    currentResults: 7,
    resultsNeeded: 5,
    callsMade: 210,
    hoursComplete: 14,
    hourPerMeeting: 2.0,      // hoursComplete / currentResults
    callsPerMeeting: 30.0,    // callsMade / currentResults
    turnoverPerMeeting: 150,  // turnoverNow / currentResults
    turnoverNow: 1050,
  },
  {
    weekGoal: 15,
    currentResults: 12,
    resultsNeeded: 3,
    callsMade: 260,
    hoursComplete: 18,
    hourPerMeeting: 1.5,
    callsPerMeeting: 21.7,
    turnoverPerMeeting: 180,
    turnoverNow: 2160,
  },
  {
    weekGoal: 8,
    currentResults: 8,
    resultsNeeded: 0,
    callsMade: 150,
    hoursComplete: 10,
    hourPerMeeting: 1.25,
    callsPerMeeting: 18.8,
    turnoverPerMeeting: 120,
    turnoverNow: 960,
  },
];
const currentUser = computed(() => {
  return store.state.user?.user
      ?? JSON.parse(localStorage.getItem('auth_user') || 'null')
      ?? null;
});
console.log('user', currentUser.value)

const selectedGcAgent = computed(() => {
  const user = currentUser.value;
  const linkId = user?.linkedUserId ?? null;
  if (!linkId) return null;

  return (gcAgents.value || []).find(a =>
    String(a._id ?? a.id) === String(linkId)
  ) || null;
});

watch([orders, selectedGcAgent], ([allOrders, agent]) => {
  userOrders.value = agent
    ? findOrdersForUser(allOrders, agent._id ?? agent.id)
    : [];

    console.log('userOrders:', userOrders.value);
    const caseNamesArray =groupByCaseName(userOrders.value);
    console.log('caseNamesArray:', caseNamesArray);
    const dailyLogsForUser = findDailyLogsForUser(caseNamesArray);
    console.log('dailyLogsForUser:', dailyLogsForUser);
    const dailyBreakdown = dailyLogsForUser.map(log => ({
      date: currentDate.toISOString().split('T')[0],
      quantity: log.quantityCompleted
    }));
    console.log('dailyBreakdown:', dailyBreakdown);
}, { immediate: true });

function findOrdersForUser(allOrdersArray, agentId) {
  const wanted = String(agentId || '');
  if (!wanted) return [];
  return (allOrdersArray || []).filter(order =>
    (order.assignedCallers || []).some(id => String(id?._id ?? id) === wanted)
  );
}

function groupByCaseName(orders) {
  const names = new Set(
    orders.map(order => order.caseName).filter(Boolean) // dedupe + skip falsy
  );
  return Array.from(names);
}

function findDailyLogsForUser(caseNamesArray) {
  return (dailyLogs.value || []).filter(log =>
    caseNamesArray.includes(log.caseName)
  );
} 

onMounted(async () => {
  try {
    await store.dispatch('fetchOrders')
    await store.dispatch('fetchgcAgents')
    await store.dispatch('fetchDailyLogs')
  } catch (error) {
    console.error('Error fetching data on mount:', error)
  }

})
</script>

<style scoped>
  .order-card {
    transition: box-shadow 0.3s ease;
  }
  .order-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
  .small-card {
      max-width: 450px;
      max-height: 300px;
      overflow: auto;
  }
  
  .small-btn {
    font-size: 12px;
    padding: 4px 8px;
    min-width: 85px;
  }
  
  .grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 3 columns */
    gap: 16px;
    width: 75vw;
    margin-bottom: 1rem;
    flex-shrink: 0; /* ✅ Prevent it from collapsing or overlapping */

    /* Hide scrollbar for Webkit browsers (Chrome, Safari) */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* IE and Edge */
  }


  .grid-container::-webkit-scrollbar {
    display: none; /* Chrome, Safari, and Opera */
  }

  /* Enable scrolling when hovering */
  .grid-container:hover {
    overflow-x: auto; /* Ensure scrolling works on hover */
  }
</style>
