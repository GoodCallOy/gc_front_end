<template>
  <v-container fluid style="width: 90%;">
    <v-card elevation="1" class="mb-4">
        <div class="d-flex align-center justify-space-around">

            <v-btn color="primary" @click="openAddAgentModal">
                Add Agent
            </v-btn>

            <v-btn color="primary" @click="openAddCaseModal">
                Add Case
            </v-btn>

            <!-- Date Range Display (center) -->
            <div class="d-flex align-center">
                <v-btn icon flat class="pa-0 ma-0" @click="getPreviousMonth">
                <v-icon>mdi-chevron-left</v-icon>
                </v-btn>
                <div class="text-h6 font-weight-medium mx-3">{{ getFormattedDateRange() }}</div>
                <v-btn icon flat @click="getNextMonth">
                <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
            </div>

            <v-btn color="primary" @click="openAddOrderModal">
                Add Order
            </v-btn>

            <v-btn
                color="secondary"
                :disabled="!selectedOrder"
                @click="openEditOrderModal"
            >
                Edit Order
            </v-btn>
        </div>
    </v-card>

    <v-row>
      <!-- Orders Table -->
      <v-col cols="7">
        <v-data-table
          v-if="orders && orders.length"
          :headers="orderHeaders"
          :items="filteredSortedOrders"
          item-value="_id"
          class="elevation-1"
          :items-per-page="20"
          :item-class="({ item }) => item._id === selectedOrderId ? 'selected-row' : ''"
          @click:row="selectOrder"
        >
          <template #item.goalsDistributed="{ item }">
            {{ getDistributedGoals(item) }}
          </template>

          <template #item.edit="{ item }">
            <v-icon
              style="cursor: pointer;"
              color="grey"
              class="mr-2"
              @click.stop="selectOrderForEdit(item)"
            >
              mdi-pencil
            </v-icon>
          </template>

          <template #item.actions="{ item }">
            <v-icon
              style="cursor: pointer;"
              color="grey"
              class="mr-2"
              @click.stop="deleteOrder(item._id)"
            >
              mdi-delete
            </v-icon>
          </template>
        </v-data-table>

      </v-col>

      <!-- Agent Assignment -->
     <!-- Agent Assignment -->
<v-col cols="5" class="pa-4">
  <h3 class="text-h6 mb-2">
    Assign Goals for ({{ selectedOrder && selectedOrder.caseName || 'No order selected' }})
  </h3>

  <v-col v-if="selectedOrder?.agentSummary?.length" cols="12" class="pa-0">
    <v-row>
      <v-col
        v-for="agent in selectedOrder.agentSummary"
        :key="agent.id"
        cols="12"
        class="mb-3"
      >
        <v-card outlined>
          <v-row no-gutters>
            <!-- Left: name + input -->
            <v-col cols="5" class="pa-4">
              <div class="text-subtitle-1 font-weight-medium mb-2">
                {{ agent.name }}
              </div>
              <v-text-field
                v-model.number="agent.goalForThisOrder"
                type="number"
                dense
                hide-details
                label="Goal"
                style="max-width: 100px;"
              />
            </v-col>

            <!-- Right: monthly/other orders -->
            <v-col cols="7" class="pa-4">
              <div class="text-caption mb-1 text-grey">This month:</div>
              <div class="mb-2">
                {{ agent.goalForThisOrder }} total goals
              </div>

              <div class="text-caption mb-1 text-grey">Other orders:</div>
              <ul class="pl-3">
                <li
                  v-for="o in agent.AgentOrders"
                  :key="o.orderId || o._oid || o.name"
                >
                  {{ o.caseName || o.name }} – {{ o.goal }}
                  <span v-if="o.pricePerUnit">
                    ({{ (o.goal * o.pricePerUnit).toLocaleString(undefined, { style: 'currency', currency: 'EUR' }) }})
                  </span>
                </li>
              </ul>

              <div class="mt-2 font-bold">
                Total revenue across all orders:
                {{ agent.monthRevenueFormatted || currency(agent.monthRevenue || 0) }}
              </div>
            </v-col>
            <v-btn
  color="primary"
  class="mt-4"
  :disabled="!hasGoalChanges || savingGoals"
  :loading="savingGoals"
  @click="submitGoals"
