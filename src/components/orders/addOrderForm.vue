<template>
  <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">  
    <h1 class="mb-3 mt-5">Add New Order</h1>
    <v-form ref="formRef" @submit.prevent="submitForm">
      <v-select
        v-model="form.caseId"
        :items="caseOptions"
        item-value="value"
        item-title="title"
        label="Select Case"
        clearable
      />

      <v-select
        v-model="form.caseUnit"
        :items="caseUnits"
        label="caseUnit"
        :rules="[v => !!v || 'Case Unit is required']"
        required
      />

      <v-text-field
        v-model.number="form.pricePerUnit"
        label="Price per Unit (€)"
        type="number"
        :rules="[v => !!v || 'Price per unit is required']"
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
  </div>  
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import axios from 'axios'
import urls from '../../js/config.js'

const form = reactive({
  caseId: '',
  caseUnit: '',
  pricePerUnit: '',
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

const caseUnits = ['hours', 'interviews', 'meetings']
const orderStatuses = ['pending', 'in-progress', 'completed', 'cancelled', 'on-hold']

const submitForm = async () => {
  try {
    // Find the selected case object
    const selectedCase = cases.value.find(c => c._id === form.caseId);
    // Add caseName to the payload
    const payload = {
      ...form,
      caseName: selectedCase ? selectedCase.name : ''
    };
    console.log('Order created:', payload);
    await axios.post(`${urls.backEndURL}/orders/`, payload);

    // Reset form fields
    form.caseId = '';
    form.caseUnit = '';
    form.totalQuantity = '';
    form.deadline = '';
    form.orderStatus = '';
    form.estimatedRevenue = '';
    form.assignedCallers = [];
  } catch (err) {
    console.error('Failed to create order:', err.response?.data || err.message);
  }
};

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

<style scoped>
  .v-form {
  width: 400px;
  max-width: 100%;
  margin: 0 auto;
}
.v-btn {
  margin-top: 20px;
}
.v-alert {
  margin-top: 20px;
  max-height: 4em;
}
.button-alert-container {
  display: flex;
  align-items: center; /* Align items vertically */
  margin-top: 20px;    /* Add spacing from inputs */
}
.ml-3 {
  margin-left: 12px; /* Space between button and alert */
}
</style>