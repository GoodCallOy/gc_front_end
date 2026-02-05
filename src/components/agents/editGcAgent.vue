<template>
  <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">
    <h1 class="mb-3 mt-5">Edit GcAgent</h1>

    <v-form ref="formRef" @submit.prevent="submitForm">
      <v-text-field
        v-model="editUser.name"
        label="Name"
        :rules="[v => !!v || 'Name is required']"
        required
      />

      <v-text-field
        v-model="editUser.email"
        label="Email"
        :rules="[
          v => !!v || 'Email is required',
          v => /.+@.+\..+/.test(v) || 'Email must be valid'
        ]"
        required
      />

      <v-select
        v-model="editUser.role"
        :items="roles"
        label="Role"
        :rules="[v => !!v || 'Role is required']"
        required
      />

      <v-select
        v-model="selectedAgentId"
        :items="agentOptions"
        item-title="title"
        item-value="value"
        label="Link to agent"
        clearable
        @update:modelValue="onSelectAgent"
      />

      <!-- <v-switch v-model="agent.active" label="Active" /> -->

      <div class="button-alert-container">
        <v-btn type="submit" color="primary">Save Agent</v-btn>
        <v-alert v-if="message" :type="alertType" class="ml-3" dense dismissible>
          {{ message }}
        </v-alert>
      </div>
    </v-form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toRaw } from 'vue'
import axios from 'axios'
import urls from '@/js/config.js'
import store from '@/store'
import EditAgent from '../editAgent.vue'

const route = useRoute()
const router = useRouter()

const formRef = ref(null)

const roles = ['admin', 'manager', 'caller']


const agents = computed(() => store.state.gcAgents || [])
const users = computed(() => store.state.users || [])
const userFromStore = computed(() => store.state.user || [])
console.log('userFromStore:', userFromStore.value);
console.log('users:', users.value);

const selectedUserId = computed(() => {
  const q = route.query.selectedUser
  return Array.isArray(q) ? q[0] : (q ?? '')
})

const selectedUser = computed(() => {
  const id = selectedUserId.value
  if (!id) return null
  return users.value.find(u => String(u._id ?? u.id) === id) ?? null
})

console.log('selectedUserId:', selectedUserId.value);
console.log('selectedUser:', selectedUser.value);

const editUser = reactive({
  id: '',
  googleId: '',
  name: '',
  email: '',
  avatar: '',
  access: '',
  role: 'caller',
  linkedUserId: '',
})

const agent = reactive({
  id: '',
  name: '',
  email: '',
  avatar: '',
  role: '',
  linkedUserId: null,
  active: true,})

function loadFormData(source) {
  console.log('Loading form data for user:', source)
  editUser.id = source.id || source._id || ''
  editUser.googleId = source.googleId || ''
  editUser.name = source.name || ''
  editUser.email = source.email || ''
  editUser.avatar = source.avatar || ''
  editUser.access = source.access || ''
  editUser.role = source.role || 'caller'
  // keep as string for the input; send null when empty
  editUser.linkedUserId = source.linkedUserId ? String(source.linkedUserId) : ''

  // Pre-select the currently linked agent (if any) in the "Link to agent" field
  selectedAgentId.value = source.linkedUserId ? String(source.linkedUserId) : null
}

function onSelectAgent(id) {
  const found = (agents.value || []).find(
    a => String(a._id ?? a.id) === String(id)
  );
  if (found && found.role) {
    editUser.role = found.role;          // <-- copy role to editUser
  } else if (!id) {
    // selection cleared; choose desired behavior:
    // editUser.role = 'caller';         // or keep last value, or reset to default
  }
}

const selectedAgentId = ref(null)

const message = ref('')
const alertType = ref('success')


// Not used for loading currently; keep for future if needed
const isEditMode = computed(() => !!(selectedUserId.value))

// Users from store → options for "Link to Google User"
onMounted(async () => {
  if (!store.getters['users']?.length) {
    try { await store.dispatch('fetchUsers') } catch {}
  }
  if (!store.getters['gcAgents']?.length) {
    try { await store.dispatch('fetchgcAgents', true) } catch {}
  }
  if (selectedUser.value) loadFormData(selectedUser.value)
  // Fallback: fetch the user by ID if not found in store
  if (!selectedUser.value && selectedUserId.value) {
    try {
      const { data } = await axios.get(`${urls.backEndURL}/user/${selectedUserId.value}`, { withCredentials: true })
      if (data) loadFormData(data)
    } catch (e) {
      console.warn('Failed to fetch user by id:', selectedUserId.value, e?.response?.status || e?.message)
    }
  }
})

// Ensure the form populates when navigating from other pages once users load
watch(selectedUser, (u) => {
  if (u) loadFormData(u)
})


const agentOptions = computed(() =>
  (agents.value || [])
    .map(a => {
      const id = String(a._id ?? a.id ?? '')
      const name = a.name || 'Unnamed'
      const email = a.email || ''
      const active = a.active ? 'Active' : 'Inactive'
      const role = a.role || ''
      return {
        value: id,
        title: email ? `${name} (${email}, ${role}, ${active})` : `${name} (${role}, ${active})`,
      }
    })
    .filter(o => o.value)
)

async function loadAgent(agentinfo) {
  // try store first
  
  agent.value = {
    id: agentinfo._id || agentinfo.id || '',
    name: agentinfo.name || '',
    email: agentinfo.email || '',
    role: agentinfo.role || '',
    active: typeof agentinfo.active === 'boolean' ? agentinfo.active : true,
  }
}

async function submitForm() {
  // optional validate if using Vuetify form validation
  const valid = await formRef.value?.validate?.()
  if (valid === false) return

  if (!selectedUser.value) {
    alertType.value = 'error'
    message.value = 'No user selected.'
    return
  }

  // Build payload from the editable fields plus any immutable backend identifiers
  const base = selectedUser.value
  const payload = {
    // identifiers that backend may rely on
    _id: base._id ?? editUser.id,
    id: base.id ?? editUser.id,
    googleId: base.googleId ?? editUser.googleId,
    access: base.access ?? editUser.access,
    avatar: base.avatar ?? editUser.avatar,

    // editable fields from the form
    name: editUser.name,
    email: editUser.email,
    role: editUser.role,

    // link this auth user to a gcAgent
    linkedUserId: selectedAgentId.value ?? null,
  }
  console.log('Submitting payload:', payload)
  console.log('Submitting for user ID:', selectedUserId.value)
  try {
    
    // UPDATE
    const { data } = await axios.put(
      `${urls.backEndURL}/user/${selectedUserId.value}`,
      payload,
      { withCredentials: true }
    )
    alertType.value = 'success'
    message.value = 'Agent updated.'
    // refresh stores so listGcAgents and other views see updated link
    try { await store.dispatch('fetchUsers', true) } catch {}
    try { await store.dispatch('fetchgcAgents', true) } catch {}
    console.log('Agent updated:', data)
    // keep you on the page; or router.back() if you prefer
    
    setTimeout(() => (message.value = ''), 3000)
  } catch (err) {
    console.error('Save failed:', err.response?.data || err.message)
    alertType.value = 'error'
    message.value = err.response?.data?.message || 'Failed to save agent.'
  }
}
</script>


<style scoped>
.v-form { width: 400px; max-width: 100%; margin: 0 auto; }
.v-btn { margin-top: 20px; }
.v-alert { margin-top: 20px; max-height: 4em; }
.button-alert-container { display: flex; align-items: center; margin-top: 20px; }
.ml-3 { margin-left: 12px; }
</style>
