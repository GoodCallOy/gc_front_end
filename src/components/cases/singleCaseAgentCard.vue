<template>
    <v-card  class="mx-2 my-2 mb-5" elevation="16" style="width: 225px">
      <v-card-item class="center">
        <template v-slot:title>
            {{ agent.name }}
        </template>    
        <template v-slot:subtitle>
          <v-icon
            class="me-1 pb-1"
            color="error"
            icon="mdi-alert"
            size="18"
          ></v-icon>
  
            Goal not met
        </template>
      </v-card-item>
  
      <v-card-text class="py-0 mb-5">
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
          <v-list-item-subtitle class="mt-1">Meetings: {{ agent.meetings }}</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">Call Time: {{ agent.call_time }} hours</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">Calls Completed: {{ agent.calls_made }}</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">Outgoing Calls: {{ agent.outgoing_calls }}</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">Answered Calls: {{ agent.answered_calls }}</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">Response Rate: {{ agent.response_rate }}%</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-5">Date: {{ agent.monthKey }}</v-list-item-subtitle>
          <v-card-text>
            <v-btn color="primary" class="mb-5 mr-3" @click="viewAgent">
              View
            </v-btn>
            <v-btn color="primary" class="mb-5" @click="editAgent">
              Edit
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
              <v-list-item-subtitle>Calls Completed: {{ filteredStats.calls_made }}</v-list-item-subtitle>
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
import { fetchAgentgoalsByAgentAndMonth } from '../../js/statsUtils';
import { getMonthKey } from '../../js/dateUtils';

  export default {
    props: {
        agent: {
        type: Object,
        required: true, 
        },
        // YTDStats: {
        // type: Object,
        // required: true, 
        // },
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
          // Find the stat object that matches the agent.case
          console.log('agent.case', this.agent.case);
          return this.YTDStats.find(stat => stat.case === this.agent.case);
        }
    },

    async mounted() { 
      await this.fetchAgentgoals();
      this.printDebug();
      
    },
    methods: {
      async fetchAgentgoals() {
        // console.log('this.agent.monthKey', this.agent.monthKey);
        // console.log('this.agent', this.agent);
        try {
        this.agentGoals = await fetchAgentgoalsByAgentAndMonth(this.agent.name, this.agent.monthKey);
      } catch (error) {
        console.error("Error fetching agent goals:", error);
      }
      },
      viewAgent() {
      this.$router.push({
        name: 'agentInCase',
        query: { 
          agent: this.agent.name,
          selectedCase: this.agent.case
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
        const matchingGoal = this.agentGoals.find(
        goal => goal.case === this.agent.case && goal.monthKey === this.agent.monthKey
    );

    return matchingGoal ? matchingGoal.goal : 0;
  },
      printDebug() {
        // console.log('this.agentGoals', this.agentGoals);
      }
    },
  }
</script>