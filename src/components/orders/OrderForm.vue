<template>
  <div :class="modal ? 'order-form-modal' : 'order-form-page'">
    <h1 v-if="!modal" class="mb-6">
      {{ isEditMode ? t('assignGoals.modals.editOrder') : t('assignGoals.modals.addNewOrder') }}
    </h1>

    <v-form ref="formRef" :class="modal ? 'order-form-compact' : 'order-form-full'" @submit.prevent="submitForm">
      <v-autocomplete
        v-model="form.caseId"
        :items="caseOptions"
        item-value="value"
        item-title="title"
        :label="t('assignGoals.formLabels.selectCase')"
        :rules="[v => !!v || t('assignGoals.validation.caseUnitRequired')]"
        required
        clearable
      />

      <v-select
        v-model="form.caseUnit"
        :items="caseUnits"
        :label="t('assignGoals.formLabels.caseUnit')"
        :rules="[v => !!v || t('assignGoals.validation.caseUnitRequired')]"
        required
      />

      <v-text-field
        v-model.number="form.pricePerUnit"
        :label="t('assignGoals.formLabels.pricePerUnit')"
        type="number"
        :rules="[v => (v === 0 || !!v) || t('assignGoals.validation.pricePerUnitRequired')]"
        required
      />

      <v-text-field
        v-model.number="form.totalQuantity"
        :label="t('assignGoals.formLabels.totalQuantity')"
        type="number"
        :rules="[v => (v === 0 || !!v) || t('assignGoals.validation.quantityRequired')]"
        required
      />

      <v-text-field
        v-model.number="form.campaignGoal"
        :label="t('orderForm.campaignGoal')"
        type="number"
        min="0"
      />

      <v-text-field
        v-model="form.startDate"
        :label="t('assignGoals.formLabels.startDate')"
        type="date"
        :rules="[v => !!v || t('assignGoals.validation.startDateRequired')]"
        required
      />

      <v-text-field
        v-model="form.deadline"
        :label="t('assignGoals.formLabels.deadline')"
        type="date"
        :rules="[v => !!v || t('assignGoals.validation.deadlineRequired')]"
        required
      />

      <!-- Monthly revenue goals for multi-month orders -->
      <div v-if="monthlyGoalMonths.length" class="mt-4">
        <div class="text-subtitle-2 mb-2">{{ t('assignGoals.formLabels.monthlyRevenueGoals') }}</div>
        <v-row>
          <v-col v-for="month in monthlyGoalMonths" :key="month.monthKey" cols="12" sm="6">
            <v-text-field
              v-model.number="form.monthlyRevenueGoals[month.monthKey]"
              :label="`${month.year}-${String(month.month).padStart(2, '0')}`"
              type="number"
              min="0"
            />
          </v-col>
        </v-row>
      </div>

      <v-select
        v-model="form.orderStatus"
        :items="orderStatuses"
        :label="t('assignGoals.formLabels.orderStatus')"
        :rules="[v => !!v || t('assignGoals.validation.orderStatusRequired')]"
        required
      />

      <v-select
        v-model="form.caseType"
        :items="caseTypes"
        :label="t('assignGoals.formLabels.caseType')"
        :rules="[v => !!v || t('assignGoals.validation.caseTypeRequired')]"
        required
      />

      <div class="d-flex align-center mb-2">
        <h3 class="text-subtitle-1 mr-4" style="margin: 0;">{{ t('orderForm.enableSearchedPhoneNumbers') }}</h3>
        <v-checkbox v-model="form.enableSearchedPhoneNumbers" hide-details density="comfortable" />
      </div>

      <v-text-field
        :model-value="estimatedRevenue"
        :label="t('assignGoals.formLabels.estimatedRevenue')"
        type="number"
        readonly
      />

      <v-select
        v-model="form.managers"
        :items="managerOptions"
        item-value="value"
        item-title="title"
        :label="t('assignGoals.formLabels.selectManagers')"
        multiple
        chips
        closable-chips
        clearable
      />

      <v-text-field
        v-model.number="form.ProjectStartFee"
        :label="t('assignGoals.formLabels.projectStartFee')"
        type="number"
      />

      <v-text-field
        v-model.number="form.ProjectManagmentFee"
        :label="t('assignGoals.formLabels.projectManagementFee')"
        type="number"
      />

      <v-select
        v-model="form.assignedCallers"
        :items="agentOptions"
        item-value="value"
        item-title="title"
        :label="t('assignGoals.formLabels.assignCallers')"
        multiple
        chips
        closable-chips
        clearable
      />

      <div v-if="form.assignedCallers.length" class="mt-4">
        <div v-if="!modal">
          <strong>{{ t('orderForm.assignedGoals') }}: {{ assignedGoalsCount }} / {{ form.totalQuantity || 0 }}</strong>
        </div>
        <v-list>
          <v-list-item v-for="agentId in form.assignedCallers" :key="agentId">
            <v-list-item-content>
              <v-list-item-title>{{ agentName(agentId) }}</v-list-item-title>
            </v-list-item-content>
            <v-list-item-action class="d-flex flex-wrap" style="gap: 8px;">
              <v-text-field
                v-model.number="agentGoals[agentId]"
                :label="t('assignGoals.formLabels.goal')"
                type="number"
                min="0"
                style="max-width: 100px"
                density="compact"
              />
              <v-text-field
                v-model.number="agentRates[agentId]"
                :label="t('assignGoals.formLabels.rate')"
                type="number"
                min="0"
                style="max-width: 120px"
                density="compact"
              />
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </div>

      <div class="d-flex align-center mt-4" style="gap: 12px;">
        <v-btn
          type="submit"
          color="primary"
          :disabled="!isFormValid || isSubmitting"
          :loading="isSubmitting"
        >
          {{ isEditMode ? t('assignGoals.buttons.saveChanges') : t('assignGoals.buttons.createOrder') }}
        </v-btn>
        <v-btn v-if="modal" variant="text" @click="$emit('cancelled')">
          {{ t('assignGoals.buttons.close') }}
        </v-btn>
        <span v-if="!modal && saveMessage" class="ml-3">{{ saveMessage }}</span>
      </div>
    </v-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import urls from '@/js/config.js'
