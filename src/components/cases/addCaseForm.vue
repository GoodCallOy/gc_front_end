<template>
  <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">  

    <h1 class="mb-3 mt-5">Add New case</h1>
    <v-form ref="form" @submit.prevent="submitForm">
      <v-text-field
        v-model="gcCase.name"
        label="Case Name"
        :rules="[v => !!v || 'Name is required']"
        required
      />

      <v-text-field
        v-model="gcCase.contactInfo.contactName"
        label="Contact Name"
      />

      <v-text-field
        v-model="gcCase.contactInfo.contactTitle"
        label="Contact Title"
      />

      <v-text-field
        v-model="gcCase.contactInfo.email"
        label="Email"
        :rules="[v => !v || /.+@.+\..+/.test(v) || 'Invalid email']"
      />

      <v-btn type="submit" color="primary">Add Case</v-btn>
    </v-form>
  </div>  
</template>

<script setup>
import { ref } from 'vue'
import axios from "axios";
import urls from '../../js/config.js';

const gcCase = ref({
  name: '',
  contactInfo: {
    contactName: '',
    contactTitle: '',
    email: ''
  }
})

const submitForm = async () => {
  try {
     const response = await axios.post(`${urls.backEndURL}/gcCases/`, {
      name: gcCase.value.name,
      contactInfo: gcCase.value.contactInfo
    })
    console.log('Case added:', response.data)
    gcCase.value = {
      name: '',
      contactInfo: {
        contactName: '',
        contactTitle: '',
        email: ''
      }
    }
  } catch (err) {
    console.error(err)
    console.log('Failed in adding case.', err)
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