<template>
    <v-card
      class="mx-auto"
      max-width="184"
    >
      <v-card-item>
        <template v-slot:title>
            {{ selectedCase.caseId }}
        </template>
        <!-- <template v-slot:subtitle>
          <v-icon
            class="me-1 pb-1"
            color="error"
            icon="mdi-alert"
            size="18"
          ></v-icon>
  
          Extreme Weather Alert
        </template> -->
      </v-card-item>
  
      <v-card-text class="py-0">
        <v-row align="center" no-gutters>
          <v-col
            class="text-h4"
            cols="7"
          >Goal:  
          </v-col>
          <v-col class="text-h3" cols="5">
            {{ getAgentGoal() }}
          </v-col>

        </v-row>
      </v-card-text>
  
      <div class="d-flex py-3 justify-space-between">
        <v-list-item>
          <v-list-item-subtitle class="mt-1">Meetings: {{ selectedCase.meetings }}</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">Call Time: {{ selectedCase.call_time }} hours</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">Calls Made: {{ selectedCase.calls_made }}</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">Outgoing Calls: {{ selectedCase.outgoing_calls }}</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">Answered Calls: {{ selectedCase.answered_calls }}</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">Response Rate: {{ selectedCase.response_rate }}%</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-5">Date: {{ selectedCase.monthKey }}</v-list-item-subtitle>
          <v-card-text>
            <v-btn color="primary" class="mb-5" @click="viewAgent">
              View Agent
            </v-btn>
            <v-btn color="primary" class="mb-5" @click="editAgent">
              Edit Agent
            </v-btn>
      </v-card-text>
        </v-list-item>
  
      </div>
  
      <v-expand-transition>
        <div v-if="expand">
          <v-list class="bg-transparent">
            <v-list-item>
            
              <v-list-item-title>Year to date stats</v-list-item-title>
           
            </v-list-item>
           
            <v-list-item v-if="filteredStats">
              <v-list-item-subtitle>Meetings: {{ filteredStats.meetings }}</v-list-item-subtitle>
              <v-list-item-subtitle>Call Time: {{ filteredStats.call_time }} mins</v-list-item-subtitle>
              <v-list-item-subtitle>Calls Made: {{ filteredStats.calls_made }}</v-list-item-subtitle>
              <v-list-item-subtitle>Outgoing Calls: {{ filteredStats.outgoing_calls }}</v-list-item-subtitle>
              <v-list-item-subtitle>Answered Calls: {{ filteredStats.answered_calls }}</v-list-item-subtitle>
              <v-list-item-subtitle>Response Rate: {{ filteredStats.response_rate }}%</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>
      </v-expand-transition>
  
      <v-divider></v-divider>
  
      <v-card-actions>
        <v-btn
          :text="!expand ? 'Extended Report' : 'Hide Report'"
          @click="expand = !expand"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </template>

<script>
import { fetchAgentgoalsByAgentAndMonth } from '../js/statsUtils';
import { getMonthKey } from '../js/dateUtils';

  export default {
    props: {
        agent: {
        type: String,
        required: true, 
        },
        selectedCase: {
        type: Object,
        required: true, 
        },
        YTDStats: {
        type: Object,
        required: true, 
        },
    },
    data: () => ({
      expand: false,
      agentGoals: [],
    }),
    computed: {
      monthKey() {
        return this.agentGoals.length > 0 ? getMonthKey(this.agentGoals[0].goal_date.start) : "";
      },
      filteredStats() {
          // Find the stat object that matches the selectedCase.caseId
          console.log('selectedCase.caseId', this.selectedCase.caseId);
          return this.YTDStats.find(stat => stat.caseId === this.selectedCase.caseId);
        }
    },

    async mounted() { 
      await this.fetchAgentgoals();
      this.printDebug();
      
    },
    methods: {
      async fetchAgentgoals() {
        console.log('this.selectedCase.monthKey', this.selectedCase.monthKey);
        console.log('this.agent', this.agent);
        try {
        this.agentGoals = await fetchAgentgoalsByAgentAndMonth(this.agent, this.selectedCase.monthKey);
      } catch (error) {
        console.error("Error fetching agent goals:", error);
      }
      },
      viewAgent() {
      this.$router.push({
        name: 'agentInCase',
        query: { 
          agent: this.agent,
          selectedCase: this.selectedCase.caseId
        },
      });
    },
      editAgent() {
        this.$router.push({
            name: 'editAgent',
            query: { activeAgent: this.agent.name },
      });
    },
    getAgentGoal() {
    if (!this.agentGoals.length) return 0;
      console.log('this.agentGoals', this.agentGoals);
    const matchingGoal = this.agentGoals.find(
      goal => goal.case === this.selectedCase.caseId && goal.monthKey === this.selectedCase.monthKey
    );

    return matchingGoal ? matchingGoal.goal : 0;
  },
      printDebug() {
        console.log('this.agentGoals', this.agentGoals);
      }
    },
  }
</script>