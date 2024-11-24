<template>
    <v-card class="mx-2 my-2" elevation="16" style="width: 175px; height: 300px;">
      <v-card-title>{{ agent.name }}</v-card-title>
      <v-card-subtitle>Agent Stats</v-card-subtitle>
      <v-card-text>
        <p>Meetings: {{ agent.meetings }}</p>
        <p>Call Time: {{ agent.call_time }} mins</p>
        <p>Calls Made: {{ agent.calls_made }}</p>
        <p>Outgoing Calls: {{ agent.outgoing_calls }}</p>
        <p>Answered Calls: {{ agent.answered_calls }}</p>
        <p>Response Rate: {{ agent.response_rate }}%</p>
        <p>Case: {{ agent.case }}</p>
      </v-card-text>
    </v-card>
  </template>
  
  <script>
  export default {
    name: 'AgentCard',
    props: {
      agent: {
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
  