<template>
  <div class="d-flex flex-column align-center" style="min-height: 100vh; padding: 20px;">  
    <h1 class="mb-6">{{ isEditMode ? 'Edit Case' : 'Add New Case' }}</h1>
    
    <v-form ref="formRef" @submit.prevent="submitForm">
      <v-autocomplete
        v-model="form.caseId"
        :items="caseOptions"
        item-value="value"
        item-title="title"
        label="Select Case"
        :rules="[v => !!v || 'Case selection is required']"
        required
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
        :rules="[v => (v === 0 || !!v) || 'Price per unit is required']"
        required
      />
      <v-text-field
        v-model.number="form.totalQuantity"
        label="Month goal"
        type="number"
        :rules="[v => (v === 0 || !!v) || 'Month goal is required']"
        required
      />

      <v-text-field
        v-model.number="form.campaignGoal"
        label="Campaign goal"
        type="number"
        min="0"
      />

      <v-text-field
        v-model="form.startDate"
        label="startDate"
        type="date"
        :rules="[v => !!v || 'Start date is required']"
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
        label="Case Status"
        :rules="[v => !!v || 'Case status is required']"
        required
      />

      <v-select
        v-model="form.caseType"
        :items="caseTypes"
        label="Case Type"
        :rules="[v => !!v || 'Case type is required']"
        required
      />

      <div class="d-flex align-center mb-2">
        <h3 class="text-subtitle-1 mr-4" style="margin: 0;">Enable Searched Phone Numbers</h3>
        <v-checkbox v-model="form.enableSearchedPhoneNumbers" hide-details density="comfortable" />
      </div>


      <v-text-field
        v-model.number="form.estimatedRevenue"
        label="Estimated Revenue (€)"
        type="number"
        :rules="[v => !!v || 'Estimated revenue is required']"
        required
      />

      <v-select
        v-model="form.managers"
        :items="agentOptions"
        item-value="value"
        item-title="title"
        label="Select Managers"
        multiple
        chips
        closable-chips
        clearable
      />

      <v-text-field
        v-model.number="form.ProjectStartFee"
        label="Project Start Fee (€)"
        type="number"
      />

      <v-text-field
        v-model.number="form.ProjectManagmentFee"
        label="Project Managment Fee (€)"
        type="number"
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
      <div v-if="form.assignedCallers.length" class="mt-4">
        <div>
          <strong>Assigned Goals: {{ assignedGoalsCount }} / {{ form.totalQuantity || 0 }}</strong>
        </div>
        <v-list>
          <v-list-item
            v-for="agentId in form.assignedCallers"
            :key="agentId"
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ agentName(agentId) }}
              </v-list-item-title>
            </v-list-item-content>
            <v-list-item-action>
              <v-text-field
                v-model.number="agentGoals[agentId]"
                label="Goal"
                type="number"
                min="0"
                style="max-width: 100px"
              />
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </div>
      <v-btn
        type="submit"
        color="primary"
        class="mt-4"
        :disabled="!isFormValid || isSubmitting"
        :loading="isSubmitting"
      >
        {{ isEditMode ? 'Update Case' : 'Create Case' }}
      </v-btn>
      <span class="ml-3" v-if="saveMessage">{{ saveMessage }}</span>

    </v-form>
    

  </div>  
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
import urls from '../../js/config.js'
import { watch } from 'vue'

// Props for edit mode
const props = defineProps({
  orderId: {
    type: String,
    default: null
  },
  editMode: {
    type: Boolean,
    default: false
  },
  id: {
    type: String,
    default: null
  }
})

// Computed property to determine if we're in edit mode
const isEditMode = computed(() => {
  // Check if we have an ID from route params or props
  const orderId = props.id || props.orderId;
  return (props.editMode || !!orderId) && orderId;
})

// Get the actual order ID to use
const actualOrderId = computed(() => props.id || props.orderId)

const form = reactive({
  caseId: '',
  caseUnit: '',
  pricePerUnit: '',
  totalQuantity: '',
  campaignGoal: null,
  startDate: '',
  deadline: '',
  orderStatus: '',
  caseType: '',
  enableSearchedPhoneNumbers: false,
  estimatedRevenue: '',
  managers: [],
  ProjectStartFee: '',
  ProjectManagmentFee: '',
  assignedCallers: []
})

const agentGoals = reactive({});

const cases = ref([])
const agents = ref([])
const formRef = ref(null)
const isSubmitting = ref(false)
const saveMessage = ref('')
const store = useStore()

watch(
  () => [form.pricePerUnit, form.totalQuantity],
  ([price, quantity]) => {
    const p = parseFloat(price)
    const q = parseFloat(quantity)
    form.estimatedRevenue = isNaN(p) || isNaN(q) ? '' : (p * q).toFixed(2)
  }
)

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
const caseTypes = computed(() => {
  const list = store.getters.caseTypes || []
  try { console.log('addOrderForm caseTypes computed:', list) } catch {}
  return list
})


const assignedGoalsCount = computed(() =>
  form.assignedCallers.reduce((sum, id) => sum + (Number(agentGoals[id]) || 0), 0)
);

// Check if all required fields are filled
const isFormValid = computed(() => {
  const hasBasicFields =
    form.caseId &&
    form.caseUnit &&
    form.startDate &&
    form.deadline &&
    form.orderStatus &&
    form.caseType &&
    form.estimatedRevenue;

  const hasPrice = form.pricePerUnit !== '' && !isNaN(form.pricePerUnit);
  const hasQuantity = form.totalQuantity !== '' && !isNaN(form.totalQuantity);

  return !!(hasBasicFields && hasPrice && hasQuantity);
});

