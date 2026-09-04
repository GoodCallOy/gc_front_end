<template>
  <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">
    <h1 class="mb-3 mt-5">Edit GcAgent</h1>

    <v-form ref="formRef" @submit.prevent="submitForm">
      <v-select
        v-model="selectedAgentId"
        :items="agentOptions"
        item-title="title"
        item-value="value"
        label="GoodCall agent (inside the app)"
        class="mb-1"
        @update:modelValue="onSelectAgent"
      />
      <div class="text-caption text-medium-emphasis mb-4">
        The in-app GoodCall agent. Saving updates this profile only.
      </div>

      <v-text-field
        v-model="form.name"
        label="Name"
        :rules="[v => !!v || 'Name is required']"
        required
      />

      <v-text-field
        v-model="form.email"
        label="Email"
        :rules="[
          v => !!v || 'Email is required',
          v => /.+@.+\..+/.test(v) || 'Email must be valid'
        ]"
        required
      />

      <v-select
        v-model="form.role"
        :items="roles"
        label="Role"
        :rules="[v => !!v || 'Role is required']"
        required
      />

      <v-select
        v-model="linkedUserSelectId"
        :items="userOptions"
        item-title="title"
        item-value="value"
        label="Google login email (outside)"
        clearable
        class="mb-1"
      />
      <div class="text-caption text-medium-emphasis mb-4">
        Link the Google account they use to sign in. After login, they will see this GoodCall agent.
      </div>

      <v-switch
        v-model="form.active"
        label="Active"
        color="primary"
        inset
        class="mt-2"
      />

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
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import urls from '@/js/config.js'
import store from '@/store'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)

const roles = ['admin', 'manager', 'caller']
const DEFAULT_ROLE = 'caller'

const agents = computed(() => store.getters['gcAgents'] || store.state.gcAgents || [])
const users = computed(() => store.getters['users'] || store.state.users || [])

const selectedGcAgentRouteId = computed(() => {
  const q = route.query.selectedGcAgent
  return String(Array.isArray(q) ? q[0] : (q ?? '')).trim()
})
const selectedUserRouteId = computed(() => {
  const q = route.query.selectedUser
  return String(Array.isArray(q) ? q[0] : (q ?? '')).trim()
})

const selectedAgentId = ref('')
const linkedUserSelectId = ref(null)

const form = reactive({
  name: '',
  email: '',
  role: DEFAULT_ROLE,
  active: true,
})

const message = ref('')
const alertType = ref('success')

const agentOptions = computed(() =>
  (agents.value || [])
    .map((a) => {
      const id = String(a._id ?? a.id ?? '')
      const name = a.name || 'Unnamed'
      const email = a.email || ''
      return {
        value: id,
        title: email ? `${name} (${email})` : name,
      }
    })
    .filter((o) => o.value)
)

const userOptions = computed(() =>
  (users.value || [])
    .map((u) => {
      const id = String(u._id ?? u.id ?? '')
      const name = u.name || 'Unnamed'
      const email = u.email || ''
      return {
        value: id,
        title: email ? `${name} (${email})` : name,
      }
    })
    .filter((o) => o.value)
)

function findAgentById(id) {
  const wanted = String(id || '')
  if (!wanted) return null
  return (agents.value || []).find((a) => String(a._id ?? a.id) === wanted) || null
}

function findUserById(id) {
  const wanted = String(id || '')
  if (!wanted) return null
  return (users.value || []).find((u) => String(u._id ?? u.id) === wanted) || null
}

