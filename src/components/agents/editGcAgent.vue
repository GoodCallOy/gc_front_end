<template>
  <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">
    <h1 class="mb-3 mt-5">Edit GcAgent</h1>

    <v-form ref="formRef" @submit.prevent="submitForm">
      <!-- Fallback: allow selecting a user when it wasn't provided via route -->
      <v-select
        v-model="selectedUserSelectId"
        :items="userOptions"
        item-title="title"
        item-value="value"
        label="Select user to edit"
        clearable
        class="mb-4"
        @update:modelValue="onSelectUser"
      />
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
        v-model="linkedUserSelectId"
        :items="userOptions"
        item-title="title"
        item-value="value"
        label="Link to user"
        clearable
      />

      <v-switch
        v-model="editUser.active"
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


const agents = computed(() => store.state.gcAgents || [])
const users = computed(() => store.state.users || [])
const userFromStore = computed(() => store.state.user || [])
console.log('userFromStore:', userFromStore.value);
console.log('users:', users.value);

const selectedUserId = computed(() => {
  const q = route.query.selectedUser
  return Array.isArray(q) ? q[0] : (q ?? '')
})
const selectedGcAgentRouteId = computed(() => {
  const q = route.query.selectedGcAgent
  return Array.isArray(q) ? q[0] : (q ?? '')
})
const currentGcAgentId = ref('')

// Local v-model backing the "Select user to edit" dropdown
const selectedUserSelectId = ref('')
// Local v-model for gcAgent.linkedUserId (User _id)
const linkedUserSelectId = ref(null)

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
  active: true,
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
  editUser.active = typeof source.active === 'boolean' ? source.active : true
  // keep as string for the input; send null when empty
  editUser.linkedUserId = source.linkedUserId ? String(source.linkedUserId) : ''

  // Pre-select linked gcAgent unless route explicitly pinned one.
  if (!selectedGcAgentRouteId.value) {
    selectedAgentId.value = source.linkedUserId ? String(source.linkedUserId) : null
    currentGcAgentId.value = source.linkedUserId ? String(source.linkedUserId) : ''
  }

  // Keep the user selector in sync
  const id = source.id || source._id || ''
  selectedUserSelectId.value = id ? String(id) : ''
}

function firstNonEmpty(...values) {
  for (const v of values) {
    if (v === null || v === undefined) continue
    if (typeof v === 'string') {
      if (v.trim() !== '') return v
      continue
    }
    return v
  }
  return undefined
}

function applyGcAgentAsAuthority(gcAgent, fallbackUser = null) {
  if (!gcAgent) return
  const gcAgentId = String(gcAgent?._id ?? gcAgent?.id ?? '')
  const linkedUserId = String(gcAgent?.linkedUserId ?? '')

  currentGcAgentId.value = gcAgentId
  selectedAgentId.value = gcAgentId || null

  // gcAgent is authoritative; user/default values are only fallback for missing/blank fields
  editUser.name = firstNonEmpty(gcAgent?.name, fallbackUser?.name, editUser.name, '') || ''
  editUser.email = firstNonEmpty(gcAgent?.email, fallbackUser?.email, editUser.email, '') || ''
  editUser.role = firstNonEmpty(gcAgent?.role, fallbackUser?.role, editUser.role, DEFAULT_ROLE) || DEFAULT_ROLE
  editUser.active = typeof gcAgent?.active === 'boolean'
    ? gcAgent.active
    : (typeof fallbackUser?.active === 'boolean' ? fallbackUser.active : true)

  editUser.linkedUserId = linkedUserId || (fallbackUser?.linkedUserId ? String(fallbackUser.linkedUserId) : '')

  // Keep user selector synced to linked auth user when known
  if (linkedUserId) {
    selectedUserSelectId.value = linkedUserId
    linkedUserSelectId.value = linkedUserId
  } else if (fallbackUser?._id || fallbackUser?.id) {
    selectedUserSelectId.value = String(fallbackUser._id ?? fallbackUser.id)
    linkedUserSelectId.value = null
  } else {
    linkedUserSelectId.value = null
  }
}

function resolveGcAgentForEdit(fallbackUser = null) {
  const allGcAgents = agents.value || []
  const routeGcAgentId = String(selectedGcAgentRouteId.value ?? '').trim()

  if (routeGcAgentId) {
    return allGcAgents.find(a => String(a?._id ?? a?.id ?? '') === routeGcAgentId) || null
  }

  const userLinkedGcId = String(fallbackUser?.linkedUserId ?? '').trim()
  if (userLinkedGcId) {
    const byUserLink = allGcAgents.find(a => String(a?._id ?? a?.id ?? '') === userLinkedGcId)
    if (byUserLink) return byUserLink
  }

  const userEmail = String(fallbackUser?.email ?? '').trim().toLowerCase()
  if (userEmail) {
    const byEmail = allGcAgents.find(a => String(a?.email ?? '').trim().toLowerCase() === userEmail)
    if (byEmail) return byEmail
  }

  const userName = String(fallbackUser?.name ?? '').trim().toLowerCase()
  if (userName) {
    const byName = allGcAgents.find(a => String(a?.name ?? '').trim().toLowerCase() === userName)
    if (byName) return byName
  }

  return null
}

