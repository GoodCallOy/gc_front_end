<template>
    <v-card class="mx-2 my-2 mb-5" elevation="16" style="width: 175px; height: 300px;">
      <v-card-title>{{ agent.name }}</v-card-title>
      <v-card-text>
        <p>Meetings: {{ agent.meetings }}</p>
        <p>Call Time: {{ agent.call_time }} hours</p>
        <p>Calls Made: {{ agent.calls_made }}</p>
        <p>Outgoing Calls: {{ agent.outgoing_calls }}</p>
        <p>Answered Calls: {{ agent.answered_calls }}</p>
        <p>Response Rate: {{ agent.response_rate }}%</p>
        <p>Case: {{ agent.case }}</p>
      </v-card-text>

      <v-card-text>
        <div v-if="currentPage !== 'singleAgent'" class="d-flex justify-center">
          <v-btn color="primary" class="mb-5" @click="viewAgent">
            View Agent
          </v-btn>
        </div>  
      </v-card-text>
    </v-card>
  </template>
  
  <script>
  import { mapGetters, mapState, mapActions } from 'vuex';

  export default {
    name: 'AgentCard',
    props: {

      agent: {
        type: Object,
        required: true, // The agent data must be passed as a prop
      },
    },

    computed: {
      ...mapGetters(['enrichedAgents', 'agents', 'cases', 'agentStats', 'currentPage']),
      ...mapState(['currentPage']),
  
      selectedAgent() {
        const agentName = this.$route.query.agent;
        return this.agents.find(singleAgent => singleAgent.name === agentName);
      },
      
    },

    mounted() {
      this.fetchAgents();
      this.fetchAgentStats();
      this.fetchCases();
    },

    methods: {
    ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases']),

    viewAgent() {
      this.$router.push({
        name: 'singleAgent',
        query: { agent: this.agent.name },
      });
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
  