<template>
  <v-form @submit.prevent="submitForm" ref="form">
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
     const response = await axios.post(`${urls.backEndURL}/gcCase/`, {
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
