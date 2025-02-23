<template>
    <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">
      <h1 class="mb-3 mt-5">Add New Case</h1>
  
      <v-form v-model="valid" @submit.prevent="submitForm" lazy-validation>
        <v-text-field
          v-model="caseInfo.name"
          label="Case Name"
          :rules="nameRules"
          required
        />
        <v-text-field
          v-model="caseInfo.billing"
          label="Billing per unit"
          type="number"
          :rules="numberRules"
          required
        />
        <v-select
          v-model="caseInfo.state"
          :items="['Active', 'Inactive']"
          label="Status"
          :rules="stateRules"
          required
        />
        <v-select
          v-model="caseInfo.type"
          :items="['Daily','Hourly', 'Appointment', 'Interview', 'Completed Call']"
          label="Type"
          :rules="stateRules"
          required
        />
  
        <div class="button-alert-container">
        <v-btn :disabled="!valid" type="submit" color="primary">Submit</v-btn>
        <v-alert 
          v-if="message" 
          :type="alertType" 
          class="ml-3" 
          dense 
          dismissible>
          {{ message }}
        </v-alert>
      </div>
      </v-form>
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
        console.log('Case object: ', me.caseInfo);
        try {
          const response = await axios.post(
            'https://goodcall.fi/api/v1/cases/',
            me.caseInfo
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
  .button-alert-container {
    display: flex;
    align-items: center; /* Align items vertically */
    margin-top: 20px;    /* Add spacing from inputs */
  }
  .ml-3 {
    margin-left: 12px; /* Space between button and alert */
  }
</style>
  