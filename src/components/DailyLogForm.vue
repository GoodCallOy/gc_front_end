<template>
  <v-card class="pa-4" elevation="2">
    <v-form ref="formRef" v-model="formValid" @submit.prevent="submitForm">
      <v-select
        v-model="form.agent"
        :items="gcAgents"
        item-title="name"
        item-value="_id"
        :label="$t('dailyLogForm.selectAgent')"
        :disabled="isCaller"
        required
      />

      <v-select
        v-model="form.order"
        :items="filteredOrders"
        item-title="caseName"
        item-value="_id"
        :label="$t('dailyLogForm.selectCase')"
        :hint="filteredOrders.length === 0 && form.agent ? $t('dailyLogForm.noCasesAssigned') : ''"
        persistent-hint
        required
      />

      <v-text-field v-model="form.caseUnit" :label="$t('dailyLogForm.caseUnit')" required />
      <v-text-field v-model.number="form.call_time" :label="$t('dailyLogForm.callTime')" type="number" required />
      <v-text-field v-model.number="form.completed_calls" :label="$t('dailyLogForm.completedCalls')" type="number" required />

      <!-- Toggle for call detail fields -->
      <v-btn
        class="mt-2 mb-2"
        variant="text"
        color="primary"
        @click="showCallFieldsExpanded = !showCallFieldsExpanded"
      >
        {{ showCallFieldsExpanded ? 'Hide call details' : 'Show call details' }}
      </v-btn>

      <template v-if="showCallFieldsExpanded">
        <v-text-field v-model.number="form.outgoing_calls" :label="$t('dailyLogForm.outboundCalls')" type="number" required />
        <v-text-field v-model.number="form.answered_calls" :label="$t('dailyLogForm.answeredCalls')" type="number" required />
      </template>

      <!-- Toggle for lead fields -->
      <v-btn
        class="mt-4 mb-2"
        variant="text"
        color="primary"
        @click="showLeadFieldsExpanded = !showLeadFieldsExpanded"
      >
        {{ showLeadFieldsExpanded ? 'Hide lead fields' : 'Show lead fields' }}
      </v-btn>

      <!-- Conditional Kuuki / Hourly / Daily fields -->
      <template v-if="showLeadFields">
        <v-text-field v-model.number="form.aLeads" :label="$t('dailyLogForm.aLeads')" type="number" min="0" />
        <v-text-field v-model.number="form.bLeads" :label="$t('dailyLogForm.bLeads')" type="number" min="0" />
        <v-text-field v-model.number="form.cLeads" :label="$t('dailyLogForm.cLeads')" type="number" min="0" />
        <v-text-field v-model.number="form.dLeads" :label="$t('dailyLogForm.dLeads')" type="number" min="0" />
        <v-text-field v-model.number="form.noPotential" :label="$t('dailyLogForm.noPotential')" type="number" min="0" />
      </template>

      <!-- Conditional Interviews fields -->
      <template v-if="showInterviewFields">
        <v-text-field v-model.number="form.interviews" :label="$t('dailyLogForm.interviews')" type="number" min="0" />
        <v-text-field v-model.number="form.hours" :label="$t('dailyLogForm.hours')" type="number" min="0" />
        <v-text-field v-model.number="form.bookedInterviews" :label="$t('dailyLogForm.bookedInterviews')" type="number" min="0" />
        <v-text-field v-model.number="form.completedInterviews" :label="$t('dailyLogForm.completedInterviews')" type="number" min="0" />
        <v-text-field v-model.number="form.resultAnalysis" :label="$t('dailyLogForm.resultAnalysis')" type="number" min="0" />
      </template>
     
      <v-text-field
        v-model.number="form.quantityCompleted"
        :label="$t('dailyLogForm.results')"
        type="number"
        required
      />

      <v-textarea
        v-model="form.comments"
        :label="$t('dailyLogForm.comments')"
        auto-grow
        rows="2"
        max-rows="5"
      />

      <v-text-field
        v-model="form.date"
        :label="$t('dailyLogForm.date')"
        type="date"
        required
      />

      <div class="d-flex align-center mt-4" style="gap: 12px;">
        <v-btn type="submit" :disabled="!formValid" color="primary">
          {{ isEditing ? $t('dailyLogForm.updateLog') : $t('dailyLogForm.addLog') }}
        </v-btn>
        <v-alert
          v-if="showSuccessMessage"
          type="success"
          density="compact"
          variant="tonal"
          class="mb-0"
          style="flex: 1;"
        >
          {{ successMessage }}
        </v-alert>
      </div>
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
      comments: this.logToEdit?.comments || '',
      // Conditional lead fields (always included in payload, default 0)
      aLeads: this.logToEdit?.aLeads || 0,
      bLeads: this.logToEdit?.bLeads || 0,
      cLeads: this.logToEdit?.cLeads || 0,
      dLeads: this.logToEdit?.dLeads || 0,
      noPotential: this.logToEdit?.noPotential || 0,
      // Conditional interview fields (always included in payload, default 0)
      interviews: this.logToEdit?.interviews || 0,
      hours: this.logToEdit?.hours || 0,
      bookedInterviews: this.logToEdit?.bookedInterviews || 0,
      completedInterviews: this.logToEdit?.completedInterviews || 0,
      resultAnalysis: this.logToEdit?.resultAnalysis || 0,
    },
    formValid: true,
    originalLogId: null, // Store the ID of the log being edited
    showSuccessMessage: false,
    successMessage: '',
    // Leads section is collapsed by default for new logs, expanded if editing with existing lead values
    showLeadFieldsExpanded: !!(this.logToEdit && (
      this.logToEdit.aLeads ||
      this.logToEdit.bLeads ||
      this.logToEdit.cLeads ||
      this.logToEdit.dLeads ||
      this.logToEdit.noPotential
    )),
    // Call details section: expanded by default when editing logs with call data
    showCallFieldsExpanded: !!(this.logToEdit && (
      this.logToEdit.outgoing_calls ||
      this.logToEdit.answered_calls
    )),
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
  selectedOrder() {
    if (!this.form.order) return null
    return this.ordersWithCaseName.find(o => o._id === this.form.order) || null
  },
  showLeadFields() {
    // Controlled by toggle button
    return this.showLeadFieldsExpanded
  },
  showInterviewFields() {
    const t = String(this.selectedOrder?.caseType || '').toLowerCase()
    return t.includes('interview')
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
    // Keep numeric response_rate in sync for backend payload even though field is hidden
    responseRateValue(newVal) {
      this.form.response_rate = newVal;
    },
  },
