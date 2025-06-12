<template>
  <v-form @submit.prevent="submitForm" ref="form">
    <v-text-field
      v-model="agent.name"
      label="Name"
      :rules="[v => !!v || 'Name is required']"
      required
    />

    <v-text-field
      v-model="agent.email"
      label="Email"
      :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Email must be valid']"
      required
    />

    <v-select
      v-model="agent.role"
      :items="roles"
      label="Role"
      :rules="[v => !!v || 'Role is required']"
      required
    />

    <v-switch
      v-model="agent.active"
      label="Active"
    />

    <v-btn type="submit" color="primary">Add Agent</v-btn>
  </v-form>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import urls from '../../js/config.js';

const agent = ref({
  name: '',
  email: '',
  role: '',
  active: true
})

const roles = ['admin', 'caller', 'manager']

const submitForm = async () => {
  try {
    const response = await axios.post(`${urls.backEndURL}/gcAgents/`, agent.value)
    console.log('Agent added:', response.data)
    // reset form
    agent.value = {
      name: '',
      email: '',
      role: '',
      active: true
    }
  } catch (err) {
    console.error('Error adding agent:', err.response?.data || err.message)
  }
}
</script>
