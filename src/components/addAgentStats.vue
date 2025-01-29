<template>
    <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">
      <h1 class="mb-3 mt-5">Add New Agent Stats</h1>
  
      <!-- Agent Form -->
      <v-form v-model="valid" @submit.prevent="submitForm" lazy-validation>
        <v-select
          v-model="agent.name"
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
          v-model="agent.calling_date" 
          label="Calling Date range"
          multiple="range"
          required
        >      
        </v-date-input>
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
          readonly
          outlined
        ></v-text-field>
        
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
  import { mapGetters, mapActions, mapState, mapMutations } from 'vuex';

  export default {
    name: 'AddAgent',
    data() {
      return {
        selectedAgent: null,
        selectedCase: null,
        valid: false,
        agent: {
          name: '',
          case: '',
          meetings: null,
          call_time: null,
          calls_made: null,
          outgoing_calls: null,
          answered_calls: null,
          calling_date: [],
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
      responseRate() {
        const { outgoing_calls, answered_calls } = this.agent;
        if (!outgoing_calls || outgoing_calls === 0) return 0;
        return ((answered_calls || 0) / outgoing_calls * 100).toFixed(1);
      },
    },

    watch: {
      responseRate(newRate) {
        this.agent.response_rate = parseFloat(newRate);
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
        this.setDefaultResponseRate();
        this.submitForm();
      },
      setDefaultResponseRate() {
        if (this.agent.response_rate === null || isNaN(this.agent.response_rate)) {
          this.agent.response_rate = 0;
        }
      },
      async submitForm() {
        try {
          const firstElement = this.agent.calling_date?.[0] 
            ? new Date(this.agent.calling_date[0]).toISOString() 
            : null;

          const lastElement = this.agent.calling_date?.[this.agent.calling_date.length - 1] 
            ? new Date(this.agent.calling_date[this.agent.calling_date.length - 1]).toISOString() 
            : null;

          const dateArray = {
            start: firstElement,
            end: lastElement,
          };

          const payload = {
            ...this.agent,
            calling_date: dateArray, // Transform array to object
          };

          const response = await axios.post(
            'https://goodcall-back-end.onrender.com/api/v1/agentStats/',
            payload
          );
          console.log('Agent added: ', response);
          this.message = 'Stats added successfully!';
          this.alertType = 'success';

          // Refresh the Vuex store with updated stats
          await this.fetchAgentStats();

          this.clearForm();
        } catch (error) {
          console.error('Error adding agent:', error);
          this.message = 'Failed to add agent. Please try again.';
          this.alertType = 'error';
        }
      },

      clearForm() {
        this.agent = {
          name: null,
          case: null,
          calling_date: null,
          meetings: null,
          call_time: null,
          calls_made: null,
          outgoing_calls: null,
          answered_calls: null,
          
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
  