>
  Save goals
</v-btn>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-col>

  <div v-else class="text-grey pa-4">No agents assigned to this order.</div>
</v-col>
    </v-row>
  </v-container>

  <!-- Modals -->
    <v-dialog v-model="showAddOrderModal" max-width="600">
    <v-card>
        <v-card-title>
            {{ isEditMode ? 'Edit Order' : 'Add New Order' }}
        </v-card-title>
        <v-card-text>
        <!-- Your add order form goes here -->

        <div class="d-flex flex-column align-center" style="justify-content: center; overflow-y: auto;">
        <v-form ref="formRef" style="width: 60%;" @submit.prevent="submitOredrForm">
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
            label="Order Status"
            :rules="[v => !!v || 'Order status is required']"
            required
        />

        <v-text-field
            :model-value="estimatedRevenue"
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
        <div v-if="form.assignedCallers.length" class="mt-4">
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
        <v-btn type="submit" color="primary" class="mt-4">
            {{ isEditMode ? 'Save Changes' : 'Create Order' }}
        </v-btn>
        </div>

        </v-form>


    </div>

        </v-card-text>
        <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeAddOrderModal">Close</v-btn>
        </v-card-actions>
    </v-card>
    </v-dialog>

    <v-dialog v-model="showAddAgentModal" max-width="600">
    <v-card>
        <v-card-title>Add Agent</v-card-title>
        <v-card-text>
        <div class="d-flex flex-column align-center" style="justify-content: center;">
            <v-form ref="agentForm" style="width: 60%;" @submit.prevent="submitAgentForm">
                <v-text-field
                    v-model="agent.name"
                    label="Name"
                    :rules="[v => !!v || 'Name is required']"
                    required
                />

                <v-text-field
                    v-model="agent.email"
                    label="Email"
                    :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Email must be valid']"
                    required
                />

                <v-select
                    v-model="agent.role"
                    :items="roles"
                    label="Role"
                    :rules="[v => !!v || 'Role is required']"
                    required
                />

                <v-switch
                    v-model="agent.active"
                    label="Active"
                />

                <v-btn type="submit" color="primary">Add Agent</v-btn>
                <v-alert
                    v-if="message"
                    :type="alertType"
                    class="ml-3"
                    dense
                    dismissible>
                    {{ message }}
                    </v-alert>
            </v-form>
        </div>
        </v-card-text>
        <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeAddAgentModal">Close</v-btn>
        </v-card-actions>
    </v-card>
    </v-dialog>

    <v-dialog v-model="showAddCaseModal" max-width="600">
    <v-card>
        <v-card-title>Add Case</v-card-title>
        <v-card-text>
        <!-- Your edit case form goes here -->
        <div class="d-flex flex-column align-center">
            <v-form ref="caseForm" style="width: 60%;" @submit.prevent="submitCaseForm">
                <v-text-field
                    v-model="gcCase.name"
                    label="Case Name"
                    :rules="[v => !!v || 'Name is required']"
                    required
                />

                <v-text-field
                    v-model="gcCase.contactInfo.contactName"
                    label="Contact Name"
                />

                <v-text-field
                    v-model="gcCase.contactInfo.contactTitle"
                    label="Contact Title"
                />

                <v-text-field
                    v-model="gcCase.contactInfo.email"
                    label="Email"
                    :rules="[v => !v || /.+@.+\..+/.test(v) || 'Invalid email']"
                />

                <v-btn type="submit" color="primary">Add Case</v-btn>
            </v-form>
        </div>
        </v-card-text>
        <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeAddCaseModal">Close</v-btn>
        </v-card-actions>
    </v-card>
    </v-dialog>
</template>




<script setup>
import { ref, onMounted, computed, reactive, watch, toRaw } from 'vue'

