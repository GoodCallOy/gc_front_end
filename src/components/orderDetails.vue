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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRoute } from 'vue-router'
import urls from '@/js/config.js'

const route = useRoute()
const orderId = route.query.orderId
console.log('Order ID:', orderId)

const order = ref(null)
const agents = ref([])
const isEditing = ref(false)
const editedOrder = ref({})

const goalTypes = ['hours', 'interviews', 'meetings']
const orderStatuses = ['pending', 'in-progress', 'completed', 'cancelled', 'on-hold']
const agentName = id => agents.value.find(a => a._id === id)?.name || id;

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
})

const saveChanges = async () => {
  await axios.put(`${urls.backEndURL}/orders/${orderId}`, editedOrder.value)
  order.value = { ...editedOrder.value }
  isEditing.value = false
}

const formatDate = dateStr => new Date(dateStr).toLocaleDateString()
</script>