const agentName = id => {
  const agent = agents.value.find(a => a._id === id);
  return agent ? agent.name : id;
};

// Method to load existing order data for editing
const loadOrderData = async (orderId) => {
  try {
    console.log('Loading order data for ID:', orderId);
    const response = await axios.get(`${urls.backEndURL}/orders/${orderId}`);
    const orderData = response.data;
    
    console.log('Order data loaded:', orderData);
    
    // Populate form with existing data
    form.caseId = orderData.caseId || '';
    form.caseUnit = orderData.caseUnit || '';
    form.pricePerUnit = orderData.pricePerUnit || '';
    form.totalQuantity = orderData.totalQuantity || '';
    form.campaignGoal = orderData.campaignGoal ?? orderData.campaign_goal ?? null;
    form.startDate = orderData.startDate ? orderData.startDate.split('T')[0] : '';
    form.deadline = orderData.deadline ? orderData.deadline.split('T')[0] : '';
    form.orderStatus = orderData.orderStatus || '';
    form.caseType = orderData.caseType || '';
    form.enableSearchedPhoneNumbers = orderData.enableSearchedPhoneNumbers || false;
    form.estimatedRevenue = orderData.estimatedRevenue || '';
    // managers can be array of ids or objects
    if (Array.isArray(orderData.managers)) {
      form.managers = orderData.managers.map(m => m.id || m._id || m)
    } else if (orderData.manager) {
      form.managers = [orderData.manager._id || orderData.manager.id || orderData.manager]
    } else {
      form.managers = []
    }
    form.ProjectStartFee = orderData.ProjectStartFee || orderData.projectStartFee || orderData.projectManagementFee || '';
    form.ProjectManagmentFee = orderData.ProjectManagmentFee || orderData.projectManagementFee || orderData.projectStartFee || '';
    form.assignedCallers = orderData.assignedCallers ? orderData.assignedCallers.map(caller => caller.id || caller) : [];
    
    // Load agent goals if they exist
    if (orderData.agentGoals) {
      Object.assign(agentGoals, orderData.agentGoals);
    }
    
  } catch (error) {
    console.error('Failed to load order data:', error);
  }
};

const submitForm = async () => {
  if (!isFormValid.value || isSubmitting.value) return;
  
  isSubmitting.value = true;
  
  try {
    // Find the selected case object
    const selectedCase = cases.value.find(c => c._id === form.caseId);
    // Add caseName to the payload
      const payload = {
      ...form,
      caseName: selectedCase ? selectedCase.name : '',
      agentGoals: { ...agentGoals },
        assignedCallers: form.assignedCallers.map(id => {
        const agent = agents.value.find(a => a._id === id);
        return agent ? { id, name: agent.name } : { id, name: '' };
        }),
        managers: (form.managers || []).map(id => {
          const agent = agents.value.find(a => a._id === id);
          return agent ? { id, name: agent.name } : { id, name: '' };
        })
    };

    if (isEditMode.value) {
      // Update existing order
      console.log('Updating order:', payload);
      await axios.put(`${urls.backEndURL}/orders/${actualOrderId.value}`, payload);
      console.log('Order updated successfully');
      saveMessage.value = 'Order updated successfully.'
    } else {
      // Create new order
      console.log('Creating order:', payload);
      await axios.post(`${urls.backEndURL}/orders/`, payload);
      console.log('Order created successfully');
      saveMessage.value = 'Order created successfully.'
      
      // Reset form fields only for new orders
      form.caseId = '';
      form.caseUnit = '';
      form.totalQuantity = '';
      form.campaignGoal = null;
      form.pricePerUnit = '';
      form.startDate = '';
      form.deadline = '';
      form.orderStatus = '';
      form.caseType = '';
      form.enableSearchedPhoneNumbers = false;
      form.estimatedRevenue = '';
      form.managers = [];
      form.ProjectStartFee = '';
      form.ProjectManagmentFee = '';
      form.assignedCallers = [];
    }
  } catch (err) {
    console.error(`Failed to ${isEditMode.value ? 'update' : 'create'} order:`, err.response?.data || err.message);
    saveMessage.value = `Failed to ${isEditMode.value ? 'update' : 'create'} order.`
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  try {
    console.log('Loading cases from:', `${urls.backEndURL}/gcCases/`)
    const caseData = await axios.get(`${urls.backEndURL}/gcCases/`)
    console.log('Cases loaded:', caseData.data)
    cases.value = caseData.data || []
    console.log('Cases array after setting:', cases.value)
    console.log('Case options computed:', caseOptions.value)
    
    console.log('Loading agents from:', `${urls.backEndURL}/gcAgents/`)
    const agentData = await axios.get(`${urls.backEndURL}/gcAgents/`)
    console.log('Agents loaded:', agentData.data)
    agents.value = agentData.data || []
    console.log('Agents array after setting:', agents.value)
    console.log('Agent options computed:', agentOptions.value)
    
    // Load case types from backend/local storage
    try { 
      console.log('Fetching case types from backend...')
      await store.dispatch('fetchCaseTypes') 
      console.log('Case types after fetch:', store.getters.caseTypes)
    } catch (e) {
      console.warn('Failed to fetch case types:', e)
    }

    // Load order data if in edit mode
    if (isEditMode.value) {
      await loadOrderData(actualOrderId.value);
    }
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