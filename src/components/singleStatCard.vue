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
          <v-col
            class="text-h3"
            cols="5"
          >64
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
                <v-list-item-subtitle>Meetings: {{ YTDStats[0].meetings }}</v-list-item-subtitle>
                <v-list-item-subtitle>Call Time: {{ YTDStats[0].call_time }} mins</v-list-item-subtitle>
                <v-list-item-subtitle>Calls Made: {{ YTDStats[0].calls_made }}</v-list-item-subtitle>
                <v-list-item-subtitle>Outgoing Calls: {{ YTDStats[0].outgoing_calls }}</v-list-item-subtitle>
                <v-list-item-subtitle>Answered Calls: {{ YTDStats[0].answered_calls }}</v-list-item-subtitle>
                <v-list-item-subtitle>Response Rate: {{ YTDStats[0].response_rate }}%</v-list-item-subtitle>
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
  export default {
    props: {
        agent: {
        type: Object,
        required: true, // The agent data must be passed as a prop
        },
        selectedCase: {
        type: Object,
        required: true, // The agent data must be passed as a prop
        },
        YTDStats: {
        type: Object,
        required: true, // The agent data must be passed as a prop
        },
    },
    data: () => ({
      expand: false,
    }),
    

    async mounted() { 
      this.printDebug();
    },
    methods: {
      viewAgent() {
      this.$router.push({
        name: 'agentInCase',
        query: { 
          agent: this.agent,
          selectedCase: JSON.stringify(this.selectedCase)
        },
      });
    },
      printDebug() {
        console.log('YTDStats', this.YTDStats)
        console.log('agent', this.agent)
      }
    },
  }
</script>