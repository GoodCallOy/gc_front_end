<template>
  <v-card class="mx-2 my-2 mb-5" elevation="16" style="width: 200px; height: 350px;">
    <v-card-title class="text-center">{{ agent.name }}</v-card-title>
    <v-card-text>
      <p><strong>Meetings:</strong> {{ agent.meetings || 0 }}</p>
      <p><strong>Call Time:</strong> {{ agent.call_time || 0 }} hrs</p>
      <p><strong>Outgoing Calls:</strong> {{ agent.outgoing_calls || 0 }}</p>
      <p><strong>Answered Calls:</strong> {{ agent.answered_calls || 0 }}</p>
      <p><strong>Response Rate:</strong> {{ agent.response_rate || 0 }}%</p>
      <p><strong>Completed Calls:</strong> {{ agent.completed_calls || 0 }}</p>
      <p><strong>Quantity Completed:</strong> {{ agent.quantityCompleted || 0 }}</p>
      <p><strong>Case:</strong> {{ agent.case || 'No activity' }}</p>
    </v-card-text>

    <v-card-text>
      <div class="d-flex justify-center">
        <v-btn color="primary" class="mb-5 mr-2" @click="viewAgent">
          View
        </v-btn>
        <v-btn color="primary" class="mb-5" @click="editAgent">
          Edit
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'AgentCard',
  props: {
    agent: {
      type: Object,
      required: true, // Pass the case ID as a prop
    },
  },

  computed: {
    ...mapState(['cases', 'currentPage']), // Access cases and currentPage from the store

    caseData() {
      // Find the case data by ID from the store
      return this.cases.find(singleCase => singleCase.id === this.caseId) || {};
    },

    caseStats() {
      // Example: Calculate stats based on the case data
      return {
        totalMeetings: this.caseData.meetings || 0,
        totalOutgoingCalls: this.caseData.outgoing_calls || 0,
        totalCallTime: this.caseData.call_time || 0,
      };
    },
  },


  methods: {
    viewAgent() {
      this.$router.push({
        name: 'singleAgent',
        query: { agent: this.agent.name },
      });
    },

    editAgent() {
      this.$router.push({
        name: 'editAgent',
        query: { activeAgent: this.agent.name },
      });
    },
  },
};
</script>