import { getOrderMonths } from '@/js/statsUtils'

const { t } = useI18n()
const store = useStore()

const props = defineProps({
  orderId: { type: String, default: null },
  initialOrder: { type: Object, default: null },
  prefill: { type: Object, default: null },
  defaultStartDate: { type: String, default: '' },
  defaultDeadline: { type: String, default: '' },
  modal: { type: Boolean, default: false }
})

const emit = defineEmits(['saved', 'cancelled'])

function getCurrentMonthDateRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const pad = (n) => String(n).padStart(2, '0')
  return {
    startDate: `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}`,
    deadline: `${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`
  }
}

const defaultFormState = () => {
  const { startDate, deadline } = getCurrentMonthDateRange()
  return {
    caseId: '',
    caseUnit: '',
    pricePerUnit: '',
    totalQuantity: '',
    campaignGoal: null,
    startDate,
    deadline,
    orderStatus: 'in-progress',
    caseType: 'Continuous case',
    enableSearchedPhoneNumbers: false,
    estimatedRevenue: '',
    managers: [],
    ProjectStartFee: '',
    ProjectManagmentFee: '',
    assignedCallers: [],
    monthlyRevenueGoals: {}
  }
}

const form = reactive(defaultFormState())
const agentGoals = reactive({})
const agentRates = reactive({})
const cases = ref([])
const agents = ref([])
const formRef = ref(null)
const isSubmitting = ref(false)
const saveMessage = ref('')

const isEditMode = computed(() => !!props.orderId)
const actualOrderId = computed(() => props.orderId)

const caseUnits = ['hours', 'interviews', 'meetings', 'a-leads']
const orderStatuses = ['pending', 'in-progress', 'completed', 'cancelled', 'on-hold']
const caseTypes = computed(() => store.getters.caseTypes || [])
const agentOptions = computed(() => (agents.value || []).map(a => ({ value: a._id, title: a.name })))
const managerOptions = computed(() =>
  (agents.value || []).filter(a => {
    const role = (a.role || '').toLowerCase()
    return role === 'admin' || role === 'manager'
  }).map(a => ({ value: a._id, title: a.name }))
)
const caseOptions = computed(() => (cases.value || []).map(c => ({ value: c._id, title: c.name })))

const estimatedRevenue = computed(() => {
  const p = parseFloat(form.pricePerUnit)
  const q = parseFloat(form.totalQuantity)
  return isNaN(p) || isNaN(q) ? '' : (p * q).toFixed(2)
})

watch(estimatedRevenue, (val) => { form.estimatedRevenue = val })

const assignedGoalsCount = computed(() =>
  (form.assignedCallers || []).reduce((sum, id) => sum + (Number(agentGoals[id]) || 0), 0)
)

const monthlyGoalMonths = computed(() => {
  if (!form.startDate || !form.deadline) return []
  try {
    return getOrderMonths({ startDate: form.startDate, deadline: form.deadline })
  } catch {
    return []
  }
})

const isFormValid = computed(() => {
  const hasBasic = form.caseId && form.caseUnit && form.startDate && form.deadline &&
    form.orderStatus && form.caseType && form.estimatedRevenue
  const hasPrice = form.pricePerUnit !== '' && !isNaN(form.pricePerUnit)
  const hasQuantity = form.totalQuantity !== '' && !isNaN(form.totalQuantity)
  return !!(hasBasic && hasPrice && hasQuantity)
})

function agentName(id) {
  const a = (agents.value || []).find(x => (x._id ?? x.id) === id)
  return a ? a.name : id
}

function resetForm() {
  Object.assign(form, defaultFormState())
  Object.keys(agentGoals).forEach(k => { agentGoals[k] = 0 })
  Object.keys(agentRates).forEach(k => { agentRates[k] = 0 })
}

