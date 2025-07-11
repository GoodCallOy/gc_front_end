<template>
  <v-card class="pa-4" elevation="2">
    <v-form ref="formRef" v-model="formValid" @submit.prevent="submitForm">
      <v-select
        v-model="form.agent"
        :items="gcAgents"
        item-title="name"
        item-value="_id"
        label="Select Agent"
        required
      />

      <v-select
        v-model="form.order"
        :items="orders"
        item-title="caseName"
        item-value="_id"
        label="Select Order"
        required
      />

      <v-text-field v-model="form.caseUnit" label="Case Unit" required />
      <v-text-field v-model.number="form.call_time" label="Call Time" type="number" required />
      <v-text-field v-model.number="form.completed_calls" label="Completed Calls" type="number" required />
      <v-text-field v-model.number="form.outgoing_calls" label="Outgoing Calls" type="number" required />
      <v-text-field v-model.number="form.answered_calls" label="Answered Calls" type="number" required />

      <v-text-field
        :value="formattedResponseRate"
        label="Response Rate"
        readonly
        persistent-placeholder
      />
     
      <v-text-field
        v-model.number="form.quantityCompleted"
        label="Quantity Completed"
        type="number"
        required
      />

      <v-text-field
        v-model="form.date"
        label="Date"
        type="date"
        required
      />

      <v-btn type="submit" :disabled="!formValid" color="primary" class="mt-4">
        {{ isEditing ? 'Update Log' : 'Add Log' }}
      </v-btn>
    </v-form>
  </v-card>
</template>

<script>
import axios from 'axios'
import { mapState, mapActions } from 'vuex'
import urls from '@/js/config.js'


export default {
  props: {
    logToEdit: Object
  },
  data() {
    return {
       form: {
      agent: this.logToEdit?.agent || '',
      agentName: this.logToEdit?.agentName || '',
      order: this.logToEdit?.order || '',
      caseName: this.logToEdit?.caseName || '',
      caseUnit: this.logToEdit?.caseUnit || '',
      call_time: this.logToEdit?.call_time || 0,
      completed_calls: this.logToEdit?.completed_calls || 0,
      outgoing_calls: this.logToEdit?.outgoing_calls || 0,
      answered_calls: this.logToEdit?.answered_calls || 0,
      response_rate: this.logToEdit?.response_rate || 0,
      date: this.logToEdit?.date?.substring(0, 10) || new Date().toISOString().substring(0, 10),
      quantityCompleted: this.logToEdit?.quantityCompleted || 0,
    },
    formValid: true
    }
  },
  computed: {
  ...mapState(['gcAgents', 'orders']),
  isEditing() {
    return !!this.logToEdit
  },
  ordersWithCaseName() {
    return this.orders.map(order => ({
      ...order,
      caseName: order.caseId?.name || 'Unnamed Case'
    }));
  },
  responseRateValue() {
    const outgoing = Number(this.form.outgoing_calls) || 0;
    const answered = Number(this.form.answered_calls) || 0;
    return outgoing > 0 ? ((answered / outgoing) * 100) : 0;
  },
  formattedResponseRate() {
    return this.responseRateValue.toFixed(1) + ' %';
  }
},
 watch: {
    'form.order'(newOrderId) {
        const selectedOrder = this.orders.find(order => order._id === newOrderId);
        this.form.caseUnit = selectedOrder ? selectedOrder.caseUnit || '' : '';
    },
  },
async mounted() {
   await this.fetchAllData();
    console.log('Orders fetched:', this.orders);
  },
  methods: {
    ...mapActions(['fetchOrders', 'fetchgcAgents']),

    async fetchAllData() {
        await this.fetchOrders();
        await this.fetchgcAgents();
    },
    
    async submitForm() {
        if (!this.formValid) return

        try {
            const selectedAgent = this.gcAgents.find(agent => agent._id === this.form.agent);
            const selectedOrder = this.orders.find(order => order._id === this.form.order);
            console.log('Selected Agent:', selectedAgent);
            console.log('Selected Order:', selectedOrder);
            const payload = {
            ...this.form,
            agentName: selectedAgent ? selectedAgent.name : '',
            caseName: selectedOrder && selectedOrder.caseId ? selectedOrder.caseName : ''
            };

            await axios.post(`${urls.backEndURL}/dailyLogs`, payload);
           // Clear form fields
                this.form.agent = '';
                this.form.agentName = '';
                this.form.order = '';
                this.form.caseName = '';
                this.form.caseUnit = '';
                this.form.call_time = 0;
                this.form.completed_calls = 0;
                this.form.outgoing_calls = 0;
                this.form.answered_calls = 0;
                this.form.response_rate = 0;
                this.form.date = new Date().toISOString().substring(0, 10);
                this.form.quantityCompleted = 0;
                this.$emit('saved');
        } catch (err) {
            console.error('Failed to save log', err);
        }
    }
  },
  
}
</script>
<style scoped>  
  .v-form {
    width: 400px;
    max-width: 100%;
    margin: 0 auto;
  }
</style>

