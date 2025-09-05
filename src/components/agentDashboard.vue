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
      />
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import agentCaseCard from './agentCaseCard.vue'

const store = useStore()

const userOrders = ref([])

const orders = computed(() => store.getters['orders'])
console.log('dashOrders', orders.value)
const gcAgents = computed(() => store.getters['gcAgents'])
console.log('gcAgents', gcAgents.value)
const dailyLogs = computed(() => store.getters['dailyLogs'])
console.log('dailyLogs', dailyLogs.value)


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

console.log('selectedGcAgent:', selectedGcAgent.value);

watch([orders, selectedGcAgent], ([allOrders, agent]) => {
  userOrders.value = agent
    ? findOrdersForUser(allOrders, agent._id ?? agent.id)
    : [];
}, { immediate: true });

function findOrdersForUser(allOrdersArray, agentId) {
  const wanted = String(agentId || '');
  if (!wanted) return [];
  return (allOrdersArray || []).filter(order =>
    (order.assignedCallers || []).some(id => String(id?._id ?? id) === wanted)
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