function hydrateFromOrder(o) {
  if (!o) return
  form.caseId = o.caseId || ''
  form.caseUnit = o.caseUnit || ''
  form.pricePerUnit = o.pricePerUnit ?? ''
  form.totalQuantity = o.monthlyGoal ?? o.totalQuantity ?? ''
  form.campaignGoal = o.campaignGoal ?? o.campaign_goal ?? null
  form.startDate = o.startDate ? String(o.startDate).split('T')[0] : ''
  form.deadline = o.deadline ? String(o.deadline).split('T')[0] : ''
  form.orderStatus = o.orderStatus || ''
  form.caseType = o.caseType || ''
  form.enableSearchedPhoneNumbers = o.enableSearchedPhoneNumbers || false
  form.estimatedRevenue = o.estimatedRevenue ?? ''
  form.ProjectStartFee = o.ProjectStartFee ?? o.projectStartFee ?? ''
  form.ProjectManagmentFee = o.ProjectManagmentFee ?? o.projectManagementFee ?? ''
  form.monthlyRevenueGoals = { ...(o.monthlyRevenueGoals || {}) }

  if (Array.isArray(o.managers)) {
    form.managers = o.managers.map(m => m?.id ?? m?._id ?? m).filter(Boolean)
  } else if (o.manager) {
    form.managers = [o.manager._id ?? o.manager.id ?? o.manager]
  } else {
    form.managers = []
  }

  const assignedIds = [...new Set(
    (o.assignedCallers || []).map(x => String(x?._id ?? x?.id ?? x))
  )]
  form.assignedCallers = assignedIds

  const goals = o.agentGoals || {}
  const rates = o.agentRates || o.agentPrices || {}
  assignedIds.forEach(id => {
    agentGoals[id] = Number(goals[id]) || 0
    agentRates[id] = Number(rates[id]) || 0
  })
}

function hydrateFromPrefill(p) {
  if (!p) return
  Object.keys(p).forEach(k => {
    if (k in form && p[k] !== undefined) form[k] = p[k]
  })
  if (p.agentGoals) Object.assign(agentGoals, p.agentGoals)
  if (p.agentRates) Object.assign(agentRates, p.agentRates)
}

async function loadOrderData(orderId) {
  try {
    const { data } = await axios.get(`${urls.backEndURL}/orders/${orderId}`)
    hydrateFromOrder(data)
  } catch (err) {
    console.error('Failed to load order:', err)
  }
}

async function submitForm() {
  if (!isFormValid.value || isSubmitting.value) return
  isSubmitting.value = true
  saveMessage.value = ''

  try {
    const selectedCase = (cases.value || []).find(c => (c._id ?? c.id) === form.caseId)
    const { totalQuantity, ...formRest } = form
    const payload = {
      ...formRest,
      monthlyGoal: totalQuantity,
      caseName: selectedCase ? selectedCase.name : '',
      agentGoals: { ...agentGoals },
      agentRates: { ...agentRates },
      agentPrices: { ...agentRates },
      estimatedRevenue: estimatedRevenue.value,
      assignedCallers: (form.assignedCallers || []).map(id => {
        const agent = (agents.value || []).find(a => (a._id ?? a.id) === id)
        return { id, name: agent ? agent.name : '' }
      }),
      managers: (form.managers || []).map(id => {
        const agent = (agents.value || []).find(a => (a._id ?? a.id) === id)
        return { id, name: agent ? agent.name : '' }
      })
    }

    if (isEditMode.value) {
      await axios.put(`${urls.backEndURL}/orders/${actualOrderId.value}`, payload)
      saveMessage.value = t('orderForm.orderUpdated')
    } else {
      await axios.post(`${urls.backEndURL}/orders/`, payload)
      saveMessage.value = t('orderForm.orderCreated')
      if (!props.modal) resetForm()
    }

    emit('saved')
  } catch (err) {
    console.error('Failed to save order:', err)
    saveMessage.value = t('orderForm.saveFailed')
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => [props.orderId, props.initialOrder, props.prefill],
  async ([orderId, initialOrder, prefill]) => {
    if (orderId && initialOrder) {
      hydrateFromOrder(initialOrder)
    } else if (orderId) {
      await loadOrderData(orderId)
    } else if (prefill) {
      resetForm()
      hydrateFromPrefill(prefill)
      if (props.defaultStartDate) form.startDate = props.defaultStartDate
      if (props.defaultDeadline) form.deadline = props.defaultDeadline
    } else {
      resetForm()
      if (props.defaultStartDate) form.startDate = props.defaultStartDate
      if (props.defaultDeadline) form.deadline = props.defaultDeadline
    }
  },
  { immediate: true }
)

onMounted(async () => {
  try {
    const [caseData, agentData] = await Promise.all([
      axios.get(`${urls.backEndURL}/gcCases/`),
      axios.get(`${urls.backEndURL}/gcAgents/`)
    ])
    cases.value = caseData.data || []
    agents.value = agentData.data || []
    await store.dispatch('fetchCaseTypes').catch(() => {})
  } catch (err) {
    console.error('Failed to load data:', err)
  }
})
</script>

<style scoped>
.order-form-page .v-form { width: 400px; max-width: 100%; margin: 0 auto; }
.order-form-modal .v-form { width: 100%; max-width: 600px; }
.order-form-compact { width: 100%; }
.order-form-full { width: 400px; max-width: 100%; margin: 0 auto; }
</style>
