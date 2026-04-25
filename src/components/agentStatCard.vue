<template>
  <v-card class="agent-stat-card" elevation="8">
    <div class="agent-name">
      {{ agentName }}
    </div>
    <v-row dense>
      <v-col cols="6"><strong>Unit:</strong> {{ caseUnit }}</v-col>
      <v-col cols="6"><strong>Date:</strong> {{ formattedDate }}</v-col>      <v-col cols="6"><strong>Call Time:</strong> {{ formatStatNumber(callTime) }}</v-col>
      <v-col cols="6"><strong>Completed:</strong> {{ formatStatNumber(completedCalls) }}</v-col>
      <v-col cols="6"><strong>Outgoing:</strong> {{ formatStatNumber(outgoingCalls) }}</v-col>
      <v-col cols="6"><strong>Answered:</strong> {{ formatStatNumber(answeredCalls) }}</v-col>
      <v-col cols="5"><strong>Resp. Rate:</strong> {{ formatStatNumber(responseRate) }}%</v-col>
      <v-col cols="7"><strong>Qty Completed:</strong> {{ formatStatNumber(quantityCompleted) }}</v-col>
      <v-col cols="12"><strong>Amount Made:</strong> {{ amountMadeFormatted }}</v-col>
    </v-row>
    
    <!-- Edit Button -->
    <v-row class="mt-2" v-if="logData">
      <v-col cols="12" class="text-center">
        <v-btn 
          color="primary" 
          size="small" 
          prepend-icon="mdi-pencil"
          @click="editLog"
        >
          Edit Log
        </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
const props = defineProps({
  agentName: String,
  caseUnit: String,
  pricePerUnit: [String, Number],
  callTime: [String, Number],
  completedCalls: [String, Number],
  outgoingCalls: [String, Number],
  answeredCalls: [String, Number],
  responseRate: [String, Number],
  date: String,
  quantityCompleted: [String, Number],
  logData: Object, // The complete log object for editing
});

import { computed } from 'vue';
import { formatStatNumber, formatCurrencyEUR } from '@/js/formatNumbers';

const emit = defineEmits(['edit-log']);

const formattedDate = computed(() => {
  if (!props.date) return '';
  const d = new Date(props.date);
  // Format: dd.mm.yy
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).replace(/\//g, '.');
});

const amountMadeFormatted = computed(() =>
  formatCurrencyEUR(
    (Number(props.pricePerUnit) || 0) * (Number(props.quantityCompleted) || 0)
  )
);

const editLog = () => {
  if (props.logData) {
    emit('edit-log', props.logData);
  }
};
</script>

<style scoped>
.agent-stat-card {
  margin: 16px;
  min-width: 300px;
  max-width: 400px;
  height: auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 16px 16px 16px ;
}
.agent-name {
  text-align: center;
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}
</style>