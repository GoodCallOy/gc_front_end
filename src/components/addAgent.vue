<template>
    <div class="d-flex flex-column align-center" style="height: 100vh; justify-content: center;">
      <h1 class="mb-3 mt-5">Add New Agent</h1>
  
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
  import axios from "axios";
  
  export default {
    name: "AddAgent",
    data() {
      return {
        valid: false,
        agent: {
          name: "",
          casesInput: "", // Temporary input for comma-separated cases
          position: "",
        },
        message: "",
        alertType: "success", // For success or error alerts
        nameRules: [
          (v) => !!v || "Name is required",
          (v) => (v && v.length <= 100) || "Name must be less than 100 characters",
        ],
      };
    },
    methods: {
      async submitForm() {
        const me = this;
        console.log("Agent object before sending: ", me.agent);
  
        // Transform casesInput (comma-separated string) into an array
        const payload = {
          name: me.agent.name,
          cases: me.agent.casesInput.split(",").map((caseName) => caseName.trim()),
          position: me.agent.position,
        };
  
        console.log("Payload sent to backend: ", payload);
  
        try {
          const response = await axios.post(
            "https://goodcall-back-end.onrender.com/api/v1/agent/",
            payload
          );
          console.log("Agent added: ", response);
          me.message = "Agent added successfully!";
          me.alertType = "success";
          me.clearForm();
        } catch (error) {
          console.error("Error adding agent:", error);
          me.message = "Failed to add agent. Please try again.";
          me.alertType = "error";
        }
      },
      clearForm() {
        this.agent = {
          name: "",
          casesInput: "",
          position: "",
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
  