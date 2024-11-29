<template>
    <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">
      <h1 class="mb-3 mt-5">Add New Case</h1>
  
      <v-form v-model="valid" @submit.prevent="submitForm" lazy-validation>
        <v-text-field
          v-model="caseInfo.name"
          label="Agent Name"
          :rules="nameRules"
          required
        />
        <v-text-field
          v-model="caseInfo.billing"
          label="Billing"
          type="number"
          :rules="numberRules"
          required
        />
        <v-select
          v-model="caseInfo.state"
          :items="['Active', 'Inactive']"
          label="State"
          :rules="stateRules"
          required
        />
        <v-select
          v-model="caseInfo.type"
          :items="['Monthly', 'Hourly', 'Pilot']"
          label="Type"
          :rules="stateRules"
          required
        />
  
        <v-btn :disabled="!valid" color="primary">Submit</v-btn>
      </v-form>
  
      <!-- Success/Failure Message -->
      <v-alert v-if="message" :type="alertType" dismissible>
        {{ message }}
      </v-alert>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'AddCase',
    data() {
      return {
        valid: false,
        caseInfo: {
          name: '',
          billing: null,
          state: null,
          type: null,
        },
        message: '',
        alertType: 'success',
        nameRules: [
          v => !!v || 'Name is required',
          v => (v && v.length <= 100) || 'Name must be less than 100 characters',
        ],
        numberRules: [
          v => v >= 0 || 'Value must be 0 or higher',
        ],
        stateRules: [
          v => !!v || 'State is required',
        ],
      };
    },
    methods: {
      async submitForm() {
        const me = this;
        console.log('Case object: ', me.case);
        try {
          const response = await axios.post(
            'https://goodcall-back-end.onrender.com/api/v1/case/',
            me.case
          );
          console.log('Case added: ', response);
          me.message = 'Case added successfully!';
          me.alertType = 'success';
          me.clearForm();
        } catch (error) {
          console.error('Error adding Case:', error);
          me.message = 'Failed to add Case. Please try again.';
          me.alertType = 'error';
        }
      },
      clearForm() {
        this.case = {
          name: '',
          billing: null,
          state: null,
          type: null,
        };
      },
    },
  };
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
  }
  </style>
  