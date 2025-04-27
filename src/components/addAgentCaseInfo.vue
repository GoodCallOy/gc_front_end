<template>
    <div class="d-flex flex-column align-center" style="height: 90vh; justify-content: center; margin-bottom: 5%;">
      <h1 class="mb-3 mt-5">Add New Agent Case Info</h1>
  
      <!-- Agent Form -->
      <v-form v-model="valid" @submit.prevent="submitForm" lazy-validation>
        <v-select
          v-model="agent.agent"
          :items="agentsList"
          item-text="title"
          item-value="value"
          label="Select an Agent"
          :rules="nameRules"
          required
          outlined
        ></v-select>
        <v-select
          v-model="agent.case"
          :items="casesList"
          item-text="title"
          item-value="value"
          label="Select a Case"
          outlined
          required
          :rules="nameRules"
        ></v-select>
        <v-date-input 
          clearable 
          v-model="agent.amount_date" 
          label="Amount date range"
          multiple="range"
          required
        >      
        </v-date-input>
        <v-text-field
          v-model="agent.amount"
          label="amount"
          type="number"
          :rules="numberRules"
          required
        />       
        <v-select
          v-model="agent.type"
          :items="['Weekly','Monthly']"
          label="Type"
          required
        />
        <v-text-field
          v-model="monthKey"
          label="Month Key"
          type="string"
          
          required
        />       
        <div class="button-alert-container">
          <v-btn :disabled="!valid" @click="handleSubmit" color="primary" class="mr-3">Submit</v-btn>
           <!-- Success/Failure Message -->
          <v-alert v-if="message" :type="alertType" dismissible>
            {{ message }}
          </v-alert>
        </div>
      </v-form>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import urls from './config.js';
  
  import { mapGetters, mapActions, mapState, mapMutations } from 'vuex';
  import { getMonthKey } from '../js/dateUtils';


  export default {
    name: 'AddAgentCaseInfo',
    data() {
      return {
        selectedAgent: null,
        selectedCase: null,
        valid: false,
        agent: {
            agent: '',
            case: '',
            amount: null,
            amount_date: [],
            type: '',
            monthKey: null,
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

    computed: {
      ...mapGetters(['enrichedAgents', 'agents', 'cases']), // Map Vuex getter to local computed property
      ...mapState(["currentPage"]), // Maps the `currentPage` state to a computed property

      monthKey() {
        console.log('this.agent', this.agent);
        const monthKey =  this.agent.amount_date?.[0] ? getMonthKey(this.agent.amount_date[0]) : null;
        console.log('monthKey', monthKey);
        return monthKey;
      },
      currentPage() {
        console.log('currentPage', this.$store.getters.currentPage)
        return this.$store.getters.currentPage;
      },
      agentsList() {
        // Map agents array to match v-select items
        const agentList = this.agents.map(agent => ({
          title: agent.name, // Display name in the dropdown
          value: agent.name, // Value when selected
        }));
        return agentList;
      },
      casesList() {
        // Map agents array to match v-select items
        const casesList = this.cases.map(singleCase => ({
          title: singleCase.name, // Display name in the dropdown
          value: singleCase.name, // Value when selected
        }));
        return casesList;
      },
    },

    mounted() {
      this.fetchAgents(); // Fetch agents when the component is mounted
      this.fetchAgentStats(); // Fetch agent stats when the component is mounted
      this.fetchCases();
      this.updatePage('dashBoard');
    },


    methods: {
      ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases']), // Map Vuex actions to local methods

      ...mapMutations(["setCurrentPage"]), // Maps mutation to update `currentPage`
      updatePage(newPage) {
        this.setCurrentPage(newPage); // Update `currentPage` in the store
      },
      handleSubmit() {
        this.submitForm();
      },
      async submitForm() {
        try {
          const firstElement = this.agent.amount_date?.[0] 
            ? new Date(this.agent.amount_date[0]).toISOString() 
            : null;

          const lastElement = this.agent.amount_date?.[this.agent.amount_date.length - 1] 
            ? new Date(this.agent.amount_date[this.agent.amount_date.length - 1]).toISOString() 
            : null;

          const dateArray = {
            start: firstElement,
            end: lastElement,
          };

          console.log('agent:', this.agent);
          console.log('dateArray:', dateArray);
          const payload = {
            ...this.agent,
           amount_date: dateArray, // Transform array to object
            monthKey: this.monthKey,
          };

          console.log('payload:', payload);

          const response = await axios.post(
            `${urls.backEndURL}/agentCaseInfo`,
            payload
          );

          console.log('Agent case info added: ', response);
          this.message = 'Agent case info added successfully!';
          this.alertType = 'success';

          // Refresh the Vuex store with updated stats
          await this.fetchAgentStats();

          this.clearForm();
          setTimeout(() => {
            this.message = "";
          }, 3000);
        } catch (error) {
          console.error('Error adding agent:', error);
          this.message = 'Failed to add agent. Please try again.';
          this.alertType = 'error';
        }
      },

      clearForm() {
        this.agent = {
            agent: null,
            case: null,
            amount_date: null,
            amount: null,
            type: null,
            monthKey: null,
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
  .button-alert-container {
    display: flex;
    align-items: center; /* Align items vertically */
    margin-top: 20px;    /* Add spacing from inputs */
  }
  </style>
  