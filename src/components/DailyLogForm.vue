<template>
  <v-card class="pa-4" elevation="2">
    <v-form ref="formRef" v-model="formValid" @submit.prevent="submitForm">
      <v-select
        v-model="form.agent"
        :items="gcAgents"
        item-title="name"
        item-value="_id"
        label="Select Agent"
        :disabled="isCaller"
        required
      />

      <v-select
        v-model="form.order"
        :items="filteredOrders"
        item-title="caseName"
        item-value="_id"
        label="Select Order"
        :hint="filteredOrders.length === 0 && form.agent ? 'No cases assigned to this agent for the current month' : ''"
        persistent-hint
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
import { useRoute } from 'vue-router'


export default {
  props: {
    logToEdit: Object
  },
  setup() {
    const route = useRoute();
    return {
      route
    };
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
    formValid: true,
    originalLogId: null // Store the ID of the log being edited
    }
  },
  computed: {
  ...mapState(['gcAgents', 'orders', 'user', 'cases']),
  isEditing() {
    return !!this.logToEdit || !!this.originalLogId
  },
  isCaller() {
    return this.user?.user?.role === 'caller'
  },
  isCallerLinkedToAgent() {
    return this.isCaller && this.user?.user?.linkedUserId
  },
  ordersWithCaseName() {
    return this.orders.map(order => {
      // Try to find the case name from the cases store
      const matchedCase = this.cases.find(c => c._id === order.caseId);
      const caseName = matchedCase ? matchedCase.name : (order.caseName || order.caseId?.name || 'Unnamed Case');
      
      return {
        ...order,
        caseName: caseName
      };
    });
  },
  filteredOrders() {
    // Filter orders to show only cases the selected agent is assigned to for the current month
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    // Calculate month boundaries
    const monthStart = new Date(currentYear, currentMonth, 1)
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)
    
    return this.ordersWithCaseName.filter(order => {
      // Check if order is active during the current month
      if (!order.startDate || !order.deadline) return false
      
      const orderStart = new Date(order.startDate)
      const orderEnd = new Date(order.deadline)
      
      // Check if order overlaps with current month
      const isActiveThisMonth = orderStart <= monthEnd && orderEnd >= monthStart
      
      // Check if the selected agent is assigned to this order
      const isAgentAssigned = this.form.agent && order.assignedCallers && 
        order.assignedCallers.some(caller => {
          // Handle both string IDs and object IDs
          const callerId = typeof caller === 'string' ? caller : caller.id || caller._id;
          return callerId === this.form.agent;
        });
      
      return isActiveThisMonth && isAgentAssigned
    })
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
        const selectedOrder = this.filteredOrders.find(order => order._id === newOrderId);
        this.form.caseUnit = selectedOrder ? selectedOrder.caseUnit || '' : '';
    },
    'form.agent'(newAgentId) {
        // Clear the selected order when agent changes since available orders will change
        this.form.order = '';
        this.form.caseUnit = '';
        this.form.caseName = '';
    },
  },
async mounted() {
   await this.fetchAllData();
    console.log('Orders fetched:', this.orders);
    
    // Check for edit log data in query parameters
    if (this.route.query.editLog) {
      try {
        const logData = JSON.parse(this.route.query.editLog);
        console.log('Editing log:', logData);
        
        // Populate form with log data
        this.form.agent = logData.agent || '';
        this.form.agentName = logData.agentName || '';
        this.form.order = logData.order || '';
        
        // Resolve case name properly - try to find it from the order if not available in log data
        let resolvedCaseName = logData.caseName || '';
        if (!resolvedCaseName && logData.order) {
          const order = this.ordersWithCaseName.find(o => o._id === logData.order);
          if (order) {
            resolvedCaseName = order.caseName;
          }
        }
        this.form.caseName = resolvedCaseName;
        
        this.form.caseUnit = logData.caseUnit || '';
        this.form.call_time = logData.call_time || 0;
        this.form.completed_calls = logData.completed_calls || 0;
        this.form.outgoing_calls = logData.outgoing_calls || 0;
        this.form.answered_calls = logData.answered_calls || 0;
        this.form.response_rate = logData.response_rate || 0;
        this.form.date = logData.date ? logData.date.substring(0, 10) : new Date().toISOString().substring(0, 10);
        this.form.quantityCompleted = logData.quantityCompleted || 0;
        
        // Store the original log ID for updating
        this.originalLogId = logData._id;
      } catch (error) {
        console.error('Error parsing edit log data:', error);
      }
    } else if (this.isCallerLinkedToAgent) {
      // If caller is linked to an agent, auto-fill the agent field
      const linkedAgent = this.gcAgents.find(agent => agent._id === this.user.user.linkedUserId)
      if (linkedAgent) {
        this.form.agent = linkedAgent._id
        this.form.agentName = linkedAgent.name
      }
    }
  },
  methods: {
    ...mapActions(['fetchOrders', 'fetchgcAgents', 'fetchCases']),

    async fetchAllData() {
        await this.fetchOrders();
        await this.fetchgcAgents();
        await this.fetchCases();
    },
    
    async submitForm() {
        if (!this.formValid) return

        try {
            const selectedAgent = this.gcAgents.find(agent => agent._id === this.form.agent);
            const selectedOrder = this.filteredOrders.find(order => order._id === this.form.order);
            console.log('Selected Agent:', selectedAgent);
            console.log('Selected Order:', selectedOrder);
            const payload = {
            ...this.form,
            agentName: selectedAgent ? selectedAgent.name : '',
            caseName: this.form.caseName || (selectedOrder ? selectedOrder.caseName : '')
            };
            
            console.log('Saving log with caseName:', payload.caseName);
            console.log('Selected order caseName:', selectedOrder ? selectedOrder.caseName : 'No order selected');

            if (this.isEditing && this.originalLogId) {
                // Update existing log
                await axios.put(`${urls.backEndURL}/dailyLogs/${this.originalLogId}`, payload);
                console.log('Log updated successfully');
            } else {
                // Create new log
                await axios.post(`${urls.backEndURL}/dailyLogs`, payload);
                console.log('Log created successfully');
            }

           // Clear form fields but keep agent selection
                const currentAgent = this.form.agent;
                const currentAgentName = this.form.agentName;
                
                this.form.agent = currentAgent;
                this.form.agentName = currentAgentName;
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
                this.originalLogId = null;
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

