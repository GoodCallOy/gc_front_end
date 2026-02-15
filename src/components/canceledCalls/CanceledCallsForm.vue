<template>
  <v-card class="pa-4" elevation="2">
    <v-card-title class="text-h6 mb-4 d-flex align-center">
      {{ editingId ? 'Edit Canceled Call' : 'Add Canceled Call' }}
      <v-spacer />
      <v-btn
        v-if="editingId"
        variant="text"
        size="small"
        @click="clearForNew"
      >
        Clear (Add New)
      </v-btn>
    </v-card-title>
    <v-form ref="formRef" v-model="formValid" @submit.prevent="submitForm">
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.callDate"
            label="Call Date"
            type="date"
            :rules="[(v) => !!v || 'Call date is required']"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.cancelDate"
            label="Cancel Date"
            type="date"
            :rules="[(v) => !!v || 'Cancel date is required']"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.agent"
            :items="activeGcAgents"
            item-title="name"
            :item-value="(a) => a._id ?? a.id"
            label="Agent"
            :rules="[(v) => !!v || 'Agent is required']"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.company"
            label="Company"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.phoneNumber"
            label="Phone Number"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.contactPerson"
            label="Contact Person"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.caseId"
            :items="caseOptions"
            item-title="caseName"
            :item-value="(o) => o._id ?? o.id"
            label="Case"
            density="comfortable"
            clearable
            @update:model-value="onCaseChange"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.caseUnit"
            label="Case Unit"
            density="comfortable"
            readonly
            hint="Auto-set from case selection"
            persistent-hint
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="form.rebookAgent"
            :items="activeGcAgents"
            item-title="name"
            :item-value="(a) => a._id ?? a.id"
            label="Rebook Agent"
            density="comfortable"
            clearable
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="form.rebookDate"
            label="Rebook Date"
            type="date"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model.number="form.attempts"
            label="Attempts"
            type="number"
            min="0"
            density="comfortable"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="form.comments"
            label="Comments"
            auto-grow
            rows="2"
            max-rows="5"
            density="comfortable"
          />
        </v-col>
      </v-row>
      <div class="d-flex align-center mt-4" style="gap: 12px;">
        <v-btn type="submit" :disabled="!formValid || isSubmitting" color="primary" :loading="isSubmitting">
          {{ editingId ? 'Update Canceled Call' : 'Add Canceled Call' }}
        </v-btn>
        <v-alert
          v-if="submitMessage"
          :type="submitAlertType"
          density="compact"
          variant="tonal"
          class="mb-0"
          style="flex: 1;"
        >
          {{ submitMessage }}
        </v-alert>
      </div>
    </v-form>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
import urls from '@/js/config.js'

const props = defineProps({
  editItem: { type: Object, default: null },
})

const emit = defineEmits(['submitted', 'clearEdit'])

const store = useStore()
const formRef = ref(null)
const formValid = ref(true)
const isSubmitting = ref(false)
const submitMessage = ref('')
const submitAlertType = ref('success')

const orders = computed(() => store.getters['orders'] || [])
const gcAgents = computed(() => store.getters['gcAgents'] || [])
const activeGcAgents = computed(() => (gcAgents.value || []).filter((a) => a.active !== false))

const caseOptions = computed(() => {
  const list = orders.value || []
  return list.filter((o) => o.caseName).sort((a, b) => (a.caseName || '').localeCompare(b.caseName || ''))
})

const editingId = ref(null)

const form = ref({
  callDate: new Date().toISOString().split('T')[0],
  cancelDate: new Date().toISOString().split('T')[0],
  agent: '',
  company: '',
  phoneNumber: '',
  contactPerson: '',
  caseId: '',
  caseUnit: '',
  rebookAgent: '',
  rebookDate: '',
  attempts: null,
  comments: '',
})

function toDateStr(val) {
  if (!val) return ''
  if (typeof val === 'string' && val.length >= 10) return val.slice(0, 10)
  const d = new Date(val)
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
}

function toId(val) {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val?._id ?? val?.id ?? ''
}

function populateForm(item) {
  if (!item) return
  editingId.value = item._id ?? item.id ?? null
  form.value = {
    callDate: toDateStr(item.callDate),
    cancelDate: toDateStr(item.cancelDate),
    agent: toId(item.agent),
    company: item.company ?? '',
    phoneNumber: item.phoneNumber ?? '',
    contactPerson: item.contactPerson ?? '',
    caseId: toId(item.case),
    caseUnit: item.caseUnit ?? '',
    rebookAgent: item.rebookAgent ? toId(item.rebookAgent) : '',
    rebookDate: toDateStr(item.rebookDate),
    attempts: item.attempts != null ? Number(item.attempts) : null,
    comments: item.comments ?? '',
  }
}

function clearForNew() {
  editingId.value = null
  form.value = {
    callDate: new Date().toISOString().split('T')[0],
    cancelDate: new Date().toISOString().split('T')[0],
    agent: '',
    company: '',
    phoneNumber: '',
    contactPerson: '',
    caseId: '',
    caseUnit: '',
    rebookAgent: '',
    rebookDate: '',
    attempts: null,
    comments: '',
  }
  formRef.value?.resetValidation()
  emit('clearEdit')
}

watch(() => props.editItem, (item) => {
  if (item) populateForm(item)
}, { immediate: true })

function onCaseChange(caseId) {
  if (!caseId) {
    form.value.caseUnit = ''
    return
  }
  const order = caseOptions.value.find((o) => (o._id ?? o.id) === caseId)
  form.value.caseUnit = order?.caseUnit ?? ''
}

async function submitForm() {
  const valid = await formRef.value?.validate()
  if (!valid?.valid) return

  isSubmitting.value = true
  submitMessage.value = ''
  try {
    const payload = {
      callDate: form.value.callDate,
      cancelDate: form.value.cancelDate,
      agent: form.value.agent,
      company: form.value.company,
      phoneNumber: form.value.phoneNumber,
      contactPerson: form.value.contactPerson,
      case: form.value.caseId || null,
      caseUnit: form.value.caseUnit || null,
      rebookAgent: form.value.rebookAgent || null,
      rebookDate: form.value.rebookDate || null,
      attempts: form.value.attempts != null ? Number(form.value.attempts) : null,
      comments: form.value.comments || '',
    }
    if (editingId.value) {
      const id = String(editingId.value)
      await axios.patch(`${urls.backEndURL}/canceledCalls/${id}`, payload)
      submitMessage.value = 'Canceled call updated successfully.'
    } else {
      await axios.post(`${urls.backEndURL}/canceledCalls`, payload)
      submitMessage.value = 'Canceled call added successfully.'
    }
    submitAlertType.value = 'success'
    clearForNew()
    emit('submitted')
  } catch (err) {
    submitMessage.value = err?.response?.data?.message || err?.message || (editingId.value ? 'Failed to update canceled call.' : 'Failed to add canceled call.')
    submitAlertType.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}
</script>
