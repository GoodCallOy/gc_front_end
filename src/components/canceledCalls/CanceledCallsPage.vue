<template>
  <v-container fluid>
    <v-card class="pa-4 mb-4" elevation="2">
      <h1 class="text-h4 mb-4">Canceled Meetings</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Track and view canceled meetings. Add new entries using the form below.
      </p>
    </v-card>

    <v-row>
      <v-col cols="12" md="5" lg="4">
        <CanceledCallsForm
          :edit-item="selectedItem"
          @submitted="fetchCanceledCalls"
          @clear-edit="selectedItem = null"
        />
      </v-col>
      <v-col cols="12" md="7" lg="8">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <span>Canceled Meetings List</span>
            <v-spacer />
            <v-btn
              icon
              variant="text"
              size="small"
              @click="fetchCanceledCalls"
            >
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
            <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
              {{ error }}
            </v-alert>
            <v-data-table
              v-else
              :headers="tableHeaders"
              :items="canceledCalls"
              :items-per-page="15"
              item-value="_id"
              class="elevation-0"
              density="comfortable"
              :row-props="(data) => ({ class: isRowSelected(data?.item?.raw ?? data?.item) ? 'bg-primary-container' : '' })"
              @click:row="selectRow"
            >
              <template #item.callDate="{ item }">
                {{ formatDate(getVal(getRow(item), 'callDate')) }}
              </template>
              <template #item.cancelDate="{ item }">
                {{ formatDate(getVal(getRow(item), 'cancelDate')) }}
              </template>
              <template #item.agent="{ item }">
                {{ getAgentName(getVal(getRow(item), 'agent')) }}
              </template>
              <template #item.company="{ item }">
                {{ getVal(getRow(item), 'company') || '—' }}
              </template>
              <template #item.phoneNumber="{ item }">
                {{ getVal(getRow(item), 'phoneNumber') || '—' }}
              </template>
              <template #item.contactPerson="{ item }">
                {{ getVal(getRow(item), 'contactPerson') || '—' }}
              </template>
              <template #item.case="{ item }">
                {{ getCaseName(getVal(getRow(item), 'case')) }}
              </template>
              <template #item.caseUnit="{ item }">
                {{ getVal(getRow(item), 'caseUnit') || '—' }}
              </template>
              <template #item.rebookAgent="{ item }">
                {{ getAgentName(getVal(getRow(item), 'rebookAgent')) || '—' }}
              </template>
              <template #item.rebookDate="{ item }">
                {{ formatDate(getVal(getRow(item), 'rebookDate')) || '—' }}
              </template>
              <template #item.attempts="{ item }">
                {{ getVal(getRow(item), 'attempts') ?? '—' }}
              </template>
              <template #item.comments="{ item }">
                {{ getVal(getRow(item), 'comments') || '—' }}
              </template>
              <template #item.no-data>
                <div class="text-center pa-6 text-medium-emphasis">
                  No canceled meetings recorded yet. Add one using the form on the left.
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import urls from '@/js/config.js'
import { useStore } from 'vuex'
import CanceledCallsForm from './CanceledCallsForm.vue'

const store = useStore()
const loading = ref(false)
const error = ref('')
const canceledCalls = ref([])
const selectedItem = ref(null)

function selectRow(event, { item }) {
  selectedItem.value = item?.raw ?? item
}

function isRowSelected(row) {
  if (!row || !selectedItem.value) return false
  const id = row._id ?? row.id
  const selId = selectedItem.value._id ?? selectedItem.value.id
  return id && selId && String(id) === String(selId)
}

const orders = computed(() => store.getters['orders'] || [])
const gcAgents = computed(() => store.getters['gcAgents'] || [])

const tableHeaders = [
  { title: 'Call Date', key: 'callDate', sortable: true, width: '100px' },
  { title: 'Cancel Date', key: 'cancelDate', sortable: true, width: '100px' },
  { title: 'Agent', key: 'agent', sortable: true },
  { title: 'Company', key: 'company', sortable: true },
  { title: 'Phone', key: 'phoneNumber', sortable: true },
  { title: 'Contact', key: 'contactPerson', sortable: true },
  { title: 'Case', key: 'case', sortable: true },
  { title: 'Case Unit', key: 'caseUnit', sortable: true },
  { title: 'Rebook Agent', key: 'rebookAgent', sortable: true },
  { title: 'Rebook Date', key: 'rebookDate', sortable: true, width: '100px' },
  { title: 'Attempts', key: 'attempts', sortable: true },
  { title: 'Comments', key: 'comments', sortable: false },
]

function formatDate(val) {
  if (!val) return '—'
  const d = typeof val === 'string' ? new Date(val) : val
  return isNaN(d.getTime()) ? val : d.toISOString().split('T')[0]
}

function getAgentName(agentRef) {
  if (!agentRef) return '—'
  if (typeof agentRef === 'object') {
    return agentRef?.name ?? agentRef?.username ?? '—'
  }
  const id = String(agentRef)
  const agent = (gcAgents.value || []).find((a) => String(a._id ?? a.id) === id)
  return agent?.name ?? agent?.username ?? '—'
}

function getCaseName(caseRef) {
  if (!caseRef) return '—'
  if (typeof caseRef === 'object') {
    return caseRef?.caseName ?? caseRef?.case ?? '—'
  }
  const id = String(caseRef)
  const order = (orders.value || []).find((o) => String(o._id ?? o.id) === id)
  return order?.caseName ?? '—'
}

function getRow(item) {
  return item?.raw ?? item
}

function getVal(row, camelKey) {
  if (!row) return null
  const snakeKey = camelKey.replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`)
  return row[camelKey] ?? row[snakeKey] ?? null
}

const SNAKE_TO_CAMEL = {
  call_date: 'callDate',
  cancel_date: 'cancelDate',
  phone_number: 'phoneNumber',
  contact_person: 'contactPerson',
  case_unit: 'caseUnit',
  rebook_agent: 'rebookAgent',
  rebook_date: 'rebookDate',
}

function normalizeRow(row) {
  if (!row || typeof row !== 'object') return row
  const out = { ...row }
  for (const [snake, camel] of Object.entries(SNAKE_TO_CAMEL)) {
    if (out[snake] !== undefined && out[camel] === undefined) out[camel] = out[snake]
  }
  return out
}

async function fetchCanceledCalls() {
  loading.value = true
  error.value = ''
  try {
    const res = await axios.get(`${urls.backEndURL}/canceledCalls`)
    const raw = Array.isArray(res.data) ? res.data : res.data?.data ?? []
    canceledCalls.value = raw.map(normalizeRow)
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || 'Failed to load canceled meetings.'
    canceledCalls.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await store.dispatch('fetchOrders')
  await store.dispatch('fetchgcAgents')
  await fetchCanceledCalls()
})
</script>