import { useStore } from 'vuex'
import { goToNextMonth, goToPreviousMonth, formattedDateRange, isCurrentMonth } from '@/js/dateUtils';
import axios from 'axios'
import urls from '@/js/config.js'

const store = useStore()
const formRef = ref(null)
const agentGoals = reactive({});
const agentForm = ref(null);
const caseForm = ref(null);
const selectedOrder = ref(null)
const selectedOrderId = ref(null)
const isEditMode = ref(false);

const showEditOrderModal = ref(false);
const showAddCaseModal = ref(false);
const showAddAgentModal = ref(false);
const showAddOrderModal = ref(false);


async function fetchAllData() {
  await store.dispatch('fetchOrders', true); // force fetch
  await store.dispatch('fetchgcAgents', true); // force fetch
  await store.dispatch('fetchGcCases', true); // force fetch
}


const orders = computed(() => store.getters['orders'])
const gcAgents = computed(() => store.getters['gcAgents'])
const agents = gcAgents
const currentDateRange = computed(() => store.getters['currentDateRange'])
const cases = computed(() => store.getters['cases'])
const roles = ['admin', 'caller', 'manager']
const message = ref('')
const alertType = ref('success') // 'success' or 'error'

const orderHeaders = ([
  { title: 'Case Name', key: 'caseName' },
  { title: 'Total Goals', key: 'totalQuantity' },
  { title: 'Goals Distributed', key: 'goalsDistributed', sortable: false },
  { title: 'Price Unit', key: 'caseUnit' },
  { title: 'Edit', key: 'edit', sortable: false },
  { title: 'Delete', key: 'actions', sortable: false }
])

const agent = ref({
  name: '',
  email: '',
  role: '',
  active: true
})

const gcCase = ref({
  name: '',
  contactInfo: {
    contactName: '',
    contactTitle: '',
    email: ''
  }
})

const defaultForm = () => ({
  caseId: null,
  caseUnit: null,
  pricePerUnit: 0,
  totalQuantity: 0,
  startDate: '',
  deadline: '',
  orderStatus: null,
  assignedCallers: []
})

const form = ref(defaultForm())

const estimatedRevenue = computed(() => {
  const price = Number(form.value?.pricePerUnit ?? 0)
  const qty = Number(form.value?.totalQuantity ?? 0)
  return price * qty
})

// If you also want to keep `form.estimatedRevenue` synced:
watch(estimatedRevenue, (val) => {
  form.value.estimatedRevenue = val
})

const hasGoalChanges = computed(() => {
  const ord = selectedOrder.value;
  if (!ord || !ord.agentSummary) return false;

  const original = ord.agentGoals || {};
  return ord.agentSummary.some(a => {
    const newVal = Number(a.goalForThisOrder) || 0;
    const oldVal = Number(original[a.id]) || 0;
    return newVal !== oldVal;
  });
});

const selectOrderForEdit = (item) => {
  selectedOrderId.value = item._id
  selectedOrder.value = item;
  openEditOrderModal();
}

const getFormattedDateRange = () => {
    return formattedDateRange(currentDateRange.value);
}

const getIsCurrentMonth = () => {
    return isCurrentMonth(currentDateRange.value)
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
    store.commit('setDateRange', newRange); // Use the correct mutation name
}

const getCurrentMonthDateRange = () => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const format = (date) => date.toISOString().split('T')[0]
  return [format(firstDay), format(lastDay)]
}


