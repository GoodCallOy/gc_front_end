<template>
    <v-card
      class="mx-auto"
      max-width="184"
    >
      <v-card-item>
        <template v-slot:title>
            {{ caseId }}
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
  
      <div class="d-flex py-3 justify-space-between">
        <v-list-item>
          <v-list-item-subtitle class="mt-1">Meetings: {{ formatStatNumber(meetings) }}</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">Call Time: {{ formatStatNumber(call_time) }} hours</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">Calls Made: {{ formatStatNumber(calls_made) }}</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">Outgoing Calls: {{ formatStatNumber(outgoing_calls) }}</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">Answered Calls: {{ formatStatNumber(answered_calls) }}</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">Response Rate: {{ formatStatNumber(response_rate) }}%</v-list-item-subtitle>
          <v-list-item-subtitle class="mt-5">Calling Date: {{ calling_date }}</v-list-item-subtitle>
        </v-list-item>
  
      </div>
    </v-card>
  </template>

<script>
  import { formatStatNumber } from '@/js/formatNumbers';

  export default {
    props: {
        caseId: {
        type: String,
        required: true, 
        },
        activeCase: {
        type: String,
        required: true, 
        },
        agent: {
        type: String,
        required: true, 
        },
        meetings: {
        type: Number,
        required: true, 
        },
        call_time: {
        type: Number,
        required: true, 
        },
        calls_made: {
        type: Number,
        required: true, 
        },
        outgoing_calls: {
        type: Number,
        required: true, 
        },
        answered_calls: {
        type: Number,
        required: true, 
        },
        response_rate: {
        type: Number,
        required: true, 
        },
        calling_date: {
        type: String,
        required: true, 
        },
        
        
    },
    data: () => ({
      expand: false,
    }),
    computed: {
      filteredStats() {
          // Find the stat object that matches the selectedCase.caseId
          console.log('selectedCase.caseId', this.selectedCase.caseId);
          return this.YTDStats.find(stat => stat.caseId === this.selectedCase.caseId);
        }
    },

    mounted() { 
      this.printDebug();
    },
    methods: {
      formatStatNumber,
      viewAgent() {
      this.$router.push({
        name: 'agentInCase',
        query: { 
          agent: this.agent,
          selectedCase: this.selectedCase.caseId
        },
      });
    },
      printDebug() {
        
      }
    },
  }
</script>