<template>
  <!-- <v-container>
    <h1 class="text-h4 mb-4">All Orders</h1>

    <v-row>
      <v-col
        v-for="order in orders"
        :key="order._id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card class="order-card" elevation="4">
          <v-card-title class="text-h6">
            {{ order.caseName }}
          </v-card-title>

          <v-card-subtitle class="text-caption">
            Goal: {{ order.goalType }} | Status: {{ order.orderStatus }}
          </v-card-subtitle>

          <v-card-text>
            <div><strong>Deadline:</strong> {{ formatDate(order.deadline) }}</div>
            <div><strong>Revenue:</strong> €{{ order.estimatedRevenue }}</div>
            <div>
              <strong>Callers:</strong>
              <span v-if="order.assignedCallers.length">
                {{ getCallerNames(order) }}
              </span>
              <span v-else>None</span>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn color="primary" :to="`/orders/${order._id}`">View Details</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container> -->
  <v-container>
    <h1 class="text-h4 mb-4">All Orders</h1>
    <div class="grid-container " >
      <DashboardCard01
      v-for="(order, index) in orders"
      :key="index"
      :order="order"
      :agents="gcAgents"
      />
    </div>
  </v-container>
 
  
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import DashboardCard01 from '@/partials/dashboard/caseCard2.vue'


import { computed } from 'vue'

const store = useStore()


async function fetchAllData() {
  await store.dispatch('fetchOrders')
  await store.dispatch('fetchgcAgents')
}

const orders = computed(() => store.getters['orders'])
console.log('dashOrders', orders.value)
const gcAgents = computed(() => store.getters['gcAgents'])
console.log('gcAgents', gcAgents.value)

const formatDate = date => new Date(date).toLocaleDateString()

function getCallerNames(order) {
  return order.assignedCallers
    .map(id => gcAgents.value.find(agent => agent._id === id)?.name || 'Unknown')
    .join(', ')
}

onMounted(() => {
  fetchAllData()
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
    display: flex;
    gap: 16px; /* space between items */
    overflow-x: auto;
    overflow-y: hidden;
    padding: 1rem; /* optional padding */
    scroll-behavior: smooth; /* optional smooth scroll */
    width: 90vw; /* adjust as needed */
    margin-bottom: 1rem; /* ✅ Add spacing to push down the charts */
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
