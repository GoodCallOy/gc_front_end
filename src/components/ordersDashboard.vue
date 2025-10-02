<template>
  <v-container  style="width: 80%;" >
    <!-- Date Navigation Header -->
    <v-card elevation="1" class="mb-4">
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
    
    <h1 class="text-h4 mb-4" style="width: 100%;">All Cases - {{ getFormattedDateRange() }}</h1>
    <div class="grid-container ">
      <DashboardCard01
      v-for="(order, index) in filteredOrders"
      :key="index"
      :order="order"
      :agents="gcAgents"
      :dailyLogs="dailyLogs"
      />
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth } from '@/js/dateUtils';
import DashboardCard01 from '@/partials/dashboard/caseCard2.vue'

const store = useStore()

const orders = computed(() => store.getters['orders'])
const gcAgents = computed(() => store.getters['gcAgents'])
const dailyLogs = computed(() => store.getters['dailyLogs'])
const currentDateRange = computed(() => store.getters['currentDateRange'])

// Filter orders by the selected month
const filteredOrders = computed(() => {
  if (!orders.value || !currentDateRange.value || currentDateRange.value.length < 2) {
    return orders.value || [];
  }

  const [startDate, endDate] = currentDateRange.value;
  const monthStart = new Date(startDate);
  const monthEnd = new Date(endDate);

  return orders.value.filter(order => {
    const orderStart = new Date(order.startDate);
    const orderEnd = new Date(order.deadline);
    
    // Check if order overlaps with the selected month
    return orderStart <= monthEnd && orderEnd >= monthStart;
  });
});

// Date navigation functions
const getFormattedDateRange = () => {
  return formattedDateRange(currentDateRange.value);
}

const getIsCurrentMonth = () => {
  return isCurrentMonth(currentDateRange.value);
}

const getPreviousMonth = () => {
  const prevMonth = goToPreviousMonth(currentDateRange.value);
  updateDateRange(prevMonth);
}

const getNextMonth = () => {
  const nextMonth = goToNextMonth(currentDateRange.value);
  updateDateRange(nextMonth);
}

const updateDateRange = (newRange) => {
  store.commit('setDateRange', newRange);
}

const formatDate = date => new Date(date).toLocaleDateString()

function getCallerNames(order) {
  return order.assignedCallers
    .map(id => gcAgents.value.find(agent => agent._id === id)?.name || 'Unknown')
    .join(', ')
}

onMounted(async () => {
  try {
    // Register this component as active
    store.commit('addActiveComponent', 'ordersDashboard');
    
    // Selective fetching - only fetch data needed for orders dashboard
    await store.dispatch('fetchForContext', 'ordersDashboard');
    
    // Initialize date range if not set
    if (!currentDateRange.value || currentDateRange.value.length < 2) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      // Use UTC methods to avoid timezone issues
      const firstDay = new Date(Date.UTC(year, month, 1));
      const lastDay = new Date(Date.UTC(year, month + 1, 0));
      const format = (date) => date.toISOString().split('T')[0]
      const newRange = [format(firstDay), format(lastDay)]
      updateDateRange(newRange)
    }
  } catch (error) {
    console.error('Error fetching data on mount:', error)
  }
})

onUnmounted(() => {
  // Unregister this component when it's destroyed
  store.commit('removeActiveComponent', 'ordersDashboard');
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
    width: 100%;
    margin-bottom: 1rem;
    flex-shrink: 0; /* ✅ Prevent it from collapsing or overlapping */

    /* Hide scrollbar for Webkit browsers (Chrome, Safari) */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none;  /* IE and Edge */
  }

  /* Responsive grid */
  @media (max-width: 960px) {
    .grid-container {
      grid-template-columns: repeat(2, 1fr);
      width: 100% !important;
    }
  }

  @media (max-width: 600px) {
    .grid-container {
      grid-template-columns: 1fr;
      width: 100% !important;
    }
  }


  .grid-container::-webkit-scrollbar {
    display: none; /* Chrome, Safari, and Opera */
  }

  /* Remove horizontal hover scroll to avoid cut-off */
</style>
