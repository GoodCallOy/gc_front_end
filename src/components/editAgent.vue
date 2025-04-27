<template>
    <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">
      <h1 class="mb-3 mt-5">Edit Agent: {{ activeAgent }}</h1>
  
      <!-- Agent Form -->
      <v-form v-model="valid" @submit.prevent="submitForm" lazy-validation>
        <v-text-field
          v-model="agent.name"
          label="Agent Name"
          :rules="nameRules"
          required
        />
        <v-textarea
          v-model="agent.casesInput"
          label="Cases (comma-separated)"
          required
        />
        <v-text-field
          v-model="agent.position"
          label="Position"
          :rules="nameRules"
          required
        />
  
        <div class="button-alert-container">
          <v-btn :disabled="!valid" type="submit" color="primary">Save Changes</v-btn>
          <v-alert
            v-if="message"
            :type="alertType"
            class="ml-3"
            dense
            dismissible
          >
            {{ message }}
          </v-alert>
        </div>
      </v-form>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  import urls from '../js/config.js';  
  
  export default {
    name: "editAgent",
    props: {
      activeAgent: {
        type: String,
        required: true,
      },
    },
    data() {
      return {
        valid: false,
        agent: {
          name: "",
          casesInput: "", // Temporary input for comma-separated cases
          position: "",
        },
        message: "",
        alertType: "success",
        nameRules: [
          (v) => !!v || "Name is required",
          (v) => (v && v.length <= 100) || "Name must be less than 100 characters",
        ],
      };
    },
    mounted() {
      // Fetch agent data by name when the component is mounted
      this.fetchAgentByName();
    },
    methods: {
      async fetchAgentByName() {
        try {
          // Make API request to fetch agent by name
          const response = await axios.get(
            `${urls.backEndURL}/agent/getagent/${this.activeAgent}`
          );
          const agent = response.data;
  
          // Populate the form with the retrieved agent data
          this.agent.name = agent.name || "";
          this.agent.position = agent.position || "";
          this.agent.casesInput = agent.cases ? agent.cases.join(", ") : "";
          this.agent._id = agent._id;
        } catch (error) {
          console.error("Error fetching agent data:", error);
          this.message = "Failed to retrieve agent data. Please try again.";
          this.alertType = "error";
        }
      },
      async submitForm() {
        const me = this;
        // Convert casesInput (comma-separated string) into an array
        const payload = {
          name: me.agent.name,
          cases: me.agent.casesInput.split(",").map((caseName) => caseName.trim()),
          position: me.agent.position,
        };
  
        try {
          const response = await axios.post(
            `${urls.backEndURL}/agent/${me.agent._id}`, // Use the agent's ID for update
            payload
          );
          console.log("Agent updated: ", response);
          me.message = "Agent updated successfully!";
          me.alertType = "success";

          setTimeout(() => {
             me.message = "";
          }, 3000);
        } catch (error) {
          console.error("Error updating agent:", error);
          me.message = "Failed to update agent. Please try again.";
          me.alertType = "error";
        }
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
    max-height: 4em;
  }
  .button-alert-container {
    display: flex;
    align-items: center;
    margin-top: 20px;
  }
  .ml-3 {
    margin-left: 12px;
  }
  </style>
  