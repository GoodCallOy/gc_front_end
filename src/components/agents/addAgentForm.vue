<template>
  <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">
    <h1 class="mb-3 mt-5">Add New GcAgent</h1>

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

      <!-- 🔽 NEW: pick an existing Google user to link -->
      <v-select
        v-model="selectedUserId"
        :items="userOptions"
        item-title="title"
        item-value="value"
        label="Link to Google User (optional)"
        clearable
      />

      <v-switch v-model="agent.active" label="Active" />

      <div class="button-alert-container">
        <v-btn type="submit" color="primary">Add Agent</v-btn>
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

// fetch users once (adjust if your store action name differs)
onMounted(() => {
  if (!store.getters['users']?.length) {
    store.dispatch('fetchUsers').catch(() => {})
  }
})

const formRef = ref(null)

const agent = ref({
  name: '',
  email: '',
  role: '',
  active: true,
})

const roles = ['admin', 'manager', 'caller']

// users from store and options for the select
const users = computed(() => store.getters['users'] || [])

const userOptions = computed(() =>
  users.value.map(u => ({
    title: `${u.name} (${u.email})`,
    value: u._id || u.id, // normalize to the id your backend expects
  }))
)

// selected user id to submit
const selectedUserId = ref(null)

const message = ref('')
const alertType = ref('success')

async function submitForm() {
  try {
    const payload = {
      ...agent.value,
      linkedUserId: selectedUserId.value ?? null, // backend can link later
    }

    const { data } = await axios.post(`${urls.backEndURL}/gcAgents/`, payload, {
      withCredentials: true,
    })
    console.log('Agent added:', data)

    // OPTIONAL: if you want to immediately link the new agent to the user:
    // if (selectedUserId.value) {
    //   await axios.patch(
    //     `${urls.backEndURL}/api/v1/admin/access/users/${selectedUserId.value}/link-agent`,
    //     { agentId: data._id },
    //     { withCredentials: true }
    //   )
    // }

    // reset
    agent.value = { name: '', email: '', role: '', active: true }
    selectedUserId.value = null

    alertType.value = 'success'
    message.value = 'Agent created successfully.'
    setTimeout(() => (message.value = ''), 3000)
  } catch (err) {
    console.error('Error adding agent:', err.response?.data || err.message)
    alertType.value = 'error'
    message.value = err.response?.data?.message || 'Failed to create agent.'
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