const getAgentMonthlyGoalTotals = async (order) => {

const { data } = await axios.get(
  `${urls.backEndURL}/orders/agent-revenue`,
  { params: { from: '2025-08-01', to: '2025-08-31' } }
)

  // const totals = {}
  // console.log('order in month total:', order)
  // // Build a lookup from agentId to agentName
  // const agentNameById = {}
  // agents.value.forEach(agent => {
  //   agentNameById[agent._id] = agent.name
  // })

  // const now = new fctDate()
  // const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  // const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // console.log('Calculating monthly goal totals for range:', firstDay, lastDay, 'for orders:', orders.value.length)

  // orders.value.forEach(order => {
  //   const orderDate = new Date(order.startDate || order.deadline)
  //   if (orderDate >= firstDay && orderDate <= lastDay && order.agentGoals) {
  //     for (const [agentId, goal] of Object.entries(order.agentGoals)) {
  //       if (!totals[agentId]) {
  //         totals[agentId] = {
  //           totalGoals: 0,
  //           agentName: agentNameById[agentId] || 'Unknown Agent',
  //           orders: []
  //         }
  //       }

  //       totals[agentId].totalGoals += goal

  //       const orderName = order.caseName || order._id || 'Unnamed Order'

  //       // Avoid duplicates – check if order already exists for this agent
  //       const existing = totals[agentId].orders.find(o => o.name === orderName)
  //       if (!existing) {
  //         totals[agentId].orders.push({ name: orderName, goal })
  //       } else {
  //         existing.goal += goal // just in case multiple entries exist for same order
  //       }
  //     }
  //   }
  // })

  return data
}

const filteredSortedOrders = computed(() => {

  if (!orders.value || !orders.value.length || !currentDateRange.value || !currentDateRange.value.length) return [];

  // Use the first date in the range as the "current" date
  const currentDate = new Date(currentDateRange.value[0]);

  return orders.value
    .filter(order => {
      const start = new Date(order.startDate);
      const end = new Date(order.deadline);
      return start <= currentDate && end >= currentDate;
    })
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
});

