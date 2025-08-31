<template>
  <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">
    <h1 class="mb-3 mt-5">Edit GcAgent</h1>

    <v-form ref="formRef" @submit.prevent="submitForm">
      <v-text-field
        v-model="agent.name"
        label="Name"
        :rules="[v => !!v || 'Name is required']"
        required
      />

      <v-text-field
        v-model="agent.email"
        label="Email"
        :rules="[
          v => !!v || 'Email is required',
          v => /.+@.+\..+/.test(v) || 'Email must be valid'
        ]"
        required
      />

      <v-select
        v-model="agent.role"
        :items="roles"
        label="Role"
        :rules="[v => !!v || 'Role is required']"
        required
      />

      <v-select
        v-model="selectedUserId"
        :items="userOptions"
        item-title="title"
        item-value="value"
        label="Link to Google User"
        clearable
      />

      <v-switch v-model="agent.active" label="Active" />

      <div class="button-alert-container">
        <v-btn type="submit" color="primary">Edit Agent</v-btn>
        <v-alert v-if="message" :type="alertType" class="ml-3" dense dismissible>
          {{ message }}
        </v-alert>
      </div>
    </v-form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toRaw } from 'vue'
import axios from 'axios'
import urls from '@/js/config.js'
import store from '@/store'

const route = useRoute()
const router = useRouter()

const formRef = ref(null)

const roles = ['admin', 'manager', 'caller']

const agent = ref({
  name: '',
  email: '',
  role: '',
  active: true,
  linkedUserId: null,
})

const selectedUserId = ref(null)

const message = ref('')
const alertType = ref('success')

// Are we editing? (list page should route with ?activeAgent=<id>)
const agentId = computed(() => String(route.query.activeAgent || ''))
const isEditMode = computed(() => !!agentId.value)

// Users from store → options for "Link to Google User"
onMounted(async () => {
  if (!store.getters['users']?.length) {
    try { await store.dispatch('fetchUsers') } catch {}
  }
  if (!store.getters['gcAgents']?.length) {
    try { await store.dispatch('fetchgcAgents', true) } catch {}
  }
  if (isEditMode.value) {
    await loadAgent(agentId.value)
  }
})

const users = computed(() => store.getters['users'] || [])
const userOptions = computed(() =>
  (users.value || [])
    .map(u => {
      const id = String(u._id ?? u.id ?? '')
      const name = u.name || 'Unnamed'
      const email = u.email || ''
      return { value: id, title: email ? `${name} (${email})` : name }
    })
    .filter(o => o.value)
)

async function loadAgent(id) {
  // try store first
  const list = store.getters['gcAgents'] || []
  let found = list.find(a => a._id === id)

  if (!found) {
    // fallback to API
    const { data } = await axios.get(`${urls.backEndURL}/api/v1/gcAgents/${id}`, { withCredentials: true })
    found = data
  }
  if (!found) return

  agent.value = {
    name: found.name || '',
    email: found.email || '',
    role: found.role || '',
    active: typeof found.active === 'boolean' ? found.active : true,
    linkedUserId: found.linkedUserId ?? null,
  }
  selectedUserId.value = found.linkedUserId ? String(found.linkedUserId) : null
}

async function submitForm() {
  // optional validate if using Vuetify form validation
  const valid = await formRef.value?.validate?.()
  if (valid === false) return

  const payload = {
    ...toRaw(agent.value),
    linkedUserId: selectedUserId.value ?? null,
  }

  try {
    if (isEditMode.value) {
      // UPDATE
      const { data } = await axios.put(
        `${urls.backEndURL}/gcAgents/${agentId.value}`,
        payload,
        { withCredentials: true }
      )
      alertType.value = 'success'
      message.value = 'Agent updated.'
      // refresh store
      try { await store.dispatch('fetchgcAgents', true) } catch {}
      // keep you on the page; or router.back() if you prefer
    } else {
      // CREATE
      const { data } = await axios.post(
        `${urls.backEndURL}/api/v1/gcAgents/`,
        payload,
        { withCredentials: true }
      )
      alertType.value = 'success'
      message.value = 'Agent created.'
      try { await store.dispatch('fetchgcAgents', true) } catch {}
      // optionally go to edit page for this new agent:
      router.replace({ name: 'editAgent', query: { activeAgent: data._id } })
    }
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
