<template>
    <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">
      <h1 class="mb-3 mt-5">Add New Agent Stats</h1>
  
      <!-- Agent Form -->
      <v-form v-model="valid" @submit.prevent="submitForm" lazy-validation>
        <v-text-field
          v-model="agent.name"
          label="Agent Name"
          :rules="nameRules"
          required
        />
        <v-text-field
          v-model="agent.meetings"
          label="Meeting"
          type="number"
          :rules="numberRules"
          required
        />
        <v-text-field
          v-model="agent.call_time"
          label="Call Time (minutes)"
          type="number"
          :rules="numberRules"
          required
        />
        <v-text-field
          v-model="agent.calls_made"
          label="Calls Made"
          type="number"
          :rules="numberRules"
          required
        />
        <v-text-field
          v-model="agent.outgoing_calls"
          label="Outgoing Calls"
          type="number"
          required
        />
        <v-text-field
          v-model="agent.answered_calls"
          label="Answered Calls"
          type="number"
        />
        <v-text-field
          v-model="agent.response_rate"
          label="Response Rate (%)"
          type="number"
        />
        <v-text-field
          v-model="agent.case"
          label="Case Name"
        />
  
        <v-btn :disabled="!valid" @click="submitForm" color="primary">Submit</v-btn>
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
    name: 'AddAgent',
    data() {
      return {
        valid: false,
        agent: {
          name: '',
          call_time: null,
          meetings: null,
          calls_made: null,
          outgoing_calls: null,
          answered_calls: null,
          response_rate: null,
          case: '',
        },
        message: '',
        alertType: 'success', // For success or error alerts
        nameRules: [
          v => !!v || 'Name is required',
          v => (v && v.length <= 100) || 'Name must be less than 100 characters',
        ],
        numberRules: [
          v => v >= 0 || 'Value must be 0 or higher',
        ],
      };
    },
    methods: {
      async submitForm() {
        const me = this
        console.log('Agent object: ', me.agent)
        try {
          const response = await axios.post('https://goodcall-back-end.onrender.com/api/v1/agentStats/', me.agent);
          console.log('Agent added: ', response)
          me.message = 'Agent added successfully!';
          me.alertType = 'success';
          me.clearForm();
        } catch (error) {
          console.error('Error adding agent:', error);
          me.message = 'Failed to add agent. Please try again.';
          me.alertType = 'error';
        }
      },
      clearForm() {
        this.agent = {
          name: '',
          meetings: null,
          call_time: null,
          calls_made: null,
          outgoing_calls: null,
          answered_calls: null,
          response_rate: null,
          case: '',
        };
      },
    },
  };
  </script>
  
  <style scoped>
  /* Optional styles for the form */
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
  