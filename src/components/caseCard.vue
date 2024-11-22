<template>
    <v-card class="mx-2 my-2" elevation="16" style="width: 200px; height: 300px;">
      <v-card-title>{{ companyCase.name }}</v-card-title>
      <v-card-subtitle>Cases</v-card-subtitle>
      <v-card-text>
        <p>Name: {{ companyCase.name }}</p>
        <p>Billing: {{ companyCase.billing }} mins</p>
      </v-card-text>
    </v-card>
  </template>
  
  <script>
  export default {
    name: 'CaseCard',
    props: {
      companyCase: {
        type: Object,
        required: true, // The agent data must be passed as a prop
      },
    },
  };
  </script>
  
  <style scoped>
  /* Optional scoped styles for the card */
  .v-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
  }
  </style>
  