const selectedAgentId = ref(null)

const message = ref('')
const alertType = ref('success')


// Not used for loading currently; keep for future if needed
const isEditMode = computed(() => !!(selectedUserId.value))

// Users from store → options for "Link to Google User"
onMounted(async () => {
  console.log('editGcAgent load input:', {
    routeQuery: route.query,
    selectedUserId: selectedUserId.value,
  })

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

  const gcAgent = resolveGcAgentForEdit(selectedUser.value)
  if (gcAgent) {
    applyGcAgentAsAuthority(gcAgent, selectedUser.value)
  }
})

// Ensure the form populates when navigating from other pages once users load
watch(selectedUser, (u) => {
  if (u && !currentGcAgentId.value) loadFormData(u)
  const gcAgent = resolveGcAgentForEdit(u)
  if (gcAgent) {
    applyGcAgentAsAuthority(gcAgent, u)
  }
})

// Keep the "Select user to edit" dropdown synced when route query changes externally
watch(
  selectedUserId,
  (id) => {
    selectedUserSelectId.value = id ? String(id) : ''
  },
  { immediate: true }
)


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

// All auth users → options for "Select user to edit" dropdown
const userOptions = computed(() =>
  (users.value || [])
    .map(u => {
      const id = String(u._id ?? u.id ?? '')
      const name = u.name || 'Unnamed'
      const email = u.email || ''
      return {
        value: id,
        title: email ? `${name} (${email})` : name,
      }
    })
    .filter(o => o.value)
)

function onSelectUser(id) {
  // Update the route query so all existing logic (selectedUser, loadFormData, submit) continues to work
  const nextQuery = { ...route.query }
  if (id) {
    nextQuery.selectedUser = String(id)
  } else {
    delete nextQuery.selectedUser
  }
  router.push({ query: nextQuery })
}

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

  // Snapshot values from the form immediately so later refresh/hydration cannot overwrite
  // what the user just selected before we send gcAgent updates.
  const desiredActive = !!editUser.active
  // IMPORTANT: for link/unlink, trust the dropdown state only.
  // Do NOT fallback to route selectedUserId, otherwise clearing the field relinks on save.
  const desiredLinkedUserId = String(linkedUserSelectId.value ?? '').trim() || null
  const gcAgentIdToUpdate = String(currentGcAgentId.value || selectedGcAgentRouteId.value || '').trim()

  if (!gcAgentIdToUpdate) {
    alertType.value = 'error'
    message.value = 'No gcAgent selected for update.'
    return
  }

  // IMPORTANT: gcAgent endpoint expects gcAgent-shaped payload only.
  // linkedUserId here must be a User _id (or null to unlink).
  const gcPayload = {
    name: editUser.name,
    email: editUser.email,
    role: editUser.role || DEFAULT_ROLE,
    active: desiredActive,
    linkedUserId: desiredLinkedUserId,
  }
  console.log('Submitting gcAgent payload:', {
    endpoint: `${urls.backEndURL}/gcAgents/${gcAgentIdToUpdate}`,
    payload: gcPayload,
  })

  try {
    const { data } = await axios.put(
      `${urls.backEndURL}/gcAgents/${gcAgentIdToUpdate}`,
      gcPayload,
      { withCredentials: true }
    )
    alertType.value = 'success'
    message.value = 'Agent updated.'

    // Keep gcAgent.active and link state in sync.
    // The agents list reads these from gcAgents, not users.
    currentGcAgentId.value = String(data?._id ?? data?.id ?? gcAgentIdToUpdate)

    try { await store.dispatch('fetchUsers') } catch {}
    try { await store.dispatch('fetchgcAgents', true) } catch {}

    const freshUser = desiredLinkedUserId
      ? (store.getters['users'] || []).find(
          u => String(u?._id ?? u?.id ?? '') === String(desiredLinkedUserId)
        ) || null
      : null
    const freshGc = (agents.value || []).find(
      a => String(a?._id ?? a?.id ?? '') === String(currentGcAgentId.value)
    )
    if (freshGc) {
      applyGcAgentAsAuthority(freshGc, freshUser)
    }

    const sessionUser = store.state.user?.user
    if (
      sessionUser &&
      desiredLinkedUserId &&
      String(sessionUser._id ?? sessionUser.id) === String(desiredLinkedUserId)
    ) {
      try { await store.dispatch('fetchUser', true) } catch {}
    }

    console.log('gcAgent updated:', data)
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