/** Resolve which GcAgent to edit. Never treat a Gmail user's identity as the agent payload. */
function resolveAgentToEdit() {
  const fromRoute = findAgentById(selectedGcAgentRouteId.value)
  if (fromRoute) return fromRoute

  const userId = selectedUserRouteId.value
  if (userId) {
    const byLink = (agents.value || []).find(
      (a) => String(a.linkedUserId ?? '') === userId
    )
    if (byLink) return byLink

    const user = findUserById(userId)
    const userLinkedAgentId = String(user?.linkedUserId ?? '').trim()
    const fromUserPointer = findAgentById(userLinkedAgentId)
    if (fromUserPointer) return fromUserPointer

    const email = String(user?.email ?? '').trim().toLowerCase()
    if (email) {
      const byEmail = (agents.value || []).find(
        (a) => String(a.email ?? '').trim().toLowerCase() === email
      )
      if (byEmail) return byEmail
    }
    const name = String(user?.name ?? '').trim().toLowerCase()
    if (name) {
      const byName = (agents.value || []).find(
        (a) => String(a.name ?? '').trim().toLowerCase() === name
      )
      if (byName) return byName
    }
  }

  return findAgentById(selectedAgentId.value)
}

function applyAgentToForm(agent) {
  if (!agent) return
  const agentId = String(agent._id ?? agent.id ?? '')
  selectedAgentId.value = agentId
  form.name = agent.name || ''
  form.email = agent.email || ''
  form.role = agent.role || DEFAULT_ROLE
  form.active = typeof agent.active === 'boolean' ? agent.active : true
  linkedUserSelectId.value = agent.linkedUserId ? String(agent.linkedUserId) : null
}

function syncRouteToAgent(agentId) {
  const id = String(agentId || '')
  const nextQuery = { ...route.query }
  if (id) nextQuery.selectedGcAgent = id
  else delete nextQuery.selectedGcAgent
  // Keep selectedUser as the linked Gmail id for bookmarks, not as the record being edited.
  const linked = String(linkedUserSelectId.value ?? '')
  if (linked) nextQuery.selectedUser = linked
  else delete nextQuery.selectedUser
  router.replace({ query: nextQuery })
}

function onSelectAgent(id) {
  const agent = findAgentById(id)
  if (!agent) return
  applyAgentToForm(agent)
  syncRouteToAgent(String(agent._id ?? agent.id))
}

function loadFromRoute() {
  const agent = resolveAgentToEdit()
  if (agent) applyAgentToForm(agent)
}

onMounted(async () => {
  if (!store.getters['users']?.length) {
    try { await store.dispatch('fetchUsers') } catch {}
  }
  if (!store.getters['gcAgents']?.length) {
    try { await store.dispatch('fetchgcAgents', true) } catch {}
  }
  loadFromRoute()
})

watch(selectedGcAgentRouteId, (id) => {
  if (id && id !== selectedAgentId.value) {
    const agent = findAgentById(id)
    if (agent) applyAgentToForm(agent)
  }
})

async function submitForm() {
  const valid = await formRef.value?.validate?.()
  if (valid === false) return

  const gcAgentIdToUpdate = String(selectedAgentId.value || '').trim()
  if (!gcAgentIdToUpdate) {
    alertType.value = 'error'
    message.value = 'Select an agent to edit before saving.'
    return
  }

  const desiredLinkedUserId = String(linkedUserSelectId.value ?? '').trim() || null

  const gcPayload = {
    name: form.name,
    email: form.email,
    role: form.role || DEFAULT_ROLE,
    active: !!form.active,
    linkedUserId: desiredLinkedUserId,
  }

  try {
    await axios.put(
      `${urls.backEndURL}/gcAgents/${gcAgentIdToUpdate}`,
      gcPayload,
      { withCredentials: true }
    )
    alertType.value = 'success'
    message.value = 'Agent updated.'

    try { await store.dispatch('fetchgcAgents', true) } catch {}
    try { await store.dispatch('fetchUsers') } catch {}

    const freshGc = findAgentById(gcAgentIdToUpdate)
    if (freshGc) applyAgentToForm(freshGc)
    syncRouteToAgent(gcAgentIdToUpdate)

    const sessionUser = store.state.user?.user
    if (
      sessionUser &&
      desiredLinkedUserId &&
      String(sessionUser._id ?? sessionUser.id) === String(desiredLinkedUserId)
    ) {
      try { await store.dispatch('fetchUser', true) } catch {}
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