function toDateInputString(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  // Pad month and day with leading zeros
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function openAddOrderModal() {
  form.value = defaultForm()
  Object.keys(agentGoals).forEach(k => agentGoals[k] = 0)
  isEditMode.value = false
  showAddOrderModal.value = true
}

function openAddAgentModal() {
  resetAgentForm();
  showAddAgentModal.value = true;
}

function openAddCaseModal() {
  resetCaseForm();
  showAddCaseModal.value = true;
}

function openEditOrderModal() {
  if (!selectedOrder.value) return

  // reset form first
  form.value = {
    ...defaultForm(),
    ...{
      caseId: selectedOrder.value.caseId,
      caseUnit: selectedOrder.value.caseUnit,
      pricePerUnit: selectedOrder.value.pricePerUnit,
      totalQuantity: selectedOrder.value.totalQuantity,
      startDate: toDateInputString(selectedOrder.value.startDate),
      deadline: toDateInputString(selectedOrder.value.deadline),
      orderStatus: selectedOrder.value.orderStatus,
      assignedCallers: [...(selectedOrder.value.assignedCallers || [])]
    }
  }

  // reset agentGoals
  Object.keys(agentGoals).forEach(k => agentGoals[k] = 0)
  if (selectedOrder.value.agentGoals) {
    for (const [agentId, value] of Object.entries(selectedOrder.value.agentGoals)) {
      agentGoals[agentId] = value
    }
  }

  isEditMode.value = true
  showAddOrderModal.value = true
}

function closeAddOrderModal() {
  showAddOrderModal.value = false;
}

function closeAddAgentModal() {
  showAddAgentModal.value = false;
}

function closeAddCaseModal() {
  showAddCaseModal.value = false;
}

const getDistributedGoals = (order) => {
  return Object.values(order.agentGoals || {}).reduce((sum, val) => sum + val, 0)
}

const getOrderPrice = async (orderId) => {
  const list = (typeof orders !== 'undefined' && orders.value) ? orders.value : [];
  const orderPrice = list.find(x => x._id === orderId);
  return Number(orderPrice?.pricePerUnit) || 0;
};

const currency = v =>
  (new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' })).format(v || 0);


async function fetchAgentRevenueAggregates(fromDate, toDate) {

  const from = new Date(fromDate).toISOString();
  const to   = new Date(toDate).toISOString();

  const stats = await axios.get(`${urls.backEndURL}/orders/agent-revenue`, {
      params: { from, to },
      Status: () => true, 
    });
  console.log('Aggregates:', stats.data);

  return stats.data;
  
}

function monthBoundsFrom(dateLike) {
  const d = new Date(dateLike);
  const from = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const to   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

function overlapsMonth(order, from, to) {
  const s = new Date(order.startDate);
  const e = new Date(order.deadline);
  return s <= to && e >= from;
}

function agentMonthlyStats(agentId, from, to, allOrders) {
  let revenue = 0;
  let ordersCount = 0;

  for (const o of allOrders) {
    if (!overlapsMonth(o, from, to)) continue;

    const assigned = (o.assignedCallers ?? []).map(x => String(x));
    if (!assigned.includes(String(agentId))) continue;

    const price = Number(o.pricePerUnit) || 0;
    const goal  = Number((o.agentGoals ?? {})[agentId]) || 0;

    revenue += price * goal;
    ordersCount += 1;
  }
  return { revenue, orders: ordersCount };
}

// assumes you have: agents (list of agent docs), allOrders (list of all orders), currency() formatter
const selectOrder = async (order, event) => {
  const item = event?.item ?? order;

  selectedOrderId.value = item._id;
  selectedOrder.value = item;

  console.log('Selected order:', item);
  console.log('Selected order ID:', selectedOrderId.value);

  // clear local goals cache
  Object.keys(agentGoals).forEach(k => (agentGoals[k] = 0));

  // full-month window from the order's start date
  const { from, to } = monthBoundsFrom(item.startDate);

  console.log('Calculating goals for order:', item._id, 'from', from, 'to', to);
  
  const agentStats = await fetchAgentRevenueAggregates(from, to);
  console.log('Agent stats:', agentStats);
  
  selectedOrder.value.agentSummary = [];

  const orderId   = String(selectedOrder.value._id);
  const price     = Number(selectedOrder.value.pricePerUnit) || 0;
  const goalsObj  = selectedOrder.value.agentGoals || {};
  const assignedIds = [...new Set(
    (selectedOrder.value.assignedCallers || []).map(x => String(x?._id ?? x?.id ?? x))
  )];

  // build a fast lookup from agentStats
  const statsAgents = agentStats?.agents || [];
  const byId = new Map(statsAgents.map(a => [ String(a.agentId), a ]));

  // build agentSummary only for agents on this order
  selectedOrder.value.agentSummary = assignedIds.map(agentId => {
    const bucket = byId.get(agentId);               // this agent’s month bucket (may be undefined)
    const name   = bucket?.agentName || 'Unknown Agent';
    const AgentOrders =  bucket?.orders || {};     

  
    const goalForThisOrder = Number(goalsObj[agentId]) || 0;

    // prefer the order entry from bucket.orders if present; fallback to goal*price
    const orderEntry = bucket?.orders?.find(o => String(o.orderId) === orderId);
    const revenueForThisOrder = Number(orderEntry?.revenue) || (goalForThisOrder * price);

    return {
      AgentOrders: AgentOrders,
      id: agentId,
      name,
      goalForThisOrder,
      revenueForThisOrder,
      revenueForThisOrderFormatted: currency(revenueForThisOrder),

      // optional: include month totals from the stats bucket
      monthRevenue: Number(bucket?.totals?.revenue ?? bucket?.totalRevenue) || 0,
      monthOrders:  Number(bucket?.totals?.orders)  || (bucket?.orders?.length ?? 0),
    };
  });

  console.log('Agent summary:', selectedOrder.value.agentSummary);
};



const deleteOrder = async (orderId) => {
  const confirmDelete = confirm('Are you sure you want to delete this order?')
  if (!confirmDelete) return

  await axios.delete(`${urls.backEndURL}/orders/${orderId}`)
  await fetchAllData();
  if (selectedOrder.value && selectedOrder.value._id === orderId) {
    selectedOrder.value = null
  }
}

const assignGoals = async () => {
  if (!selectedOrder.value) return;
  try {
    // Prepare the updated order object
    const updatedOrder = {
      ...selectedOrder.value,
      agentGoals: { ...agentGoals }
    };
    // Send the update request
    console.log('Updating order with goals:', updatedOrder);
    await axios.put(`${urls.backEndURL}/orders/${selectedOrder.value._id}`, updatedOrder);
    // Optionally refresh orders here if needed
    await fetchAllData();
     // Reselect the updated order from the new orders array
    const updated = orders.value.find(o => o._id === selectedOrder.value._id);
    if (updated) selectedOrder.value = updated;
  } catch (err) {
    console.error('Failed to update order:', err.response?.data || err.message);
    alert('Failed to save goals!');
  }
};

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

const assignedGoalsCount = computed(() =>
  form.assignedCallers.reduce((sum, id) => sum + (Number(agentGoals[id]) || 0), 0)
);

const agentName = id => {
  const agent = agents.value.find(a => a._id === id);
  return agent ? agent.name : id;
};

const resetForm = () => {
  form.caseId = '';
  form.caseUnit = '';
  form.totalQuantity = '';
  form.pricePerUnit = '';
  form.startDate = '';
  form.deadline = '';
  form.orderStatus = '';
  form.estimatedRevenue = '';
  form.assignedCallers = [];
  Object.keys(agentGoals).forEach(k => agentGoals[k] = 0);
};

function resetAgentForm() {
  agent.value = {
    name: '',
    email: '',
    role: '',
    active: true
  };
  message.value = '';
  alertType.value = 'success';
}

function resetCaseForm() {
  gcCase.value = {
    name: '',
    contactInfo: {
      contactName: '',
      contactTitle: '',
      email: ''
    }
  };
}

const submitOredrForm = async () => {
  try {
    const selectedCase = cases.value.find(c => c._id === form.value.caseId)

    const payload = {
      ...toRaw(form.value), // remove Vue reactivity
      estimatedRevenue: estimatedRevenue.value, // ensure computed is included
      caseName: selectedCase ? selectedCase.name : '',
      agentGoals: { ...agentGoals }
    }

    if (isEditMode.value && selectedOrder.value) {
      // Edit mode: update the order
      console.log('Updating order:', selectedOrder.value._id, payload)
      await axios.put(`${urls.backEndURL}/orders/${selectedOrder.value._id}`, {
        ...toRaw(selectedOrder.value),
        ...payload
      })
    } else {
      // Add mode: create a new order
      await axios.post(`${urls.backEndURL}/orders/`, payload)
    }

    await fetchAllData()

    if (isEditMode.value && selectedOrder.value) {
      const updated = orders.value.find(o => o._id === selectedOrder.value._id)
      if (updated) selectedOrder.value = updated
    }

    resetForm()
    closeAddOrderModal()
  } catch (err) {
    console.error('Failed to save order:', err.response?.data || err.message)
  }
}

const submitAgentForm = async () => {
  const me = this;
  try {
    const response = await axios.post(`${urls.backEndURL}/gcAgents/`, agent.value)
    console.log('Agent added:', response.data)
    // reset form
    resetAgentForm()
    closeAddAgentModal();
    me.alertType = "success";
    setTimeout(() => {
            me.message = "";
    }, 3000);
  } catch (err) {
    console.error('Error adding agent:', err.response?.data || err.message)
  }
}

const submitCaseForm = async () => {
  try {
     const response = await axios.post(`${urls.backEndURL}/gcCases/`, {
      name: gcCase.value.name,
      contactInfo: gcCase.value.contactInfo
    })
    console.log('Case added:', response.data)
    // reset form
    resetCaseForm()
    closeAddCaseModal();
  } catch (err) {
    console.error(err)
    console.log('Failed in adding case.', err)
  }
}


onMounted(async () => {

  await fetchAllData()
  console.log('orders:', orders.value);

  if (!currentDateRange || currentDateRange.length < 2) {
      const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1); // First day of the current month
      const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0); // Last day of the current month

      updateDateRange([startDate, endDate]); // Set the default date range
    }
    console.log('filteredSortedOrders',filteredSortedOrders.value)

})

</script>
<style>
  ::v-deep(.selected-row) {
    background-color: #e0f7fa !important; /* light blue */
  }
</style>