async mounted() {
   await this.fetchAllData();
    console.log('Orders fetched:', this.orders);
    
    // Wait for next tick to ensure computed properties are updated
    await this.$nextTick();
    
    // Check for edit log data in query parameters
    if (this.route.query.editLog) {
      try {
        const logData = JSON.parse(this.route.query.editLog);
        console.log('Editing log:', logData);
        
        // Populate form with log data
        // Handle agent - can be object with _id or just ID string
        const agentId = logData.agent?._id || logData.agent?.id || logData.agent || '';
        this.form.agent = agentId;
        this.form.agentName = logData.agentName || '';
        
        // Wait another tick after setting agent so filteredOrders updates
        await this.$nextTick();
        
        // Find the order by caseName if order ID is not available
        let orderId = logData.order?._id || logData.order?.id || logData.order || '';
        const caseName = logData.caseName || '';
        
        // If we have caseName but no order ID, try to find the order by caseName
        if (!orderId && caseName) {
          console.log('Looking for order with caseName:', caseName);
          console.log('Available orders:', this.ordersWithCaseName);
          const matchingOrder = this.ordersWithCaseName.find(o => {
            // Check if order's caseName matches
            const orderCaseName = o.caseName || '';
            const matches = orderCaseName === caseName || orderCaseName.toLowerCase() === caseName.toLowerCase();
            if (matches) {
              console.log('Matched order:', o);
            }
            return matches;
          });
          if (matchingOrder) {
            orderId = matchingOrder._id;
            console.log('Found order by caseName:', matchingOrder);
          } else {
            console.warn('No matching order found for caseName:', caseName);
          }
        }
        
        this.form.order = orderId;
        this.form.caseName = caseName;
        
        this.form.caseUnit = logData.caseUnit || '';
        this.form.call_time = logData.call_time || 0;
        this.form.completed_calls = logData.completed_calls || 0;
        this.form.outgoing_calls = logData.outgoing_calls || 0;
        this.form.answered_calls = logData.answered_calls || 0;
        this.form.response_rate = logData.response_rate || 0;
        this.form.date = logData.date ? logData.date.substring(0, 10) : new Date().toISOString().substring(0, 10);
        this.form.quantityCompleted = logData.quantityCompleted || 0;
        this.form.comments = logData.comments || '';
        this.form.aLeads = logData.aLeads || 0;
        this.form.bLeads = logData.bLeads || 0;
        this.form.cLeads = logData.cLeads || 0;
        this.form.dLeads = logData.dLeads || 0;
        this.form.noPotential = logData.noPotential || 0;
        this.form.interviews = logData.interviews || 0;
        this.form.hours = logData.hours || 0;
        this.form.bookedInterviews = logData.bookedInterviews || 0;
        this.form.completedInterviews = logData.completedInterviews || 0;
        this.form.resultAnalysis = logData.resultAnalysis || 0;
        
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
                this.showSuccessMessage = true;
                this.successMessage = this.$t('dailyLogForm.logUpdatedSuccessfully') || 'Log updated successfully!';
            } else {
                // Create new log
                await axios.post(`${urls.backEndURL}/dailyLogs`, payload);
                console.log('Log created successfully');
                this.showSuccessMessage = true;
                this.successMessage = this.$t('dailyLogForm.logCreatedSuccessfully') || 'Log created successfully!';
            }

            // Hide success message after 3 seconds
            setTimeout(() => {
                this.showSuccessMessage = false;
                this.successMessage = '';
            }, 3000);

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
                this.form.comments = '';
                this.form.aLeads = 0;
                this.form.bLeads = 0;
                this.form.cLeads = 0;
                this.form.dLeads = 0;
                this.form.noPotential = 0;
                this.form.interviews = 0;
                this.form.hours = 0;
                this.form.bookedInterviews = 0;
                this.form.completedInterviews = 0;
                this.form.resultAnalysis = 0;
                this.originalLogId = null;
                this.showLeadFieldsExpanded = false;
                this.showCallFieldsExpanded = false;
                this.$emit('saved');
        } catch (err) {
            console.error('Failed to save log', err);
            // Hide success message if there was an error
            this.showSuccessMessage = false;
            this.successMessage = '';
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

