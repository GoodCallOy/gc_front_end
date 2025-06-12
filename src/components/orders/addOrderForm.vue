<template>
  <v-form @submit.prevent="submitForm" ref="formRef">
    <v-select
      v-model="form.caseId"
      :items="caseOptions"
      item-value="value"
      item-title="title"
      label="Select Case"
      clearable
    />
    <v-select
      v-model="form.goalType"
      :items="goalTypes"
      label="Goal Type"
      :rules="[v => !!v || 'Goal type is required']"
      required
    />

    <v-text-field
      v-model.number="form.totalQuantity"
      label="Total Quantity"
      type="number"
      :rules="[v => !!v || 'Quantity is required']"
      required
    />

    <v-text-field
      v-model="form.deadline"
      label="Deadline"
      type="date"
      :rules="[v => !!v || 'Deadline is required']"
      required
    />

    <v-select
      v-model="form.orderStatus"
      :items="orderStatuses"
      label="Order Status"
      :rules="[v => !!v || 'Order status is required']"
      required
    />

    <v-text-field
      v-model.number="form.estimatedRevenue"
      label="Estimated Revenue (€)"
      type="number"
      :rules="[v => !!v || 'Estimated revenue is required']"
      required
    />
    <v-select
      v-model="form.assignedCallers"
      :items="agentOptions"
      item-value="value"
      item-title="title"
      label="Assign Callers"
      multiple
      chips
      closable-chips
      clearable
    />

    <v-btn type="submit" color="primary" class="mt-4">Create Order</v-btn>
  </v-form>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import axios from 'axios'
import urls from '../../js/config.js'

const form = reactive({
  caseId: '',
  goalType: '',
  totalQuantity: '',
  deadline: '',
  orderStatus: '',
  estimatedRevenue: '',
  assignedCallers: []
})

const cases = ref([])
const agents = ref([])
const formRef = ref(null)

const agentOptions = computed(() => agents.value.map(a => ({
  value: a._id,
  title: a.name
})))

const caseOptions = computed(() => cases.value.map(c => ({
  value: c._id,
  title: c.name
})))

const goalTypes = ['hours', 'interviews', 'meetings']
const orderStatuses = ['pending', 'in-progress', 'completed', 'cancelled', 'on-hold']

const submitForm = async () => {
  try {
    // Send a plain object (not a Proxy) to the backend
    console.log('Order created:', { ...form })
    await axios.post(`${urls.backEndURL}/orders/`, { ...form })

    // Reset form fields
    form.caseId = ''
    form.goalType = ''
    form.totalQuantity = ''
    form.deadline = ''
    form.orderStatus = ''
    form.estimatedRevenue = ''
    form.assignedCallers = []
  } catch (err) {
    console.error('Failed to create order:', err.response?.data || err.message)
  }
}

onMounted(async () => {
  try {
    const caseData = await axios.get(`${urls.backEndURL}/gcCases/`)
    console.log('Cases loaded:', caseData.data)
    cases.value = caseData.data
    const agentData = await axios.get(`${urls.backEndURL}/gcAgents/`)
    console.log('Agents loaded:', agentData.data)
    agents.value = agentData.data
     } catch (err) {
    console.error('Failed to load cases or agents:', err)
  }
})
</script>