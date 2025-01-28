<template>
    <v-card
      class="mx-auto"
      max-width="184"
    >
      <v-card-item>
        <template v-slot:title>
            {{ agent.case }}
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
          <v-col
            class="text-h3"
            cols="5"
          >64
          </v-col>
        </v-row>
      </v-card-text>
  
      <div class="d-flex py-3 justify-space-between">
        <v-list-item>
          <v-list-item-subtitle>Meetings: {{ agent.meetings }}</v-list-item-subtitle>
          <v-list-item-subtitle>Call Time: {{ agent.call_time }} mins</v-list-item-subtitle>
          <v-list-item-subtitle>Calls Made: {{ agent.calls_made }}</v-list-item-subtitle>
          <v-list-item-subtitle>Outgoing Calls: {{ agent.outgoing_calls }}</v-list-item-subtitle>
          <v-list-item-subtitle>Answered Calls: {{ agent.answered_calls }}</v-list-item-subtitle>
          <v-list-item-subtitle>Answered Calls: Response Rate: {{ agent.response_rate }}%</v-list-item-subtitle>
          <v-card-text>
      </v-card-text>
        </v-list-item>
  
      </div>
  
      <v-expand-transition>
        <div v-if="expand">
          <v-list class="bg-transparent">
            <v-list-item>
            
              <v-list-item-title>Year to date stats</v-list-item-title>
           
          </v-list-item>
           
            <v-list-item>
                <v-list-item-subtitle>Meetings: {{ agent.meetings }}</v-list-item-subtitle>
                <v-list-item-subtitle>Call Time: {{ agent.call_time }} mins</v-list-item-subtitle>
                <v-list-item-subtitle>Calls Made: {{ agent.calls_made }}</v-list-item-subtitle>
                <v-list-item-subtitle>Outgoing Calls: {{ agent.outgoing_calls }}</v-list-item-subtitle>
                <v-list-item-subtitle>Answered Calls: {{ agent.answered_calls }}</v-list-item-subtitle>
                <v-list-item-subtitle>Answered Calls: Response Rate: {{ agent.response_rate }}%</v-list-item-subtitle>
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
import { mapGetters, mapActions, mapState, mapMutations } from 'vuex';

  export default {
    props: {
        agent: {
        type: Object,
        required: true, // The agent data must be passed as a prop
        },
    },
    data: () => ({
      expand: false,
    }),
    computed: {
        ...mapGetters(['enrichedAgents', 'agents', 'cases', 'agentStats', 'currentPage']), // Map Vuex getter to local computed property
        ...mapState(["currentPage"]), // Maps the `currentPage` state to a computed property

        currentPage() {
        console.log('currentPage', this.$store.getters.currentPage)
        return this.$store.getters.currentPage;
        },
    },

    async mounted() {
        this.fetchAgents(); // Fetch agents when the component is mounted
        this.fetchAgentStats(); // Fetch agent stats when the component is mounted
        this.fetchCases();
        this.updatePage('sigleStatCard');
        await this.fetchAgentStats();
        // this.printDebug();
    },
    methods: {
    ...mapActions(['fetchAgents', 'fetchAgentStats', 'fetchCases']), // Map Vuex actions to local methods

    ...mapMutations(["setCurrentPage"]), // Maps mutation to update `currentPage`
    updatePage(newPage) {
      this.setCurrentPage(newPage); // Update `currentPage` in the store
    },
    printDebug() {
        console.log('agentStats', this.agentStats)
        console.log('agent', this.agent)
      }
  },
  }
</script>