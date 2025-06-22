<template>
  <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">  
   
    <h1 class="mb-3 mt-5">Add New GcAgent</h1>
    <v-form ref="form" @submit.prevent="submitForm">
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
      <v-alert 
          v-if="message" 
          :type="alertType" 
          class="ml-3" 
          dense 
          dismissible>
          {{ message }}
        </v-alert>
    </v-form>
  </div>
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
const message = ref('')
const alertType = ref('success') // 'success' or 'error'

const submitForm = async () => {
  const me = this;
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
    me.alertType = "success";
    setTimeout(() => {
            me.message = "";
    }, 3000);
  } catch (err) {
    console.error('Error adding agent:', err.response?.data || err.message)
  }
}
</script>
<style scoped>
  .v-form {
  width: 400px;
  max-width: 100%;
  margin: 0 auto;
}
.v-btn {
  margin-top: 20px;
}
.v-alert {
  margin-top: 20px;
  max-height: 4em;
}
.button-alert-container {
  display: flex;
  align-items: center; /* Align items vertically */
  margin-top: 20px;    /* Add spacing from inputs */
}
.ml-3 {
  margin-left: 12px; /* Space between button and alert */
}
</style>