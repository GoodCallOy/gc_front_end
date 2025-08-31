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
  linkedUserId: null,
  active: true,
})

const roles = ['admin', 'manager', 'caller']

// users from store and options for the select
const users = computed(() => store.getters['users'] || [])


const userOptions = computed(() =>
  (users.value || [])
    .map(user => {
      const id = String(user._id ?? user.id ?? user.userId ?? user.uuid ?? '');
      const nameCandidate =
        user.name ??
        user.displayName ??
        `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
      const name = nameCandidate || 'Unnamed';
      const email = user.email ?? user.emails?.[0]?.value ?? '';
      console.log('Mapping user to option:', { id, name, email });
      return {
        title: email ? `${name} (${email})` : name,
        value: id, // v-model will receive this ID
      };
    })
    .filter(opt => opt.value) // drop entries without an id
);

// selected user id to submit
const selectedUserId = ref(null)

const message = ref('')
const alertType = ref('success')

async function submitForm() {
  console.log('Submitting form with agent:', agent.value, 'and selectedUserId:', selectedUserId.value)
  try {
    const payload = {
      ...agent.value,
      linkedUserId: selectedUserId.value ?? null, // backend can link later
    }

    console.log('Payload to be sent:', payload)

    const { data } = await axios.post(`${urls.backEndURL}/gcAgents/`, payload, {
      withCredentials: true,
    })
    console.log('Agent added:', data)

    agent.value = { name: '', email: '', role: '', active: true }


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
