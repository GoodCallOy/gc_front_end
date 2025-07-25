<template>
  <v-container>
    <v-card v-if="order" class="pa-4"   >
      <v-row justify="space-between">
        <v-col>
          <h2>Order Details</h2>
        </v-col>
        <v-col cols="auto">
          <v-btn @click="isEditing = !isEditing">{{ isEditing ? 'Cancel' : 'Edit' }}</v-btn>
        </v-col>
      </v-row>

      <v-form v-if="isEditing" @submit.prevent="saveChanges">
        <v-text-field v-model="editedOrder.totalQuantity" label="Total Quantity" type="number" />
        <v-text-field v-model="editedOrder.pricePerUnit" label="Price Per Unit" type="number" />
        <v-select v-model="editedOrder.caseUnit" :items="goalTypes" label="Case Unit" />
        <v-select v-model="editedOrder.orderStatus" :items="orderStatuses" label="Status" />
        <v-text-field v-model="editedOrder.estimatedRevenue" label="Estimated Revenue" type="number" />
        <v-text-field v-model="editedOrder.deadline" label="Deadline" type="date" />
        <v-select
          v-model="editedOrder.assignedCallers"
          :items="agents"
          item-title="name"
          item-value="_id"
          label="Assigned Callers"
          multiple
          chips
        />
        <div v-if="editedOrder.assignedCallers && editedOrder.agentGoals">
          <strong>Edit Agent Goals:</strong>
          <v-list>
            <v-list-item
              v-for="id in editedOrder.assignedCallers"
              :key="id"
            >
              <v-list-item-content>
                <v-list-item-title>
                  {{ agentName(id) }}
                </v-list-item-title>
              </v-list-item-content>
              <v-list-item-action>
                <v-text-field
                  v-model.number="editedOrder.agentGoals[id]"
                  label="Goal"
                  type="number"
                  min="0"
                  style="max-width: 100px"
                />
              </v-list-item-action>
            </v-list-item>
          </v-list>
          <v-btn type="submit" color="primary" class="mt-4">Save</v-btn>
        </div>
        
      </v-form>

      <div v-else>
        <p><strong>Case:</strong> {{ order.caseName }}</p>
        <p><strong>case Unit:</strong> {{ order.caseUnit }}</p>
        <p><strong>Price per Unit:</strong> {{ order.pricePerUnit }}</p>
        <p><strong>Status:</strong> {{ order.orderStatus }}</p>
        <p><strong>Deadline:</strong> {{ formatDate(order.deadline) }}</p>
        <p><strong>Quantity:</strong> {{ order.totalQuantity }}</p>
        <p><strong>Estimated Revenue:</strong> €{{ order.estimatedRevenue }}</p>
        <p><strong>Callers:</strong> {{ getCallerNames(order, agents) }}</p>
        <div v-if="order.agentGoals">
          <strong>Agent Goals:</strong>
          <ul>
            <li v-for="id in order.assignedCallers" :key="id">
              {{ agentName(id) }}: {{ order.agentGoals[id] || 0 }}
            </li>
          </ul>
        </div>
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
  import { useRoute } from 'vue-router'
  import urls from '@/js/config.js'
  import AgentStatCard from './agentStatCard.vue';
  import { computed } from 'vue';


  const route = useRoute()
  const orderId = route.query.orderId
  console.log('Order ID:', orderId)

  const order = ref(null)
  const agents = ref([])
  const isEditing = ref(false)
  const editedOrder = ref({})
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
    editedOrder.value = { ...orderRes.data, agentGoals: orderRes.data.agentGoals || {} }

    // Now fetch caseStats using the loaded order
    const year = new Date(order.value.deadline).getFullYear();
    const month = new Date(order.value.deadline).getMonth() + 1;
    const caseName = order.value.caseName;
    caseStats.value = (await axios.get(
      `${urls.backEndURL}/dailyLogs/${caseName}?year=${year}&month=${month}`
    )).data;
    console.log('Case Stats:', caseStats.value) 
  })

  const saveChanges = async () => {
    await axios.put(`${urls.backEndURL}/orders/${orderId}`, editedOrder.value)
    order.value = { ...editedOrder.value }
    isEditing.value = false
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