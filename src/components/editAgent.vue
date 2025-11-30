<template>
  <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">
    <h1 class="mb-3 mt-5">Edit GcAgent: {{ activeAgent }}</h1>

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
      >
        <template v-slot:selection="{ item }">
          {{ item.title }}
        </template>
      </v-select>

      <v-switch v-model="agent.active" label="Active" />

      <div class="button-alert-container">
        <v-btn type="submit" color="primary">Update Agent</v-btn>
        <v-alert v-if="message" :type="alertType" class="ml-3" dense dismissible>
          {{ message }}
        </v-alert>
      </div>
    </v-form>
  </div>
</template>
  
<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import urls from '@/js/config.js'
import store from '@/store'

const props = defineProps({
  activeAgent: {
    type: String,
    required: true,
  },
})

// fetch users once (adjust if your store action name differs)
onMounted(async () => {
  if (!store.getters['users']?.length) {
    await store.dispatch('fetchUsers').catch(() => {})
  }
  if (!store.getters['gcAgents']?.length) {
    await store.dispatch('fetchgcAgents').catch(() => {})
  }
  
  // Load the agent data
  await loadAgentData()
})

const formRef = ref(null)

const agent = ref({
  name: '',
  email: '',
  role: '',
  linkedUserId: null,
  active: true,
  _id: null,
})

const roles = ['admin', 'manager', 'caller']

// users from store and options for the select
const users = computed(() => store.getters['users'] || [])
const gcAgents = computed(() => store.getters['gcAgents'] || [])

const userOptions = computed(() =>
  (users.value || [])
    .map(user => {
      const id = String(user._id ?? user.id ?? user.userId ?? user.uuid ?? '');
      const email = user.email ?? user.emails?.[0]?.value ?? '';
      const nameCandidate =
        user.name ??
        user.displayName ??
        `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
      const name = nameCandidate || 'Unnamed';
      console.log('Mapping user to option:', { id, name, email });
      return {
        title: email || name, // Show email if available, otherwise fallback to name
        value: id, // v-model will receive this ID (passed to backend)
      };
    })
    .filter(opt => opt.value) // drop entries without an id
);

// selected user id to submit
const selectedUserId = ref(null)

const message = ref('')
const alertType = ref('success')

async function loadAgentData() {
  try {
    // Find agent in gcAgents by name
    const foundAgent = gcAgents.value.find(a => a.name === props.activeAgent);
    
    if (foundAgent) {
      // Populate the form with the retrieved agent data
      agent.value = {
        name: foundAgent.name || '',
        email: foundAgent.email || '',
        role: foundAgent.role || '',
        linkedUserId: foundAgent.linkedUserId || null,
        active: typeof foundAgent.active === 'boolean' ? foundAgent.active : true,
        _id: foundAgent._id,
      }
      // Convert to string to ensure proper matching with userOptions
      selectedUserId.value = foundAgent.linkedUserId ? String(foundAgent.linkedUserId) : null
    } else {
      alertType.value = 'error'
      message.value = 'Agent not found. Please try again.'
    }
  } catch (error) {
    console.error('Error fetching agent data:', error)
    alertType.value = 'error'
    message.value = 'Failed to retrieve agent data. Please try again.'
  }
}

async function submitForm() {
  console.log('Submitting form with agent:', agent.value, 'and selectedUserId:', selectedUserId.value)
  try {
    const payload = {
      ...agent.value,
      linkedUserId: selectedUserId.value ?? null, // backend can link later
    }

    console.log('Payload to be sent:', payload)

    const { data } = await axios.put(`${urls.backEndURL}/gcAgents/${agent.value._id}`, payload, {
      withCredentials: true,
    })
    console.log('Agent updated:', data)

    alertType.value = 'success'
    message.value = 'Agent updated successfully.'
    
    // Refresh the gcAgents data
    await store.dispatch('fetchgcAgents')
    
    setTimeout(() => (message.value = ''), 3000)
  } catch (err) {
    console.error('Error updating agent:', err.response?.data || err.message)
    alertType.value = 'error'
    message.value = err.response?.data?.message || 'Failed to update agent.'
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
  