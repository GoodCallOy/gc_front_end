<template>
  <v-container>
    <v-card v-if="order" class="pa-4"   >
      <v-row justify="space-between">
        <v-col>
          <h2>Case Details</h2>
        </v-col>
        <v-col cols="auto">
          <v-btn @click="editOrder" color="primary">Edit Order</v-btn>
        </v-col>
      </v-row>


      <div>
        <v-row>
            <v-col cols="3">
                <strong>Case:</strong> {{ order.caseName }}
            </v-col>
            <v-col cols="3">
                <strong>Case Unit:</strong> {{ order.caseUnit }}
            </v-col>
            <v-col cols="3">
                <strong>Price per Unit:</strong> {{ order.pricePerUnit }}
            </v-col>
            <v-col cols="3">
                <strong>Status:</strong> {{ order.orderStatus }}
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="3">
               <strong>Deadline:</strong> {{ formatDate(order.deadline) }}
            </v-col>
            <v-col cols="3">
               <strong>Quantity:</strong> {{ order.totalQuantity }}
            </v-col>
            <v-col cols="3">
                <strong>Estimated Revenue:</strong> €{{ order.estimatedRevenue }}
            </v-col>
            <v-col cols="3">
                <strong>Callers:</strong> {{ getCallerNames(order, agents) }}
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <div v-if="order.agentGoals">
                    <strong>Agent Goals:</strong>
                    <ul>
                        <li v-for="id in order.assignedCallers" :key="id">
                        {{ agentName(id) }}: {{ order.agentGoals[id] || 0 }}
                        </li>
                    </ul>
                </div>
            </v-col>
        </v-row>
        </div>
    </v-card>
  </v-container>
  <v-card class="mx-auto my-4 pa-4 elevation-4" style="width: 90%; background-color: #eeeff1;">
    <v-row>
      <v-col cols="4">
        <h2 class="text-h5">Case Statistics</h2>
      </v-col>
      <v-col cols="4">
        <h2 class="text-h6">Revenue Generate: €{{ revenueGenerated.revenue }}</h2>
      </v-col>
      <v-col cols="4">
        <h2 class="text-h6">Total Units: {{ revenueGenerated.totalUnits }}</h2>
      </v-col>
    </v-row>
    
    <p v-if="caseStats.length === 0">No statistics available for this case.</p>
    <div v-else>
      <v-row>
        <v-col v-for="(log, index) in caseStats" :key="index" cols="12" md="4">
          <AgentStatCard
            :agentName="log.agentName"
            :caseUnit="log.caseUnit"
            :pricePerUnit="order.pricePerUnit"
            :callTime="log.call_time"
            :completedCalls="log.completed_calls"
            :outgoingCalls="log.outgoing_calls"
            :answeredCalls="log.answered_calls"
            :responseRate="log.response_rate"
            :date="log.date"
            :quantityCompleted="log.quantityCompleted"
          />
        </v-col>
      </v-row>
    </div>
  </v-card>
    
  
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import axios from 'axios'
  import { useRoute, useRouter } from 'vue-router'
  import urls from '@/js/config.js'
  import AgentStatCard from './agentStatCard.vue';
  import { computed } from 'vue';


  const route = useRoute()
  const router = useRouter()
  const orderId = route.query.orderId
  console.log('Order ID:', orderId)

  const order = ref(null)
  const agents = ref([])
  const caseStats = ref([]);
  
  const goalTypes = ['hours', 'interviews', 'meetings']
  const orderStatuses = ['pending', 'in-progress', 'completed', 'cancelled', 'on-hold']
  const agentName = id => agents.value.find(a => a._id === id)?.name || id;

  const revenueGenerated = computed(() => {
  if (!order.value || !order.value.assignedCallers || !Array.isArray(caseStats.value)) {
    return { totalUnits: 0, revenue: '0.00' };
  }
  const totalUnits = caseStats.value
    .filter(log => order.value.assignedCallers.includes(log.agent))
    .reduce((sum, log) => sum + (Number(log.quantityCompleted) || 0), 0);
  const revenue = (totalUnits * (Number(order.value.pricePerUnit) || 0)).toFixed(2);
  return { totalUnits, revenue };
});

  function getCallerNames(order, agents) {
      const agentNames = order.assignedCallers
          .map(id => agents.find(agent => agent._id === id)?.name || 'Unknown')
          .join(', ')
      console.log('Agent Names:', agentNames);
      return agentNames
  }
  onMounted(async () => {
    const [orderRes, agentRes] = await Promise.all([
      axios.get(`${urls.backEndURL}/orders/${orderId}`),
      axios.get(`${urls.backEndURL}/gcAgents`)
    ])
    order.value = orderRes.data
    agents.value = agentRes.data

    // Now fetch caseStats using the loaded order
    const year = new Date(order.value.deadline).getFullYear();
    const month = new Date(order.value.deadline).getMonth() + 1;
    const caseName = order.value.caseName;
    caseStats.value = (await axios.get(
      `${urls.backEndURL}/dailyLogs/${caseName}?year=${year}&month=${month}`
    )).data;
    console.log('Case Stats:', caseStats.value) 
  })

  const editOrder = () => {
    // Navigate to the edit order form
    router.push({ name: 'editOrderForm', params: { id: orderId } });
  }

  const formatDate = dateStr => new Date(dateStr).toLocaleDateString()
</script>
<style scoped>
.agent-card-grid {
  width: 70%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin: 32px 0;
  justify-items: center;
}
</style>